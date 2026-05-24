"use client"

import { useEffect, useState, useCallback } from "react"
import { Layers } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Topbar } from "@/components/layout/topbar"
import { AdCard } from "@/components/ads/ad-card"
import { AdFilters } from "@/components/ads/ad-filters"
import type { Ad, Competitor, FilterState } from "@/types"

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [total, setTotal] = useState(0)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    competitor: "",
    hookType: "",
    angleType: "",
    formatType: "",
    offerType: "",
    search: "",
    longRunning: false,
  })

  useEffect(() => {
    fetch("/api/competitors")
      .then((r) => r.json())
      .then(setCompetitors)
  }, [])

  const fetchAds = useCallback(async (f: FilterState) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (f.competitor) params.set("competitor", f.competitor)
    if (f.hookType) params.set("hookType", f.hookType)
    if (f.angleType) params.set("angleType", f.angleType)
    if (f.formatType) params.set("formatType", f.formatType)
    if (f.offerType) params.set("offerType", f.offerType)
    if (f.search) params.set("search", f.search)
    if (f.longRunning) params.set("longRunning", "1")
    params.set("limit", "24")

    const res = await fetch(`/api/ads?${params}`)
    const data = await res.json()
    setAds(data.ads ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchAds(filters), 300)
    return () => clearTimeout(timer)
  }, [filters, fetchAds])

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <Topbar
        title="Ads Feed"
        description={`${total} ads across ${competitors.length} competitor${competitors.length !== 1 ? "s" : ""}.`}
      />

      <AdFilters competitors={competitors} filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-14 text-center">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-5 h-5 text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold mb-1.5">No ads found</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Try adjusting your filters or add more competitors to see their ads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </div>
  )
}
