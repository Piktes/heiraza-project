import Link from "next/link";
import prisma from "@/lib/prisma";
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

    return (
        <main className="min-h-screen gradient-warm-bg grain relative">
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
            <section className="pt-32 pb-16 px-4 text-center relative z-10">
                <h1 className="font-display text-display-lg tracking-widest uppercase mb-4">Press Kit</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Official press materials for {artistName}
                </p>
            </section>

            {/* Main Content - Client Component handles interactivity */}
            <PressKitClientContent
                bio={bio ? {
                    shortBio: bio.shortBio,
                    longBio: bio.longBio,
                    showShortBio: bio.showShortBio,
                    showLongBio: bio.showLongBio,
                } : null}
                photos={photos.map(p => ({
                    id: p.id,
                    imageUrl: p.imageUrl,
                    thumbnailUrl: p.thumbnailUrl,
                    altText: p.altText,
                    photographerCredit: p.photographerCredit,
                }))}
                musicHighlights={musicHighlights.map(m => ({
                    id: m.id,
                    title: m.title,
                    platform: m.platform,
                    embedUrl: m.embedUrl,
                }))}
                videos={videos.map(v => ({
                    id: v.id,
                    title: v.title,
                    videoUrl: v.videoUrl,
                }))}
                quoteCategories={quoteCategories.map(c => ({
                    id: c.id,
                    name: c.name,
                    quotes: c.quotes.map(q => ({
                        id: q.id,
                        quoteText: q.quoteText,
                        sourceName: q.sourceName,
                        sourceUrl: q.sourceUrl,
                    })),
                }))}
                contact={contact ? {
                    bookingEmail: contact.bookingEmail,
                    pressEmail: contact.pressEmail,
                    baseLocation: contact.baseLocation,
                    showBookingEmail: contact.showBookingEmail,
                    showPressEmail: contact.showPressEmail,
                    showBaseLocation: contact.showBaseLocation,
                } : null}
                allowDownload={settings?.allowPhotoDownload ?? true}
            />

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-border text-center relative z-10">
                <p className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} {artistName}. All rights reserved.
                </p>
            </footer>
        </main>
    );
}
