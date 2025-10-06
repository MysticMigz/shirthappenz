'use client';

import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ThreeDViewerProps {
  modelPath?: string;
  hoodieColor?: string;
  animationEnabled?: boolean;
  selectedHoodiePart?: string;
  onModelLoad?: (model: any) => void;
  className?: string;
}

// 3D Model Component
function HoodieModel({ hoodieColor, animationEnabled, selectedHoodiePart, onModelLoad }: { hoodieColor?: string; animationEnabled?: boolean; selectedHoodiePart?: string; onModelLoad?: (model: any) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  
  console.log('🎯 HoodieModel component rendering');
  
  // Load the GLB model
  const glbModel = useGLTF('/blender/hoodie-model.glb');
  
  console.log('📦 GLB model from useGLTF:', glbModel);
  
  // Apply plain color material (ignore design texture)
  React.useEffect(() => {
    if (glbModel) {
      console.log('🎨 Applying plain color material:', hoodieColor);
      
      if (glbModel.scene) {
        glbModel.scene.traverse((child) => {
          if (child.isMesh && child.material) {
            // Create a simple material with only the selected color
            const material = new THREE.MeshStandardMaterial({
              color: hoodieColor || '#8B5CF6', // Use selected color or default purple
              roughness: 0.8,
              metalness: 0.2,
            });
            
            child.material = material;
            child.material.needsUpdate = true;
            console.log('✅ Applied plain color material to mesh:', child.name, 'with color:', hoodieColor);
          }
        });
      }
    }
  }, [glbModel, hoodieColor]);

  // Notify parent that model is loaded
  React.useEffect(() => {
    if (glbModel) {
      setModelLoaded(true);
      console.log('✅ GLB model loaded successfully:', glbModel);
      console.log('GLB model structure:', {
        type: glbModel.type,
        children: glbModel.children?.length,
        position: glbModel.position,
        rotation: glbModel.rotation,
        scale: glbModel.scale,
        boundingBox: glbModel.geometry?.boundingBox
      });
      
      // Log the model's world position and scale
      if (glbModel.scene) {
        glbModel.scene.traverse((child) => {
          if (child.isMesh) {
            console.log('Mesh found:', {
              name: child.name,
              position: child.position,
              scale: child.scale,
              geometry: child.geometry?.type
            });
          }
        });
      }
      onModelLoad?.(glbModel);
    } else {
      console.log('❌ GLB model is null/undefined');
    }
  }, [glbModel, onModelLoad]);

  // Animation - play GLB animations if available
  React.useEffect(() => {
    if (glbModel && glbModel.animations && glbModel.animations.length > 0) {
      console.log('🎬 Found animations:', glbModel.animations.length);
      
      // Create animation mixer
      if (glbModel.scene) {
        mixerRef.current = new THREE.AnimationMixer(glbModel.scene);
        
        // Play all animations
        glbModel.animations.forEach((clip) => {
          const action = mixerRef.current!.clipAction(clip);
          action.play();
          console.log('🎬 Playing animation:', clip.name);
        });
      }
    }
  }, [glbModel]);

  // Animation frame update
  useFrame((state, delta) => {
    // Update animation mixer only if animation is enabled
    if (mixerRef.current && animationEnabled) {
      mixerRef.current.update(delta);
    }
    
    // Fallback rotation animation if no GLB animations and animation is enabled
    if (meshRef.current && meshRef.current.rotation && animationEnabled && (!glbModel?.animations || glbModel.animations.length === 0)) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Only use the GLB model - no fallback
  if (glbModel) {
    console.log('🎯 Rendering GLB model with scale [50, 50, 50]');
    
    // Debug: Check the original model structure
    let meshCount = 0;
    glbModel.scene.traverse((child) => {
      if (child.isMesh) {
        meshCount++;
        console.log('🔍 Found mesh in original model:', child.name, child.visible, child.material);
        // Make sure the mesh is visible
        child.visible = true;
        if (child.material) {
          // Create a new material with the selected hoodie color
          const newMaterial = new THREE.MeshStandardMaterial({
            color: hoodieColor || '#8B5CF6', // Use selected color or default purple
            metalness: 0.1,
            roughness: 0.8,
            transparent: false,
            opacity: 1,
            visible: true
          });
          child.material = newMaterial;
          child.material.needsUpdate = true;
          console.log('🎨 Applied new material to mesh:', child.name, 'with color:', hoodieColor);
        }
      }
    });
    console.log(`📊 Total meshes in original model: ${meshCount}`);
    
    return (
      <primitive 
        ref={meshRef}
        object={glbModel.scene}
        scale={[2, 2, 2]}
        position={[0, 0, 0]}
        visible={true}
      />
    );
  }

  // If no GLB model, show nothing (or loading state)
  return null;
}

// Loading component - simple Three.js loading indicator
function LoadingSpinner() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#8B5CF6" />
    </mesh>
  );
}

// Main 3D Viewer Component
export default function ThreeDViewer({ 
  modelPath, 
  hoodieColor,
  animationEnabled,
  selectedHoodiePart,
  onModelLoad, 
  className = "" 
}: ThreeDViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  console.log('🚀 ThreeDViewer rendering with props:', { modelPath, className });

  const handleModelLoad = (model: any) => {
    setIsLoading(false);
    onModelLoad?.(model);
  };

  // Handle WebGL context loss
  React.useEffect(() => {
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('WebGL context lost, attempting recovery...');
      setError('WebGL context lost. Please refresh the page.');
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored');
      setError(null);
    };

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading 3D Model...</p>
          </div>
        </div>
      )}
      
      <Canvas
        camera={{ position: [0, 10, 10], fov: 60 }}
        shadows
        className="rounded-lg"
        gl={{ 
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: true
        }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          {/* Enhanced Lighting Setup */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight
            position={[-10, 10, 5]}
            intensity={0.8}
            castShadow
          />
          <pointLight position={[-10, -10, -10]} intensity={0.4} />
          <pointLight position={[10, -10, 10]} intensity={0.3} />
          
          {/* Environment removed to avoid HDR loading issues */}
          
          {/* 3D Model */}
          <HoodieModel 
            hoodieColor={hoodieColor}
            animationEnabled={animationEnabled}
            selectedHoodiePart={selectedHoodiePart}
            onModelLoad={handleModelLoad}
          />
          
          {/* Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={20}
            autoRotate={false}
          />
        </Suspense>
      </Canvas>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading 3D Model...</p>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center rounded-lg">
          <div className="text-center text-red-600">
            <p className="font-medium">3D Model Error</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
      
      {/* Controls Info */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        <div>🖱️ Drag to rotate</div>
        <div>🔍 Scroll to zoom</div>
        <div>🖱️ Right-click to pan</div>
      </div>
    </div>
  );
}
