/**
 * Image & Media Utilities
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropResult {
  blob: Blob;
  dataUrl: string;
  file: File;
}

/**
 * Canvas-based image cropping
 */
export async function getCroppedImg(
  imageSrc: string,
  cropArea: CropArea,
  outputWidth?: number,
  quality: number = 0.92
): Promise<CropResult> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    
    image.onload = () => {
      const sourceX = (cropArea.x / 100) * image.naturalWidth;
      const sourceY = (cropArea.y / 100) * image.naturalHeight;
      const sourceWidth = (cropArea.width / 100) * image.naturalWidth;
      const sourceHeight = (cropArea.height / 100) * image.naturalHeight;

      const maxWidth = outputWidth || Math.min(sourceWidth, 1920);
      const aspectRatio = sourceWidth / sourceHeight;
      const finalWidth = Math.round(maxWidth);
      const finalHeight = Math.round(maxWidth / aspectRatio);

      const canvas = document.createElement("canvas");
      canvas.width = finalWidth;
      canvas.height = finalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        image,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, finalWidth, finalHeight
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: "image/jpeg" });
          resolve({ blob, dataUrl, file });
        },
        "image/jpeg",
        quality
      );
    };

    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageSrc;
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}

export function calculateInitialCropArea(
  imageWidth: number,
  imageHeight: number,
  targetAspect: number
): CropArea {
  const imageAspect = imageWidth / imageHeight;
  let cropWidth: number, cropHeight: number;
  
  if (imageAspect > targetAspect) {
    cropHeight = 100;
    cropWidth = (targetAspect / imageAspect) * 100;
  } else {
    cropWidth = 100;
    cropHeight = (imageAspect / targetAspect) * 100;
  }
  
  return {
    x: (100 - cropWidth) / 2,
    y: (100 - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  };
}

// ========================================
// YOUTUBE UTILITIES
// ========================================

/**
 * Extracts YouTube video ID from various URL formats
 * Supports: youtube.com/watch, youtu.be, youtube.com/embed, youtube.com/shorts
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Clean the URL
  url = url.trim();
  
  // Pattern for various YouTube URL formats
  const patterns = [
    // youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // youtube.com/v/VIDEO_ID
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    // youtube.com/shorts/VIDEO_ID
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    // Just the video ID (11 chars)
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Converts any YouTube URL to an embed URL
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Gets YouTube thumbnail URL
 * Quality options: default, mq, hq, sd, maxres
 * maxresdefault = highest quality (1280x720)
 */
export function getYouTubeThumbnail(
  url: string, 
  quality: "default" | "mq" | "hq" | "sd" | "maxres" = "maxres"
): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  
  const qualityMap = {
    default: "default",      // 120x90
    mq: "mqdefault",         // 320x180
    hq: "hqdefault",         // 480x360
    sd: "sddefault",         // 640x480
    maxres: "maxresdefault", // 1280x720 (may not exist for all videos)
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Gets high-quality thumbnail with fallback
 * Returns maxres if available, falls back to hq
 */
export function getYouTubeThumbnailWithFallback(url: string): {
  primary: string | null;
  fallback: string | null;
} {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return { primary: null, fallback: null };
  
  return {
    primary: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    fallback: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };
}

/**
 * Validates if a string is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}
