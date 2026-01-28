"use client";

import Image from "next/image";
import { X, ExternalLink } from "lucide-react";

/**
 * PopupCard - Shared component for popup display
 * Used by both:
 * - Frontend SpecialEventPopup (live on homepage)
 * - Admin PopupManager preview modal
 * 
 * IMPORTANT: Any visual changes here affect BOTH locations!
 */

interface PopupCardProps {
    title: string;
    message: string;
    imageUrl?: string | null;
    linkUrl?: string | null;
    linkText?: string | null;
    onClose?: () => void;
    showCloseButton?: boolean;
    /** Size variant: 'default' for live popup, 'preview' for admin */
    variant?: "default" | "preview";
}

export function PopupCard({
    title,
    message,
    imageUrl,
    linkUrl,
    linkText,
    onClose,
    showCloseButton = true,
    variant = "default",
}: PopupCardProps) {
    // No longer using variant for sizing - always render identically
    return (
        <div className="glass-card rounded-3xl overflow-hidden max-w-lg w-full">
            {/* Close Button */}
            {showCloseButton && onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-accent-coral/20 transition-colors"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
            )}

            {/* Image - Using object-contain for full visibility, no cropping */}
            {imageUrl && (
                <div className="relative bg-neutral-100 dark:bg-neutral-900">
                    <Image
                        src={imageUrl}
                        alt={title}
                        width={800}
                        height={600}
                        className="w-full h-auto object-contain"
                        style={{ maxHeight: "400px" }}
                    />
                    {/* Gradient overlay for text readability */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
            )}

            {/* Content */}
            <div className={`p-8 ${imageUrl ? "-mt-8 relative z-10" : ""}`}>
                <h3 className="font-display tracking-wide mb-4 text-2xl">
                    {title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                    {message}
                </p>

                {/* CTA Button */}
                {linkUrl && (
                    <a
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary mt-6 inline-flex items-center gap-2"
                    >
                        {linkText || "Learn More"}
                        <ExternalLink size={16} />
                    </a>
                )}
            </div>
        </div>
    );
}

export default PopupCard;
