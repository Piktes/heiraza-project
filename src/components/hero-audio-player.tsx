"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music2 } from "lucide-react";

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

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Don't render if not visible or no tracks
  if (!isVisible || !tracks || tracks.length === 0) {
    return null;
  }

  const currentTrack = tracks[currentTrackIndex];
  const hasMultipleTracks = tracks.length > 1;

  // Get audio source from track (prefer fileUrl, fallback to externalLink)
  const getAudioSrc = (track: Track) => track.fileUrl || track.externalLink || "";

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !getAudioSrc(currentTrack)) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentTrack]);

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

  // Handle progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // Format time (seconds to MM:SS)
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (hasMultipleTracks) {
        setCurrentTrackIndex((prev) => (prev === tracks.length - 1 ? 0 : prev + 1));
        setTimeout(() => {
          if (audioRef.current) {
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
  }, [currentTrackIndex, hasMultipleTracks, tracks.length]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const audioSrc = getAudioSrc(currentTrack);

  return (
    <div className="w-full max-w-lg mx-auto mt-8 opacity-0 animate-fade-in animate-delay-500">
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
        bg-black/30 dark:bg-black/40
        backdrop-blur-xl
        border border-white/20 dark:border-white/10
        rounded-2xl
        shadow-2xl
        p-4
      ">
        {/* Background Gradient Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-coral/10 via-transparent to-accent-peach/10 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          {/* ========================================
              COVER IMAGE (Left Side)
              ======================================== */}
          <div className="
            relative shrink-0
            w-16 h-16 sm:w-20 sm:h-20
            rounded-xl overflow-hidden
            bg-neutral-100 dark:bg-neutral-800
            shadow-lg
          ">
            {currentTrack?.coverImage ? (
              <Image
                src={currentTrack.coverImage}
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
            <div className="mb-2">
              <p className="font-medium text-white text-sm sm:text-base truncate drop-shadow-md">
                {currentTrack?.title || "No Track"}
              </p>
              <p className="text-xs sm:text-sm text-white/60 truncate">
                {currentTrack?.artist || "Heiraza"}
              </p>
            </div>

            {/* Progress Bar */}
            <div
              ref={progressRef}
              className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group mb-2"
              onClick={handleProgressClick}
            >
              {/* Progress Fill */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-coral to-accent-peach rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
              {/* Hover Indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progressPercent}% - 6px)` }}
              />
            </div>

            {/* Time Display */}
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-white/50 mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* ========================================
                CONTROLS
                ======================================== */}
            <div className="flex items-center justify-between">
              {/* Volume (Left) */}
              <button
                onClick={toggleMute}
                className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              {/* Main Controls (Center) */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Previous - Only show if multiple tracks */}
                {hasMultipleTracks && (
                  <button
                    onClick={prevTrack}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                    aria-label="Previous track"
                  >
                    <SkipBack size={18} />
                  </button>
                )}

                {/* Play/Pause Button - Glassmorphic */}
                <button
                  onClick={togglePlay}
                  disabled={!audioSrc}
                  className="
                    w-12 h-12 sm:w-14 sm:h-14
                    rounded-full 
                    bg-white/20 
                    backdrop-blur-md 
                    border border-white/40
                    flex items-center justify-center 
                    transition-all duration-300
                    hover:bg-white/30 
                    hover:scale-105 
                    hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-xl
                  "
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause size={22} className="text-white fill-white" />
                  ) : (
                    <Play size={22} className="text-white fill-white ml-1" />
                  )}
                </button>

                {/* Next - Only show if multiple tracks */}
                {hasMultipleTracks && (
                  <button
                    onClick={nextTrack}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                    aria-label="Next track"
                  >
                    <SkipForward size={18} />
                  </button>
                )}
              </div>

              {/* Track Counter (Right) - Only show if multiple tracks */}
              {hasMultipleTracks ? (
                <span className="text-[10px] sm:text-xs text-white/40 min-w-[40px] text-right">
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
