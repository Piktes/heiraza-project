"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import {
    Upload,
    Trash2,
    Save,
    Eye,
    Loader2,
    CheckCircle,
    X,
    ImageIcon,
    Mail,
    Bell,
} from "lucide-react";
import { compressImage } from "@/lib/image-compression";

interface AutoReplyManagerProps {
    contactImage: string | null;
    contactTitle: string | null;
    contactMessage: string | null;
    subscribeImage: string | null;
    subscribeTitle: string | null;
    subscribeMessage: string | null;
    onSave: (formData: FormData) => Promise<void>;
}

// Reusable Hero-Style Popup Preview
function HeroPopupPreview({
    isOpen,
    onClose,
    image,
    title,
    message,
}: {
    isOpen: boolean;
    onClose: () => void;
    image: string | null;
    title: string;
    message: string;
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="glass-card max-w-lg w-full rounded-2xl overflow-hidden relative animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                    aria-label="Close"
                >
                    <X size={20} className="text-white" />
                </button>

                {/* Hero Banner Image - Full Width */}
                {image ? (
                    <div className="w-full aspect-[16/9] relative bg-neutral-900 rounded-t-2xl overflow-hidden">
                        <Image
                            src={image}
                            alt="Success"
                            fill
                            className="object-contain w-full h-full"
                        />
                    </div>
                ) : (
                    <div className="w-full aspect-[16/9] bg-gradient-to-br from-accent-coral/20 to-accent-peach/20 flex items-center justify-center">
                        <CheckCircle size={64} className="text-accent-coral/50" />
                    </div>
                )}

                {/* Body Content */}
                <div className="p-8 text-center">
                    <h3 className="font-display text-2xl md:text-3xl tracking-wide mb-4">
                        {title || "Success!"}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                        {message || "Your request has been processed successfully."}
                    </p>

                    <button
                        onClick={onClose}
                        className="mt-8 btn-primary w-full"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
}

// Section Component for each popup type
function PopupSection({
    icon: Icon,
    sectionTitle,
    description,
    image,
    setImage,
    title,
    setTitle,
    message,
    setMessage,
    defaultTitle,
    defaultMessage,
}: {
    icon: typeof Mail;
    sectionTitle: string;
    description: string;
    image: string | null;
    setImage: (img: string | null) => void;
    title: string;
    setTitle: (t: string) => void;
    message: string;
    setMessage: (m: string) => void;
    defaultTitle: string;
    defaultMessage: string;
}) {
    const [isCompressing, setIsCompressing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsCompressing(true);
        try {
            // Compress to 16:9 landscape format
            const compressed = await compressImage(file, {
                maxWidth: 800,
                maxHeight: 450,
                quality: 0.85,
                outputType: "image/jpeg",
            });
            setImage(compressed);
        } catch (error) {
            console.error("Failed to compress image:", error);
        }
        setIsCompressing(false);
    };

    return (
        <>
            <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-2">
                    <Icon className="text-accent-coral" size={24} />
                    <h2 className="font-display text-xl tracking-wide">{sectionTitle}</h2>
                </div>
                <p className="text-muted-foreground text-sm mb-6">{description}</p>

                {/* Banner Image Upload */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                        <ImageIcon size={16} />
                        Banner Image (16:9 Landscape)
                    </label>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />

                    {isCompressing ? (
                        <div className="w-full aspect-[16/9] rounded-xl bg-muted flex items-center justify-center">
                            <Loader2 className="animate-spin text-accent-coral" size={32} />
                        </div>
                    ) : image ? (
                        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden group bg-neutral-900">
                            <Image
                                src={image}
                                alt="Banner preview"
                                fill
                                className="object-contain w-full h-full"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                                >
                                    <Upload size={20} className="text-white" />
                                </button>
                                <button
                                    onClick={() => setImage(null)}
                                    className="p-3 rounded-full bg-red-500/50 hover:bg-red-500/70 transition-colors"
                                >
                                    <Trash2 size={20} className="text-white" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-border hover:border-accent-coral/50 hover:bg-accent-coral/5 transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground"
                        >
                            <Upload size={32} />
                            <span className="text-sm">Click to upload banner image</span>
                            <span className="text-xs">Recommended: 800×450px (16:9)</span>
                        </button>
                    )}
                </div>

                {/* Title Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Popup Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={defaultTitle}
                        className="input-field"
                    />
                </div>

                {/* Message Textarea */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Popup Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={defaultMessage}
                        rows={3}
                        className="input-field resize-none"
                    />
                </div>

                {/* Preview Button */}
                <button
                    onClick={() => setShowPreview(true)}
                    className="btn-secondary flex items-center gap-2"
                >
                    <Eye size={18} />
                    Preview Popup
                </button>
            </div>

            {/* Preview Modal */}
            <HeroPopupPreview
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                image={image}
                title={title || defaultTitle}
                message={message || defaultMessage}
            />
        </>
    );
}

export function AutoReplyManager({
    contactImage: initialContactImage,
    contactTitle: initialContactTitle,
    contactMessage: initialContactMessage,
    subscribeImage: initialSubscribeImage,
    subscribeTitle: initialSubscribeTitle,
    subscribeMessage: initialSubscribeMessage,
    onSave,
}: AutoReplyManagerProps) {
    const [isPending, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);

    // Contact Form State
    const [contactImage, setContactImage] = useState<string | null>(initialContactImage);
    const [contactTitle, setContactTitle] = useState(initialContactTitle || "");
    const [contactMessage, setContactMessage] = useState(initialContactMessage || "");

    // Newsletter State
    const [subscribeImage, setSubscribeImage] = useState<string | null>(initialSubscribeImage);
    const [subscribeTitle, setSubscribeTitle] = useState(initialSubscribeTitle || "");
    const [subscribeMessage, setSubscribeMessage] = useState(initialSubscribeMessage || "");

    const handleSave = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.set("contactImage", contactImage || "");
            formData.set("contactTitle", contactTitle);
            formData.set("contactMessage", contactMessage);
            formData.set("subscribeImage", subscribeImage || "");
            formData.set("subscribeTitle", subscribeTitle);
            formData.set("subscribeMessage", subscribeMessage);
            await onSave(formData);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        });
    };

    return (
        <div className="space-y-8">
            {/* Contact Form Success Popup */}
            <PopupSection
                icon={Mail}
                sectionTitle="Message Success Popup"
                description="Displayed after a user successfully submits the contact form."
                image={contactImage}
                setImage={setContactImage}
                title={contactTitle}
                setTitle={setContactTitle}
                message={contactMessage}
                setMessage={setContactMessage}
                defaultTitle="Message Sent!"
                defaultMessage="Mesajınız Heiraza'ya iletilmiştir."
            />

            {/* Divider */}
            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">and</span>
                <div className="flex-1 h-px bg-border" />
            </div>

            {/* Newsletter Subscription Success Popup */}
            <PopupSection
                icon={Bell}
                sectionTitle="Subscription Success Popup"
                description="Displayed after a user successfully subscribes to the newsletter."
                image={subscribeImage}
                setImage={setSubscribeImage}
                title={subscribeTitle}
                setTitle={setSubscribeTitle}
                message={subscribeMessage}
                setMessage={setSubscribeMessage}
                defaultTitle="Welcome Aboard!"
                defaultMessage="Thanks for subscribing! You'll be the first to know about new releases and events."
            />

            {/* Save Button */}
            <div className="flex justify-center pt-4">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="btn-primary flex items-center gap-2 px-10"
                >
                    {isPending ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Saving...
                        </>
                    ) : saved ? (
                        <>
                            <CheckCircle size={18} />
                            Saved!
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Save All Settings
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
