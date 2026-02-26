"use client";

import { useState, useEffect } from "react";
import ModelViewer from "@/components/ModelViewer";

export default function PreviewPage() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Liberar a URL anterior se existir para evitar memory leak
    if (modelUrl) {
      URL.revokeObjectURL(modelUrl);
    }

    // Criar uma URL local para o arquivo carregado
    const objectUrl = URL.createObjectURL(file);
    setModelUrl(objectUrl);
  };

  // Limpar a URL ao desmontar o componente
  useEffect(() => {
    return () => {
      if (modelUrl) {
        URL.revokeObjectURL(modelUrl);
      }
    };
  }, [modelUrl]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-5xl w-full space-y-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Visualizador 3D (.glb)
        </h1>
        
        <p className="text-neutral-400 text-center max-w-lg">
          Faça upload de um arquivo .glb do seu computador para visualizar o modelo em nossa cena 3D com iluminação de estúdio.
        </p>
        
        <div className="w-full max-w-md">
          <label 
            htmlFor="glb-upload" 
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-700/50 rounded-xl cursor-pointer bg-neutral-900/50 hover:bg-neutral-800 transition-all hover:border-blue-500/50"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-4 text-neutral-400 group-hover:text-blue-400 transition-colors" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
              <p className="mb-2 text-sm text-neutral-300"><span className="font-medium text-blue-400">Clique para buscar</span> ou arraste e solte</p>
              <p className="text-xs text-neutral-500">Suporta apenas extesão .glb</p>
            </div>
            <input 
              id="glb-upload" 
              type="file" 
              accept=".glb"
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {modelUrl ? (
          <div className="w-full h-[600px] bg-neutral-900/40 rounded-2xl overflow-hidden border border-neutral-800/50 shadow-2xl relative">
            <ModelViewer url={modelUrl} />
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-medium text-white/80 pointer-events-none">
              Dica: Arraste para rotacionar
            </div>
          </div>
        ) : (
          <div className="w-full h-[600px] bg-neutral-900/20 rounded-2xl flex items-center justify-center border border-neutral-800/30 text-neutral-600 border-dashed">
            Nenhum modelo carregado ainda.
          </div>
        )}
      </div>
    </div>
  );
}
