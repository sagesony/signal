"use client"

import { useState } from "react"
import Image from "next/image"
import { ExternalLink, Trash2, Layers, MoreHorizontal, RefreshCw, AlertCircle, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate, INDUSTRY_LABELS } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import type { Competitor } from "@/types"

interface CompetitorCardProps {
  competitor: Competitor
  adCount: number
  onDeleted: (id: string) => void
  onSynced?: (id: string, newCount: number) => void
}

type SyncError = "app_permission" | "bad_token" | "doc_id_stale" | "needs_proxy" | "scrape_failed" | string | null

export function CompetitorCard({ competitor, adCount, onDeleted, onSynced }: CompetitorCardProps) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [localAdCount, setLocalAdCount] = useState(adCount)
  const [syncError, setSyncError] = useState<SyncError>(null)

  async function handleSync() {
    setMenuOpen(false)
    setSyncing(true)
    setSyncError(null)
    try {
      const res = await fetch(`/api/competitors/${competitor.id}/sync`, { method: "POST" })
      const data = await res.json()

      if (!res.ok || data.error) {
        setSyncError(data.error ?? "scrape_failed")
        return
      }

      const newCount = localAdCount + (data.imported ?? 0)
      setLocalAdCount(newCount)
      onSynced?.(competitor.id, newCount)

      if (data.imported === 0 && data.updated === 0) {
        toast({ title: "Already up to date", description: `No new ads for ${competitor.name}.` })
      } else {
        toast({
          title: `Synced ${data.imported} new ad${data.imported !== 1 ? "s" : ""}`,
          description: data.updated > 0 ? `${data.updated} updated` : "from Meta Ad Library",
        })
      }
    } catch {
      setSyncError("unknown")
    } finally {
      setSyncing(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/competitors/${competitor.id}`, { method: "DELETE" })
      if (res.ok) {
        onDeleted(competitor.id)
        toast({ title: "Competitor removed" })
      }
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" })
    } finally {
      setDeleting(false)
      setMenuOpen(false)
    }
  }

  const initials = competitor.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="rounded-xl border border-border bg-card p-5 card-hover group relative flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted shrink-0 flex items-center justify-center">
            {competitor.logo ? (
              <Image src={competitor.logo} alt={competitor.name} width={40} height={40} className="object-cover w-full h-full" />
            ) : (
              <span className="text-xs font-bold text-muted-foreground">{initials}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{competitor.name}</p>
            {competitor.website && (
              <a href={competitor.website} target="_blank" rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-indigo-400 transition-colors flex items-center gap-1">
                {competitor.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-44 rounded-lg border border-border bg-card shadow-xl py-1">
                {competitor.metaPageId && (
                  <button onClick={handleSync} disabled={syncing}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors w-full">
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                    Sync from Meta
                  </button>
                )}
                {competitor.metaAdUrl && (
                  <a href={competitor.metaAdUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                    onClick={() => setMenuOpen(false)}>
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Meta Ads
                  </a>
                )}
                <button onClick={handleDelete} disabled={deleting}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors w-full">
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sync error — persistent inline, not a toast */}
      {syncError && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/8 p-3 text-xs space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-300 font-medium">
                {syncError === "app_permission" && "Meta app needs Ad Library access"}
                {syncError === "bad_token" && "Access token is invalid or expired"}
                {syncError !== "app_permission" && syncError !== "bad_token" && "Sync failed"}
              </p>
            </div>
            <button onClick={() => setSyncError(null)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>

          {syncError === "app_permission" && (
            <p className="text-muted-foreground pl-5">
              Your Meta app needs the <strong className="text-foreground/70">Ads Library</strong> use case approved.{" "}
              <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer"
                className="text-indigo-400 hover:underline">
                Open your app
              </a>{" "}
              → App Review → Permissions &amp; Features → request <code className="bg-muted px-0.5 rounded">ads_read</code>.
              Or{" "}
              <a href="https://www.facebook.com/ads/library/api/" target="_blank" rel="noopener noreferrer"
                className="text-indigo-400 hover:underline">
                apply for Ad Library API access
              </a>.
            </p>
          )}

          {syncError === "bad_token" && (
            <p className="text-muted-foreground pl-5">
              Regenerate your token in{" "}
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer"
                className="text-indigo-400 hover:underline">
                Graph API Explorer
              </a>{" "}
              with <code className="bg-muted px-0.5 rounded">ads_read</code> +{" "}
              <code className="bg-muted px-0.5 rounded">pages_read_engagement</code>, then update it in{" "}
              <a href="/settings" className="text-indigo-400 hover:underline">Settings</a>.
            </p>
          )}

          {syncError === "doc_id_stale" && (
            <p className="text-muted-foreground pl-5">
              Meta updated their frontend. The scraper needs a new <code className="bg-muted px-0.5 rounded">doc_id</code>.
              Open the Ad Library in Chrome DevTools → Network → filter &quot;graphql&quot; →
              find <code className="bg-muted px-0.5 rounded">AdLibraryPagedAdDisplayQuery</code> → copy the new doc_id and
              set <code className="bg-muted px-0.5 rounded">META_ALLIB_DOC_ID</code> in Vercel env vars.
            </p>
          )}

          {syncError === "needs_proxy" && (
            <div className="pl-5 space-y-1.5">
              <p className="text-muted-foreground">
                Meta blocks Vercel&apos;s datacenter IPs. Route through a residential proxy in 2 min:
              </p>
              <ol className="text-muted-foreground space-y-1 list-decimal list-inside text-[11px]">
                <li>Sign up free at <a href="https://www.scrapingbee.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">scrapingbee.com</a> (1000 credits/month free)</li>
                <li>Copy your API key from the dashboard</li>
                <li>In Vercel → your project → Settings → Environment Variables, add <code className="bg-muted px-0.5 rounded">SCRAPINGBEE_KEY</code> = your key</li>
                <li>Redeploy (Vercel → Deployments → Redeploy)</li>
              </ol>
            </div>
          )}

          {syncError === "scrape_failed" && (
            <p className="text-muted-foreground pl-5">
              Could not reach Meta Ad Library. This sometimes resolves on retry — try again in a minute.
            </p>
          )}

          {syncError !== "app_permission" && syncError !== "bad_token" && syncError !== "doc_id_stale" && syncError !== "scrape_failed" && syncError !== "needs_proxy" && (
            <p className="text-muted-foreground pl-5">
              Unexpected error. Try again or check Vercel logs for details.
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 flex-wrap">
        {competitor.industry && (
          <Badge variant="outline" className="text-[11px]">
            {INDUSTRY_LABELS[competitor.industry] ?? competitor.industry}
          </Badge>
        )}
        {competitor.metaPageId && (
          <Badge variant="outline" className="text-[11px] border-blue-500/30 text-blue-400 bg-blue-500/8">
            Meta
          </Badge>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Layers className="w-3 h-3" />
          <span>{localAdCount} ads</span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground -mt-1">
        Added {formatDate(competitor.createdAt)}
      </p>

      {/* Sync overlay */}
      {syncing && (
        <div className="absolute inset-0 rounded-xl bg-background/60 flex items-center justify-center backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Syncing ads…
          </div>
        </div>
      )}
    </div>
  )
}
