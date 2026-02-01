"use client";

import { useState, useRef } from "react";
import { Save, Upload, Trash2, GripVertical, Image as ImageIcon, Edit2, X, CheckCircle, XCircle } from "lucide-react";
import { compressImage } from "@/lib/image-compression";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

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
    const [bio, setBio] = useState(initialBio); // Stored full bio
    const [activePage, setActivePage] = useState(0); // Current page index
    const [images, setImages] = useState<BioImage[]>(initialImages);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // PAGINATION LOGIC
    const PAGE_DELIMITER = "<!-- PAGE_BREAK -->";
    const pages = bio.split(PAGE_DELIMITER);
    const currentPageContent = pages[activePage] || "";

    const handlePageChange = (content: string) => {
        const newPages = [...pages];
        newPages[activePage] = content;
        setBio(newPages.join(PAGE_DELIMITER));
    };

    const addNewPage = () => {
        const newPages = [...pages, ""];
        setBio(newPages.join(PAGE_DELIMITER));
        setActivePage(newPages.length - 1);
    };

    const deleteCurrentPage = () => {
        if (pages.length <= 1) return; // Prevent deleting last page
        const newPages = pages.filter((_, i) => i !== activePage);
        setBio(newPages.join(PAGE_DELIMITER));
        setActivePage(Math.max(0, activePage - 1));
    };

    const goToPrevPage = () => setActivePage(Math.max(0, activePage - 1));
    const goToNextPage = () => setActivePage(Math.min(pages.length - 1, activePage + 1));

    const handleSaveBio = async () => {
        setIsSaving(true);
        setToast(null);
        try {
            const formData = new FormData();
            formData.set("bio", bio);
            await saveBioAction(formData);
            setToast({ type: "success", message: "Bio updated successfully!" });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save bio:", error);
            setToast({ type: "error", message: "Failed to save bio." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setBio(initialBio);
        setActivePage(0);
        setIsEditing(false);
        setToast(null);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setIsSaving(true);
        try {
            for (const file of Array.from(files)) {

                const compressedBase64 = await compressImage(file, {
                    maxWidth: 1200,
                    quality: 0.8
                });

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

                const formData = new FormData();
                formData.set("imageUrl", url);
                formData.set("caption", "");
                await addImageAction(formData);
            }
            window.location.reload();
        } catch (error) {
            console.error("Error uploading images:", error);
            setToast({ type: "error", message: "Failed to upload image." });
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
        const formData = new FormData();
        formData.set("order", JSON.stringify(images.map((img) => img.id)));
        await reorderAction(formData);
    };

    const autoPaginate = () => {
        // Strip HTML tags for clean splitting (simplified) or split raw HTML carefully. 
        // For simplicity effectively splitting by character count while preserving basic tags is hard.
        // We will split the raw string but this might break HTML tags. 
        // Better approach: Split by text content or just warn. 
        // Let's go with a safe chunking of the current raw content if possible, or just splitting by words.

        // Robust approach: Split the *current page* text.
        const text = currentPageContent;
        if (text.length <= 500) return;

        const chunks = [];
        let remaining = text;

        while (remaining.length > 0) {
            let chunk = remaining.slice(0, 500);
            if (remaining.length > 500) {
                // Try to split at last space
                const lastSpace = chunk.lastIndexOf(" ");
                if (lastSpace > 400) { // Keep at least 400 chars (80% full)
                    chunk = remaining.slice(0, lastSpace);
                }
            }
            chunks.push(chunk);
            remaining = remaining.slice(chunk.length);
        }

        const newPages = [...pages];
        newPages.splice(activePage, 1, ...chunks);
        setBio(newPages.join(PAGE_DELIMITER));
        setToast({ type: "success", message: `Auto-split into ${chunks.length} pages!` });
    };

    // Protect against data loss: Disable limit if content is already too long, so user can edit/split manually
    const isOverLimit = currentPageContent.length > 500;
    const effectiveMaxLength = isOverLimit ? undefined : 500;

    return (
        <div className="space-y-8 relative">
            {/* Custom Toast Notification - Intrusive Top Right */}
            {toast && (
                <div className={`fixed top-24 right-6 z-[100] animate-in slide-in-from-right fade-in duration-300 md:w-auto w-[calc(100%-3rem)]`}>
                    <div className={`glass-card p-4 rounded-xl shadow-2xl border-l-4 flex items-center gap-3 ${toast.type === "success" ? "border-l-accent-coral" : "border-l-red-500"}`}>
                        <div className={`p-2 rounded-full ${toast.type === "success" ? "bg-accent-coral/10 text-accent-coral" : "bg-red-500/10 text-red-500"}`}>
                            {toast.type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
                        </div>
                        <div>
                            <h4 className="font-medium text-sm">{toast.type === "success" ? "Success" : "Error"}</h4>
                            <p className="text-xs text-muted-foreground">{toast.message}</p>
                        </div>
                        <button onClick={() => setToast(null)} className="ml-4 p-1 hover:bg-muted rounded-full transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Bio Text Editor */}
            <div className="glass-card p-6 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                        <span className="text-accent-coral">✎</span>
                        Biography Text {pages.length > 1 && <span className="text-muted-foreground text-sm font-normal ml-2">(Page {activePage + 1} of {pages.length})</span>}
                    </h3>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="btn-ghost text-sm flex items-center gap-2 hover:bg-accent-coral/10 hover:text-accent-coral"
                        >
                            <Edit2 size={14} />
                            Edit Bio
                        </button>
                    )}
                </div>

                {/* PAGINATION CONTROLS (Common for View & Edit) */}
                <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-muted/20 rounded-lg">
                    <button
                        onClick={goToPrevPage}
                        disabled={activePage === 0}
                        className="btn-secondary text-xs px-2 py-1 disabled:opacity-30 flex-shrink-0"
                    >
                        Prev Page
                    </button>
                    <div className="flex-1 text-center text-xs font-mono text-muted-foreground min-w-[80px]">
                        PAGE {activePage + 1} / {pages.length}
                    </div>
                    <button
                        onClick={goToNextPage}
                        disabled={activePage === pages.length - 1}
                        className="btn-secondary text-xs px-2 py-1 disabled:opacity-30 flex-shrink-0"
                    >
                        Next Page
                    </button>
                    {isEditing && (
                        <>
                            <div className="w-px h-4 bg-border mx-2 hidden sm:block" />
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start mt-2 sm:mt-0">
                                <button
                                    onClick={addNewPage}
                                    className="btn-secondary text-xs px-2 py-1 bg-accent-coral/10 text-accent-coral hover:bg-accent-coral/20 border-accent-coral/20 flex-1 sm:flex-none"
                                >
                                    + Add Page
                                </button>
                                {pages.length > 1 && (
                                    <button
                                        onClick={deleteCurrentPage}
                                        className="btn-secondary text-xs px-2 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 ml-2 flex-1 sm:flex-none"
                                    >
                                        Delete Page
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {isEditing ? (
                    <div className="animate-in fade-in duration-300">
                        {isOverLimit && (
                            <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-center justify-between">
                                <span className="text-xs text-yellow-500">
                                    Content exceeds 500 limit ({currentPageContent.length}/500). Editor limit disabled to prevent data loss.
                                </span>
                                <button
                                    onClick={autoPaginate}
                                    className="text-xs bg-yellow-500 text-white px-3 py-1.5 rounded hover:bg-yellow-600 transition-colors"
                                >
                                    Auto-Split Pages
                                </button>
                            </div>
                        )}
                        <RichTextEditor
                            value={currentPageContent}
                            onChange={handlePageChange}
                            maxLength={effectiveMaxLength}
                            placeholder={`Write content for page ${activePage + 1}...`}
                            className="min-h-[200px]"
                        />
                        <div className="flex justify-between items-center mt-4">
                            <span className="text-xs text-muted-foreground">
                                * Edits are saved to "Page {activePage + 1}". Use navigation above to edit other pages.
                            </span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCancelEdit}
                                    disabled={isSaving}
                                    className="btn-secondary text-sm h-10 px-4 border border-border hover:border-accent-coral/50 hover:bg-muted/50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveBio}
                                    disabled={isSaving}
                                    className="btn-primary text-sm py-2 px-6 h-10 flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all bg-gradient-to-r from-accent-coral to-orange-500 border-none"
                                >
                                    {toast?.type === 'success' && !isSaving ? (
                                        <>
                                            <CheckCircle size={18} />
                                            Saved!
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            {isSaving ? "Saving..." : "Save Bio"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-300">
                        <div
                            className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-xl bg-muted/20 border border-border/50 min-h-[100px] max-h-[250px] overflow-y-auto custom-scrollbar"
                            dangerouslySetInnerHTML={{ __html: currentPageContent || "<p class='text-muted-foreground italic'>No content on this page.</p>" }}
                        />
                    </div>
                )}
            </div>


            {/* Image Manager */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                        <ImageIcon size={18} className="text-accent-coral" />
                        Bio Gallery Images
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
                            className="btn-secondary text-sm py-1.5 px-3 h-8 flex items-center gap-2"
                        >
                            <Upload size={14} />
                            Upload Images
                        </button>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                    Upload multiple images for the bio slider. Drag to reorder.
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
                        <p className="text-sm">Upload images to display in your bio slider</p>
                    </div>
                )}
            </div>
        </div >
    );
}
