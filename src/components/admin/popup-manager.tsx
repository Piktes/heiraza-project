"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import {
    Bell, Plus, Trash2, Eye, EyeOff, Calendar, Link as LinkIcon,
    Upload, Loader2, X, ExternalLink, Edit2, Zap, Clock
} from "lucide-react";
import { PopupCard } from "@/components/ui/popup-card";

interface Popup {
    id: number;
    title: string;
    message: string;
    imageUrl?: string | null;
    linkUrl?: string | null;
    linkText?: string | null;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
}

interface PopupManagerProps {
    popups: Popup[];
    onAdd: (formData: FormData) => Promise<any>;
    onUpdate: (formData: FormData) => Promise<any>;
    onToggle: (formData: FormData) => Promise<any>;
    onDelete: (formData: FormData) => Promise<any>;
}

export function PopupManager({
    popups,
    onAdd,
    onUpdate,
    onToggle,
    onDelete,
}: PopupManagerProps) {
    const [isPending, startTransition] = useTransition();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
    const [previewPopup, setPreviewPopup] = useState<Popup | null>(null);

    // Publish mode: "immediate" or "scheduled"
    const [publishMode, setPublishMode] = useState<"immediate" | "scheduled">("immediate");

    // Form state
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [keepExistingImage, setKeepExistingImage] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeCount = popups.filter(p => p.isActive).length;
    const now = new Date();

    // Check if popup is currently live
    const isLive = (popup: Popup) => {
        return popup.isActive &&
            new Date(popup.startDate) <= now &&
            new Date(popup.endDate) >= now;
    };

    // Reset form
    const resetForm = () => {
        setTitle("");
        setMessage("");
        setLinkUrl("");
        setLinkText("");
        setStartDate("");
        setEndDate("");
        setImagePreview(null);
        setKeepExistingImage(false);
        setPublishMode("immediate");
        setEditingPopup(null);
        setIsFormOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Open form for new popup
    const openNewForm = () => {
        resetForm();
        setIsFormOpen(true);
    };

    // Open form for editing
    const openEditForm = (popup: Popup) => {
        setEditingPopup(popup);
        setTitle(popup.title);
        setMessage(popup.message);
        setLinkUrl(popup.linkUrl || "");
        setLinkText(popup.linkText || "");

        // Determine publish mode based on dates
        const start = new Date(popup.startDate);
        const end = new Date(popup.endDate);
        const isFarFuture = end.getFullYear() >= 2090;

        if (isFarFuture) {
            setPublishMode("immediate");
        } else {
            setPublishMode("scheduled");
            setStartDate(formatDateTimeLocal(start));
            setEndDate(formatDateTimeLocal(end));
        }

        setImagePreview(null);
        setKeepExistingImage(!!popup.imageUrl);
        setIsFormOpen(true);
    };

    // Format date for datetime-local input
    const formatDateTimeLocal = (date: Date) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    // Handle image select
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result as string);
            setKeepExistingImage(false);
        };
        reader.readAsDataURL(file);
    };

    // Handle form submit
    const handleSubmit = () => {
        if (!title || !message) return;
        if (publishMode === "scheduled" && (!startDate || !endDate)) return;

        startTransition(async () => {
            const formData = new FormData();

            if (editingPopup) {
                formData.set("id", editingPopup.id.toString());
            }

            formData.set("title", title);
            formData.set("message", message);
            formData.set("linkUrl", linkUrl);
            formData.set("linkText", linkText);

            if (publishMode === "immediate") {
                formData.set("startDate", new Date().toISOString());
                formData.set("endDate", "2099-12-31T23:59:59");
            } else {
                formData.set("startDate", new Date(startDate).toISOString());
                formData.set("endDate", new Date(endDate).toISOString());
            }

            if (imagePreview) {
                formData.set("imageData", imagePreview);
            }
            formData.set("keepExistingImage", keepExistingImage.toString());

            if (editingPopup) {
                await onUpdate(formData);
            } else {
                await onAdd(formData);
            }

            resetForm();
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
        if (!confirm("Delete this popup?")) return;
        startTransition(async () => {
            const formData = new FormData();
            formData.set("id", id.toString());
            await onDelete(formData);
        });
    };

    // Format date for display
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // Check if endDate is "forever" (far future)
    const isForever = (date: Date) => new Date(date).getFullYear() >= 2090;

    return (
        <div className="space-y-8">
            {/* ========================================
          ADD / EDIT POPUP FORM
          ======================================== */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Plus className="text-accent-coral" size={20} />
                        <h2 className="font-display text-xl tracking-wide">
                            {editingPopup ? "Edit Popup" : "Create Popup"}
                        </h2>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {activeCount} active / {popups.length} total
                    </span>
                </div>

                {!isFormOpen ? (
                    <button
                        onClick={openNewForm}
                        className="w-full p-6 border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:border-accent-coral/50 hover:text-foreground transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        <span>Add New Popup</span>
                    </button>
                ) : (
                    <div className="space-y-5">
                        {/* Publish Mode Selector */}
                        <div>
                            <label className="block text-sm font-medium mb-3">Publish Mode</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPublishMode("immediate")}
                                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${publishMode === "immediate"
                                        ? "border-accent-coral bg-accent-coral/10 text-accent-coral"
                                        : "border-border hover:border-muted-foreground"
                                        }`}
                                >
                                    <Zap size={20} />
                                    <div className="text-left">
                                        <p className="font-medium">Publish Now</p>
                                        <p className="text-xs text-muted-foreground">Goes live immediately</p>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPublishMode("scheduled")}
                                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${publishMode === "scheduled"
                                        ? "border-accent-coral bg-accent-coral/10 text-accent-coral"
                                        : "border-border hover:border-muted-foreground"
                                        }`}
                                >
                                    <Clock size={20} />
                                    <div className="text-left">
                                        <p className="font-medium">Schedule</p>
                                        <p className="text-xs text-muted-foreground">Set start & end dates</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Special Offer!"
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Image (Optional)</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    id="popup-image"
                                />
                                {imagePreview ? (
                                    <div className="relative h-10 flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
                                            <Image src={imagePreview} alt="Preview" width={40} height={40} className="object-cover" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">New image</span>
                                        <button onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-red-500 hover:text-red-600">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : editingPopup?.imageUrl && keepExistingImage ? (
                                    <div className="relative h-10 flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
                                            <Image src={editingPopup.imageUrl} alt="Current" width={40} height={40} className="object-cover" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Current image</span>
                                        <button onClick={() => setKeepExistingImage(false)} className="text-red-500 hover:text-red-600 text-xs">
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <label htmlFor="popup-image" className="input-field cursor-pointer flex items-center gap-2 text-muted-foreground">
                                        <Upload size={16} />
                                        <span>Choose image</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Message *</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Get 20% off all merchandise this weekend!"
                                rows={3}
                                className="input-field resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Link URL (Optional)</label>
                                <input
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://shop.example.com"
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Link Text</label>
                                <input
                                    type="text"
                                    value={linkText}
                                    onChange={(e) => setLinkText(e.target.value)}
                                    placeholder="Shop Now"
                                    className="input-field"
                                />
                            </div>
                        </div>

                        {/* Date Range - Only shown if scheduled */}
                        {publishMode === "scheduled" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/50">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Start Date *</label>
                                    <input
                                        type="datetime-local"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">End Date *</label>
                                    <input
                                        type="datetime-local"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={!title || !message || (publishMode === "scheduled" && (!startDate || !endDate)) || isPending}
                                className="btn-primary flex items-center gap-2"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        {editingPopup ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    <>
                                        {editingPopup ? <Edit2 size={16} /> : <Plus size={16} />}
                                        {editingPopup ? "Update Popup" : "Create Popup"}
                                    </>
                                )}
                            </button>
                            <button onClick={resetForm} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================
          POPUP LIST
          ======================================== */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Bell className="text-accent-coral" size={20} />
                    <h2 className="font-display text-xl tracking-wide">All Popups</h2>
                </div>

                {isPending && (
                    <div className="mb-4 p-3 rounded-lg bg-accent-coral/10 border border-accent-coral/20 flex items-center gap-2 text-accent-coral">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Updating...</span>
                    </div>
                )}

                {popups.length > 0 ? (
                    <div className="space-y-3">
                        {popups.map((popup) => (
                            <div
                                key={popup.id}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${popup.isActive
                                    ? isLive(popup)
                                        ? "bg-green-500/5 border-green-500/30"
                                        : "bg-background/50 border-border"
                                    : "bg-muted/30 border-muted opacity-60"
                                    }`}
                            >
                                {/* Image */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                    {popup.imageUrl ? (
                                        <Image
                                            src={popup.imageUrl}
                                            alt={popup.title}
                                            width={64}
                                            height={64}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Bell size={24} className="text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium truncate">{popup.title}</p>
                                        {isLive(popup) && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded-full shrink-0">
                                                LIVE
                                            </span>
                                        )}
                                        {isForever(popup.endDate) && popup.isActive && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-accent-coral/20 text-accent-coral rounded-full shrink-0">
                                                Always On
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{popup.message}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {isForever(popup.endDate)
                                                ? `Since ${formatDate(popup.startDate)}`
                                                : `${formatDate(popup.startDate)} - ${formatDate(popup.endDate)}`
                                            }
                                        </span>
                                        {popup.linkUrl && (
                                            <span className="flex items-center gap-1">
                                                <LinkIcon size={12} />
                                                {popup.linkText || "Link"}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    {/* Preview */}
                                    <button
                                        onClick={() => setPreviewPopup(popup)}
                                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                                        title="Preview"
                                    >
                                        <ExternalLink size={18} className="text-muted-foreground" />
                                    </button>

                                    {/* Edit */}
                                    <button
                                        onClick={() => openEditForm(popup)}
                                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} className="text-muted-foreground" />
                                    </button>

                                    {/* Toggle Active */}
                                    <button
                                        onClick={() => handleToggle(popup.id, popup.isActive)}
                                        disabled={isPending}
                                        className={`p-2 rounded-lg transition-colors ${popup.isActive
                                            ? "hover:bg-muted text-accent-coral"
                                            : "hover:bg-muted text-muted-foreground"
                                            }`}
                                        title={popup.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {popup.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(popup.id)}
                                        disabled={isPending}
                                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} className="text-red-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <Bell className="mx-auto mb-4" size={40} />
                        <p>No popups yet</p>
                        <p className="text-sm mt-1">Create a popup above to get started</p>
                    </div>
                )}
            </div>

            {/* ========================================
          PREVIEW MODAL - Uses shared PopupCard component
          ======================================== */}
            {/* PREVIEW MODAL - Uses EXACT same wrapper structure as SpecialEventPopup */}
            {previewPopup && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 opacity-100"
                >
                    {/* Backdrop - identical to homepage */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setPreviewPopup(null)}
                    />

                    {/* Modal wrapper - identical to homepage */}
                    <div
                        className="relative transform scale-100 translate-y-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <PopupCard
                            title={previewPopup.title}
                            message={previewPopup.message}
                            imageUrl={previewPopup.imageUrl}
                            linkUrl={previewPopup.linkUrl}
                            linkText={previewPopup.linkText}
                            onClose={() => setPreviewPopup(null)}
                            showCloseButton={true}
                            variant="default"
                        />
                        <p className="text-center text-xs text-white/60 mt-4">
                            Preview mirrors homepage exactly
                        </p>
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="p-6 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">How Popups Work:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong>Publish Now:</strong> Popup goes live immediately and stays forever</li>
                    <li><strong>Schedule:</strong> Popup appears between Start and End dates</li>
                    <li>Green "LIVE" badge = currently showing on website</li>
                    <li>"Always On" = published immediately with no end date</li>
                </ul>
            </div>
        </div>
    );
}
