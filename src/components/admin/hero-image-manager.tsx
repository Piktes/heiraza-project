"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import {
    ImageIcon, Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown,
    Upload, Loader2, Settings, Clock
} from "lucide-react";
import { compressImage } from "@/lib/image-compression";

interface HeroImage {
    id: number;
    imageUrl: string;
    altText?: string | null;
    sortOrder: number;
    isActive: boolean;
}

interface HeroImageManagerProps {
    images: HeroImage[];
    sliderInterval: number;
    onAddImages: (formData: FormData) => Promise<any>;
    onToggle: (formData: FormData) => Promise<any>;
    onDelete: (formData: FormData) => Promise<any>;
    onMove: (formData: FormData) => Promise<any>;
    onUpdateSpeed: (formData: FormData) => Promise<any>;
}

export function HeroImageManager({
    images,
    sliderInterval,
    onAddImages,
    onToggle,
    onDelete,
    onMove,
    onUpdateSpeed,
}: HeroImageManagerProps) {
    const [isPending, startTransition] = useTransition();
    const [previews, setPreviews] = useState<string[]>([]);
    const [speed, setSpeed] = useState(sliderInterval);
    const [speedSaved, setSpeedSaved] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeCount = images.filter(img => img.isActive).length;

    // Handle file selection with compression for hero images
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsCompressing(true);
        const compressedPreviews: string[] = [];

        // Compress each image to 1920px max width for hero quality
        for (const file of Array.from(files)) {
            try {
                const compressed = await compressImage(file, {
                    maxWidth: 1920,
                    maxHeight: 1080,
                    quality: 0.8,
                    outputType: "image/jpeg",
                });
                compressedPreviews.push(compressed);
            } catch (error) {
                console.error("Failed to compress image:", error);
            }
        }

        setPreviews(compressedPreviews);
        setIsCompressing(false);
    };

    // Upload all previews
    const handleUpload = () => {
        if (previews.length === 0) return;

        startTransition(async () => {
            const formData = new FormData();
            previews.forEach(preview => {
                formData.append("imageData", preview);
            });

            await onAddImages(formData);
            setPreviews([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
        });
    };

    // Cancel upload
    const cancelUpload = () => {
        setPreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Handle speed update
    const handleSpeedSave = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.set("interval", speed.toString());
            await onUpdateSpeed(formData);
            setSpeedSaved(true);
            setTimeout(() => setSpeedSaved(false), 2000);
        });
    };

    // Handle toggle
    const handleToggle = (id: number, isActive: boolean) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.set("id", id.toString());
            formData.set("isActive", isActive.toString());
            await onToggle(formData);
        });
    };

    // Handle delete
    const handleDelete = (id: number) => {
        if (!confirm("Delete this hero image?")) return;
        startTransition(async () => {
            const formData = new FormData();
            formData.set("id", id.toString());
            await onDelete(formData);
        });
    };

    // Handle move
    const handleMove = (id: number, direction: "up" | "down") => {
        startTransition(async () => {
            const formData = new FormData();
            formData.set("id", id.toString());
            formData.set("direction", direction);
            await onMove(formData);
        });
    };

    return (
        <div className="space-y-8">
            {/* ========================================
          SLIDER SETTINGS
          ======================================== */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Settings className="text-accent-coral" size={20} />
                    <h2 className="font-display text-xl tracking-wide">Slider Settings</h2>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Clock size={18} className="text-muted-foreground" />
                        <span className="text-sm">Slide Duration:</span>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <input
                            type="number"
                            value={speed}
                            onChange={(e) => setSpeed(parseInt(e.target.value) || 3000)}
                            min={1000}
                            max={20000}
                            step={500}
                            className="input-field flex-1 sm:w-28"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">ms</span>
                        <button
                            onClick={handleSpeedSave}
                            disabled={isPending}
                            className="btn-primary text-sm py-2 ml-auto sm:ml-0"
                        >
                            {speedSaved ? "Saved!" : "Save"}
                        </button>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Time between slide transitions (1000ms = 1 second)
                </p>
            </div>

            {/* ========================================
          BULK UPLOAD
          ======================================== */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Upload className="text-accent-coral" size={20} />
                        <h2 className="font-display text-xl tracking-wide">Upload Images</h2>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {activeCount} active / {images.length} total
                    </span>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="hero-upload"
                />

                {isCompressing ? (
                    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-accent-coral/30 rounded-2xl bg-accent-coral/5">
                        <Loader2 size={40} className="text-accent-coral mb-3 animate-spin" />
                        <span className="text-muted-foreground">Compressing images...</span>
                        <span className="text-xs text-muted-foreground mt-1">Optimizing for web (1920px max)</span>
                    </div>
                ) : previews.length === 0 ? (
                    <label
                        htmlFor="hero-upload"
                        className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-accent-coral/50 hover:bg-accent-coral/5 transition-colors"
                    >
                        <Plus size={40} className="text-muted-foreground mb-3" />
                        <span className="text-muted-foreground">Click to select multiple images</span>
                        <span className="text-xs text-muted-foreground mt-1">Auto-compressed to 1920px for fast loading</span>
                    </label>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                                    <Image src={preview} alt={`Preview ${index + 1}`} fill className="object-cover" />
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleUpload}
                                disabled={isPending}
                                className="btn-primary flex items-center gap-2"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={16} />
                                        Upload {previews.length} Image{previews.length > 1 ? "s" : ""}
                                    </>
                                )}
                            </button>
                            <button onClick={cancelUpload} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================
          IMAGE LIST (Sortable)
          ======================================== */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <ImageIcon className="text-accent-coral" size={20} />
                    <h2 className="font-display text-xl tracking-wide">Hero Images</h2>
                </div>

                {isPending && (
                    <div className="mb-4 p-3 rounded-lg bg-accent-coral/10 border border-accent-coral/20 flex items-center gap-2 text-accent-coral">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Updating...</span>
                    </div>
                )}

                {images.length > 0 ? (
                    <div className="space-y-3">
                        {images.map((image, index) => (
                            <div
                                key={image.id}
                                className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all ${image.isActive
                                    ? "bg-background/50 border-border"
                                    : "bg-muted/30 border-muted opacity-60"
                                    }`}
                            >
                                {/* Order Number - Hidden on mobile */}
                                <div className="hidden sm:flex w-8 h-8 rounded-lg bg-muted items-center justify-center text-sm font-medium">
                                    {index + 1}
                                </div>

                                {/* Image Preview - Smaller on mobile */}
                                <div className="w-20 h-14 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                    <Image
                                        src={image.imageUrl}
                                        alt={image.altText || `Hero ${index + 1}`}
                                        width={128}
                                        height={80}
                                        className="object-cover w-full h-full"
                                    />
                                </div>

                                {/* Image Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm sm:text-base">{image.imageUrl.split("/").pop()}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        Order: {image.sortOrder} • {image.isActive ? "Active" : "Hidden"}
                                    </p>
                                </div>

                                {/* Actions - Tighter on mobile */}
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                    {/* Move Up */}
                                    <button
                                        onClick={() => handleMove(image.id, "up")}
                                        disabled={index === 0 || isPending}
                                        className={`p-1.5 sm:p-2 rounded-lg transition-colors ${index === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-muted"
                                            }`}
                                        title="Move up"
                                    >
                                        <ChevronUp size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </button>

                                    {/* Move Down */}
                                    <button
                                        onClick={() => handleMove(image.id, "down")}
                                        disabled={index === images.length - 1 || isPending}
                                        className={`p-1.5 sm:p-2 rounded-lg transition-colors ${index === images.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-muted"
                                            }`}
                                        title="Move down"
                                    >
                                        <ChevronDown size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </button>

                                    {/* Toggle Active */}
                                    <button
                                        onClick={() => handleToggle(image.id, image.isActive)}
                                        disabled={isPending}
                                        className={`p-1.5 sm:p-2 rounded-lg transition-colors ${image.isActive
                                            ? "hover:bg-muted text-accent-coral"
                                            : "hover:bg-muted text-muted-foreground"
                                            }`}
                                        title={image.isActive ? "Hide" : "Show"}
                                    >
                                        {image.isActive ? <Eye size={16} className="sm:w-[18px] sm:h-[18px]" /> : <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" />}
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(image.id)}
                                        disabled={isPending}
                                        className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} className="text-red-500 sm:w-[18px] sm:h-[18px]" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <ImageIcon className="mx-auto mb-4" size={40} />
                        <p>No hero images yet</p>
                        <p className="text-sm mt-1">Upload images above to create your hero slider</p>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="p-6 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Images are displayed in order (1 = first, 2 = second, etc.)</li>
                    <li>Use ↑↓ arrows to reorder images</li>
                    <li>Hidden images won't appear on the site</li>
                    <li>If only 1 active image → static display (faster loading)</li>
                    <li>If 2+ active images → slider with Ken Burns effect</li>
                </ul>
            </div>
        </div>
    );
}
