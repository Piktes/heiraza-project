"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Lightbox } from "@/components/lightbox";

// ========================================
// TYPES
// ========================================
interface PressPhoto {
    id: number;
    imageUrl: string;
    thumbnailUrl: string | null;
    altText: string;
    photographerCredit: string | null;
    isFeatured?: boolean;
}

interface MusicHighlight {
    id: number;
    title: string;
    platform: string;
    embedUrl: string;
}

interface PressKitVideo {
    id: number;
    title: string;
    videoUrl: string;
}

interface PressQuote {
    id: number;
    quoteText: string;
    sourceName: string;
    sourceUrl: string | null;
    imageUrl: string | null;
}

interface QuoteCategory {
    id: number;
    name: string;
    quotes: PressQuote[];
}

interface ContactInfo {
    bookingEmail: string | null;
    pressEmail: string | null;
    baseLocation: string | null;
    showBookingEmail: boolean;
    showPressEmail: boolean;
    showBaseLocation: boolean;
}

interface BioInfo {
    shortBio: string | null;
    longBio: string | null;
    showShortBio: boolean;
    showLongBio: boolean;
}

interface PressKitClientProps {
    bio: BioInfo | null;
    photos: PressPhoto[];
    musicHighlights: MusicHighlight[];
    videos: PressKitVideo[];
    quoteCategories: QuoteCategory[];
    contact: ContactInfo | null;
    allowDownload: boolean;
}

