"use client";

import { FaSpotify, FaFacebook, FaInstagram, FaYoutube, FaSoundcloud, FaApple } from "react-icons/fa6";
import { RiTwitterXFill } from "react-icons/ri";
import { SiTiktok } from "react-icons/si";

interface SocialIconProps {
  platform: "facebook" | "instagram" | "tiktok" | "youtube" | "spotify" | "twitter" | "x" | "soundcloud" | "appleMusic" | string;
  size?: number;
  className?: string;
}

export function SocialIcon({ platform, size = 20, className = "" }: SocialIconProps) {
  const iconProps = { size, className };

  // Normalize platform string
  const normalizedKey = platform.toLowerCase();

  switch (true) {
    case normalizedKey.includes("facebook"):
      return <FaFacebook {...iconProps} />;
    case normalizedKey.includes("instagram"):
      return <FaInstagram {...iconProps} />;
    case normalizedKey.includes("tiktok"):
      return <SiTiktok {...iconProps} />;
    case normalizedKey.includes("youtube"):
      return <FaYoutube {...iconProps} />;
    case normalizedKey.includes("spotify"):
      return <FaSpotify {...iconProps} />;
    case normalizedKey.includes("twitter") || normalizedKey.includes("x"):
      return <RiTwitterXFill {...iconProps} />;
    case normalizedKey.includes("soundcloud"):
      return <FaSoundcloud {...iconProps} />;
    case normalizedKey.includes("applemusic") || normalizedKey.includes("apple"):
      return <FaApple {...iconProps} />;
    default:
      return null;
  }
}

interface SocialLinkProps {
  href: string | null | undefined;
  platform: string;
  size?: number;
  className?: string;
}

export function SocialLink({ href, platform, size = 18, className = "" }: SocialLinkProps) {
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
    applemusic: "hover:text-[#FA243C]", // lowercase key for safety
    appleMusic: "hover:text-[#FA243C]"
  };

  // Safe color lookup
  const colorClass = brandColors[platform] || brandColors[platform.toLowerCase()] || "hover:text-foreground";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-10 h-10 rounded-full glass flex items-center justify-center transition-all hover:scale-110 ${colorClass} ${className}`}
      aria-label={platform}
    >
      <SocialIcon platform={platform} size={size} />
    </a>
  );
}

// New Interface for DB Row
interface SocialMediaLink {
  id?: number;
  platform: string;
  url: string;
  isVisible: boolean;
}

// Interface for Flat Artist Data (for compatibility)
interface ArtistSocials {
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  spotifyUrl?: string | null;
  twitterUrl?: string | null;
  soundcloudUrl?: string | null;
  appleMusicUrl?: string | null;
  [key: string]: string | null | undefined;
}

interface SocialLinksRowProps {
  links?: SocialMediaLink[] | null;
  artist?: ArtistSocials | null;
  size?: number;
  className?: string;
}

export function SocialLinksRow({ links, artist, size = 18, className = "" }: SocialLinksRowProps) {
  // Normalize data: Prefer 'links' array, but fallback to 'artist' flat fields if provided
  let displayLinks: { platform: string; url: string }[] = [];

  if (links && links.length > 0) {
    displayLinks = links.filter(l => l.isVisible).map(l => ({ platform: l.platform, url: l.url }));
  } else if (artist) {
    const platforms = [
      { key: "spotifyUrl", platform: "spotify" },
      { key: "appleMusicUrl", platform: "appleMusic" },
      { key: "youtubeUrl", platform: "youtube" },
      { key: "instagramUrl", platform: "instagram" },
      { key: "tiktokUrl", platform: "tiktok" },
      { key: "twitterUrl", platform: "twitter" },
      { key: "facebookUrl", platform: "facebook" },
      { key: "soundcloudUrl", platform: "soundcloud" },
    ];

    displayLinks = platforms
      .filter(p => artist[p.key])
      .map(p => ({ platform: p.platform, url: artist[p.key] as string }));
  }

  if (displayLinks.length === 0) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {displayLinks.map(link => (
        <SocialLink
          key={link.platform}
          href={link.url}
          platform={link.platform}
          size={size}
        />
      ))}
    </div>
  );
}
