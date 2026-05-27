"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  X, Flame, Bookmark, BookmarkCheck, ArrowUpRight, ExternalLink,
} from "lucide-react"
import { cn, getRunDays, isLongRunning, formatRelative } from "@/lib/utils"
import type { Ad } from "@/types"

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

interface AdDetailModalProps {
  ad: Ad
  initialSaved: boolean
  onClose: () => void
  onSaveChange?: (saved: boolean) => void
}

export function AdDetailModal({ ad, initialSaved, onClose, onSaveChange }: AdDetailModalProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [saving, setSaving]   = useState(false)

  const runDays     = getRunDays(ad.firstSeen, ad.lastSeen)
  const longRunning = isLongRunning(ad.firstSeen, ad.lastSeen)
  const isNew       = Date.now() - new Date(ad.firstSeen).getTime() < SEVEN_DAYS_MS
  const isStopped   = !ad.isActive
  const fbUrl       = ad.externalId
    ? `https://www.facebook.com/ads/library/?id=${ad.externalId}`
    : null

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  async function toggleSave() {
    setSaving(true)
    try {
      const method = isSaved ? "DELETE" : "POST"
      const res = await fetch(`/api/ads/${ad.id}/save`, { method })
      if (res.ok) {
        const next = !isSaved
        setIsSaved(next)
        onSaveChange?.(next)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-full max-w-3xl max-h-[92vh] overflow-hidden",
          "bg-card border rounded-2xl shadow-2xl",
          "flex flex-col md:flex-row",
          longRunning ? "border-amber-500/30" : "border-border"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Close ────────────────────────────────────────────────────── */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Image panel ──────────────────────────────────────────────── */}
        <div className="md:w-[45%] shrink-0 bg-muted/60 flex items-center justify-center min-h-52 md:min-h-0">
          {ad.imageUrl ? (
            <div className="relative w-full h-56 md:h-full">
              <Image
                src={ad.imageUrl}
                alt={ad.headline}
                fill
                unoptimized
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 45vw"
              />
            </div>
          ) : (
            <div className="w-full h-56 md:h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/30 to-violet-900/20">
              <span className="text-sm text-muted-foreground">No image</span>
            </div>
          )}
        </div>

        {/* ── Detail panel ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto flex flex-col p-5 md:p-6">

          {/* Brand + status badges */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                {ad.competitor.name}
              </p>
              <div className="flex items-center flex-wrap gap-1.5">
                {longRunning && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">
                    <Flame className="w-3 h-3" />
                    {runDays} days running
                  </span>
                )}
                {!longRunning && isNew && (
                  <span className="text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5">
                    NEW
                  </span>
                )}
                {isStopped && (
                  <span className="text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full px-2 py-0.5">
                    Stopped · {runDays}d
                  </span>
                )}
                {!longRunning && !isNew && !isStopped && runDays > 0 && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {runDays} days
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-muted-foreground">Last seen</p>
              <p className="text-[11px] font-medium">{formatRelative(ad.lastSeen)}</p>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-[15px] font-bold leading-snug mb-3 text-foreground">
            {ad.headline}
          </h2>

          {/* Body */}
          {ad.body && (
            <div className="mb-4 flex-1">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {ad.body}
              </p>
            </div>
          )}

          {/* CTA */}
          {ad.cta && (
            <div className="flex items-center gap-2 py-3 border-t border-border mb-3">
              <span className="text-xs text-muted-foreground">CTA</span>
              <span className="text-xs font-medium bg-muted px-2.5 py-1 rounded-md border border-border">
                {ad.cta}
              </span>
            </div>
          )}

          {/* Run dates */}
          <div className="text-[11px] text-muted-foreground space-y-0.5 mb-5">
            <p>First seen: <span className="text-foreground/70">{formatRelative(ad.firstSeen)}</span></p>
            <p>Last seen: <span className="text-foreground/70">{formatRelative(ad.lastSeen)}</span></p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap mt-auto pt-4 border-t border-border">
            <button
              onClick={toggleSave}
              disabled={saving}
              className={cn(
                "flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium border transition-colors",
                isSaved
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-muted border-border text-foreground hover:border-indigo-500/50 hover:text-indigo-400"
              )}
            >
              {isSaved
                ? <BookmarkCheck className="w-3.5 h-3.5" />
                : <Bookmark className="w-3.5 h-3.5" />}
              {isSaved ? "Saved" : "Save"}
            </button>

            {fbUrl && (
              <a
                href={fbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on Facebook
              </a>
            )}

            {ad.landingUrl && (
              <a
                href={ad.landingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Landing page
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
