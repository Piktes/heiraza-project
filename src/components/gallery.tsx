"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryImage {
  id: number;
  imageUrl: string;
  thumbnailUrl?: string | null;
  title?: string | null;
  caption?: string | null;
  category?: string | null;
}

interface GalleryProps {
  images: GalleryImage[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function Gallery({ images, columns = 3, className }: GalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(images.map(img => img.category).filter(Boolean)))] as string[];

  // Filter images
  const filteredImages = filter === "all"
    ? images
    : images.filter(img => img.category === filter);

  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);

  const goToNext = () => {
    if (selectedImage === null) return;
    setSelectedImage((selectedImage + 1) % filteredImages.length);
  };

  const goToPrev = () => {
    if (selectedImage === null) return;
    setSelectedImage((selectedImage - 1 + filteredImages.length) % filteredImages.length);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedImage === null) return;
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "ArrowLeft") goToPrev();
    if (e.key === "Escape") closeLightbox();
  };

  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <section id="gallery" className={`section-padding px-4 sm:px-6 ${className || ""}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 opacity-0 animate-fade-in">
          <span className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.2em] uppercase text-accent-coral mb-4">
            Gallery
          </span>
          <h2 className="font-display text-display-lg tracking-wider uppercase">
            Photo Gallery
          </h2>
        </div>

        {/* Category Filter */}
        {categories.length > 2 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10 opacity-0 animate-fade-in animate-delay-100">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${filter === category
                  ? "bg-accent-coral text-white shadow-lg shadow-accent-coral/25"
                  : "glass hover:bg-accent-coral/10"
                  }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* ========================================
            CARD STACK GALLERY GRID
            - aspect-[3/4] portrait cards
            - object-cover to Fill the card
            - Solid theme-aware background
            ======================================== */}
        <div className={`grid ${gridCols[columns]} gap-4 sm:gap-6`}>
          {filteredImages.map((image, idx) => (
            <div
              key={image.id}
              className="group cursor-pointer opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${idx * 50}ms`, animationFillMode: "forwards" }}
              onClick={() => openLightbox(idx)}
            >
              {/* Card Wrapper - Solid background, rounded, bordered */}
              <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-accent-coral/10 hover:-translate-y-1">
                {/* Image Container - Fixed 3:4 aspect ratio */}
                <div className="aspect-[3/4] relative">
                  {/* Image - object-cover ensures filling without empty space */}
                  <Image
                    src={image.thumbnailUrl || image.imageUrl}
                    alt={image.title || `Gallery image ${idx + 1}`}
                    fill
                    className="object-cover p-0 transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-xl">
                        <ZoomIn size={24} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title/Caption Section */}
                {(image.title || image.category) && (
                  <div className="p-3 border-t border-black/5 dark:border-white/5">
                    {image.title && (
                      <p className="font-medium text-sm truncate">{image.title}</p>
                    )}
                    {image.category && (
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{image.category}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ========================================
            LIGHTBOX
            ======================================== */}
        {selectedImage !== null && (
          <div
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fade-in"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
              aria-label="Close"
            >
              <X size={24} className="text-white" />
            </button>

            {/* Navigation - Previous */}
            <button
              onClick={(e) => { e.stopPropagation(); goToPrev(); }}
              className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
              aria-label="Previous"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>

            {/* Navigation - Next */}
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
              aria-label="Next"
            >
              <ChevronRight size={24} className="text-white" />
            </button>

            {/* Full Image - object-contain ensures no cropping */}
            <div
              className="relative max-w-5xl max-h-[85vh] w-full h-full m-4 sm:m-8"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={filteredImages[selectedImage].imageUrl}
                alt={filteredImages[selectedImage].title || "Gallery image"}
                fill
                className="object-contain"
              />
            </div>

            {/* Caption */}
            {(filteredImages[selectedImage].title || filteredImages[selectedImage].caption) && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center bg-black/50 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10">
                {filteredImages[selectedImage].title && (
                  <p className="text-white font-display text-lg">{filteredImages[selectedImage].title}</p>
                )}
                {filteredImages[selectedImage].caption && (
                  <p className="text-white/70 text-sm mt-1">{filteredImages[selectedImage].caption}</p>
                )}
              </div>
            )}

            {/* Counter */}
            <div className="absolute bottom-6 right-6 text-white/50 text-sm bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
              {selectedImage + 1} / {filteredImages.length}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
