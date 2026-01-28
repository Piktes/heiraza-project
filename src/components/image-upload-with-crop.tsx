"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Upload, X, Check, RotateCcw, Move } from "lucide-react";
import { 
  getCroppedImg, 
  fileToDataUrl, 
  getImageDimensions, 
  calculateInitialCropArea,
  type CropArea 
} from "@/lib/image-utils";

interface ImageUploadWithCropProps {
  aspect?: number;
  currentImage?: string | null;
  onUpload: (file: File, dataUrl: string) => void;
  label?: string;
  helpText?: string;
  className?: string;
  maxWidth?: number;
}

export function ImageUploadWithCrop({
  aspect = 16 / 9,
  currentImage,
  onUpload,
  label = "Upload Image",
  helpText,
  className = "",
  maxWidth = 1920,
}: ImageUploadWithCropProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset preview when currentImage changes
  useEffect(() => {
    if (currentImage && !originalImage) {
      setPreview(currentImage);
    }
  }, [currentImage, originalImage]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setOriginalImage(dataUrl);
      
      // Get image dimensions and calculate initial crop area
      const dimensions = await getImageDimensions(dataUrl);
      const initialCrop = calculateInitialCropArea(dimensions.width, dimensions.height, aspect);
      setCropArea(initialCrop);
      
      setIsCropping(true);
    } catch (error) {
      console.error("Error loading image:", error);
      alert("Failed to load image");
    }
  }, [aspect]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
    
    setDragStart({
      x: mouseX - cropArea.x,
      y: mouseY - cropArea.y,
    });
  }, [cropArea.x, cropArea.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
    
    let newX = mouseX - dragStart.x;
    let newY = mouseY - dragStart.y;
    
    // Constrain within bounds
    newX = Math.max(0, Math.min(100 - cropArea.width, newX));
    newY = Math.max(0, Math.min(100 - cropArea.height, newY));
    
    setCropArea(prev => ({
      ...prev,
      x: newX,
      y: newY,
    }));
  }, [isDragging, dragStart, cropArea.width, cropArea.height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const touchX = ((touch.clientX - rect.left) / rect.width) * 100;
    const touchY = ((touch.clientY - rect.top) / rect.height) * 100;
    
    setIsDragging(true);
    setDragStart({
      x: touchX - cropArea.x,
      y: touchY - cropArea.y,
    });
  }, [cropArea.x, cropArea.y]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current || e.touches.length !== 1) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const touchX = ((touch.clientX - rect.left) / rect.width) * 100;
    const touchY = ((touch.clientY - rect.top) / rect.height) * 100;
    
    let newX = touchX - dragStart.x;
    let newY = touchY - dragStart.y;
    
    newX = Math.max(0, Math.min(100 - cropArea.width, newX));
    newY = Math.max(0, Math.min(100 - cropArea.height, newY));
    
    setCropArea(prev => ({
      ...prev,
      x: newX,
      y: newY,
    }));
  }, [isDragging, dragStart, cropArea.width, cropArea.height]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const applyCrop = useCallback(async () => {
    if (!originalImage) return;
    
    setIsProcessing(true);
    
    try {
      // Use the canvas-based cropping utility
      const result = await getCroppedImg(originalImage, cropArea, maxWidth);
      
      setPreview(result.dataUrl);
      setIsCropping(false);
      setOriginalImage(null);
      
      // Pass the cropped file to parent
      onUpload(result.file, result.dataUrl);
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Failed to crop image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, cropArea, maxWidth, onUpload]);

  const resetCrop = useCallback(async () => {
    if (!originalImage) return;
    
    try {
      const dimensions = await getImageDimensions(originalImage);
      const initialCrop = calculateInitialCropArea(dimensions.width, dimensions.height, aspect);
      setCropArea(initialCrop);
    } catch (error) {
      console.error("Error resetting crop:", error);
    }
  }, [originalImage, aspect]);

  const cancelCrop = useCallback(() => {
    setIsCropping(false);
    setOriginalImage(null);
    // Keep the previous preview if it exists
    if (!preview) {
      setPreview(currentImage || null);
    }
  }, [currentImage, preview]);

  const clearImage = useCallback(() => {
    setPreview(null);
    setOriginalImage(null);
    setIsCropping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const getAspectLabel = () => {
    if (aspect === 1) return "1:1 (Square)";
    if (aspect === 16/9) return "16:9 (Landscape)";
    if (aspect === 4/5) return "4:5 (Portrait)";
    if (aspect === 9/16) return "9:16 (Vertical)";
    return `${aspect.toFixed(2)}`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium">{label}</label>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {isCropping && originalImage ? (
        /* ========================================
           CROP INTERFACE
           ======================================== */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Move size={16} />
              Drag to position the crop area
            </span>
            <span>Aspect: {getAspectLabel()}</span>
          </div>
          
          <div
            ref={containerRef}
            className="relative bg-black rounded-xl overflow-hidden select-none"
            style={{ aspectRatio: aspect }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Original Image (dimmed) */}
            <img
              src={originalImage}
              alt="Original"
              className="absolute inset-0 w-full h-full object-contain opacity-40 pointer-events-none"
              draggable={false}
            />
            
            {/* Crop Area Overlay */}
            <div
              className="absolute border-2 border-white cursor-move"
              style={{
                left: `${cropArea.x}%`,
                top: `${cropArea.y}%`,
                width: `${cropArea.width}%`,
                height: `${cropArea.height}%`,
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
              }}
            >
              {/* Cropped Image Preview inside the box */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={originalImage}
                  alt="Crop preview"
                  className="absolute pointer-events-none"
                  style={{
                    left: `${-cropArea.x * (100 / cropArea.width)}%`,
                    top: `${-cropArea.y * (100 / cropArea.height)}%`,
                    width: `${100 * (100 / cropArea.width)}%`,
                    height: `${100 * (100 / cropArea.height)}%`,
                    maxWidth: "none",
                  }}
                  draggable={false}
                />
              </div>
              
              {/* Corner Handles */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
              
              {/* Rule of Thirds Grid */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/30" />
                ))}
              </div>
            </div>
          </div>

          {/* Crop Controls */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={resetCrop}
              className="p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm"
              title="Reset position"
            >
              <RotateCcw size={18} />
              Reset
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelCrop}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCrop}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-accent-coral text-white hover:bg-accent-coral/90 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Apply Crop
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : preview ? (
        /* ========================================
           PREVIEW MODE
           ======================================== */
        <div className="relative">
          <div
            className="relative rounded-xl overflow-hidden bg-muted"
            style={{ aspectRatio: aspect }}
          >
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized={preview.startsWith("data:")}
            />
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
              title="Change image"
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={clearImage}
              className="p-2 rounded-lg bg-black/50 text-white hover:bg-red-500 transition-colors"
              title="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* ========================================
           UPLOAD BUTTON
           ======================================== */
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl hover:border-accent-coral/50 hover:bg-accent-coral/5 transition-all"
          style={{ aspectRatio: aspect > 1.5 ? 16/9 : aspect }}
        >
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Upload size={32} className="mb-3" />
            <span className="text-sm font-medium">Click to upload</span>
            <span className="text-xs mt-1">Aspect ratio: {getAspectLabel()}</span>
          </div>
        </button>
      )}

      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}
