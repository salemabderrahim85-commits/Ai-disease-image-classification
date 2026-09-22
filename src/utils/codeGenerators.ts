import { ArchitectureId, TrainingHyperparameters } from '../types';

export function generatePyTorchCode(params: TrainingHyperparameters): string {
  const modelNameMap: Record<ArchitectureId, { importCode: string; modelCall: string; headReplace: string; targetGradCamLayer: string }> = {
    densenet121: {
      importCode: 'from torchvision.models import densenet121, DenseNet121_Weights',
      modelCall: 'model = densenet121(weights=DenseNet121_Weights.DEFAULT)',
      headReplace: 'in_features = model.classifier.in_features\nmodel.classifier = nn.Sequential(\n    nn.Dropout(0.3),\n    nn.Linear(in_features, num_classes)\n)',
      targetGradCamLayer: 'model.features.denseblock4.denselayer16.conv2'
    },
    resnet50: {
      importCode: 'from torchvision.models import resnet50, ResNet50_Weights',
      modelCall: 'model = resnet50(weights=ResNet50_Weights.DEFAULT)',
      headReplace: 'in_features = model.fc.in_features\nmodel.fc = nn.Sequential(\n    nn.Dropout(0.3),\n    nn.Linear(in_features, num_classes)\n)',
      targetGradCamLayer: 'model.layer4[2].conv3'
    },
    efficientnet_b4: {
      importCode: 'from torchvision.models import efficientnet_b4, EfficientNet_B4_Weights',
      modelCall: 'model = efficientnet_b4(weights=EfficientNet_B4_Weights.DEFAULT)',
      headReplace: 'in_features = model.classifier[1].in_features\nmodel.classifier = nn.Sequential(\n    nn.Dropout(0.4),\n    nn.Linear(in_features, num_classes)\n)',
      targetGradCamLayer: 'model.features[8][0]'
    },
    vit_b16: {
      importCode: 'from torchvision.models import vit_b_16, ViT_B_16_Weights',
      modelCall: 'model = vit_b_16(weights=ViT_B_16_Weights.DEFAULT)',
      headReplace: 'in_features = model.heads.head.in_features\nmodel.heads.head = nn.Linear(in_features, num_classes)',
      targetGradCamLayer: 'model.encoder.layers.encoder_layer_11.ln_1'
    },
    convnext_tiny: {
      importCode: 'from torchvision.models import convnext_tiny, ConvNeXt_Tiny_Weights',
      modelCall: 'model = convnext_tiny(weights=ConvNeXt_Tiny_Weights.DEFAULT)',
      headReplace: 'in_features = model.classifier[2].in_features\nmodel.classifier[2] = nn.Linear(in_features, num_classes)',
      targetGradCamLayer: 'model.features[7][2].block[0]'
    },
    mobilenet_v3: {
      importCode: 'from torchvision.models import mobilenet_v3_large, MobileNet_V3_Large_Weights',
      modelCall: 'model = mobilenet_v3_large(weights=MobileNet_V3_Large_Weights.DEFAULT)',
      headReplace: 'in_features = model.classifier[3].in_features\nmodel.classifier[3] = nn.Linear(in_features, num_classes)',
      targetGradCamLayer: 'model.features[16][0]'
    }
  };

  const archConfig = modelNameMap[params.architecture] || modelNameMap.densenet121;

  const freezeCode = params.freezeBackboneStages === 'freeze_all'
    ? `# 1. Freeze all backbone parameters for feature-extraction
for param in model.parameters():
    param.requiresKeep = False
    param.requires_grad = False
# Enable gradients only on new classification head
for param in model.classifier.parameters() if hasattr(model, 'classifier') else model.fc.parameters():
    param.requires_grad = True`
    : params.freezeBackboneStages === 'unfreeze_top2'
    ? `# 2. Progressive Fine-Tuning: Freeze early layers, unfreeze final stages
for param in model.parameters():
    param.requires_grad = False
# Unfreeze top feature block & classifier
if hasattr(model, 'layer4'): # ResNet
    for param in model.layer4.parameters():
        param.requires_grad = True
elif hasattr(model, 'features'): # DenseNet / EfficientNet
    for param in model.features[-4:].parameters():
        param.requires_grad = True
for param in (model.classifier.parameters() if hasattr(model, 'classifier') else model.fc.parameters()):
    param.requires_grad = True`
    : `# 3. End-to-End Fine-Tuning with full parameter backpropagation
for param in model.parameters():
    param.requires_grad = True`;

  const optimizerCode = params.optimizer === 'adamw'
    ? `optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=${params.learningRate}, weight_decay=1e-2)`
    : params.optimizer === 'sgd_momentum'
    ? `optimizer = torch.optim.SGD(filter(lambda p: p.requires_grad, model.parameters()), lr=${params.learningRate}, momentum=0.9, weight_decay=1e-4, nesterov=True)`
    : `optimizer = torch.optim.RMSprop(filter(lambda p: p.requires_grad, model.parameters()), lr=${params.learningRate}, alpha=0.9)`;

  const lossCode = params.lossFunction === 'focal_loss'
    ? `# Focal Loss to handle severe clinical class imbalance (Lin et al.)
class FocalLoss(nn.Module):
    def __init__(self, alpha=0.25, gamma=2.0):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
    def forward(self, inputs, targets):
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')
        pt = torch.exp(-ce_loss)
        focal_loss = self.alpha * (1 - pt)**self.gamma * ce_loss
        return focal_loss.mean()

criterion = FocalLoss(gamma=2.0)`
    : params.lossFunction === 'weighted_ce'
    ? `# Class-weighted Cross-Entropy to counteract prevalence skew
class_weights = torch.tensor([1.0, 2.5, 4.0, 3.2]).to(device)
criterion = nn.CrossEntropyLoss(weight=class_weights)`
    : `criterion = nn.CrossEntropyLoss()`;

  return `"""
=============================================================================
MedVision AI - Medical Disease Image Classification Pipeline (PyTorch 2.x)
Architecture: ${params.architecture.toUpperCase()}
Dataset: ${params.datasetId}
Transfer Learning Strategy: ${params.freezeBackboneStages}
Mixed Precision Training: ${params.mixedPrecision}
=============================================================================
"""

import os
import time
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
${archConfig.importCode}
from sklearn.metrics import roc_auc_score, f1_score, classification_report, confusion_matrix
from PIL import Image

# 1. Device Configuration & Reproducibility
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
torch.manual_seed(42)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(42)
    torch.backends.cudnn.benchmark = True
print(f"[MedVision] Active Computing Device: {device}")

# 2. Medical Data Augmentation & Normalization (CLAHE & Transforms)
img_size = 224
train_transforms = transforms.Compose([
    transforms.Resize((img_size, img_size)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=15),
    transforms.ColorJitter(brightness=0.15, contrast=0.2),
    transforms.ToTensor(),
    # ImageNet Standard Normalization
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

val_transforms = transforms.Compose([
    transforms.Resize((img_size, img_size)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# 3. Custom Medical Dataset Loader
class MedicalImageDataset(Dataset):
    def __init__(self, image_paths, labels, transform=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        image = Image.open(img_path).convert('RGB')
        if self.transform:
            image = self.transform(image)
        label = torch.tensor(self.labels[idx], dtype=torch.long)
        return image, label

# 4. Transfer Learning Model Instantiation
def build_clinical_model(num_classes=4):
    ${archConfig.modelCall}
    ${archConfig.headReplace}
    return model

num_classes = 4 # Adjust to match dataset target categories
model = build_clinical_model(num_classes=num_classes)

${freezeCode}

model = model.to(device)

# 5. Loss Function, Optimizer & Learning Rate Scheduler
${lossCode}
${optimizerCode}
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=${params.epochs}, eta_min=1e-6)

# Automatic Mixed Precision (AMP) Scaler for accelerated tensor core throughput
scaler = torch.amp.GradScaler('cuda', enabled=${params.mixedPrecision} and torch.cuda.is_available())

# 6. Training & Validation Loop
def train_epoch(model, loader, criterion, optimizer, scaler):
    model.train()
    running_loss, correct, total = 0.0, 0, 0
    for images, targets in loader:
        images, targets = images.to(device), targets.to(device)
        optimizer.zero_grad(set_to_none=True)

        with torch.amp.autocast('cuda', enabled=scaler.is_enabled()):
            outputs = model(images)
            loss = criterion(outputs, targets)

        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == targets).sum().item()
        total += targets.size(0)

    return running_loss / total, correct / total

def validate_epoch(model, loader, criterion):
    model.eval()
    running_loss, correct, total = 0.0, 0, 0
    all_preds, all_probs, all_targets = [], [], []

    with torch.no_grad():
        for images, targets in loader:
            images, targets = images.to(device), targets.to(device)
            with torch.amp.autocast('cuda', enabled=scaler.is_enabled()):
                outputs = model(images)
                loss = criterion(outputs, targets)

            probs = F.softmax(outputs, dim=1)
            _, preds = torch.max(outputs, 1)

            running_loss += loss.item() * images.size(0)
            correct += (preds == targets).sum().item()
            total += targets.size(0)

            all_preds.extend(preds.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())
            all_targets.extend(targets.cpu().numpy())

    val_acc = correct / total
    val_loss = running_loss / total
    return val_loss, val_acc, np.array(all_targets), np.array(all_preds), np.array(all_probs)

print("[MedVision] Initialized training pipeline. Run model training...")
# Run for epoch in range(${params.epochs}): ...
`;
}

