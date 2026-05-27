"use client"

import { useEffect, useState } from "react"
import { Building2, ExternalLink } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Topbar } from "@/components/layout/topbar"
import { CompetitorCard } from "@/components/competitors/competitor-card"
import type { Competitor } from "@/types"

export default function BrandsPage() {
  const [competitors, setCompetitors] = useState<(Competitor & { _count: { ads: number } })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/competitors")
      .then((r) => r.json())
      .then(setCompetitors)
      .finally(() => setLoading(false))
  }, [])

  function handleDeleted(id: string) {
    setCompetitors((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <Topbar
        title="Brands"
        description={
          competitors.length > 0
            ? `Tracking ${competitors.length} brand${competitors.length !== 1 ? "s" : ""}.`
            : "Brands appear here automatically when you sync ads via the extension."
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : competitors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-14 text-center max-w-md mx-auto mt-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold mb-2">No brands yet</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-5">
            Brands are created automatically when you sync a competitor&apos;s ads using the
            Chrome extension. Go to their Meta Ad Library page and click Sync.
          </p>
          <a
            href="https://www.facebook.com/ads/library/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Meta Ad Library
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {competitors.map((c) => (
            <CompetitorCard
              key={c.id}
              competitor={c}
              adCount={c._count.ads}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
