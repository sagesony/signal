"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Plus, Loader2, Search, Sparkles, PenLine, AlertCircle, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import type { Competitor } from "@/types"

interface AddCompetitorDialogProps {
  onAdded: (competitor: Competitor) => void
}

type Mode = "meta" | "manual"
type MetaResult = { pageId: string; name: string }

export function AddCompetitorDialog({ onAdded }: AddCompetitorDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("meta")
  const [loading, setLoading] = useState(false)
  const [hasMetaToken, setHasMetaToken] = useState<boolean | null>(null)

  // Meta search state
  const [metaQuery, setMetaQuery] = useState("")
  const [metaResults, setMetaResults] = useState<MetaResult[]>([])
  const [metaSearching, setMetaSearching] = useState(false)
  const [metaSelected, setMetaSelected] = useState<MetaResult | null>(null)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false) // true once a search has completed
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Form state
  const [form, setForm] = useState({ name: "", website: "", industry: "" })

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    if (open) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((d) => setHasMetaToken(d.hasMetaToken))
    }
  }, [open])

  const searchMeta = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setMetaResults([])
      setMetaError(null)
      setSearched(false)
      return
    }
    setMetaSearching(true)
    setMetaError(null)
    setSearched(false)
    try {
      const res = await fetch(`/api/meta/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) {
        setMetaError(data.error === "no_token" ? "no_token" : (data.error ?? "Search failed"))
        setMetaResults([])
      } else {
        setMetaResults(data.results ?? [])
        setMetaError(null)
      }
    } catch {
      setMetaError("Could not reach Meta — check connection")
      setMetaResults([])
    } finally {
      setMetaSearching(false)
      setSearched(true)
    }
  }, [])

  useEffect(() => {
    if (mode !== "meta" || metaSelected) return
    const timer = setTimeout(() => searchMeta(metaQuery), 450)
    return () => clearTimeout(timer)
  }, [metaQuery, mode, metaSelected, searchMeta])

  function selectBrand(r: MetaResult) {
    setMetaSelected(r)
    setMetaQuery(r.name)
    setMetaResults([])
    setSearched(false)
    setForm((prev) => ({ ...prev, name: r.name }))
  }

  function clearSelection() {
    setMetaSelected(null)
    setMetaQuery("")
    setMetaResults([])
    setMetaError(null)
    setSearched(false)
    setForm((prev) => ({ ...prev, name: "" }))
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const name = metaSelected?.name ?? form.name
    if (!name.trim()) return

    setLoading(true)
    try {
      const body: Record<string, string> = {
        name: name.trim(),
        website: form.website,
        industry: form.industry,
        ...(metaSelected ? { metaPageId: metaSelected.pageId } : {}),
      }

      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to add")
      }

      const competitor = await res.json()
      onAdded(competitor)

      if (body.metaPageId) {
        toast({ title: `${name} added — syncing ads...` })
        fetch(`/api/competitors/${competitor.id}/sync`, { method: "POST" })
          .then((r) => r.json())
          .then((d) => {
            if (d.imported > 0)
              toast({ title: `Synced ${d.imported} ads from Meta`, description: name })
          })
          .catch(() => {})
      } else {
        toast({ title: "Competitor added" })
      }

      handleClose()
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setTimeout(() => {
      setMode("meta")
      setMetaQuery("")
      setMetaResults([])
      setMetaSelected(null)
      setMetaError(null)
      setSearched(false)
      setForm({ name: "", website: "", industry: "" })
    }, 200)
  }

  const inputCls = cn(
    "w-full h-9 px-3 rounded-lg text-sm bg-muted border border-border",
    "placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors"
  )

  const showResults = mode === "meta" && !metaSelected && metaQuery.length >= 2 && !metaSearching && searched
  const canSubmit = mode === "meta" ? !!metaSelected : !!form.name.trim()

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Add Competitor
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Competitor</DialogTitle>
            <DialogDescription>Track their ads and get AI-powered insights.</DialogDescription>
          </DialogHeader>

          {/* Mode tabs */}
          <div className="px-6 pt-1">
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              {(["meta", "manual"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-medium transition-colors",
                    mode === m
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "meta"
                    ? <><Sparkles className="w-3 h-3" /> Search Meta</>
                    : <><PenLine className="w-3 h-3" /> Manual</>
                  }
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 space-y-3">

            {/* ── META MODE ── */}
            {mode === "meta" && (
              <>
                {/* No token warning */}
                {hasMetaToken === false && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/8 p-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Connect your Meta token in{" "}
                      <a href="/settings" className="text-indigo-400 underline">Settings</a>{" "}
                      to search live brands.
                    </p>
                  </div>
                )}

                {/* Search input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Brand name, Facebook URL, or page ID
                  </label>

                  {metaSelected ? (
                    /* Selected state */
                    <div className="flex items-center h-9 px-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-sm flex-1 truncate">{metaSelected.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">ID {metaSelected.pageId}</span>
                      <button type="button" onClick={clearSelection} className="text-muted-foreground hover:text-foreground ml-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* Search input + dropdown */
                    <div className="relative" ref={dropdownRef}>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <input
                        ref={searchRef}
                        type="text"
                        value={metaQuery}
                        onChange={(e) => { setMetaQuery(e.target.value); setSearched(false) }}
                        placeholder={
                          hasMetaToken === false
                            ? "Connect Meta first…"
                            : "Try 'Mamaearth' or facebook.com/mamaearth"
                        }
                        disabled={hasMetaToken === false}
                        className={cn(inputCls, "pl-9", metaSearching && "pr-9")}
                      />
                      {metaSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
                      )}

                      {/* Results dropdown */}
                      {showResults && metaResults.length > 0 && (
                        <div className="absolute top-10 left-0 right-0 z-50 rounded-lg border border-border bg-card shadow-xl py-1 max-h-52 overflow-y-auto">
                          {metaResults.map((r) => (
                            <button
                              key={r.pageId}
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); selectBrand(r) }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                            >
                              <div className="w-6 h-6 rounded bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-indigo-400">{r.name[0]?.toUpperCase()}</span>
                              </div>
                              <span className="flex-1 truncate">{r.name}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">{r.pageId}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* No results */}
                      {showResults && metaResults.length === 0 && !metaError && (
                        <div className="absolute top-10 left-0 right-0 z-50 rounded-lg border border-border bg-card shadow-xl p-3">
                          <p className="text-xs text-muted-foreground">
                            No pages found for &quot;{metaQuery}&quot;.
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Try pasting the full Ad Library URL, or copy the{" "}
                            <span className="font-mono text-foreground/60">view_all_page_id</span>{" "}
                            number from it (e.g. <span className="font-mono text-foreground/60">619181354927737</span>)
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* API error */}
                  {metaError && metaError !== "no_token" && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/8 p-2.5 space-y-1">
                      <p className="text-[11px] text-red-400 flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                        {metaError}
                      </p>
                      <p className="text-[11px] text-muted-foreground pl-4">
                        <strong className="text-foreground/70">Workaround:</strong> search the brand on{" "}
                        <a href="https://www.facebook.com/ads/library/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">
                          Meta Ad Library
                        </a>
                        , click their page, then copy the <code className="bg-muted px-0.5 rounded">view_all_page_id</code> number from the URL and paste it here.
                      </p>
                    </div>
                  )}

                  {metaSelected && (
                    <p className="text-[11px] text-emerald-400">
                      ✓ Ads will sync automatically from Meta Ad Library.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ── MANUAL MODE ── */}
            {mode === "manual" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Minimalist"
                  required
                  className={inputCls}
                />
              </div>
            )}

            {/* Shared fields */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Website
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://example.com"
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Industry
              </label>
              <select
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
                className={inputCls}
              >
                <option value="">Select industry</option>
                <option value="skincare">Skincare</option>
                <option value="wellness">Wellness</option>
                <option value="fitness">Fitness</option>
                <option value="fashion">Fashion</option>
                <option value="supplements">Supplements</option>
                <option value="food_beverage">Food & Beverage</option>
                <option value="other">Other</option>
              </select>
            </div>
          </form>

          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button onClick={() => handleSubmit()} disabled={loading || !canSubmit}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Competitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