export function generateTensorFlowCode(params: TrainingHyperparameters): string {
  const tfAppMap: Record<ArchitectureId, { module: string; func: string; preprocess: string }> = {
    densenet121: { module: 'tf.keras.applications.densenet', func: 'DenseNet121', preprocess: 'preprocess_input' },
    resnet50: { module: 'tf.keras.applications.resnet_v2', func: 'ResNet50V2', preprocess: 'preprocess_input' },
    efficientnet_b4: { module: 'tf.keras.applications.efficientnet', func: 'EfficientNetB4', preprocess: 'preprocess_input' },
    vit_b16: { module: 'tf.keras.applications.convnext', func: 'ConvNeXtTiny', preprocess: 'preprocess_input' },
    convnext_tiny: { module: 'tf.keras.applications.convnext', func: 'ConvNeXtTiny', preprocess: 'preprocess_input' },
    mobilenet_v3: { module: 'tf.keras.applications.mobilenet_v3', func: 'MobileNetV3Large', preprocess: 'preprocess_input' },
  };

  const arch = tfAppMap[params.architecture] || tfAppMap.densenet121;

  return `"""
=============================================================================
MedVision AI - Medical Disease Image Classification (TensorFlow / Keras 2.x)
Architecture: ${params.architecture.toUpperCase()} (${arch.func})
Dataset: ${params.datasetId}
=============================================================================
"""

import os
import tensorflow as tf
from ${arch.module} import ${arch.func}, ${arch.preprocess}
from tensorflow.keras import layers, models, optimizers, callbacks
import numpy as np

# 1. GPU Acceleration & Mixed Precision
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        if ${params.mixedPrecision}:
            tf.keras.mixed_precision.set_global_policy('mixed_float16')
            print("[MedVision] Enabled mixed_float16 acceleration")
    except RuntimeError as e:
        print(e)

# 2. Input Dimensions & Hyperparameters
IMG_SIZE = (224, 224)
BATCH_SIZE = ${params.batchSize}
EPOCHS = ${params.epochs}
NUM_CLASSES = 4

# 3. Medical Data Augmentation Pipeline
data_augmentation = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.08),
    layers.RandomZoom(0.1),
    layers.RandomContrast(0.15),
], name="medical_augmentation")

# 4. Transfer Learning Model Construction
def create_medical_classifier():
    inputs = layers.Input(shape=(IMG_SIZE[0], IMG_SIZE[1], 3), name="input_image")
    x = data_augmentation(inputs)
    x = ${arch.preprocess}(x)

    # Pre-trained ImageNet backbone
    base_model = ${arch.func}(
        include_top=False,
        weights="imagenet",
        input_tensor=x,
        pooling="avg"
    )

    ${params.freezeBackboneStages === 'freeze_all'
      ? '# Freeze all layers in backbone\n    base_model.trainable = False'
      : params.freezeBackboneStages === 'unfreeze_top2'
      ? '# Unfreeze top 20 layers for fine-tuning\n    base_model.trainable = True\n    for layer in base_model.layers[:-20]:\n        layer.trainable = False'
      : '# Full End-to-end training\n    base_model.trainable = True'
    }

    # Clinical Classification Head
    x = layers.BatchNormalization()(base_model.output)
    x = layers.Dropout(0.35)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(NUM_CLASSES, activation="softmax", dtype="float32", name="predictions")(x)

    model = models.Model(inputs=inputs, outputs=outputs, name="MedVision_${arch.func}")
    return model

model = create_medical_classifier()
model.summary()

# 5. Loss & Metrics
optimizer = optimizers.Adam(learning_rate=${params.learningRate})
loss_fn = tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.05)

model.compile(
    optimizer=optimizer,
    loss=loss_fn,
    metrics=[
        'accuracy',
        tf.keras.metrics.AUC(name='roc_auc'),
        tf.keras.metrics.Precision(name='precision'),
        tf.keras.metrics.Recall(name='recall')
    ]
)

# 6. Production Callbacks
training_callbacks = [
    callbacks.ModelCheckpoint(
        filepath="best_medvision_checkpoint.keras",
        monitor="val_roc_auc",
        mode="max",
        save_best_only=True,
        verbose=1
    ),
    callbacks.EarlyStopping(
        monitor="val_loss",
        patience=8,
        restore_best_weights=True,
        verbose=1
    ),
    callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.2,
        patience=3,
        min_lr=1e-7,
        verbose=1
    ),
    callbacks.TensorBoard(log_dir="./logs_medvision")
]

print("[MedVision] TensorFlow transfer learning model assembled successfully.")
`;
}

