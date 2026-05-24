"use client"

import { Search, X, Flame } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Competitor, FilterState } from "@/types"

interface AdFiltersProps {
  competitors: Competitor[]
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export function AdFilters({ competitors, filters, onChange }: AdFiltersProps) {
  function update(key: keyof FilterState, value: string | boolean) {
    onChange({ ...filters, [key]: value })
  }

  function clearAll() {
    onChange({ competitor: "", hookType: "", angleType: "", formatType: "", offerType: "", search: "", longRunning: false })
  }

  const hasFilters = filters.search || filters.competitor || filters.hookType ||
    filters.angleType || filters.formatType || filters.offerType || filters.longRunning

  return (
    <div className="flex items-center gap-2 flex-wrap mb-5">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          placeholder="Search ads..."
          className={cn(
            "w-full h-9 pl-9 pr-3 rounded-lg text-sm",
            "bg-muted border border-border",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring",
            "transition-colors"
          )}
        />
      </div>

      {/* Long Running toggle */}
      <button
        onClick={() => update("longRunning", !filters.longRunning)}
        className={cn(
          "flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium border transition-colors",
          filters.longRunning
            ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
            : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-border/80"
        )}
      >
        <Flame className={cn("w-3.5 h-3.5", filters.longRunning ? "text-amber-400" : "")} />
        Long Running
      </button>

      {/* Competitor */}
      <div className="w-40">
        <Select value={filters.competitor || "all"} onValueChange={(v) => update("competitor", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {competitors.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hook */}
      <div className="w-36">
        <Select value={filters.hookType || "all"} onValueChange={(v) => update("hookType", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Hook" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All hooks</SelectItem>
            <SelectItem value="curiosity">Curiosity</SelectItem>
            <SelectItem value="authority">Authority</SelectItem>
            <SelectItem value="transformation">Transformation</SelectItem>
            <SelectItem value="problem">Problem</SelectItem>
            <SelectItem value="social_proof">Social Proof</SelectItem>
            <SelectItem value="emotional">Emotional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Format */}
      <div className="w-36">
        <Select value={filters.formatType || "all"} onValueChange={(v) => update("formatType", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All formats</SelectItem>
            <SelectItem value="ugc">UGC</SelectItem>
            <SelectItem value="founder_led">Founder-led</SelectItem>
            <SelectItem value="demo">Demo</SelectItem>
            <SelectItem value="testimonial">Testimonial</SelectItem>
            <SelectItem value="meme">Meme</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Offer */}
      <div className="w-36">
        <Select value={filters.offerType || "all"} onValueChange={(v) => update("offerType", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Offer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All offers</SelectItem>
            <SelectItem value="discount">Discount</SelectItem>
            <SelectItem value="bundle">Bundle</SelectItem>
            <SelectItem value="starter_pack">Starter Pack</SelectItem>
            <SelectItem value="subscription">Subscription</SelectItem>
            <SelectItem value="free_shipping">Free Shipping</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent border border-border transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  )
}
