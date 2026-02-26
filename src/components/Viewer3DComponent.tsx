import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  Environment, 
  ContactShadows, 
  OrbitControls, 
  useGLTF,
  Center
} from '@react-three/drei';
import * as THREE from 'three';

// ----------------------------------------------------------------------
// 1. CARREGADOR DO MODELO 3D (GLTF/GLB) COM MATERIAL CUSTOMIZADO
// ----------------------------------------------------------------------
function FunkoModel({ url }: { url: string }) {
  // O hook useGLTF carrega a textura de forma assíncrona, interceptada pelo <Suspense>
  const { scene } = useGLTF(url);

  // Manipulando todos os meshes do modelo carregado para dar o aspecto de "Vinil" (Funko)
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        
        // Se o material já for do tipo Standard, apenas modificamos os atributos PBR
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          // Valores perfeitos para um look de plástico/vinil sob luz HDRI
          mesh.material.roughness = 0.45; 
          mesh.material.metalness = 0.1;
          mesh.material.needsUpdate = true;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      }
    });
  }, [scene]);

  // Envolvemos o modelo com <Center> para garantir que a origem (0,0,0) 
  // fique alinhada corretamente para as Sombras e Rotação da Câmera.
  return (
    <Center position={[0, 0, 0]}>
      <primitive object={scene} scale={2.5} />
    </Center>
  );
}

// ----------------------------------------------------------------------
// 2. CANVAS E COMPOSIÇÃO DE CENA (R3F)
// ----------------------------------------------------------------------
export default function Viewer3DComponent({ modelUrl }: { modelUrl: string | null }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 6], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* 2.1 Iluminação HDRI Avançada para Reflexos */}
      <Environment preset="studio" environmentIntensity={0.8} />

      {/* 2.2 Luz Direcional para acentuar feições e gerar sombras dramáticas */}
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={1024} 
      />
      <ambientLight intensity={0.4} />

      {/* 2.3 Sombras de Contato Realistas ('Aterrando' o objeto) */}
      <ContactShadows 
        position={[0, -1.5, 0]} // Posicionado sob o limite inferior do Center
        opacity={0.65} 
        scale={15} 
        blur={2.5} 
        far={5} 
        resolution={1024}
        color="#000000"
      />

      {/* 2.4 Controles da Câmera (UX) */}
      <OrbitControls 
        makeDefault 
        autoRotate={!!modelUrl} // Só gira se hover modelo final
        autoRotateSpeed={0.8} 
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        minPolarAngle={Math.PI / 4} // Impede ir muito alto
        maxPolarAngle={Math.PI / 1.5} // Impede ir muito por baixo do chão
        dampingFactor={0.05} // Suavidade extrema
      />

      {/* 2.5 Malha/Conteúdo - Se existir URL (Finalizado), mostra a Malha. */}
      {modelUrl && (
        <Suspense fallback={null}>
          <FunkoModel url={modelUrl} />
        </Suspense>
      )}
    </Canvas>
  );
}

// Pré-carregamento do fallback para evitar lag de rede inicial
// useGLTF.preload('/models/mock_funko.glb');
