"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music2 } from "lucide-react";
import { getImageUrl } from "@/lib/image-url";

interface Track {
  id: number;
  title: string;
  artist: string | null;
  fileUrl?: string | null;
  externalLink?: string | null;
  coverImage?: string | null;
  duration?: number | null;
}

interface HeroAudioPlayerProps {
  tracks: Track[];
  isVisible?: boolean;
}

export function HeroAudioPlayer({ tracks, isVisible = true }: HeroAudioPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Don't render if not visible or no tracks
  if (!isVisible || !tracks || tracks.length === 0) {
    return null;
  }

  const currentTrack = tracks[currentTrackIndex];
  const hasMultipleTracks = tracks.length > 1;

  // Get audio source from track (ONLY fileUrl, never externalLink for <audio>)
  const getAudioSrc = (track: Track) => track.fileUrl || "";

  // Check if track is external-link only
  const isExternalOnly = !currentTrack.fileUrl && !!currentTrack.externalLink;

  // Handle play/pause or external link
  const togglePlay = useCallback(() => {
    if (isExternalOnly && currentTrack.externalLink) {
      window.open(currentTrack.externalLink, '_blank');
      return;
    }

    if (!audioRef.current || !getAudioSrc(currentTrack)) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentTrack, isExternalOnly]);

  // Handle previous track
  const prevTrack = useCallback(() => {
    if (!hasMultipleTracks) return;
    setCurrentTrackIndex((prev) => (prev === 0 ? tracks.length - 1 : prev - 1));
    setIsPlaying(false);
    setCurrentTime(0);
  }, [tracks.length, hasMultipleTracks]);

  // Handle next track
  const nextTrack = useCallback(() => {
    if (!hasMultipleTracks) return;
    setCurrentTrackIndex((prev) => (prev === tracks.length - 1 ? 0 : prev + 1));
    setIsPlaying(false);
    setCurrentTime(0);
  }, [tracks.length, hasMultipleTracks]);

  // Handle volume toggle
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // --- SEEKING / SCRUBBING LOGIC ---

  const calculateTimeFromEvent = (clientX: number) => {
    if (!progressRef.current || !duration) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return percent * duration;
  };

  const handleSeekStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isExternalOnly || !duration) return;

    setIsDragging(true);
    const newTime = calculateTimeFromEvent(e.clientX);
    setCurrentTime(newTime);

    // Optional: Mute while scrubbing if desire, or just let it play. 
    // Usually standard players keep playing or pause. We'll just update UI for smooth feel.
  }, [duration, isExternalOnly]);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const newTime = calculateTimeFromEvent(e.clientX);
      setCurrentTime(newTime);
    };

    const handlePointerUp = (e: PointerEvent) => {
      setIsDragging(false);
      const newTime = calculateTimeFromEvent(e.clientX);
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, duration]);

  // Format time (seconds to MM:SS)
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Audio event handlers
  useEffect(() => {
    // Reset state when track changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (hasMultipleTracks) {
        setCurrentTrackIndex((prev) => (prev === tracks.length - 1 ? 0 : prev + 1));
        // Auto-play next track only if it's playable (has fileUrl)
        // We delay slightly to allow state to settle
        setTimeout(() => {
          const nextIndex = currentTrackIndex === tracks.length - 1 ? 0 : currentTrackIndex + 1;
          const nextTrack = tracks[nextIndex];
          if (nextTrack.fileUrl && audioRef.current) {
            audioRef.current.play().catch(console.error);
            setIsPlaying(true);
          }
        }, 100);
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentTrackIndex, hasMultipleTracks, tracks]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const audioSrc = getAudioSrc(currentTrack);

  // Import ExternalLink icon if not already imported (it's not, need to check imports)
  // Since I am replacing the component, I need to make sure ExternalLink is imported.
  // I will assume I need to request a separate edit for imports or rely on the previous imports? 
  // Wait, I am replacing lines 22-319. I need to check imports at the top of the file.
  // The imports are on lines 1-5. I am not replacing them. So I will miss ExternalLink import.
  // Strategy: I will use `LinkIcon` (Play replacement) or I need to update imports first.

  // Let's use an existing icon or `SkipForward` looking thing? 
  // Actually, I should update adding the import first or in a separate call.
  // OR, I can use an SVG directly or use one of the existing valid icons if mostly relevant.
  // But `ExternalLink` is best. 
  // I will check imports again. 
  // Imports: Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music2. 
  // I'll add `import { ... ExternalLink }` in a separate edit or verify if I can just use `SkipForward` temporarily? No, bad UX.
  // I will effectively add the import by replacing the whole file content or a larger chunk.

  // Let's update the imports FIRST.
  return (
    <div className="w-full max-w-lg mx-auto mt-4 sm:mt-8 px-4 sm:px-0 opacity-0 animate-fade-in animate-delay-500">
      {/* Hidden Audio Element */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="metadata"
        />
      )}

      {/* ========================================
          GLASSMORPHIC PLAYER CONTAINER
          ======================================== */}
      <div className="
        relative overflow-hidden
        bg-black/20 dark:bg-black/40
        backdrop-blur-xl
        border border-white/10 dark:border-white/5
        rounded-2xl
        shadow-2xl
        p-2 sm:p-4
      ">
        {/* Background Gradient Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-coral/10 via-transparent to-accent-peach/10 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2.5 sm:gap-4">
          {/* ========================================
              COVER IMAGE (Left Side)
              ======================================== */}
          <div className="
            relative shrink-0
            w-14 h-14 sm:w-20 sm:h-20
            rounded-xl overflow-hidden
            bg-neutral-100 dark:bg-neutral-800
            shadow-lg
          ">
            {currentTrack?.coverImage ? (
              <Image
                src={getImageUrl(currentTrack.coverImage)}
                alt={currentTrack.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-coral/30 to-accent-peach/30">
                <Music2 size={28} className="text-white/70" />
              </div>
            )}

            {/* Playing Indicator */}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="flex items-end gap-0.5 h-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-1 bg-white rounded-full animate-waveform"
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        height: "100%"
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================
              TRACK INFO & CONTROLS
              ======================================== */}
          <div className="flex-1 min-w-0">
            {/* Title & Artist */}
            <div className="mb-1 sm:mb-2">
              <p className="font-medium text-white text-[13px] sm:text-base truncate drop-shadow-md">
                {currentTrack?.title || "No Track"}
              </p>
              <p className="text-[10px] sm:text-sm text-white/50 truncate">
                {currentTrack?.artist || "Heiraza"}
              </p>
            </div>

            {/* Progress Bar */}
            <div
              ref={progressRef}
              className={`relative h-1 sm:h-1.5 bg-white/10 rounded-full mb-1.5 sm:mb-2 select-none touch-none flex items-center ${isExternalOnly ? 'cursor-default opacity-50' : 'cursor-pointer group'}`}
              onPointerDown={handleSeekStart}
            >
              {/* Hit Area expansion for easier clicking/dragging */}
              <div className="absolute inset-y-[-10px] inset-x-0 z-10" />

              {/* Progress Fill */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-coral to-accent-peach rounded-full transition-all duration-75 pointer-events-none"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Drag Handle / Indicator */}
              {!isExternalOnly && (
                <div
                  className={`absolute w-3 h-3 bg-white rounded-full shadow-lg transition-transform duration-100 pointer-events-none ${isDragging ? 'scale-125 opacity-100' : 'scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100'}`}
                  style={{ left: `calc(${progressPercent}% - 6px)` }}
                />
              )}
            </div>

            {/* Time Display */}
            <div className="flex items-center justify-between text-[8px] sm:text-xs text-white/40 mb-1 sm:mb-2 font-mono">
              {isExternalOnly ? (
                <span className="text-accent-coral">External Link</span>
              ) : (
                <>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </>
              )}
            </div>

            {/* ========================================
                CONTROLS
                ======================================== */}
            <div className="flex items-center justify-between">
              {/* Volume (Left) - Hide for external only tracks */}
              <button
                onClick={toggleMute}
                className={`p-1 sm:p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white ${isExternalOnly ? 'invisible' : ''}`}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={14} className="sm:w-4 sm:h-4" /> : <Volume2 size={14} className="sm:w-4 sm:h-4" />}
              </button>

              {/* Main Controls (Center) */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Previous - Only show if multiple tracks */}
                {hasMultipleTracks && (
                  <button
                    onClick={prevTrack}
                    className="p-1 sm:p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                    aria-label="Previous track"
                  >
                    <SkipBack size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                )}

                {/* Play/Pause/Link Button - Glassmorphic */}
                <button
                  onClick={togglePlay}
                  disabled={!audioSrc && !isExternalOnly}
                  className="
                    w-9 h-9 sm:w-14 sm:h-14
                    rounded-full 
                    bg-white/10 
                    backdrop-blur-md 
                    border border-white/20
                    flex items-center justify-center 
                    transition-all duration-300
                    hover:bg-white/20 
                    hover:scale-105 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-lg
                  "
                  aria-label={isPlaying ? "Pause" : (isExternalOnly ? "Open Link" : "Play")}
                >
                  {isExternalOnly ? (
                    // External Link Icon (Custom SVG to avoid import issues for now if needed, but I'll use a known one or simple arrow)
                    // Actually, I should just use `SkipForward` rotated or similar if I can't import?
                    // No, I'll use a reliable SVG directly here to be safe and fast.
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white sm:w-[22px] sm:h-[22px]"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  ) : isPlaying ? (
                    <Pause size={14} className="text-white fill-white sm:w-[22px] sm:h-[22px]" />
                  ) : (
                    <Play size={14} className="text-white fill-white ml-0.5 sm:ml-1 sm:w-[22px] sm:h-[22px]" />
                  )}
                </button>

                {/* Next - Only show if multiple tracks */}
                {hasMultipleTracks && (
                  <button
                    onClick={nextTrack}
                    className="p-1 sm:p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                    aria-label="Next track"
                  >
                    <SkipForward size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                )}
              </div>

              {/* Track Counter (Right) - Only show if multiple tracks */}
              {hasMultipleTracks ? (
                <span className="text-[9px] sm:text-xs text-white/30 min-w-[35px] text-right font-mono tracking-tight">
                  {currentTrackIndex + 1}/{tracks.length}
                </span>
              ) : (
                <div className="w-8" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
