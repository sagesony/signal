import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export const dynamic = "force-dynamic"

const SEVEN_DAYS_MS  = 7  * 24 * 60 * 60 * 1000
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function runDays(firstSeen: string | Date, lastSeen: string | Date) {
  return Math.max(
    0,
    Math.floor(
      (new Date(lastSeen).getTime() - new Date(firstSeen).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  )
}

export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ winning: [], newThisWeek: [], justWentDark: [], brands: [] })
  }

  const competitorIds = (
    await prisma.competitor.findMany({
      where: { userId: user.id },
      select: { id: true },
    })
  ).map((c) => c.id)

  if (competitorIds.length === 0) {
    return NextResponse.json({ winning: [], newThisWeek: [], justWentDark: [], brands: [] })
  }

  const now = Date.now()
  const sevenDaysAgo  = now - SEVEN_DAYS_MS
  const thirtyDaysAgo = now - THIRTY_DAYS_MS

  // Fetch all ads once
  const allAds = await prisma.ad.findMany({
    where: { competitorId: { in: competitorIds } },
    include: {
      competitor: { select: { id: true, name: true, logo: true, industry: true } },
    },
  })

  // ── Insight slices ────────────────────────────────────────────────────────
  const winning = allAds
    .filter((ad) => ad.isActive && runDays(ad.firstSeen, ad.lastSeen) >= 14)
    .sort((a, b) => runDays(b.firstSeen, b.lastSeen) - runDays(a.firstSeen, a.lastSeen))
    .slice(0, 8)

  const newThisWeek = allAds
    .filter((ad) => new Date(ad.firstSeen).getTime() >= sevenDaysAgo)
    .sort((a, b) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime())
    .slice(0, 8)

  const justWentDark = allAds
    .filter((ad) => !ad.isActive && new Date(ad.lastSeen).getTime() >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
    .slice(0, 8)

  // ── Per-brand rows ────────────────────────────────────────────────────────
  const competitors = await prisma.competitor.findMany({
    where: { userId: user.id },
    include: { _count: { select: { ads: true } } },
    orderBy: { updatedAt: "desc" },
  })

  // Group ads by competitor
  const adsByBrand = new Map<string, typeof allAds>()
  for (const ad of allAds) {
    if (!adsByBrand.has(ad.competitorId)) adsByBrand.set(ad.competitorId, [])
    adsByBrand.get(ad.competitorId)!.push(ad)
  }

  const brands = competitors
    .filter((c) => (adsByBrand.get(c.id)?.length ?? 0) > 0)
    .map((c) => {
      const brandAds = adsByBrand.get(c.id) ?? []
      const sorted = [...brandAds].sort(
        (a, b) => runDays(b.firstSeen, b.lastSeen) - runDays(a.firstSeen, a.lastSeen)
      )
      const newCount = brandAds.filter((ad) => new Date(ad.firstSeen).getTime() >= sevenDaysAgo).length
      return {
        competitor: c,
        ads: sorted.slice(0, 10),
        newCount,
      }
    })
    // Brands with recent activity first
    .sort((a, b) => {
      const aRecent = Math.max(...(adsByBrand.get(a.competitor.id) ?? []).map((ad) => new Date(ad.updatedAt).getTime()))
      const bRecent = Math.max(...(adsByBrand.get(b.competitor.id) ?? []).map((ad) => new Date(ad.updatedAt).getTime()))
      return bRecent - aRecent
    })

  return NextResponse.json({ winning, newThisWeek, justWentDark, brands })
}
