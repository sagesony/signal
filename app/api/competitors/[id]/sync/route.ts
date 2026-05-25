import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { scrapeMetaAds } from "@/lib/meta-scraper"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const competitor = await prisma.competitor.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!competitor) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!competitor.metaPageId)
    return NextResponse.json({ error: "No Meta Page ID linked to this competitor" }, { status: 400 })

  try {
    const ads = await scrapeMetaAds(competitor.metaPageId)

    if (ads.length === 0) {
      return NextResponse.json({ imported: 0, updated: 0, total: 0, message: "No ads found for this page" })
    }

    let imported = 0
    let updated = 0

    for (const ad of ads) {
      const existing = await prisma.ad.findFirst({
        where: { competitorId: competitor.id, externalId: ad.externalId },
      })

      if (existing) {
        await prisma.ad.update({
          where: { id: existing.id },
          data: {
            headline: ad.headline,
            body: ad.body,
            lastSeen: ad.lastSeen,
            isActive: ad.isActive,
          },
        })
        updated++
      } else {
        await prisma.ad.create({
          data: {
            competitorId: competitor.id,
            externalId: ad.externalId,
            headline: ad.headline,
            body: ad.body,
            landingUrl: ad.snapshotUrl,
            platform: "meta",
            isActive: ad.isActive,
            firstSeen: ad.firstSeen,
            lastSeen: ad.lastSeen,
          },
        })
        imported++
      }
    }

    return NextResponse.json({ imported, updated, total: ads.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sync failed"
    const isDocId = msg.startsWith("doc_id_stale")
    // "needs_proxy" = no proxy key is set (SCRAPINGBEE_KEY missing)
    const noKey = !process.env.SCRAPINGBEE_KEY
    const needsProxy =
      noKey ||
      msg.includes("SCRAPINGBEE") ||
      msg.includes("SCRAPERAPI_KEY") ||
      msg.includes("blocked") ||
      msg.includes("HTTP 4") ||
      msg.includes("login page") ||
      msg.includes("proxy IP") ||
      msg.includes("datacenter")
    return NextResponse.json(
      {
        error: isDocId ? "doc_id_stale" : needsProxy ? "needs_proxy" : "scrape_failed",
        message: msg,
      },
      { status: 500 }
    )
  }
}
