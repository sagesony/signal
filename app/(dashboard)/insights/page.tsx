"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Topbar } from "@/components/layout/topbar"
import { InsightCard } from "@/components/insights/insight-card"
import { cn } from "@/lib/utils"
import type { Insight } from "@/types"

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "trend", label: "Trends" },
  { value: "pattern", label: "Patterns" },
  { value: "opportunity", label: "Opportunities" },
]

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("")

  useEffect(() => {
    setLoading(true)
    const params = category ? `?category=${category}` : ""
    fetch(`/api/insights${params}`)
      .then((r) => r.json())
      .then(setInsights)
      .finally(() => setLoading(false))
  }, [category])

  const newCount = insights.filter((i) => i.isNew).length

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <Topbar
        title="Insights"
        description={
          newCount > 0
            ? `${newCount} new insight${newCount !== 1 ? "s" : ""} from the past 7 days.`
            : "AI-generated market intelligence from your competitive landscape."
        }
      />

      {/* Category tabs */}
      <div className="flex items-center gap-1 mb-6 bg-muted/50 rounded-lg p-1 w-fit">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={cn(
              "px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors",
              category === cat.value
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-14 text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold mb-1.5">No insights yet</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Insights are generated automatically as competitors run more ads.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  )
}
