"use client";

/**
 * Client-side image compression utility
 * Resizes images to a max dimension and compresses to reduce Base64 size
 * This prevents database truncation and improves upload performance
 */

interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputType?: "image/jpeg" | "image/png" | "image/webp";
}

const defaultOptions: CompressionOptions = {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8,
    outputType: "image/jpeg",
};

/**
 * Compress an image file and return a Base64 data URL
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<string> - Compressed Base64 data URL
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<string> {
    const opts = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                let { width, height } = img;
                const maxW = opts.maxWidth!;
                const maxH = opts.maxHeight!;

                if (width > maxW || height > maxH) {
                    const ratio = Math.min(maxW / width, maxH / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                // Create canvas and draw resized image
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }

                // Use high-quality image smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";

                // Draw the image
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to Base64
                const dataUrl = canvas.toDataURL(opts.outputType, opts.quality);

                // Log compression results for debugging
                const originalSizeKB = Math.round(file.size / 1024);
                const compressedSizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);
                console.log(
                    `Image compressed: ${originalSizeKB}KB → ~${compressedSizeKB}KB (${width}x${height})`
                );

                resolve(dataUrl);
            };

            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}

/**
 * Compress multiple image files
 * @param files - Array of image files
 * @param options - Compression options
 * @returns Promise<string[]> - Array of compressed Base64 data URLs
 */
export async function compressImages(
    files: File[],
    options: CompressionOptions = {}
): Promise<string[]> {
    const promises = files.map((file) => compressImage(file, options));
    return Promise.all(promises);
}

/**
 * Create a thumbnail version of an image (smaller, more compressed)
 * @param file - The image file
 * @returns Promise<string> - Thumbnail Base64 data URL
 */
export async function createThumbnail(file: File): Promise<string> {
    return compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.7,
        outputType: "image/jpeg",
    });
}
