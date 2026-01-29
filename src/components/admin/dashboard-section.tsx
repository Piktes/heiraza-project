"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface DashboardSectionProps {
    id: string;
    icon: ReactNode;
    title: string;
    subtitle?: string;
    actionButton?: ReactNode;
    children: ReactNode;
    defaultOpen?: boolean;
}

export function DashboardSection({
    id,
    icon,
    title,
    subtitle,
    actionButton,
    children,
    defaultOpen = false,
}: DashboardSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const sectionRef = useRef<HTMLDivElement>(null);

    // Listen for custom events to open and scroll to this section
    useEffect(() => {
        const handleOpenSection = (event: CustomEvent<{ sectionId: string }>) => {
            if (event.detail.sectionId === id) {
                setIsOpen(true);
                // Scroll to section after opening animation
                setTimeout(() => {
                    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 350);
            }
        };

        window.addEventListener("openSection" as any, handleOpenSection);
        return () => window.removeEventListener("openSection" as any, handleOpenSection);
    }, [id]);

    return (
        <div id={id} ref={sectionRef} className="relative">
            {/* Accordion Header - Always visible */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-4 p-4 glass-card hover:bg-muted/50 transition-colors ${isOpen ? "rounded-t-xl rounded-b-none" : "rounded-xl"
                    }`}
            >
                {/* Left side: Icon + Title + Subtitle */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 text-accent-coral">
                        {icon}
                    </div>
                    <div className="text-left min-w-0">
                        <h2 className="font-display text-lg tracking-wide uppercase truncate">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground truncate">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right side: Action button + Chevron */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Action button - stop propagation to prevent toggle */}
                    {actionButton && (
                        <div onClick={(e) => e.stopPropagation()}>
                            {actionButton}
                        </div>
                    )}

                    {/* Single chevron - points down when closed, up when open */}
                    <div className="p-2 rounded-lg bg-muted/50">
                        <ChevronDown
                            size={20}
                            className={`text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"
                                }`}
                        />
                    </div>
                </div>
            </button>

            {/* Collapsible content - fast grid animation */}
            <div
                className="grid transition-[grid-template-rows] duration-200 ease-out"
                style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                }}
            >
                <div className="overflow-hidden">
                    <div className="glass-card rounded-t-none rounded-b-xl border-t-0">
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

// Component to check for section to open on mount (for navigation from other pages)
export function SectionOpener() {
    useEffect(() => {
        if (typeof window !== "undefined") {
            const sectionToOpen = sessionStorage.getItem("openSection");
            if (sectionToOpen) {
                sessionStorage.removeItem("openSection");
                // Delay to ensure components are mounted
                setTimeout(() => openSection(sectionToOpen), 300);
            }
        }
    }, []);

    return null;
}
