import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id

  const userCompetitorIds = (
    await prisma.competitor.findMany({ where: { userId }, select: { id: true } })
  ).map((c) => c.id)

  const [totalCompetitors, totalAds, newInsights, savedAds, recentAds, topInsights] =
    await Promise.all([
      prisma.competitor.count({ where: { userId } }),
      prisma.ad.count({ where: { competitorId: { in: userCompetitorIds } } }),
      prisma.insight.count({ where: { isNew: true } }),
      prisma.savedAd.count({ where: { userId } }),
      prisma.ad.findMany({
        where: { competitorId: { in: userCompetitorIds } },
        include: { competitor: { select: { id: true, name: true, logo: true, industry: true } } },
        orderBy: { lastSeen: "desc" },
        take: 8,
      }),
      prisma.insight.findMany({
        orderBy: [{ isNew: "desc" }, { createdAt: "desc" }],
        take: 3,
      }),
    ])

  return NextResponse.json({
    totalCompetitors,
    totalAds,
    newInsights,
    savedAds,
    recentAds,
    topInsights: topInsights.map((i) => ({
      ...i,
      competitors: JSON.parse(i.competitors ?? "[]"),
      tags: JSON.parse(i.tags ?? "[]"),
    })),
  })
}
