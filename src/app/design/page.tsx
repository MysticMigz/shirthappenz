'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Text, Rect, Line, Circle } from 'react-konva';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
// import ThreeDDesignStudio from '@/components/ThreeDDesignStudio'; // Disabled for deployment - 3D preview functionality

interface DesignPosition {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  description: string;
}

interface UploadedDesign {
  id: string;
  file: File;
  image: HTMLImageElement;
  position: string;
  size: 'A3' | 'A4';
  x?: number;
  y?: number;
}

const DESIGN_POSITIONS: DesignPosition[] = [
  {
    id: 'center-chest',
    name: 'Center of Shirt',
    x: 375,
    y: 250,
    width: 200,
    height: 200,
    description: 'Front center of the shirt'
  },
  {
    id: 'left-chest',
    name: 'Left Side of Chest',
    x: 250,
    y: 200,
    width: 160,
    height: 160,
    description: 'Left side of the chest area'
  },
  {
    id: 'right-chest',
    name: 'Right Side of Chest',
    x: 590,
    y: 200,
    width: 160,
    height: 160,
    description: 'Right side of the chest area'
  },
  {
    id: 'back-center',
    name: 'Back Center',
    x: 375,
    y: 500,
    width: 200,
    height: 200,
    description: 'Center of the back'
  },
  {
    id: 'back-top',
    name: 'Top Center of Back',
    x: 375,
    y: 400,
    width: 200,
    height: 200,
    description: 'Top center of the back'
  }
];

