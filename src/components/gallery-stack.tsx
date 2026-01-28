"use client";

import { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Pagination } from "swiper/modules";
import { X, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";

import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/pagination";

interface GalleryImage {
    id: number;
    imageUrl: string;
    thumbnailUrl?: string | null;
    title?: string | null;
    caption?: string | null;
    category?: string | null;
}

interface GalleryStackProps {
    images: GalleryImage[];
    className?: string;
}

/**
 * GalleryStack - Mobile-first card stack gallery with Swiper
 * Features:
 * - Card stack effect (swipe to throw cards)
 * - Vertical 3:4 aspect ratio for cards
 * - Lightbox modal with object-contain for full image view
 */
export function GalleryStack({ images, className }: GalleryStackProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (images.length === 0) {
        return null;
    }

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);

    const goToNext = () => {
        if (lightboxIndex === null) return;
        setLightboxIndex((lightboxIndex + 1) % images.length);
    };

    const goToPrev = () => {
        if (lightboxIndex === null) return;
        setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (lightboxIndex === null) return;
        if (e.key === "ArrowRight") goToNext();
        if (e.key === "ArrowLeft") goToPrev();
        if (e.key === "Escape") closeLightbox();
    };

    return (
        <section id="gallery" className={`section-padding px-6 ${className || ""}`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <span className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.2em] uppercase text-accent-coral mb-4">
                        Gallery
                    </span>
                    <h2 className="font-display text-display-lg tracking-wider uppercase">
                        Photo Gallery
                    </h2>
                    <p className="text-muted-foreground mt-4 max-w-md mx-auto">
                        Swipe through photos. Tap to view full size.
                    </p>
                </div>

                {/* Card Stack Swiper - LARGER SIZE */}
                <div className="w-full max-w-xl mx-auto py-10 px-4">
                    <Swiper
                        effect="cards"
                        grabCursor={true}
                        modules={[EffectCards, Pagination]}
                        pagination={{ clickable: true }}
                        className="gallery-stack-swiper w-full max-w-[500px] aspect-[3/4] mx-auto"
                        cardsEffect={{
                            perSlideOffset: 8,
                            perSlideRotate: 2,
                            rotate: true,
                            slideShadows: true,
                        }}
                    >
                        {images.map((image, index) => (
                            <SwiperSlide key={image.id}>
                                {/* SOLID CARD CONTAINER - Adaptive theme background */}
                                <div
                                    className="relative aspect-[3/4] w-full bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden cursor-pointer group transition-colors duration-300"
                                    onClick={() => openLightbox(index)}
                                >
                                    {/* Image with object-contain for FULL visibility, no cropping */}
                                    <Image
                                        src={image.thumbnailUrl || image.imageUrl}
                                        alt={image.title || `Gallery photo ${index + 1}`}
                                        fill
                                        className="w-full h-full object-contain p-3"
                                        sizes="(max-width: 640px) 90vw, 500px"
                                    />
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <Maximize2 size={32} className="text-white" />
                                    </div>
                                    {/* Caption at bottom */}
                                    {image.title && (
                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                            <p className="text-white font-medium">{image.title}</p>
                                            {image.caption && (
                                                <p className="text-white/80 text-sm">{image.caption}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Counter - with more spacing to avoid overlap */}
                    <p className="text-center text-sm text-muted-foreground mt-12 pt-4">
                        {images.length} photos • Swipe to explore
                    </p>
                </div>
            </div>

            {/* ========================================
          LIGHTBOX MODAL (Full View)
          ======================================== */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-lg flex items-center justify-center"
                    onClick={closeLightbox}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                >
                    {/* Close button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-colors"
                        aria-label="Close lightbox"
                    >
                        <X size={24} className="text-white" />
                    </button>

                    {/* Navigation arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-colors"
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={24} className="text-white" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-colors"
                                aria-label="Next image"
                            >
                                <ChevronRight size={24} className="text-white" />
                            </button>
                        </>
                    )}

                    {/* Image container - object-contain for FULL image visibility */}
                    <div
                        className="relative w-full h-full max-w-5xl max-h-[85vh] p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={images[lightboxIndex].imageUrl}
                            alt={images[lightboxIndex].title || "Gallery image"}
                            fill
                            className="object-contain"
                            sizes="100vw"
                            priority
                        />
                    </div>

                    {/* Caption & Counter */}
                    <div className="absolute bottom-6 left-0 right-0 text-center text-white">
                        {images[lightboxIndex].title && (
                            <p className="font-medium text-lg">{images[lightboxIndex].title}</p>
                        )}
                        {images[lightboxIndex].caption && (
                            <p className="text-white/80 text-sm mt-1">{images[lightboxIndex].caption}</p>
                        )}
                        <p className="text-white/60 text-sm mt-2">
                            {lightboxIndex + 1} / {images.length}
                        </p>
                    </div>
                </div>
            )}

            {/* Custom Swiper styles */}
            <style jsx global>{`
        .gallery-stack-swiper {
          overflow: visible !important;
        }
        .gallery-stack-swiper .swiper-wrapper {
          overflow: visible !important;
        }
        .gallery-stack-swiper .swiper-slide {
          border-radius: 1.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        .gallery-stack-swiper .swiper-pagination {
          bottom: -30px !important;
        }
        .gallery-stack-swiper .swiper-pagination-bullet {
          background: var(--accent-coral, #f97316);
          opacity: 0.4;
        }
        .gallery-stack-swiper .swiper-pagination-bullet-active {
          opacity: 1;
        }
        /* ========================================
           SIMPLE HOVER EFFECT - Scale Only
           No rotation, no translation, just grow
           ======================================== */
        .gallery-stack-swiper:hover {
          transform: scale(1.02);
        }
        .gallery-stack-swiper {
          transition: transform 0.3s ease-out;
        }
      `}</style>
        </section>
    );
}

export default GalleryStack;
