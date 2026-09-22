export type ModalityId = 'chest-xray' | 'dermoscopy' | 'brain-mri' | 'retinopathy' | 'histopathology';

export type ArchitectureId = 'densenet121' | 'resnet50' | 'efficientnet_b4' | 'vit_b16' | 'mobilenet_v3' | 'convnext_tiny';

export type Language = 'en' | 'fr';

export interface SampleImage {
  id: string;
  name: string;
  nameFr: string;
  modality: ModalityId;
  groundTruth: string;
  groundTruthFr: string;
  difficulty: 'Standard' | 'Subtle' | 'Complex';
  sourceDataset: string;
  previewSvg: string;
  gradCamCoords: { x: number; y: number; radius: number; intensity: number }[];
  description: string;
  descriptionFr: string;
  patientAge?: number;
  patientGender?: 'M' | 'F';
  clinicalHistory: string;
  clinicalHistoryFr: string;
}

export interface PredictionClass {
  className: string;
  probability: number;
  clinicalSignificance: string;
  description: string;
}

export interface VisualBiomarker {
  marker: string;
  location: string;
  status: 'Present' | 'Absent' | 'Indeterminate';
  note: string;
}

export interface DifferentialDiagnosis {
  condition: string;
  likelihood: 'High' | 'Moderate' | 'Low';
  rationale: string;
}

export interface CNNFeatureAnalysis {
  lowLevelFeatures: string;
  midLevelFeatures: string;
  highLevelFeatures: string;
  gradCamFocusArea: string;
}

export interface DiagnosticResult {
  modalityDetected: string;
  anatomicalRegion: string;
  primaryDiagnosis: string;
  confidence: number;
  diagnosticSeverity: 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  predictions: PredictionClass[];
  radiologicalFindings: string[];
  visualBiomarkers: VisualBiomarker[];
  differentialDiagnoses: DifferentialDiagnosis[];
  cnnFeatureAnalysis: CNNFeatureAnalysis;
  recommendations: string[];
  clinicalDisclaimer: string;
}

export interface ModelArchitecture {
  id: ArchitectureId;
  name: string;
  frameworkStandard: string;
  year: number;
  parametersM: number;
  gflops: number;
  top1Accuracy: number;
  gpuLatencyMs: number;
  recommendedModality: string;
  recommendedModalityFr: string;
  keyInnovation: string;
  keyInnovationFr: string;
  transferLearningStrategy: string;
  transferLearningStrategyFr: string;
  paperTitle: string;
  paperUrl: string;
  pros: string[];
  prosFr: string[];
  cons: string[];
  consFr: string[];
}

export interface PublicDataset {
  id: string;
  name: string;
  modality: ModalityId;
  modalityLabel: string;
  modalityLabelFr: string;
  institution: string;
  sampleCount: string;
  patientCount: string;
  diseaseClasses: string[];
  license: string;
  url: string;
  paperCitation: string;
  description: string;
  descriptionFr: string;
  clinicalRelevance: string;
  clinicalRelevanceFr: string;
  classImbalanceNote: string;
  classImbalanceNoteFr: string;
  recommendedResolution: string;
  standardMetric: string;
}

export interface TrainingHyperparameters {
  architecture: ArchitectureId;
  datasetId: string;
  learningRate: number;
  batchSize: number;
  epochs: number;
  optimizer: 'adamw' | 'sgd_momentum' | 'rmsprop';
  scheduler: 'cosine' | 'steplr' | 'plateau';
  lossFunction: 'cross_entropy' | 'focal_loss' | 'weighted_ce';
  freezeBackboneStages: 'freeze_all' | 'unfreeze_top2' | 'full_finetune';
  useClahe: boolean;
  useMixup: boolean;
  useColorJitter: boolean;
  useRandomAffine: boolean;
  mixedPrecision: boolean;
}

export interface EpochMetric {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  trainAcc: number;
  valAcc: number;
  valAuc: number;
}

export interface ConfusionMatrixData {
  labels: string[];
  matrix: number[][]; // [actual][predicted]
  precision: number[];
  recall: number[];
  f1Score: number[];
  overallAccuracy: number;
  macroF1: number;
  rocAuc: number;
}
