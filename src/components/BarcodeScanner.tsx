'use client';

import { useState, useEffect, useRef } from 'react';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && !scanning) {
      startScanning();
    } else if (!isOpen) {
      stopScanning();
    }
  }, [isOpen, scanning]);

  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);

      // Check if device supports camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start scanning loop
      scanLoop();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start camera');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    setScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const scanLoop = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Simple barcode detection (this is a basic implementation)
    // In a real app, you'd use a library like QuaggaJS or ZXing
    const detectedBarcode = detectBarcode(imageData);
    
    if (detectedBarcode) {
      onScan(detectedBarcode);
      stopScanning();
      return;
    }

    // Continue scanning
    requestAnimationFrame(scanLoop);
  };

  // Basic barcode detection (simplified)
  const detectBarcode = (imageData: ImageData): string | null => {
    // This is a placeholder implementation
    // In reality, you'd use a proper barcode detection library
    // For now, we'll just return null to indicate no barcode found
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Scan Barcode</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-600 mb-4">
              You can manually enter the barcode/tracking number below:
            </p>
            <input
              type="text"
              placeholder="Enter barcode manually..."
              className="w-full p-2 border border-gray-300 rounded-md"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  if (target.value.trim()) {
                    onScan(target.value.trim());
                  }
                }
              }}
            />
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-gray-900 rounded-lg"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white rounded-lg p-4">
                <div className="w-48 h-32 border-2 border-red-500 rounded-lg relative">
                  <div className="absolute inset-0 border-2 border-transparent border-t-red-500 animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Position the barcode within the frame
              </p>
              <button
                onClick={stopScanning}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Stop Scanning
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 