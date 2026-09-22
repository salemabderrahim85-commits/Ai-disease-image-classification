import { ModelArchitecture } from '../types';

export const ARCHITECTURES: ModelArchitecture[] = [
  {
    id: 'densenet121',
    name: 'DenseNet-121',
    frameworkStandard: 'CheXNet Standard / Medical CVPR Benchmark',
    year: 2017,
    parametersM: 7.98,
    gflops: 5.7,
    top1Accuracy: 75.0,
    gpuLatencyMs: 8.2,
    recommendedModality: 'Chest X-Ray, Bone Radiographs, Multi-label Screening',
    recommendedModalityFr: 'Radiographie Thoracique, Osseuse, Dépistage Multilabel',
    keyInnovation: 'Dense connectivity where each layer receives direct feature-maps from all preceding layers. Encourages feature reuse and mitigates vanishing gradients.',
    keyInnovationFr: 'Connexion dense où chaque couche reçoit les cartes de caractéristiques de toutes les couches antérieures. Réutilisation maximale des features.',
    transferLearningStrategy: 'Replace classifier 1024 -> num_classes. Unfreeze denseblock4 and train with lr=1e-4, keeping early denseblocks frozen.',
    transferLearningStrategyFr: 'Remplacer la tête 1024 -> num_classes. Dégeler denseblock4 avec lr=1e-4 tout en gelant les blocs initiaux.',
    paperTitle: 'Densely Connected Convolutional Networks (Huang et al., CVPR 2017)',
    paperUrl: 'https://arxiv.org/abs/1608.06993',
    pros: [
      'Gold standard in CheXNet (Rajpurkar et al., Stanford) for chest radiograph classification',
      'Compact parameter footprint (~8M parameters) prevents severe overfitting on small datasets',
      'Smooth gradient propagation across all depths'
    ],
    prosFr: [
      'Standard mondial CheXNet (Stanford) pour les radiographies pulmonaires',
      'Empreinte mémoire légère (~8M params) évitant le surapprentissage',
      'Propagation de gradient optimale à travers les couches'
    ],
    cons: [
      'Higher GPU RAM memory consumption during backward pass due to concatenated feature maps',
      'Slower training throughput compared to standard ResNet'
    ],
    consFr: [
      'Consommation VRAM élevée lors de la rétropropagation (concaténations)',
      'Vitesse d entraînement légèrement inférieure à ResNet'
    ]
  },
  {
    id: 'resnet50',
    name: 'ResNet-50 v2',
    frameworkStandard: 'Deep Residual Learning / Industry Default',
    year: 2016,
    parametersM: 25.56,
    gflops: 8.2,
    top1Accuracy: 76.5,
    gpuLatencyMs: 6.4,
    recommendedModality: 'Dermoscopy (ISIC), Histopathology (PCam), CT Slices',
    recommendedModalityFr: 'Dermoscopie (ISIC), Histopathologie (PCam), Coupes TDM',
    keyInnovation: 'Identity skip-connections (shortcut connections) skipping 2-3 layers to solve the degradation problem in deep neural networks.',
    keyInnovationFr: 'Connexions résiduelles directes permettant d entraîner des réseaux très profonds sans évanouissement de gradient.',
    transferLearningStrategy: 'Stage 1: Freeze layer1-layer3, train fc head. Stage 2: Fine-tune layer4 with 1e-4 lr and cosine annealing.',
    transferLearningStrategyFr: 'Étape 1 : Geler layer1-layer3, entraîner la tête. Étape 2 : Dégeler layer4 avec lr=1e-4 et recuit cosinus.',
    paperTitle: 'Deep Residual Learning for Image Recognition (He et al., CVPR 2016)',
    paperUrl: 'https://arxiv.org/abs/1512.03385',
    pros: [
      'Extremely stable convergence and robust performance across all medical benchmarks',
      'Native Grad-CAM hook integration with high visual fidelity on layer4',
      'Supported out-of-the-box by every clinical edge deployment pipeline (TensorRT, OpenVINO)'
    ],
    prosFr: [
      'Convergence ultra-stable et robustesse éprouvée sur tous les jeux de données cliniques',
      'Grad-CAM natif très précis sur la couche layer4',
      'Prise en charge universelle sur matériels médicaux (TensorRT, OpenVINO)'
    ],
    cons: [
      'Larger model size than DenseNet-121 and MobileNet',
      'Lower parameter efficiency than compound-scaled EfficientNet'
    ],
    consFr: [
      'Taille supérieure à DenseNet-121',
      'Efficacité paramétrique inférieure à EfficientNet'
    ]
  },
  {
    id: 'efficientnet_b4',
    name: 'EfficientNet-B4',
    frameworkStandard: 'Compound Scaling (Depth + Width + Resolution)',
    year: 2019,
    parametersM: 19.34,
    gflops: 8.8,
    top1Accuracy: 82.9,
    gpuLatencyMs: 12.1,
    recommendedModality: 'Diabetic Retinopathy (Messidor), Brain MRI (BraTS), Fine-grained Lesions',
    recommendedModalityFr: 'Rétinopathie Diabétique, IRM Cérébrale, Lésions Fines',
    keyInnovation: 'Principled compound scaling method that uniformly scales network depth, width, and resolution with fixed scaling coefficients.',
    keyInnovationFr: 'Mise à l échelle conjointe et harmonieuse de la profondeur, de la largeur et de la résolution d image.',
    transferLearningStrategy: 'Train at 384x384 input resolution. Use Stochastic Depth (drop connect = 0.3) and AdamW optimizer with weight decay 1e-2.',
    transferLearningStrategyFr: 'Entraînement en résolution 384x384. Utiliser la Stochastic Depth et l optimiseur AdamW.',
    paperTitle: 'EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks (Tan & Le, ICML 2019)',
    paperUrl: 'https://arxiv.org/abs/1905.11946',
    pros: [
      'Highest accuracy-to-FLOPs ratio in medical imaging literature',
      'Superior performance on subtle micro-lesions (retinal microaneurysms, lung nodules)',
      'Built-in Squeeze-and-Excitation (SE) channel attention'
    ],
    prosFr: [
      'Meilleur ratio précision / coût de calcul en imagerie médicale',
      'Excellente sensibilité sur les micro-lésions subtiles (microanévrismes, nodules)',
      'Modules d attention de canal Squeeze-and-Excitation intégrés'
    ],
    cons: [
      'Demands higher input resolutions (384x384) which increases VRAM usage on large batches',
      'Depthwise separable convolutions can be slower on older GPUs lacking specialized tensor cores'
    ],
    consFr: [
      'Nécessite des résolutions d entrée plus élevées (384x384)',
      'Convolutions séparables en profondeur plus lentes sur GPU anciens'
    ]
  },
  {
    id: 'vit_b16',
    name: 'Vision Transformer (ViT-B/16)',
    frameworkStandard: 'Self-Attention / Patch Tokens',
    year: 2021,
    parametersM: 86.57,
    gflops: 33.8,
    top1Accuracy: 84.2,
    gpuLatencyMs: 18.5,
    recommendedModality: 'Histopathology Whole-Slide, Multi-organ Global Context',
    recommendedModalityFr: 'Histopathologie Grand Champ, Contexte Global Multi-Organes',
    keyInnovation: 'Treats 16x16 image patches as sequence tokens and processes them with pure multi-head self-attention, discarding convolutional inductive bias.',
    keyInnovationFr: 'Traite l image comme des patchs 16x16 projetés en tokens avec mécanisme de self-attention globale sans convolution.',
    transferLearningStrategy: 'Requires pre-trained ImageNet-21k weights. Fine-tune with Layer-wise LR Decay (LLRD) and heavy MixUp/CutMix data augmentation.',
    transferLearningStrategyFr: 'Poids pré-entraînés ImageNet-21k indispensables. Dégel avec dégradation progressive du LR et MixUp.',
    paperTitle: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale (Dosovitskiy et al., ICLR 2021)',
    paperUrl: 'https://arxiv.org/abs/2010.11929',
    pros: [
      'Global receptive field from the very first layer captures long-range anatomical relationships',
      'Attention rollout maps offer intuitive interpretability of multi-focal pathologies',
      'State-of-the-art on large multi-institutional digital pathology cohorts'
    ],
    prosFr: [
      'Champ récepteur global dès la première couche capturant les relations anatomiques distantes',
      'Cartes d attention (Rollout) expliquant les pathologies multifocales',
      'État de l art sur les grandes cohortes d histopathologie numérisée'
    ],
    cons: [
      'Heavy parameter footprint (~86M parameters) prone to overfitting on small patient cohorts (<1,000 cases)',
      'Attention visualization requires specialized attention rollout instead of standard Grad-CAM'
    ],
    consFr: [
      'Empreinte lourde (~86M params), fort risque de surapprentissage sur petites séries cliniques',
      'Visualisation nécessitant des outils spécifiques d attention rollout'
    ]
  },
  {
    id: 'convnext_tiny',
    name: 'ConvNeXt-Tiny',
    frameworkStandard: 'Modernized Pure CNN Architecture',
    year: 2022,
    parametersM: 28.59,
    gflops: 9.0,
    top1Accuracy: 82.1,
    gpuLatencyMs: 7.1,
    recommendedModality: 'Skin Cancer Triage, Portable Ultrasound, Chest Radiography',
    recommendedModalityFr: 'Triage Cancers Cutanés, Échographie Portable, Radiographie',
    keyInnovation: 'Re-engineers classical ResNet using modern Vision Transformer design choices (7x7 depthwise kernels, inverted bottleneck, GELU, LayerNorm instead of BatchNorm).',
    keyInnovationFr: 'Modernise le CNN classique en intégrant les principes des Transformers (filtres 7x7, goulot inversé, GELU, LayerNorm).',
    transferLearningStrategy: 'Fine-tune with AdamW (weight_decay=0.05) and drop_path_rate=0.2. Extremely responsive to standard transfer learning.',
    transferLearningStrategyFr: 'Ajuster avec AdamW (weight_decay=0.05) et drop_path=0.2. Très performant en transfert simple.',
    paperTitle: 'A ConvNet for the 2020s (Liu et al., CVPR 2022)',
    paperUrl: 'https://arxiv.org/abs/2201.03545',
    pros: [
      'Maintains CNN simplicity and fast inference while matching Swin-Transformer accuracy',
      'No quadratic attention memory bottleneck',
      'Compatible with standard Grad-CAM and convolutional feature pruning'
    ],
    prosFr: [
      'Simplicité d un CNN tout en égalant la précision des Vision Transformers',
      'Pas d explosion quadratique de mémoire VRAM',
      'Parfaitement compatible avec Grad-CAM classique'
    ],
    cons: [
      'Newer model; fewer legacy clinical deployment SDKs compared to ResNet-50'
    ],
    consFr: [
      'Architecture plus récente ; moins de recul réglementaire que ResNet-50'
    ]
  },
  {
    id: 'mobilenet_v3',
    name: 'MobileNetV3-Large',
    frameworkStandard: 'Edge & Mobile Medical AI (Point-of-Care Ultrasound / Tablets)',
    year: 2019,
    parametersM: 5.48,
    gflops: 0.44,
    top1Accuracy: 75.2,
    gpuLatencyMs: 2.1,
    recommendedModality: 'Point-of-Care Ultrasound (POCUS), Handheld Dermatoscope, Field Clinics',
    recommendedModalityFr: 'Échographie au Lit du Malade (POCUS), Dermatoscope Portatif, Télémédecine',
    keyInnovation: 'Hardware-aware Neural Architecture Search (NAS) combined with NetAdapt algorithm, Hard-Swish activations, and lightweight Squeeze-and-Excitation.',
    keyInnovationFr: 'Optimisé par recherche d architecture neuronale (NAS) pour processeurs mobiles, activation Hard-Swish et SE ultraléger.',
    transferLearningStrategy: 'Quantization-Aware Training (QAT) to INT8 format for instant <5ms inference on iOS CoreML and Android NNAPI.',
    transferLearningStrategyFr: 'Entraînement avec quantification INT8 (QAT) pour inférence <5ms sur tablettes et smartphones.',
    paperTitle: 'Searching for MobileNetV3 (Howard et al., ICCV 2019)',
    paperUrl: 'https://arxiv.org/abs/1905.02244',
    pros: [
      'Ultra-lightweight (<6M params, 0.4 GFLOPs)',
      'Sub-5ms inference on standard CPUs and mobile hardware',
      'Ideal for bedside clinical triage and resource-limited community clinics'
    ],
    prosFr: [
      'Poids plume (<6M params, 0.44 GFLOPs)',
      'Inférence instantanée en moins de 5ms sur CPU standard',
      'Idéal pour la télémédecine et les dispositifs d urgence de terrain'
    ],
    cons: [
      'Slight degradation on subtle radiologic opacities compared to DenseNet-121'
    ],
    consFr: [
      'Sensibilité légèrement en retrait sur les anomalies radiologiques très ténues'
    ]
  }
];
