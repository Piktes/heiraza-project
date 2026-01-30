"use client";

import { useEffect } from "react";

export function VisitorTracker() {
    useEffect(() => {
        // Only track once per session
        const hasTracked = sessionStorage.getItem("visitor_tracked");
        if (hasTracked) return;

        // Send tracking beacon
        fetch("/api/track-visit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        }).then(() => {
            sessionStorage.setItem("visitor_tracked", "true");
        }).catch((err) => {
            console.error("Tracking failed:", err);
        });
    }, []);

    // This component renders nothing
    return null;
}
