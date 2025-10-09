import { useRef, useCallback } from 'react';

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [getContext]);

  const drawImage = useCallback((
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number = 0,
    opacity: number = 1
  ) => {
    const ctx = getContext();
    if (!ctx) return;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
  }, [getContext]);

  const getImageData = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }, []);

  return {
    canvasRef,
    getContext,
    clearCanvas,
    drawImage,
    getImageData
  };
}

