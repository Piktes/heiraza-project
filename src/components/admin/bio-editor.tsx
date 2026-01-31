"use client";

import { useState, useRef } from "react";
import { Save, Upload, Trash2, GripVertical, Image as ImageIcon } from "lucide-react";
import { compressImage } from "@/lib/image-compression";

interface BioImage {
    id: number;
    imageUrl: string;
    caption: string | null;
    sortOrder: number;
}

interface BioEditorProps {
    initialBio: string;
    initialImages: BioImage[];
    saveBioAction: (formData: FormData) => Promise<void>;
    addImageAction: (formData: FormData) => Promise<void>;
    deleteImageAction: (formData: FormData) => Promise<void>;
    reorderAction: (formData: FormData) => Promise<void>;
}

export function BioEditor({
    initialBio,
    initialImages,
    saveBioAction,
    addImageAction,
    deleteImageAction,
    reorderAction,
}: BioEditorProps) {
    const [bio, setBio] = useState(initialBio);
    const [images, setImages] = useState<BioImage[]>(initialImages);
    const [isSaving, setIsSaving] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveBio = async () => {
        setIsSaving(true);
        const formData = new FormData();
        formData.set("bio", bio);
        await saveBioAction(formData);
        setIsSaving(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setIsSaving(true);
        try {
            for (const file of Array.from(files)) {
                // 1. Compress image to reduce upload size (Base64) - optimizations for web
                // Check if file is too large to begin with, though compression helps
                const compressedBase64 = await compressImage(file, {
                    maxWidth: 1200,
                    quality: 0.8
                });

                // 2. Upload to API to get persistent URL (handles VPS path)
                const uploadResponse = await fetch("/api/admin/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        image: compressedBase64,
                        folder: "bio"
                    }),
                });

                if (!uploadResponse.ok) {
                    console.error("Upload failed");
                    continue;
                }

                const { url } = await uploadResponse.json();

                // 3. Save URL to database via Server Action
                const formData = new FormData();
                formData.set("imageUrl", url);
                formData.set("caption", "");
                await addImageAction(formData);
            }
            // Refresh to show new images
            window.location.reload();
        } catch (error) {
            console.error("Error uploading images:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        const formData = new FormData();
        formData.set("id", id.toString());
        await deleteImageAction(formData);
        setImages(images.filter((img) => img.id !== id));
    };

    // Drag and drop handlers
    const handleDragStart = (index: number) => {
        setDragIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === index) return;

        const newImages = [...images];
        const draggedImage = newImages[dragIndex];
        newImages.splice(dragIndex, 1);
        newImages.splice(index, 0, draggedImage);
        setImages(newImages);
        setDragIndex(index);
    };

    const handleDragEnd = async () => {
        setDragIndex(null);
        // Save new order
        const formData = new FormData();
        formData.set("order", JSON.stringify(images.map((img) => img.id)));
        await reorderAction(formData);
    };

    return (
        <div className="space-y-8">
            {/* Bio Text Editor */}
            <div className="glass-card p-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                    <span className="text-accent-coral">✎</span>
                    Biography Text
                </h3>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write your biography here... You can use HTML for formatting."
                    className="input-field w-full min-h-[300px] font-mono text-sm"
                />
                <div className="flex justify-between items-center mt-4">
                    <p className="text-xs text-muted-foreground">
                        💡 Tip: Use HTML tags for formatting (e.g., &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;italic&lt;/i&gt;)
                    </p>
                    <button
                        onClick={handleSaveBio}
                        disabled={isSaving}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Save size={16} />
                        {isSaving ? "Saving..." : "Save Bio"}
                    </button>
                </div>
            </div>

            {/* Image Manager */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                        <ImageIcon size={18} className="text-accent-coral" />
                        Bio Images
                    </h3>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Upload size={16} />
                            Upload Images
                        </button>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                    Drag images to reorder. Images display with <code className="bg-muted px-1 rounded">object-fit: contain</code> (no cropping).
                </p>

                {images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((img, index) => (
                            <div
                                key={img.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`relative group rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${dragIndex === index
                                    ? "border-accent-coral scale-105 shadow-lg"
                                    : "border-border hover:border-accent-coral/50"
                                    }`}
                            >
                                {/* Drag Handle */}
                                <div className="absolute top-2 left-2 z-10 p-1 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical size={16} className="text-white" />
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDelete(img.id)}
                                    className="absolute top-2 right-2 z-10 p-2 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={14} className="text-white" />
                                </button>

                                {/* Image - object-contain to show full image without cropping */}
                                <div className="aspect-square bg-muted flex items-center justify-center">
                                    <img
                                        src={img.imageUrl}
                                        alt={img.caption || "Bio image"}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>

                                {/* Caption */}
                                {img.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs truncate">
                                        {img.caption}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                        <ImageIcon className="mx-auto mb-3" size={40} />
                        <p>No bio images yet</p>
                        <p className="text-sm">Upload images to display in your bio section</p>
                    </div>
                )}
            </div>
        </div>
    );
}
