"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Layers } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatRelative, HOOK_COLORS, HOOK_LABELS } from "@/lib/utils"
import type { Ad } from "@/types"

interface ActivityFeedProps {
  ads: Ad[]
}

export function ActivityFeed({ ads }: ActivityFeedProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold">Latest Ads</h2>
        </div>
        <Link
          href="/ads"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-indigo-400 transition-colors"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {ads.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No ads tracked yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {ads.map((ad) => (
            <div key={ad.id} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
              {ad.imageUrl && (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                  <Image
                    src={ad.imageUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-indigo-400">{ad.competitor.name}</span>
                  {ad.hookType && ad.hookType !== "none" && (
                    <Badge
                      className={`text-[10px] px-1.5 py-0 border ${HOOK_COLORS[ad.hookType] ?? ""}`}
                    >
                      {HOOK_LABELS[ad.hookType]}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium leading-snug line-clamp-1">{ad.headline}</p>
                {ad.body && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ad.body}</p>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0">{formatRelative(ad.lastSeen)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
