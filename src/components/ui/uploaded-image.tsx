"use client";

import Image from "next/image";

/**
 * UploadedImage Component
 * 
 * For images from /uploads/ (admin uploads), uses native <img> to bypass
 * Next.js Image Optimizer which fails with nginx reverse proxy.
 * 
 * For other sources (CDN, external URLs), uses next/image with unoptimized.
 */

interface UploadedImageProps {
    src: string | null | undefined;
    alt: string;
    fill?: boolean;
    width?: number;
    height?: number;
    sizes?: string;
    className?: string;
    style?: React.CSSProperties;
    priority?: boolean;
    loading?: "lazy" | "eager";
    quality?: number;
    objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
}

function isUploadPath(src: string | null | undefined): boolean {
    if (!src) return false;
    // Match /uploads/ paths (what admin uploads produce)
    return src.startsWith("/uploads/") || src.includes("/uploads/");
}

export function UploadedImage({
    src,
    alt,
    fill,
    width,
    height,
    sizes,
    className = "",
    style,
    priority,
    loading = "lazy",
    objectFit = "cover",
}: UploadedImageProps) {
    // Handle empty src
    if (!src) {
        return null;
    }

    // For /uploads/ paths, use native <img> to bypass optimizer
    if (isUploadPath(src)) {
        // Build style object for fill mode
        const imgStyle: React.CSSProperties = {
            ...style,
            objectFit,
        };

        if (fill) {
            imgStyle.position = "absolute";
            imgStyle.inset = 0;
            imgStyle.width = "100%";
            imgStyle.height = "100%";
        }

        return (
            <img
                src={src}
                alt={alt}
                width={fill ? undefined : width}
                height={fill ? undefined : height}
                loading={priority ? "eager" : loading}
                decoding="async"
                className={className}
                style={imgStyle}
            />
        );
    }

    // For external URLs, CDN images, or data URLs - use next/image with unoptimized
    if (fill) {
        return (
            <Image
                src={src}
                alt={alt}
                fill
                sizes={sizes}
                className={className}
                style={style}
                priority={priority}
                unoptimized
            />
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            width={width || 400}
            height={height || 300}
            sizes={sizes}
            className={className}
            style={style}
            priority={priority}
            unoptimized
        />
    );
}

/**
 * Helper to check if src is an upload path (for conditional rendering)
 */
export { isUploadPath };
