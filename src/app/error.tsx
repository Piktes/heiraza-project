"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to server-side logging (would be handled by API)
        console.error("Client error:", error.digest);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background grain">
            {/* Background decorations */}
            <div className="absolute top-1/4 left-10 w-64 h-64 bg-accent-coral/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent-peach/10 rounded-full blur-3xl" />

            <div className="relative z-10 text-center px-6 max-w-lg">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertCircle size={40} className="text-red-500" />
                </div>

                {/* Title */}
                <h1 className="font-display text-3xl tracking-wide uppercase mb-4">
                    Something Went Wrong
                </h1>

                {/* Message - No technical details */}
                <p className="text-muted-foreground mb-8 leading-relaxed">
                    We encountered an unexpected error. Our team has been notified
                    and is working to resolve the issue. Please try again.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={reset}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-muted hover:bg-muted/80 font-medium transition-colors"
                    >
                        <RefreshCw size={18} />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent-coral hover:bg-accent-coral/90 text-white font-medium transition-colors"
                    >
                        <Home size={18} />
                        Return to Home
                    </Link>
                </div>

                {/* Error Reference (Digest only, no stack trace) */}
                {error.digest && (
                    <p className="mt-8 text-xs text-muted-foreground">
                        Reference: {error.digest}
                    </p>
                )}
            </div>
        </div>
    );
}
