"use client";

import { useState, useRef, useEffect } from "react";
// Using native <img> for /uploads/ images to bypass Next.js Image Optimizer
import {
  Music2, Plus, Trash2, GripVertical, Eye, EyeOff,
  Upload, Link as LinkIcon, X, Pencil
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
  id: number;
  title: string;
  artist: string | null;
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
  onReorder?: (orderedIds: number[]) => Promise<any>;
  onEdit?: (formData: FormData) => Promise<any>;
}

// Sortable Track Item Component
function SortableTrackItem({
  track,
  index,
  onToggleClick,
  onDelete,
  onEditStart,
}: {
  track: Track;
  index: number;
  onToggleClick: (id: number, currentStatus: boolean) => void;
  onDelete: (formData: FormData) => Promise<any>;
  onEditStart: (track: Track) => void;
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

  const getAudioSrc = () => track.fileUrl || track.externalLink || "";

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

      {/* Cover */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
        {track.coverImage ? (
          <img src={track.coverImage} alt={track.title} className="object-cover w-full h-full" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={24} className="text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{track.title}</p>
        <p className="text-sm text-muted-foreground truncate">{track.artist || "Heiraza"}</p>
        <p className="text-xs text-muted-foreground/60 truncate">{getAudioSrc()}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEditStart(track)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          title="Edit track"
        >
          <Pencil size={18} />
        </button>

        <button
          type="button"
          onClick={() => onToggleClick(track.id, track.isActive)}
          className={`p-2 rounded-lg transition-colors ${track.isActive
            ? "hover:bg-muted text-accent-coral"
            : "hover:bg-muted text-muted-foreground"
            }`}
          title={track.isActive ? "Deactivate track" : "Activate track"}
        >
          {track.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>

        <form action={onDelete}>
          <input type="hidden" name="id" value={track.id} />
          <button type="submit" className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors" title="Delete track">
            <Trash2 size={18} className="text-red-500" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function TrackManager({ tracks, onAdd, onToggle, onDelete, onMove, onReorder, onEdit }: TrackManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [inputMethod, setInputMethod] = useState<"upload" | "url">("url");
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("Heiraza");
  const [newUrl, setNewUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localTracks, setLocalTracks] = useState(tracks);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // When editing interaction starts
  const handleEditStart = (track: Track) => {
    setEditingTrack(track);
    setNewTitle(track.title);
    setNewArtist(track.artist || "Heiraza");
    setNewUrl(track.externalLink || "");
    setInputMethod(track.fileUrl ? "upload" : "url");
    setCoverPreview(track.coverImage || null);
    setIsAdding(true); // Re-use the add form
  };

  const audioFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local tracks when props change
  useEffect(() => {
    setLocalTracks(tracks);
  }, [tracks]);

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

      // Call reorder API with just the IDs
      if (onReorder) {
        const orderedIds = newOrder.map((t) => t.id);
        await onReorder(orderedIds);
      }
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    } else {
      setSelectedFileName(null);
    }
  };

  const handleSubmit = async () => {
    if (!newTitle || (!newUrl && inputMethod === "url")) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    // Simulate progress
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    const formData = new FormData();
    formData.set("title", newTitle);
    formData.set("artist", newArtist || "Heiraza");

    if (inputMethod === "url") {
      formData.set("externalLink", newUrl);
    } else if (audioFileRef.current?.files?.[0]) {
      formData.set("audioFile", audioFileRef.current.files[0]);
    }

    if (coverPreview) {
      formData.set("coverImage", coverPreview);
    }

    if (editingTrack) {
      formData.set("id", editingTrack.id.toString());
      if (onEdit) await onEdit(formData);
    } else {
      await onAdd(formData);
    }

    resetForm();
    setIsSubmitting(false);
  };

  const resetForm = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setUploadProgress(100);

    // Small delay to show 100%
    setTimeout(() => {
      setNewTitle("");
      setNewArtist("Heiraza");
      setNewUrl("");
      setCoverPreview(null);
      setSelectedFileName(null);
      setIsAdding(false);
      setEditingTrack(null);
      setIsSubmitting(false);
      setUploadProgress(0);

      if (audioFileRef.current) audioFileRef.current.value = "";
      if (coverFileRef.current) coverFileRef.current.value = "";
    }, 500);
  };

  // Optimistic toggle handler
  const handleToggleClick = async (id: number, currentStatus: boolean) => {
    // Optimistically update local state immediately
    setLocalTracks(prev =>
      prev.map(t => t.id === id ? { ...t, isActive: !currentStatus } : t)
    );

    // Call server action
    const formData = new FormData();
    formData.set("id", id.toString());
    formData.set("isActive", currentStatus.toString());

    try {
      await onToggle(formData);
    } catch (error) {
      // Revert on failure
      setLocalTracks(prev =>
        prev.map(t => t.id === id ? { ...t, isActive: currentStatus } : t)
      );
      console.error("Failed to toggle track visibility:", error);
    }
  };

  return (
    <div className="p-6">
      {/* Add Button - Show only when not adding */}
      {!isAdding && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsAdding(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add Track
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="p-6 rounded-xl border border-accent-coral/30 bg-accent-coral/5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-lg">{editingTrack ? "Edit Track" : "Add New Track"}</h3>
            <button onClick={resetForm} className="p-1 hover:bg-muted rounded">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div>
                <label className="block text-sm font-medium mb-2">Audio Source *</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setInputMethod("url")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${inputMethod === "url" ? "bg-accent-coral text-white" : "bg-muted hover:bg-muted/80"}`}
                  >
                    <LinkIcon size={16} />
                    External URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMethod("upload")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${inputMethod === "upload" ? "bg-accent-coral text-white" : "bg-muted hover:bg-muted/80"}`}
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
                  <div className="space-y-3">
                    <input
                      ref={audioFileRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      id="audio-upload"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="audio-upload" className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent-coral/50 hover:bg-accent-coral/5 transition-colors">
                      <Upload size={20} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {editingTrack && editingTrack.fileUrl && !selectedFileName
                          ? "Click to replace current file"
                          : "Click to upload MP3"}
                      </span>
                    </label>

                    {selectedFileName && (
                      <div className="flex items-center gap-2 text-sm text-accent-coral bg-accent-coral/10 p-2 rounded-lg">
                        <Music2 size={14} />
                        <span className="truncate flex-1">{selectedFileName}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cover Art (Optional)</label>
              <input ref={coverFileRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" id="cover-upload" />

              {coverPreview ? (
                <div className="relative aspect-square max-w-[200px] rounded-xl overflow-hidden bg-neutral-800">
                  {/* Native img for base64 preview */}
                  <img src={coverPreview} alt="Cover preview" className="absolute inset-0 w-full h-full object-cover" />
                  <button
                    onClick={() => { setCoverPreview(null); if (coverFileRef.current) coverFileRef.current.value = ""; }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              ) : (
                <label htmlFor="cover-upload" className="flex flex-col items-center justify-center aspect-square max-w-[200px] border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent-coral/50 hover:bg-accent-coral/5 transition-colors bg-neutral-100 dark:bg-neutral-800">
                  <Music2 size={40} className="text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload cover art</span>
                  <span className="text-xs text-muted-foreground/60 mt-1">Square image recommended</span>
                </label>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            {/* Progress Bar */}
            {isSubmitting && (
              <div className="w-full space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-coral transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
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
                    {editingTrack ? <Pencil size={16} /> : <Plus size={16} />}
                    {editingTrack ? "Update Track" : "Add Track"}
                  </>
                )}
              </button>
              <button onClick={resetForm} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Track List with Drag & Drop */}
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
                  onToggleClick={handleToggleClick}
                  onDelete={onDelete}
                  onEditStart={handleEditStart}
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

      {/* Tips */}
      <div className="mt-6 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Tracks with <Eye size={12} className="inline text-accent-coral" /> are visible on the homepage</li>
          <li><strong>Drag handles</strong> to reorder tracks</li>
          <li>Changes are saved automatically after reordering</li>
        </ul>
      </div>
    </div>
  );
}
