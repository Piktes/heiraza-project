"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Send, User, X, CheckCircle, Loader2 } from "lucide-react";
import { SmartEmailInput } from "@/components/ui/smart-email-input";

interface ContactFormProps {
    successImage?: string | null;
    successTitle?: string | null;
    successMessage?: string | null;
}

export function ContactForm({
    successImage,
    successTitle = "Message Sent!",
    successMessage = "Mesajınız Heiraza'ya iletilmiştir.",
}: ContactFormProps) {
    const [isPending, startTransition] = useTransition();
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const form = e.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
            try {
                const response = await fetch("/api/contact", {
                    method: "POST",
                    body: formData,
                });

                if (response.ok || response.redirected) {
                    setShowSuccess(true);
                    form.reset();
                } else {
                    const data = await response.json().catch(() => ({}));

                    if (data.error === "invalid_name") {
                        setError("Please enter a valid name.");
                    } else if (data.error === "invalid_email") {
                        setError("Please enter a valid email address.");
                    } else if (data.error === "too_many_requests") {
                        setError("Too many requests. Please wait a moment.");
                    } else {
                        setError("Failed to send message. Please try again.");
                    }
                }
            } catch {
                setError("Network error. Please check your connection.");
            }
        });
    };

    return (
        <>
            {/* Contact Form */}
            <div className="glass-card p-8 md:p-10 rounded-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Honeypot fields (hidden) */}
                    <div
                        className="absolute opacity-0 pointer-events-none"
                        aria-hidden="true"
                        style={{ position: "absolute", left: "-9999px" }}
                    >
                        <input type="text" name="_honey" tabIndex={-1} autoComplete="off" />
                        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                    </div>

                    {/* Name Field */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                            Your Name
                        </label>
                        <div className="relative">
                            <User
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                                size={18}
                            />
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                minLength={2}
                                placeholder="John Doe"
                                className="input-field pl-12"
                            />
                        </div>
                    </div>

                    {/* Email Field - Smart Autocomplete */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                            Email Address
                        </label>
                        <SmartEmailInput
                            id="email"
                            name="email"
                            required
                            placeholder="john@example.com"
                        />
                    </div>

                    {/* Message Field - No minimum length */}
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium mb-2">
                            Your Message
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            required
                            rows={5}
                            placeholder="Write your message here..."
                            className="input-field resize-none"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isPending}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isPending ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Send Message
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Hero-Style Success Popup Modal */}
            {showSuccess && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={() => setShowSuccess(false)}
                >
                    <div
                        className="glass-card max-w-lg w-full rounded-2xl overflow-hidden relative animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowSuccess(false)}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                            aria-label="Close"
                        >
                            <X size={20} className="text-white" />
                        </button>

                        {/* Hero Banner Image - Full Width */}
                        {successImage ? (
                            <div className="w-full aspect-[16/9] relative bg-neutral-900 rounded-t-2xl overflow-hidden">
                                <Image
                                    src={successImage}
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
                                {successTitle}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {successMessage}
                            </p>

                            <button
                                onClick={() => setShowSuccess(false)}
                                className="mt-8 btn-primary w-full"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
