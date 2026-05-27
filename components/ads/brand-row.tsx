"use client"

import Link from "next/link"
import { ChevronRight, ExternalLink } from "lucide-react"
import { AdCardCompact } from "./ad-card-compact"
import { formatRelative } from "@/lib/utils"
import type { Ad, Competitor } from "@/types"

interface BrandRowProps {
  competitor: Competitor & { _count: { ads: number } }
  ads: Ad[]
  newCount: number
}

export function BrandRow({ competitor, ads, newCount }: BrandRowProps) {
  const initials = competitor.name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  // Most recently updated ad = last synced time
  const lastUpdated =
    ads.length > 0
      ? ads.reduce((latest, ad) =>
          new Date(ad.updatedAt) > new Date(latest.updatedAt) ? ad : latest
        ).updatedAt
      : null

  // Deep link into Meta Ad Library for this brand
  const metaUrl = competitor.metaPageId
    ? `https://www.facebook.com/ads/library/?view_all_page_id=${competitor.metaPageId}`
    : competitor.metaAdUrl ?? null

  return (
    <div className="rounded-xl border border-border bg-card/20 overflow-hidden mb-4">
      {/* Brand header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-900/60 to-violet-900/40 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-indigo-300">{initials}</span>
        </div>

        {/* Name + meta */}
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{competitor.name}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span>{competitor._count.ads} ads</span>
            {newCount > 0 && (
              <span className="text-emerald-400 font-medium">· {newCount} new this week</span>
            )}
            {lastUpdated && (
              <span>· synced {formatRelative(lastUpdated)}</span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {metaUrl && (
            <a
              href={metaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-indigo-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
              Meta
            </a>
          )}
          <Link
            href={`/ads?brand=${competitor.id}&brandName=${encodeURIComponent(competitor.name)}`}
            className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-indigo-400 transition-colors"
          >
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Horizontal ad scroll */}
      <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
        {ads.map((ad) => (
          <AdCardCompact key={ad.id} ad={ad} />
        ))}
      </div>
    </div>
  )
}
