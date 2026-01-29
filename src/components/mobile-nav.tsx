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

    // Close menu on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleLinkClick = () => {
        setIsOpen(false);
    };

    const navLinks = [
        { href: "#concerts", label: "Concerts", show: true },
        { href: "#videos", label: "Videos", show: showVideos },
        { href: "#shop", label: "Shop", show: showShop },
        { href: "#about", label: "About", show: true },
        { href: "#contact", label: "Contact", show: true },
    ].filter(link => link.show);

    return (
        <div className="md:hidden">
            {/* Hamburger Button - 44px min touch target */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 z-[60] transition-all duration-300 ${isOpen ? "visible opacity-100" : "invisible opacity-0"
                    }`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />

                {/* Menu Panel */}
                <div
                    className={`absolute top-0 right-0 h-full w-[280px] max-w-[80vw] glass-card rounded-l-3xl shadow-2xl transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
                        }`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <span className="font-display text-lg tracking-widest uppercase">{artistName}</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
                            aria-label="Close menu"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation Links - 44px min touch target */}
                    <nav className="p-6">
                        <ul className="space-y-2">
                            {navLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={handleLinkClick}
                                        className="block py-3 px-4 text-lg font-medium text-foreground hover:bg-muted/50 rounded-xl transition-colors min-h-[44px] flex items-center"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    );
}
