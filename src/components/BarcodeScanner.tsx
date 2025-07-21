'use client';

import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setScanning(true);
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;
    let active = true;
    codeReader.decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
      if (result && active) {
        onScan(result.getText());
        active = false;
        // Only use _controls.stop for cleanup
        setScanning(false);
      }
      if (err && err.name !== 'NotFoundException') {
        setError('Scan error: ' + err.message);
      }
    });
    return () => {
      active = false;
      if ((codeReader as any)._controls?.stop) {
        (codeReader as any)._controls.stop();
      }
      codeReaderRef.current = null;
    };
    // eslint-disable-next-line
  }, [isOpen]);

  const stopScanning = () => {
    setScanning(false);
    if (codeReaderRef.current) {
      if ((codeReaderRef.current as any)._controls?.stop) {
        (codeReaderRef.current as any)._controls.stop();
      }
      codeReaderRef.current = null;
    }
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
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 bg-gray-900 rounded-lg overflow-hidden"
            autoPlay
            playsInline
            muted
          />
          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-white rounded-lg p-4">
              <div className="w-48 h-32 border-2 border-red-500 rounded-lg relative">
                <div className="absolute inset-0 border-2 border-transparent border-t-red-500 animate-pulse"></div>
              </div>
            </div>
          </div>
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
        )}
      </div>
    </div>
  );
} 