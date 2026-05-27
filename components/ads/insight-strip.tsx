"use client"

import { AdCardCompact } from "./ad-card-compact"
import type { Ad } from "@/types"

interface InsightStripProps {
  icon: string
  title: string
  subtitle: string
  ads: Ad[]
  titleClass?: string
}

export function InsightStrip({ icon, title, subtitle, ads, titleClass }: InsightStripProps) {
  if (ads.length === 0) return null

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[15px] leading-none">{icon}</span>
          <h2 className={`text-sm font-semibold ${titleClass ?? "text-foreground"}`}>{title}</h2>
        </div>
        <p className="text-[12px] text-muted-foreground pl-6">{subtitle}</p>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {ads.map((ad) => (
          <AdCardCompact key={ad.id} ad={ad} />
        ))}
      </div>
    </div>
  )
}
