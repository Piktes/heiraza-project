"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useMobileSidebar } from "./mobile-sidebar-context";
import { SidebarNav } from "./sidebar-nav";
import { SignOutButton } from "./sign-out-button";

interface MobileSidebarDrawerProps {
    unreadCount: number;
}

export function MobileSidebarDrawer({ unreadCount }: MobileSidebarDrawerProps) {
    const { isOpen, close } = useMobileSidebar();

    // Prevent body scroll when drawer is open
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

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                close();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, close]);

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={close}
                aria-hidden="true"
            />

            {/* Drawer */}
            <aside
                className={`fixed inset-y-0 left-0 z-[70] w-[280px] max-w-[80vw] bg-background border-r border-border shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                    <span className="font-display text-lg tracking-widest uppercase">Menu</span>
                    <button
                        onClick={close}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-140px)]">
                    <SidebarNav unreadCount={unreadCount} onLinkClick={close} />
                </div>

                {/* Footer with Sign Out */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
                    <SignOutButton className="w-full justify-center" />
                </div>
            </aside>
        </>
    );
}
