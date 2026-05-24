"use client"

import { useEffect, useState } from "react"
import { Building2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Topbar } from "@/components/layout/topbar"
import { CompetitorCard } from "@/components/competitors/competitor-card"
import { AddCompetitorDialog } from "@/components/competitors/add-competitor-dialog"
import type { Competitor } from "@/types"

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<(Competitor & { _count: { ads: number } })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/competitors")
      .then((r) => r.json())
      .then(setCompetitors)
      .finally(() => setLoading(false))
  }, [])

  function handleAdded(c: Competitor) {
    setCompetitors((prev) => [{ ...c, _count: { ads: 0 } }, ...prev])
  }

  function handleDeleted(id: string) {
    setCompetitors((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <Topbar
        title="Competitors"
        description={`Tracking ${competitors.length} brand${competitors.length !== 1 ? "s" : ""}.`}
        actions={<AddCompetitorDialog onAdded={handleAdded} />}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : competitors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-14 text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold mb-1.5">No competitors yet</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-5">
            Add a competitor to start tracking their ads and generating market intelligence.
          </p>
          <AddCompetitorDialog onAdded={handleAdded} />
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
