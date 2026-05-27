"use client"

import Image from "next/image"
import { Flame } from "lucide-react"
import { cn, getRunDays, isLongRunning } from "@/lib/utils"
import type { Ad } from "@/types"

interface AdCardCompactProps {
  ad: Ad
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function AdCardCompact({ ad }: AdCardCompactProps) {
  const runDays    = getRunDays(ad.firstSeen, ad.lastSeen)
  const winning    = isLongRunning(ad.firstSeen, ad.lastSeen) && ad.isActive
  const isNew      = Date.now() - new Date(ad.firstSeen).getTime() < SEVEN_DAYS_MS
  const isStopped  = !ad.isActive

  const fbUrl = ad.externalId
    ? `https://www.facebook.com/ads/library/?id=${ad.externalId}`
    : null

  return (
    <div
      onClick={() => fbUrl && window.open(fbUrl, "_blank", "noopener,noreferrer")}
      className={cn(
        "group w-44 shrink-0 rounded-xl border bg-card overflow-hidden transition-all duration-200",
        fbUrl ? "cursor-pointer hover:border-indigo-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20" : "",
        winning ? "border-amber-500/25" : "border-border"
      )}
    >
      {/* Image */}
      <div className="relative h-28 bg-muted overflow-hidden">
        {ad.imageUrl ? (
          <Image
            src={ad.imageUrl}
            alt={ad.headline}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="176px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900/30 to-violet-900/20">
            <span className="text-[10px] text-muted-foreground">No image</span>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute bottom-1.5 left-1.5">
          {winning ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-full px-1.5 py-0.5 backdrop-blur-sm">
              <Flame className="w-2.5 h-2.5" />
              {runDays}d
            </span>
          ) : isNew ? (
            <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-1.5 py-0.5 backdrop-blur-sm">
              NEW
            </span>
          ) : isStopped ? (
            <span className="text-[10px] font-medium bg-zinc-800/70 text-zinc-400 border border-zinc-600/30 rounded-full px-1.5 py-0.5 backdrop-blur-sm">
              {runDays}d · stopped
            </span>
          ) : runDays > 0 ? (
            <span className="text-[10px] font-medium bg-black/50 text-white/70 rounded-full px-1.5 py-0.5 backdrop-blur-sm">
              {runDays}d
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5">
        <p className="text-[10px] text-muted-foreground mb-0.5 truncate">{ad.competitor.name}</p>
        <p className="text-xs font-medium leading-snug line-clamp-2 text-foreground/90">
          {ad.headline}
        </p>
      </div>
    </div>
  )
}
