import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const LONG_RUNNING_DAYS = 14

export function getRunDays(firstSeen: string | Date, lastSeen: string | Date): number {
  const first = new Date(firstSeen).getTime()
  const last = new Date(lastSeen).getTime()
  return Math.max(0, Math.floor((last - first) / (1000 * 60 * 60 * 24)))
}

export function isLongRunning(firstSeen: string | Date, lastSeen: string | Date): boolean {
  return getRunDays(firstSeen, lastSeen) >= LONG_RUNNING_DAYS
}

export function formatDate(date: string | Date) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

export function formatRelative(date: string | Date) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

export const HOOK_LABELS: Record<string, string> = {
  curiosity: "Curiosity",
  authority: "Authority",
  transformation: "Transformation",
  problem: "Problem",
  social_proof: "Social Proof",
  emotional: "Emotional",
  none: "—",
}

export const ANGLE_LABELS: Record<string, string> = {
  premium: "Premium",
  affordability: "Affordability",
  science_backed: "Science-backed",
  emotional: "Emotional",
  convenience: "Convenience",
  none: "—",
}

export const FORMAT_LABELS: Record<string, string> = {
  ugc: "UGC",
  founder_led: "Founder-led",
  demo: "Demo",
  testimonial: "Testimonial",
  meme: "Meme",
  none: "—",
}

export const OFFER_LABELS: Record<string, string> = {
  discount: "Discount",
  bundle: "Bundle",
  starter_pack: "Starter Pack",
  subscription: "Subscription",
  free_shipping: "Free Shipping",
  none: "None",
}

export const INDUSTRY_LABELS: Record<string, string> = {
  skincare: "Skincare",
  wellness: "Wellness",
  fitness: "Fitness",
  fashion: "Fashion",
  supplements: "Supplements",
}

export const HOOK_COLORS: Record<string, string> = {
  curiosity: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  authority: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  transformation: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  problem: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  social_proof: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  emotional: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  none: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
}

export const FORMAT_COLORS: Record<string, string> = {
  ugc: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  founder_led: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  demo: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  testimonial: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  meme: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  none: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
}

export const CATEGORY_COLORS: Record<string, string> = {
  trend: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  pattern: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  opportunity: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-rose-500/10 text-rose-400 border-rose-500/20",
}
