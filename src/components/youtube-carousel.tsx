"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoPlay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Play, Youtube, X } from "lucide-react";
import { extractYouTubeVideoId, getYouTubeThumbnailWithFallback } from "@/lib/image-utils";

interface Video {
  id: number;
  title?: string | null;
  youtubeUrl: string;
}

interface YouTubeCarouselProps {
  videos: Video[];
  autoScrollInterval?: number;
  isVisible?: boolean;
  className?: string;
}

export function YouTubeCarousel({
  videos,
  autoScrollInterval = 2000,
  isVisible = true,
  className = ""
}: YouTubeCarouselProps) {
  // Filter out invalid videos
  const validVideos = videos.filter(v => extractYouTubeVideoId(v.youtubeUrl));

  // Track which video is currently playing
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Autoplay plugin - STRICTLY FORWARD direction, never stops
  const autoplayRef = useRef(
    AutoPlay({
      delay: autoScrollInterval,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      stopOnLastSnap: false,   // Never stop on last slide
      playOnInit: true,        // Start immediately
    })
  );

  // Initialize Embla with infinite loop - unidirectional forward flow
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,              // Enable infinite loop
      align: "start",
      slidesToScroll: 1,
      containScroll: false,    // Allow slides to flow freely for seamless loop
      dragFree: false,
      skipSnaps: false,        // Ensure smooth snap behavior
      direction: "ltr",        // Left-to-right (forward) direction
    },
    [autoplayRef.current]
  );

  // Reinitialize carousel and start from middle set for seamless looping
  useEffect(() => {
    if (emblaApi) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        emblaApi.reInit();
        // Scroll to middle set (skip the first set of duplicates)
        emblaApi.scrollTo(validVideos.length, false);
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [emblaApi, validVideos.length]);

  // Navigation handlers
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Handle video play - stops carousel
  const handlePlayVideo = useCallback((videoId: number) => {
    setPlayingVideoId(videoId);
    if (autoplayRef.current) {
      autoplayRef.current.stop();
    }
  }, []);

  // Handle video close
  const handleCloseVideo = useCallback(() => {
    setPlayingVideoId(null);
    if (autoplayRef.current) {
      autoplayRef.current.play();
    }
  }, []);

  // Don't render if not visible or no videos
  if (!isVisible || validVideos.length === 0) {
    return null;
  }

  // If less than 4 videos, show grid instead of carousel
  if (validVideos.length <= 3) {
    return (
      <section id="videos" className={`section-padding px-6 ${className}`}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader />
          <div className={`grid gap-6 ${validVideos.length === 1 ? "max-w-2xl mx-auto" :
            validVideos.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto" :
              "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}>
            {validVideos.map((video, index) => (
              <VideoFacade
                key={video.id}
                video={video}
                isPlaying={playingVideoId === video.id}
                onPlay={() => handlePlayVideo(video.id)}
                onClose={handleCloseVideo}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Carousel mode for 4+ videos
  return (
    <section id="videos" className={`section-padding px-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <SectionHeader />

        {/* Carousel Container */}
        <div
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Navigation Arrows - Glassmorphic Style */}
          <button
            onClick={scrollPrev}
            className={`
              absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 
              w-12 h-12 rounded-full 
              bg-white/20 dark:bg-black/40 backdrop-blur-md 
              border border-white/30 
              flex items-center justify-center 
              transition-all duration-300 
              hover:bg-white/30 dark:hover:bg-black/50 hover:scale-110
              shadow-lg
              ${isHovered ? "opacity-100" : "opacity-0"}
            `}
            aria-label="Previous videos"
          >
            <ChevronLeft size={24} className="text-white drop-shadow-md" />
          </button>

          <button
            onClick={scrollNext}
            className={`
              absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 
              w-12 h-12 rounded-full 
              bg-white/20 dark:bg-black/40 backdrop-blur-md 
              border border-white/30 
              flex items-center justify-center 
              transition-all duration-300 
              hover:bg-white/30 dark:hover:bg-black/50 hover:scale-110
              shadow-lg
              ${isHovered ? "opacity-100" : "opacity-0"}
            `}
            aria-label="Next videos"
          >
            <ChevronRight size={24} className="text-white drop-shadow-md" />
          </button>

          {/* Embla Carousel - Triple videos for seamless infinite loop */}
          <div className="overflow-hidden px-2" ref={emblaRef}>
            <div className="flex gap-6">
              {/* Repeat videos 3x for seamless infinite scrolling */}
              {[...validVideos, ...validVideos, ...validVideos].map((video, index) => (
                <div
                  key={`${video.id}-${index}`}
                  className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                >
                  <VideoFacade
                    video={video}
                    isPlaying={playingVideoId === video.id}
                    onPlay={() => handlePlayVideo(video.id)}
                    onClose={handleCloseVideo}
                    index={index % validVideos.length}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ========================================
// VIDEO FACADE COMPONENT (Premium Glassmorphic Play Button)
// ========================================
interface VideoFacadeProps {
  video: Video;
  isPlaying: boolean;
  onPlay: () => void;
  onClose: () => void;
  index?: number;
}

function VideoFacade({ video, isPlaying, onPlay, onClose, index = 0 }: VideoFacadeProps) {
  const [thumbnailError, setThumbnailError] = useState(false);
  const videoId = extractYouTubeVideoId(video.youtubeUrl);
  const { primary, fallback } = getYouTubeThumbnailWithFallback(video.youtubeUrl);

  const thumbnailSrc = thumbnailError ? fallback : primary;

  if (!videoId) return null;

  return (
    <div
      className="group/card opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
    >
      <div className="glass-card overflow-hidden hover-lift rounded-2xl">
        <div className="relative aspect-video bg-black">
          {isPlaying ? (
            // ========================================
            // ACTIVE STATE: YouTube iframe
            // ========================================
            <div className="relative w-full h-full">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={video.title || "YouTube video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
              {/* Close Button - Glassmorphic */}
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="
                  absolute top-3 right-3 z-10 
                  w-10 h-10 rounded-full 
                  bg-black/50 backdrop-blur-md 
                  border border-white/20 
                  flex items-center justify-center 
                  hover:bg-black/70 hover:scale-110
                  transition-all duration-300 
                  shadow-lg
                "
                aria-label="Close video"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          ) : (
            // ========================================
            // INITIAL STATE: Custom Facade
            // ========================================
            <>
              {/* High-Quality Thumbnail */}
              {thumbnailSrc && (
                <img
                  src={thumbnailSrc}
                  alt={video.title || "Video thumbnail"}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                  onError={() => setThumbnailError(true)}
                  loading="lazy"
                />
              )}

              {/* Gradient Overlay for better contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

              {/* ========================================
                  PREMIUM GLASSMORPHIC PLAY BUTTON
                  ======================================== */}
              <button
                onClick={onPlay}
                className="absolute inset-0 flex items-center justify-center group/play"
                aria-label={`Play ${video.title || "video"}`}
              >
                {/* Outer Glow Ring (appears on hover) */}
                <div className="absolute w-24 h-24 rounded-full bg-white/10 scale-0 group-hover/play:scale-100 transition-transform duration-500 blur-xl" />

                {/* Main Button Container - Frosted Glass */}
                <div className="
                  relative
                  w-20 h-20 
                  rounded-full 
                  bg-white/20 
                  backdrop-blur-md 
                  border border-white/50 
                  flex items-center justify-center 
                  shadow-2xl
                  transition-all duration-300 ease-out
                  group-hover/play:scale-110 
                  group-hover/play:bg-white/30
                  group-hover/play:border-white/70
                  group-hover/play:shadow-[0_0_40px_rgba(255,255,255,0.3)]
                ">
                  {/* Inner Glow */}
                  <div className="absolute inset-2 rounded-full bg-white/10 blur-sm" />

                  {/* Play Icon - Pure White */}
                  <Play
                    size={32}
                    className="
                      relative z-10 
                      text-white 
                      fill-white 
                      ml-1.5
                      drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]
                      transition-transform duration-300
                      group-hover/play:scale-110
                    "
                  />
                </div>
              </button>

              {/* Video Title (if available) */}
              {video.title && (
                <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                  <p className="
                    text-white 
                    font-medium 
                    text-sm 
                    truncate 
                    drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]
                  ">
                    {video.title}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ========================================
// SECTION HEADER
// ========================================
function SectionHeader() {
  return (
    <div className="text-center mb-12">
      <span className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.2em] uppercase text-accent-coral mb-4">
        <Youtube size={16} />
        Watch
      </span>
      <h2 className="font-display text-display-lg tracking-wider uppercase">
        Featured Videos
      </h2>
    </div>
  );
}

export default YouTubeCarousel;
