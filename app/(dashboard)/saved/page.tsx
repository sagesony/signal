"use client"

import { useEffect, useState } from "react"
import { Bookmark } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Topbar } from "@/components/layout/topbar"
import { SavedAdCard } from "@/components/saved/saved-ad-card"
import type { SavedAd } from "@/types"

export default function SavedPage() {
  const [savedAds, setSavedAds] = useState<SavedAd[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/saved")
      .then((r) => r.json())
      .then(setSavedAds)
      .finally(() => setLoading(false))
  }, [])

  function handleRemoved(savedAdId: string) {
    setSavedAds((prev) => prev.filter((s) => s.id !== savedAdId))
  }

  function handleUpdated(savedAdId: string, notes: string, tags: string) {
    setSavedAds((prev) =>
      prev.map((s) => (s.id === savedAdId ? { ...s, notes, tags } : s))
    )
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <Topbar
        title="Saved Ads"
        description={`${savedAds.length} saved ad${savedAds.length !== 1 ? "s" : ""}.`}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : savedAds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-14 text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold mb-1.5">No saved ads yet</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">
            Bookmark ads from the feed to build your swipe file. Add notes and tags to organise inspiration.
          </p>
          <a
            href="/ads"
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Browse Ads Feed
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedAds.map((savedAd) => (
            <SavedAdCard
              key={savedAd.id}
              savedAd={savedAd}
              onRemoved={handleRemoved}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}
    </div>
  )
}
