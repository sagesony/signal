"use client"

import { useState } from "react"
import Image from "next/image"
import { Bookmark, BookmarkCheck, ArrowUpRight, Flame } from "lucide-react"
import { cn, formatRelative, getRunDays, isLongRunning, HOOK_LABELS, HOOK_COLORS, FORMAT_LABELS, FORMAT_COLORS, OFFER_LABELS } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import type { Ad } from "@/types"

interface AdCardProps {
  ad: Ad
  onSaveToggle?: (adId: string, saved: boolean) => void
}

export function AdCard({ ad, onSaveToggle }: AdCardProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(ad.isSaved ?? false)

  const runDays = getRunDays(ad.firstSeen, ad.lastSeen)
  const longRunning = isLongRunning(ad.firstSeen, ad.lastSeen)

  async function toggleSave() {
    setSaving(true)
    try {
      const method = isSaved ? "DELETE" : "POST"
      const res = await fetch(`/api/ads/${ad.id}/save`, { method })
      if (res.ok) {
        const next = !isSaved
        setIsSaved(next)
        onSaveToggle?.(ad.id, next)
        toast({
          title: next ? "Ad saved" : "Removed from saved",
          variant: next ? "success" as any : "default",
        })
      }
    } catch {
      toast({ title: "Action failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn(
      "rounded-xl border bg-card overflow-hidden card-hover group",
      longRunning ? "border-amber-500/30" : "border-border"
    )}>
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {ad.imageUrl ? (
          <Image
            src={ad.imageUrl}
            alt={ad.headline}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900/30 to-violet-900/20">
            <span className="text-xs text-muted-foreground">No image</span>
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleSave}
            disabled={saving}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-sm transition-colors",
              isSaved
                ? "bg-indigo-600 text-white"
                : "bg-black/40 text-white hover:bg-black/60"
            )}
          >
            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
          {ad.landingUrl && (
            <a
              href={ad.landingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Bottom badges row */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <span className="text-[10px] bg-black/50 text-white backdrop-blur-sm rounded-full px-2 py-0.5 font-medium uppercase tracking-wide">
            {ad.platform}
          </span>
          {longRunning && (
            <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 backdrop-blur-sm border border-amber-500/30 rounded-full px-2 py-0.5 font-medium">
              <Flame className="w-2.5 h-2.5" />
              {runDays}d running
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Competitor + run info */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-indigo-400">{ad.competitor.name}</span>
          <span
            className={cn(
              "text-[11px] tabular-nums",
              longRunning ? "text-amber-400 font-medium" : "text-muted-foreground"
            )}
            title={`First seen ${formatRelative(ad.firstSeen)} · Last seen ${formatRelative(ad.lastSeen)}`}
          >
            {runDays > 0 ? `${runDays}d` : formatRelative(ad.lastSeen)}
          </span>
        </div>

        {/* Headline */}
        <p className="text-sm font-semibold leading-snug mb-1.5 line-clamp-2">{ad.headline}</p>

        {/* Body */}
        {ad.body && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{ad.body}</p>
        )}

        {/* Tags */}
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
          {ad.offerType && ad.offerType !== "none" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 font-medium">
              {OFFER_LABELS[ad.offerType]}
            </span>
          )}
        </div>

        {/* CTA */}
        {ad.cta && (
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">CTA</span>
            <span className="text-xs font-medium text-foreground/90 bg-muted px-2.5 py-1 rounded-md border border-border">
              {ad.cta}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
