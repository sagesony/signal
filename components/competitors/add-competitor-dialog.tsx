"use client"

import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
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

export function AddCompetitorDialog({ onAdded }: AddCompetitorDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", website: "", metaAdUrl: "", industry: "" })

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to add")
      }
      const competitor = await res.json()
      onAdded(competitor)
      toast({ title: "Competitor added", variant: "default" })
      setOpen(false)
      setForm({ name: "", website: "", metaAdUrl: "", industry: "" })
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const inputCls = cn(
    "w-full h-9 px-3 rounded-lg text-sm",
    "bg-muted border border-border",
    "placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring",
    "transition-colors"
  )

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Add Competitor
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Competitor</DialogTitle>
            <DialogDescription>Track their ads and get AI-powered insights.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="px-6 space-y-3">
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
                Meta Ad Library URL
              </label>
              <input
                type="url"
                value={form.metaAdUrl}
                onChange={(e) => update("metaAdUrl", e.target.value)}
                placeholder="https://www.facebook.com/ads/library/..."
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
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !form.name.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Competitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
