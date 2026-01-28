"use client";

import { FaSpotify, FaFacebook, FaInstagram, FaYoutube, FaSoundcloud, FaApple } from "react-icons/fa6";
import { RiTwitterXFill } from "react-icons/ri";
import { SiTiktok } from "react-icons/si";

interface SocialIconProps {
  platform: "facebook" | "instagram" | "tiktok" | "youtube" | "spotify" | "twitter" | "x" | "soundcloud" | "appleMusic";
  size?: number;
  className?: string;
}

export function SocialIcon({ platform, size = 20, className = "" }: SocialIconProps) {
  const iconProps = { size, className };
  
  switch (platform) {
    case "facebook":
      return <FaFacebook {...iconProps} />;
    case "instagram":
      return <FaInstagram {...iconProps} />;
    case "tiktok":
      return <SiTiktok {...iconProps} />;
    case "youtube":
      return <FaYoutube {...iconProps} />;
    case "spotify":
      return <FaSpotify {...iconProps} />;
    case "twitter":
    case "x":
      return <RiTwitterXFill {...iconProps} />;
    case "soundcloud":
      return <FaSoundcloud {...iconProps} />;
    case "appleMusic":
      return <FaApple {...iconProps} />;
    default:
      return null;
  }
}

interface SocialLinkProps {
  href: string | null | undefined;
  platform: SocialIconProps["platform"];
  size?: number;
  className?: string;
  showOnHover?: boolean;
}

export function SocialLink({ href, platform, size = 18, className = "", showOnHover = false }: SocialLinkProps) {
  if (!href) return null;
  
  const brandColors: Record<string, string> = {
    facebook: "hover:text-[#1877F2]",
    instagram: "hover:text-[#E4405F]",
    tiktok: "hover:text-foreground",
    youtube: "hover:text-[#FF0000]",
    spotify: "hover:text-[#1DB954]",
    twitter: "hover:text-foreground",
    x: "hover:text-foreground",
    soundcloud: "hover:text-[#FF5500]",
    appleMusic: "hover:text-[#FA243C]",
  };
  
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-10 h-10 rounded-full glass flex items-center justify-center transition-all hover:scale-110 ${brandColors[platform]} ${className}`}
      aria-label={platform.charAt(0).toUpperCase() + platform.slice(1)}
    >
      <SocialIcon platform={platform} size={size} />
    </a>
  );
}

interface SocialLinksRowProps {
  artist: {
    facebookUrl?: string | null;
    instagramUrl?: string | null;
    tiktokUrl?: string | null;
    youtubeUrl?: string | null;
    spotifyUrl?: string | null;
    twitterUrl?: string | null;
    soundcloudUrl?: string | null;
    appleMusicUrl?: string | null;
  } | null;
  size?: number;
  className?: string;
}

export function SocialLinksRow({ artist, size = 18, className = "" }: SocialLinksRowProps) {
  if (!artist) return null;
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <SocialLink href={artist.facebookUrl} platform="facebook" size={size} />
      <SocialLink href={artist.instagramUrl} platform="instagram" size={size} />
      <SocialLink href={artist.tiktokUrl} platform="tiktok" size={size} />
      <SocialLink href={artist.youtubeUrl} platform="youtube" size={size} />
      <SocialLink href={artist.spotifyUrl} platform="spotify" size={size} />
      <SocialLink href={artist.twitterUrl} platform="x" size={size} />
      <SocialLink href={artist.soundcloudUrl} platform="soundcloud" size={size} />
      <SocialLink href={artist.appleMusicUrl} platform="appleMusic" size={size} />
    </div>
  );
}
