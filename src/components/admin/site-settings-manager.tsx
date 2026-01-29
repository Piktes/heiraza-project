"use client";

import { useTransition } from "react";
import {
    Settings, Music2, ShoppingBag, Share2, Youtube,
    ImageIcon, Sparkles, Loader2
} from "lucide-react";

interface SiteSettings {
    id: number;
    isAudioPlayerVisible: boolean;
    isShopVisible: boolean;
    isSocialLinksVisible: boolean;
    isYoutubeVisible: boolean;
    youtubeAutoScroll: boolean;
    youtubeScrollInterval: number;
    heroSliderEnabled: boolean;
    heroSliderInterval: number;
    heroKenBurnsEffect: boolean;
}

interface SiteSettingsManagerProps {
    settings: SiteSettings;
    onToggle: (formData: FormData) => Promise<any>;
}

export function SiteSettingsManager({ settings, onToggle }: SiteSettingsManagerProps) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = (settingName: string, currentValue: boolean) => {
        const formData = new FormData();
        formData.set("settingName", settingName);
        formData.set("currentValue", currentValue.toString());
        startTransition(() => {
            onToggle(formData);
        });
    };

    const settingItems = [
        {
            name: "isAudioPlayerVisible",
            label: "Audio Player",
            description: "Show/hide the hero audio player on the homepage",
            icon: Music2,
            value: settings.isAudioPlayerVisible,
        },
        {
            name: "isShopVisible",
            label: "Shop Section",
            description: "Show/hide the shop/merch section on the homepage",
            icon: ShoppingBag,
            value: settings.isShopVisible,
        },
        {
            name: "isSocialLinksVisible",
            label: "Social Links",
            description: "Show/hide social media icons across the site",
            icon: Share2,
            value: settings.isSocialLinksVisible,
        },
        {
            name: "isYoutubeVisible",
            label: "YouTube Videos",
            description: "Show/hide the YouTube video carousel section",
            icon: Youtube,
            value: settings.isYoutubeVisible,
        },
        {
            name: "youtubeAutoScroll",
            label: "Auto-Scroll Videos",
            description: "Automatically scroll through videos in the carousel",
            icon: Youtube,
            value: settings.youtubeAutoScroll,
        },
        {
            name: "heroSliderEnabled",
            label: "Hero Slider",
            description: "Enable multiple sliding images in the hero section",
            icon: ImageIcon,
            value: settings.heroSliderEnabled,
        },
        {
            name: "heroKenBurnsEffect",
            label: "Ken Burns Effect",
            description: "Subtle zoom animation on hero background images",
            icon: Sparkles,
            value: settings.heroKenBurnsEffect,
        },
    ];

    return (
        <div className="p-6">

            {isPending && (
                <div className="mb-4 p-3 rounded-lg bg-accent-coral/10 border border-accent-coral/20 flex items-center gap-2 text-accent-coral">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Updating settings...</span>
                </div>
            )}

            <div className="space-y-4">
                {settingItems.map((item) => (
                    <div
                        key={item.name}
                        className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50 hover:bg-background/80 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.value ? "bg-accent-coral/10 text-accent-coral" : "bg-muted text-muted-foreground"
                                }`}>
                                <item.icon size={20} />
                            </div>
                            <div>
                                <p className="font-medium">{item.label}</p>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                        </div>

                        {/* Toggle Switch */}
                        <button
                            onClick={() => handleToggle(item.name, item.value)}
                            disabled={isPending}
                            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${item.value
                                ? "bg-accent-coral"
                                : "bg-muted"
                                } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                            aria-label={`Toggle ${item.label}`}
                        >
                            <span
                                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${item.value ? "translate-x-6" : "translate-x-0"
                                    }`}
                            />
                        </button>
                    </div>
                ))}
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Toggles take effect immediately across the site</li>
                    <li>Hidden sections won't appear in navigation or content</li>
                    <li>Data is preserved when sections are hidden (not deleted)</li>
                </ul>
            </div>
        </div>
    );
}
