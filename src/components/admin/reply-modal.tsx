"use client";

import { useState, useEffect } from "react";
import { X, Send, Loader2, Eye, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { RichTextEditor } from "./rich-text-editor";

interface ReplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    messageId: number;
    recipientEmail: string;
    recipientName: string;
    originalMessage: string;
    onSendSuccess: () => void;
}

// Simple email validation
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function ReplyModal({
    isOpen,
    onClose,
    messageId,
    recipientEmail,
    recipientName,
    originalMessage,
    onSendSuccess,
}: ReplyModalProps) {
    const [subject, setSubject] = useState(`Re: Your message`);
    const [body, setBody] = useState("");
    const [signature, setSignature] = useState<string>("");
    const [isSending, setIsSending] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

    const emailValid = isValidEmail(recipientEmail);

    // Fetch signature on mount
    useEffect(() => {
        if (isOpen) {
            fetch(`/api/admin/send-reply?email=${encodeURIComponent(recipientEmail)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.signature) {
                        setSignature(data.signature);
                    }
                })
                .catch(console.error);
        }
    }, [isOpen, recipientEmail]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setSubject(`Re: Your message`);
            setBody("");
            setSendResult(null);
            setShowPreview(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim()) {
            setSendResult({ success: false, message: "Please enter a message body" });
            return;
        }

        setIsSending(true);
        setSendResult(null);

        try {
            const response = await fetch("/api/admin/send-reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messageId,
                    to: recipientEmail,
                    subject,
                    body,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSendResult({ success: true, message: "Email was sent successfully! ✓" });
                // Close after showing success message
                setTimeout(() => {
                    onSendSuccess();
                    onClose();
                }, 1500);
            } else {
                setSendResult({ success: false, message: data.message || "Email could not be sent" });
            }
        } catch {
            setSendResult({ success: false, message: "An error occurred while sending the email." });
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
            <div className="relative w-[95%] max-w-3xl glass-card p-0 overflow-hidden max-h-[90vh] flex flex-col">
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

                {/* Email Validation Warning */}
                {!emailValid && (
                    <div className="px-4 sm:px-6 py-3 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center gap-3">
                        <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                                Invalid email address detected
                            </p>
                            <p className="text-xs text-muted-foreground">
                                The email "{recipientEmail}" appears to be invalid. You can still try to send, but it may not be delivered.
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Email Fields - Scrollable */}
                    <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                        {/* From (Read-only) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    From
                                </label>
                                <input
                                    type="text"
                                    value={process.env.NEXT_PUBLIC_EMAIL_FROM || "heiraza@test.heiraza.com"}
                                    readOnly
                                    className="input-field w-full bg-muted cursor-not-allowed text-sm"
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
                                    className={`input-field w-full bg-muted cursor-not-allowed text-sm ${!emailValid ? "border-yellow-500" : ""}`}
                                />
                            </div>
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
                            <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground max-h-20 overflow-y-auto">
                                {originalMessage}
                            </div>
                        </div>

                        {/* Rich Text Editor or Preview */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-muted-foreground">
                                    Your Reply
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="flex items-center gap-1 text-sm text-accent-coral hover:underline"
                                >
                                    <Eye size={14} />
                                    {showPreview ? "Edit" : "Preview"}
                                </button>
                            </div>

                            {showPreview ? (
                                <div className="border border-border rounded-xl bg-white dark:bg-gray-900 p-4 min-h-[200px]">
                                    <p className="text-xs text-muted-foreground mb-3 italic">Email Preview:</p>
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: body || "<p class='text-muted-foreground italic'>No content yet...</p>" }}
                                    />
                                    <hr className="my-4 border-border" />
                                    <div dangerouslySetInnerHTML={{ __html: signature }} />
                                </div>
                            ) : (
                                <RichTextEditor
                                    value={body}
                                    onChange={setBody}
                                    placeholder="Type your reply here..."
                                />
                            )}
                        </div>

                        {/* Signature Preview (collapsed) */}
                        {!showPreview && signature && (
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Signature (auto-attached)
                                </label>
                                <div
                                    className="p-3 rounded-lg bg-muted/50 border border-border text-sm max-h-24 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: signature }}
                                />
                            </div>
                        )}

                        {/* Result Message */}
                        {sendResult && (
                            <div className={`p-3 rounded-lg flex items-center gap-2 ${sendResult.success
                                    ? "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400"
                                    : "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400"
                                }`}>
                                {sendResult.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                <span className="text-sm">{sendResult.message}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer - Fixed at bottom */}
                    <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-border bg-muted/30 flex-shrink-0">
                        <div className="text-xs text-muted-foreground">
                            {emailValid ? (
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <CheckCircle size={12} /> Valid email
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                    <AlertTriangle size={12} /> Invalid email
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
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
                                disabled={isSending || sendResult?.success}
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
                                        Send Reply
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
