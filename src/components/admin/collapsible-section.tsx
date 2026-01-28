"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, LucideIcon } from "lucide-react";

interface CollapsibleSectionProps {
    id: string;
    title: string;
    icon: LucideIcon;
    iconColor?: string;
    children: ReactNode;
    defaultOpen?: boolean;
    badge?: string | number;
}

export function CollapsibleSection({
    id,
    title,
    icon: Icon,
    iconColor = "text-accent-coral",
    children,
    defaultOpen = true,
    badge,
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const contentRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLDivElement>(null);

    // Listen for custom events to open and scroll to this section
    useEffect(() => {
        const handleOpenSection = (event: CustomEvent<{ sectionId: string }>) => {
            if (event.detail.sectionId === id) {
                setIsOpen(true);
                // Scroll to section after opening animation
                setTimeout(() => {
                    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
            }
        };

        window.addEventListener("openSection" as any, handleOpenSection);
        return () => window.removeEventListener("openSection" as any, handleOpenSection);
    }, [id]);

    return (
        <div id={id} ref={sectionRef} className="glass-card overflow-hidden">
            {/* Clickable Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon className={iconColor} size={24} />
                    <h2 className="font-display text-2xl tracking-wide">{title}</h2>
                    {badge !== undefined && (
                        <span className="bg-accent-coral/10 text-accent-coral text-sm px-3 py-1 rounded-full">
                            {badge}
                        </span>
                    )}
                </div>
                <ChevronDown
                    size={24}
                    className={`text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {/* Collapsible Content */}
            <div
                ref={contentRef}
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="px-8 pb-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function to open a section from sidebar
export function openSection(sectionId: string) {
    window.dispatchEvent(
        new CustomEvent("openSection", { detail: { sectionId } })
    );
}
