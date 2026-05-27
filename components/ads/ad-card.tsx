"use client"

import { useState } from "react"
import Image from "next/image"
import { Bookmark, BookmarkCheck, ArrowUpRight, Flame } from "lucide-react"
import { cn, formatRelative, getRunDays, isLongRunning } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import type { Ad } from "@/types"

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

interface AdCardProps {
  ad: Ad
  onSaveToggle?: (adId: string, saved: boolean) => void
}

export function AdCard({ ad, onSaveToggle }: AdCardProps) {
  const { toast } = useToast()
  const [saving, setSaving]   = useState(false)
  const [isSaved, setIsSaved] = useState(ad.isSaved ?? false)

  const runDays    = getRunDays(ad.firstSeen, ad.lastSeen)
  const longRunning = isLongRunning(ad.firstSeen, ad.lastSeen)
  const isNew       = Date.now() - new Date(ad.firstSeen).getTime() < SEVEN_DAYS_MS
  const isStopped   = !ad.isActive

  const fbUrl = ad.externalId
    ? `https://www.facebook.com/ads/library/?id=${ad.externalId}`
    : null

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
      <div
        className={cn("relative aspect-[4/3] bg-muted overflow-hidden", fbUrl && "cursor-pointer")}
        onClick={(e) => {
          if (!fbUrl) return
          if ((e.target as HTMLElement).closest("button, a")) return
          window.open(fbUrl, "_blank", "noopener,noreferrer")
        }}
      >
        {ad.imageUrl ? (
          <Image
            src={ad.imageUrl}
            alt={ad.headline}
            fill
            unoptimized
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
              isSaved ? "bg-indigo-600 text-white" : "bg-black/40 text-white hover:bg-black/60"
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

        {/* Bottom badges */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          {/* Platform + status */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-black/50 text-white backdrop-blur-sm rounded-full px-2 py-0.5 font-medium uppercase tracking-wide">
              {ad.platform}
            </span>
            {isNew && (
              <span className="text-[10px] bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm rounded-full px-2 py-0.5 font-semibold">
                NEW
              </span>
            )}
            {isStopped && !isNew && (
              <span className="text-[10px] bg-zinc-800/70 text-zinc-400 border border-zinc-600/30 backdrop-blur-sm rounded-full px-2 py-0.5 font-medium">
                Stopped
              </span>
            )}
          </div>
          {longRunning && (
            <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 backdrop-blur-sm border border-amber-500/30 rounded-full px-2 py-0.5 font-semibold">
              <Flame className="w-2.5 h-2.5" />
              {runDays}d
            </span>
          )}
        </div>

        {/* "View on Facebook" centre overlay */}
        {fbUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[11px] font-medium text-white bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
              <ArrowUpRight className="w-3 h-3" />
              View on Facebook
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Brand + run time */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-indigo-400 truncate mr-2">
            {ad.competitor.name}
          </span>
          <span
            className={cn(
              "text-[11px] tabular-nums shrink-0",
              longRunning ? "text-amber-400 font-semibold" : "text-muted-foreground"
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
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ad.body}</p>
        )}
      </div>
    </div>
  )
}