export function generateGradCamPythonCode(): string {
  return `"""
=============================================================================
MedVision AI - PyTorch Grad-CAM (Gradient-weighted Class Activation Mapping)
Explainable AI (XAI) for Medical Diagnosis Validation
Reference: Selvaraju et al., ICCV 2017
=============================================================================
"""

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms

class MedicalGradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self.hook_handles = []
        self._register_hooks()

    def _register_hooks(self):
        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0]

        def forward_hook(module, input, output):
            self.activations = output

        self.hook_handles.append(self.target_layer.register_forward_hook(forward_hook))
        self.hook_handles.append(self.target_layer.register_full_backward_hook(backward_hook))

    def generate_heatmap(self, input_tensor, target_class=None):
        self.model.eval()
        output = self.model(input_tensor)

        if target_class is None:
            target_class = torch.argmax(output, dim=1).item()

        # Zero gradients and backpropagate target class score
        self.model.zero_grad()
        target_score = output[0, target_class]
        target_score.backward(retain_graph=True)

        # Global average pooling of gradients
        # Shape: (Channels, Height, Width)
        gradients = self.gradients[0].cpu().data.numpy()
        activations = self.activations[0].cpu().data.numpy()

        weights = np.mean(gradients, axis=(1, 2)) # Shape: (Channels,)

        # Linear combination of weighted activation maps
        cam = np.zeros(activations.shape[1:], dtype=np.float32)
        for i, w in enumerate(weights):
            cam += w * activations[i]

        # ReLU to keep features that positively contribute to target disease class
        cam = np.maximum(cam, 0)
        # Normalize between 0 and 1
        cam = (cam - np.min(cam)) / (np.max(cam) - np.min(cam) + 1e-8)
        return cam

    def overlay_on_image(self, original_pil_img, heatmap, colormap=cv2.COLORMAP_JET, alpha=0.45):
        w, h = original_pil_img.size
        heatmap_resized = cv2.resize(heatmap, (w, h))
        heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap_resized), colormap)
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

        img_np = np.array(original_pil_img)
        blended = np.uint8(alpha * heatmap_colored + (1 - alpha) * img_np)
        return blended, heatmap_resized

    def remove_hooks(self):
        for handle in self.hook_handles:
            handle.remove()

print("[MedVision] Grad-CAM module ready. Hook to convolutional layer to inspect diagnostic focus.")
`;
}

export function generateRequirementsTxt(): string {
  return `# MedVision AI - Medical Disease Image Classification Requirements
torch>=2.2.0
torchvision>=0.17.0
tensorflow>=2.15.0
opencv-python-headless>=4.9.0
albumentations>=1.4.0
scikit-learn>=1.4.0
scipy>=1.12.0
pandas>=2.2.0
numpy>=1.26.0
Pillow>=10.2.0
matplotlib>=3.8.0
seaborn>=0.13.0
tqdm>=4.66.0
pydicom>=2.4.4
`;
}
