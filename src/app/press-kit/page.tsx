import Link from "next/link";
import prisma from "@/lib/prisma";
import { Mail, MapPin, Download, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { PressKitClientContent } from "./press-kit-client";

export const revalidate = 60;

// Data fetching functions
async function getPressKitBio() {
    return await prisma.pressKitBio.findFirst();
}

async function getVisiblePhotos() {
    return await prisma.pressPhoto.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
    });
}

async function getVisibleMusicHighlights() {
    const settings = await prisma.pressKitSettings.findFirst();
    const maxTracks = settings?.maxMusicTracks || 5;

    return await prisma.musicHighlight.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
        take: maxTracks,
    });
}

async function getVisibleVideos() {
    return await prisma.pressKitVideo.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
    });
}

async function getVisibleQuotesGrouped() {
    return await prisma.pressQuoteCategory.findMany({
        where: {
            isVisible: true,
            quotes: { some: { isVisible: true } },
        },
        orderBy: { sortOrder: "asc" },
        include: {
            quotes: {
                where: { isVisible: true },
                orderBy: { sortOrder: "asc" },
            },
        },
    });
}

async function getPressKitContact() {
    return await prisma.pressKitContact.findFirst();
}

async function getPressKitSettings() {
    return await prisma.pressKitSettings.findFirst();
}

// Utility to extract video embed URL
function getVideoEmbedUrl(url: string): string | null {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    return null;
}

export default async function PressKitPage() {
    const [bio, photos, musicHighlights, videos, quoteCategories, contact, settings] = await Promise.all([
        getPressKitBio(),
        getVisiblePhotos(),
        getVisibleMusicHighlights(),
        getVisibleVideos(),
        getVisibleQuotesGrouped(),
        getPressKitContact(),
        getPressKitSettings(),
    ]);

    const artistName = "Heiraza";

    // Check if sections have content
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

    return (
        <main className="min-h-screen gradient-warm-bg grain">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
                <div className="max-w-5xl mx-auto">
                    <div className="glass rounded-full px-6 py-3 flex items-center justify-between">
                        <Link href="/" className="hover:opacity-70 transition-opacity">
                            <BrandLogo className="h-8 w-auto" />
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Back to Site
                            </Link>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-32 pb-16 px-4 text-center">
                <h1 className="font-display text-display-lg tracking-widest uppercase mb-4">Press Kit</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Official press materials for {artistName}
                </p>
            </section>

            <div className="max-w-5xl mx-auto px-4 pb-20 space-y-16">
                {/* Bio Section */}
                {hasBio && (
                    <section id="bio" className="glass-card rounded-3xl p-8 md:p-12">
                        <h2 className="font-display text-2xl tracking-wide mb-6">About</h2>
                        {bio.showShortBio && bio.shortBio && (
                            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{bio.shortBio}</p>
                        )}
                        {bio.showLongBio && bio.longBio && (
                            <div className="prose prose-lg dark:prose-invert max-w-none">
                                {bio.longBio.split("\n").map((para, i) => (
                                    <p key={i}>{para}</p>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Music Highlights */}
                {hasMusic && (
                    <section id="music" className="glass-card rounded-3xl p-8 md:p-12">
                        <h2 className="font-display text-2xl tracking-wide mb-6">Featured Music</h2>
                        <div className="space-y-4">
                            {musicHighlights.map(track => (
                                <div key={track.id} className="p-4 bg-muted/30 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-medium">{track.title}</h3>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">{track.platform}</span>
                                    </div>
                                    {track.embedUrl && (
                                        <div className="w-full aspect-[3/1] max-h-[160px] rounded-lg overflow-hidden">
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
                    </section>
                )}

                {/* Videos */}
                {hasVideos && (
                    <section id="videos" className="glass-card rounded-3xl p-8 md:p-12">
                        <h2 className="font-display text-2xl tracking-wide mb-6">Videos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center gap-2">
                                                    Watch Video <ExternalLink size={16} />
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
                    </section>
                )}

                {/* Photos - Client component for interactivity */}
                {hasPhotos && (
                    <PressKitClientContent
                        photos={photos.map(p => ({
                            id: p.id,
                            imageUrl: p.imageUrl,
                            thumbnailUrl: p.thumbnailUrl,
                            altText: p.altText,
                            photographerCredit: p.photographerCredit,
                        }))}
                        allowDownload={settings?.allowPhotoDownload ?? true}
                    />
                )}

                {/* Press Quotes */}
                {hasQuotes && (
                    <section id="quotes" className="glass-card rounded-3xl p-8 md:p-12">
                        <h2 className="font-display text-2xl tracking-wide mb-8">Press</h2>
                        <div className="space-y-10">
                            {quoteCategories.map(category => (
                                <div key={category.id}>
                                    <h3 className="text-sm font-medium text-accent-coral uppercase tracking-wider mb-4">{category.name}</h3>
                                    <div className="space-y-6">
                                        {category.quotes.map(quote => (
                                            <blockquote key={quote.id} className="border-l-4 border-accent-coral pl-6 py-2">
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
                    </section>
                )}

                {/* Contact */}
                {hasContact && (
                    <section id="contact" className="glass-card rounded-3xl p-8 md:p-12">
                        <h2 className="font-display text-2xl tracking-wide mb-6">Contact</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {contact.showBookingEmail && contact.bookingEmail && (
                                <a
                                    href={`mailto:${contact.bookingEmail}`}
                                    className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-accent-coral/10 flex items-center justify-center">
                                        <Mail className="text-accent-coral" size={20} />
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
                                        <Mail className="text-accent-coral" size={20} />
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
                                        <MapPin className="text-accent-coral" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Based in</p>
                                        <p className="font-medium">{contact.baseLocation}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} {artistName}. All rights reserved.
                </p>
            </footer>
        </main>
    );
}
