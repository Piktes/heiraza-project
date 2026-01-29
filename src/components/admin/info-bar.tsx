import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface InfoBarProps {
    /** Optional counter to show on the right side (e.g., "8/8 active") */
    counter?: string;
    /** Optional icon element to show before the counter */
    counterIcon?: React.ReactNode;
    /** Optional custom back link URL (defaults to /admin) */
    backHref?: string;
    /** Optional custom back link label (defaults to "Back to Dashboard") */
    backLabel?: string;
}

/**
 * InfoBar - Consistent navigation bar for all admin sub-pages
 * Shows "← Back to Dashboard" on the left and optional counter on the right
 */
export function InfoBar({
    counter,
    counterIcon,
    backHref = "/admin",
    backLabel = "Back to Dashboard"
}: InfoBarProps) {
    return (
        <div className="max-w-7xl mx-auto px-4 pt-6">
            <div className="glass rounded-xl px-4 py-3 flex items-center justify-between mb-6">
                <Link
                    href={backHref}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span>{backLabel}</span>
                </Link>
                {counter && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {counterIcon}
                        <span>{counter}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
