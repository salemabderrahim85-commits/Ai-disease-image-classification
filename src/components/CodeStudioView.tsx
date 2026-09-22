import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  Cpu,
  Sparkles
} from 'lucide-react';
import { ArchitectureId, Language, TrainingHyperparameters } from '../types';
import {
  generateGradCamPythonCode,
  generatePyTorchCode,
  generateRequirementsTxt,
  generateTensorFlowCode
} from '../utils/codeGenerators';

interface CodeStudioViewProps {
  language: Language;
  selectedArchitecture: ArchitectureId;
  setSelectedArchitecture: (arch: ArchitectureId) => void;
}

export const CodeStudioView: React.FC<CodeStudioViewProps> = ({
  language,
  selectedArchitecture,
  setSelectedArchitecture
}) => {
  const isFr = language === 'fr';

  const [activeTab, setActiveTab] = useState<'pytorch' | 'tensorflow' | 'gradcam' | 'requirements'>('pytorch');
  const [copied, setCopied] = useState(false);

  const defaultHyperparams: TrainingHyperparameters = {
    architecture: selectedArchitecture,
    datasetId: 'nih-chestxray14',
    learningRate: 0.0002,
    batchSize: 32,
    epochs: 20,
    optimizer: 'adamw',
    scheduler: 'cosine',
    lossFunction: 'focal_loss',
    freezeBackboneStages: 'unfreeze_top2',
    useClahe: true,
    useMixup: true,
    useColorJitter: true,
    useRandomAffine: true,
    mixedPrecision: true,
  };

  const getCodeContent = () => {
    switch (activeTab) {
      case 'pytorch':
        return generatePyTorchCode(defaultHyperparams);
      case 'tensorflow':
        return generateTensorFlowCode(defaultHyperparams);
      case 'gradcam':
        return generateGradCamPythonCode();
      case 'requirements':
        return generateRequirementsTxt();
    }
  };

  const currentCode = getCodeContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const filename =
      activeTab === 'pytorch'
        ? 'train_pytorch.py'
        : activeTab === 'tensorflow'
        ? 'train_tensorflow.py'
        : activeTab === 'gradcam'
        ? 'gradcam_pytorch.py'
        : 'requirements.txt';

    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="max-w-3xl">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <Code2 className="w-4 h-4" />
            <span>{isFr ? 'Scripts Python PyTorch & TensorFlow' : 'Production Python Code Studio'}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isFr
              ? 'Pipelines d’Entraînement Python Prêts à l’Emploi'
              : 'Production-Ready Python Deep Learning Pipelines'}
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            {isFr
              ? 'Générez du code Python 100% exécutable et modulaire pour PyTorch 2.x et TensorFlow / Keras. Inclut la gestion du déséquilibre de classe (Focal Loss), l’accélération matérielle AMP (FP16), le recuit cosinus et l’implémentation complète des hooks Grad-CAM.'
              : 'Generate 100% executable and idiomatic Python scripts for PyTorch 2.x and TensorFlow / Keras. Incorporates clinical class imbalance mitigation (Focal Loss), mixed precision training (AMP FP16), Cosine Annealing, and complete Grad-CAM hook routines.'}
          </p>
        </div>
      </div>

      {/* Code Studio Editor Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Editor Toolbar */}
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* File Switcher Tabs */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('pytorch')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'pytorch'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>train_pytorch.py</span>
            </button>

            <button
              onClick={() => setActiveTab('tensorflow')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tensorflow'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>train_tensorflow.py</span>
            </button>

            <button
              onClick={() => setActiveTab('gradcam')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'gradcam'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>gradcam_pytorch.py</span>
            </button>

            <button
              onClick={() => setActiveTab('requirements')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'requirements'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>requirements.txt</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">{isFr ? 'Copié !' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isFr ? 'Copier le Code' : 'Copy Code'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isFr ? 'Télécharger (.py)' : 'Download Script'}</span>
            </button>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="p-5 bg-slate-950 overflow-x-auto max-h-[640px] scrollbar-thin scrollbar-thumb-slate-800">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed select-text">
            <code>{currentCode}</code>
          </pre>
        </div>

        {/* Colab Quick Launch Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-mono">
              pip install -r requirements.txt &amp;&amp; python train_pytorch.py
            </span>
          </div>
          <span className="text-slate-500">
            {isFr ? 'Compatible Google Colab, Kaggle GPU & Serveurs Slurm' : 'Compatible with Google Colab, Kaggle GPU & Slurm clusters'}
          </span>
        </div>
      </div>
    </div>
  );
};
