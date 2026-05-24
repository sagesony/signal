"use client"

import { Badge } from "@/components/ui/badge"
import { formatDate, CATEGORY_COLORS } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { Insight } from "@/types"

interface InsightCardProps {
  insight: Insight
}

export function InsightCard({ insight }: InsightCardProps) {
  const confidencePct = Math.round(insight.confidence * 100)
  const confidenceColor =
    confidencePct >= 85
      ? "bg-emerald-500"
      : confidencePct >= 70
      ? "bg-amber-500"
      : "bg-rose-500"

  const categoryColor = CATEGORY_COLORS[insight.category] ?? CATEGORY_COLORS.trend

  return (
    <div className="rounded-xl border border-border bg-card p-5 card-hover group">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {insight.isNew && (
            <Badge variant="new" className="text-[10px] px-1.5 py-0">
              New
            </Badge>
          )}
          <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", categoryColor)}>
            {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
          </span>
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", confidenceColor)}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">{confidencePct}%</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold leading-snug mb-2">{insight.title}</h3>

      {/* Summary */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{insight.summary}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        {/* Competitor chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {insight.competitors.slice(0, 3).map((name) => (
            <span
              key={name}
              className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium"
            >
              {name}
            </span>
          ))}
          {insight.competitors.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{insight.competitors.length - 3} more
            </span>
          )}
        </div>

        <span className="text-[11px] text-muted-foreground">{formatDate(insight.createdAt)}</span>
      </div>

      {/* Tags */}
      {insight.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {insight.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
