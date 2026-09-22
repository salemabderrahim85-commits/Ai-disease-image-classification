import React, { useState } from 'react';
import {
  Database,
  Search,
  ExternalLink,
  Users,
  Image as ImageIcon,
  Tag,
  AlertTriangle,
  FileCode,
  Check,
  Award,
  BookOpen,
  Filter
} from 'lucide-react';
import { Language, ModalityId, PublicDataset } from '../types';
import { PUBLIC_DATASETS } from '../data/medicalDatasets';

interface DatasetsViewProps {
  language: Language;
  onSelectDataset?: (dataset: PublicDataset) => void;
}

export const DatasetsView: React.FC<DatasetsViewProps> = ({ language, onSelectDataset }) => {
  const isFr = language === 'fr';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModalityFilter, setSelectedModalityFilter] = useState<ModalityId | 'all'>('all');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const filteredDatasets = PUBLIC_DATASETS.filter((ds) => {
    const matchesModality = selectedModalityFilter === 'all' || ds.modality === selectedModalityFilter;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      ds.name.toLowerCase().includes(query) ||
      ds.institution.toLowerCase().includes(query) ||
      ds.diseaseClasses.some((c) => c.toLowerCase().includes(query));
    return matchesModality && matchesQuery;
  });

  const handleCopySnippet = (dataset: PublicDataset) => {
    const code = `# PyTorch DataLoader for ${dataset.name}
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

data_transforms = transforms.Compose([
    transforms.Resize((${dataset.recommendedResolution.split(' ')[0]})),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

dataset = datasets.ImageFolder(root="./data/${dataset.id}/train", transform=data_transforms)
loader = DataLoader(dataset, batch_size=32, shuffle=True, num_workers=4, pin_memory=True)
print(f"Loaded {len(dataset)} samples across {len(dataset.classes)} clinical classes")`;

    navigator.clipboard.writeText(code);
    setCopiedSnippetId(dataset.id);
    setTimeout(() => setCopiedSnippetId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="max-w-3xl">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <Database className="w-4 h-4" />
            <span>{isFr ? 'Données Cliniques Publiques & Benchmarks' : 'Open-Access Clinical Benchmarks'}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isFr
              ? 'Datasets Médicaux Publics pour l’Entraînement de Modèles'
              : 'Public Medical Datasets for Deep Learning'}
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            {isFr
              ? 'Les avancées en intelligence artificielle médicale reposent sur des cohortes publiques annotées par des comités d’experts radiologues, dermatologues et pathologistes. Explorez les caractéristiques, déséquilibres de classes et protocoles d’évaluation des plus grands jeux de données ouverts mondiaux.'
              : 'Breakthroughs in medical AI depend on publicly accessible patient cohorts curated and annotated by expert panels. Explore sample distributions, class imbalance management, and evaluation standards for the world’s leading open clinical datasets.'}
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-5 border-t border-slate-800">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isFr ? 'Rechercher par pathologie, nom ou institution...' : 'Search by disease, dataset name, or institution...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Modality Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', labelEn: 'All Modalities', labelFr: 'Toutes Modalités' },
              { id: 'chest-xray' as ModalityId, labelEn: 'Chest X-Ray', labelFr: 'Radiographie' },
              { id: 'dermoscopy' as ModalityId, labelEn: 'Dermoscopy', labelFr: 'Dermoscopie' },
              { id: 'brain-mri' as ModalityId, labelEn: 'Brain MRI', labelFr: 'IRM Cérébrale' },
              { id: 'retinopathy' as ModalityId, labelEn: 'Retinopathy', labelFr: 'Rétinopathie' },
              { id: 'histopathology' as ModalityId, labelEn: 'Histopathology', labelFr: 'Histopathologie' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedModalityFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedModalityFilter === f.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {isFr ? f.labelFr : f.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dataset Cards List */}
      <div className="space-y-4">
        {filteredDatasets.map((dataset) => (
          <div
            key={dataset.id}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition-all duration-200"
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              {/* Header Info */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{dataset.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                    {isFr ? dataset.modalityLabelFr : dataset.modalityLabel}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-400 border border-slate-700">
                    {dataset.license}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center space-x-2">
                  <span>{dataset.institution}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopySnippet(dataset)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700"
                  title="Copy PyTorch DataLoader Code"
                >
                  {copiedSnippetId === dataset.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">{isFr ? 'Copié !' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isFr ? 'Code PyTorch' : 'PyTorch Loader'}</span>
                    </>
                  )}
                </button>

                <a
                  href={dataset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md"
                >
                  <span>{isFr ? 'Accéder au Dataset' : 'Access Repository'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Description */}
            <p className="mt-3 text-xs text-slate-300 leading-relaxed">
              {isFr ? dataset.descriptionFr : dataset.description}
            </p>

            {/* Quantitative Badges Matrix */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  {isFr ? 'Volume d’Images' : 'Sample Volume'}
                </span>
                <span className="font-bold text-white font-mono">{dataset.sampleCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  {isFr ? 'Cohorte Patients' : 'Patient Cohort'}
                </span>
                <span className="font-bold text-cyan-400 font-mono">{dataset.patientCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  {isFr ? 'Résolution Recommandée' : 'Resolution'}
                </span>
                <span className="font-bold text-slate-300 font-mono">{dataset.recommendedResolution}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  {isFr ? 'Métrique Standard' : 'Evaluation Metric'}
                </span>
                <span className="font-bold text-emerald-400 font-mono">{dataset.standardMetric}</span>
              </div>
            </div>

            {/* Pathological Disease Classes Pills */}
            <div className="mt-4">
              <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1.5">
                {isFr ? 'Classes Diagnostiques Étiquetées :' : 'Target Annotated Disease Classes:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {dataset.diseaseClasses.map((cls, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-950 text-slate-300 border border-slate-800"
                  >
                    {cls}
                  </span>
                ))}
              </div>
            </div>

            {/* Clinical Notes on Class Imbalance & Patient Leakage */}
            <div className="mt-4 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">
                  {isFr ? 'Gestion du Déséquilibre & Risque de Fuite de Données :' : 'Class Imbalance & Patient-Level Leakage Caveat:'}
                </span>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  {isFr ? dataset.classImbalanceNoteFr : dataset.classImbalanceNote}
                </p>
              </div>
            </div>

            {/* Academic Paper Citation */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center space-x-2 text-[11px] text-slate-400 font-mono truncate">
              <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{dataset.paperCitation}</span>
            </div>
          </div>
        ))}

        {filteredDatasets.length === 0 && (
          <div className="text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800">
            <p className="text-sm text-slate-400">
              {isFr ? 'Aucun dataset ne correspond à votre recherche.' : 'No dataset matches your search criteria.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