export default function DesignPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Ensure this component only renders on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);
  const [selectedPosition, setSelectedPosition] = useState<string>('center-chest');
  const [selectedSize, setSelectedSize] = useState<'A3' | 'A4'>('A4');
  const [uploadedDesigns, setUploadedDesigns] = useState<UploadedDesign[]>([]);
  const [shirtImage, setShirtImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuides, setShowGuides] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
  const [customPositions, setCustomPositions] = useState<DesignPosition[]>(DESIGN_POSITIONS);
  const [isEditingPositions, setIsEditingPositions] = useState(false);
  const [showRulers, setShowRulers] = useState(true);
  const [draggedDesign, setDraggedDesign] = useState<string | null>(null);
  const [shirtView, setShirtView] = useState<'front' | 'back'>('front');
  const [backShirtImage, setBackShirtImage] = useState<HTMLImageElement | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapDistance] = useState(20); // pixels
  const [snappingTo, setSnappingTo] = useState<string | null>(null);
  // const [show3DPreview, setShow3DPreview] = useState(false); // Disabled for deployment - 3D preview functionality
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<any>(null);

  // Load shirt mockup images
  useEffect(() => {
    // Load front shirt image
    const frontImg = new window.Image();
    frontImg.crossOrigin = 'anonymous';
    frontImg.onload = () => setShirtImage(frontImg);
    frontImg.src = '/images/front-tshirt.png';

    // Load back shirt image
    const backImg = new window.Image();
    backImg.crossOrigin = 'anonymous';
    backImg.onload = () => setBackShirtImage(backImg);
    backImg.src = '/images/back-tshirt.png';
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Load saved positions on component mount
  useEffect(() => {
    loadSavedPositions();
  }, []);

  // Auto-select first available position when view changes
  useEffect(() => {
    const availablePositions = DESIGN_POSITIONS.filter(position => {
      const shouldShowPosition = 
        (shirtView === 'front' && (position.id.includes('chest') || position.id === 'center-chest')) ||
        (shirtView === 'back' && (position.id.includes('back') || position.id === 'center-chest'));
      return shouldShowPosition;
    });
    
    if (availablePositions.length > 0 && !availablePositions.some(pos => pos.id === selectedPosition)) {
      setSelectedPosition(availablePositions[0].id);
    }
  }, [shirtView, selectedPosition]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const image = new window.Image();
      image.crossOrigin = 'anonymous';
      
      const reader = new FileReader();
      reader.onload = (e) => {
        image.onload = () => {
          const newDesign: UploadedDesign = {
            id: Date.now().toString(),
            file,
            image,
            position: selectedPosition,
            size: selectedSize
          };
          
          setUploadedDesigns(prev => [...prev, newDesign]);
          setLoading(false);
        };
        image.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image');
      setLoading(false);
    }
  };

  const removeDesign = (designId: string) => {
    setUploadedDesigns(prev => prev.filter(design => design.id !== designId));
    if (selectedDesign === designId) {
      setSelectedDesign(null);
    }
  };

  const updateDesignPosition = (designId: string, newPosition: string) => {
    setUploadedDesigns(prev => 
      prev.map(design => 
        design.id === designId 
          ? { ...design, position: newPosition }
          : design
      )
    );
  };

  const updateDesignSize = (designId: string, newSize: 'A3' | 'A4') => {
    setUploadedDesigns(prev => 
      prev.map(design => 
        design.id === designId 
          ? { ...design, size: newSize }
          : design
      )
    );
  };

  const handlePositionDrag = (positionId: string, newX: number, newY: number) => {
    // Apply snapping
    const snapped = snapToShirtAreas(newX, newY);
    const gridSnapped = snapToNearestGrid(snapped.x, snapped.y);
    
    setCustomPositions(prev => 
      prev.map(pos => 
        pos.id === positionId 
          ? { ...pos, x: gridSnapped.x, y: gridSnapped.y }
          : pos
      )
    );
  };

  const constrainToPosition = (design: UploadedDesign, newX: number, newY: number) => {
    const position = getPositionForDesign(design.position);
    if (!position) return { x: newX, y: newY };

    // Calculate design dimensions based on A3/A4 and position area
    const designWidth = design.size === 'A4' ? position.width * 0.8 : position.width;
    const designHeight = design.size === 'A4' ? position.height * 0.8 : position.height;

    // Constrain to position boundaries
    const minX = position.x;
    const maxX = position.x + position.width - designWidth;
    const minY = position.y;
    const maxY = position.y + position.height - designHeight;

    return {
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    };
  };

  const handleDesignDrag = (designId: string, newX: number, newY: number) => {
    const design = uploadedDesigns.find(d => d.id === designId);
    if (!design) return;

    // Apply snapping first
    const snapped = snapToShirtAreas(newX, newY);
    const gridSnapped = snapToNearestGrid(snapped.x, snapped.y);
    
    // Then apply constraints
    const constrained = constrainToPosition(design, gridSnapped.x, gridSnapped.y);
    
    setUploadedDesigns(prev => 
      prev.map(d => 
        d.id === designId 
          ? { ...d, x: constrained.x, y: constrained.y }
          : d
      )
    );
    
    setDraggedDesign(null);
  };

  const handleDesignDragStart = (designId: string) => {
    setDraggedDesign(designId);
  };

  const snapToNearestGrid = (x: number, y: number) => {
    if (!snapToGrid) return { x, y };
    
    const gridSize = 20;
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;
    
    // Only snap if within snap distance
    const distanceX = Math.abs(x - snappedX);
    const distanceY = Math.abs(y - snappedY);
    
    return {
      x: distanceX <= snapDistance ? snappedX : x,
      y: distanceY <= snapDistance ? snappedY : y
    };
  };

  const snapToShirtCenter = (x: number, y: number) => {
    if (!snapToGrid) return { x, y };
    
    // Shirt center coordinates (based on 750x750 shirt at x=25, y=-25)
    const shirtCenterX = 25 + 375; // 400
    const shirtCenterY = -25 + 375; // 350
    
    // Check if near shirt center
    const distanceToCenter = Math.sqrt((x - shirtCenterX) ** 2 + (y - shirtCenterY) ** 2);
    
    if (distanceToCenter <= snapDistance) {
      return { x: shirtCenterX, y: shirtCenterY };
    }
    
    return { x, y };
  };

  const snapToShirtAreas = (x: number, y: number) => {
    if (!snapToGrid) return { x, y };
    
    // Define key shirt areas for snapping
    const shirtAreas = [
      { x: 25 + 375, y: -25 + 200, name: 'chest-center' }, // Center chest
      { x: 25 + 200, y: -25 + 180, name: 'chest-left' },   // Left chest
      { x: 25 + 550, y: -25 + 180, name: 'chest-right' }, // Right chest
      { x: 25 + 375, y: -25 + 500, name: 'back-center' }, // Back center
      { x: 25 + 375, y: -25 + 400, name: 'back-top' },    // Back top
    ];
    
    for (const area of shirtAreas) {
      const distance = Math.sqrt((x - area.x) ** 2 + (y - area.y) ** 2);
      if (distance <= snapDistance) {
        setSnappingTo(area.name);
        return { x: area.x, y: area.y };
      }
    }
    
    setSnappingTo(null);
    return { x, y };
  };

  const savePositions = () => {
    // Save positions to localStorage or send to server
    localStorage.setItem('customDesignPositions', JSON.stringify(customPositions));
    setIsEditingPositions(false);
    alert('Position settings saved!');
  };

  const resetPositions = () => {
    setCustomPositions(DESIGN_POSITIONS);
    setIsEditingPositions(false);
  };

  const loadSavedPositions = () => {
    const saved = localStorage.getItem('customDesignPositions');
    if (saved) {
      setCustomPositions(JSON.parse(saved));
    }
  };

  const renderRulers = () => {
    const rulerSize = 30;
    const canvasWidth = 800;
    const canvasHeight = 700;
    const gridSize = 20;

  return (
    <>
        {/* Horizontal Ruler */}
        <Rect
          x={0}
          y={0}
          width={canvasWidth}
          height={rulerSize}
          fill="#f0f0f0"
          stroke="#ccc"
          strokeWidth={1}
        />
        
        {/* Vertical Ruler */}
        <Rect
          x={0}
          y={0}
          width={rulerSize}
          height={canvasHeight}
          fill="#f0f0f0"
          stroke="#ccc"
          strokeWidth={1}
        />

        {/* Horizontal ruler marks */}
        {Array.from({ length: Math.floor(canvasWidth / gridSize) + 1 }, (_, i) => {
          const x = i * gridSize;
          const isMajor = x % 100 === 0;
          return (
            <React.Fragment key={`h-${i}`}>
              <Line
                points={[x, 0, x, rulerSize]}
                stroke={isMajor ? "#333" : "#999"}
                strokeWidth={isMajor ? 2 : 1}
              />
              {isMajor && (
                <Text
                  x={x + 2}
                  y={5}
                  text={x.toString()}
                  fontSize={10}
                  fill="#333"
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Vertical ruler marks */}
        {Array.from({ length: Math.floor(canvasHeight / gridSize) + 1 }, (_, i) => {
          const y = i * gridSize;
          const isMajor = y % 100 === 0;
          return (
            <React.Fragment key={`v-${i}`}>
              <Line
                points={[0, y, rulerSize, y]}
                stroke={isMajor ? "#333" : "#999"}
                strokeWidth={isMajor ? 2 : 1}
              />
              {isMajor && (
                <Text
                  x={5}
                  y={y + 10}
                  text={y.toString()}
                  fontSize={10}
                  fill="#333"
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Grid Lines */}
        {showRulers && (
          <>
            {/* Vertical grid lines */}
            {Array.from({ length: Math.floor(canvasWidth / gridSize) + 1 }, (_, i) => {
              const x = i * gridSize;
              return (
                <Line
                  key={`grid-v-${i}`}
                  points={[x, rulerSize, x, canvasHeight]}
                  stroke="#e0e0e0"
                  strokeWidth={0.5}
                  dash={[2, 2]}
                />
              );
            })}

            {/* Horizontal grid lines */}
            {Array.from({ length: Math.floor(canvasHeight / gridSize) + 1 }, (_, i) => {
              const y = i * gridSize;
              return (
                <Line
                  key={`grid-h-${i}`}
                  points={[rulerSize, y, canvasWidth, y]}
                  stroke="#e0e0e0"
                  strokeWidth={0.5}
                  dash={[2, 2]}
                />
              );
            })}
          </>
        )}

        {/* Snap Points */}
        {snapToGrid && (
          <>
            {/* Shirt center snap point */}
            <Circle
              x={400}
              y={350}
              radius={snappingTo === 'shirt-center' ? 5 : 3}
              fill={snappingTo === 'shirt-center' ? "#ff4757" : "#ff6b6b"}
              stroke="#fff"
              strokeWidth={snappingTo === 'shirt-center' ? 2 : 1}
            />
            
            {/* Key shirt area snap points */}
            <Circle
              x={400}
              y={200}
              radius={snappingTo === 'chest-center' ? 4 : 2}
              fill={snappingTo === 'chest-center' ? "#2ed573" : "#4ecdc4"}
              stroke="#fff"
              strokeWidth={snappingTo === 'chest-center' ? 2 : 1}
            />
            <Circle
              x={225}
              y={180}
              radius={snappingTo === 'chest-left' ? 4 : 2}
              fill={snappingTo === 'chest-left' ? "#2ed573" : "#4ecdc4"}
              stroke="#fff"
              strokeWidth={snappingTo === 'chest-left' ? 2 : 1}
            />
            <Circle
              x={575}
              y={180}
              radius={snappingTo === 'chest-right' ? 4 : 2}
              fill={snappingTo === 'chest-right' ? "#2ed573" : "#4ecdc4"}
              stroke="#fff"
              strokeWidth={snappingTo === 'chest-right' ? 2 : 1}
            />
            <Circle
              x={400}
              y={500}
              radius={snappingTo === 'back-center' ? 4 : 2}
              fill={snappingTo === 'back-center' ? "#2ed573" : "#4ecdc4"}
              stroke="#fff"
              strokeWidth={snappingTo === 'back-center' ? 2 : 1}
            />
            <Circle
              x={400}
              y={400}
              radius={snappingTo === 'back-top' ? 4 : 2}
              fill={snappingTo === 'back-top' ? "#2ed573" : "#4ecdc4"}
              stroke="#fff"
              strokeWidth={snappingTo === 'back-top' ? 2 : 1}
            />
          </>
        )}
      </>
    );
  };

  const getPositionForDesign = (positionId: string) => {
    return customPositions.find(pos => pos.id === positionId);
  };

  const exportDesign = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 2
      });
      
      const link = document.createElement('a');
      link.download = `custom-design-${Date.now()}.png`;
      link.href = dataURL;
      link.click();
    }
  };

  if (status === 'loading' || !isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Custom Design Studio</h1>
          <p className="mt-2 text-gray-600">
            Upload your designs and position them on the shirt template
          </p>
        </div>

        {/* Print Size Guidelines */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
            📏 Print Size Guidelines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <div className="font-medium text-blue-900">Left Chest</div>
              <div className="text-sm text-blue-700">3″- 4″ wide</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <div className="font-medium text-blue-900">Center Chest</div>
              <div className="text-sm text-blue-700">8″-10″ wide</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <div className="font-medium text-blue-900">Full Front</div>
              <div className="text-sm text-blue-700">10″-12″ wide</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <div className="font-medium text-blue-900">Upper Back</div>
              <div className="text-sm text-blue-700">4″- 6″ wide</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <div className="font-medium text-blue-900">Sleeve</div>
              <div className="text-sm text-blue-700">2″-3″ wide</div>
            </div>
          </div>
          <div className="flex items-start">
            <div className="text-amber-600 mr-2">⚠️</div>
            <p className="text-sm text-blue-800">
              These dimensions represent the final printed size on your garment. 
              Use the design tools below to position and size your designs accordingly.
            </p>
          </div>
        </div>

        {/* 3D Preview Section - DISABLED FOR DEPLOYMENT */}
        {/* 
        {show3DPreview && (
          <div className="mb-8">
            <ThreeDDesignStudio />
          </div>
        )}
        */}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Size Selection */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Design Size</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                        <input
                    type="radio"
                    name="size"
                    value="A4"
                    checked={selectedSize === 'A4'}
                    onChange={(e) => setSelectedSize(e.target.value as 'A4')}
                    className="mr-2"
                  />
                  <span className="text-sm">A4 (210 × 297mm)</span>
                        </label>
                <label className="flex items-center">
                        <input
                    type="radio"
                    name="size"
                    value="A3"
                    checked={selectedSize === 'A3'}
                    onChange={(e) => setSelectedSize(e.target.value as 'A3')}
                    className="mr-2"
                  />
                  <span className="text-sm">A3 (297 × 420mm)</span>
                        </label>
                      </div>
                      </div>

            {/* Position Selection */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Design Position</h3>
              <div className="space-y-2">
                {DESIGN_POSITIONS.map((position) => {
                  // Filter positions based on current view
                  const shouldShowPosition = 
                    (shirtView === 'front' && (position.id.includes('chest') || position.id === 'center-chest')) ||
                    (shirtView === 'back' && (position.id.includes('back') || position.id === 'center-chest'));
                  
                  if (!shouldShowPosition) return null;
                  
                  return (
                    <label key={position.id} className="flex items-start">
                        <input
                        type="radio"
                        name="position"
                        value={position.id}
                        checked={selectedPosition === position.id}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                        className="mr-2 mt-1"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{position.name}</div>
                        <div className="text-xs text-gray-500">{position.description}</div>
                      </div>
                        </label>
                  );
                })}
                      </div>
                    </div>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Upload Design</h3>
              <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                  onChange={handleFileUpload}
                        className="hidden"
                      />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Uploading...' : 'Choose Image'}
                </button>
                
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                )}
              </div>
                    </div>

            {/* Uploaded Designs */}
            {uploadedDesigns.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Uploaded Designs</h3>
                <div className="space-y-3">
                  {uploadedDesigns.map((design) => (
                    <div key={design.id} className={`p-3 rounded-lg border-2 ${
                      selectedDesign === design.id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {design.file.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {design.size} • {getPositionForDesign(design.position)?.name}
                          </div>
                              </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setSelectedDesign(selectedDesign === design.id ? null : design.id)}
                            className="p-1 text-gray-600 hover:text-gray-800"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                              <button
                            onClick={() => removeDesign(design.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                              >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                              </button>
                        </div>
                      </div>
                      
                      {selectedDesign === design.id && (
                        <div className="space-y-2 pt-2 border-t border-gray-200">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Position</label>
                            <select
                              value={design.position}
                              onChange={(e) => updateDesignPosition(design.id, e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              {DESIGN_POSITIONS.map((pos) => (
                                <option key={pos.id} value={pos.id}>{pos.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                            <select
                              value={design.size}
                              onChange={(e) => updateDesignSize(design.id, e.target.value as 'A3' | 'A4')}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="A4">A4 (210 × 297mm)</option>
                              <option value="A3">A3 (297 × 420mm)</option>
                            </select>
                              </div>
                        </div>
                      )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

            {/* Canvas Controls */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Canvas Controls</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showGuides}
                    onChange={(e) => setShowGuides(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Show position guides</span>
                      </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showRulers}
                    onChange={(e) => setShowRulers(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Show rulers and grid</span>
                      </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Enable auto-snapping</span>
                </label>
                
                <div className="border-t pt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shirt View
                  </label>
                  <div className="flex space-x-2">
                      <button
                      onClick={() => setShirtView('front')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                        shirtView === 'front'
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      Front
                      </button>
                    <button
                      onClick={() => setShirtView('back')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                        shirtView === 'back'
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      Back
                    </button>
            </div>
          </div>
          
          {/* 3D Preview Toggle - DISABLED FOR DEPLOYMENT */}
          {/*
          <div className="border-t pt-3">
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={show3DPreview}
                onChange={(e) => setShow3DPreview(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium">Show 3D Preview</span>
            </label>
            <p className="text-xs text-gray-500">
              Enable interactive 3D preview of your design
            </p>
          </div>
          */}
                
                <div className="border-t pt-3">
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={isEditingPositions}
                      onChange={(e) => setIsEditingPositions(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Edit position guides</span>
                  </label>
                  
                  {isEditingPositions && (
                    <div className="space-y-2 pl-6">
                      <p className="text-xs text-gray-500">
                        Drag the position guides to adjust their placement
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={savePositions}
                          className="flex-1 px-3 py-1 bg-green-100 text-green-700 border border-green-300 rounded text-xs font-medium hover:bg-green-200"
                        >
                          Save
                        </button>
                        <button
                          onClick={resetPositions}
                          className="flex-1 px-3 py-1 bg-red-100 text-red-700 border border-red-300 rounded text-xs font-medium hover:bg-red-200"
                        >
                          Reset
                        </button>
              </div>
                </div>
                  )}
              </div>

                <button
                  onClick={exportDesign}
                  disabled={uploadedDesigns.length === 0}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export Design
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Design Preview</h3>
              <div className="flex justify-center">
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <Stage
                    ref={stageRef}
                    width={800}
                    height={700}
                    className="bg-white"
                  >
                  <Layer>
                    {/* Background Pattern */}
                    <Rect
                      x={0}
                      y={0}
                      width={800}
                      height={700}
                      fill="#f8fafc"
                    />
                    
                    {/* Rulers and Grid */}
                    {renderRulers()}
                    
                    {/* Shirt Background - 750x750 template centered */}
                    {shirtView === 'front' && shirtImage && (
                      <Image
                        image={shirtImage}
                        width={750}
                        height={750}
                        x={25}
                        y={-25}
                      />
                    )}
                    {shirtView === 'back' && backShirtImage && (
                      <Image
                        image={backShirtImage}
                        width={750}
                        height={750}
                        x={25}
                        y={-25}
                      />
                    )}

                    {/* Position Guides */}
                    {showGuides && customPositions.map((position) => {
                      const isActivePosition = draggedDesign && uploadedDesigns.find(d => d.id === draggedDesign)?.position === position.id;
                      
                      // Show different positions based on view
                      const shouldShowPosition = 
                        (shirtView === 'front' && (position.id.includes('chest') || position.id === 'center-chest')) ||
                        (shirtView === 'back' && (position.id.includes('back') || position.id === 'center-chest'));
                      
                      if (!shouldShowPosition) return null;
                      
                      return (
                        <React.Fragment key={position.id}>
                          <Rect
                            x={position.x}
                            y={position.y}
                            width={position.width}
                            height={position.height}
                            stroke={
                              isActivePosition 
                                ? '#10B981' 
                                : selectedPosition === position.id 
                                  ? '#7C3AED' 
                                  : '#D1D5DB'
                            }
                            strokeWidth={
                              isActivePosition 
                                ? 4 
                                : selectedPosition === position.id 
                                  ? 3 
                                  : 2
                            }
                            dash={
                              isActivePosition 
                                ? [10, 5] 
                                : selectedPosition === position.id 
                                  ? [8, 4] 
                                  : [5, 5]
                            }
                            fill={
                              isActivePosition 
                                ? 'rgba(16, 185, 129, 0.2)' 
                                : selectedPosition === position.id 
                                  ? 'rgba(124, 58, 237, 0.1)' 
                                  : 'transparent'
                            }
                            cornerRadius={4}
                            draggable={isEditingPositions}
                            onDragMove={(e) => {
                              if (isEditingPositions) {
                                // Apply snapping during drag for real-time feedback
                                const snapped = snapToShirtAreas(e.target.x(), e.target.y());
                                const gridSnapped = snapToNearestGrid(snapped.x, snapped.y);
                                e.target.x(gridSnapped.x);
                                e.target.y(gridSnapped.y);
                              }
                            }}
                            onDragEnd={(e) => {
                              if (isEditingPositions) {
                                handlePositionDrag(position.id, e.target.x(), e.target.y());
                              }
                            }}
                          />
                          {(selectedPosition === position.id || isActivePosition) && (
                            <Text
                              x={position.x + position.width / 2}
                              y={position.y - 10}
                              text={position.name}
                              fontSize={14}
                              fontFamily="Arial"
                              fill={isActivePosition ? '#10B981' : '#7C3AED'}
                              align="center"
                              verticalAlign="middle"
                              offsetX={position.name.length * 3.5}
                              offsetY={7}
                              fontStyle="bold"
                            />
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* Uploaded Designs */}
                    {uploadedDesigns.map((design) => {
                      const position = getPositionForDesign(design.position);
                      if (!position) return null;

                      // Show designs based on current view
                      const shouldShowDesign = 
                        (shirtView === 'front' && (design.position.includes('chest') || design.position === 'center-chest')) ||
                        (shirtView === 'back' && (design.position.includes('back') || design.position === 'center-chest'));
                      
                      if (!shouldShowDesign) return null;

                      // Calculate design dimensions based on A3/A4 and position area
                      const designWidth = design.size === 'A4' ? position.width * 0.8 : position.width;
                      const designHeight = design.size === 'A4' ? position.height * 0.8 : position.height;

                      // Use custom position if available, otherwise center in position
                      const designX = design.x !== undefined ? design.x : position.x + (position.width - designWidth) / 2;
                      const designY = design.y !== undefined ? design.y : position.y + (position.height - designHeight) / 2;

                      return (
                        <Image
                          key={design.id}
                          image={design.image}
                          x={designX}
                          y={designY}
                          width={designWidth}
                          height={designHeight}
                          draggable
                          onDragStart={() => handleDesignDragStart(design.id)}
                          onDragMove={(e) => {
                            // Apply snapping during drag for real-time feedback
                            const snapped = snapToShirtAreas(e.target.x(), e.target.y());
                            const gridSnapped = snapToNearestGrid(snapped.x, snapped.y);
                            e.target.x(gridSnapped.x);
                            e.target.y(gridSnapped.y);
                          }}
                          onDragEnd={(e) => {
                            handleDesignDrag(design.id, e.target.x(), e.target.y());
                          }}
                        />
                      );
                    })}
                  </Layer>
                </Stage>
                  </div>
                </div>

              <div className="mt-4 text-sm text-gray-500 text-center">
                <div className="flex justify-center items-center space-x-4 mb-2 flex-wrap">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span>Selected Position</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-300 rounded"></div>
                    <span>Available Positions</span>
                  </div>
                  {isEditingPositions && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <span>Draggable Guides</span>
                  </div>
                  )}
                  {showRulers && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Rulers & Grid</span>
                </div>
                  )}
                  </div>
                <p>• Toggle between Front and Back views to see different shirt sides</p>
                <p>• Drag designs to reposition them within their position areas</p>
                <p>• Designs are constrained to stay within their assigned position boundaries</p>
                {snapToGrid && (
                  <p className="text-green-600 font-medium">• Auto-snapping helps align elements to key shirt areas</p>
                )}
                {showRulers && (
                  <p className="text-blue-600 font-medium">• Use rulers and grid to precisely center elements</p>
                )}
                {isEditingPositions && (
                  <p className="text-orange-600 font-medium">• Drag position guides to customize placement</p>
                )}
                <p>• Export your final design when ready</p>
                </div>
              </div>
            </div>
          </div>
      </main>

      <Footer />
    </div>
  );
}