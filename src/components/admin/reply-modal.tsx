"use client";

import { useState, useEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";

interface ReplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientEmail: string;
    recipientName: string;
    originalMessage: string;
    signature: string | null;
    onSend: (subject: string, body: string) => Promise<boolean>;
}

export function ReplyModal({
    isOpen,
    onClose,
    recipientEmail,
    recipientName,
    originalMessage,
    signature,
    onSend,
}: ReplyModalProps) {
    const [subject, setSubject] = useState(`Re: Your message`);
    const [body, setBody] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setSubject(`Re: Your message`);
            setBody("");
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim()) {
            setError("Please enter a message body");
            return;
        }

        setIsSending(true);
        setError(null);

        try {
            const success = await onSend(subject, body);
            if (success) {
                onClose();
            } else {
                setError("Failed to send email. Please try again.");
            }
        } catch {
            setError("An error occurred while sending the email.");
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-[95%] max-w-2xl glass-card p-0 overflow-hidden max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border flex-shrink-0">
                    <h2 className="font-display text-lg sm:text-xl">Reply to Message</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Email Fields - Scrollable */}
                    <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                        {/* From (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                From
                            </label>
                            <input
                                type="text"
                                value={process.env.NEXT_PUBLIC_EMAIL_FROM || "heiraza@heiraza.com"}
                                readOnly
                                className="input-field w-full bg-muted cursor-not-allowed"
                            />
                        </div>

                        {/* To */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                To
                            </label>
                            <input
                                type="text"
                                value={`${recipientName} <${recipientEmail}>`}
                                readOnly
                                className="input-field w-full bg-muted cursor-not-allowed"
                            />
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Subject
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="input-field w-full"
                            />
                        </div>

                        {/* Original Message (Reference) */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Original Message
                            </label>
                            <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground max-h-24 overflow-y-auto">
                                {originalMessage}
                            </div>
                        </div>

                        {/* Body */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Your Reply
                            </label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Type your reply here..."
                                className="input-field w-full min-h-[120px] resize-y"
                                autoFocus
                            />
                        </div>

                        {/* Signature Preview */}
                        {signature && (
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Signature (auto-attached)
                                </label>
                                <div
                                    className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-border text-sm"
                                    dangerouslySetInnerHTML={{ __html: signature }}
                                />
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Footer - Fixed at bottom */}
                    <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-border bg-muted/30 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-ghost text-sm"
                            disabled={isSending}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSending}
                            className="btn-primary flex items-center gap-2 text-sm"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Send
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
