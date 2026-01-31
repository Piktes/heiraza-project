"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface MobileNavProps {
    artistName?: string;
    showVideos?: boolean;
    showShop?: boolean;
}

export function MobileNav({ artistName = "Heiraza", showVideos = true, showShop = true }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    const handleLinkClick = () => setIsOpen(false);

    const navLinks = [
        { href: "#concerts", label: "Concerts", show: true },
        { href: "#videos", label: "Videos", show: showVideos },
        { href: "#shop", label: "Shop", show: showShop },
        { href: "#about", label: "About", show: true },
        { href: "#contact", label: "Contact", show: true },
    ].filter(link => link.show);

    return (
        <div className="md:hidden">
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors -ml-2"
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[200] bg-neutral-100/95 dark:bg-neutral-800/95 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                >
                    {/* Close button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={20} className="text-foreground" />
                    </button>

                    {/* Navigation Links - Left Aligned for better mobile UX or Center? User said "Left side of header", didn't specify menu alignment. Keeping it clear. */}
                    <nav className="flex flex-col items-center justify-center h-full space-y-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={(e) => { e.stopPropagation(); handleLinkClick(); }}
                                className="text-3xl font-display tracking-widest uppercase text-foreground hover:text-accent-coral transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </div>
    );
}
