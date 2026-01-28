"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
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
    Code,
    Variable,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";

// Available template variables
const TEMPLATE_VARIABLES = [
    { key: "{{event_title}}", label: "Event Title" },
    { key: "{{event_date}}", label: "Event Date" },
    { key: "{{event_time}}", label: "Event Time" },
    { key: "{{event_location}}", label: "Location" },
    { key: "{{event_price}}", label: "Price" },
    { key: "{{event_description}}", label: "Description" },
    { key: "{{event_image_url}}", label: "Image URL" },
    { key: "{{ticket_link}}", label: "Ticket Link" },
];

interface EmailTemplateEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

// Toolbar Button Component
function ToolbarButton({
    onClick,
    isActive,
    disabled,
    children,
    title,
}: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-2 rounded-lg transition-colors ${isActive
                ? "bg-accent-coral text-white"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            {children}
        </button>
    );
}

// Toolbar Component
function EditorToolbar({ editor }: { editor: Editor }) {
    const [showVariables, setShowVariables] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");

    const insertVariable = useCallback(
        (variable: string) => {
            editor.chain().focus().insertContent(variable).run();
            setShowVariables(false);
        },
        [editor]
    );

    const setLink = useCallback(() => {
        if (linkUrl) {
            editor.chain().focus().setLink({ href: linkUrl }).run();
        }
        setLinkUrl("");
        setShowLinkInput(false);
    }, [editor, linkUrl]);

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30 rounded-t-xl">
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
                    <div className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-lg shadow-lg z-10 flex gap-2">
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

            <div className="w-px h-6 bg-border mx-1" />

            {/* Variables Dropdown */}
            <div className="relative">
                <ToolbarButton
                    onClick={() => setShowVariables(!showVariables)}
                    title="Insert Variable"
                >
                    <Code size={16} />
                </ToolbarButton>
                {showVariables && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-lg shadow-lg z-10 min-w-48">
                        <p className="text-xs text-muted-foreground mb-2 px-2">
                            Insert Variable
                        </p>
                        {TEMPLATE_VARIABLES.map((v) => (
                            <button
                                key={v.key}
                                onClick={() => insertVariable(v.key)}
                                className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded flex items-center gap-2"
                            >
                                <Variable size={14} className="text-accent-coral" />
                                <span>{v.label}</span>
                                <code className="ml-auto text-xs text-muted-foreground">
                                    {v.key}
                                </code>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1" />

            {/* Undo/Redo */}
            <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo"
            >
                <Undo size={16} />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo"
            >
                <Redo size={16} />
            </ToolbarButton>
        </div>
    );
}

export function EmailTemplateEditor({
    value,
    onChange,
    placeholder = "Start writing your email template...",
}: EmailTemplateEditorProps) {
    const editor = useEditor({
        immediatelyRender: false, // Fix SSR hydration mismatch
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
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class:
                    "prose prose-sm dark:prose-invert max-w-none p-4 min-h-[200px] focus:outline-none",
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
                <div className="p-4 min-h-[200px]" />
            </div>
        );
    }

    return (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
