"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { UploadedImage } from "@/components/ui/uploaded-image";
import { getImageUrl } from "@/lib/image-url";


interface BioImage {
    id: number;
    imageUrl: string;
    caption?: string | null;
}

interface Artist {
    name?: string | null;
    bio: string;
}

interface BioSectionProps {
    artist: Artist | null;
    bioImages?: BioImage[];
    maxChars?: number;
    className?: string;
}

export function BioSection({ artist, bioImages = [], className }: BioSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!artist) return null;

    // Parse bio to get plain text for truncation
    const bioHtml = artist.bio || "";
    const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (tempDiv) tempDiv.innerHTML = bioHtml;
    const plainTextBio = tempDiv ? (tempDiv.textContent || tempDiv.innerText || "") : bioHtml.replace(/<[^>]*>/g, '');

    // Shorter max chars for mobile-friendly display (200 chars collapsed)
    const maxChars = 200;
    const shouldTruncate = plainTextBio.length > maxChars;

    // Only use bioImages from database - no fallback to hero image
    const images = bioImages;
    const hasImages = images.length > 0;
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
        <section id="about" className={`section-padding px-4 sm:px-6 ${className || ""}`}>
            <div className="max-w-5xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <span className="text-sm font-medium tracking-[0.2em] uppercase text-accent-coral mb-3 block">
                        The Artist
                    </span>
                    <h2 className="font-display text-display-md sm:text-display-lg tracking-wider uppercase">
                        About
                    </h2>
                </div>

                {/* Content Layout - Stacked on mobile, side-by-side on desktop */}
                <div className={`${hasImages ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start' : ''}`}>

                    {/* Image Section - Only show if images exist */}
                    {hasImages && (
                        <div className="order-1">
                            <div className="relative aspect-square sm:aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden glass-card group max-w-md mx-auto lg:max-w-none">
                                {/* Current Image */}
                                <div className="absolute inset-0">
                                    <UploadedImage
                                        src={getImageUrl(images[currentImageIndex].imageUrl)}
                                        alt={images[currentImageIndex].caption || artist.name || "Artist"}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>

                                {/* Caption Overlay */}
                                {images[currentImageIndex].caption && (
                                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/60 to-transparent">
                                        <p className="text-white text-xs sm:text-sm">{images[currentImageIndex].caption}</p>
                                    </div>
                                )}

                                {/* Navigation Arrows - Only for multiple images */}
                                {hasMultipleImages && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full glass flex items-center justify-center opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Previous image"
                                        >
                                            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full glass flex items-center justify-center opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Next image"
                                        >
                                            <ChevronRight size={18} className="sm:w-5 sm:h-5" />
                                        </button>

                                        {/* Dots Indicator */}
                                        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2">
                                            {images.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentImageIndex(idx)}
                                                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${idx === currentImageIndex
                                                        ? "bg-white w-3 sm:w-4"
                                                        : "bg-white/50 hover:bg-white/70"
                                                        }`}
                                                    aria-label={`View image ${idx + 1}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Bio Text Section */}
                    <div className={`order-2 ${hasImages ? '' : 'max-w-2xl mx-auto text-center'}`}>
                        <div className="glass-card p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                            {/* Bio Content - Simple and Clean */}
                            <div
                                className={`prose prose-sm sm:prose-base dark:prose-invert text-muted-foreground leading-relaxed ${!isExpanded && shouldTruncate
                                    ? "line-clamp-4"
                                    : ""
                                    }`}
                            >
                                <div dangerouslySetInnerHTML={{ __html: isExpanded || !shouldTruncate ? bioHtml : bioHtml }} />
                            </div>

                            {/* Show full text or truncated based on state */}
                            {shouldTruncate && !isExpanded && (
                                <div className="mt-3 text-sm text-muted-foreground/70">...</div>
                            )}

                            {/* Read More / Show Less Button */}
                            {shouldTruncate && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="mt-4 text-accent-coral hover:text-accent-coral/80 font-medium text-sm transition-colors inline-flex items-center gap-1.5"
                                >
                                    {isExpanded ? "Show Less" : "Read More"}
                                    <span className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>↓</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
