"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, Loader2, Package } from 'lucide-react';

// ----------------------------------------------------------------------
// 1. DYNAMIC IMPORT DO VISUALIZADOR R3F (SSR: FALSE)
// ----------------------------------------------------------------------
const Viewer3D = dynamic(() => import('./Viewer3DComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[500px] bg-neutral-900 rounded-xl animate-pulse">
      <Loader2 className="w-8 h-8 text-neutral-500 animate-spin mb-4" />
      <p className="text-neutral-400 font-medium">Iniciando Motor 3D...</p>
    </div>
  ),
});

// ----------------------------------------------------------------------
// TYPES & MOCK DATA
// ----------------------------------------------------------------------
type JobState = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
type StepStatus = 'pending' | 'active' | 'completed';

interface ProcessingStep {
  id: string;
  label: string;
  status: StepStatus;
}

const INITIAL_STEPS: ProcessingStep[] = [
  { id: 'upload', label: 'Enviando foto para o servidor...', status: 'pending' },
  { id: 'ai_2d', label: 'Analisando feições (IA Text-to-Image)...', status: 'pending' },
  { id: 'ai_3d', label: 'Gerando volumetria e textura 3D...', status: 'pending' },
  { id: 'mesh', label: 'Engenharia de malha (Cabeça e Corpo)...', status: 'pending' },
  { id: 'slicer', label: 'Fatiando para Bambu Lab (AMS)...', status: 'pending' },
];

// ----------------------------------------------------------------------
// 2. MAIN PAGE COMPONENT
// ----------------------------------------------------------------------
export default function CreateMiniaturePage() {
  const [jobState, setJobState] = useState<JobState>('idle');
  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const [modelUrl, setModelUrl] = useState<string | null>(null);

  // Mock do Polling Assíncrono (Reduzindo 90s para fins de demonstração rápida)
  const handleUpload = () => {
    setJobState('processing');
    
    // Simulação do backend via Polling timeout chain
    let currentStepIndex = 0;
    
    const interval = setInterval(() => {
      setSteps((prev) => {
        const nextSteps = [...prev];
        
        // Marca o anterior como completo
        if (currentStepIndex > 0) {
          nextSteps[currentStepIndex - 1].status = 'completed';
        }
        
        // Ativa o atual
        if (currentStepIndex < nextSteps.length) {
          nextSteps[currentStepIndex].status = 'active';
        } else {
          // Finalizado
          clearInterval(interval);
          setJobState('completed');
          setModelUrl('/models/mock_funko.glb'); // Substitua pela URL real no S3
        }
        return nextSteps;
      });
      
      currentStepIndex++;
    }, 2500); // Em prod, isso seria um polling GET /api/jobs/{id}/status a cada 3s
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center p-6 selection:bg-purple-500/30">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Lado Esquerdo: Textos e Controle de Estado */}
        <div className="flex flex-col space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Transforme sua Foto em Vinil.
            </h1>
            <p className="text-neutral-400 text-lg leading-relaxed">
              Faça upload de uma selfie e deixe nossa IA esculpir um colecionável estilo Funko 100% pronto para impressão 3D colorida.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {jobState === 'idle' && (
              <motion.div
                key="upload-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div 
                  onClick={handleUpload}
                  className="group relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-neutral-800 rounded-2xl bg-neutral-900/50 hover:bg-neutral-900 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <UploadCloud className="w-12 h-12 text-neutral-500 group-hover:text-purple-400 transition-colors mb-4" />
                  <p className="font-semibold text-neutral-300">Clique para selecionar ou arraste a foto</p>
                  <p className="text-sm text-neutral-500 mt-2">JPG, PNG ou WEBP (Max 5MB)</p>
                </div>
              </motion.div>
            )}

            {jobState === 'processing' && (
              <motion.div
                key="processing-stepper"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin mr-3" />
                  Fabricando Colecionável...
                </h3>
                <div className="space-y-4">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center">
                      <div className="relative w-6 h-6 mr-4 flex items-center justify-center flex-shrink-0">
                        {step.status === 'completed' ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          </motion.div>
                        ) : step.status === 'active' ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"
                          />
                        ) : (
                          <div className="w-3 h-3 bg-neutral-800 rounded-full" />
                        )}
                      </div>
                      <span className={`text-sm md:text-base font-medium transition-colors duration-300 ${
                        step.status === 'completed' ? 'text-neutral-500 line-through' :
                        step.status === 'active' ? 'text-purple-300' : 'text-neutral-600'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {jobState === 'completed' && (
              <motion.div
                key="completed-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
              >
                <div className="flex items-start mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-neutral-100">Pronto para Impressão!</h3>
                    <p className="text-neutral-400 text-sm mt-1">
                      O fatiamento foi concluído com sucesso e o arquivo 3MF está otimizado para o sistema Bambu Lab AMS.
                    </p>
                  </div>
                </div>

                {/* Métricas do Slicer Mockadas (Vindas do endpoint de status) */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-neutral-950 rounded-lg p-4 border border-neutral-800/50">
                    <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Tempo Estimado</span>
                    <p className="text-2xl font-bold text-neutral-200 mt-1">4h 15m</p>
                  </div>
                  <div className="bg-neutral-950 rounded-lg p-4 border border-neutral-800/50">
                    <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Filamento</span>
                    <p className="text-2xl font-bold text-neutral-200 mt-1">85g</p>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-colors">
                    Baixar .3MF Múltiplas Cores
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Lado Direito: Visualizador 3D R3F */}
        <div className="relative w-full h-[500px] md:h-[600px] rounded-3xl overflow-hidden bg-neutral-900/30 border border-neutral-800/50 flex items-center justify-center shadow-2xl">
          {jobState === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-600">
              <Package className="w-20 h-20 mb-4 opacity-20" />
              <p className="font-medium opacity-50">Preview 3D aparecerá aqui</p>
            </div>
          )}
          
          {(jobState === 'processing' || jobState === 'completed') && (
            <div className="absolute inset-0 fade-in cursor-grab active:cursor-grabbing">
              {/* Renderiza o R3F com Client-side only wrapper */}
              <Viewer3D modelUrl={jobState === 'completed' ? modelUrl : null} />
            </div>
          )}
        </div>
        
      </div>
    </main>
  );
}
