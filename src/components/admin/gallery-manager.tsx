"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
    ImageIcon, Plus, Trash2, Eye, EyeOff,
    Upload, X, Loader2, Grid3X3, ArrowUp, ArrowDown
} from "lucide-react";
import { compressImages } from "@/lib/image-compression";

interface GalleryImage {
    id: number;
    imageUrl: string;
    title: string | null;
    caption: string | null;
    category: string | null;
    isActive: boolean;
    sortOrder: number;
}

interface GalleryManagerProps {
    images: GalleryImage[];
    onAdd: (formData: FormData) => Promise<any>;
    onAddMultiple: (formData: FormData) => Promise<any>;
    onToggle: (formData: FormData) => Promise<any>;
    onDelete: (formData: FormData) => Promise<any>;
    onMove?: (formData: FormData) => Promise<any>;
}

export function GalleryManager({
    images,
    onAdd,
    onAddMultiple,
    onToggle,
    onDelete,
    onMove
}: GalleryManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [isMultipleUpload, setIsMultipleUpload] = useState(true);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [category, setCategory] = useState("");
    const [title, setTitle] = useState("");
    const [caption, setCaption] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeCount = images.filter(img => img.isActive).length;
    const categories = Array.from(new Set(images.map(img => img.category).filter(Boolean))) as string[];

    // Handle file selection with automatic compression
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Filter to only image files
        const imageFiles = Array.from(files).filter(file =>
            file.type.startsWith("image/")
        );

        if (imageFiles.length === 0) return;

        try {
            // Compress all selected images (max 1200px, 80% quality)
            const compressedImages = await compressImages(imageFiles, {
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 0.8,
                outputType: "image/jpeg"
            });

            setSelectedImages(prev => [...prev, ...compressedImages]);
        } catch (error) {
            console.error("Error compressing images:", error);
            alert("Failed to process images. Please try again.");
        }

        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Remove selected image before upload
    const removeSelectedImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    // Handle submit
    const handleSubmit = async () => {
        if (selectedImages.length === 0) return;

        setIsSubmitting(true);

        try {
            if (isMultipleUpload || selectedImages.length > 1) {
                // Multiple upload
                const formData = new FormData();
                selectedImages.forEach(img => formData.append("imageData", img));
                if (category) formData.set("category", category);
                await onAddMultiple(formData);
            } else {
                // Single upload with metadata
                const formData = new FormData();
                formData.set("imageData", selectedImages[0]);
                if (title) formData.set("title", title);
                if (caption) formData.set("caption", caption);
                if (category) formData.set("category", category);
                await onAdd(formData);
            }

            // Reset form
            resetForm();
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedImages([]);
        setCategory("");
        setTitle("");
        setCaption("");
        setIsAdding(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <ImageIcon className="text-accent-coral" size={24} />
                    <div>
                        <h2 className="font-display text-2xl tracking-wide">Photo Gallery</h2>
                        <p className="text-sm text-muted-foreground">
                            {activeCount} active / {images.length} total
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn-primary flex items-center gap-2 text-sm"
                >
                    <Plus size={16} />
                    Add Images
                </button>
            </div>

            {/* ========================================
          ADD NEW IMAGES FORM
          ======================================== */}
            {isAdding && (
                <div className="mb-6 p-6 rounded-xl border border-accent-coral/30 bg-accent-coral/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-lg">Upload Gallery Images</h3>
                        <button onClick={resetForm} className="p-1 hover:bg-muted rounded">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Upload Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => setIsMultipleUpload(true)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${isMultipleUpload
                                ? "bg-accent-coral text-white"
                                : "bg-muted hover:bg-muted/80"
                                }`}
                        >
                            <Grid3X3 size={16} />
                            Batch Upload
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsMultipleUpload(false)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${!isMultipleUpload
                                ? "bg-accent-coral text-white"
                                : "bg-muted hover:bg-muted/80"
                                }`}
                        >
                            <ImageIcon size={16} />
                            Single with Details
                        </button>
                    </div>

                    {/* File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple={isMultipleUpload}
                        onChange={handleFileSelect}
                        className="hidden"
                        id="gallery-upload"
                    />

                    {/* Upload Drop Zone */}
                    {selectedImages.length === 0 ? (
                        <label
                            htmlFor="gallery-upload"
                            className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent-coral/50 hover:bg-accent-coral/5 transition-colors"
                        >
                            <Upload size={40} className="text-muted-foreground mb-3" />
                            <span className="text-muted-foreground">
                                {isMultipleUpload
                                    ? "Click to select multiple images"
                                    : "Click to select an image"
                                }
                            </span>
                            <span className="text-xs text-muted-foreground/60 mt-1">
                                JPG, PNG, WebP supported
                            </span>
                        </label>
                    ) : (
                        <div className="space-y-4">
                            {/* Selected Images Preview */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {selectedImages.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                                        <Image
                                            src={img}
                                            alt={`Selected ${idx + 1}`}
                                            fill
                                            className="object-contain bg-black/5"
                                        />
                                        <button
                                            onClick={() => removeSelectedImage(idx)}
                                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} className="text-white" />
                                        </button>
                                    </div>
                                ))}
                                {/* Add More Button */}
                                <label
                                    htmlFor="gallery-upload"
                                    className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-accent-coral/50 hover:bg-accent-coral/5 transition-colors"
                                >
                                    <Plus size={24} className="text-muted-foreground" />
                                </label>
                            </div>

                            {/* Single Image Details */}
                            {!isMultipleUpload && selectedImages.length === 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Title (Optional)</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Image title..."
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Caption (Optional)</label>
                                        <input
                                            type="text"
                                            value={caption}
                                            onChange={(e) => setCaption(e.target.value)}
                                            placeholder="Image caption..."
                                            className="input-field"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Category (for all modes) */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Category (Optional)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="e.g., concerts, backstage, studio"
                                        className="input-field flex-1"
                                        list="categories"
                                    />
                                    <datalist id="categories">
                                        {categories.map(cat => (
                                            <option key={cat} value={cat} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex items-center gap-3 mt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={selectedImages.length === 0 || isSubmitting}
                            className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Uploading {selectedImages.length} image{selectedImages.length > 1 ? "s" : ""}...
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    Upload {selectedImages.length} image{selectedImages.length > 1 ? "s" : ""}
                                </>
                            )}
                        </button>
                        <button onClick={resetForm} className="btn-secondary text-sm">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================
          GALLERY GRID
          ======================================== */}
            {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((image) => (
                        <div
                            key={image.id}
                            className={`group relative aspect-square rounded-xl overflow-hidden border transition-all bg-neutral-800 ${image.isActive
                                ? "border-transparent"
                                : "border-muted opacity-50"
                                }`}
                        >
                            <Image
                                src={image.imageUrl}
                                alt={image.title || "Gallery image"}
                                fill
                                className="object-contain bg-black/10 w-full h-full"
                            />

                            {/* Overlay with actions */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                {/* Reorder buttons */}
                                {onMove && (
                                    <div className="flex gap-2 mb-1">
                                        <form action={onMove}>
                                            <input type="hidden" name="id" value={image.id} />
                                            <input type="hidden" name="direction" value="up" />
                                            <button
                                                type="submit"
                                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                                title="Move earlier"
                                            >
                                                <ArrowUp size={14} className="text-white" />
                                            </button>
                                        </form>
                                        <form action={onMove}>
                                            <input type="hidden" name="id" value={image.id} />
                                            <input type="hidden" name="direction" value="down" />
                                            <button
                                                type="submit"
                                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                                title="Move later"
                                            >
                                                <ArrowDown size={14} className="text-white" />
                                            </button>
                                        </form>
                                    </div>
                                )}
                                {/* Eye & Trash buttons */}
                                <div className="flex gap-2">
                                    <form action={onToggle}>
                                        <input type="hidden" name="id" value={image.id} />
                                        <input type="hidden" name="isActive" value={image.isActive.toString()} />
                                        <button
                                            type="submit"
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${image.isActive
                                                ? "bg-white/20 hover:bg-white/30 text-white"
                                                : "bg-accent-coral hover:bg-accent-coral/80 text-white"
                                                }`}
                                            title={image.isActive ? "Hide from gallery" : "Show in gallery"}
                                        >
                                            {image.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </form>
                                    <form action={onDelete}>
                                        <input type="hidden" name="id" value={image.id} />
                                        <button
                                            type="submit"
                                            className="w-10 h-10 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors"
                                            title="Delete image"
                                        >
                                            <Trash2 size={16} className="text-white" />
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Info badges */}
                            {image.category && (
                                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                    {image.category}
                                </div>
                            )}
                            {!image.isActive && (
                                <div className="absolute top-2 right-2 bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                                    Hidden
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    <ImageIcon className="mx-auto mb-4" size={40} />
                    <p>No gallery images yet</p>
                    <p className="text-sm mt-1">Add your first images above</p>
                </div>
            )}

            {/* Info */}
            <div className="mt-6 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Gallery Features:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Batch upload multiple images at once</li>
                    <li>Images with <Eye size={12} className="inline text-accent-coral" /> are shown in the public gallery</li>
                    <li>Use categories to let visitors filter photos</li>
                    <li>Hover effects & lightbox included in frontend display</li>
                </ul>
            </div>
        </div>
    );
}
