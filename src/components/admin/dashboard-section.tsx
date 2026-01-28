"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DashboardSectionProps {
    id: string;
    children: ReactNode;
    defaultOpen?: boolean;
}

export function DashboardSection({
    id,
    children,
    defaultOpen = true,
}: DashboardSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const sectionRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

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
            {/* Toggle button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                title={isOpen ? "Collapse section" : "Expand section"}
            >
                {isOpen ? (
                    <ChevronUp size={20} className="text-muted-foreground" />
                ) : (
                    <ChevronDown size={20} className="text-muted-foreground" />
                )}
            </button>

            {/* Collapsible container using CSS Grid for smooth animation */}
            <div
                className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                }}
            >
                <div
                    ref={contentRef}
                    className="overflow-hidden"
                >
                    <div className={`transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}>
                        {children}
                    </div>
                </div>
            </div>

            {/* Collapsed preview - shows section title area */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full p-4 text-left glass-card rounded-xl hover:bg-muted/50 transition-colors flex items-center justify-between"
                    aria-label="Expand section"
                >
                    <span className="text-muted-foreground text-sm">Click to expand section</span>
                    <ChevronDown size={18} className="text-muted-foreground" />
                </button>
            )}
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
