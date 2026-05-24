import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const competitor = searchParams.get("competitor") ?? ""
  const hookType = searchParams.get("hookType") ?? ""
  const angleType = searchParams.get("angleType") ?? ""
  const formatType = searchParams.get("formatType") ?? ""
  const offerType = searchParams.get("offerType") ?? ""
  const search = searchParams.get("search") ?? ""
  const longRunning = searchParams.get("longRunning") === "1"
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "24")

  // Long-running = lastSeen at least 14 days after firstSeen
  const LONG_RUNNING_MS = 14 * 24 * 60 * 60 * 1000

  const userCompetitorIds = (
    await prisma.competitor.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    })
  ).map((c) => c.id)

  const where: Record<string, unknown> = {
    competitorId: { in: userCompetitorIds },
    ...(competitor ? { competitorId: competitor } : {}),
    ...(hookType ? { hookType } : {}),
    ...(angleType ? { angleType } : {}),
    ...(formatType ? { formatType } : {}),
    ...(offerType ? { offerType } : {}),
    ...(search
      ? {
          OR: [
            { headline: { contains: search } },
            { body: { contains: search } },
          ],
        }
      : {}),
    // For long-running: lastSeen must be >= firstSeen + 14 days.
    // SQLite raw comparison: lastSeen - firstSeen >= LONG_RUNNING_MS
    // We achieve this by fetching all and post-filtering, or using a raw query.
    // For simplicity with SQLite, we post-filter after fetching.
  }

  // Fetch all matching (pre-pagination) so we can post-filter on run duration
  const allAds = await prisma.ad.findMany({
    where,
    include: {
      competitor: { select: { id: true, name: true, logo: true, industry: true } },
      savedAds: { where: { userId: session.user.id }, select: { id: true } },
    },
    orderBy: { lastSeen: "desc" },
  })

  const filtered = longRunning
    ? allAds.filter((ad) => {
        const diff = new Date(ad.lastSeen).getTime() - new Date(ad.firstSeen).getTime()
        return diff >= LONG_RUNNING_MS
      })
    : allAds

  const total = filtered.length
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const result = paginated.map((ad) => ({
    ...ad,
    isSaved: ad.savedAds.length > 0,
    savedAds: undefined,
  }))

  return NextResponse.json({ ads: result, total, page, limit })
}
