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
        { href: "/press-kit", label: "Press Kit", show: true },
    ].filter(link => link.show);

    return (
        <div className="md:hidden">
            {/* Hamburger Button */}
            {/* Hamburger Button - Floating Bottom Center */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-background/80 backdrop-blur-md border border-foreground/10 shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 md:hidden group"
                aria-label="Open menu"
                aria-expanded={isOpen}
            >
                <Menu size={28} className="text-foreground group-hover:text-accent-coral transition-colors" />
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Left Sidebar Drawer */}
            <div
                className={`fixed top-0 bottom-0 left-0 z-[201] w-[65%] max-w-[260px] bg-gradient-to-b from-neutral-100/95 to-transparent dark:from-neutral-900/95 dark:to-transparent border-r border-black/5 dark:border-white/5 shadow-2xl transition-transform duration-300 ease-out transform ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="flex flex-col h-full bg-transparent">
                    {/* Header with Close Button */}
                    <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
                        <span className="font-display text-lg tracking-widest uppercase text-foreground/80">Menu</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                            aria-label="Close menu"
                        >
                            <X size={18} className="text-foreground" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-6 py-8 overflow-y-auto">
                        <ul className="space-y-6">
                            {navLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={() => { handleLinkClick(); }}
                                        className="block py-2 text-lg font-display tracking-wider text-foreground hover:text-accent-coral transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Footer Info */}
                    <div className="p-6 border-t border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-black/20">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{artistName}</p>
                        <p className="text-xs text-muted-foreground/50">Official Website</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
