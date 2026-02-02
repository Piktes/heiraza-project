"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";


interface BioImage {
    id: number;
    imageUrl: string;
    caption?: string | null;
}

interface Artist {
    name?: string | null;
    bio: string;
    heroImage?: string | null;
    // Yeni DB yapımıza uygun düz sütunlar:
    facebookUrl?: string | null;
    instagramUrl?: string | null;
    tiktokUrl?: string | null;
    youtubeUrl?: string | null;
    spotifyUrl?: string | null;
    twitterUrl?: string | null;
    soundcloudUrl?: string | null;
    appleMusicUrl?: string | null;
}

interface BioSectionProps {
    artist: Artist | null;
    bioImages?: BioImage[];
    maxChars?: number;
    className?: string;
}

export function BioSection({ artist, bioImages = [], maxChars = 500, className }: BioSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!artist) return null;

    const bio = artist.bio || "";
    const shouldTruncate = bio.length > maxChars;

    // Use bio images if available, otherwise fall back to hero image
    const images = bioImages.length > 0
        ? bioImages
        : artist.heroImage
            ? [{ id: 0, imageUrl: artist.heroImage, caption: null }]
            : [];

    const hasMultipleImages = images.length > 1;

    const nextImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    // Auto-advance for multiple images
    useEffect(() => {
        if (!hasMultipleImages) return;
        const interval = setInterval(nextImage, 5000);
        return () => clearInterval(interval);
    }, [hasMultipleImages, nextImage]);

    return (
        <section id="about" className={`section-padding px-6 ${className || ""}`}>
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Image Slider - Mobile: Bottom / Desktop: Left */}
                    <div className="order-2 lg:order-1">
                        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden glass-card group">
                            {images.length > 0 && (
                                <>
                                    {/* Current Image */}
                                    <div className="absolute inset-0">
                                        <Image
                                            src={images[currentImageIndex].imageUrl}
                                            alt={images[currentImageIndex].caption || artist.name || "Artist"}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    </div>

                                    {/* Caption */}
                                    {images[currentImageIndex].caption && (
                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                                            <p className="text-white text-sm">{images[currentImageIndex].caption}</p>
                                        </div>
                                    )}

                                    {/* Navigation Arrows */}
                                    {hasMultipleImages && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Previous image"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Next image"
                                            >
                                                <ChevronRight size={20} />
                                            </button>

                                            {/* Dots Indicator */}
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                                {images.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentImageIndex(idx)}
                                                        className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex
                                                            ? "bg-white w-4"
                                                            : "bg-white/50 hover:bg-white/70"
                                                            }`}
                                                        aria-label={`View image ${idx + 1}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Content - Mobile: Top / Desktop: Right */}
                    <div className="order-1 lg:order-2">
                        <span className="text-sm font-medium tracking-[0.2em] uppercase text-accent-coral mb-4 block">
                            The Artist
                        </span>
                        <h2 className="font-display text-display-lg tracking-wider uppercase mb-8">
                            About
                        </h2>

                        {/* Bio Text with Read More */}
                        <div
                            className={`prose prose-lg dark:prose-invert text-muted-foreground transition-all duration-500 ease-in-out ${!isExpanded && shouldTruncate
                                ? "max-h-[300px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]"
                                : ""
                                }`}
                        >
                            <div dangerouslySetInnerHTML={{ __html: bio }} />
                        </div>

                        {/* Read More / Show Less Button */}
                        {shouldTruncate && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="mt-4 text-accent-coral hover:text-accent-coral/80 font-medium text-sm transition-colors inline-flex items-center gap-1"
                            >
                                {isExpanded ? "Show Less" : "Read More"}
                                <span className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>↓</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
