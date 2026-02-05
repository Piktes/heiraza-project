"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface LightboxImage {
    src: string;
    alt: string;
    credit?: string;
}

interface LightboxProps {
    images: LightboxImage[];
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export function Lightbox({ images, initialIndex = 0, isOpen, onClose }: LightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") goToPrev();
            if (e.key === "ArrowRight") goToNext();
        };

        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = "";
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, currentIndex]);

    const goToPrev = useCallback(() => {
        setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    }, [images.length]);

    if (!isOpen || images.length === 0) return null;

    const currentImage = images[currentIndex];

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                aria-label="Close"
            >
                <X size={24} className="text-white" />
            </button>

            {/* Navigation - Previous */}
            {images.length > 1 && (
                <button
                    onClick={goToPrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                    aria-label="Previous"
                >
                    <ChevronLeft size={32} className="text-white" />
                </button>
            )}

            {/* Image */}
            <div className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center">
                <img
                    src={currentImage.src}
                    alt={currentImage.alt}
                    className="max-w-full max-h-[80vh] object-contain"
                />
                {/* Image Info */}
                <div className="mt-4 text-center">
                    <p className="text-white/80">{currentImage.alt}</p>
                    {currentImage.credit && (
                        <p className="text-white/60 text-sm mt-1">Photo: {currentImage.credit}</p>
                    )}
                    <p className="text-white/40 text-sm mt-2">
                        {currentIndex + 1} / {images.length}
                    </p>
                </div>
            </div>

            {/* Navigation - Next */}
            {images.length > 1 && (
                <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                    aria-label="Next"
                >
                    <ChevronRight size={32} className="text-white" />
                </button>
            )}

            {/* Download Button */}
            <a
                href={currentImage.src}
                download
                className="absolute bottom-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10 flex items-center gap-2 text-white text-sm"
            >
                <Download size={18} />
                Download
            </a>
        </div>
    );
}
