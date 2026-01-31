"use client";

interface BrandLogoProps {
    className?: string;
}

export function BrandLogo({ className }: BrandLogoProps) {
    // Optimization: Use CSS filters instead of swapping images to prevent hydration mismatch and layout shifts.
    // The logo is black by default (/heirazalogosiyah.svg).
    // In dark mode, we invert it to white using Tailwind's `dark:invert`.

    return (
        <img
            src="/heirazalogosiyah.svg"
            alt="Heiraza Logo"
            className={`${className} dark:invert`}
        />
    );
}
