"use client"

import { useState } from "react"
import Image from "next/image"
import { BookmarkX, Pencil, Check, X, Tag } from "lucide-react"
import { cn, formatDate, HOOK_LABELS, HOOK_COLORS, FORMAT_LABELS, FORMAT_COLORS } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import type { SavedAd } from "@/types"

interface SavedAdCardProps {
  savedAd: SavedAd
  onRemoved: (id: string) => void
  onUpdated: (id: string, notes: string, tags: string) => void
}

export function SavedAdCard({ savedAd, onRemoved, onUpdated }: SavedAdCardProps) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(savedAd.notes ?? "")
  const [tags, setTags] = useState(savedAd.tags ?? "")
  const [removing, setRemoving] = useState(false)

  const ad = savedAd.ad

  async function handleRemove() {
    setRemoving(true)
    try {
      await fetch(`/api/ads/${ad.id}/save`, { method: "DELETE" })
      onRemoved(savedAd.id)
      toast({ title: "Removed from saved" })
    } catch {
      toast({ title: "Failed to remove", variant: "destructive" })
    } finally {
      setRemoving(false)
    }
  }

  async function handleSaveEdit() {
    try {
      await fetch(`/api/saved/${savedAd.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, tags }),
      })
      onUpdated(savedAd.id, notes, tags)
      setEditing(false)
      toast({ title: "Notes updated" })
    } catch {
      toast({ title: "Failed to save notes", variant: "destructive" })
    }
  }

  const parsedTags = tags
    ? tags.split(",").map((t) => t.trim()).filter(Boolean)
    : []

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden card-hover group">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {ad.imageUrl ? (
          <Image
            src={ad.imageUrl}
            alt={ad.headline}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900/30 to-violet-900/20">
            <span className="text-xs text-muted-foreground">No image</span>
          </div>
        )}
        <button
          onClick={handleRemove}
          disabled={removing}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-600/80 transition-all backdrop-blur-sm"
        >
          <BookmarkX className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-indigo-400">{ad.competitor?.name}</span>
          <span className="text-[11px] text-muted-foreground">{formatDate(savedAd.createdAt)}</span>
        </div>

        <p className="text-sm font-semibold leading-snug mb-3 line-clamp-2">{ad.headline}</p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {ad.hookType && ad.hookType !== "none" && (
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", HOOK_COLORS[ad.hookType])}>
              {HOOK_LABELS[ad.hookType]}
            </span>
          )}
          {ad.formatType && ad.formatType !== "none" && (
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", FORMAT_COLORS[ad.formatType])}>
              {FORMAT_LABELS[ad.formatType]}
            </span>
          )}
        </div>

        {/* Notes / Edit */}
        <div className="pt-3 border-t border-border">
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                rows={2}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-xs bg-muted border border-border",
                  "placeholder:text-muted-foreground resize-none",
                  "focus:outline-none focus:ring-1 focus:ring-ring"
                )}
              />
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags, comma-separated"
                className={cn(
                  "w-full px-3 py-1.5 rounded-lg text-xs bg-muted border border-border",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-1 focus:ring-ring"
                )}
              />
              <div className="flex gap-1.5">
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1 px-3 h-7 rounded-md text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 px-3 h-7 rounded-md text-xs bg-muted hover:bg-accent border border-border transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {notes ? (
                <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">{notes}</p>
              ) : null}
              {parsedTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {parsedTags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-indigo-400 transition-colors"
              >
                <Pencil className="w-3 h-3" />
                {notes ? "Edit notes" : "Add notes & tags"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
