"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Link as LinkIcon,
    Unlink,
    Undo,
    Redo,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

// Toolbar Button Component
function ToolbarButton({
    onClick,
    isActive,
    disabled,
    children,
    title,
    className = "",
}: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded-md transition-colors ${isActive
                ? "bg-accent-coral text-white"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        >
            {children}
        </button>
    );
}

// Toolbar Component
function EditorToolbar({ editor }: { editor: Editor }) {
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");

    const setLink = useCallback(() => {
        if (linkUrl) {
            editor.chain().focus().setLink({ href: linkUrl }).run();
        }
        setLinkUrl("");
        setShowLinkInput(false);
    }, [editor, linkUrl]);

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20">
            {/* Text Formatting */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive("bold")}
                title="Bold"
            >
                <Bold size={16} />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive("italic")}
                title="Italic"
            >
                <Italic size={16} />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive("strike")}
                title="Strikethrough"
            >
                <Strikethrough size={16} />
            </ToolbarButton>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Lists */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive("bulletList")}
                title="Bullet List"
            >
                <List size={16} />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive("orderedList")}
                title="Numbered List"
            >
                <ListOrdered size={16} />
            </ToolbarButton>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Text Align */}
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                isActive={editor.isActive({ textAlign: "left" })}
                title="Align Left"
            >
                <AlignLeft size={16} />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                isActive={editor.isActive({ textAlign: "center" })}
                title="Align Center"
            >
                <AlignCenter size={16} />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                isActive={editor.isActive({ textAlign: "right" })}
                title="Align Right"
            >
                <AlignRight size={16} />
            </ToolbarButton>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Link */}
            <div className="relative">
                <ToolbarButton
                    onClick={() => setShowLinkInput(!showLinkInput)}
                    isActive={editor.isActive("link")}
                    title="Add Link"
                >
                    <LinkIcon size={16} />
                </ToolbarButton>
                {showLinkInput && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-lg shadow-lg z-30 flex gap-2">
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://..."
                            className="input-field text-sm py-1 px-2 w-48"
                            onKeyDown={(e) => e.key === "Enter" && setLink()}
                        />
                        <button onClick={setLink} className="btn-primary text-sm py-1 px-3">
                            Add
                        </button>
                    </div>
                )}
            </div>
            <ToolbarButton
                onClick={() => editor.chain().focus().unsetLink().run()}
                disabled={!editor.isActive("link")}
                title="Remove Link"
            >
                <Unlink size={16} />
            </ToolbarButton>

            <div className="flex-1" />

            {/* Undo/Redo Navigation */}
            <div className="flex items-center bg-muted/30 rounded-lg p-0.5 border border-border/50">
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo"
                    className="hover:bg-background text-foreground"
                >
                    <Undo size={16} />
                </ToolbarButton>
                <div className="w-px h-4 bg-border mx-0.5" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo"
                    className="hover:bg-background text-foreground"
                >
                    <Redo size={16} />
                </ToolbarButton>
            </div>
        </div>
    );
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = "Start writing...",
    className = "",
    maxLength,
}: RichTextEditorProps & { maxLength?: number }) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-accent-coral underline",
                },
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Placeholder.configure({
                placeholder,
            }),
            CharacterCount.configure({
                limit: maxLength,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm dark:prose-invert max-w-none p-4 min-h-[150px] focus:outline-none ${className}`,
            },
        },
    });

    // Update content when value prop changes externally
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return (
            <div className="border border-border rounded-xl bg-card animate-pulse">
                <div className="h-12 bg-muted/30 rounded-t-xl" />
                <div className="p-4 min-h-[150px]" />
            </div>
        );
    }

    return (
        <div className="border border-border rounded-xl bg-card overflow-hidden focus-within:ring-2 focus-within:ring-accent-coral/50 transition-all flex flex-col">
            <EditorToolbar editor={editor} />
            <div className="flex-1">
                <EditorContent editor={editor} />
            </div>
            <div className={`px-3 py-1.5 border-t border-border bg-muted/20 text-[10px] flex justify-end transition-colors ${editor.storage.characterCount.characters() === maxLength ? "text-red-500 font-bold" : "text-muted-foreground"
                }`}>
                {editor.storage.characterCount.characters()} {maxLength ? `/ ${maxLength}` : ""} characters
            </div>
        </div>
    );
}
