"use client";

import { useState, useEffect } from "react";
import {
    FileText, Image as ImageIcon, Music, Video, Quote, Mail, Settings,
    Plus, Trash2, Eye, EyeOff, Star, Edit, X, Loader2, GripVertical,
    ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { compressImage, createThumbnail } from "@/lib/image-compression";
import { PressKitBioEditor } from "@/components/admin/press-kit-bio-editor";
import { InfoBar } from "@/components/admin/info-bar";

// Server Actions
import {
    getPressKitBio, updatePressKitBio,
    getAllPressPhotos, addPressPhoto, updatePressPhoto, deletePressPhoto, togglePressPhotoVisibility, setFeaturedPhoto, reorderPressPhotos,
    getAllMusicHighlights, addMusicHighlight, updateMusicHighlight, deleteMusicHighlight,
    getAllPressKitVideos, addPressKitVideo, updatePressKitVideo, deletePressKitVideo,
    getAllQuoteCategories, addQuoteCategory, updateQuoteCategory, deleteQuoteCategory,
    getAllQuotes, addQuote, updateQuote, deleteQuote, toggleQuoteVisibility,
    getPressKitContact, updatePressKitContact,
    getPressKitSettings, updatePressKitSettings
} from "@/lib/actions/press-kit";

// ========================================
// UTILITY: Extract Embed URL from various formats
// ========================================
function extractEmbedUrl(input: string): string {
    if (!input) return "";
    const trimmed = input.trim();

    // If iframe code pasted, extract src attribute
    const iframeMatch = trimmed.match(/src=["']([^"']+)["']/);
    if (iframeMatch) return iframeMatch[1];

    // If Spotify share URL, convert to embed format
    const spotifyMatch = trimmed.match(/open\.spotify\.com(?:\/intl-[a-z]+)?\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) return `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`;

    // If SoundCloud URL
    if (trimmed.includes('soundcloud.com') && !trimmed.includes('/player/')) {
        return `https://w.soundcloud.com/player/?url=${encodeURIComponent(trimmed)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
    }

    // If already an embed URL or other format, use as-is
    return trimmed;
}

// Types
interface PressPhoto {
    id: number;
    imageUrl: string;
    thumbnailUrl: string | null;
    altText: string;
    photographerCredit: string | null;
    sortOrder: number;
    isVisible: boolean;
    isFeatured: boolean;
}

interface MusicHighlight {
    id: number;
    title: string;
    platform: string;
    embedUrl: string;
    sortOrder: number;
    isVisible: boolean;
}

interface PressKitVideo {
    id: number;
    title: string;
    videoUrl: string;
    thumbnailUrl: string | null;
    sortOrder: number;
    isVisible: boolean;
}

interface QuoteCategory {
    id: number;
    name: string;
    sortOrder: number;
    isVisible: boolean;
    quotes: PressQuote[];
}

interface PressQuote {
    id: number;
    quoteText: string;
    sourceName: string;
    sourceUrl: string | null;
    imageUrl: string | null;
    categoryId: number;
    sortOrder: number;
    isVisible: boolean;
}

// Collapsible Section Component
function Section({ title, icon: Icon, children, defaultOpen = false }: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="glass-card rounded-2xl overflow-hidden mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon size={20} className="text-accent-coral" />
                    <h2 className="font-display text-lg tracking-wide">{title}</h2>
                </div>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isOpen && <div className="px-6 pb-6 border-t border-border pt-4">{children}</div>}
        </div>
    );
}

// Delete Confirmation Modal
function DeleteModal({ isOpen, onClose, onConfirm, title, message }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="glass-card rounded-2xl p-6 max-w-md w-full mx-4">
                <h3 className="font-display text-xl mb-2">{title}</h3>
                <p className="text-muted-foreground mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} className="btn-ghost px-4 py-2">Cancel</button>
                    <button onClick={onConfirm} className="btn-primary bg-red-500 hover:bg-red-600 px-4 py-2">Delete</button>
                </div>
            </div>
        </div>
    );
}

// ========================================
// BIO SECTION
// ========================================
function BioSection() {
    const [shortBio, setShortBio] = useState("");
    const [longBio, setLongBio] = useState("");
    const [showShortBio, setShowShortBio] = useState(true);
    const [showLongBio, setShowLongBio] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getPressKitBio().then(bio => {
            setShortBio(bio.shortBio || "");
            setLongBio(bio.longBio || "");
            setShowShortBio(bio.showShortBio);
            setShowLongBio(bio.showLongBio);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const formData = new FormData();
        formData.set("shortBio", shortBio);
        formData.set("longBio", longBio);
        formData.set("showShortBio", showShortBio.toString());
        formData.set("showLongBio", showLongBio.toString());

        const result = await updatePressKitBio(formData);
        if (result.success) {
            toast.success("Bio updated successfully");
        } else {
            toast.error("Failed to update bio");
        }
        setSaving(false);
    };

    if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            {/* Short Bio - Rich Text Editor */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <label className="text-sm font-medium">Short Bio (2-3 sentences)</label>
                        <p className="text-xs text-muted-foreground mt-1">Brief overview for quick reads</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowShortBio(!showShortBio)}
                        className={`p-2 rounded-lg transition-colors ${showShortBio ? 'bg-accent-coral/20 text-accent-coral' : 'bg-muted text-muted-foreground'}`}
                        title={showShortBio ? "Visible" : "Hidden"}
                    >
                        {showShortBio ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                </div>
                <PressKitBioEditor
                    value={shortBio}
                    onChange={setShortBio}
                    placeholder="Brief bio for quick overview..."
                />
            </div>

            {/* Long Bio - Rich Text Editor */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <label className="text-sm font-medium">Long Bio (Rich Text)</label>
                        <p className="text-xs text-muted-foreground mt-1">Use the editor toolbar to format text, add links, and style content</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowLongBio(!showLongBio)}
                        className={`p-2 rounded-lg transition-colors ${showLongBio ? 'bg-accent-coral/20 text-accent-coral' : 'bg-muted text-muted-foreground'}`}
                        title={showLongBio ? "Visible" : "Hidden"}
                    >
                        {showLongBio ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                </div>
                <PressKitBioEditor
                    value={longBio}
                    onChange={setLongBio}
                    placeholder="Full biography with detailed information..."
                />
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                Save Bio
            </button>
        </div>
    );
}

// ========================================
// PHOTOS SECTION
// ========================================
function PhotosSection() {
    const [photos, setPhotos] = useState<PressPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

    // Add form
    const [newAltText, setNewAltText] = useState("");
    const [newCredit, setNewCredit] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const loadPhotos = async () => {
        const data = await getAllPressPhotos();
        setPhotos(data);
        setLoading(false);
    };

    useEffect(() => { loadPhotos(); }, []);

    const handleUpload = async () => {
        if (!selectedFile || !newAltText.trim()) {
            toast.error("Please select an image and provide alt text");
            return;
        }

        setUploading(true);
        try {
            const imageData = await compressImage(selectedFile);
            const thumbnailData = await createThumbnail(selectedFile);

            const formData = new FormData();
            formData.set("imageData", imageData);
            formData.set("thumbnailData", thumbnailData);
            formData.set("altText", newAltText);
            formData.set("photographerCredit", newCredit);

            const result = await addPressPhoto(formData);
            if (result.success) {
                toast.success("Photo added successfully");
                setNewAltText("");
                setNewCredit("");
                setSelectedFile(null);
                loadPhotos();
            } else {
                toast.error(result.error || "Failed to add photo");
            }
        } catch (error) {
            toast.error("Failed to process image");
        }
        setUploading(false);
    };

    const handleDelete = async () => {
        if (!deleteModal.id) return;
        const formData = new FormData();
        formData.set("id", deleteModal.id.toString());
        await deletePressPhoto(formData);
        toast.success("Photo deleted");
        setDeleteModal({ open: false, id: null });
        loadPhotos();
    };

    const handleToggleVisibility = async (photo: PressPhoto) => {
        const formData = new FormData();
        formData.set("id", photo.id.toString());
        formData.set("isVisible", photo.isVisible.toString());
        await togglePressPhotoVisibility(formData);
        loadPhotos();
    };

    const handleSetFeatured = async (id: number) => {
        const formData = new FormData();
        formData.set("id", id.toString());
        await setFeaturedPhoto(formData);
        toast.success("Featured photo updated");
        loadPhotos();
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const newPhotos = [...photos];
        [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];

        const order = newPhotos.map((p, i) => ({ id: p.id, sortOrder: i }));
        const formData = new FormData();
        formData.set("order", JSON.stringify(order));
        await reorderPressPhotos(formData);
        setPhotos(newPhotos);
        toast.success("Photo order updated");
    };

    const handleMoveDown = async (index: number) => {
        if (index === photos.length - 1) return;
        const newPhotos = [...photos];
        [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];

        const order = newPhotos.map((p, i) => ({ id: p.id, sortOrder: i }));
        const formData = new FormData();
        formData.set("order", JSON.stringify(order));
        await reorderPressPhotos(formData);
        setPhotos(newPhotos);
        toast.success("Photo order updated");
    };

    if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            {/* Add Photo Form */}
            <div className="p-4 border border-dashed border-border rounded-xl">
                <h4 className="font-medium mb-3">Add New Photo</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-sm text-muted-foreground">Image *</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                            className="w-full mt-1 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-muted-foreground">Alt Text *</label>
                        <input
                            type="text"
                            value={newAltText}
                            onChange={e => setNewAltText(e.target.value)}
                            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background/50"
                            placeholder="Describe the image..."
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm text-muted-foreground">Photographer Credit (optional)</label>
                        <input
                            type="text"
                            value={newCredit}
                            onChange={e => setNewCredit(e.target.value)}
                            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background/50"
                            placeholder="Photo by..."
                        />
                    </div>
                </div>
                <button onClick={handleUpload} disabled={uploading} className="btn-primary flex items-center gap-2">
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Add Photo
                </button>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                    <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-border">
                        <img
                            src={photo.thumbnailUrl || photo.imageUrl}
                            alt={photo.altText}
                            className="w-full aspect-square object-cover"
                        />
                        {photo.isFeatured && (
                            <div className="absolute top-2 left-2 bg-accent-coral text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                <Star size={12} /> Featured
                            </div>
                        )}
                        {/* Order controls - top right */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                                className={`p-1.5 rounded-full bg-black/60 hover:bg-black/80 ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                title="Move Up"
                            >
                                <ChevronUp size={14} className="text-white" />
                            </button>
                            <button
                                onClick={() => handleMoveDown(index)}
                                disabled={index === photos.length - 1}
                                className={`p-1.5 rounded-full bg-black/60 hover:bg-black/80 ${index === photos.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                title="Move Down"
                            >
                                <ChevronDown size={14} className="text-white" />
                            </button>
                        </div>
                        {/* Action buttons - center */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button onClick={() => handleToggleVisibility(photo)} className="p-2 bg-white/20 rounded-full hover:bg-white/30" title={photo.isVisible ? "Hide" : "Show"}>
                                {photo.isVisible ? <Eye size={16} className="text-white" /> : <EyeOff size={16} className="text-white" />}
                            </button>
                            <button onClick={() => handleSetFeatured(photo.id)} className="p-2 bg-white/20 rounded-full hover:bg-white/30" title="Set Featured">
                                <Star size={16} className="text-white" />
                            </button>
                            <button onClick={() => setDeleteModal({ open: true, id: photo.id })} className="p-2 bg-red-500/80 rounded-full hover:bg-red-500" title="Delete">
                                <Trash2 size={16} className="text-white" />
                            </button>
                        </div>
                        {!photo.isVisible && <div className="absolute inset-0 bg-black/40 pointer-events-none" />}
                    </div>
                ))}
            </div>

            {photos.length === 0 && <p className="text-center text-muted-foreground py-8">No photos yet. Add your first press photo above.</p>}

            <DeleteModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, id: null })}
                onConfirm={handleDelete}
                title="Delete Photo"
                message="Are you sure you want to delete this photo? This action cannot be undone."
            />
        </div>
    );
}

// ========================================
// MUSIC HIGHLIGHTS SECTION
// ========================================
function MusicSection() {
    const [highlights, setHighlights] = useState<MusicHighlight[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

    // Form
    const [newTitle, setNewTitle] = useState("");
    const [newPlatform, setNewPlatform] = useState("spotify");
    const [newEmbedUrl, setNewEmbedUrl] = useState("");

    const loadHighlights = async () => {
        const data = await getAllMusicHighlights();
        setHighlights(data);
        setLoading(false);
    };

    useEffect(() => { loadHighlights(); }, []);

    const handleAdd = async () => {
        if (!newTitle.trim() || !newEmbedUrl.trim()) {
            toast.error("Please fill in title and embed URL");
            return;
        }
        setSaving(true);

        // Extract proper embed URL from iframe code or share URL
        const processedUrl = extractEmbedUrl(newEmbedUrl);

        const formData = new FormData();
        formData.set("title", newTitle);
        formData.set("platform", newPlatform);
        formData.set("embedUrl", processedUrl);

        const result = await addMusicHighlight(formData);
        if (result.success) {
            toast.success("Music highlight added");
            setNewTitle("");
            setNewEmbedUrl("");
            loadHighlights();
        } else {
            toast.error(result.error || "Failed to add");
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteModal.id) return;
        const formData = new FormData();
        formData.set("id", deleteModal.id.toString());
        await deleteMusicHighlight(formData);
        toast.success("Music highlight deleted");
        setDeleteModal({ open: false, id: null });
        loadHighlights();
    };

    if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            {/* Add Form */}
            <div className="p-4 border border-dashed border-border rounded-xl">
                <h4 className="font-medium mb-3">Add Music Highlight</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-border bg-background/50"
                        placeholder="Track Title"
                    />
                    <select
                        value={newPlatform}
                        onChange={e => setNewPlatform(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-border bg-background/50"
                    >
                        <option value="spotify">Spotify</option>
                        <option value="soundcloud">SoundCloud</option>
                        <option value="bandcamp">Bandcamp</option>
                        <option value="apple">Apple Music</option>
                        <option value="youtube">YouTube Music</option>
                    </select>
                    <div className="md:col-span-3">
                        <input
                            type="text"
                            value={newEmbedUrl}
                            onChange={e => setNewEmbedUrl(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background/50"
                            placeholder="Paste share link, embed URL, or full iframe code"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Supports Spotify, SoundCloud, YouTube Music share links or iframe codes</p>
                    </div>
                </div>
                <button onClick={handleAdd} disabled={saving} className="btn-primary flex items-center gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Add Track
                </button>
            </div>

            {/* List */}
            <div className="space-y-2">
                {highlights.map(h => (
                    <div key={h.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                            <GripVertical size={16} className="text-muted-foreground cursor-grab" />
                            <div>
                                <p className="font-medium">{h.title}</p>
                                <p className="text-sm text-muted-foreground capitalize">{h.platform}</p>
                            </div>
                        </div>
                        <button onClick={() => setDeleteModal({ open: true, id: h.id })} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {highlights.length === 0 && <p className="text-center text-muted-foreground py-8">No music highlights yet.</p>}

            <DeleteModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, id: null })}
                onConfirm={handleDelete}
                title="Delete Music Highlight"
                message="Are you sure you want to delete this track?"
            />
        </div>
    );
}

// ========================================
// VIDEOS SECTION
// ========================================
function VideosSection() {
    const [videos, setVideos] = useState<PressKitVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

    const [newTitle, setNewTitle] = useState("");
    const [newVideoUrl, setNewVideoUrl] = useState("");

    const loadVideos = async () => {
        const data = await getAllPressKitVideos();
        setVideos(data);
        setLoading(false);
    };

    useEffect(() => { loadVideos(); }, []);

    const handleAdd = async () => {
        if (!newTitle.trim() || !newVideoUrl.trim()) {
            toast.error("Please fill in title and video URL");
            return;
        }
        setSaving(true);
        const formData = new FormData();
        formData.set("title", newTitle);
        formData.set("videoUrl", newVideoUrl);

        const result = await addPressKitVideo(formData);
        if (result.success) {
            toast.success("Video added");
            setNewTitle("");
            setNewVideoUrl("");
            loadVideos();
        } else {
            toast.error(result.error || "Failed to add");
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteModal.id) return;
        const formData = new FormData();
        formData.set("id", deleteModal.id.toString());
        await deletePressKitVideo(formData);
        toast.success("Video deleted");
        setDeleteModal({ open: false, id: null });
        loadVideos();
    };

    if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="p-4 border border-dashed border-border rounded-xl">
                <h4 className="font-medium mb-3">Add Video</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-border bg-background/50"
                        placeholder="Video Title"
                    />
                    <input
                        type="text"
                        value={newVideoUrl}
                        onChange={e => setNewVideoUrl(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-border bg-background/50"
                        placeholder="YouTube/Vimeo URL"
                    />
                </div>
                <button onClick={handleAdd} disabled={saving} className="btn-primary flex items-center gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Add Video
                </button>
            </div>

            <div className="space-y-2">
                {videos.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Video size={16} className="text-muted-foreground" />
                            <p className="font-medium">{v.title}</p>
                        </div>
                        <button onClick={() => setDeleteModal({ open: true, id: v.id })} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {videos.length === 0 && <p className="text-center text-muted-foreground py-8">No videos yet.</p>}

            <DeleteModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, id: null })}
                onConfirm={handleDelete}
                title="Delete Video"
                message="Are you sure you want to delete this video?"
            />
        </div>
    );
}

// ========================================
// QUOTES SECTION
// ========================================
function QuotesSection() {
    const [categories, setCategories] = useState<QuoteCategory[]>([]);
    const [quotes, setQuotes] = useState<PressQuote[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; type: "category" | "quote"; id: number | null }>({ open: false, type: "quote", id: null });

    // Category form
    const [newCategoryName, setNewCategoryName] = useState("");
    // Quote form
    const [newQuoteText, setNewQuoteText] = useState("");
    const [newSourceName, setNewSourceName] = useState("");
    const [newSourceUrl, setNewSourceUrl] = useState("");
    const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
    const [newQuoteImage, setNewQuoteImage] = useState<string | null>(null);
    const [quoteImagePreview, setQuoteImagePreview] = useState<string | null>(null);

    const loadData = async () => {
        const [cats, quoteList] = await Promise.all([getAllQuoteCategories(), getAllQuotes()]);
        setCategories(cats);
        setQuotes(quoteList);
        if (cats.length > 0 && !newCategoryId) setNewCategoryId(cats[0].id);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setSaving(true);
        const formData = new FormData();
        formData.set("name", newCategoryName);
        const result = await addQuoteCategory(formData);
        if (result.success) {
            toast.success("Category added");
            setNewCategoryName("");
            loadData();
        }
        setSaving(false);
    };

    const handleQuoteImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        try {
            const compressedData = await compressImage(file);
            setNewQuoteImage(compressedData);
            setQuoteImagePreview(compressedData);
        } catch (error) {
            console.error("Error processing image:", error);
            toast.error("Failed to process image");
        }
    };

    const handleAddQuote = async () => {
        if (!newQuoteText.trim() || !newSourceName.trim() || !newCategoryId) {
            toast.error("Please fill in quote, source, and select category");
            return;
        }
        setSaving(true);
        const formData = new FormData();
        formData.set("quoteText", newQuoteText);
        formData.set("sourceName", newSourceName);
        formData.set("sourceUrl", newSourceUrl);
        formData.set("categoryId", newCategoryId.toString());
        if (newQuoteImage) {
            formData.set("imageData", newQuoteImage);
        }

        const result = await addQuote(formData);
        if (result.success) {
            toast.success("Quote added");
            setNewQuoteText("");
            setNewSourceName("");
            setNewSourceUrl("");
            setNewQuoteImage(null);
            setQuoteImagePreview(null);
            loadData();
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteModal.id) return;
        const formData = new FormData();
        formData.set("id", deleteModal.id.toString());

        if (deleteModal.type === "category") {
            const result = await deleteQuoteCategory(formData);
            if (result.success) {
                toast.success("Category deleted");
            } else {
                toast.error(result.error || "Failed to delete category");
            }
        } else {
            await deleteQuote(formData);
            toast.success("Quote deleted");
        }
        setDeleteModal({ open: false, type: "quote", id: null });
        loadData();
    };

    if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            {/* Add Category */}
            <div className="p-4 border border-dashed border-border rounded-xl">
                <h4 className="font-medium mb-3">Add Quote Category</h4>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background/50"
                        placeholder="Category Name (e.g., 'Press Reviews')"
                    />
                    <button onClick={handleAddCategory} disabled={saving} className="btn-primary">
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {/* Categories List */}
            {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm">
                            <span>{cat.name}</span>
                            <span className="text-muted-foreground">({cat.quotes?.length || 0})</span>
                            <button onClick={() => setDeleteModal({ open: true, type: "category", id: cat.id })} className="text-red-500 hover:text-red-600">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Quote */}
            {categories.length > 0 && (
                <div className="p-4 border border-dashed border-border rounded-xl">
                    <h4 className="font-medium mb-3">Add Quote</h4>
                    <div className="space-y-4">
                        <textarea
                            value={newQuoteText}
                            onChange={e => setNewQuoteText(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background/50"
                            placeholder="Quote text..."
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                value={newSourceName}
                                onChange={e => setNewSourceName(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-border bg-background/50"
                                placeholder="Source Name"
                            />
                            <input
                                type="text"
                                value={newSourceUrl}
                                onChange={e => setNewSourceUrl(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-border bg-background/50"
                                placeholder="Source URL (optional)"
                            />
                            <select
                                value={newCategoryId || ""}
                                onChange={e => setNewCategoryId(parseInt(e.target.value))}
                                className="px-3 py-2 rounded-lg border border-border bg-background/50"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Image Upload */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-sm text-muted-foreground mb-1">Cover Image (optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleQuoteImageSelect}
                                    className="w-full text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-accent-coral/10 file:text-accent-coral hover:file:bg-accent-coral/20"
                                />
                            </div>
                            {quoteImagePreview && (
                                <div className="relative">
                                    <img
                                        src={quoteImagePreview}
                                        alt="Preview"
                                        className="h-16 w-20 object-contain rounded-lg border border-border bg-muted/30"
                                    />
                                    <button
                                        onClick={() => { setNewQuoteImage(null); setQuoteImagePreview(null); }}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <button onClick={handleAddQuote} disabled={saving} className="btn-primary flex items-center gap-2">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Add Quote
                        </button>
                    </div>
                </div>
            )}

            {/* Quotes List */}
            <div className="space-y-4">
                {categories.map(cat => (
                    <div key={cat.id}>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">{cat.name}</h4>
                        <div className="space-y-2">
                            {quotes.filter(q => q.categoryId === cat.id).map(q => (
                                <div key={q.id} className="p-4 bg-muted/30 rounded-xl">
                                    <p className="italic mb-2">"{q.quoteText}"</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">— {q.sourceName}</span>
                                        <button onClick={() => setDeleteModal({ open: true, type: "quote", id: q.id })} className="p-1 text-red-500 hover:text-red-600">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <DeleteModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, type: "quote", id: null })}
                onConfirm={handleDelete}
                title={deleteModal.type === "category" ? "Delete Category" : "Delete Quote"}
                message={deleteModal.type === "category" ? "This will fail if the category has quotes. Delete all quotes first." : "Are you sure you want to delete this quote?"}
            />
        </div>
    );
}

// ========================================
// CONTACT SECTION
// ========================================
function ContactSection() {
    const [bookingEmail, setBookingEmail] = useState("");
    const [pressEmail, setPressEmail] = useState("");
    const [baseLocation, setBaseLocation] = useState("");
    const [showBookingEmail, setShowBookingEmail] = useState(true);
    const [showPressEmail, setShowPressEmail] = useState(true);
    const [showBaseLocation, setShowBaseLocation] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getPressKitContact().then(contact => {
            setBookingEmail(contact.bookingEmail || "");
            setPressEmail(contact.pressEmail || "");
            setBaseLocation(contact.baseLocation || "");
            setShowBookingEmail(contact.showBookingEmail);
            setShowPressEmail(contact.showPressEmail);
            setShowBaseLocation(contact.showBaseLocation);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const formData = new FormData();
        formData.set("bookingEmail", bookingEmail);
        formData.set("pressEmail", pressEmail);
        formData.set("baseLocation", baseLocation);
        formData.set("showBookingEmail", showBookingEmail.toString());
        formData.set("showPressEmail", showPressEmail.toString());
        formData.set("showBaseLocation", showBaseLocation.toString());

        const result = await updatePressKitContact(formData);
        if (result.success) {
            toast.success("Contact info updated");
        }
        setSaving(false);
    };

    if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <label className="text-sm text-muted-foreground">Booking Email</label>
                    <input
                        type="email"
                        value={bookingEmail}
                        onChange={e => setBookingEmail(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background/50"
                        placeholder="booking@example.com"
                    />
                </div>
                <label className="flex items-center gap-2 text-sm pt-5">
                    <input type="checkbox" checked={showBookingEmail} onChange={e => setShowBookingEmail(e.target.checked)} className="rounded" />
                    Visible
                </label>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <label className="text-sm text-muted-foreground">Press Email</label>
                    <input
                        type="email"
                        value={pressEmail}
                        onChange={e => setPressEmail(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background/50"
                        placeholder="press@example.com"
                    />
                </div>
                <label className="flex items-center gap-2 text-sm pt-5">
                    <input type="checkbox" checked={showPressEmail} onChange={e => setShowPressEmail(e.target.checked)} className="rounded" />
                    Visible
                </label>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <label className="text-sm text-muted-foreground">Base Location</label>
                    <input
                        type="text"
                        value={baseLocation}
                        onChange={e => setBaseLocation(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background/50"
                        placeholder="New York, USA"
                    />
                </div>
                <label className="flex items-center gap-2 text-sm pt-5">
                    <input type="checkbox" checked={showBaseLocation} onChange={e => setShowBaseLocation(e.target.checked)} className="rounded" />
                    Visible
                </label>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                Save Contact Info
            </button>
        </div>
    );
}

// ========================================
// SETTINGS SECTION
// ========================================
function SettingsSection() {
    const [allowPhotoDownload, setAllowPhotoDownload] = useState(true);
    const [maxMusicTracks, setMaxMusicTracks] = useState(5);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getPressKitSettings().then(settings => {
            setAllowPhotoDownload(settings.allowPhotoDownload);
            setMaxMusicTracks(settings.maxMusicTracks);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const formData = new FormData();
        formData.set("allowPhotoDownload", allowPhotoDownload.toString());
        formData.set("maxMusicTracks", maxMusicTracks.toString());

        const result = await updatePressKitSettings(formData);
        if (result.success) {
            toast.success("Settings updated");
        }
        setSaving(false);
    };

    if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <label className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={allowPhotoDownload}
                    onChange={e => setAllowPhotoDownload(e.target.checked)}
                    className="rounded w-5 h-5"
                />
                <span>Allow public download of press photos (ZIP)</span>
            </label>
            <div>
                <label className="text-sm text-muted-foreground">Max Music Tracks to Display</label>
                <input
                    type="number"
                    value={maxMusicTracks}
                    onChange={e => setMaxMusicTracks(parseInt(e.target.value) || 5)}
                    min={1}
                    max={20}
                    className="w-24 mt-1 ml-4 px-3 py-2 rounded-lg border border-border bg-background/50"
                />
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                Save Settings
            </button>
        </div>
    );
}

// ========================================
// MAIN PAGE
// ========================================
export default function PressKitAdminPage() {
    return (
        <div className="min-h-screen">
            {/* InfoBar */}
            <InfoBar />

            <main className="max-w-5xl mx-auto px-4 pb-10">
                <div className="mb-8">
                    <h1 className="font-display text-display-md tracking-wider uppercase">Press Kit</h1>
                    <p className="text-muted-foreground mt-2">Manage your electronic press kit content</p>
                </div>

                <Section title="Bio" icon={FileText} defaultOpen={true}>
                    <BioSection />
                </Section>

                <Section title="Press Photos" icon={ImageIcon}>
                    <PhotosSection />
                </Section>

                <Section title="Music Highlights" icon={Music}>
                    <MusicSection />
                </Section>

                <Section title="Videos" icon={Video}>
                    <VideosSection />
                </Section>

                <Section title="Press Quotes" icon={Quote}>
                    <QuotesSection />
                </Section>

                <Section title="Contact & Booking" icon={Mail}>
                    <ContactSection />
                </Section>

                <Section title="Settings" icon={Settings}>
                    <SettingsSection />
                </Section>
            </main>
        </div>
    );
}
