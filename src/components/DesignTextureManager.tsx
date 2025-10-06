'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useCanvas } from './hooks/useCanvas';

interface DesignTextureManagerProps {
  onTextureUpdate: (textureData: string) => void;
  className?: string;
}

interface DesignElement {
  id: string;
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

export default function DesignTextureManager({ 
  onTextureUpdate, 
  className = "" 
}: DesignTextureManagerProps) {
  const [designElements, setDesignElements] = useState<DesignElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate texture from design elements
  const generateTexture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (should match the UV map resolution)
    canvas.width = 2048;
    canvas.height = 2048;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Load base texture
    const baseTexture = new Image();
    baseTexture.crossOrigin = 'anonymous';
    baseTexture.onload = () => {
      // Draw base texture
      ctx.drawImage(baseTexture, 0, 0, canvas.width, canvas.height);
      
      // Draw design elements
      designElements.forEach(element => {
        ctx.save();
        ctx.globalAlpha = element.opacity;
        ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.drawImage(
          element.image,
          -element.width / 2,
          -element.height / 2,
          element.width,
          element.height
        );
        ctx.restore();
      });
      
      // Generate texture data URL
      const textureData = canvas.toDataURL('image/png');
      onTextureUpdate(textureData);
    };
    
    baseTexture.src = '/blender/FCL1-PSK002-00_DIFFUSE_DESATURATION.png';
  }, [designElements, onTextureUpdate]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const newElement: DesignElement = {
          id: Date.now().toString(),
          image: img,
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          rotation: 0,
          opacity: 1
        };
        
        setDesignElements(prev => [...prev, newElement]);
        setSelectedElement(newElement.id);
        
        // Generate texture immediately after adding element
        setTimeout(() => {
          generateTexture();
        }, 100);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle element selection
  const handleElementClick = (elementId: string) => {
    setSelectedElement(elementId);
  };

  // Handle element drag
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    const element = designElements.find(el => el.id === elementId);
    if (!element) return;

    setIsDragging(true);
    setSelectedElement(elementId);
    setDragOffset({
      x: e.clientX - element.x,
      y: e.clientY - element.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    setDesignElements(prev =>
      prev.map(el =>
        el.id === selectedElement
          ? { ...el, x: Math.max(0, Math.min(2048 - el.width, newX)), y: Math.max(0, Math.min(2048 - el.height, newY)) }
          : el
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    generateTexture();
  };

  // Update element properties
  const updateElement = (elementId: string, updates: Partial<DesignElement>) => {
    setDesignElements(prev =>
      prev.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      )
    );
    // Generate texture after updating element
    setTimeout(() => {
      generateTexture();
    }, 100);
  };

  // Remove element
  const removeElement = (elementId: string) => {
    setDesignElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
    generateTexture();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Add Design Elements</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Upload Design Element
        </button>
      </div>

      {/* Design Elements List */}
      {designElements.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Design Elements</h3>
          <div className="space-y-2">
            {designElements.map((element) => (
              <div
                key={element.id}
                className={`p-3 rounded-lg border-2 cursor-pointer ${
                  selectedElement === element.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
                onClick={() => handleElementClick(element.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">Element {element.id.slice(-4)}</div>
                    <div className="text-xs text-gray-500">
                      {element.width}×{element.height}px
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeElement(element.id);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Element Properties */}
      {selectedElement && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Element Properties</h3>
          {(() => {
            const element = designElements.find(el => el.id === selectedElement);
            if (!element) return null;

            return (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position X: {Math.round(element.x)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2048"
                    value={element.x}
                    onChange={(e) => updateElement(selectedElement, { x: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Y: {Math.round(element.y)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2048"
                    value={element.y}
                    onChange={(e) => updateElement(selectedElement, { y: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width: {Math.round(element.width)}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    value={element.width}
                    onChange={(e) => updateElement(selectedElement, { width: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height: {Math.round(element.height)}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    value={element.height}
                    onChange={(e) => updateElement(selectedElement, { height: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rotation: {Math.round(element.rotation)}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={element.rotation}
                    onChange={(e) => updateElement(selectedElement, { rotation: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opacity: {Math.round(element.opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={element.opacity}
                    onChange={(e) => updateElement(selectedElement, { opacity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Hidden canvas for texture generation */}
      <canvas
        ref={canvasRef}
        className="hidden"
        width={2048}
        height={2048}
      />
    </div>
  );
}
