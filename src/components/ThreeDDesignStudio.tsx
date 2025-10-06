'use client';

import React, { useState, useRef } from 'react';
import ThreeDViewer from './ThreeDViewer';
import DesignTextureManager from './DesignTextureManager';

interface ThreeDDesignStudioProps {
  className?: string;
}

export default function ThreeDDesignStudio({ className = "" }: ThreeDDesignStudioProps) {
  const [currentTexture, setCurrentTexture] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isGeneratingTexture, setIsGeneratingTexture] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [hoodieColor, setHoodieColor] = useState('#8B5CF6'); // Default purple
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [selectedHoodiePart, setSelectedHoodiePart] = useState('front');
  const [designElements, setDesignElements] = useState<any[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  console.log('🎨 ThreeDDesignStudio rendering with viewMode:', viewMode);

  const handleTextureUpdate = (textureData: string) => {
    setCurrentTexture(textureData);
  };

  const handleDesignElementsUpdate = (elements: any[]) => {
    setDesignElements(elements);
  };

  // Load UV template for 2D editor
  const [uvTemplate, setUvTemplate] = useState<HTMLImageElement | null>(null);
  
  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setUvTemplate(img);
      console.log('✅ UV template loaded for 2D editor:', img.width, 'x', img.height);
    };
    img.onerror = () => {
      console.log('❌ UV template not found for 2D editor');
    };
    img.src = '/blender/hoodie-uv-template.png';
  }, []);

  // Render 2D preview with UV template and images
  const render2DPreview = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ Canvas ref is null');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Canvas context is null');
      return;
    }

    console.log('🎨 Rendering 2D preview with UV template');

    // Set canvas size for display
    canvas.width = 400;
    canvas.height = 400;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw UV template as background
    if (uvTemplate) {
      ctx.drawImage(uvTemplate, 0, 0, canvas.width, canvas.height);
      console.log('🎨 Drawing UV template background');
    } else {
      // Fallback: Draw basic template
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw design elements using UV coordinates
    designElements.forEach((element, index) => {
      if (element.image) {
        // Convert UV coordinates to canvas coordinates
        const x = (element.uvX || 0) * canvas.width;
        const y = (element.uvY || 0) * canvas.height;
        const width = (element.uvWidth || 0.2) * canvas.width;
        const height = (element.uvHeight || 0.2) * canvas.height;
        
        console.log(`🎨 Drawing element ${index} in 2D preview:`, {
          x, y, width, height,
          uvX: element.uvX, uvY: element.uvY
        });
        
        ctx.save();
        ctx.globalAlpha = element.opacity || 1;
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(((element.rotation || 0) * Math.PI) / 180);
        ctx.drawImage(
          element.image,
          -width / 2,
          -height / 2,
          width,
          height
        );
        ctx.restore();
      }
    });
  }, [designElements, uvTemplate]);

  // Render 2D preview when design elements change or view mode changes
  React.useEffect(() => {
    if (viewMode === '2d') {
      // Small delay to ensure canvas is mounted
      setTimeout(() => {
        render2DPreview();
      }, 100);
    }
  }, [viewMode, render2DPreview]);

  // Also render when design elements change
  React.useEffect(() => {
    if (viewMode === '2d') {
      render2DPreview();
    }
  }, [designElements, render2DPreview]);

  const handleModelLoad = (model: any) => {
    setModelLoaded(true);
    console.log('3D Model loaded:', model);
  };

  const exportDesign = () => {
    if (currentTexture) {
      const link = document.createElement('a');
      link.download = `custom-design-${Date.now()}.png`;
      link.href = currentTexture;
      link.click();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">3D Design Studio</h2>
            <p className="text-gray-600 mt-1">
              Create and preview your custom designs in 3D
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('3d')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === '3d'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                3D View
              </button>
              <button
                onClick={() => setViewMode('2d')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === '2d'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                2D Editor
              </button>
            </div>
            <button
              onClick={exportDesign}
              disabled={!currentTexture}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export Design
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">3D Preview</h3>
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {selectedHoodiePart === 'front' && '👕 Front'}
                {selectedHoodiePart === 'back' && '👕 Back'}
                {selectedHoodiePart === 'left-arm' && '🦾 Left Arm'}
                {selectedHoodiePart === 'right-arm' && '🦾 Right Arm'}
              </div>
            </div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {viewMode === '3d' ? (
                <ThreeDViewer
                  hoodieColor={hoodieColor}
                  animationEnabled={animationEnabled}
                  selectedHoodiePart={selectedHoodiePart}
                  onModelLoad={handleModelLoad}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden">
                  <div className="relative w-full h-full">
                    {console.log('🎨 Rendering 2D editor with designElements:', designElements.length)}
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full cursor-crosshair"
                      style={{ imageRendering: 'pixelated' }}
                      onClick={() => {
                        // Force re-render when canvas is clicked
                        setTimeout(() => {
                          render2DPreview();
                        }, 50);
                      }}
                    />
                    {designElements.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <div className="text-6xl mb-4">🎨</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">2D Texture Editor</h3>
                          <p className="text-gray-600">Upload a design to see it positioned on the hoodie mesh</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Model Status */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${
                  modelLoaded ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    modelLoaded ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span>{modelLoaded ? '3D Model Ready' : 'Loading 3D Model...'}</span>
                </div>
                {currentTexture && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Custom Design Applied</span>
                  </div>
                )}
              </div>
              
              {isGeneratingTexture && (
                <div className="flex items-center space-x-2 text-purple-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span>Generating Texture...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Design Controls */}
        <div className="space-y-6">
          <DesignTextureManager
            onTextureUpdate={handleTextureUpdate}
            selectedHoodiePart={selectedHoodiePart}
            onPartSelect={setSelectedHoodiePart}
            onDesignElementsUpdate={handleDesignElementsUpdate}
          />

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-3">
              {/* Hoodie Part Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Design Placement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'front', label: 'Front', icon: '👕' },
                    { id: 'back', label: 'Back', icon: '👕' },
                    { id: 'left-arm', label: 'Left Arm', icon: '🦾' },
                    { id: 'right-arm', label: 'Right Arm', icon: '🦾' }
                  ].map((part) => (
                    <button
                      key={part.id}
                      onClick={() => setSelectedHoodiePart(part.id)}
                      className={`px-3 py-2 text-xs rounded-md transition-colors ${
                        selectedHoodiePart === part.id
                          ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-sm">{part.icon}</span>
                        <span className="text-xs">{part.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Hoodie Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={hoodieColor}
                    onChange={(e) => setHoodieColor(e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{hoodieColor}</span>
                </div>
              </div>
              
              <button
                onClick={() => setCurrentTexture(null)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Reset to Base Texture
              </button>
              <button
                onClick={() => setAnimationEnabled(!animationEnabled)}
                className={`w-full px-4 py-2 rounded-md transition-colors ${
                  animationEnabled 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {animationEnabled ? '🎬 Animation ON' : '⏸️ Animation OFF'}
              </button>
              <button
                onClick={() => {
                  // Reset camera position
                  console.log('Reset camera');
                }}
                className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
              >
                Reset Camera
              </button>
            </div>
          </div>

          {/* Design Tips */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">💡 3D Preview Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• The 3D preview shows a realistic hoodie model</li>
              <li>• Drag to rotate and scroll to zoom the 3D view</li>
              <li>• Upload designs to see them applied to the 3D model</li>
              <li>• Use the 2D editor to fine-tune your designs</li>
              <li>• Export your final design when ready</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
