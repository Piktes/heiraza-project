"use client";

import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Client-side component that detects server action mismatches.
 * Shows a reload prompt when client build doesn't match server build.
 * Uses BUILD_ID (stable per build) instead of timestamp.
 */

export function VersionCheck() {
    // DISABLED: Causing false positives. The atomic deploy script is sufficient.
    return null;

    const [showReloadPrompt, setShowReloadPrompt] = useState(false);
    const initialBuildIdRef = useRef<string | null>(null);
    const hasCheckedRef = useRef(false);

    const checkVersion = useCallback(async () => {
        try {
            const res = await fetch("/api/health", {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache" },
            });

            if (!res.ok) return;

            const data = await res.json();

            // Store the first build ID we see (from when page loaded)
            if (!hasCheckedRef.current) {
                initialBuildIdRef.current = data.buildId;
                hasCheckedRef.current = true;
                return; // Don't show on first check
            }

            // Only show if build ID changed AFTER page was loaded
            if (initialBuildIdRef.current &&
                data.buildId &&
                data.buildId !== "development" &&
                initialBuildIdRef.current !== data.buildId) {
                console.warn(
                    "[Version Mismatch] Initial:", initialBuildIdRef.current,
                    "Current:", data.buildId
                );
                setShowReloadPrompt(true);
            }
        } catch (error) {
            // Silently fail - don't disrupt user experience
            console.debug("[Version Check] Failed:", error);
        }
    }, []);

    useEffect(() => {
        // Check on mount (to store initial build ID)
        checkVersion();

        // Check periodically (every 2 minutes) for new deployments
        const interval = setInterval(checkVersion, 2 * 60 * 1000);

        // Also check when window regains focus (user returns to tab)
        const handleFocus = () => checkVersion();
        window.addEventListener("focus", handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", handleFocus);
        };
    }, [checkVersion]);

    if (!showReloadPrompt) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in">
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 shadow-lg">
                <div className="flex items-start gap-3">
                    <div className="text-amber-600 dark:text-amber-400 text-xl">🔄</div>
                    <div className="flex-1">
                        <p className="font-medium text-amber-900 dark:text-amber-100">
                            New version available
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            The site has been updated. Please refresh for the latest version.
                        </p>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-3 py-1.5 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                            >
                                Refresh Now
                            </button>
                            <button
                                onClick={() => setShowReloadPrompt(false)}
                                className="px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-lg transition-colors"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

