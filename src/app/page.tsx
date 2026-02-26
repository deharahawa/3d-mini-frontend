"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Package } from "lucide-react";

import HeroUpload from "@/components/HeroUpload";
import WaitingRoom from "@/components/WaitingRoom";
import PrintStatsHUD from "@/components/PrintStatsHUD";
import ModelViewer from "@/components/ModelViewer";
import BuildingHologram from "@/components/BuildingHologram";
import { useFunkoPipeline } from "@/hooks/useFunkoPipeline";

type JobState = "IDLE" | "PROCESSING" | "SUCCESS";

export default function CreateMiniaturePage() {
  const [jobState, setJobState] = useState<JobState>("IDLE");
  const { startProcess, jobId, setJobId } = useFunkoPipeline();
  
  // Guardamos a URL final no state
  const [finalModelUrl, setFinalModelUrl] = useState<string>("/models/mock_funko.glb");

  // Re-hidrata o estado da sala de espera na montagem do componente se houver F5
  // Mas valida se o job ainda está ativo antes de entrar em PROCESSING
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedJobId = localStorage.getItem("funko_job_id");
    if (!savedJobId) return;

    // Valida o estado do job antes de restaurar a polling
    (async () => {
      try {
        const res = await fetch(`/api/jobs/${savedJobId}/status`);

        if (!res.ok) {
          // Job não encontrado no DB — limpeza
          localStorage.removeItem("funko_job_id");
          return;
        }

        const data = await res.json();

        if (data.status === "completed" || data.status === "error") {
          // Job já terminou ou falhou — não faz sentido pollar
          localStorage.removeItem("funko_job_id");
          return;
        }

        // Job ainda está pendente/processando — restaura a sala de espera
        setJobId(savedJobId);
        setJobState("PROCESSING");
      } catch {
        // Erro de rede — limpa para não travar o app
        localStorage.removeItem("funko_job_id");
      }
    })();
  }, [setJobId]);

  const handleUploadStart = async (file: File, gender: "boy" | "girl", bodyStyle: string) => {
    setJobState("PROCESSING");
    await startProcess(file, gender, bodyStyle);
  };

  const handleProcessingComplete = (meshUrl: string) => {
    if (meshUrl) setFinalModelUrl(meshUrl);
    setJobState("SUCCESS");
    if (typeof window !== "undefined") {
      localStorage.removeItem("funko_job_id");
    }
  };

  const handleRetry = () => {
    setJobState("IDLE");
    setFinalModelUrl("/models/mock_funko.glb");
    if (typeof window !== "undefined") {
      localStorage.removeItem("funko_job_id");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-6 selection:bg-purple-500/30 font-sans">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Lado Esquerdo: Interação e Estados */}
        <div className="flex flex-col w-full">
          <AnimatePresence mode="wait">
            {jobState === "IDLE" && (
              <HeroUpload key="hero-upload" onUploadStart={handleUploadStart} />
            )}

            {jobState === "PROCESSING" && (
              <WaitingRoom key="waiting-room" jobId={jobId || ""} onComplete={handleProcessingComplete} />
            )}

            {jobState === "SUCCESS" && (
              <PrintStatsHUD 
                 key="stats-hud" 
                 modelUrl={finalModelUrl} 
                 jobId={jobId || undefined}
                 onRetry={handleRetry} 
              />
            )}
          </AnimatePresence>
        </div>

        {/* Lado Direito: The Stage (Visualizador 3D) */}
        <div className="w-full h-full min-h-[500px] lg:min-h-[700px] flex items-center justify-center relative">
          {jobState === "IDLE" && (
            <div className="w-full h-full rounded-3xl bg-zinc-900/20 border border-zinc-900/50 flex flex-col justify-center items-center text-zinc-700">
              <Package className="w-24 h-24 mb-6 opacity-20" />
              <p className="font-semibold text-lg max-w-xs text-center">
                Seu colecionável 3D aparecerá neste palco
              </p>
            </div>
          )}

          {(jobState === "PROCESSING" || jobState === "SUCCESS") && (
            <div className="w-full h-full absolute inset-0 rounded-3xl overflow-hidden bg-zinc-950/50 border border-zinc-800 shadow-2xl relative">
              {jobState === "PROCESSING" && <BuildingHologram />}
              {jobState === "SUCCESS" && finalModelUrl && <ModelViewer url={finalModelUrl} />}
            </div>
          )}
        </div>
        
      </div>
    </main>
  );
}
