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
  
  console.log('🎨 ThreeDDesignStudio rendering with viewMode:', viewMode);

  const handleTextureUpdate = (textureData: string) => {
    setCurrentTexture(textureData);
  };

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
            <h3 className="text-lg font-medium text-gray-900 mb-4">3D Preview</h3>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {viewMode === '3d' ? (
                <ThreeDViewer
                  designTexture={currentTexture || undefined}
                  hoodieColor={hoodieColor}
                  onModelLoad={handleModelLoad}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎨</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">2D Texture Editor</h3>
                    <p className="text-gray-600">
                      Use the controls on the right to design your texture
                    </p>
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
          />

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-3">
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
                onClick={() => {
                  // Auto-rotate the 3D model
                  console.log('Auto-rotate toggled');
                }}
                className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                Toggle Auto-Rotate
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
