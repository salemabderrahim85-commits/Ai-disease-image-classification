import React, { useState } from 'react';
import {
  X,
  Send,
  Stethoscope,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { DiagnosticResult, Language, SampleImage } from '../types';

interface ClinicalAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentSample?: SampleImage;
  currentResult?: DiagnosticResult | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const ClinicalAssistantDrawer: React.FC<ClinicalAssistantDrawerProps> = ({
  isOpen,
  onClose,
  language,
  currentSample,
  currentResult
}) => {
  const isFr = language === 'fr';

  const [inputQuestion, setInputQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: isFr
        ? "Bonjour ! Je suis MedVision AI Assistant, propulsé par Gemini 3.8 Flash. Je peux vous éclairer sur l'interprétation radiologique du cas en cours, la focalisation de l'attention Grad-CAM, les spécificités de DenseNet/ResNet ou les défis du déséquilibre de classe."
        : "Hello! I am MedVision AI Assistant, powered by Gemini 3.8 Flash. I can explain radiological observations from the loaded scan, interpret Grad-CAM attention focal spots, compare CNN backbones (DenseNet vs ResNet), or explain clinical class imbalance strategies.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = isFr
    ? [
        "Pourquoi DenseNet-121 est-il la référence pour la radiographie pulmonaire ?",
        "Que signifie le voile blanc-bleu dans l'analyse dermatoscopique ?",
        "Comment la Focal Loss compense-t-elle le déséquilibre de prévalence ?",
        "Comment fonctionnent les hooks PyTorch pour calculer le Grad-CAM ?"
      ]
    : [
        "Why is DenseNet-121 the gold standard benchmark for chest radiographs?",
        "What is the clinical significance of the blue-white veil in dermoscopy?",
        "How does Focal Loss counteract severe disease prevalence imbalance?",
        "How do PyTorch forward and backward hooks compute Grad-CAM activations?"
      ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuestion.trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask-clinical-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          context: {
            sample: currentSample?.name,
            groundTruth: currentSample?.groundTruth,
            modality: currentSample?.modality,
            primaryDiagnosis: currentResult?.primaryDiagnosis,
            confidence: currentResult?.confidence,
          },
          language,
        }),
      });

      const json = await response.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: json.answer || (isFr ? 'Aucune réponse reçue.' : 'No response received.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: isFr
          ? 'Une erreur réseau est survenue lors de la communication avec l’assistant.'
          : 'A network error occurred while communicating with the diagnostic assistant.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white">
                  MedVision Clinical AI
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isFr ? 'Consultant Médical & Ingénieur Vision' : 'Radiological & Computer Vision Consultation'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clinical Case Context Tag */}
        {currentSample && (
          <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 truncate max-w-[280px]">
              {isFr ? 'Cas Actif : ' : 'Active Case: '}
              <strong className="text-slate-200 font-mono">{currentSample.groundTruth}</strong>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              {currentSample.modality}
            </span>
          </div>
        )}

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                  msg.sender === 'user'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-cyan-400 border border-slate-700'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line'
                }`}
              >
                <p>{msg.text}</p>
                <span className="text-[9px] opacity-60 block mt-1 text-right font-mono">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs p-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-200" />
              <span className="text-[11px] font-mono">MedVision AI thinking...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-1.5">
          <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center space-x-1">
            <Lightbulb className="w-3 h-3 text-cyan-400" />
            <span>{isFr ? 'Questions Suggérées :' : 'Suggested Inquiries:'}</span>
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-left transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder={isFr ? 'Posez une question sur le scan ou l’architecture...' : 'Ask a question about the scan or CNN...'}
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || isLoading}
              className="p-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 rounded-xl transition-all font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Clinical safety note */}
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            {isFr
              ? 'Pour la recherche et l’éducation médicale. Ne remplace pas l’avis d’un praticien.'
              : 'For medical education and research exploration. Not a certified clinical device.'}
          </p>
        </div>
      </div>
    </div>
  );
};
