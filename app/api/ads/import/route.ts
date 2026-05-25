import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-signal-key, Authorization",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: Request) {
  // Auth via extension key
  const key =
    req.headers.get("x-signal-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!key) return NextResponse.json({ error: "Missing API key" }, { status: 401, headers: corsHeaders })

  const user = await prisma.user.findUnique({ where: { extensionKey: key } })
  if (!user) return NextResponse.json({ error: "Invalid API key" }, { status: 401, headers: corsHeaders })

  let body: { pageId?: string; ads?: unknown[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders })
  }

  const { pageId, ads } = body
  if (!pageId || !Array.isArray(ads) || ads.length === 0) {
    return NextResponse.json({ error: "pageId and non-empty ads array required" }, { status: 400, headers: corsHeaders })
  }

  const competitor = await prisma.competitor.findFirst({
    where: { userId: user.id, metaPageId: pageId },
  })
  if (!competitor) {
    return NextResponse.json(
      { error: `No competitor found with Meta page ID ${pageId}. Add this competitor to Signal first.` },
      { status: 404, headers: corsHeaders },
    )
  }

  let imported = 0
  let updated = 0

  for (const raw of ads) {
    const ad = raw as Record<string, unknown>
    const externalId = ad.externalId ? String(ad.externalId) : null
    if (!externalId) continue

    const parseTs = (v: unknown): Date => {
      if (!v) return new Date()
      const n = Number(v)
      if (isNaN(n)) return new Date()
      return new Date(n < 1e10 ? n * 1000 : n)
    }

    const existing = await prisma.ad.findFirst({
      where: { competitorId: competitor.id, externalId },
    })

    if (existing) {
      await prisma.ad.update({
        where: { id: existing.id },
        data: {
          headline: String(ad.headline || "Untitled Ad"),
          body: ad.body ? String(ad.body) : null,
          lastSeen: parseTs(ad.lastSeen),
          isActive: Boolean(ad.isActive),
        },
      })
      updated++
    } else {
      await prisma.ad.create({
        data: {
          competitorId: competitor.id,
          externalId,
          headline: String(ad.headline || "Untitled Ad"),
          body: ad.body ? String(ad.body) : null,
          landingUrl: ad.snapshotUrl ? String(ad.snapshotUrl) : null,
          platform: "meta",
          isActive: Boolean(ad.isActive),
          firstSeen: parseTs(ad.firstSeen),
          lastSeen: parseTs(ad.lastSeen),
        },
      })
      imported++
    }
  }

  return NextResponse.json({ imported, updated, total: ads.length, competitor: competitor.name }, { headers: corsHeaders })
}
