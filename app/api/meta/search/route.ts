import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Extract a page handle or ID from a Facebook URL or plain input.
// Returns { type, value } where type is "id" (numeric) or "handle" (slug)
function parseInput(raw: string): { type: "id" | "handle" | "term"; value: string } {
  const s = raw.trim()

  // facebook.com/ads/library/…?…view_all_page_id=123…  → numeric id (most common)
  // also advertiser_id=123 (older format)
  const advId = s.match(/(?:view_all_page_id|advertiser_id)=(\d+)/)
  if (advId) return { type: "id", value: advId[1] }

  // facebook.com/pages/SomeName/123456789  → numeric id
  const pagesNum = s.match(/facebook\.com\/pages\/[^/]+\/(\d+)/)
  if (pagesNum) return { type: "id", value: pagesNum[1] }

  // facebook.com/handle  or  fb.com/handle
  const fbHandle = s.match(/(?:facebook|fb)\.com\/([^/?#\s]+)/)
  if (fbHandle) return { type: "handle", value: fbHandle[1] }

  // Bare numeric string → treat as page ID directly
  if (/^\d{5,}$/.test(s)) return { type: "id", value: s }

  // Anything else → search term or handle slug
  return { type: "term", value: s }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""

  if (!q.trim() || q.trim().length < 2) return NextResponse.json({ results: [] })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { metaAccessToken: true },
  })

  if (!user?.metaAccessToken) {
    return NextResponse.json({ error: "no_token" }, { status: 400 })
  }

  const token = user.metaAccessToken
  const parsed = parseInput(q)

  // ── Strategy A: numeric page ID entered directly ──────────────────────────
  // User found the ID from the Ad Library URL. Verify + get name via node lookup.
  if (parsed.type === "id") {
    try {
      const url = new URL(`https://graph.facebook.com/v19.0/${parsed.value}`)
      url.searchParams.set("fields", "id,name")
      url.searchParams.set("access_token", token)
      const res = await fetch(url.toString())
      const data = await res.json()
      if (!data.error && data.id) {
        return NextResponse.json({ results: [{ pageId: data.id, name: data.name ?? `Page ${data.id}` }] })
      }
      // If lookup fails, still return the ID with a placeholder name so user can proceed
      return NextResponse.json({ results: [{ pageId: parsed.value, name: `Page ID ${parsed.value}` }] })
    } catch {
      return NextResponse.json({ results: [{ pageId: parsed.value, name: `Page ID ${parsed.value}` }] })
    }
  }

  // ── Strategy B: handle or slug lookup ─────────────────────────────────────
  const handle = parsed.type === "handle" ? parsed.value : parsed.value
  try {
    const url = new URL(`https://graph.facebook.com/v19.0/${encodeURIComponent(handle)}`)
    url.searchParams.set("fields", "id,name")
    url.searchParams.set("access_token", token)
    const res = await fetch(url.toString())
    const data = await res.json()
    if (!data.error && data.id) {
      return NextResponse.json({ results: [{ pageId: data.id, name: data.name }] })
    }
  } catch {
    // fall through to strategy C
  }

  // ── Strategy C: ads_archive text search ───────────────────────────────────
  // Requires ads_read + pages_read_engagement. May fail for unverified apps.
  try {
    const url = new URL("https://graph.facebook.com/v19.0/ads_archive")
    url.searchParams.set("search_terms", parsed.value)
    url.searchParams.set(
      "ad_reached_countries",
      JSON.stringify(["IN", "US", "GB", "AU", "CA", "SG", "AE"])
    )
    url.searchParams.set("ad_type", "ALL")
    url.searchParams.set("fields", "page_id,page_name")
    url.searchParams.set("limit", "200")
    url.searchParams.set("access_token", token)

    const res = await fetch(url.toString())
    const data = await res.json()

    if (!data.error) {
      const seen = new Set<string>()
      const results: { pageId: string; name: string }[] = []
      for (const ad of data.data ?? []) {
        if (ad.page_id && !seen.has(ad.page_id)) {
          seen.add(ad.page_id)
          results.push({ pageId: ad.page_id, name: ad.page_name })
        }
      }
      return NextResponse.json({ results: results.slice(0, 10) })
    }

    // Surface a helpful error based on the Meta error code
    const code = data.error?.code
    const msg =
      code === 10 || code === 200
        ? "Token missing pages_read_engagement permission — regenerate with both ads_read and pages_read_engagement"
        : (data.error?.message ?? "Meta API error")
    return NextResponse.json({ error: msg }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Could not reach Meta API" }, { status: 500 })
  }
}
