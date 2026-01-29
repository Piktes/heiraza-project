"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface HeroImage {
  id: number;
  imageUrl: string;
  altText?: string | null;
}

interface HeroSliderProps {
  images: HeroImage[];
  fallbackImage?: string;
  interval?: number;
  kenBurnsEffect?: boolean;
}

export function HeroSlider({
  images,
  fallbackImage,
  interval = 5000,
  kenBurnsEffect = true
}: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use images array or fallback to single image
  const slides = images.length > 0
    ? images
    : fallbackImage
      ? [{ id: 0, imageUrl: fallbackImage, altText: "Hero" }]
      : [];

  const isSlider = slides.length > 1;

  // Auto-advance slides
  useEffect(() => {
    if (!isSlider) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, interval);

    return () => clearInterval(timer);
  }, [isSlider, slides.length, interval]);

  if (slides.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {slides.map((slide, idx) => {
        const isActive = idx === currentIndex;
        const isPrev = idx === (currentIndex - 1 + slides.length) % slides.length;

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? "opacity-100 z-10" : isPrev ? "opacity-0 z-5" : "opacity-0 z-0"
              }`}
          >
            <div
              className={`absolute inset-0 ${kenBurnsEffect && isActive ? "animate-ken-burns" : ""
                }`}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.altText || "Hero background"}
                fill
                className="object-cover object-center"
                sizes="100vw"
                priority={idx === 0}
                quality={90}
              />
            </div>
          </div>
        );
      })}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-20 gradient-hero" />

      {/* Slide Indicators - Glassmorphic Style */}
      {isSlider && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`
                h-2 rounded-full transition-all duration-300
                ${idx === currentIndex
                  ? "w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  : "w-2 bg-white/40 hover:bg-white/60"
                }
              `}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
