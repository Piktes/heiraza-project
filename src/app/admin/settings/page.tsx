"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Save, Loader2, Youtube, Image as ImageIcon } from "lucide-react";
import { ImageUploadWithCrop } from "@/components/image-upload-with-crop";
import { SocialIcon } from "@/components/social-icons";
import { InfoBar } from "@/components/admin/info-bar";

interface Artist {
  id: number;
  name: string;
  bio: string;
  heroImage: string;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  twitterUrl: string | null;
  youtubeEmbedUrl1: string | null;
  youtubeEmbedUrl2: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [heroImageData, setHeroImageData] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    heroImage: "",
    facebookUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
    youtubeUrl: "",
    spotifyUrl: "",
    twitterUrl: "",
    youtubeEmbedUrl1: "",
    youtubeEmbedUrl2: "",
  });

  // Fetch artist data
  useEffect(() => {
    async function fetchArtist() {
      try {
        const res = await fetch("/api/admin/artist");
        if (res.ok) {
          const data = await res.json();
          setArtist(data);
          setFormData({
            name: data.name || "",
            bio: data.bio || "",
            heroImage: data.heroImage || "",
            facebookUrl: data.facebookUrl || "",
            instagramUrl: data.instagramUrl || "",
            tiktokUrl: data.tiktokUrl || "",
            youtubeUrl: data.youtubeUrl || "",
            spotifyUrl: data.spotifyUrl || "",
            twitterUrl: data.twitterUrl || "",
            youtubeEmbedUrl1: data.youtubeEmbedUrl1 || "",
            youtubeEmbedUrl2: data.youtubeEmbedUrl2 || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch artist:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArtist();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHeroImageUpload = (file: File, dataUrl: string) => {
    setHeroImageData(dataUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      // If there's a new hero image, upload it first
      let heroImageUrl = formData.heroImage;

      if (heroImageData) {
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: heroImageData,
            folder: "hero"
          }),
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          heroImageUrl = uploadData.url;
        } else {
          throw new Error("Failed to upload hero image");
        }
      }

      // Update artist data
      const res = await fetch("/api/admin/artist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: artist?.id,
          ...formData,
          heroImage: heroImageUrl,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
        setHeroImageData(null);
        router.refresh();
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save settings"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-warm-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-coral" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* InfoBar */}
      <InfoBar />

      <main className="max-w-4xl mx-auto px-4 pb-10">
        <div className="mb-8">
          <h1 className="font-display text-display-md tracking-wider uppercase">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your artist profile, social links, and featured content</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl ${message.type === "success"
            ? "bg-green-500/10 border border-green-500/20 text-green-600"
            : "bg-red-500/10 border border-red-500/20 text-red-600"
            }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ========================================
              HERO IMAGE SECTION
              ======================================== */}
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <ImageIcon className="text-accent-coral" size={24} />
              <h2 className="font-display text-2xl tracking-wide">Hero Image</h2>
            </div>

            <ImageUploadWithCrop
              aspect={16 / 9}
              currentImage={heroImageData || formData.heroImage || null}
              onUpload={handleHeroImageUpload}
              label="Homepage Hero Image"
              helpText="This image appears as the main background on your homepage. Recommended: 1920x1080px (16:9)"
              maxWidth={1920}
            />
          </div>

          {/* ========================================
              BASIC INFO SECTION
              ======================================== */}
          <div className="glass-card p-8">
            <h2 className="font-display text-2xl tracking-wide mb-6">Basic Info</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Artist Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Biography</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={6}
                  className="input-field resize-none"
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Use double line breaks to create paragraphs
                </p>
              </div>
            </div>
          </div>

          {/* ========================================
              YOUTUBE FEATURED VIDEOS
              ======================================== */}
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <Youtube className="text-red-500" size={24} />
              <div>
                <h2 className="font-display text-2xl tracking-wide">Featured Videos</h2>
                <p className="text-sm text-muted-foreground">These videos will be displayed on your homepage</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Featured Video 1 (YouTube URL)
                </label>
                <input
                  type="url"
                  name="youtubeEmbedUrl1"
                  value={formData.youtubeEmbedUrl1}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Paste any YouTube URL - we&apos;ll convert it automatically
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Featured Video 2 (YouTube URL)
                </label>
                <input
                  type="url"
                  name="youtubeEmbedUrl2"
                  value={formData.youtubeEmbedUrl2}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            </div>
          </div>

          {/* ========================================
              SOCIAL MEDIA LINKS
              ======================================== */}
          <div className="glass-card p-8">
            <h2 className="font-display text-2xl tracking-wide mb-6">Social Media Links</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <SocialIcon platform="facebook" size={16} /> Facebook
                </label>
                <input
                  type="url"
                  name="facebookUrl"
                  value={formData.facebookUrl}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <SocialIcon platform="instagram" size={16} /> Instagram
                </label>
                <input
                  type="url"
                  name="instagramUrl"
                  value={formData.instagramUrl}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <SocialIcon platform="tiktok" size={16} /> TikTok
                </label>
                <input
                  type="url"
                  name="tiktokUrl"
                  value={formData.tiktokUrl}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="https://tiktok.com/@..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <SocialIcon platform="youtube" size={16} /> YouTube Channel
                </label>
                <input
                  type="url"
                  name="youtubeUrl"
                  value={formData.youtubeUrl}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <SocialIcon platform="spotify" size={16} /> Spotify
                </label>
                <input
                  type="url"
                  name="spotifyUrl"
                  value={formData.spotifyUrl}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="https://open.spotify.com/..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <SocialIcon platform="x" size={16} /> Twitter / X
                </label>
                <input
                  type="url"
                  name="twitterUrl"
                  value={formData.twitterUrl}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="https://twitter.com/..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save All Settings
                </>
              )}
            </button>
            <Link href="/admin" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
