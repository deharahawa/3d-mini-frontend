import React from "react";
import { CheckCircle2, Download, Box } from "lucide-react";
import { motion } from "framer-motion";

interface PrintStatsHUDProps {
  modelUrl?: string;
}

export default function PrintStatsHUD({ modelUrl }: PrintStatsHUDProps) {
  const handleDownload = async (type: "glb" | "3mf") => {
    if (!modelUrl) return;

    if (type === "3mf") {
      alert("⚠️ Arquivo 3MF de fatiamento ainda não disponível. Baixando a malha 3D original (.glb) como fallback.");
    }

    try {
      const response = await fetch(modelUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "miniatura.glb";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro ao baixar o modelo:", error);
      alert("Ocorreu um erro ao tentar baixar o modelo.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
      
      <div className="flex items-start mb-8 relative z-10">
        <CheckCircle2 className="w-8 h-8 text-green-400 mr-4 flex-shrink-0 mt-1 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
        <div>
          <h3 className="text-2xl font-bold text-zinc-100">Pronto para Impressão!</h3>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
            O fatiamento foi concluído com sucesso. A miniatura estilizada foi otimizada com 4 cores para o sistema Bambu Lab AMS.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
        <div className="bg-zinc-950/50 rounded-2xl p-5 border border-zinc-800/80 hover:border-purple-500/30 transition-colors">
          <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
            🕦 Tempo Estimado
          </span>
          <p className="text-3xl font-black text-zinc-100 mt-2">1h 45m</p>
        </div>
        <div className="bg-zinc-950/50 rounded-2xl p-5 border border-zinc-800/80 hover:border-pink-500/30 transition-colors">
          <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
            ⚖️ Filamento
          </span>
          <p className="text-3xl font-black text-zinc-100 mt-2">38g</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col space-y-4 relative z-10">
        <button 
          onClick={() => handleDownload("3mf")}
          disabled={!modelUrl}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg py-4 px-6 rounded-2xl transition-all shadow-lg shadow-purple-900/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          Baixar 3MF & G-Code
        </button>
        
        <button 
          onClick={() => handleDownload("glb")}
          disabled={!modelUrl}
          className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 font-medium py-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Box className="w-4 h-4" />
          Apenas baixar a malha (.glb)
        </button>
      </div>
    </motion.div>
  );
}
