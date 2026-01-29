"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Share2, Eye, EyeOff, Trash2, Edit2, X, Check } from "lucide-react";
import { SocialIcon } from "@/components/social-icons";
import { InfoBar } from "@/components/admin/info-bar";

interface SocialLinks {
    facebookUrl: string;
    instagramUrl: string;
    tiktokUrl: string;
    youtubeUrl: string;
    spotifyUrl: string;
    appleMusicUrl: string;
    soundcloudUrl: string;
    twitterUrl: string;
}

const PLATFORMS = [
    { key: "facebookUrl", label: "Facebook", platform: "facebook" as const, placeholder: "https://facebook.com/yourpage" },
    { key: "instagramUrl", label: "Instagram", platform: "instagram" as const, placeholder: "https://instagram.com/yourhandle" },
    { key: "tiktokUrl", label: "TikTok", platform: "tiktok" as const, placeholder: "https://tiktok.com/@yourhandle" },
    { key: "youtubeUrl", label: "YouTube", platform: "youtube" as const, placeholder: "https://youtube.com/c/yourchannel" },
    { key: "spotifyUrl", label: "Spotify", platform: "spotify" as const, placeholder: "https://open.spotify.com/artist/..." },
    { key: "appleMusicUrl", label: "Apple Music", platform: "appleMusic" as const, placeholder: "https://music.apple.com/artist/..." },
    { key: "soundcloudUrl", label: "SoundCloud", platform: "soundcloud" as const, placeholder: "https://soundcloud.com/yourname" },
    { key: "twitterUrl", label: "Twitter / X", platform: "x" as const, placeholder: "https://twitter.com/yourhandle" },
];

