"use client";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Stage, PresentationControls, ContactShadows } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";

// Componente interno que carrega o modelo
function FunkoModel({ url }: { url: string }) {
  // O hook do Drei que baixa e faz o parse do arquivo .glb
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1.5} position={[0, -1, 0]} />;
}

export default function ModelViewer({ url }: { url: string }) {
  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing">
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 2]}
        camera={{ fov: 45 }}
      >
        <Suspense fallback={null}>
          {/* Controles para o usuário girar o boneco com o mouse */}
          <PresentationControls speed={1.5} global zoom={0.5} polar={[-0.1, Math.PI / 4]}>
            {/* Luzes de estúdio */}
            <Stage environment="city" intensity={0.6}>
              <FunkoModel url={url} />
            </Stage>
          </PresentationControls>
          
          {/* Sombra de contato bonita no chão */}
          <ContactShadows position={[0, -1.4, 0]} opacity={0.75} scale={10} blur={2.5} far={4} />
        </Suspense>
      </Canvas>
    </div>
  );
}