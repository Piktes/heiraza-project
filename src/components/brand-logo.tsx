"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";

interface BrandLogoProps {
    className?: string;
}

export function BrandLogo({ className }: BrandLogoProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by rendering a placeholder or nothing until mounted
    // However, to avoid layout shift, we might want to render a transparent placeholder of the same aspect ratio if possible.
    // For now, we'll return a simple image tag structure. 
    // Since we need to wait for client to know the theme, we rely on 'mounted'.

    if (!mounted) {
        // Render a placeholder or the default logo (light mode usually) to reserve space? 
        // Or just return an empty div with the same dimensions?
        // User requested avoiding hydration mismatch.
        return <div className={className} aria-hidden="true" style={{ width: '100px', height: 'auto', visibility: 'hidden' }}></div>;
    }

    const src = resolvedTheme === "dark" ? "/heirazalogobeyaz.svg" : "/heirazalogosiyah.svg";

    return (
        <img
            src={src}
            alt="Heiraza Logo"
            className={className}
        // We use standard img tag as requested, but we could use Next Image if we knew dimensions. 
        // User said "The component should return an standard HTML <img> tag."
        />
    );
}
