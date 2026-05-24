"use client"

import { useState } from "react"
import Image from "next/image"
import { ExternalLink, Trash2, Layers, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate, INDUSTRY_LABELS } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import type { Competitor } from "@/types"

interface CompetitorCardProps {
  competitor: Competitor
  adCount: number
  onDeleted: (id: string) => void
}

export function CompetitorCard({ competitor, adCount, onDeleted }: CompetitorCardProps) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/competitors/${competitor.id}`, { method: "DELETE" })
      if (res.ok) {
        onDeleted(competitor.id)
        toast({ title: "Competitor removed", variant: "default" })
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
    <div className="rounded-xl border border-border bg-card p-5 card-hover group relative">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted shrink-0 flex items-center justify-center">
            {competitor.logo ? (
              <Image
                src={competitor.logo}
                alt={competitor.name}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-xs font-bold text-muted-foreground">{initials}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{competitor.name}</p>
            {competitor.website && (
              <a
                href={competitor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                {competitor.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-border bg-card shadow-xl py-1">
                {competitor.metaAdUrl && (
                  <a
                    href={competitor.metaAdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Meta Ads
                  </a>
                )}
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors w-full"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {competitor.industry && (
          <Badge variant="outline" className="text-[11px]">
            {INDUSTRY_LABELS[competitor.industry] ?? competitor.industry}
          </Badge>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Layers className="w-3 h-3" />
          <span>{adCount} ads</span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mt-3">
        Added {formatDate(competitor.createdAt)}
      </p>
    </div>
  )
}
