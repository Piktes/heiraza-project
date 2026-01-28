"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Music2, Plus, Trash2, GripVertical, Eye, EyeOff,
  Upload, Link as LinkIcon, X, Edit2, Save, ArrowUp, ArrowDown
} from "lucide-react";

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Track {
  id: string;
  title: string;
  artist: string;
  fileUrl: string | null;
  externalLink: string | null;
  coverImage: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface TrackManagerProps {
  tracks: Track[];
  onAdd: (formData: FormData) => Promise<any>;
  onToggle: (formData: FormData) => Promise<any>;
  onDelete: (formData: FormData) => Promise<any>;
  onMove?: (formData: FormData) => Promise<any>;
  onReorder?: (orderedIds: string[]) => Promise<any>;
}

// Sortable Track Item Component
function SortableTrackItem({
  track,
  index,
  onToggle,
  onDelete,
  onMove,
}: {
  track: Track;
  index: number;
  onToggle: (formData: FormData) => Promise<any>;
  onDelete: (formData: FormData) => Promise<any>;
  onMove?: (formData: FormData) => Promise<any>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none" as const,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : "auto" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${track.isActive
        ? "bg-background/50 border-border"
        : "bg-muted/30 border-muted opacity-60"
        } ${isDragging ? "shadow-lg ring-2 ring-accent-coral/50" : ""}`}
    >
      {/* Index Number */}
      <span className="text-neutral-400 font-mono text-sm w-6 text-center flex-shrink-0">
        {index + 1}
      </span>

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-muted-foreground cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical size={18} />
      </div>

      {/* Cover Art - w-16 h-16 with fallback bg */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
        {track.coverImage ? (
          <Image
            src={track.coverImage}
            alt={track.title}
            width={64}
            height={64}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-coral/20 to-accent-peach/20">
            <Music2 size={20} className="text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{track.title}</p>
        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
        <p className="text-xs text-muted-foreground/60 truncate">{track.externalLink || track.fileUrl}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Move Up */}
        {onMove && (
          <form action={onMove}>
            <input type="hidden" name="id" value={track.id} />
            <input type="hidden" name="direction" value="up" />
            <button
              type="submit"
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              title="Move up"
            >
              <ArrowUp size={18} />
            </button>
          </form>
        )}

        {/* Move Down */}
        {onMove && (
          <form action={onMove}>
            <input type="hidden" name="id" value={track.id} />
            <input type="hidden" name="direction" value="down" />
            <button
              type="submit"
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              title="Move down"
            >
              <ArrowDown size={18} />
            </button>
          </form>
        )}
        {/* Toggle Active */}
        <form action={onToggle}>
          <input type="hidden" name="id" value={track.id} />
          <input type="hidden" name="isActive" value={track.isActive.toString()} />
          <button
            type="submit"
            className={`p-2 rounded-lg transition-colors ${track.isActive
              ? "hover:bg-muted text-accent-coral"
              : "hover:bg-muted text-muted-foreground"
              }`}
            title={track.isActive ? "Deactivate track" : "Activate track"}
          >
            {track.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </form>

        {/* Delete */}
        <form action={onDelete}>
          <input type="hidden" name="id" value={track.id} />
          <button
            type="submit"
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            title="Delete track"
          >
            <Trash2 size={18} className="text-red-500" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function TrackManager({ tracks, onAdd, onToggle, onDelete, onMove, onReorder }: TrackManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [inputMethod, setInputMethod] = useState<"upload" | "url">("url");
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("Heiraza");
  const [newUrl, setNewUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localTracks, setLocalTracks] = useState(tracks);

  // Sync local tracks when props change (including isActive changes)
  useEffect(() => {
    setLocalTracks(tracks);
  }, [tracks]);

  const audioFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const activeCount = tracks.filter(t => t.isActive).length;

  // Configure dnd-kit sensors with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Prevents click vs drag confusion
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end - reorder tracks
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localTracks.findIndex((t) => t.id === active.id);
      const newIndex = localTracks.findIndex((t) => t.id === over.id);

      const newOrder = arrayMove(localTracks, oldIndex, newIndex);
      setLocalTracks(newOrder);

      // Call reorder API with just the IDs (lightweight payload)
      if (onReorder) {
        const orderedIds = newOrder.map((t) => t.id);
        await onReorder(orderedIds);
      }
    }
  };

  // Handle cover image selection
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!newTitle || (!newUrl && inputMethod === "url")) return;

    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("title", newTitle);
    formData.set("artist", newArtist || "Heiraza");

    if (inputMethod === "url") {
      formData.set("audioSrc", newUrl);
    } else if (audioFileRef.current?.files?.[0]) {
      formData.set("audioFile", audioFileRef.current.files[0]);
    }

    if (coverPreview) {
      formData.set("coverImage", coverPreview);
    }

    await onAdd(formData);

    // Reset form
    setNewTitle("");
    setNewArtist("Heiraza");
    setNewUrl("");
    setCoverPreview(null);
    setIsAdding(false);
    setIsSubmitting(false);

    if (audioFileRef.current) audioFileRef.current.value = "";
    if (coverFileRef.current) coverFileRef.current.value = "";
  };

  const resetForm = () => {
    setNewTitle("");
    setNewArtist("Heiraza");
    setNewUrl("");
    setCoverPreview(null);
    setIsAdding(false);
    if (audioFileRef.current) audioFileRef.current.value = "";
    if (coverFileRef.current) coverFileRef.current.value = "";
  };

  return (
    <div className="glass-card p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Music2 className="text-accent-coral" size={24} />
          <div>
            <h2 className="font-display text-2xl tracking-wide">Audio Player Tracks</h2>
            <p className="text-sm text-muted-foreground">
              {activeCount} active / {tracks.length} total • Drag to reorder
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Add Track
        </button>
      </div>

      {/* ========================================
          ADD NEW TRACK FORM
          ======================================== */}
      {isAdding && (
        <div className="mb-6 p-6 rounded-xl border border-accent-coral/30 bg-accent-coral/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-lg">Add New Track</h3>
            <button onClick={resetForm} className="p-1 hover:bg-muted rounded">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Track Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Song name..."
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Artist</label>
                <input
                  type="text"
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  placeholder="Heiraza"
                  className="input-field"
                />
              </div>

              {/* Audio Source Toggle */}
              <div>
                <label className="block text-sm font-medium mb-2">Audio Source *</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setInputMethod("url")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${inputMethod === "url"
                      ? "bg-accent-coral text-white"
                      : "bg-muted hover:bg-muted/80"
                      }`}
                  >
                    <LinkIcon size={16} />
                    External URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMethod("upload")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${inputMethod === "upload"
                      ? "bg-accent-coral text-white"
                      : "bg-muted hover:bg-muted/80"
                      }`}
                  >
                    <Upload size={16} />
                    Upload MP3
                  </button>
                </div>

                {inputMethod === "url" ? (
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com/song.mp3"
                    className="input-field"
                  />
                ) : (
                  <div>
                    <input
                      ref={audioFileRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      id="audio-upload"
                    />
                    <label
                      htmlFor="audio-upload"
                      className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent-coral/50 hover:bg-accent-coral/5 transition-colors"
                    >
                      <Upload size={20} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload MP3
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Cover Art */}
            <div>
              <label className="block text-sm font-medium mb-2">Cover Art (Optional)</label>
              <input
                ref={coverFileRef}
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="hidden"
                id="cover-upload"
              />

              {coverPreview ? (
                <div className="relative aspect-square max-w-[200px] rounded-xl overflow-hidden bg-muted">
                  <Image
                    src={coverPreview}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => {
                      setCoverPreview(null);
                      if (coverFileRef.current) coverFileRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="cover-upload"
                  className="flex flex-col items-center justify-center aspect-square max-w-[200px] border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent-coral/50 hover:bg-accent-coral/5 transition-colors"
                >
                  <Music2 size={40} className="text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload cover art</span>
                  <span className="text-xs text-muted-foreground/60 mt-1">Square image recommended</span>
                </label>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleSubmit}
              disabled={!newTitle || (inputMethod === "url" && !newUrl) || isSubmitting}
              className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Track
                </>
              )}
            </button>
            <button onClick={resetForm} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ========================================
          TRACK LIST WITH DRAG & DROP
          ======================================== */}
      {localTracks.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localTracks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {localTracks.map((track, index) => (
                <SortableTrackItem
                  key={track.id}
                  track={track}
                  index={index}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onMove={onMove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <Music2 className="mx-auto mb-4" size={40} />
          <p>No tracks yet</p>
          <p className="text-sm mt-1">Add your first track above</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Player Behavior:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Tracks with <Eye size={12} className="inline text-accent-coral" /> are shown in the player</li>
          <li><strong>Drag handles</strong> to reorder tracks, or use arrows</li>
          <li><strong>Single track:</strong> Previous/Next buttons are hidden</li>
          <li><strong>Multiple tracks:</strong> All controls are shown</li>
        </ul>
      </div>
    </div>
  );
}
