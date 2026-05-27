import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export async function GET(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ ads: [], total: 0, page: 1, limit: 24 })

  const { searchParams } = new URL(req.url)
  const competitor  = searchParams.get("competitor") ?? ""
  const hookType    = searchParams.get("hookType")   ?? ""
  const formatType  = searchParams.get("formatType") ?? ""
  const search      = searchParams.get("search")     ?? ""
  const longRunning = searchParams.get("longRunning") === "1"
  const page        = parseInt(searchParams.get("page")  ?? "1")
  const limit       = parseInt(searchParams.get("limit") ?? "24")

  const LONG_RUNNING_MS = 14 * 24 * 60 * 60 * 1000

  const userCompetitorIds = (
    await prisma.competitor.findMany({
      where: { userId: user.id },
      select: { id: true },
    })
  ).map((c) => c.id)

  const where: Record<string, unknown> = {
    competitorId: { in: userCompetitorIds },
    ...(competitor ? { competitorId: competitor } : {}),
    ...(hookType   ? { hookType }   : {}),
    ...(formatType ? { formatType } : {}),
    ...(search
      ? { OR: [{ headline: { contains: search } }, { body: { contains: search } }] }
      : {}),
  }

  const allAds = await prisma.ad.findMany({
    where,
    include: {
      competitor: { select: { id: true, name: true, logo: true, industry: true } },
      savedAds: { where: { userId: user.id }, select: { id: true } },
    },
    orderBy: [{ isActive: "desc" }, { lastSeen: "desc" }],
  })

  const filtered = longRunning
    ? allAds.filter((ad) => {
        const diff = new Date(ad.lastSeen).getTime() - new Date(ad.firstSeen).getTime()
        return diff >= LONG_RUNNING_MS
      })
    : allAds

  const total     = filtered.length
  const paginated = filtered.slice((page - 1) * limit, page * limit)
  const result    = paginated.map((ad) => ({
    ...ad,
    isSaved: ad.savedAds.length > 0,
    savedAds: undefined,
  }))

  return NextResponse.json({ ads: result, total, page, limit })
}

export async function DELETE(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const competitorId = searchParams.get("competitorId")

  const userCompetitorIds = (
    await prisma.competitor.findMany({
      where: { userId: user.id },
      select: { id: true },
    })
  ).map((c) => c.id)

  const { count } = await prisma.ad.deleteMany({
    where: competitorId
      ? { competitorId }
      : { competitorId: { in: userCompetitorIds } },
  })

  return NextResponse.json({ deleted: count })
}
