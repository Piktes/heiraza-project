"use client";

import { getYouTubeEmbedUrl } from "@/lib/image-utils";
import { Youtube, Play } from "lucide-react";

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
    <section id="videos" className="section-padding px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.2em] uppercase text-accent-coral mb-4">
            <Youtube size={16} />
            Watch
          </span>
          <h2 className="font-display text-display-lg tracking-wider uppercase">
            Featured Videos
          </h2>
        </div>

        {/* Videos Grid */}
        <div className={`grid gap-8 ${videos.length === 1 ? "max-w-3xl mx-auto" : "grid-cols-1 lg:grid-cols-2"}`}>
          {embedUrl1 && (
            <VideoEmbed url={embedUrl1} title="Featured Video 1" />
          )}
          {embedUrl2 && (
            <VideoEmbed url={embedUrl2} title="Featured Video 2" />
          )}
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

// Server component version that fetches data
export async function FeaturedVideosSection() {
  // This would be used in page.tsx
  return null;
}
