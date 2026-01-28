"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home, Music2, Youtube, Calendar, Package, ImageIcon,
    Bell, Share2, MessageSquare, Mail, ImagePlus, Settings, PenTool, FileText, Users,
} from "lucide-react";
import { openSection } from "./dashboard-section";

interface SidebarNavProps {
    unreadCount: number;
}

interface NavItem {
    href: string;
    icon: React.ElementType;
    label: string;
    sectionId?: string; // For hash-based sections on dashboard
    badge?: number;
}

export function SidebarNav({ unreadCount }: SidebarNavProps) {
    const pathname = usePathname();

    const navItems: NavItem[] = [
        { href: "/admin", icon: Home, label: "Dashboard" },
        { href: "/admin", icon: Music2, label: "Audio Tracks", sectionId: "tracks" },
        { href: "/admin", icon: Youtube, label: "Videos", sectionId: "videos" },
        { href: "/admin", icon: ImagePlus, label: "Gallery", sectionId: "gallery" },
        { href: "/admin", icon: Settings, label: "Settings", sectionId: "settings" },
        { href: "/admin/events", icon: Calendar, label: "Events" },
        { href: "/admin/products/new", icon: Package, label: "Add Product" },
        { href: "/admin/hero", icon: ImageIcon, label: "Hero Editor" },
        { href: "/admin/bio-editor", icon: FileText, label: "Bio Editor" },
        { href: "/admin/popups", icon: Bell, label: "Popups" },
        { href: "/admin/social-media", icon: Share2, label: "Social Media" },
        { href: "/admin/auto-reply", icon: MessageSquare, label: "Auto Reply" },
        { href: "/admin/user-notifications", icon: Mail, label: "User Notifications" },
        { href: "/admin/email-signature", icon: PenTool, label: "Email Signature" },
        { href: "/admin/subscribers", icon: Users, label: "Subscribers" },
        { href: "/admin/messages", icon: MessageSquare, label: "Messages", badge: unreadCount > 0 ? unreadCount : undefined },
    ];

    const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
        if (item.sectionId && pathname === "/admin") {
            // Already on dashboard, just open and scroll to section
            e.preventDefault();
            openSection(item.sectionId);
        } else if (item.sectionId) {
            // Will navigate to dashboard, then open section
            // Store the section to open in sessionStorage
            sessionStorage.setItem("openSection", item.sectionId);
        }
    };

    return (
        <nav className="space-y-2">
            {navItems.map((item, index) => {
                const Icon = item.icon;

                return (
                    <Link
                        key={`${item.label}-${index}`}
                        href={item.sectionId ? `/admin#${item.sectionId}` : item.href}
                        onClick={(e) => handleNavClick(item, e)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${index === 0 && pathname === "/admin"
                            ? "bg-accent-coral/10 text-accent-coral font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                    >
                        <span className="flex items-center gap-3">
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </span>
                        {item.badge !== undefined && (
                            <span className="bg-accent-coral text-white text-xs px-2 py-0.5 rounded-full">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

