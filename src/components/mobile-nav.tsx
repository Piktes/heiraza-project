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
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Menu Overlay - Using Tailwind bg classes */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[200] bg-black/90"
                    onClick={() => setIsOpen(false)}
                >
                    {/* Close button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={20} className="text-white" />
                    </button>

                    {/* Navigation Links - Right Aligned */}
                    <nav className="pt-28 px-8">
                        <ul className="space-y-6 text-right">
                            {navLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={(e) => { e.stopPropagation(); handleLinkClick(); }}
                                        className="inline-block text-xl font-display tracking-wider text-white hover:text-accent-coral transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            )}
        </div>
    );
}
