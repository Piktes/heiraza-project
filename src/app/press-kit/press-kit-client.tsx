"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Lightbox } from "@/components/lightbox";

interface PressPhoto {
    id: number;
    imageUrl: string;
    thumbnailUrl: string | null;
    altText: string;
    photographerCredit: string | null;
}

interface PressKitClientContentProps {
    photos: PressPhoto[];
    allowDownload: boolean;
}

export function PressKitClientContent({ photos, allowDownload }: PressKitClientContentProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [downloading, setDownloading] = useState(false);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const handleDownloadAll = async () => {
        if (photos.length === 0) return;

        setDownloading(true);

        try {
            // Dynamically import JSZip only when needed
            const JSZip = (await import("jszip")).default;
            const zip = new JSZip();

            // Fetch all images and add to zip
            const promises = photos.map(async (photo, index) => {
                try {
                    const response = await fetch(photo.imageUrl);
                    const blob = await response.blob();
                    const ext = photo.imageUrl.split(".").pop() || "jpg";
                    const filename = `press-photo-${index + 1}.${ext}`;
                    zip.file(filename, blob);
                } catch (error) {
                    console.error(`Failed to fetch ${photo.imageUrl}:`, error);
                }
            });

            await Promise.all(promises);

            // Generate and download ZIP
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

    return (
        <>
            <section id="photos" className="glass-card rounded-3xl p-8 md:p-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl tracking-wide">Press Photos</h2>
                    {allowDownload && photos.length > 0 && (
                        <button
                            onClick={handleDownloadAll}
                            disabled={downloading}
                            className="btn-primary flex items-center gap-2"
                        >
                            {downloading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Preparing...
                                </>
                            ) : (
                                <>
                                    <Download size={16} />
                                    Download All
                                </>
                            )}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                        <button
                            key={photo.id}
                            onClick={() => openLightbox(index)}
                            className="relative group rounded-xl overflow-hidden aspect-square focus:outline-none focus:ring-2 focus:ring-accent-coral"
                        >
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
            </section>

            <Lightbox
                images={lightboxImages}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />
        </>
    );
}
