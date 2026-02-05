"use client";

import { useState, useRef, useEffect } from "react";
import { Save, Image as ImageIcon, Trash2, Eye, Upload, CheckCircle, XCircle } from "lucide-react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

interface SignatureEditorProps {
    initialContent: string;
    initialLogoUrl: string;
    saveAction: (formData: FormData) => Promise<void>;
}

export function SignatureEditor({
    initialContent,
    initialLogoUrl,
    saveAction,
}: SignatureEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-dismiss notification after 3 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onload = () => {
            setLogoUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setNotification(null);

        const formData = new FormData();
        formData.set("content", content);
        formData.set("logoUrl", logoUrl);

        try {
            await saveAction(formData);
            setNotification({ type: "success", message: "Signature saved successfully!" });
        } catch (error) {
            setNotification({ type: "error", message: "Failed to save signature. Please try again." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Toast Notification */}
            {notification && (
                <div
                    className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${notification.type === "success"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                        }`}
                >
                    {notification.type === "success" ? (
                        <CheckCircle size={20} />
                    ) : (
                        <XCircle size={20} />
                    )}
                    <span className="font-medium">{notification.message}</span>
                </div>
            )}

            {/* Logo Upload */}
            <div className="glass-card p-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                    <ImageIcon size={18} className="text-accent-coral" />
                    Logo (Optional)
                </h3>

                {logoUrl ? (
                    <div className="flex items-start gap-4">
                        <div className="w-48 h-24 rounded-lg border border-border overflow-hidden bg-white flex items-center justify-center">
                            {/* object-contain: show full image without cropping */}
                            <img
                                src={logoUrl}
                                alt="Signature logo"
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setLogoUrl("")}
                            className="btn-ghost text-red-500 flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Remove
                        </button>
                    </div>
                ) : (
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Upload size={16} />
                            Upload Logo
                        </button>
                        <p className="text-xs text-muted-foreground mt-2">
                            Recommended: PNG or SVG with transparent background
                        </p>
                    </div>
                )}
            </div>

            {/* Signature Content */}
            <div className="glass-card p-6">
                <h3 className="font-medium mb-4">Signature Content</h3>
                <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Enter your signature content..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                    Format your signature using the toolbar above. The logo (if uploaded) will be added above this content.
                </p>
            </div>

            {/* Preview */}
            <div className="glass-card p-6">
                <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 font-medium mb-4"
                >
                    <Eye size={18} className="text-accent-coral" />
                    {showPreview ? "Hide Preview" : "Show Preview"}
                </button>

                {showPreview && (
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-border">
                        <p className="text-muted-foreground text-sm mb-4 italic">Preview of your signature:</p>
                        <hr className="mb-4 border-gray-200 dark:border-gray-700" />

                        {logoUrl && (
                            <div className="mb-4">
                                <img
                                    src={logoUrl}
                                    alt="Signature logo"
                                    className="max-w-[150px] max-h-16 object-contain"
                                />
                            </div>
                        )}

                        {content ? (
                            <div dangerouslySetInnerHTML={{ __html: content }} />
                        ) : (
                            <p className="text-muted-foreground italic">No content yet</p>
                        )}
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2"
                >
                    <Save size={16} />
                    {isSaving ? "Saving..." : "Save Signature"}
                </button>
            </div>
        </form>
    );
}
