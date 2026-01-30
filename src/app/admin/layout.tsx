"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Music2, ArrowUpRight, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { MobileSidebarProvider, useMobileSidebar } from "@/components/admin/mobile-sidebar-context";
import { MobileSidebarDrawer } from "@/components/admin/mobile-sidebar-drawer";

// Wrapper component that provides the mobile sidebar context
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Don't show the header on login page
    const isLoginPage = pathname === "/admin/login";
    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <MobileSidebarProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </MobileSidebarProvider>
    );
}

// Inner content component that can use the mobile sidebar hook
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const { toggle } = useMobileSidebar();

    const username = (session?.user as any)?.username || session?.user?.name || "Admin";

    return (
        <div className="min-h-screen gradient-warm-bg grain overflow-x-hidden">
            {/* Mobile Sidebar Drawer */}
            <MobileSidebarDrawer unreadCount={0} />

            {/* Persistent Admin Header */}
            <header className="sticky top-0 z-50 px-2 sm:px-4 py-2 sm:py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="glass rounded-2xl px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2">
                        {/* Left side - Hamburger + Logo */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                            {/* Hamburger Menu - Mobile Only */}
                            <button
                                onClick={toggle}
                                className="p-2 rounded-lg hover:bg-muted transition-colors lg:hidden"
                                aria-label="Toggle menu"
                            >
                                <Menu size={20} />
                            </button>

                            <Link href="/admin" className="flex items-center gap-2">
                                <Music2 size={20} className="text-accent-coral sm:w-6 sm:h-6" />
                                <span className="font-display text-lg sm:text-xl tracking-widest uppercase hidden sm:inline">Heiraza</span>
                                <span className="text-[10px] sm:text-xs font-medium tracking-wider uppercase text-muted-foreground px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted rounded-full">Admin</span>
                            </Link>
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex items-center gap-1 sm:gap-3">
                            <span className="text-sm text-muted-foreground hidden lg:block">
                                Logged in as <span className="font-medium text-foreground">{username}</span>
                            </span>
                            <ThemeToggle />
                            <Link
                                href="/"
                                target="_blank"
                                className="btn-ghost flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                                title="View Site"
                            >
                                <span className="hidden sm:inline">View Site</span>
                                <ArrowUpRight size={14} />
                            </Link>
                            <SignOutButton showText={false} className="px-2 sm:px-4 py-1.5 sm:py-2 hidden lg:flex" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Page content */}
            {children}
        </div>
    );
}
