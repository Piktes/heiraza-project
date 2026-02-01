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
                const res = await fetch("/api/admin/social-media");
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && Array.isArray(json.data)) {
                        const newFormData = { ...formData };
                        json.data.forEach((item: any) => {
                            // Find the platform config that matches this item's platform
                            const config = PLATFORMS.find(p => p.platform === item.platform);
                            if (config) {
                                newFormData[config.key as keyof SocialLinks] = item.url || "";
                            }
                        });
                        setFormData(newFormData);
                    }
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
            // Transform formData back to array format for API
            const updates = PLATFORMS.map(p => ({
                platform: p.platform,
                url: newData[p.key as keyof SocialLinks],
                isVisible: !!newData[p.key as keyof SocialLinks], // Auto-visible if has URL
                sortOrder: 0 // Default order
            }));

            const res = await fetch("/api/admin/social-media", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updates }),
            });
            if (res.ok) {
                setMessage({ type: "success", text: "Changes saved!" });
                setTimeout(() => setMessage(null), 2000);
                router.refresh();
            } else {
                setMessage({ type: "error", text: "Failed to save" });
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
            [key]: currentValue ? "" : "", // Logically this clears it. To "restore" we'd need history, but simplified behaviour is fine: "toggle off" = clear.
        };
        // If it's already empty, user must explicitly add a URL, so toggle does nothing or opens edit.
        if (!currentValue) {
            startEdit(key);
            return;
        }

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

                {/* Social Links Card */}
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

                                    {/* Actions */}
                                    {!isEditing && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => startEdit(platform.key)}
                                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                                                title="Edit link"
                                            >
                                                <Edit2 size={18} className="text-muted-foreground" />
                                            </button>

                                            <button
                                                onClick={() => isActive ? handleDelete(platform.key) : startEdit(platform.key)}
                                                className={`p-2 rounded-lg transition-colors ${isActive
                                                    ? "hover:bg-muted text-accent-coral"
                                                    : "hover:bg-muted text-muted-foreground"
                                                    }`}
                                                title={isActive ? "Deactivate link" : "Activate link"}
                                            >
                                                {isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </button>

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
