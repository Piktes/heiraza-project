"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import { Extension } from "@tiptap/core";

// Custom FontSize extension
const FontSize = Extension.create({
    name: "fontSize",
    addOptions() {
        return {
            types: ["textStyle"],
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ""),
                        renderHTML: (attributes) => {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize:
                (fontSize: string) =>
                    ({ chain }: any) => {
                        return chain().setMark("textStyle", { fontSize }).run();
                    },
            unsetFontSize:
                () =>
                    ({ chain }: any) => {
                        return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
                    },
        };
    },
});

import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Link as LinkIcon,
    Unlink,
    Undo,
    Redo,
    Smile,
    Heading1,
    Heading2,
    Heading3,
} from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import EmojiPicker, { Theme } from "emoji-picker-react";

// Site fonts - matching the fonts defined in layout.tsx
const SITE_FONTS = [
    { value: "var(--font-cinzel), Cinzel, Georgia, serif", label: "Cinzel (Display)" },
    { value: "var(--font-playfair), Playfair Display, Georgia, serif", label: "Playfair (Serif)" },
    { value: "var(--font-inter), Inter, Arial, sans-serif", label: "Inter (Body)" },
    // Fallback email-safe fonts
    { value: "Georgia, Times, serif", label: "Georgia" },
    { value: "Arial, Helvetica, sans-serif", label: "Arial" },
    { value: "Times New Roman, Times, serif", label: "Times New Roman" },
];

// Font size options
const FONT_SIZES = [
    { value: "14px", label: "14" },
    { value: "16px", label: "16" },
    { value: "18px", label: "18" },
    { value: "20px", label: "20" },
    { value: "24px", label: "24" },
    { value: "28px", label: "28" },
    { value: "32px", label: "32" },
    { value: "36px", label: "36" },
    { value: "48px", label: "48" },
];

interface PressKitBioEditorProps {
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
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const setLink = useCallback(() => {
        if (linkUrl) {
            editor.chain().focus().setLink({ href: linkUrl }).run();
        }
        setLinkUrl("");
        setShowLinkInput(false);
    }, [editor, linkUrl]);

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30 rounded-t-xl">
            {/* Font Family Dropdown */}
            <select
                value={editor.getAttributes("textStyle").fontFamily || ""}
                onChange={(e) => {
                    if (e.target.value) {
                        editor.chain().focus().setFontFamily(e.target.value).run();
                    } else {
                        editor.chain().focus().unsetFontFamily().run();
                    }
                }}
                className="h-8 px-2 text-sm bg-transparent border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground"
                title="Font Family"
            >
                <option value="">Font</option>
                {SITE_FONTS.map((font) => (
                    <option key={font.value} value={font.value}>
                        {font.label}
                    </option>
                ))}
            </select>

            {/* Font Size Dropdown */}
            <select
                value=""
                onChange={(e) => {
                    if (e.target.value) {
                        (editor.commands as any).setFontSize(e.target.value);
                    }
                }}
                className="h-8 px-2 text-sm bg-transparent border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground w-16"
                title="Font Size"
            >
                <option value="">Size</option>
                {FONT_SIZES.map((size) => (
                    <option key={size.value} value={size.value}>
                        {size.label}
                    </option>
                ))}
            </select>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Headings */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive("heading", { level: 1 })}
                title="Heading 1"
            >
                <Heading1 size={16} />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive("heading", { level: 2 })}
                title="Heading 2"
            >
                <Heading2 size={16} />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive("heading", { level: 3 })}
                title="Heading 3"
            >
                <Heading3 size={16} />
            </ToolbarButton>

            <div className="w-px h-6 bg-border mx-1" />

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
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                isActive={editor.isActive({ textAlign: "justify" })}
                title="Justify"
            >
                <AlignJustify size={16} />
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

            {/* Emoji Picker */}
            <div className="relative" ref={emojiPickerRef}>
                <ToolbarButton
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="Insert Emoji"
                >
                    <Smile size={16} />
                </ToolbarButton>
                {showEmojiPicker && (
                    <div className="absolute top-full right-0 mt-1 z-50">
                        <EmojiPicker
                            onEmojiClick={(emojiData) => {
                                editor.chain().focus().insertContent(emojiData.emoji).run();
                                setShowEmojiPicker(false);
                            }}
                            theme={Theme.AUTO}
                            width={320}
                            height={400}
                            previewConfig={{ showPreview: false }}
                            searchPlaceholder="Search emoji..."
                        />
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

export function PressKitBioEditor({
    value,
    onChange,
    placeholder = "Write your biography here...",
}: PressKitBioEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            TextStyle,
            FontFamily,
            FontSize,
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
                    "prose prose-lg dark:prose-invert max-w-none p-4 min-h-[250px] focus:outline-none",
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
                <div className="p-4 min-h-[250px]" />
            </div>
        );
    }

    return (
        <div className="border border-border rounded-xl bg-card overflow-hidden focus-within:ring-2 focus-within:ring-accent-coral/50 transition-all">
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
