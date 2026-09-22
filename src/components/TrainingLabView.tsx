import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  RotateCcw,
  Sliders,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Award
} from 'lucide-react';
import {
  ArchitectureId,
  ConfusionMatrixData,
  EpochMetric,
  Language,
  TrainingHyperparameters
} from '../types';
import { ARCHITECTURES } from '../data/architectures';
import { PUBLIC_DATASETS } from '../data/medicalDatasets';

interface TrainingLabViewProps {
  language: Language;
  selectedArchitecture: ArchitectureId;
  setSelectedArchitecture: (id: ArchitectureId) => void;
  onExportCode?: (params: TrainingHyperparameters) => void;
}

export const TrainingLabView: React.FC<TrainingLabViewProps> = ({
  language,
  selectedArchitecture,
  setSelectedArchitecture,
  onExportCode
}) => {
  const isFr = language === 'fr';

  // Hyperparameters
  const [params, setParams] = useState<TrainingHyperparameters>({
    architecture: selectedArchitecture,
    datasetId: 'nih-chestxray14',
    learningRate: 0.0002,
    batchSize: 32,
    epochs: 15,
    optimizer: 'adamw',
    scheduler: 'cosine',
    lossFunction: 'focal_loss',
    freezeBackboneStages: 'unfreeze_top2',
    useClahe: true,
    useMixup: true,
    useColorJitter: true,
    useRandomAffine: true,
    mixedPrecision: true,
  });

  // Training Simulation State
  const [isTraining, setIsTraining] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [metricsHistory, setMetricsHistory] = useState<EpochMetric[]>([]);
  const [confusionMatrix, setConfusionMatrix] = useState<ConfusionMatrixData | null>(null);

  // Sync prop changes
  useEffect(() => {
    setParams((p) => ({ ...p, architecture: selectedArchitecture }));
  }, [selectedArchitecture]);

  // Initial synthetic run
  useEffect(() => {
    generateInitialMetrics();
  }, []);

  const generateInitialMetrics = () => {
    const history: EpochMetric[] = [];
    const totalEpochs = 15;
    for (let e = 1; e <= totalEpochs; e++) {
      const progress = e / totalEpochs;
      const trainLoss = Math.max(0.12, 1.45 * Math.exp(-progress * 2.8) + 0.08 * (Math.random() * 0.08));
      const valLoss = Math.max(0.18, 1.55 * Math.exp(-progress * 2.4) + 0.12 * (Math.random() * 0.1) + (progress > 0.8 ? 0.04 * progress : 0));
      const trainAcc = Math.min(98.2, 58 + 39 * (1 - Math.exp(-progress * 3.2)) + (Math.random() - 0.5) * 1.2);
      const valAcc = Math.min(94.8, 54 + 38 * (1 - Math.exp(-progress * 2.8)) + (Math.random() - 0.5) * 1.5);
      const valAuc = Math.min(0.968, 0.62 + 0.33 * (1 - Math.exp(-progress * 3.0)));

      history.push({
        epoch: e,
        trainLoss: parseFloat(trainLoss.toFixed(4)),
        valLoss: parseFloat(valLoss.toFixed(4)),
        trainAcc: parseFloat(trainAcc.toFixed(1)),
        valAcc: parseFloat(valAcc.toFixed(1)),
        valAuc: parseFloat(valAuc.toFixed(3)),
      });
    }

    setMetricsHistory(history);
    setCurrentEpoch(totalEpochs);
    setConfusionMatrix(generateConfusionMatrixData());
  };

  const generateConfusionMatrixData = (): ConfusionMatrixData => {
    const labels = isFr
      ? ['Pneumonie', 'Normal', 'Épanchement', 'Atélectasie']
      : ['Pneumonia', 'Normal', 'Effusion', 'Atelectasis'];

    const matrix = [
      [342, 12, 18, 8],  // Actual Pneumonia
      [9, 415, 6, 4],   // Actual Normal
      [14, 5, 285, 16], // Actual Effusion
      [11, 8, 22, 259]  // Actual Atelectasis
    ];

    const precision = [0.91, 0.94, 0.86, 0.90];
    const recall = [0.90, 0.96, 0.89, 0.86];
    const f1Score = [0.905, 0.95, 0.875, 0.88];

    return {
      labels,
      matrix,
      precision,
      recall,
      f1Score,
      overallAccuracy: 93.1,
      macroF1: 0.902,
      rocAuc: 0.958,
    };
  };

  // Run Animated Simulation
  const startSimulation = () => {
    setIsTraining(true);
    setCurrentEpoch(0);
    setMetricsHistory([]);

    let ep = 1;
    const total = params.epochs;
    const history: EpochMetric[] = [];

    const interval = setInterval(() => {
      if (ep > total) {
        clearInterval(interval);
        setIsTraining(false);
        setConfusionMatrix(generateConfusionMatrixData());
        return;
      }

      const progress = ep / total;
      // Hyperparameter adjustments
      const lrFactor = params.learningRate < 0.0005 ? 1.0 : 0.85;
      const augBonus = (params.useClahe ? 0.02 : 0) + (params.useMixup ? 0.03 : 0);

      const trainLoss = Math.max(0.08, 1.45 * Math.exp(-progress * 2.8 * lrFactor) + 0.05 * Math.random());
      const valLoss = Math.max(0.14, 1.55 * Math.exp(-progress * 2.3 * lrFactor) + 0.08 * Math.random());
      const trainAcc = Math.min(99.0, 55 + 42 * (1 - Math.exp(-progress * 3.0)) + augBonus * 10);
      const valAcc = Math.min(95.4, 52 + 40 * (1 - Math.exp(-progress * 2.6)) + augBonus * 12);
      const valAuc = Math.min(0.975, 0.60 + 0.35 * (1 - Math.exp(-progress * 2.9)) + augBonus * 0.05);

      const metricItem: EpochMetric = {
        epoch: ep,
        trainLoss: parseFloat(trainLoss.toFixed(4)),
        valLoss: parseFloat(valLoss.toFixed(4)),
        trainAcc: parseFloat(trainAcc.toFixed(1)),
        valAcc: parseFloat(valAcc.toFixed(1)),
        valAuc: parseFloat(valAuc.toFixed(3)),
      };

      history.push(metricItem);
      setMetricsHistory([...history]);
      setCurrentEpoch(ep);
      ep++;
    }, 280);
  };

  const latestMetric = metricsHistory[metricsHistory.length - 1] || {
    epoch: 0,
    trainLoss: 0,
    valLoss: 0,
    trainAcc: 0,
    valAcc: 0,
    valAuc: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="max-w-3xl">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <Cpu className="w-4 h-4" />
            <span>{isFr ? 'Laboratoire d’Entraînement Interactif & Métriques' : 'Interactive Training & Evaluation Lab'}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isFr
              ? 'Simulateur d’Entraînement CNN & Évaluation Clinique'
              : 'CNN Training Simulator & Clinical Evaluation'}
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            {isFr
              ? 'Ajustez les hyperparamètres (Focal Loss, CLAHE, Recuit Cosinus, Dégel progressif) et lancez une simulation d’entraînement accélérée pour visualiser les courbes de perte, la matrice de confusion et l’AUROC clinique.'
              : 'Tune clinical deep learning hyperparameters (Focal Loss, CLAHE, Cosine Annealing, Progressive Unfreezing) and execute accelerated training simulations to evaluate loss trajectories, confusion matrices, and ROC-AUC.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Hyperparameter Configuration Sandbox (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>{isFr ? 'Hyperparamètres' : 'Hyperparameters'}</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">PyTorch 2.x</span>
          </div>

          {/* Architecture Selector */}
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              {isFr ? 'Modèle CNN / Backbone :' : 'CNN Architecture:'}
            </label>
            <select
              value={params.architecture}
              onChange={(e) => {
                const arch = e.target.value as ArchitectureId;
                setParams({ ...params, architecture: arch });
                setSelectedArchitecture(arch);
              }}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-cyan-500"
            >
              {ARCHITECTURES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.parametersM}M params)
                </option>
              ))}
            </select>
          </div>

          {/* Dataset Selector */}
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              {isFr ? 'Dataset Public Cible :' : 'Target Public Dataset:'}
            </label>
            <select
              value={params.datasetId}
              onChange={(e) => setParams({ ...params, datasetId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-cyan-500"
            >
              {PUBLIC_DATASETS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.sampleCount.split(' ')[0]} samples)
                </option>
              ))}
            </select>
          </div>

          {/* Optimizer & Learning Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                {isFr ? 'Optimiseur :' : 'Optimizer:'}
              </label>
              <select
                value={params.optimizer}
                onChange={(e) => setParams({ ...params, optimizer: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="adamw">AdamW (Decay 1e-2)</option>
                <option value="sgd_momentum">SGD + Momentum (0.9)</option>
                <option value="rmsprop">RMSprop</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                {isFr ? 'Taux d’Appr. (LR) :' : 'Learning Rate:'}
              </label>
              <select
                value={params.learningRate}
                onChange={(e) => setParams({ ...params, learningRate: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="0.001">1e-3 (Fast probe)</option>
                <option value="0.0002">2e-4 (Standard)</option>
                <option value="0.00005">5e-5 (Fine-tuning)</option>
                <option value="0.00001">1e-5 (Gentle unfreeze)</option>
              </select>
            </div>
          </div>

          {/* Loss Function & Scheduler */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                {isFr ? 'Fonction de Perte :' : 'Loss Function:'}
              </label>
              <select
                value={params.lossFunction}
                onChange={(e) => setParams({ ...params, lossFunction: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="focal_loss">Focal Loss (γ=2.0)</option>
                <option value="weighted_ce">Weighted Cross-Entropy</option>
                <option value="cross_entropy">Standard Cross-Entropy</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                {isFr ? 'Planificateur LR :' : 'LR Scheduler:'}
              </label>
              <select
                value={params.scheduler}
                onChange={(e) => setParams({ ...params, scheduler: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="cosine">Cosine Annealing</option>
                <option value="plateau">ReduceLROnPlateau</option>
                <option value="steplr">StepLR (γ=0.5)</option>
              </select>
            </div>
          </div>

          {/* Batch Size & Epochs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Batch Size</span>
                <span className="font-mono text-cyan-400">{params.batchSize}</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                step="8"
                value={params.batchSize}
                onChange={(e) => setParams({ ...params, batchSize: parseInt(e.target.value, 10) })}
                aria-label="Batch size"
                className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Epochs</span>
                <span className="font-mono text-cyan-400">{params.epochs}</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={params.epochs}
                onChange={(e) => setParams({ ...params, epochs: parseInt(e.target.value, 10) })}
                aria-label="Training epochs"
                className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* Medical Data Augmentations Checklist */}
          <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              {isFr ? 'Augmentations Cliniques & Accélération :' : 'Clinical Augmentations & Acceleration:'}
            </span>

            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={params.useClahe}
                onChange={(e) => setParams({ ...params, useClahe: e.target.checked })}
                className="rounded accent-cyan-400"
              />
              <span>CLAHE (Contrast Limited Adaptive Histogram Eq.)</span>
            </label>

            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={params.useMixup}
                onChange={(e) => setParams({ ...params, useMixup: e.target.checked })}
                className="rounded accent-cyan-400"
              />
              <span>MixUp / CutMix Regularization (α=0.2)</span>
            </label>

            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={params.mixedPrecision}
                onChange={(e) => setParams({ ...params, mixedPrecision: e.target.checked })}
                className="rounded accent-cyan-400"
              />
              <span className="text-cyan-300 font-semibold">Automatic Mixed Precision (AMP FP16)</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 space-y-2">
            <button
              onClick={startSimulation}
              disabled={isTraining}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isTraining ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>
                    {isFr ? `Entraînement en cours (Époque ${currentEpoch}/${params.epochs})...` : `Training in Progress (Epoch ${currentEpoch}/${params.epochs})...`}
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{isFr ? 'Lancer la Simulation d’Entraînement' : 'Run Training Simulation'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Metrics Dashboard, Loss Curves & Confusion Matrix (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Top Live Metrics Scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Validation Accuracy</span>
              <div className="text-xl font-bold text-white font-mono mt-0.5">
                {latestMetric.valAcc}%
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                Train: {latestMetric.trainAcc}%
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Validation Loss</span>
              <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">
                {latestMetric.valLoss}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Train: {latestMetric.trainLoss}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Macro ROC-AUC</span>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                {latestMetric.valAuc}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                AUROC Benchmark
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Macro F1-Score</span>
              <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                {confusionMatrix?.macroF1 || 0.902}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Harmonic Mean
              </span>
            </div>
          </div>

          {/* Loss & Accuracy Curves (SVG Vector Graph) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                  {isFr ? 'Trajectoire de Convergence (Train vs Val)' : 'Convergence Trajectory (Train vs Validation Loss)'}
                </h3>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center space-x-1.5 text-cyan-400">
                  <span className="w-2.5 h-0.5 bg-cyan-400" />
                  <span>Train Loss</span>
                </span>
                <span className="flex items-center space-x-1.5 text-rose-400">
                  <span className="w-2.5 h-0.5 bg-rose-400" />
                  <span>Validation Loss</span>
                </span>
              </div>
            </div>

            {/* SVG Curve Canvas */}
            <div className="w-full h-44 bg-slate-950 rounded-xl p-3 border border-slate-800 relative">
              {metricsHistory.length > 1 ? (
                <svg viewBox="0 0 500 140" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="0" y1="35" x2="500" y2="35" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="0" y1="70" x2="500" y2="70" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="0" y1="105" x2="500" y2="105" stroke="#1e293b" strokeDasharray="3,3" />

                  {/* Train Loss Path */}
                  <path
                    d={metricsHistory.map((m, i) => {
                      const x = (i / (metricsHistory.length - 1)) * 500;
                      // Loss mapped between 0.0 and 1.6
                      const y = Math.max(10, Math.min(130, (m.trainLoss / 1.6) * 120));
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                  />

                  {/* Val Loss Path */}
                  <path
                    d={metricsHistory.map((m, i) => {
                      const x = (i / (metricsHistory.length - 1)) * 500;
                      const y = Math.max(10, Math.min(130, (m.valLoss / 1.6) * 120));
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                  />

                  {/* Data Points on Latest Epoch */}
                  {metricsHistory.length > 0 && (
                    <>
                      <circle
                        cx="500"
                        cy={Math.max(10, Math.min(130, (latestMetric.trainLoss / 1.6) * 120))}
                        r="4"
                        fill="#22d3ee"
                      />
                      <circle
                        cx="500"
                        cy={Math.max(10, Math.min(130, (latestMetric.valLoss / 1.6) * 120))}
                        r="4"
                        fill="#f43f5e"
                      />
                    </>
                  )}
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-500">
                  {isFr ? 'Lancez la simulation pour générer les courbes' : 'Run simulation to generate live loss curves'}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Confusion Matrix & Per-Class Diagnostic Metrics */}
          {confusionMatrix && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                    {isFr ? 'Matrice de Confusion Multi-Classes & Sensibilité' : 'Multi-Class Confusion Matrix & Recall Metrics'}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                  Overall Accuracy: {confusionMatrix.overallAccuracy}%
                </span>
              </div>

              {/* Confusion Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-200 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="p-2 text-left font-mono text-slate-400">
                        {isFr ? 'Vérité Terraine ↓ / Prédit →' : 'Actual ↓ / Predicted →'}
                      </th>
                      {confusionMatrix.labels.map((lbl, idx) => (
                        <th key={idx} className="p-2 text-center font-semibold text-slate-300">
                          {lbl}
                        </th>
                      ))}
                      <th className="p-2 text-center text-cyan-400 font-mono">Recall (Sens.)</th>
                      <th className="p-2 text-center text-emerald-400 font-mono">F1-Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confusionMatrix.matrix.map((row, rIdx) => {
                      const totalRow = row.reduce((a, b) => a + b, 0);
                      return (
                        <tr key={rIdx} className="border-b border-slate-800/60">
                          <td className="p-2 font-semibold text-slate-300">
                            {confusionMatrix.labels[rIdx]}
                          </td>
                          {row.map((val, cIdx) => {
                            const isDiagonal = rIdx === cIdx;
                            const intensity = val / totalRow;
                            return (
                              <td
                                key={cIdx}
                                className={`p-2 text-center font-mono font-bold rounded ${
                                  isDiagonal
                                    ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40'
                                    : val > 15
                                    ? 'bg-rose-950/30 text-rose-300'
                                    : 'text-slate-500'
                                }`}
                              >
                                {val}
                              </td>
                            );
                          })}
                          <td className="p-2 text-center font-mono text-cyan-400 font-bold">
                            {(confusionMatrix.recall[rIdx] * 100).toFixed(1)}%
                          </td>
                          <td className="p-2 text-center font-mono text-emerald-400 font-bold">
                            {confusionMatrix.f1Score[rIdx].toFixed(3)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
