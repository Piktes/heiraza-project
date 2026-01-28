"use client";

import { useState, useRef } from "react";
import { Save, Image as ImageIcon, Trash2, Eye, Upload } from "lucide-react";

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
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        const formData = new FormData();
        formData.set("content", content);
        formData.set("logoUrl", logoUrl);

        try {
            await saveAction(formData);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                <h3 className="font-medium mb-4">Signature Content (HTML)</h3>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`<div style="font-family: Arial, sans-serif;">
  <p><strong>Your Name</strong></p>
  <p>Artist / Producer</p>
  <p>Email: heiraza@heiraza.com</p>
  <p>Website: https://heiraza.com</p>
</div>`}
                    className="input-field w-full min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                    Use HTML for formatting. The logo (if uploaded) will be added above this content.
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
