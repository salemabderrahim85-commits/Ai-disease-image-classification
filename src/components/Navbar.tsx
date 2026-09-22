import React from 'react';
import {
  Activity,
  Layers,
  Database,
  Cpu,
  Code2,
  Stethoscope,
  Globe,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { ArchitectureId, Language, ModalityId } from '../types';

interface NavbarProps {
  activeTab: 'classifier' | 'architectures' | 'datasets' | 'training' | 'code';
  setActiveTab: (tab: 'classifier' | 'architectures' | 'datasets' | 'training' | 'code') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  selectedModality: ModalityId;
  setSelectedModality: (modality: ModalityId) => void;
  selectedArchitecture: ArchitectureId;
  setSelectedArchitecture: (arch: ArchitectureId) => void;
  onOpenAssistant: () => void;
  hasApiActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  selectedModality,
  setSelectedModality,
  selectedArchitecture,
  setSelectedArchitecture,
  onOpenAssistant,
  hasApiActive
}) => {
  const isFr = language === 'fr';

  const modalities: { id: ModalityId; labelEn: string; labelFr: string }[] = [
    { id: 'chest-xray', labelEn: 'Chest X-Ray', labelFr: 'Radiographie Thorax' },
    { id: 'dermoscopy', labelEn: 'Dermoscopy (Skin)', labelFr: 'Dermoscopie (Peau)' },
    { id: 'brain-mri', labelEn: 'Brain MRI', labelFr: 'IRM Cérébrale' },
    { id: 'retinopathy', labelEn: 'Retinopathy', labelFr: 'Rétinopathie' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('classifier')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">
                  MedVision<span className="text-cyan-400">.AI</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded">
                  CNN STUDIO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {isFr ? 'Classification d’Images Médicales & Transfer Learning' : 'Medical Disease Image Classification & Transfer Learning'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('classifier')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'classifier'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{isFr ? 'Classifieur & Grad-CAM' : 'Classifier & Grad-CAM'}</span>
            </button>

            <button
              onClick={() => setActiveTab('architectures')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'architectures'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isFr ? 'Architectures CNN' : 'CNN Architectures'}</span>
            </button>

            <button
              onClick={() => setActiveTab('datasets')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'datasets'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isFr ? 'Datasets Publics' : 'Public Datasets'}</span>
            </button>

            <button
              onClick={() => setActiveTab('training')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'training'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{isFr ? 'Lab Entraînement' : 'Training Lab'}</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'code'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Python PyTorch / TF</span>
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick AI Diagnostic Assistant Drawer Button */}
            <button
              onClick={onOpenAssistant}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-medium transition-all shadow-sm"
              title={isFr ? 'Assistant Clinique Gemini' : 'Gemini Clinical Assistant'}
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">
                {isFr ? 'Consultation IA' : 'AI Consultation'}
              </span>
              <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
              className="flex items-center space-x-1 px-2 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg text-xs text-slate-300 transition-colors"
              title="Toggle Language EN / FR"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-slate-100 uppercase">{language}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden overflow-x-auto space-x-1 pb-2 pt-1 scrollbar-none border-t border-slate-900">
          <button
            onClick={() => setActiveTab('classifier')}
            className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'classifier' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            {isFr ? 'Classifieur & Grad-CAM' : 'Classifier & Grad-CAM'}
          </button>
          <button
            onClick={() => setActiveTab('architectures')}
            className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'architectures' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            {isFr ? 'Architectures CNN' : 'CNN Architectures'}
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'datasets' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            {isFr ? 'Datasets Publics' : 'Public Datasets'}
          </button>
          <button
            onClick={() => setActiveTab('training')}
            className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'training' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            {isFr ? 'Entraînement' : 'Training Lab'}
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'code' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            Python Code
          </button>
        </div>
      </div>
    </header>
  );
};
