"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Layers, Chrome, ExternalLink } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { InsightStrip } from "@/components/ads/insight-strip"
import { BrandRow } from "@/components/ads/brand-row"
import { SurgeBrandCard } from "@/components/ads/surge-brand-card"
import { AdCard } from "@/components/ads/ad-card"
import type { Ad, Competitor } from "@/types"

// ── Types ─────────────────────────────────────────────────────────────────────

interface SurgeBrand {
  competitor: Competitor & { _count: { ads: number } }
  newAds: Ad[]
  newCount: number
}

interface FeedData {
  provenPerformers: Ad[]
  winning: Ad[]
  gainingTraction: Ad[]
  creativeSurge: SurgeBrand[]
  newThisWeek: Ad[]
  justWentDark: Ad[]
  brands: {
    competitor: Competitor & { _count: { ads: number } }
    ads: Ad[]
    newCount: number
  }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function FeedSkeletons() {
  return (
    <div className="space-y-8">
      {/* Insight strip skeletons */}
      {[0, 1].map((i) => (
        <div key={i}>
          <Skeleton className="h-4 w-40 mb-1 rounded-md" />
          <Skeleton className="h-3 w-64 mb-3 rounded-md" />
          <div className="flex gap-3">
            {[...Array(5)].map((_, j) => (
              <Skeleton key={j} className="w-44 h-44 rounded-xl shrink-0" />
            ))}
          </div>
        </div>
      ))}
      {/* Brand row skeletons */}
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div>
                <Skeleton className="h-3.5 w-28 mb-1 rounded" />
                <Skeleton className="h-2.5 w-44 rounded" />
              </div>
            </div>
            <div className="flex gap-3 px-4 py-3">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="w-44 h-44 rounded-xl shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border p-16 text-center max-w-md mx-auto mt-8">
      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
        <Chrome className="w-6 h-6 text-indigo-400" />
      </div>
      <h3 className="text-sm font-semibold mb-2">No creatives yet</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-6">
        Install the Signal Chrome extension, then visit any competitor&apos;s Meta Ad Library
        page. Ads are captured automatically as they load — sync them here in one click.
      </p>
      <div className="flex flex-col gap-2 items-center">
        <a
          href="https://github.com/sagesony/signal/tree/main/chrome-extension"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          <Chrome className="w-3.5 h-3.5" />
          Get the extension
        </a>
        <a
          href="https://www.facebook.com/ads/library/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Open Meta Ad Library
        </a>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function AdsPageInner() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const brandId       = searchParams.get("brand")
  const brandName     = searchParams.get("brandName") ?? "Brand"

  // ── Grouped feed state ────────────────────────────────────────────────────
  const [feed, setFeed]           = useState<FeedData | null>(null)
  const [feedLoading, setFeedLoading] = useState(true)

  // ── Single-brand grid state ───────────────────────────────────────────────
  const [brandAds, setBrandAds]         = useState<Ad[]>([])
  const [brandLoading, setBrandLoading] = useState(false)

  // Load grouped feed
  useEffect(() => {
    if (brandId) return
    setFeedLoading(true)
    fetch("/api/feed")
      .then((r) => r.json())
      .then(setFeed)
      .finally(() => setFeedLoading(false))
  }, [brandId])

  // Load single-brand ads
  useEffect(() => {
    if (!brandId) return
    setBrandLoading(true)
    fetch(`/api/ads?competitor=${brandId}&limit=100`)
      .then((r) => r.json())
      .then((data) => setBrandAds(data.ads ?? []))
      .finally(() => setBrandLoading(false))
  }, [brandId])

  // ── Single-brand view ─────────────────────────────────────────────────────
  if (brandId) {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Back */}
        <button
          onClick={() => router.push("/ads")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Creative Feed
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-semibold">{brandName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All captured creatives, sorted by run duration
          </p>
        </div>

        {brandLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
          </div>
        ) : brandAds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-14 text-center">
            <Layers className="w-5 h-5 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No ads found for this brand.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brandAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Main Creative Feed ────────────────────────────────────────────────────
  const totalAds    = feed?.brands.reduce((s, b) => s + b.competitor._count.ads, 0) ?? 0
  const totalBrands = feed?.brands.length ?? 0
  const hasInsights = feed && (
    feed.provenPerformers.length + feed.winning.length + feed.gainingTraction.length +
    feed.creativeSurge.length + feed.newThisWeek.length + feed.justWentDark.length
  ) > 0

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight">Creative Feed</h1>
        {!feedLoading && totalBrands > 0 && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalAds} ads across {totalBrands} brand{totalBrands !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {feedLoading ? (
        <FeedSkeletons />
      ) : !feed || feed.brands.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Insight sections ─────────────────────────────────────────── */}
          {hasInsights && (
            <div className="mb-10">
              <InsightStrip
                icon="🏆"
                title="Proven Performers"
                subtitle="Running 30+ days — competitors have serious conviction in these"
                ads={feed.provenPerformers}
                titleClass="text-yellow-400"
              />
              <InsightStrip
                icon="🔥"
                title="Winning Right Now"
                subtitle="Running 14+ days — still active and spending"
                ads={feed.winning}
                titleClass="text-amber-400"
              />
              <InsightStrip
                icon="🚀"
                title="Gaining Traction"
                subtitle="7–13 days old and still running — survived the first cut"
                ads={feed.gainingTraction}
                titleClass="text-indigo-400"
              />

              {/* Creative Surge — different card type */}
              {feed.creativeSurge.length > 0 && (
                <div className="mb-8">
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[15px] leading-none">⚡</span>
                      <h2 className="text-sm font-semibold text-emerald-400">Creative Surge</h2>
                    </div>
                    <p className="text-[12px] text-muted-foreground pl-6">
                      Brands in active testing mode — 3+ new ads this week
                    </p>
                  </div>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                    {feed.creativeSurge.map(({ competitor, newAds, newCount }) => (
                      <SurgeBrandCard
                        key={competitor.id}
                        competitor={competitor}
                        newAds={newAds}
                        newCount={newCount}
                      />
                    ))}
                  </div>
                </div>
              )}

              <InsightStrip
                icon="✨"
                title="Launched This Week"
                subtitle="New creatives competitors just started testing"
                ads={feed.newThisWeek}
                titleClass="text-sky-400"
              />
              <InsightStrip
                icon="💀"
                title="Just Went Dark"
                subtitle="Ads that stopped running in the last 30 days"
                ads={feed.justWentDark}
                titleClass="text-zinc-400"
              />
            </div>
          )}

          {/* ── By Brand ─────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                By Brand
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>

            {feed.brands.map(({ competitor, ads, newCount }) => (
              <BrandRow
                key={competitor.id}
                competitor={competitor}
                ads={ads}
                newCount={newCount}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Suspense wrapper required for useSearchParams() in Next.js App Router
export default function AdsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto animate-fade-in">
          <div className="mb-7">
            <div className="h-6 w-36 bg-muted rounded animate-pulse mb-1" />
            <div className="h-4 w-52 bg-muted rounded animate-pulse" />
          </div>
          <FeedSkeletons />
        </div>
      }
    >
      <AdsPageInner />
    </Suspense>
  )
}
