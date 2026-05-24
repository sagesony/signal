"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate, CATEGORY_COLORS } from "@/lib/utils"
import type { Insight } from "@/types"

interface RecentInsightsProps {
  insights: Insight[]
}

export function RecentInsights({ insights }: RecentInsightsProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold">Recent Insights</h2>
        </div>
        <Link
          href="/insights"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-indigo-400 transition-colors"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {insights.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No insights yet. Add competitors to get started.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {insights.map((insight) => (
            <div key={insight.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {insight.isNew && (
                      <Badge variant="new" className="text-[10px] px-1.5 py-0">
                        New
                      </Badge>
                    )}
                    <Badge
                      className={`text-[10px] px-1.5 py-0 border ${CATEGORY_COLORS[insight.category] ?? ""}`}
                    >
                      {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium leading-snug mb-1">{insight.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{insight.summary}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${insight.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {Math.round(insight.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{formatDate(insight.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
