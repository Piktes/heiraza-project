"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Music2, ArrowUpRight, ArrowLeft, Home } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/admin/sign-out-button";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = useSession();
    const pathname = usePathname();

    // Don't show the header on login page
    const isLoginPage = pathname === "/admin/login";
    if (isLoginPage) {
        return <>{children}</>;
    }

    const username = (session?.user as any)?.username || session?.user?.name || "Admin";
    const isMainDashboard = pathname === "/admin";

    return (
        <div className="min-h-screen gradient-warm-bg grain">
            {/* Persistent Admin Header */}
            <header className="sticky top-0 z-50 px-4 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between">
                        {/* Left side - Logo only */}
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="flex items-center gap-2">
                                <Music2 size={24} className="text-accent-coral" />
                                <span className="font-display text-xl tracking-widest uppercase">Heiraza</span>
                                <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground ml-2 px-2 py-1 bg-muted rounded-full">Admin</span>
                            </Link>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground hidden sm:block">
                                Logged in as <span className="font-medium text-foreground">{username}</span>
                            </span>
                            <ThemeToggle />
                            <Link href="/" target="_blank" className="btn-ghost flex items-center gap-2 text-sm">
                                View Site <ArrowUpRight size={14} />
                            </Link>
                            <SignOutButton />
                        </div>
                    </div>
                </div>
            </header>

            {/* Page content */}
            {children}
        </div>
    );
}
