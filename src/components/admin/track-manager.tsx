"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Music2, Plus, Trash2, GripVertical, Eye, EyeOff,
  Upload, Link as LinkIcon, X, ArrowUp, ArrowDown
} from "lucide-react";

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
}

export function TrackManager({ tracks, onAdd, onToggle, onDelete, onMove, onReorder }: TrackManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [inputMethod, setInputMethod] = useState<"upload" | "url">("url");
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("Heiraza");
  const [newUrl, setNewUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const audioFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const activeCount = tracks.filter(t => t.isActive).length;

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!newTitle || (!newUrl && inputMethod === "url")) return;

    setIsSubmitting(true);

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

    await onAdd(formData);

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

  const getAudioSrc = (track: Track) => track.fileUrl || track.externalLink || "";

  return (
    <div className="space-y-4">
      {/* Add Button */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Add Track
        </button>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="p-6 rounded-xl border border-accent-coral/30 bg-accent-coral/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-lg">Add New Track</h3>
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
                  <div>
                    <input ref={audioFileRef} type="file" accept="audio/*" className="hidden" id="audio-upload" />
                    <label htmlFor="audio-upload" className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent-coral/50 hover:bg-accent-coral/5 transition-colors">
                      <Upload size={20} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload MP3</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cover Art (Optional)</label>
              <input ref={coverFileRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" id="cover-upload" />

              {coverPreview ? (
                <div className="relative aspect-square max-w-[200px] rounded-xl overflow-hidden bg-neutral-800">
                  <Image src={coverPreview} alt="Cover preview" fill className="object-cover" />
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
            <button onClick={resetForm} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Track List */}
      {tracks.length > 0 ? (
        <div className="space-y-3">
          {tracks.map((track) => (
            <div
              key={track.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${track.isActive ? "bg-background/50 border-border" : "bg-muted/30 border-muted opacity-60"}`}
            >
              <div className="text-muted-foreground cursor-grab">
                <GripVertical size={18} />
              </div>

              <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                {track.coverImage ? (
                  <Image src={track.coverImage} alt={track.title} width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 size={24} className="text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.title}</p>
                <p className="text-sm text-muted-foreground truncate">{track.artist || "Heiraza"}</p>
                <p className="text-xs text-muted-foreground/60 truncate">{getAudioSrc(track)}</p>
              </div>

              <div className="flex items-center gap-1">
                {onMove && (
                  <>
                    <form action={onMove}>
                      <input type="hidden" name="id" value={track.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button type="submit" className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Move up">
                        <ArrowUp size={18} />
                      </button>
                    </form>
                    <form action={onMove}>
                      <input type="hidden" name="id" value={track.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button type="submit" className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Move down">
                        <ArrowDown size={18} />
                      </button>
                    </form>
                  </>
                )}

                <form action={onToggle}>
                  <input type="hidden" name="id" value={track.id} />
                  <input type="hidden" name="isActive" value={track.isActive.toString()} />
                  <button type="submit" className={`p-2 rounded-lg transition-colors ${track.isActive ? "hover:bg-muted text-accent-coral" : "hover:bg-muted text-muted-foreground"}`} title={track.isActive ? "Deactivate track" : "Activate track"}>
                    {track.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </form>

                <form action={onDelete}>
                  <input type="hidden" name="id" value={track.id} />
                  <button type="submit" className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors" title="Delete track">
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <Music2 className="mx-auto mb-4" size={40} />
          <p>No tracks yet</p>
          <p className="text-sm mt-1">Add your first track above</p>
        </div>
      )}
    </div>
  );
}
