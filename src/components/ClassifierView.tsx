import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Sliders,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Layers,
  ZoomIn,
  Download,
  Flame,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Activity,
  Cpu,
  Brain,
  Crosshair
} from 'lucide-react';
import {
  ArchitectureId,
  DiagnosticResult,
  Language,
  ModalityId,
  SampleImage
} from '../types';
import { SAMPLE_IMAGES } from '../data/sampleImages';
import { ARCHITECTURES } from '../data/architectures';
import { ColormapName, drawGradCamOnCanvas } from '../utils/gradcamSimulator';

interface ClassifierViewProps {
  language: Language;
  selectedModality: ModalityId;
  setSelectedModality: (m: ModalityId) => void;
  selectedArchitecture: ArchitectureId;
  setSelectedArchitecture: (arch: ArchitectureId) => void;
  onSelectSampleForChat?: (sample: SampleImage, result: DiagnosticResult | null) => void;
}

export const ClassifierView: React.FC<ClassifierViewProps> = ({
  language,
  selectedModality,
  setSelectedModality,
  selectedArchitecture,
  setSelectedArchitecture,
  onSelectSampleForChat
}) => {
  const isFr = language === 'fr';

  // State
  const [currentSample, setCurrentSample] = useState<SampleImage>(SAMPLE_IMAGES[0]);
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);
  const [showGradCam, setShowGradCam] = useState<boolean>(true);
  const [colormap, setColormap] = useState<ColormapName>('jet');
  const [opacity, setOpacity] = useState<number>(0.65);
  const [threshold, setThreshold] = useState<number>(0.2);
  const [splitPosition, setSplitPosition] = useState<number>(1.0); // 1.0 = full overlay, 0.5 = half split
  const [selectedLayer, setSelectedLayer] = useState<number>(3); // 0=Input, 1=Conv1, 2=MaxPool, 3=DeepBlock, 4=GAP, 5=Softmax
  const [activeTabSub, setActiveTabSub] = useState<'diagnostics' | 'biomarkers' | 'cnn-features'>('diagnostics');

  // Diagnostic result state
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Canvas and image refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingSplit = useRef<boolean>(false);

  // Sync current sample when modality changes
  useEffect(() => {
    const matchingSample = SAMPLE_IMAGES.find((s) => s.modality === selectedModality);
    if (matchingSample && !customImageUri) {
      setCurrentSample(matchingSample);
    }
  }, [selectedModality, customImageUri]);

  // Redraw canvas whenever parameters change
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current) return;
    const canvas = canvasRef.current;
    const img = imageRef.current;

    const render = () => {
      if (showGradCam) {
        drawGradCamOnCanvas(canvas, img, currentSample.gradCamCoords, {
          colormap,
          opacity,
          threshold,
          showOriginal: true,
          splitPosition,
        });
      } else {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      }
    };

    if (img.complete) {
      render();
    } else {
      img.onload = render;
    }
  }, [currentSample, showGradCam, colormap, opacity, threshold, splitPosition, customImageUri]);

  // Initial simulated diagnosis or Gemini analysis
  useEffect(() => {
    runDiagnosticAnalysis(false);
  }, [currentSample, selectedArchitecture, language]);

  const activeArch = ARCHITECTURES.find((a) => a.id === selectedArchitecture) || ARCHITECTURES[0];

  // Trigger diagnostic analysis (Gemini or simulated)
  const runDiagnosticAnalysis = async (forceGeminiLive: boolean = false) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    const imageToSend = customImageUri || currentSample.previewSvg;

    try {
      const response = await fetch('/api/analyze-medical-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageToSend,
          modality: currentSample.modality,
          suspectedCondition: currentSample.groundTruth,
          modelArchitecture: activeArch.name,
          language,
        }),
      });

      const json = await response.json();
      if (json.data) {
        setDiagnosticResult(json.data);
      } else if (json.fallbackData) {
        setDiagnosticResult(json.fallbackData);
      }
    } catch (err: any) {
      console.warn('Analysis error:', err);
      setAnalysisError(isFr ? 'Analyse locale active (Simulation).' : 'Local analysis active (Simulation).');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Custom File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      setCustomImageUri(dataUri);

      // Create a virtual sample image
      const customSample: SampleImage = {
        id: `custom-${Date.now()}`,
        name: file.name,
        nameFr: file.name,
        modality: selectedModality,
        groundTruth: 'Uploaded Clinical Case',
        groundTruthFr: 'Cas Clinique Téléversé',
        difficulty: 'Standard',
        sourceDataset: 'User Clinical Upload',
        previewSvg: dataUri,
        gradCamCoords: [
          { x: 200, y: 200, radius: 45, intensity: 0.95 },
          { x: 170, y: 180, radius: 30, intensity: 0.8 },
        ],
        description: `Uploaded file: ${file.name} (${Math.round(file.size / 1024)} KB)`,
        descriptionFr: `Fichier téléversé : ${file.name} (${Math.round(file.size / 1024)} Ko)`,
        clinicalHistory: 'Custom patient image loaded for algorithmic evaluation.',
        clinicalHistoryFr: 'Image patient personnalisée chargée pour évaluation algorithmique.',
      };

      setCurrentSample(customSample);
    };
    reader.readAsDataURL(file);
  };

  // Split comparison mouse interaction
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSplit.current || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const pos = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
    setSplitPosition(pos);
  };

  const handleSplitTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingSplit.current || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const pos = Math.max(0.05, Math.min(0.95, (touch.clientX - rect.left) / rect.width));
    setSplitPosition(pos);
  };

  // Save Canvas Snapshot
  const handleDownloadSnapshot = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `MedVision_${currentSample.id}_GradCAM.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // CNN Layer visualizer descriptors
  const cnnLayers = [
    {
      id: 0,
      name: 'Input Layer',
      nameFr: 'Couche d’Entrée',
      dim: '224x224x3',
      desc: isFr ? 'Normalisation RGB (ImageNet μ, σ)' : 'RGB Normalized Image (ImageNet μ, σ)',
      activationVisual: 'gradient-edges',
    },
    {
      id: 1,
      name: 'Conv2D (7x7)',
      nameFr: 'Conv2D (Filtres 7x7)',
      dim: '112x112x64',
      desc: isFr ? 'Détection des contours, gradients de densité osseuse et bordures' : 'Extracts primitive edges, bone density contours, and skin margins',
      activationVisual: 'edges',
    },
    {
      id: 2,
      name: 'MaxPool / Stage 1',
      nameFr: 'MaxPool / Étage 1',
      dim: '56x56x128',
      desc: isFr ? 'Invariance spatiale aux petites translations' : 'Spatial translation invariance and feature consolidation',
      activationVisual: 'pools',
    },
    {
      id: 3,
      name: 'Residual / DenseBlock 4',
      nameFr: 'Bloc Résiduel / Dense 4',
      dim: '14x14x1024',
      desc: isFr ? 'Extraction des biomarqueurs profonds (consolidation, nécrose, réseau atypique) - Cible Grad-CAM' : 'High-level pathological hallmarks (consolidation, necrosis, atypia) - Grad-CAM Hook Target',
      activationVisual: 'deep-pathology',
    },
    {
      id: 4,
      name: 'Global Avg Pooling (GAP)',
      nameFr: 'Global Avg Pooling (GAP)',
      dim: '1x1x1024',
      desc: isFr ? 'Agrégation spatiale en vecteur d’embedding clinique' : 'Spatial feature collapse into a 1D clinical embedding vector',
      activationVisual: 'vector',
    },
    {
      id: 5,
      name: 'Dense Softmax Head',
      nameFr: 'Tête Linéaire Softmax',
      dim: '1x1x4',
      desc: isFr ? 'Distribution probabiliste calibrée sur les classes diagnostiques' : 'Calibrated probability distribution across disease classes',
      activationVisual: 'logits',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Clinical Context Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Modality Selector Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              {isFr ? 'Domaine Clinique :' : 'Clinical Modality:'}
            </span>
            {[
              { id: 'chest-xray' as ModalityId, labelEn: 'Chest X-Ray', labelFr: 'Radiographie Thorax' },
              { id: 'dermoscopy' as ModalityId, labelEn: 'Dermoscopy', labelFr: 'Dermoscopie' },
              { id: 'brain-mri' as ModalityId, labelEn: 'Brain MRI', labelFr: 'IRM Cérébrale' },
              { id: 'retinopathy' as ModalityId, labelEn: 'Retinopathy', labelFr: 'Rétinopathie' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedModality(m.id);
                  setCustomImageUri(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedModality === m.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {isFr ? m.labelFr : m.labelEn}
              </button>
            ))}
          </div>

          {/* Transfer Learning Backbone Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isFr ? 'Réseau CNN :' : 'Backbone CNN:'}</span>
            </span>
            <select
              value={selectedArchitecture}
              onChange={(e) => setSelectedArchitecture(e.target.value as ArchitectureId)}
              aria-label={isFr ? 'Réseau CNN de transfert' : 'Transfer learning CNN backbone'}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              {ARCHITECTURES.map((arch) => (
                <option key={arch.id} value={arch.id}>
                  {arch.name} ({arch.parametersM}M params - Top-1: {arch.top1Accuracy}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Curated Clinical Cases Carousel */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center space-x-3 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-slate-400 whitespace-nowrap font-mono">
            {isFr ? 'Cas Cliniques :' : 'Cases Archive:'}
          </span>
          {SAMPLE_IMAGES.filter((s) => s.modality === selectedModality).map((sample) => (
            <button
              key={sample.id}
              onClick={() => {
                setCurrentSample(sample);
                setCustomImageUri(null);
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentSample.id === sample.id && !customImageUri
                  ? 'bg-gradient-to-r from-cyan-600/30 to-teal-600/30 border border-cyan-400 text-cyan-200 shadow-sm'
                  : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-700">
                <img src={sample.previewSvg} alt={sample.name} className="w-full h-full object-cover" />
              </div>
              <span className="whitespace-nowrap">{isFr ? sample.nameFr : sample.name}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                  sample.difficulty === 'Complex'
                    ? 'bg-rose-500/20 text-rose-400'
                    : sample.difficulty === 'Subtle'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {sample.difficulty}
              </span>
            </button>
          ))}

          {/* Upload Custom Image Button */}
          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 cursor-pointer transition-all whitespace-nowrap">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isFr ? 'Importer un Scan (PNG/JPG)' : 'Upload Patient Scan'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* Main Grid: Left Medical Viewer & Right Diagnostic Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Interactive Medical Scan & Grad-CAM Canvas (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Viewer Header Toolbar */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  {isFr ? 'Visualiseur Haute Définition' : 'High-Definition Medical Viewer'}
                </span>
                <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">
                  {currentSample.sourceDataset}
                </span>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Grad-CAM Toggle */}
                <button
                  onClick={() => setShowGradCam(!showGradCam)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    showGradCam
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                  title="Toggle Grad-CAM Attention Heatmap"
                >
                  <Flame className={`w-3.5 h-3.5 ${showGradCam ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span>Grad-CAM</span>
                </button>

                {/* Colormap Dropdown */}
                {showGradCam && (
                  <select
                    value={colormap}
                    onChange={(e) => setColormap(e.target.value as ColormapName)}
                    aria-label={isFr ? 'Palette de couleurs' : 'Colormap palette'}
                    className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-md px-2 py-1 focus:outline-none"
                  >
                    <option value="jet">Jet (Standard)</option>
                    <option value="turbo">Turbo (Google)</option>
                    <option value="viridis">Viridis (Colorblind)</option>
                    <option value="inferno">Inferno</option>
                    <option value="coolwarm">Coolwarm</option>
                  </select>
                )}

                {/* Download Snapshot */}
                <button
                  onClick={handleDownloadSnapshot}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
                  title="Export Grad-CAM Snapshot"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas Interactive Container with Split Slider */}
            <div
              ref={splitContainerRef}
              className="relative w-full aspect-square bg-slate-950 flex items-center justify-center select-none overflow-hidden cursor-ew-resize"
              onMouseDown={() => {
                isDraggingSplit.current = true;
              }}
              onMouseUp={() => {
                isDraggingSplit.current = false;
              }}
              onMouseLeave={() => {
                isDraggingSplit.current = false;
              }}
              onMouseMove={handleSplitMouseMove}
              onTouchStart={() => {
                isDraggingSplit.current = true;
              }}
              onTouchEnd={() => {
                isDraggingSplit.current = false;
              }}
              onTouchMove={handleSplitTouchMove}
            >
              {/* Hidden Image for source drawing */}
              <img
                ref={imageRef}
                src={customImageUri || currentSample.previewSvg}
                alt="Medical Scan Source"
                className="hidden"
                crossOrigin="anonymous"
              />

              {/* Rendered Canvas */}
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-full h-full object-contain"
              />

              {/* Split Drag Instruction Overlay (Fades out when interacted) */}
              {splitPosition === 1.0 && showGradCam && (
                <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-700/60 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 flex items-center space-x-1.5 pointer-events-none">
                  <Sliders className="w-3 h-3 text-cyan-400" />
                  <span>
                    {isFr ? 'Glisser sur l’image pour comparer Original vs Grad-CAM' : 'Drag horizontally across image to split compare'}
                  </span>
                </div>
              )}

              {/* Modality Tag in Corner */}
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-700/60 rounded-lg px-2 py-1 text-[11px] font-mono text-cyan-300 pointer-events-none">
                {currentSample.groundTruth}
              </div>

              {/* Split percentage indicator */}
              {splitPosition < 1.0 && (
                <div className="absolute top-3 right-3 bg-cyan-950/90 border border-cyan-500/50 rounded-lg px-2 py-0.5 text-[10px] font-mono text-cyan-300 pointer-events-none">
                  Split: {Math.round(splitPosition * 100)}%
                </div>
              )}
            </div>

            {/* Canvas Adjustment Sliders (Opacity, Threshold, Split Reset) */}
            {showGradCam && (
              <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{isFr ? 'Opacité Heatmap :' : 'Heatmap Opacity:'}</span>
                    <span className="font-mono text-cyan-400">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    aria-label={isFr ? 'Opacité de la heatmap' : 'Heatmap opacity'}
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>{isFr ? 'Seuil Activation (Cutoff) :' : 'Activation Threshold:'}</span>
                    <span className="font-mono text-cyan-400">{Math.round(threshold * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.8"
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    aria-label={isFr ? 'Seuil d activation cut-off' : 'Activation cut-off threshold'}
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-2">
                  <button
                    onClick={() => setSplitPosition(splitPosition < 1.0 ? 1.0 : 0.5)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700"
                  >
                    {splitPosition < 1.0
                      ? isFr ? 'Plein Grad-CAM' : 'Full Overlay'
                      : isFr ? 'Mode Split 50/50' : 'Split 50/50'}
                  </button>
                  <button
                    onClick={() => {
                      setOpacity(0.65);
                      setThreshold(0.2);
                      setSplitPosition(1.0);
                    }}
                    className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-[11px]"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CNN Layer-by-Layer Feature Map Inspector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  {isFr ? 'Inspecteur de Couches CNN & Cartes de Caractéristiques' : 'CNN Hierarchical Layer & Feature Map Inspector'}
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeArch.name} ({activeArch.parametersM}M params)
              </span>
            </div>

            {/* Layer pipeline timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {cnnLayers.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setSelectedLayer(layer.id)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    selectedLayer === layer.id
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="text-[10px] font-mono text-cyan-400 font-semibold mb-0.5">
                    L{layer.id + 1}
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {isFr ? layer.nameFr : layer.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {layer.dim}
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Layer Details Box */}
            <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-semibold text-cyan-300">
                    {isFr ? cnnLayers[selectedLayer].nameFr : cnnLayers[selectedLayer].name}
                  </span>
                  <span className="ml-2 font-mono text-slate-400">
                    Tensor shape: [{cnnLayers[selectedLayer].dim}]
                  </span>
                  <p className="mt-1 text-slate-300 text-[11px] leading-relaxed">
                    {cnnLayers[selectedLayer].desc}
                  </p>
                </div>
                {selectedLayer === 3 && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold whitespace-nowrap">
                    Grad-CAM Target Hook
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Diagnostic Assessment & Clinical Findings Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Diagnosis Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            {/* Top diagnostic header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {isFr ? 'Diagnostic Prédit par Réseau Profond' : 'Primary Deep Learning Prediction'}
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5 flex items-center space-x-2">
                  <span>{diagnosticResult?.primaryDiagnosis || currentSample.groundTruth}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {diagnosticResult?.anatomicalRegion || currentSample.description}
                </p>
              </div>

              {/* Severity Badge */}
              <div className="flex flex-col items-end">
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                    diagnosticResult?.diagnosticSeverity === 'Critical'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : diagnosticResult?.diagnosticSeverity === 'Severe'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : diagnosticResult?.diagnosticSeverity === 'Moderate'
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {diagnosticResult?.diagnosticSeverity || 'Moderate'}
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400 mt-1">
                  {diagnosticResult?.confidence || 94.6}% {isFr ? 'Certitude' : 'Certainty'}
                </span>
              </div>
            </div>

            {/* Multimodal Gemini Trigger Banner */}
            <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-cyan-950/60 to-emerald-950/60 border border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>Gemini 3.8 Flash</span>
                    <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-300 rounded font-mono">
                      MULTIMODAL
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {isFr ? 'Revue radiologique et analyse de biomarqueurs' : 'Radiological review & biomarker extraction'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => runDiagnosticAnalysis(true)}
                disabled={isAnalyzing}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-1 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>{isFr ? 'Analyse...' : 'Analyzing...'}</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5" />
                    <span>{isFr ? 'Réanalyser' : 'Re-Analyze'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Sub-Tabs: Diagnostics, Biomarkers, CNN Features */}
            <div className="flex border-b border-slate-800 space-x-4 mb-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTabSub('diagnostics')}
                className={`pb-2 transition-colors relative ${
                  activeTabSub === 'diagnostics' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isFr ? 'Probabilités & Findings' : 'Probabilities & Findings'}
                {activeTabSub === 'diagnostics' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTabSub('biomarkers')}
                className={`pb-2 transition-colors relative ${
                  activeTabSub === 'biomarkers' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isFr ? 'Biomarqueurs Visuels' : 'Visual Biomarkers'}
                {activeTabSub === 'biomarkers' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTabSub('cnn-features')}
                className={`pb-2 transition-colors relative ${
                  activeTabSub === 'cnn-features' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isFr ? 'Interprétation CNN' : 'CNN Interpretation'}
                {activeTabSub === 'cnn-features' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
                )}
              </button>
            </div>

            {/* TAB 1: Softmax Probabilities & Radiological Findings */}
            {activeTabSub === 'diagnostics' && (
              <div className="space-y-4">
                {/* Softmax Probability Bars */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2">
                    {isFr ? 'Distribution Softmax des Classes :' : 'Softmax Class Probability Distribution:'}
                  </span>
                  <div className="space-y-2">
                    {(diagnosticResult?.predictions || [
                      { className: currentSample.groundTruth, probability: 94.6, clinicalSignificance: 'Primary finding', description: 'Strong activation' },
                      { className: 'Secondary Differential', probability: 3.4, clinicalSignificance: 'Low probability', description: 'Minimal overlap' },
                      { className: 'Normal Baseline', probability: 2.0, clinicalSignificance: 'Ruled out', description: 'Pathology present' }
                    ]).map((pred, i) => (
                      <div key={i} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-200">{pred.className}</span>
                          <span className="font-mono font-bold text-cyan-400">
                            {pred.probability.toFixed(1)}%
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              i === 0
                                ? 'bg-gradient-to-r from-cyan-500 to-teal-400'
                                : 'bg-slate-600'
                            }`}
                            style={{ width: `${pred.probability}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span className="truncate">{pred.description}</span>
                          <span className="text-slate-400 whitespace-nowrap ml-2">
                            {pred.clinicalSignificance}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radiological Observations */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2">
                    {isFr ? 'Constatations Radiologiques Clés :' : 'Key Radiological Findings:'}
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {(diagnosticResult?.radiologicalFindings || [
                      'Dense alveolar consolidation in the target region',
                      'High gradient boundary detected by intermediate convolutional blocks',
                      'Surrounding tissue involvement consistent with inflammatory cascade'
                    ]).map((finding, idx) => (
                      <li key={idx} className="flex items-start space-x-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Differential Diagnoses */}
                {diagnosticResult?.differentialDiagnoses && diagnosticResult.differentialDiagnoses.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2">
                      {isFr ? 'Diagnostics Différentiels :' : 'Differential Diagnoses:'}
                    </span>
                    <div className="space-y-1.5">
                      {diagnosticResult.differentialDiagnoses.map((diff, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-semibold text-slate-200">{diff.condition}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                diff.likelihood === 'High'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : diff.likelihood === 'Moderate'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {diff.likelihood} {isFr ? 'Probabilité' : 'Likelihood'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{diff.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Visual Biomarkers Matrix */}
            {activeTabSub === 'biomarkers' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  {isFr
                    ? 'Biomarqueurs visuels et radiologiques extraits automatiquement de l’image :'
                    : 'Target visual and radiological biomarkers automatically detected in the scan:'}
                </p>

                <div className="space-y-2">
                  {(diagnosticResult?.visualBiomarkers || [
                    { marker: 'Air Bronchogram / Density', location: 'Consolidated focus', status: 'Present', note: 'Strong sign of alveolar filling' },
                    { marker: 'Asymmetry / Contour Jaggedness', location: 'Lesion boundary', status: 'Present', note: 'Elevated malignant entropy' },
                    { marker: 'Pneumothorax / Cavitation', location: 'Peripheral margins', status: 'Absent', note: 'No pleural detachment' },
                  ]).map((bio, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-200">{bio.marker}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            bio.status === 'Present'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : bio.status === 'Absent'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {bio.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <span className="text-cyan-400 font-mono">Location: </span>
                        {bio.location}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">{bio.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CNN Layer Feature Analysis */}
            {activeTabSub === 'cnn-features' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold mb-1">
                    <Crosshair className="w-4 h-4" />
                    <span>{isFr ? 'Grad-CAM Attention Focus' : 'Grad-CAM Attention Epicenter'}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {diagnosticResult?.cnnFeatureAnalysis?.gradCamFocusArea ||
                      'Maximum activation concentrates on the pathological focal zone, indicating the CNN relied on valid disease hallmarks.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-1">
                    {isFr ? '1. Caractéristiques de Bas Niveau (Couches 1-2)' : '1. Low-Level Features (Early Conv Layers)'}
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {diagnosticResult?.cnnFeatureAnalysis?.lowLevelFeatures ||
                      'High-frequency Gabor and Sobel kernels detect spatial gradients, edge transitions, and sudden density variances.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-1">
                    {isFr ? '2. Caractéristiques Intermédiaires (Blocs 2-3)' : '2. Mid-Level Features (Intermediate Blocks)'}
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {diagnosticResult?.cnnFeatureAnalysis?.midLevelFeatures ||
                      'Tissue texture patterns, opacity granularity, and lesion contour regularity are synthesized into localized feature maps.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-1">
                    {isFr ? '3. Caractéristiques Sémantiques Profondes (Bottleneck)' : '3. High-Level Semantic Features (Deep Bottleneck)'}
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {diagnosticResult?.cnnFeatureAnalysis?.highLevelFeatures ||
                      'Final bottleneck dense representations match the global holistic signature of the clinical pathology with high spatial confidence.'}
                  </p>
                </div>
              </div>
            )}

            {/* Recommendations & Clinical Safety Notice */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
              {diagnosticResult?.recommendations && diagnosticResult.recommendations.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
                    {isFr ? 'Recommandations de Conduite à Tenir :' : 'Next Clinical Steps & Recommendations:'}
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {diagnosticResult.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-center space-x-1.5">
                        <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety Disclaimer Banner */}
              <div className="p-2.5 rounded-xl bg-slate-950/90 border border-amber-500/30 flex items-start space-x-2 text-[11px] text-amber-300/90">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="leading-snug">
                  {diagnosticResult?.clinicalDisclaimer ||
                    (isFr
                      ? 'Dispositif expérimental d’aide à la décision et de recherche algorithmique. Ne constitue pas un diagnostic médical homologué.'
                      : 'Experimental algorithmic research and educational system. Does not constitute a certified medical diagnosis.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
