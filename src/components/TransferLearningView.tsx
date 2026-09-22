import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  Zap,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Sparkles,
  GitBranch
} from 'lucide-react';
import { ArchitectureId, Language, ModelArchitecture } from '../types';
import { ARCHITECTURES } from '../data/architectures';

interface TransferLearningViewProps {
  language: Language;
  selectedArchitecture: ArchitectureId;
  setSelectedArchitecture: (id: ArchitectureId) => void;
}

export const TransferLearningView: React.FC<TransferLearningViewProps> = ({
  language,
  selectedArchitecture,
  setSelectedArchitecture
}) => {
  const isFr = language === 'fr';

  const [activeStrategy, setActiveStrategy] = useState<'freeze_all' | 'unfreeze_top2' | 'full_finetune'>('unfreeze_top2');
  const [selectedArchDetail, setSelectedArchDetail] = useState<ModelArchitecture>(
    ARCHITECTURES.find((a) => a.id === selectedArchitecture) || ARCHITECTURES[0]
  );

  const handleSelectArch = (arch: ModelArchitecture) => {
    setSelectedArchDetail(arch);
    setSelectedArchitecture(arch.id);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="max-w-3xl">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <GitBranch className="w-4 h-4" />
            <span>{isFr ? 'Apprentissage par Transfert en Imagerie Médicale' : 'Deep Transfer Learning in Medical Imaging'}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isFr
              ? 'Architectures de Réseaux Convolutifs & Vision Transformers'
              : 'Convolutional Architectures & Vision Transformers'}
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            {isFr
              ? 'L’apprentissage par transfert résout le goulet d’étranglement de la rareté des données cliniques annotées en réutilisant les caractéristiques visuelles pré-entraînées sur ImageNet (14M d’images). Découvrez comment DenseNet, ResNet et EfficientNet adaptent leurs représentations hiérarchiques aux pathologies.'
              : 'Transfer learning circumvents the scarcity of expert-annotated clinical datasets by repurposing feature representations pre-trained on ImageNet (14M natural images). Explore how DenseNet, ResNet, and EfficientNet adapt hierarchical visual representations to medical pathologies.'}
          </p>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ARCHITECTURES.map((arch) => {
          const isSelected = selectedArchDetail.id === arch.id;
          return (
            <div
              key={arch.id}
              onClick={() => handleSelectArch(arch)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 shadow-xl shadow-cyan-950/50 ring-1 ring-cyan-400/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <span>{arch.name}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      )}
                    </h3>
                    <span className="text-[11px] text-cyan-400/90 font-mono">
                      {arch.frameworkStandard}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {arch.year}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {isFr ? arch.keyInnovationFr : arch.keyInnovation}
                </p>

                {/* Quick metrics badges */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Params</div>
                    <div className="text-xs font-bold text-white font-mono">{arch.parametersM}M</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">GFLOPs</div>
                    <div className="text-xs font-bold text-cyan-400 font-mono">{arch.gflops}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Latency</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono">{arch.gpuLatencyMs}ms</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 truncate max-w-[190px]">
                  {isFr ? arch.recommendedModalityFr : arch.recommendedModality}
                </span>
                <span className={`font-semibold flex items-center space-x-1 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`}>
                  <span>{isFr ? 'Détails' : 'Explore'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Architecture Details & Interactive Fine-Tuning Strategy Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Selected Model Architectural Anatomy (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                {isFr ? 'Anatomie Structurale' : 'Structural Architecture Anatomy'}
              </span>
              <h2 className="text-xl font-bold text-white">{selectedArchDetail.name}</h2>
            </div>
            <a
              href={selectedArchDetail.paperUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-colors"
            >
              <span>{isFr ? 'Article CVPR / Nature' : 'Original Research Paper'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {isFr ? selectedArchDetail.keyInnovationFr : selectedArchDetail.keyInnovation}
          </p>

          {/* Architectural Schematic Visualizer */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              {isFr ? 'Flux d’Informations et Connexions Intra-Réseau :' : 'Intra-Layer Information Flow Schematic:'}
            </span>

            {selectedArchDetail.id === 'densenet121' && (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg text-cyan-200">
                  <span className="font-bold font-mono">Dense Connectivity Equation: </span>
                  <span className="font-mono text-cyan-300">{'x_l = H_l([x_0, x_1, ..., x_{l-1}])'}</span>
                  <p className="mt-1 text-[11px] text-slate-300">
                    {isFr
                      ? 'Chaque couche concatène directement les cartes d’activation de toutes les couches précédentes via l’axe des canaux, permettant à l’étage de classification final de sonder simultanément les contours primaires et les consolidations avancées.'
                      : 'Each layer concatenates feature maps from all previous layers along the channel axis, allowing the classification head to simultaneously inspect primitive edges and complex consolidations.'}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <span>Input (224x224x3)</span>
                  <span>→</span>
                  <span>DenseBlock 1 (64)</span>
                  <span>→</span>
                  <span>DenseBlock 2 (128)</span>
                  <span>→</span>
                  <span>DenseBlock 3 (256)</span>
                  <span>→</span>
                  <span className="text-cyan-400 font-bold">DenseBlock 4 (1024)</span>
                </div>
              </div>
            )}

            {selectedArchDetail.id === 'resnet50' && (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg text-cyan-200">
                  <span className="font-bold font-mono">Residual Skip Connection: </span>
                  <span className="font-mono text-cyan-300">F(x) + x</span>
                  <p className="mt-1 text-[11px] text-slate-300">
                    {isFr
                      ? 'L’identité de contournement résout le problème de dégradation en apprenant uniquement la fonction résiduelle, ce qui permet à l’erreur de rétropropagation de s’écouler sans atténuation jusqu’aux couches convolutives initiales.'
                      : 'The identity shortcut resolves degradation by learning residual mappings, enabling backpropagation gradients to flow unattenuated back to early convolutional layers.'}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <span>Input (224x224)</span>
                  <span>→</span>
                  <span>Conv1 (7x7)</span>
                  <span>→</span>
                  <span>Layer1 (3 blocks)</span>
                  <span>→</span>
                  <span>Layer2 (4 blocks)</span>
                  <span>→</span>
                  <span>Layer3 (6 blocks)</span>
                  <span>→</span>
                  <span className="text-cyan-400 font-bold">Layer4 (3 blocks)</span>
                </div>
              </div>
            )}

            {selectedArchDetail.id === 'efficientnet_b4' && (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg text-cyan-200">
                  <span className="font-bold font-mono">Compound Scaling: </span>
                  <span className="font-mono text-cyan-300">depth = α^φ, width = β^φ, resolution = γ^φ</span>
                  <p className="mt-1 text-[11px] text-slate-300">
                    {isFr
                      ? 'Équilibrage rigoureux de la profondeur, de la largeur et de la résolution d’entrée (384x384), combiné avec des convolutions MBConv intégrant le mécanisme d’attention de canal Squeeze-and-Excitation.'
                      : 'Rigorous joint scaling of depth, width, and input resolution (384x384), combined with MBConv inverted residual blocks and Squeeze-and-Excitation channel attention.'}
                  </p>
                </div>
              </div>
            )}

            {selectedArchDetail.id === 'vit_b16' && (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg text-cyan-200">
                  <span className="font-bold font-mono">Multi-Head Self Attention: </span>
                  <span className="font-mono text-cyan-300">Softmax(QK^T / √d_k)V</span>
                  <p className="mt-1 text-[11px] text-slate-300">
                    {isFr
                      ? 'L’image médicale est découpée en 196 patchs de 16x16 pixels projetés en tokens de dimension 768. 12 têtes d’attention capturent les corrélations spatiales bilatérales sans biais inductif convolutif local.'
                      : 'The scan is segmented into 196 16x16 patches projected into 768-dim tokens. 12 self-attention heads capture global bilateral correlations without local convolutional bias.'}
                  </p>
                </div>
              </div>
            )}

            {selectedArchDetail.id !== 'densenet121' && selectedArchDetail.id !== 'resnet50' && selectedArchDetail.id !== 'efficientnet_b4' && selectedArchDetail.id !== 'vit_b16' && (
              <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg text-cyan-200 text-xs">
                <span className="font-bold font-mono">{selectedArchDetail.name} Architecture: </span>
                <p className="mt-1 text-[11px] text-slate-300">
                  {isFr ? selectedArchDetail.transferLearningStrategyFr : selectedArchDetail.transferLearningStrategy}
                </p>
              </div>
            )}
          </div>

          {/* Clinical Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-emerald-400 flex items-center space-x-1 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isFr ? 'Atouts en Pratique Médicale' : 'Clinical Strengths'}</span>
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {(isFr ? selectedArchDetail.prosFr : selectedArchDetail.pros).map((pro, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-amber-400 flex items-center space-x-1 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>{isFr ? 'Limites & Contraintes' : 'Constraints & Trade-offs'}</span>
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {(isFr ? selectedArchDetail.consFr : selectedArchDetail.cons).map((con, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right: Interactive Fine-Tuning Strategy Sandbox (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
              {isFr ? 'Stratégie de Transfert' : 'Fine-Tuning Sandbox'}
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {isFr ? 'Configuration du Dégel des Poids' : 'Layer Freezing & Adaptation'}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {isFr
                ? 'Choisissez comment adapter les couches pré-entraînées sur votre jeu de données médical :'
                : 'Select how pre-trained ImageNet weights are adapted to your clinical dataset:'}
            </p>
          </div>

          {/* Strategy Selection Buttons */}
          <div className="space-y-2">
            {[
              {
                id: 'freeze_all' as const,
                titleEn: '1. Feature Extractor (Linear Probe)',
                titleFr: '1. Extracteur de Caractéristiques (Sonde Linéaire)',
                descEn: 'Freeze 100% of backbone layers. Only train the new classification head.',
                descFr: 'Gèle 100 % du backbone. Entraîne uniquement la nouvelle tête de classification.',
                trainablePercent: '~1.5%',
              },
              {
                id: 'unfreeze_top2' as const,
                titleEn: '2. Progressive Unfreezing (Recommended)',
                titleFr: '2. Dégel Progressif des Couches (Recommandé)',
                descEn: 'Freeze early low-level kernels; unfreeze top 2 residual stages + head with lr=1e-4.',
                descFr: 'Gèle les filtres initiaux ; dégèle les 2 derniers blocs résiduels + tête (lr=1e-4).',
                trainablePercent: '~38%',
              },
              {
                id: 'full_finetune' as const,
                titleEn: '3. End-to-End Fine-Tuning',
                titleFr: '3. Entraînement de Bout en Bout',
                descEn: 'Update all weights across the entire network with low learning rate (1e-5).',
                descFr: 'Met à jour tous les poids avec un très faible taux d’apprentissage (1e-5).',
                trainablePercent: '100%',
              },
            ].map((strat) => (
              <button
                key={strat.id}
                onClick={() => setActiveStrategy(strat.id)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                  activeStrategy === strat.id
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">
                    {isFr ? strat.titleFr : strat.titleEn}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {strat.trainablePercent} trainable
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                  {isFr ? strat.descFr : strat.descEn}
                </p>
              </button>
            ))}
          </div>

          {/* Interactive Weight Freezing Visualizer Diagram */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              {isFr ? 'Statut des Tenseurs en Mémoire VRAM :' : 'Tensor Gradient Tracking in VRAM:'}
            </span>

            <div className="space-y-1.5">
              {/* Early Layers */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 text-xs border border-slate-800">
                <div className="flex items-center space-x-2">
                  {activeStrategy === 'full_finetune' ? (
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span className="text-slate-300">
                    {isFr ? 'Couches 1-2 : Filtres de Gabor & Bords' : 'Layers 1-2: Primitive Kernels & Edges'}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    activeStrategy === 'full_finetune'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {activeStrategy === 'full_finetune' ? 'requires_grad=True' : 'FROZEN'}
                </span>
              </div>

              {/* Intermediate Layers */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 text-xs border border-slate-800">
                <div className="flex items-center space-x-2">
                  {activeStrategy === 'freeze_all' ? (
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="text-slate-300">
                    {isFr ? 'Blocs 3-4 : Textures & Marges Pathologiques' : 'Blocks 3-4: Texture & Pathology Margins'}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    activeStrategy === 'freeze_all'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {activeStrategy === 'freeze_all' ? 'FROZEN' : 'requires_grad=True'}
                </span>
              </div>

              {/* Final Classification Head */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 text-xs border border-slate-800">
                <div className="flex items-center space-x-2">
                  <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-300 font-semibold">
                    {isFr ? 'Tête Clinique : Linear(num_classes=4)' : 'Head: Linear(num_classes=4)'}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-cyan-500/20 text-cyan-300">
                  requires_grad=True
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
