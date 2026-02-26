"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type StepStatus = "pending" | "active" | "completed" | "error";

interface ProcessingStep {
  id: string;
  label: string;
  status: StepStatus;
}

const INITIAL_STEPS: ProcessingStep[] = [
  { id: "ai_2d", label: "Analisando Traços (IA Text-to-Image)...", status: "pending" },
  { id: "ai_3d", label: "Gerando Malha 3D...", status: "pending" },
  { id: "mesh", label: "Engenharia Mecânica (Cabeça e Corpo)...", status: "pending" },
  { id: "slicer", label: "Fatiando para Bambu Lab (AMS)...", status: "pending" },
];

const STATUS_ORDER = ["pending", "ai_2d", "ai_3d", "mesh", "slicer", "completed", "error"];

interface WaitingRoomProps {
  jobId: string;
  onComplete: (meshUrl: string) => void;
}

export default function WaitingRoom({ jobId, onComplete }: WaitingRoomProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const [errorStatus, setErrorStatus] = useState<boolean>(false);

  useEffect(() => {
    if (!jobId) return;

    // Start with pending -> basically "Iniciando servidores"
    let isMounted = true;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/status`);
        const data = await res.json();
        
        if (!isMounted) return;

        const currentApiStatus = data.status;

        if (currentApiStatus === "error") {
            setErrorStatus(true);
            setSteps(prev => prev.map(s => s.status === "active" ? { ...s, status: "error" } : s));
            clearInterval(interval);
            return;
        }

        if (currentApiStatus === "completed" && data.meshUrl) {
            setSteps(prev => prev.map(s => ({ ...s, status: "completed" })));
            clearInterval(interval);
            setTimeout(() => {
              if (isMounted) onComplete(data.meshUrl);
            }, 1500);
            return;
        }

        // Update steps visually based on current pipeline status
        const currentStatusIndex = STATUS_ORDER.indexOf(currentApiStatus);
        
        if (currentStatusIndex !== -1) {
            setSteps(prev => prev.map((step) => {
                const stepIndex = STATUS_ORDER.indexOf(step.id);
                if (stepIndex < currentStatusIndex) {
                    return { ...step, status: "completed" };
                } else if (stepIndex === currentStatusIndex) {
                    return { ...step, status: "active" };
                } else {
                    return { ...step, status: "pending" };
                }
            }));
        }

      } catch (err) {
        console.error("Erro no polling:", err);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [jobId, onComplete]);

  return (
    <div className="w-full flex justify-center items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-sm"
      >
        <div className="flex flex-col items-center mb-8">
          {/* Skeleton Pulse 3D - Indica carregamento no backend */}
          <div className="relative w-24 h-24 mb-6">
            {!errorStatus && (
                <>
                <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-2 rounded-full border-b-2 border-pink-500 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                </>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl text-zinc-400">{errorStatus ? "⚠️" : "🤖"}</span>
            </div>
            {/* Glow */}
            {!errorStatus && <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 animate-pulse" />}
          </div>

          <h3 className={`text-2xl font-bold flex items-center gap-3 ${errorStatus ? 'text-red-400' : 'text-zinc-100'}`}>
            {!errorStatus && <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />}
            {errorStatus ? 'Falha na Geração' : 'Fabricando Magia...'}
          </h3>
          <p className="text-zinc-400 text-center mt-2 text-sm">
            {errorStatus 
                ? 'Ops, ocorreu um erro na geração. Por favor, tente novamente.'
                : 'Nossos servidores GPUs estão esculpindo sua miniatura. Isso leva até 90 segundos.'}
          </p>
        </div>

        {/* Loading Stepper */}
        <div className="space-y-5">
          {steps.map((step, index) => (
            <motion.div 
              key={step.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center"
            >
              <div className="relative w-7 h-7 mr-4 flex items-center justify-center shrink-0">
                {step.status === "completed" ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-pink-500">
                    <CheckCircle2 className="w-7 h-7 shadow-pink-500/50 drop-shadow-md" />
                  </motion.div>
                ) : step.status === "active" ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                  />
                ) : step.status === "error" ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-red-500">
                    <XCircle className="w-7 h-7 shadow-red-500/50 drop-shadow-md" />
                  </motion.div>
                ) : (
                  <div className="w-3 h-3 bg-zinc-800 rounded-full" />
                )}
              </div>
              <span className={`text-sm md:text-base font-medium transition-all duration-500 ${
                step.status === "completed" ? "text-zinc-500" :
                step.status === "active" ? "text-purple-300 drop-shadow-[0_0_8px_rgba(216,180,254,0.4)]" : 
                step.status === "error" ? "text-red-400" :
                "text-zinc-600"
              }`}>
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
