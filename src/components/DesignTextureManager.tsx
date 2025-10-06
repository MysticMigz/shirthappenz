'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useCanvas } from './hooks/useCanvas';

interface DesignTextureManagerProps {
  onTextureUpdate: (textureData: string) => void;
  selectedHoodiePart?: string;
  onPartSelect?: (part: string) => void;
  onDesignElementsUpdate?: (elements: any[]) => void;
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
  uvX?: number; // UV coordinates (0-1)
  uvY?: number;
  uvWidth?: number;
  uvHeight?: number;
}

export default function DesignTextureManager({ 
  onTextureUpdate, 
  selectedHoodiePart = 'front',
  onPartSelect,
  onDesignElementsUpdate,
  className = "" 
}: DesignTextureManagerProps) {
  const [designElements, setDesignElements] = useState<DesignElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load UV template image
  const [uvTemplate, setUvTemplate] = useState<HTMLImageElement | null>(null);
  
  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setUvTemplate(img);
      console.log('✅ UV template loaded:', img.width, 'x', img.height);
    };
    img.onerror = () => {
      console.log('❌ UV template not found, using fallback');
    };
    img.src = '/blender/hoodie-uv-template.png';
  }, []);

  // Draw hoodie mesh template on canvas
  const drawHoodieTemplate = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    if (uvTemplate) {
      // Draw the UV template as background
      ctx.drawImage(uvTemplate, 0, 0, canvasWidth, canvasHeight);
      console.log('🎨 Drawing UV template background');
      
      // Overlay part selection indicators
      const parts = [
        { name: 'FRONT', id: 'front', x: 0.1, y: 0.1, width: 0.35, height: 0.4, selected: selectedHoodiePart === 'front' },
        { name: 'BACK', id: 'back', x: 0.55, y: 0.1, width: 0.35, height: 0.4, selected: selectedHoodiePart === 'back' },
        { name: 'LEFT ARM', id: 'left-arm', x: 0.05, y: 0.55, width: 0.2, height: 0.35, selected: selectedHoodiePart === 'left-arm' },
        { name: 'RIGHT ARM', id: 'right-arm', x: 0.75, y: 0.55, width: 0.2, height: 0.35, selected: selectedHoodiePart === 'right-arm' }
      ];
      
      parts.forEach(part => {
        const x = part.x * canvasWidth;
        const y = part.y * canvasHeight;
        const width = part.width * canvasWidth;
        const height = part.height * canvasHeight;
        
        if (part.selected) {
          // Draw selection overlay
          ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
          ctx.fillRect(x, y, width, height);
          
          // Draw selection border
          ctx.strokeStyle = '#8b5cf6';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);
          
          // Draw part label
          ctx.fillStyle = '#8b5cf6';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(part.name, x + width/2, y + height/2);
        }
      });
    } else {
      // Fallback: Draw basic hoodie parts
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#f0f0f0';
      
      const parts = [
        { name: 'FRONT', x: 0.1, y: 0.1, width: 0.35, height: 0.4, selected: selectedHoodiePart === 'front' },
        { name: 'BACK', x: 0.55, y: 0.1, width: 0.35, height: 0.4, selected: selectedHoodiePart === 'back' },
        { name: 'LEFT ARM', x: 0.05, y: 0.55, width: 0.2, height: 0.35, selected: selectedHoodiePart === 'left-arm' },
        { name: 'RIGHT ARM', x: 0.75, y: 0.55, width: 0.2, height: 0.35, selected: selectedHoodiePart === 'right-arm' }
      ];
      
      parts.forEach(part => {
        const x = part.x * canvasWidth;
        const y = part.y * canvasHeight;
        const width = part.width * canvasWidth;
        const height = part.height * canvasHeight;
        
        // Draw part background with transparency
        ctx.fillStyle = part.selected ? 'rgba(139, 92, 246, 0.3)' : 'rgba(240, 240, 240, 0.3)';
        ctx.fillRect(x, y, width, height);
        
        // Draw part border
        ctx.strokeStyle = part.selected ? '#8b5cf6' : '#666';
        ctx.lineWidth = part.selected ? 3 : 2;
        ctx.strokeRect(x, y, width, height);
        
        // Draw part label
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(part.name, x + width/2, y + height/2);
      });
    }
  }, [selectedHoodiePart, uvTemplate]);

  // Generate texture from design elements
  const generateTexture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match the 3D model's UV map resolution
    canvas.width = 2048;
    canvas.height = 2048;
    
    console.log('🎨 Generating texture with canvas size:', canvas.width, 'x', canvas.height);
    
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Load base texture
    const baseTexture = new Image();
    baseTexture.crossOrigin = 'anonymous';
    baseTexture.onload = () => {
      // Draw base texture as background
      ctx.drawImage(baseTexture, 0, 0, canvas.width, canvas.height);
      
      // Draw design elements using UV coordinates that match the 3D model
      designElements.forEach((element, index) => {
        // Use UV coordinates directly (0-1 range)
        const uvX = element.uvX || 0.5;
        const uvY = element.uvY || 0.5;
        const uvWidth = element.uvWidth || 0.1;
        const uvHeight = element.uvHeight || 0.1;
        
        // Convert UV coordinates to texture coordinates
        const textureX = uvX * canvas.width;
        const textureY = uvY * canvas.height;
        const textureWidth = uvWidth * canvas.width;
        const textureHeight = uvHeight * canvas.height;
        
        console.log(`🎨 Drawing element ${index} on texture:`, {
          uvX, uvY, uvWidth, uvHeight,
          textureX, textureY, textureWidth, textureHeight,
          rotation: element.rotation
        });
        
        ctx.save();
        ctx.globalAlpha = element.opacity;
        ctx.translate(textureX + textureWidth / 2, textureY + textureHeight / 2);
        ctx.rotate((element.rotation * Math.PI) / 180);
        
        // Draw image with proper orientation (no vertical flip for texture)
        ctx.drawImage(
          element.image,
          -textureWidth / 2,
          -textureHeight / 2,
          textureWidth,
          textureHeight
        );
        ctx.restore();
      });
      
      // Generate texture data URL
      const textureData = canvas.toDataURL('image/png');
      onTextureUpdate(textureData);
    };
    
    baseTexture.src = '/blender/FCL1-PSK002-00_DIFFUSE_DESATURATION.png';
  }, [designElements, onTextureUpdate]);

  // Render 2D preview with mesh and images
  const render2DPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for display
    canvas.width = 400;
    canvas.height = 400;
    
    // Draw hoodie template
    drawHoodieTemplate(ctx, canvas.width, canvas.height);
    
    // Draw design elements
    designElements.forEach((element, index) => {
      // Use UV coordinates if available, otherwise use canvas coordinates
      const x = element.uvX ? element.uvX * canvas.width : element.x;
      const y = element.uvY ? element.uvY * canvas.height : element.y;
      const width = element.uvWidth ? element.uvWidth * canvas.width : element.width;
      const height = element.uvHeight ? element.uvHeight * canvas.height : element.height;
      
      console.log(`🎨 Drawing element ${index} in 2D preview:`, {
        x, y, width, height,
        uvX: element.uvX, uvY: element.uvY
      });
      
      ctx.save();
      ctx.globalAlpha = element.opacity;
      ctx.translate(x + width / 2, y + height / 2);
      ctx.rotate((element.rotation * Math.PI) / 180);
      
      // Draw image with proper orientation
      ctx.drawImage(
        element.image,
        -width / 2,
        -height / 2,
        width,
        height
      );
      ctx.restore();
      
      // Draw selection border if this element is selected
      if (selectedElement === element.id) {
        ctx.save();
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x, y, width, height);
        ctx.restore();
      }
    });
  }, [designElements, drawHoodieTemplate]);

  // Generate texture and render preview when design elements change
  React.useEffect(() => {
    generateTexture();
    render2DPreview();
  }, [generateTexture, render2DPreview]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Position design based on selected hoodie part (matching the visual template)
        const canvasWidth = 400; // Canvas width
        const canvasHeight = 400; // Canvas height
        
        // UV positions based on the actual hoodie UV map layout
        // These can be customized and saved as defaults
        const partPositions = {
          'front': { 
            x: 0.25, // Front center in UV space
            y: 0.3, 
            width: 0.15, 
            height: 0.2 
          },
          'back': { 
            x: 0.65, // Back center in UV space
            y: 0.3, 
            width: 0.15, 
            height: 0.2 
          },
          'left-arm': { 
            x: 0.1, // Left arm in UV space
            y: 0.6, 
            width: 0.1, 
            height: 0.15 
          },
          'right-arm': { 
            x: 0.8, // Right arm in UV space
            y: 0.6, 
            width: 0.1, 
            height: 0.15 
          }
        };
        
        const position = partPositions[selectedHoodiePart as keyof typeof partPositions] || partPositions.front;
        
        console.log('🎯 Positioning design for part:', selectedHoodiePart, 'at:', position);
        
        const newElement: DesignElement = {
          id: Date.now().toString(),
          image: img,
          x: position.x * canvasWidth, // Convert UV to canvas coordinates for display
          y: position.y * canvasHeight,
          width: position.width * canvasWidth,
          height: position.height * canvasHeight,
          rotation: 0,
          opacity: 1,
          // Use UV coordinates directly
          uvX: position.x,
          uvY: position.y,
          uvWidth: position.width,
          uvHeight: position.height
        };
        
        setDesignElements(prev => {
          const updated = [...prev, newElement];
          onDesignElementsUpdate?.(updated);
          return updated;
        });
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

  // Handle canvas mouse interactions for dragging and part selection
  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Convert to UV coordinates
    const uvX = mouseX / canvas.width;
    const uvY = mouseY / canvas.height;

    // Check if clicking on a template part (matching your template layout)
    const templateParts = [
      { id: 'front', x: 0.1, y: 0.1, width: 0.35, height: 0.4 },
      { id: 'back', x: 0.55, y: 0.1, width: 0.35, height: 0.4 },
      { id: 'left-arm', x: 0.75, y: 0.55, width: 0.2, height: 0.35 }, // RIGHT ARM in template
      { id: 'right-arm', x: 0.05, y: 0.55, width: 0.2, height: 0.35 }, // LEFT ARM in template
      { id: 'hoodie', x: 0.8, y: 0.55, width: 0.15, height: 0.4 } // HOODIE section
    ];

    const clickedPart = templateParts.find(part => 
      uvX >= part.x && uvX <= part.x + part.width &&
      uvY >= part.y && uvY <= part.y + part.height
    );

    if (clickedPart) {
      console.log('🎯 Clicked on template part:', clickedPart.id);
      onPartSelect?.(clickedPart.id);
      return;
    }

    // Check if clicking on an element for dragging
    const clickedElement = designElements.find(element => {
      const x = element.uvX ? element.uvX * canvas.width : element.x;
      const y = element.uvY ? element.uvY * canvas.height : element.y;
      const width = element.uvWidth ? element.uvWidth * canvas.width : element.width;
      const height = element.uvHeight ? element.uvHeight * canvas.height : element.height;
      
      return mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height;
    });

    if (clickedElement) {
      setSelectedElement(clickedElement.id);
      setIsDragging(true);
      setDragOffset({
        x: mouseX - (clickedElement.uvX ? clickedElement.uvX * canvas.width : clickedElement.x),
        y: mouseY - (clickedElement.uvY ? clickedElement.uvY * canvas.height : clickedElement.y),
      });
      console.log('🎯 Started dragging element:', clickedElement.id);
    } else {
      setSelectedElement(null);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Convert to UV coordinates
    const uvX = Math.max(0, Math.min(1, (mouseX - dragOffset.x) / canvas.width));
    const uvY = Math.max(0, Math.min(1, (mouseY - dragOffset.y) / canvas.height));

    updateElement(selectedElement, {
      uvX,
      uvY,
      x: uvX * 400, // Update display coordinates
      y: uvY * 400
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Update element properties
  const updateElement = (elementId: string, updates: Partial<DesignElement>) => {
    setDesignElements(prev =>
      prev.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      )
    );
    
    // Generate texture and render preview immediately for real-time updates
    setTimeout(() => {
    generateTexture();
      render2DPreview();
    }, 50); // Faster update for real-time feedback
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
      {/* Box Size Configuration */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">📐 Placement Box Configuration</h3>
        <p className="text-sm text-gray-600 mb-4">
          Customize the default placement box sizes for each hoodie part. These coordinates will be used when uploading new designs.
        </p>
        
        <div className="space-y-4">
          {/* Front Box Configuration */}
          <div className="border border-gray-200 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">Front Placement</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-gray-700 mb-1">X Position (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.25"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.25"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Y Position (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.3"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.3"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Width (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.15"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.15"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Height (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.2"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.2"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Canvas coords: x: 100, y: 120, width: 60, height: 80
            </div>
          </div>

          {/* Back Box Configuration */}
          <div className="border border-gray-200 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">Back Placement</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-gray-700 mb-1">X Position (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.65"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.65"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Y Position (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.3"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.3"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Width (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.15"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.15"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Height (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.2"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.2"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Canvas coords: x: 260, y: 120, width: 60, height: 80
            </div>
          </div>

          {/* Left Arm Box Configuration */}
          <div className="border border-gray-200 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">Left Arm Placement</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-gray-700 mb-1">X Position (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.1"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.1"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Y Position (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.6"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.6"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Width (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.1"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.1"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Height (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.15"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.15"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Canvas coords: x: 40, y: 240, width: 40, height: 60
            </div>
          </div>

          {/* Right Arm Box Configuration */}
          <div className="border border-gray-200 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">Right Arm Placement</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-gray-700 mb-1">X Position (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.8"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.8"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Y Position (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.6"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.6"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Width (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.1"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.1"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Height (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  defaultValue="0.15"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  placeholder="0.15"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Canvas coords: x: 320, y: 240, width: 40, height: 60
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              // Collect all the values and log them for copying
              const frontX = (document.querySelector('input[placeholder="0.25"]') as HTMLInputElement)?.value || '0.25';
              const frontY = (document.querySelector('input[placeholder="0.3"]') as HTMLInputElement)?.value || '0.3';
              const frontW = (document.querySelector('input[placeholder="0.15"]') as HTMLInputElement)?.value || '0.15';
              const frontH = (document.querySelector('input[placeholder="0.2"]') as HTMLInputElement)?.value || '0.2';
              
              console.log('📐 Updated Box Coordinates:');
              console.log(`Front: x: ${frontX}, y: ${frontY}, width: ${frontW}, height: ${frontH}`);
              console.log(`Canvas Front: x: ${Math.round(parseFloat(frontX) * 400)}, y: ${Math.round(parseFloat(frontY) * 400)}, width: ${Math.round(parseFloat(frontW) * 400)}, height: ${Math.round(parseFloat(frontH) * 400)}`);
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            📋 Copy Coordinates
          </button>
          <button
            onClick={() => {
              // Reset to default values
              const inputs = document.querySelectorAll('input[type="number"]');
              inputs.forEach(input => {
                (input as HTMLInputElement).value = input.getAttribute('defaultValue') || '';
              });
            }}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            🔄 Reset to Defaults
          </button>
        </div>
      </div>

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
              
              {/* Print Size Warning */}
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <div className="text-amber-600 mr-2">⚠️</div>
                  <div>
                    <h4 className="font-medium text-amber-900 text-sm">Final Print Size</h4>
                    <p className="text-xs text-amber-800 mt-1">
                      Your design will be printed at the actual garment dimensions shown above. 
                      Adjust the size controls to match your desired print area.
                    </p>
                  </div>
                </div>
              </div>
          {(() => {
            const element = designElements.find(el => el.id === selectedElement);
            if (!element) return null;

            return (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position X: {Math.round(element.uvX ? element.uvX * 400 : element.x)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="400"
                    value={element.uvX ? element.uvX * 400 : element.x}
                    onChange={(e) => {
                      const newX = parseFloat(e.target.value);
                      const uvX = newX / 400;
                      updateElement(selectedElement, { 
                        x: newX, 
                        uvX: uvX 
                      });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Y: {Math.round(element.uvY ? element.uvY * 400 : element.y)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="400"
                    value={element.uvY ? element.uvY * 400 : element.y}
                    onChange={(e) => {
                      const newY = parseFloat(e.target.value);
                      const uvY = newY / 400;
                      updateElement(selectedElement, { 
                        y: newY, 
                        uvY: uvY 
                      });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width: {Math.round(element.uvWidth ? element.uvWidth * 400 : element.width)}px
                    <span className="text-gray-500 text-sm">
                      ({Math.round((element.uvWidth ? element.uvWidth * 400 : element.width) / 400 * 100)}% of template)
                    </span>
                    <div className="text-xs text-blue-600 mt-1">
                      📏 Estimated print size: {Math.round((element.uvWidth ? element.uvWidth * 400 : element.width) / 400 * 12)}″ wide
                    </div>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="400"
                    value={element.uvWidth ? element.uvWidth * 400 : element.width}
                    onChange={(e) => {
                      const newWidth = parseFloat(e.target.value);
                      const uvWidth = newWidth / 400;
                      updateElement(selectedElement, { 
                        width: newWidth, 
                        uvWidth: uvWidth 
                      });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Small</span>
                    <span>Large</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height: {Math.round(element.uvHeight ? element.uvHeight * 400 : element.height)}px
                    <span className="text-gray-500 text-sm">
                      ({Math.round((element.uvHeight ? element.uvHeight * 400 : element.height) / 400 * 100)}% of template)
                    </span>
                    <div className="text-xs text-blue-600 mt-1">
                      📏 Estimated print size: {Math.round((element.uvHeight ? element.uvHeight * 400 : element.height) / 400 * 12)}″ tall
                    </div>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="400"
                    value={element.uvHeight ? element.uvHeight * 400 : element.height}
                    onChange={(e) => {
                      const newHeight = parseFloat(e.target.value);
                      const uvHeight = newHeight / 400;
                      updateElement(selectedElement, { 
                        height: newHeight, 
                        uvHeight: uvHeight 
                      });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Small</span>
                    <span>Large</span>
                  </div>
                </div>
                
                {/* Quick Resize Buttons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quick Resize</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        const newSize = 50;
                        const uvSize = newSize / 400;
                        updateElement(selectedElement, { 
                          width: newSize, 
                          height: newSize,
                          uvWidth: uvSize, 
                          uvHeight: uvSize 
                        });
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Small
                    </button>
                    <button
                      onClick={() => {
                        const newSize = 150;
                        const uvSize = newSize / 400;
                        updateElement(selectedElement, { 
                          width: newSize, 
                          height: newSize,
                          uvWidth: uvSize, 
                          uvHeight: uvSize 
                        });
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => {
                        const newSize = 250;
                        const uvSize = newSize / 400;
                        updateElement(selectedElement, { 
                          width: newSize, 
                          height: newSize,
                          uvWidth: uvSize, 
                          uvHeight: uvSize 
                        });
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Large
                    </button>
                  </div>
                  
                  {/* Additional Resize Options */}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const currentWidth = element.uvWidth ? element.uvWidth * 400 : element.width;
                        const currentHeight = element.uvHeight ? element.uvHeight * 400 : element.height;
                        const newWidth = Math.max(5, currentWidth * 0.8);
                        const newHeight = Math.max(5, currentHeight * 0.8);
                        const uvWidth = newWidth / 400;
                        const uvHeight = newHeight / 400;
                        updateElement(selectedElement, { 
                          width: newWidth, 
                          height: newHeight,
                          uvWidth: uvWidth, 
                          uvHeight: uvHeight 
                        });
                      }}
                      className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-md"
                    >
                      Shrink 20%
                    </button>
                    <button
                      onClick={() => {
                        const currentWidth = element.uvWidth ? element.uvWidth * 400 : element.width;
                        const currentHeight = element.uvHeight ? element.uvHeight * 400 : element.height;
                        const newWidth = Math.min(400, currentWidth * 1.2);
                        const newHeight = Math.min(400, currentHeight * 1.2);
                        const uvWidth = newWidth / 400;
                        const uvHeight = newHeight / 400;
                        updateElement(selectedElement, { 
                          width: newWidth, 
                          height: newHeight,
                          uvWidth: uvWidth, 
                          uvHeight: uvHeight 
                        });
                      }}
                      className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 rounded-md"
                    >
                      Enlarge 20%
                    </button>
                  </div>
                  
                  {/* Reset to Original Size */}
                  <div className="mt-2">
                    <button
                      onClick={() => {
                        // Reset to original image dimensions (maintaining aspect ratio)
                        const originalWidth = element.image.width;
                        const originalHeight = element.image.height;
                        const aspectRatio = originalWidth / originalHeight;
                        
                        // Calculate size that fits within the template (max 200px)
                        let newWidth = Math.min(200, originalWidth);
                        let newHeight = newWidth / aspectRatio;
                        
                        if (newHeight > 200) {
                          newHeight = 200;
                          newWidth = newHeight * aspectRatio;
                        }
                        
                        const uvWidth = newWidth / 400;
                        const uvHeight = newHeight / 400;
                        updateElement(selectedElement, { 
                          width: newWidth, 
                          height: newHeight,
                          uvWidth: uvWidth, 
                          uvHeight: uvHeight 
                        });
                      }}
                      className="w-full px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 rounded-md"
                    >
                      Reset to Original Size
                    </button>
                  </div>
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
                    onChange={(e) => updateElement(selectedElement, { rotation: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
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
                    step="0.01"
                    value={element.opacity}
                    onChange={(e) => updateElement(selectedElement, { opacity: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
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