export default function SocialMediaPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [artistId, setArtistId] = useState<number | null>(null);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    const [formData, setFormData] = useState<SocialLinks>({
        facebookUrl: "",
        instagramUrl: "",
        tiktokUrl: "",
        youtubeUrl: "",
        spotifyUrl: "",
        appleMusicUrl: "",
        soundcloudUrl: "",
        twitterUrl: "",
    });

    // Fetch current social links
    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/admin/artist");
                if (res.ok) {
                    const data = await res.json();
                    setArtistId(data.id);
                    setFormData({
                        facebookUrl: data.facebookUrl || "",
                        instagramUrl: data.instagramUrl || "",
                        tiktokUrl: data.tiktokUrl || "",
                        youtubeUrl: data.youtubeUrl || "",
                        spotifyUrl: data.spotifyUrl || "",
                        appleMusicUrl: data.appleMusicUrl || "",
                        soundcloudUrl: data.soundcloudUrl || "",
                        twitterUrl: data.twitterUrl || "",
                    });
                }
            } catch (error) {
                console.error("Failed to fetch:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Save changes to API
    const saveChanges = async (newData: SocialLinks) => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/social-media", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: artistId, ...newData }),
            });
            if (res.ok) {
                setMessage({ type: "success", text: "Changes saved!" });
                setTimeout(() => setMessage(null), 2000);
                router.refresh();
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to save" });
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle visibility (clear or restore the URL)
    const handleToggle = async (key: string) => {
        const currentValue = formData[key as keyof SocialLinks];
        const newData = {
            ...formData,
            [key]: currentValue ? "" : "", // Clear the URL to "deactivate"
        };
        // If already empty, we can't toggle it - user needs to add a URL first
        if (!currentValue) return;

        setFormData(newData);
        await saveChanges(newData);
    };

    // Delete (clear the URL)
    const handleDelete = async (key: string) => {
        const newData = {
            ...formData,
            [key]: "",
        };
        setFormData(newData);
        await saveChanges(newData);
    };

    // Start editing
    const startEdit = (key: string) => {
        setEditingKey(key);
        setEditValue(formData[key as keyof SocialLinks]);
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingKey(null);
        setEditValue("");
    };

    // Save edit
    const saveEdit = async () => {
        if (!editingKey) return;
        const newData = {
            ...formData,
            [editingKey]: editValue,
        };
        setFormData(newData);
        await saveChanges(newData);
        setEditingKey(null);
        setEditValue("");
    };

    const activeCount = Object.values(formData).filter(v => v && v.trim() !== "").length;

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
            <InfoBar counter={`${activeCount}/8 active`} />

            <main className="max-w-4xl mx-auto px-4 pb-10">
                <div className="mb-8">
                    <h1 className="font-display text-display-md tracking-wider uppercase">Social Media</h1>
                    <p className="text-muted-foreground mt-2">Manage your social media links. Active links appear on your website.</p>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl ${message.type === "success"
                        ? "bg-green-500/10 border border-green-500/20 text-green-600"
                        : "bg-red-500/10 border border-red-500/20 text-red-600"
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Social Links Card (Track Manager Style) */}
                <div className="glass-card p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Share2 className="text-accent-coral" size={24} />
                            <div>
                                <h2 className="font-display text-2xl tracking-wide">Platform Links</h2>
                                <p className="text-sm text-muted-foreground">
                                    {activeCount} active / {8 - activeCount} inactive
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ========================================
              SOCIAL LINKS LIST (Track Manager Style)
              ======================================== */}
                    <div className="space-y-3">
                        {PLATFORMS.map((platform) => {
                            const value = formData[platform.key as keyof SocialLinks];
                            const isActive = value && value.trim() !== "";
                            const isEditing = editingKey === platform.key;

                            return (
                                <div
                                    key={platform.key}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isActive
                                        ? "bg-background/50 border-border"
                                        : "bg-muted/30 border-muted opacity-60"
                                        }`}
                                >
                                    {/* Platform Icon */}
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive
                                        ? "bg-gradient-to-br from-accent-coral/20 to-accent-peach/20"
                                        : "bg-muted"
                                        }`}>
                                        <SocialIcon platform={platform.platform} size={24} />
                                    </div>

                                    {/* Platform Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium">{platform.label}</p>
                                        {isEditing ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <input
                                                    type="url"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    placeholder={platform.placeholder}
                                                    className="input-field flex-1 text-sm py-1"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={saveEdit}
                                                    className="p-1.5 rounded-lg bg-green-500 hover:bg-green-600 transition-colors"
                                                >
                                                    <Check size={14} className="text-white" />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground truncate">
                                                {isActive ? value : "No link added"}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions (Track Manager Style) */}
                                    {!isEditing && (
                                        <div className="flex items-center gap-2">
                                            {/* Edit Button */}
                                            <button
                                                onClick={() => startEdit(platform.key)}
                                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                                                title="Edit link"
                                            >
                                                <Edit2 size={18} className="text-muted-foreground" />
                                            </button>

                                            {/* Toggle Active (Eye Icon) */}
                                            <button
                                                onClick={() => isActive && handleDelete(platform.key)}
                                                className={`p-2 rounded-lg transition-colors ${isActive
                                                    ? "hover:bg-muted text-accent-coral"
                                                    : "hover:bg-muted text-muted-foreground cursor-not-allowed"
                                                    }`}
                                                title={isActive ? "Link is active (click to deactivate)" : "No link to toggle"}
                                                disabled={!isActive}
                                            >
                                                {isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </button>

                                            {/* Delete (Trash Icon) */}
                                            <button
                                                onClick={() => handleDelete(platform.key)}
                                                className={`p-2 rounded-lg transition-colors ${isActive
                                                    ? "hover:bg-red-50 dark:hover:bg-red-950"
                                                    : "opacity-50 cursor-not-allowed"
                                                    }`}
                                                title="Delete link"
                                                disabled={!isActive}
                                            >
                                                <Trash2 size={18} className="text-red-500" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-8 p-6 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">How it works:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li><Eye size={14} className="inline text-accent-coral" /> Active links appear as icons on your site</li>
                        <li><EyeOff size={14} className="inline" /> Inactive/empty links are hidden</li>
                        <li>Click <Edit2 size={14} className="inline" /> to edit or add a URL</li>
                        <li>Click <Trash2 size={14} className="inline text-red-500" /> to remove a link</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
