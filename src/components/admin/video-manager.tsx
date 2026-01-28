"use client";

import { useState, useEffect } from "react";
import { Youtube, Plus, Trash2, GripVertical, Eye, EyeOff, ExternalLink } from "lucide-react";
import { extractYouTubeVideoId, getYouTubeThumbnail } from "@/lib/image-utils";

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

interface Video {
  id: number;
  title: string | null;
  youtubeUrl: string;
  isActive: boolean;
  sortOrder: number;
}

interface VideoManagerProps {
  videos: Video[];
  onAdd: (formData: FormData) => Promise<void>;
  onToggle: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
  onReorder?: (orderedIds: number[]) => Promise<void>;
}

// Sortable Video Item Component
function SortableVideoItem({
  video,
  index,
  onToggleClick,
  onDelete,
}: {
  video: Video;
  index: number;
  onToggleClick: (id: number, currentStatus: boolean) => void;
  onDelete: (formData: FormData) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none" as const,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : "auto" as const,
  };

  const thumbnail = getYouTubeThumbnail(video.youtubeUrl, "mq");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${video.isActive
        ? "bg-background/50 border-border"
        : "bg-muted/30 border-muted opacity-60"
        } ${isDragging ? "shadow-lg ring-2 ring-red-500/50" : ""}`}
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

      {/* Thumbnail */}
      <div className="w-24 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {thumbnail && (
          <img
            src={thumbnail}
            alt={video.title || "Video"}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {video.title || `Video ${video.id}`}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {video.youtubeUrl}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <a
          href={video.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="Open in YouTube"
        >
          <ExternalLink size={16} className="text-muted-foreground" />
        </a>

        <button
          type="button"
          onClick={() => onToggleClick(video.id, video.isActive)}
          className={`p-2 rounded-lg transition-colors ${video.isActive
            ? "hover:bg-muted text-accent-coral"
            : "hover:bg-muted text-muted-foreground"
            }`}
          title={video.isActive ? "Hide video" : "Show video"}
        >
          {video.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>

        <form action={onDelete}>
          <input type="hidden" name="id" value={video.id} />
          <button
            type="submit"
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            title="Delete video"
          >
            <Trash2 size={18} className="text-red-500" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function VideoManager({ videos, onAdd, onToggle, onDelete, onReorder }: VideoManagerProps) {
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [localVideos, setLocalVideos] = useState(videos);

  // Sync local videos when props change (including isActive changes)
  useEffect(() => {
    setLocalVideos(videos);
  }, [videos]);

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

  // Handle drag end - reorder videos
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localVideos.findIndex((v) => v.id === active.id);
      const newIndex = localVideos.findIndex((v) => v.id === over.id);

      const newOrder = arrayMove(localVideos, oldIndex, newIndex);
      setLocalVideos(newOrder);

      // Call reorder API with just the IDs (lightweight payload)
      if (onReorder) {
        const orderedIds = newOrder.map((v) => v.id);
        await onReorder(orderedIds);
      }
    }
  };

  const handleAdd = async () => {
    if (!newUrl) return;

    const formData = new FormData();
    formData.set("youtubeUrl", newUrl);
    formData.set("title", newTitle);

    await onAdd(formData);
    setNewUrl("");
    setNewTitle("");
    setIsAdding(false);
  };

  // Optimistic toggle handler with rollback on failure
  const handleToggleClick = async (id: number, currentStatus: boolean) => {
    // Optimistically update local state immediately
    setLocalVideos(prev =>
      prev.map(v => v.id === id ? { ...v, isActive: !currentStatus } : v)
    );

    // Call server action
    const formData = new FormData();
    formData.set("id", id.toString());
    formData.set("isActive", currentStatus.toString());

    try {
      await onToggle(formData);
    } catch (error) {
      // Revert on failure
      setLocalVideos(prev =>
        prev.map(v => v.id === id ? { ...v, isActive: currentStatus } : v)
      );
      console.error("Failed to toggle video visibility:", error);
    }
  };

  const activeCount = localVideos.filter(v => v.isActive).length;

  return (
    <div className="glass-card p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Youtube className="text-red-500" size={24} />
          <div>
            <h2 className="font-display text-2xl tracking-wide">YouTube Videos</h2>
            <p className="text-sm text-muted-foreground">
              {activeCount} active / {videos.length} total • Drag to reorder
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Add Video
        </button>
      </div>

      {/* Add New Video Form */}
      {isAdding && (
        <div className="mb-6 p-4 rounded-xl border border-accent-coral/30 bg-accent-coral/5">
          <h3 className="font-medium mb-4">Add New Video</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">YouTube URL *</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Title (Optional)</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Video title..."
                className="input-field"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAdd}
                disabled={!newUrl}
                className="btn-primary text-sm disabled:opacity-50"
              >
                Add Video
              </button>
              <button
                onClick={() => { setIsAdding(false); setNewUrl(""); setNewTitle(""); }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video List with Drag & Drop */}
      {localVideos.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localVideos.map((v) => v.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {localVideos.map((video, index) => (
                <SortableVideoItem
                  key={video.id}
                  video={video}
                  index={index}
                  onToggleClick={handleToggleClick}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <Youtube className="mx-auto mb-4" size={40} />
          <p>No videos yet</p>
          <p className="text-sm mt-1">Add your first YouTube video above</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Videos with <Eye size={12} className="inline text-accent-coral" /> are visible on the homepage</li>
          <li><strong>Drag handles</strong> to reorder videos</li>
          <li>Add 4+ videos to enable the infinite carousel</li>
          <li>Carousel auto-scrolls every 2 seconds</li>
        </ul>
      </div>
    </div>
  );
}