// ========================================
// COLLAPSIBLE SECTION COMPONENT
// ========================================
function CollapsibleSection({
    title,
    children,
    defaultOpen = false,
    id,
    isOpen: controlledIsOpen,
    onToggle
}: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    id?: string;
    isOpen?: boolean;
    onToggle?: () => void;
}) {
    const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

    // Use controlled or uncontrolled mode
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const handleToggle = onToggle || (() => setInternalIsOpen(!internalIsOpen));

    return (
        <section id={id} className="glass-card rounded-3xl overflow-hidden">
            <button
                onClick={handleToggle}
                className="w-full p-8 md:p-12 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
            >
                <h2 className="font-display text-2xl tracking-wide">{title}</h2>
                {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-8 md:px-12 pb-8 md:pb-12 border-t border-border/30">
                    {children}
                </div>
            </div>
        </section>
    );
}

// ========================================
// PLATFORM ICON HELPER
// ========================================
function getPlatformIcon(platform: string) {
    switch (platform.toLowerCase()) {
        case 'spotify':
            return (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
            );
        case 'soundcloud':
            return (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.099-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.21-1.308-.21-1.319c-.01-.057-.045-.094-.09-.094m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.12.12.12.074 0 .12-.06.12-.12l.24-2.458-.24-2.563c0-.061-.044-.104-.12-.104m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.077.075.138.149.138.075 0 .135-.061.15-.138l.24-2.544-.24-2.64c-.015-.075-.074-.135-.15-.135m.93-.105c-.09 0-.149.075-.164.165l-.194 2.73.18 2.49c.015.09.074.164.164.164.091 0 .15-.074.165-.164l.195-2.49-.195-2.73c-.015-.09-.074-.165-.165-.165m1.035-.18c-.104 0-.18.09-.18.18l-.18 2.82.165 2.535c0 .104.09.18.18.18s.165-.076.18-.18l.195-2.535-.18-2.82c-.015-.09-.09-.18-.18-.18m1.005.165c-.12 0-.21.09-.21.21l-.165 2.64.165 2.535c0 .12.09.21.21.21.105 0 .195-.09.21-.21l.18-2.535-.18-2.64c-.015-.12-.105-.21-.21-.21m.99-.315c-.135 0-.225.105-.225.225l-.15 2.73.165 2.49c0 .135.09.225.225.225.12 0 .225-.09.24-.225l.165-2.49-.18-2.73c-.015-.135-.12-.225-.225-.225m1.065.135c0-.15-.12-.27-.255-.27-.135 0-.255.12-.27.27l-.15 2.58.15 2.43c.015.165.12.27.255.27.135 0 .255-.105.255-.27l.18-2.43-.18-2.58m.705-.405c-.165 0-.285.135-.3.285l-.135 2.7.135 2.475c.015.15.135.285.3.285.15 0 .285-.135.285-.285l.165-2.475-.15-2.7c-.015-.15-.135-.285-.3-.285m.855-.075c-.165 0-.3.15-.315.3l-.12 2.76.135 2.505c.015.165.135.3.315.3.165 0 .3-.135.315-.3l.12-2.505-.12-2.76c-.015-.165-.15-.3-.315-.3m.9-.061c-.18 0-.33.15-.33.33l-.12 2.79.135 2.49c.015.18.15.33.33.33.164 0 .314-.15.33-.33l.135-2.49-.135-2.79c-.015-.18-.165-.33-.33-.33m.87-.135c-.195 0-.345.165-.36.345l-.105 2.88.12 2.535c.015.18.165.345.345.345.195 0 .345-.165.36-.345l.135-2.535-.135-2.88c-.015-.18-.165-.345-.36-.345m.93.06c-.195 0-.36.165-.375.36l-.09 2.79.105 2.49c.015.195.165.375.375.375.195 0 .36-.18.375-.375l.12-2.49-.12-2.79c-.015-.195-.18-.36-.375-.36m.87-.18c-.21 0-.375.18-.39.39l-.09 2.94.12 2.505c.015.21.18.39.39.39.195 0 .375-.18.39-.39l.12-2.505-.12-2.94c-.015-.21-.195-.39-.39-.39m4.74 1.98c-.45 0-.87.135-1.23.36-.24-2.73-2.505-4.86-5.28-4.86-.72 0-1.395.15-2.01.405-.24.105-.315.21-.315.405v9.51c0 .21.165.39.375.42h8.46c1.53 0 2.79-1.26 2.79-2.79 0-1.515-1.26-2.79-2.79-2.79z" />
                </svg>
            );
        case 'youtube':
        case 'youtube music':
            return (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
            );
        case 'apple':
        case 'apple music':
            return (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.988c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.364-1.064.366-1.914.97-2.547 1.876-.329.47-.534.99-.66 1.55-.18.8-.24 1.612-.24 2.426v11.56c0 .814.06 1.625.24 2.425.126.56.33 1.08.66 1.55.633.906 1.483 1.51 2.547 1.876.703.24 1.446.32 2.193.364.152.01.303.017.455.026h12.02c.04-.003.083-.01.124-.013a10.494 10.494 0 001.564-.15c.712-.15 1.373-.442 1.877-.726 1.118-.733 1.863-1.733 2.18-3.043.175-.72.24-1.452.24-2.19V6.125zm-6.423 3.99v5.712c0 .417-.058.828-.244 1.206-.263.532-.7.916-1.244 1.088-.35.11-.718.148-1.085.148-.7 0-1.4-.22-1.903-.708-.398-.386-.638-.91-.638-1.475 0-.9.55-1.665 1.354-2.003.404-.17.855-.248 1.3-.248.346 0 .69.055 1.01.164V9.59l-4.633 1.08v6.204c0 .36-.046.72-.198 1.048-.226.484-.622.87-1.12 1.073-.322.13-.67.182-1.018.182-.786 0-1.512-.273-2.003-.708-.4-.355-.68-.87-.68-1.443 0-.903.53-1.65 1.353-2.003.404-.17.855-.247 1.3-.247.345 0 .69.054 1.01.164V8.96c0-.258.054-.51.158-.745.163-.368.46-.656.838-.8.298-.114.614-.19.932-.214l5.096-1.19c.25-.058.51-.087.765-.087.393 0 .793.096 1.093.364.307.275.48.673.48 1.096v2.73z" />
                </svg>
            );
        case 'bandcamp':
            return (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" />
                </svg>
            );
        default:
            return (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
            );
    }
}

// ========================================
// PLATFORM DISPLAY NAME HELPER
// ========================================
function getPlatformDisplayName(platform: string): string {
    switch (platform.toLowerCase()) {
        case 'spotify': return 'Spotify';
        case 'soundcloud': return 'SoundCloud';
        case 'youtube': return 'YouTube';
        case 'youtube music': return 'YouTube Music';
        case 'apple': case 'apple music': return 'Apple Music';
        case 'bandcamp': return 'Bandcamp';
        default: return platform.charAt(0).toUpperCase() + platform.slice(1);
    }
}

// ========================================
// EMBED HEIGHT HELPER (platform-specific)
// ========================================
function getEmbedHeight(platform: string): number {
    switch (platform.toLowerCase()) {
        case 'spotify': return 80; // Compact player
        case 'soundcloud': return 166; // Standard player
        case 'bandcamp': return 120;
        case 'youtube': case 'youtube music': return 200;
        case 'apple': case 'apple music': return 175;
        default: return 152;
    }
}

// ========================================
// MUSIC HIGHLIGHTS SECTION (Grouped by Platform)
// ========================================
function MusicHighlightsSection({ tracks }: { tracks: MusicHighlight[] }) {
    // Group tracks by platform
    const groupedByPlatform = tracks.reduce((acc, track) => {
        const platform = track.platform.toLowerCase();
        if (!acc[platform]) {
            acc[platform] = [];
        }
        acc[platform].push(track);
        return acc;
    }, {} as Record<string, MusicHighlight[]>);

    const platforms = Object.keys(groupedByPlatform);

    // State to track expanded platforms - all start collapsed
    const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        platforms.forEach((p) => {
            initial[p] = false; // All platforms start collapsed
        });
        return initial;
    });

    const togglePlatform = (platform: string) => {
        setExpandedPlatforms(prev => ({
            ...prev,
            [platform]: !prev[platform]
        }));
    };

    // If only one platform or all platforms have only one track, show simple list
    const shouldShowGrouped = platforms.length > 1 || platforms.some(p => groupedByPlatform[p].length > 1);

    if (!shouldShowGrouped) {
        // Simple list without grouping
        return (
            <div className="pt-6 space-y-4">
                {tracks.map(track => (
                    <div key={track.id} className="rounded-xl overflow-hidden bg-muted/30">
                        <div className="flex items-center gap-3 p-4 pb-3">
                            <span className="text-accent-coral">{getPlatformIcon(track.platform)}</span>
                            <h3 className="font-medium flex-1">{track.title}</h3>
                        </div>
                        {track.embedUrl && (
                            <div className="px-4 pb-4">
                                <div
                                    className="w-full rounded-lg overflow-hidden"
                                    style={{ height: getEmbedHeight(track.platform) }}
                                >
                                    <iframe
                                        src={track.embedUrl}
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        loading="lazy"
                                        className="w-full h-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    // Grouped view with collapsible platform sections
    return (
        <div className="pt-6 space-y-4">
            {platforms.map(platform => {
                const platformTracks = groupedByPlatform[platform];
                const isExpanded = expandedPlatforms[platform];
                const trackCount = platformTracks.length;

                return (
                    <div key={platform} className="rounded-xl overflow-hidden bg-muted/30">
                        {/* Platform Header - Clickable */}
                        <button
                            onClick={() => togglePlatform(platform)}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-accent-coral">{getPlatformIcon(platform)}</span>
                                <span className="font-medium">{getPlatformDisplayName(platform)}</span>
                                <span className="text-xs bg-accent-coral/20 text-accent-coral px-2 py-0.5 rounded-full">
                                    {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
                                </span>
                            </div>
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        {/* Tracks - Collapsible */}
                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-4">
                                {platformTracks.map(track => (
                                    <div key={track.id}>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-2">{track.title}</h4>
                                        {track.embedUrl && (
                                            <div
                                                className="w-full rounded-lg overflow-hidden"
                                                style={{ height: getEmbedHeight(track.platform) }}
                                            >
                                                <iframe
                                                    src={track.embedUrl}
                                                    width="100%"
                                                    height="100%"
                                                    frameBorder="0"
                                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                    loading="lazy"
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ========================================
// ANIMATED BACKGROUND COMPONENT
// ========================================
function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let particles: Array<{
            x: number;
            y: number;
            baseVx: number;
            baseVy: number;
            vx: number;
            vy: number;
            size: number;
            opacity: number;
            pulseSpeed: number;
            pulsePhase: number;
        }> = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticles = () => {
            particles = [];
            // Increased particle count (was /15000, now /6000)
            const count = Math.floor((canvas.width * canvas.height) / 6000);
            for (let i = 0; i < count; i++) {
                // Slower base speed for gentle movement
                const baseSpeed = 0.1 + Math.random() * 0.2;
                const angle = Math.random() * Math.PI * 2;
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    baseVx: Math.cos(angle) * baseSpeed,
                    baseVy: Math.sin(angle) * baseSpeed,
                    vx: 0,
                    vy: 0,
                    size: Math.random() * 2.5 + 1,
                    opacity: Math.random() * 0.4 + 0.2,
                    pulseSpeed: 0.02 + Math.random() * 0.02,
                    pulsePhase: Math.random() * Math.PI * 2
                });
            }
        };

        let time = 0;
        const animate = () => {
            time += 0.016;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Theme-aware colors with better visibility
            const isDark = document.documentElement.classList.contains('dark');
            // Dark mode: warm coral/orange tones, Light mode: deeper coral/terracotta
            const particleColor = isDark ? '255, 180, 140' : '180, 80, 60';

            particles.forEach(p => {
                // Pulse opacity for organic feel
                const pulseOpacity = p.opacity + Math.sin(time * p.pulseSpeed + p.pulsePhase) * 0.1;

                // Mouse interaction - push particles away
                const dx = mouseRef.current.x - p.x;
                const dy = mouseRef.current.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120 && dist > 0) {
                    const force = (120 - dist) / 120;
                    p.vx -= (dx / dist) * force * 0.8;
                    p.vy -= (dy / dist) * force * 0.8;
                }

                // Apply velocities with continuous base movement
                p.x += p.baseVx + p.vx;
                p.y += p.baseVy + p.vy;

                // Damping for mouse-induced velocity
                p.vx *= 0.95;
                p.vy *= 0.95;

                // Wrap around screen
                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;
                if (p.y < -10) p.y = canvas.height + 10;
                if (p.y > canvas.height + 10) p.y = -10;

                // Draw particle with glow effect
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${particleColor}, ${Math.max(0.1, Math.min(0.6, pulseOpacity))})`;
                ctx.fill();
            });

            animationId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        resize();
        createParticles();
        animate();

        window.addEventListener('resize', () => {
            resize();
            createParticles();
        });
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.6 }}
        />
    );
}

// ========================================
// VIDEO EMBED UTILITY
// ========================================
function getVideoEmbedUrl(url: string): string | null {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    return null;
}

// ========================================
// MAIN CLIENT COMPONENT
// ========================================
export function PressKitClientContent({
    bio,
    photos,
    musicHighlights,
    videos,
    quoteCategories,
    contact,
    allowDownload
}: PressKitClientProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [downloading, setDownloading] = useState(false);
    const [showFullBio, setShowFullBio] = useState(false);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const handleDownloadAll = async () => {
        if (photos.length === 0) return;
        setDownloading(true);
        try {
            const JSZip = (await import("jszip")).default;
            const zip = new JSZip();
            const promises = photos.map(async (photo, index) => {
                try {
                    const response = await fetch(photo.imageUrl);
                    const blob = await response.blob();
                    const ext = photo.imageUrl.split(".").pop() || "jpg";
                    zip.file(`press-photo-${index + 1}.${ext}`, blob);
                } catch (error) {
                    console.error(`Failed to fetch ${photo.imageUrl}:`, error);
                }
            });
            await Promise.all(promises);
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = "press-photos.zip";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to create ZIP:", error);
            alert("Failed to download photos. Please try again.");
        }
        setDownloading(false);
    };

    const lightboxImages = photos.map(p => ({
        src: p.imageUrl,
        alt: p.altText,
        credit: p.photographerCredit || undefined,
    }));

    const hasBio = bio && ((bio.showShortBio && bio.shortBio) || (bio.showLongBio && bio.longBio));
    const hasPhotos = photos.length > 0;
    const hasMusic = musicHighlights.length > 0;
    const hasVideos = videos.length > 0;
    const hasQuotes = quoteCategories.length > 0;
    const hasContact = contact && (
        (contact.showBookingEmail && contact.bookingEmail) ||
        (contact.showPressEmail && contact.pressEmail) ||
        (contact.showBaseLocation && contact.baseLocation)
    );

    // Section open states for global control
    const [sectionStates, setSectionStates] = useState({
        bio: false,
        music: false,
        videos: false,
        photos: false,
        quotes: false,
        contact: false,
    });

    const allOpen = Object.values(sectionStates).every(v => v);

    const toggleAllSections = () => {
        const newState = !allOpen;
        setSectionStates({
            bio: newState,
            music: newState,
            videos: newState,
            photos: newState,
            quotes: newState,
            contact: newState,
        });
    };

    const toggleSection = (key: keyof typeof sectionStates) => {
        setSectionStates(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <>
            <AnimatedBackground />

            <div className="relative z-10 max-w-5xl mx-auto px-4 pb-20 space-y-8">
                {/* Expand/Collapse All Button */}
                <div className="flex justify-end">
                    <button
                        onClick={toggleAllSections}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium transition-all"
                    >
                        {allOpen ? (
                            <>
                                <ChevronUp size={16} />
                                Collapse All
                            </>
                        ) : (
                            <>
                                <ChevronDown size={16} />
                                Expand All
                            </>
                        )}
                    </button>
                </div>

                {/* Bio Section */}
                {hasBio && (
                    <CollapsibleSection
                        title="About"
                        id="bio"
                        isOpen={sectionStates.bio}
                        onToggle={() => toggleSection('bio')}
                    >
                        <div className="pt-6 space-y-6">
                            {/* Short Bio */}
                            {bio.showShortBio && bio.shortBio && (
                                <div className="p-6 bg-accent-coral/5 rounded-2xl border border-accent-coral/20">
                                    <h3 className="text-sm font-medium text-accent-coral uppercase tracking-wider mb-3">Short Bio</h3>
                                    <div
                                        className="prose prose-lg dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: bio.shortBio }}
                                    />
                                </div>
                            )}

                            {/* Long Bio with Read More - renders HTML from rich text editor */}
                            {bio.showLongBio && bio.longBio && (
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Full Biography</h3>
                                    <div
                                        className={`prose prose-lg dark:prose-invert max-w-none overflow-hidden transition-all duration-300 ${showFullBio ? '' : 'max-h-32'}`}
                                        dangerouslySetInnerHTML={{ __html: bio.longBio }}
                                    />
                                    {bio.longBio.length > 300 && (
                                        <button
                                            onClick={() => setShowFullBio(!showFullBio)}
                                            className="mt-4 text-accent-coral hover:underline flex items-center gap-2"
                                        >
                                            {showFullBio ? (
                                                <>Show Less <ChevronUp size={16} /></>
                                            ) : (
                                                <>Read More <ChevronDown size={16} /></>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Music Highlights - Grouped by Platform */}
                {hasMusic && (
                    <CollapsibleSection
                        title="Featured Music"
                        id="music"
                        isOpen={sectionStates.music}
                        onToggle={() => toggleSection('music')}
                    >
                        <MusicHighlightsSection tracks={musicHighlights} />
                    </CollapsibleSection>
                )}

                {/* Videos - 2 columns */}
                {hasVideos && (
                    <CollapsibleSection
                        title="Videos"
                        id="videos"
                        isOpen={sectionStates.videos}
                        onToggle={() => toggleSection('videos')}
                    >
                        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {videos.map(video => {
                                const embedUrl = getVideoEmbedUrl(video.videoUrl);
                                return (
                                    <div key={video.id} className="rounded-xl overflow-hidden bg-muted/30">
                                        {embedUrl ? (
                                            <div className="relative w-full aspect-video">
                                                <iframe
                                                    src={embedUrl}
                                                    className="absolute inset-0 w-full h-full"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-video flex items-center justify-center bg-muted">
                                                <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                                                    Watch Video
                                                </a>
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <h3 className="font-medium">{video.title}</h3>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Photos - 4 columns desktop, 2 mobile */}
                {hasPhotos && (
                    <CollapsibleSection
                        title="Press Photos"
                        id="photos"
                        isOpen={sectionStates.photos}
                        onToggle={() => toggleSection('photos')}
                    >
                        <div className="pt-6">
                            <div className="flex justify-end mb-4">
                                {allowDownload && photos.length > 0 && (
                                    <button
                                        onClick={handleDownloadAll}
                                        disabled={downloading}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {downloading ? (
                                            <><Loader2 size={16} className="animate-spin" /> Preparing...</>
                                        ) : (
                                            <><Download size={16} /> Download All</>
                                        )}
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {photos.map((photo, index) => (
                                    <button
                                        key={photo.id}
                                        onClick={() => openLightbox(index)}
                                        className="relative group rounded-xl overflow-hidden aspect-square focus:outline-none focus:ring-2 focus:ring-accent-coral"
                                    >
                                        {/* Featured Badge */}
                                        {photo.isFeatured && (
                                            <div className="absolute top-2 left-2 z-10 bg-accent-coral text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 shadow-lg">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                Featured
                                            </div>
                                        )}
                                        <img
                                            src={photo.thumbnailUrl || photo.imageUrl}
                                            alt={photo.altText}
                                            loading="lazy"
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                                View
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CollapsibleSection>
                )}

                {/* Press Quotes */}
                {hasQuotes && (
                    <CollapsibleSection
                        title="Press"
                        id="quotes"
                        isOpen={sectionStates.quotes}
                        onToggle={() => toggleSection('quotes')}
                    >
                        <div className="pt-6 space-y-10">
                            {quoteCategories.map(category => (
                                <div key={category.id}>
                                    <h3 className="text-sm font-medium text-accent-coral uppercase tracking-wider mb-4">{category.name}</h3>
                                    <div className="space-y-6">
                                        {category.quotes.map(quote => (
                                            <blockquote key={quote.id} className="border-l-4 border-accent-coral pl-6 py-2">
                                                {quote.imageUrl && (
                                                    <div className="mb-3">
                                                        <img
                                                            src={quote.imageUrl}
                                                            alt={`${quote.sourceName} article`}
                                                            className="h-16 w-auto max-w-[200px] object-contain rounded-lg"
                                                        />
                                                    </div>
                                                )}
                                                <p className="text-lg italic mb-2">"{quote.quoteText}"</p>
                                                <footer className="text-muted-foreground">
                                                    —{" "}
                                                    {quote.sourceUrl ? (
                                                        <a href={quote.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent-coral transition-colors">
                                                            {quote.sourceName}
                                                        </a>
                                                    ) : (
                                                        quote.sourceName
                                                    )}
                                                </footer>
                                            </blockquote>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Contact */}
                {hasContact && (
                    <CollapsibleSection
                        title="Contact"
                        id="contact"
                        isOpen={sectionStates.contact}
                        onToggle={() => toggleSection('contact')}
                    >
                        <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {contact.showBookingEmail && contact.bookingEmail && (
                                <a
                                    href={`mailto:${contact.bookingEmail}`}
                                    className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-accent-coral/10 flex items-center justify-center">
                                        <svg className="text-accent-coral w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Booking</p>
                                        <p className="font-medium">{contact.bookingEmail}</p>
                                    </div>
                                </a>
                            )}
                            {contact.showPressEmail && contact.pressEmail && (
                                <a
                                    href={`mailto:${contact.pressEmail}`}
                                    className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-accent-coral/10 flex items-center justify-center">
                                        <svg className="text-accent-coral w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Press</p>
                                        <p className="font-medium">{contact.pressEmail}</p>
                                    </div>
                                </a>
                            )}
                            {contact.showBaseLocation && contact.baseLocation && (
                                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                                    <div className="w-12 h-12 rounded-full bg-accent-coral/10 flex items-center justify-center">
                                        <svg className="text-accent-coral w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Based in</p>
                                        <p className="font-medium">{contact.baseLocation}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}
            </div>

            <Lightbox
                images={lightboxImages}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />
        </>
    );
}
