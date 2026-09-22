import React, { useState, useEffect } from 'react';
import { ArchitectureId, Language, ModalityId } from './types';
import { Navbar } from './components/Navbar';
import { ClassifierView } from './components/ClassifierView';
import { TransferLearningView } from './components/TransferLearningView';
import { DatasetsView } from './components/DatasetsView';
import { TrainingLabView } from './components/TrainingLabView';
import { CodeStudioView } from './components/CodeStudioView';
import { ClinicalAssistantDrawer } from './components/ClinicalAssistantDrawer';
import { ShieldCheck, Activity, Terminal, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'classifier' | 'architectures' | 'datasets' | 'training' | 'code'>('classifier');
  const [language, setLanguage] = useState<Language>('fr'); // Default to French as requested in user prompt, with instant EN toggle
  const [selectedModality, setSelectedModality] = useState<ModalityId>('chest-xray');
  const [selectedArchitecture, setSelectedArchitecture] = useState<ArchitectureId>('densenet121');
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [hasApiActive, setHasApiActive] = useState<boolean>(true);

  const isFr = language === 'fr';

  // Server health check
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasApiActive(Boolean(data?.hasGeminiKey));
      })
      .catch(() => {
        setHasApiActive(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        selectedModality={selectedModality}
        setSelectedModality={setSelectedModality}
        selectedArchitecture={selectedArchitecture}
        setSelectedArchitecture={setSelectedArchitecture}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        hasApiActive={hasApiActive}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'classifier' && (
          <ClassifierView
            language={language}
            selectedModality={selectedModality}
            setSelectedModality={setSelectedModality}
            selectedArchitecture={selectedArchitecture}
            setSelectedArchitecture={setSelectedArchitecture}
            onSelectSampleForChat={() => setIsAssistantOpen(true)}
          />
        )}

        {activeTab === 'architectures' && (
          <TransferLearningView
            language={language}
            selectedArchitecture={selectedArchitecture}
            setSelectedArchitecture={setSelectedArchitecture}
          />
        )}

        {activeTab === 'datasets' && (
          <DatasetsView
            language={language}
          />
        )}

        {activeTab === 'training' && (
          <TrainingLabView
            language={language}
            selectedArchitecture={selectedArchitecture}
            setSelectedArchitecture={setSelectedArchitecture}
            onExportCode={() => setActiveTab('code')}
          />
        )}

        {activeTab === 'code' && (
          <CodeStudioView
            language={language}
            selectedArchitecture={selectedArchitecture}
            setSelectedArchitecture={setSelectedArchitecture}
          />
        )}
      </main>

      {/* Interactive Clinical AI Consultation Drawer */}
      <ClinicalAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        language={language}
      />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-slate-300 font-mono">
                MedVision AI
              </span>
              <span className="mx-2">•</span>
              <span>
                {isFr
                  ? 'Plateforme de Recherche en Classification Médicale & Transfer Learning'
                  : 'Medical Image Classification & Transfer Learning Research Platform'}
              </span>
            </div>
          </div>

          {/* Clinical Disclaimer */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 max-w-xl text-center md:text-right">
            <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              {isFr
                ? 'Conçu à des fins académiques, de recherche et d’aide à la décision. Non homologué comme dispositif médical de diagnostic primaire.'
                : 'Designed for academic research, education, and algorithmic evaluation. Not certified for standalone primary clinical diagnostic use.'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
