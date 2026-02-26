"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import ModelViewer from "./ModelViewer";
import { Loader2 } from "lucide-react";

interface TheStageProps {
  modelUrl: string;
}

// Fallback elegante e dark para o Suspense
function LoaderFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400">
      <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
      <span className="font-medium animate-pulse">Desempacotando Vinil 3D...</span>
    </div>
  );
}

export default function TheStage({ modelUrl }: TheStageProps) {
  return (
    <div className="relative w-full h-[600px] rounded-3xl overflow-hidden bg-zinc-950/50 border border-zinc-800 shadow-2xl">
      <Suspense fallback={<LoaderFallback />}>
        {/*
          Regra de Ouro: Performance.
          Limitando dpr para retina displays no celular não fritarem.
        */}
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2, 6], fov: 45 }}>
          {/* Iluminação HDRI realista e poderosa */}
          <Environment preset="studio" environmentIntensity={0.8} />

          {/* Sombras base para dar senso de gravidade "aterrando" */}
          <ContactShadows 
            position={[0, -1, 0]} 
            opacity={0.6} 
            blur={2} 
            scale={10} 
            resolution={512}
            color="#000000"
          />

          {/* Modelo com material transformado */}
          {modelUrl && <ModelViewer url={modelUrl} />}

          {/* Controle estrito contra perdas de câmera ou entrar no chão */}
          <OrbitControls
            makeDefault
            autoRotate={true}
            autoRotateSpeed={1.0}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2 + 0.1}
            enablePan={false}
            minDistance={3}
            maxDistance={8}
            dampingFactor={0.05}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
