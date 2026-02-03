"use client";

import { useState, useEffect, useCallback } from "react";
import { getYouTubeEmbedUrl } from "@/lib/image-utils";
import { Youtube, ChevronLeft, ChevronRight } from "lucide-react";

interface FeaturedVideosProps {
  youtubeUrl1?: string | null;
  youtubeUrl2?: string | null;
}

export function FeaturedVideos({ youtubeUrl1, youtubeUrl2 }: FeaturedVideosProps) {
  const embedUrl1 = youtubeUrl1 ? getYouTubeEmbedUrl(youtubeUrl1) : null;
  const embedUrl2 = youtubeUrl2 ? getYouTubeEmbedUrl(youtubeUrl2) : null;

  // Don't render if no videos
  if (!embedUrl1 && !embedUrl2) {
    return null;
  }

  const videos = [embedUrl1, embedUrl2].filter(Boolean) as string[];

  return (
    <section id="videos" className="section-padding px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-16">
          <span className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.2em] uppercase text-accent-coral mb-4">
            <Youtube size={16} />
            Watch
          </span>
          <h2 className="font-display text-display-md sm:text-display-lg tracking-wider uppercase">
            Featured Videos
          </h2>
        </div>

        {/* Desktop: Grid layout, Mobile: Carousel */}
        <div className="hidden sm:grid gap-8 grid-cols-1 lg:grid-cols-2">
          {embedUrl1 && (
            <VideoEmbed url={embedUrl1} title="Featured Video 1" />
          )}
          {embedUrl2 && (
            <VideoEmbed url={embedUrl2} title="Featured Video 2" />
          )}
        </div>

        {/* Mobile Only: Carousel */}
        <div className="sm:hidden">
          <MobileVideoCarousel videos={videos} />
        </div>
      </div>
    </section>
  );
}

interface VideoEmbedProps {
  url: string;
  title: string;
}

function VideoEmbed({ url, title }: VideoEmbedProps) {
  return (
    <div className="group">
      <div className="glass-card overflow-hidden hover-lift">
        <div className="relative aspect-video">
          <iframe
            src={`${url}?rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}

// Mobile Carousel with Loop
function MobileVideoCarousel({ videos }: { videos: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextVideo = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  }, [videos.length]);

  const prevVideo = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  }, [videos.length]);

  // Auto-advance every 8 seconds for mobile loop
  useEffect(() => {
    if (videos.length <= 1) return;
    const interval = setInterval(nextVideo, 8000);
    return () => clearInterval(interval);
  }, [videos.length, nextVideo]);

  if (videos.length === 0) return null;

  return (
    <div className="relative">
      {/* Current Video */}
      <VideoEmbed url={videos[currentIndex]} title={`Video ${currentIndex + 1}`} />

      {/* Navigation - Only show if multiple videos */}
      {videos.length > 1 && (
        <>
          {/* Navigation Arrows */}
          <div className="flex justify-center items-center gap-4 mt-4">
            <button
              onClick={prevVideo}
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
              aria-label="Previous video"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Dots Indicator */}
            <div className="flex items-center gap-2">
              {videos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex
                      ? "bg-accent-coral w-4"
                      : "bg-foreground/30 hover:bg-foreground/50"
                    }`}
                  aria-label={`View video ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextVideo}
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
              aria-label="Next video"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Server component version that fetches data
export async function FeaturedVideosSection() {
  // This would be used in page.tsx
  return null;
}
