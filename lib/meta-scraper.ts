/**
 * Scrapes the Meta Ad Library by replicating the same GraphQL calls
 * the facebook.com/ads/library frontend makes.
 *
 * WHY A PROXY IS REQUIRED
 * Meta blocks requests from cloud-provider IPs (Vercel/AWS/GCP etc.).
 * Set SCRAPINGBEE_KEY (free tier at scrapingbee.com — 1000 credits/month)
 * to route requests through residential IPs.
 *
 * NOTE: ScraperAPI (SCRAPERAPI_KEY) does NOT work — they block facebook.com.
 *
 * DOC_ID MAINTENANCE
 * The doc_id ties to a specific Meta JS build. When it goes stale,
 * open the Ad Library in Chrome DevTools → Network → filter "graphql"
 * → find "AdLibraryPagedAdDisplayQuery" → copy the doc_id value →
 * set META_ALLIB_DOC_ID env var in Vercel.
 */

const DOC_ID = process.env.META_ALLIB_DOC_ID ?? "7682011235263407"

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

export interface MetaAd {
  externalId: string
  headline: string
  body: string | null
  snapshotUrl: string | null
  firstSeen: Date
  lastSeen: Date
  isActive: boolean
}

// ── Proxy-aware fetch ────────────────────────────────────────────────────────
// Uses ScrapingBee (scrapingbee.com) which supports residential IPs + Facebook.
// Both the GET (LSD token) and POST (GraphQL) use the same session_id so Meta
// sees both requests from the same residential IP (required for CSRF to work).

function proxyFetch(
  url: string,
  options?: RequestInit,
  sessionId?: string,
): Promise<Response> {
  const key = process.env.SCRAPINGBEE_KEY
  if (!key) {
    // Direct — works locally from a residential IP, blocked on Vercel
    return fetch(url, options)
  }

  const isPost = options?.method?.toUpperCase() === "POST"
  const BASE = "https://app.scrapingbee.com/api/v1/"

  if (isPost) {
    const params = new URLSearchParams({
      api_key: key,
      url,
      render_js: "false",
      premium_proxy: "true",
    })
    if (sessionId) params.set("session_id", sessionId)
    if (options?.body) params.set("post_data", String(options.body))
    return fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })
  }

  const params = new URLSearchParams({
    api_key: key,
    url,
    render_js: "false",
    premium_proxy: "true",
  })
  if (sessionId) params.set("session_id", sessionId)
  return fetch(`${BASE}?${params}`)
}

// ── Step 1: get LSD session token ─────────────────────────────────────────────

async function getLSDToken(pageId: string, sessionId?: string): Promise<string> {
  const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=${pageId}&search_type=page`

  let res: Response
  try {
    res = await proxyFetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    }, sessionId)
  } catch (e) {
    throw new Error(`Network error fetching Ad Library page: ${(e as Error).message}`)
  }

  if (!res.ok) {
    throw new Error(`Ad Library page returned HTTP ${res.status}. ${!process.env.SCRAPERAPI_KEY ? "Vercel IPs are blocked by Meta — add SCRAPERAPI_KEY." : "Check proxy config."}`)
  }

  const html = await res.text()

  // Detect login wall
  if (html.includes("login_form") || html.includes('"loginURL"') || html.length < 5000) {
    throw new Error("Meta returned a login page — proxy IP may be flagged. Try a different proxy.")
  }

  // Extract LSD token (several possible formats Meta uses)
  const patterns = [
    /"LSD",\[\],\{"token":"([^"]+)"\}/,
    /"LSD",\[\],\{[^}]*"token":"([^"]+)"/,
    /\["LSD"\s*,\s*\[\s*\]\s*,\s*\{\s*"token"\s*:\s*"([^"]+)"/,
    /"token":"([a-zA-Z0-9_-]{8,30})"/,
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m) return m[1]
  }

  // If we got HTML but no token, Meta changed the format
  const snippet = html.slice(0, 300).replace(/\s+/g, " ")
  throw new Error(`LSD token not found in response. Page snippet: "${snippet}"`)
}

// ── Parsing helpers ───────────────────────────────────────────────────────────

function pick(obj: Record<string, unknown>, ...paths: string[][]): string {
  for (const path of paths) {
    let cur: unknown = obj
    for (const key of path) {
      if (cur == null || typeof cur !== "object") { cur = undefined; break }
      cur = (cur as Record<string, unknown>)[key]
    }
    if (typeof cur === "string" && cur.trim()) return cur.trim()
    if (typeof cur === "number") return String(cur)
  }
  return ""
}

function parseTs(v: unknown): Date | null {
  if (!v) return null
  const n = Number(v)
  if (isNaN(n)) return null
  return new Date(n < 1e10 ? n * 1000 : n)
}

function extractAds(raw: unknown): MetaAd[] {
  const results: MetaAd[] = []

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return
    if (Array.isArray(node)) { node.forEach(walk); return }

    const n = node as Record<string, unknown>
    const archiveId = n["adArchiveID"] ?? n["ad_archive_id"] ?? n["archiveID"]

    if (archiveId) {
      const snap = (n["snapshot"] ?? {}) as Record<string, unknown>
      const bodyObj = snap["body"] as Record<string, unknown> | null

      const headline =
        pick(snap, ["title"], ["link_title"], ["link_description"]) ||
        pick(n, ["page_name"]) ||
        "Untitled Ad"

      const body =
        ((bodyObj?.["markup"] as Record<string, unknown>)?.["__html"] as string) ??
        (bodyObj?.["text"] as string) ??
        (snap["body_text"] as string) ??
        pick(snap, ["message"]) ??
        null

      results.push({
        externalId: String(archiveId),
        headline,
        body: body || null,
        snapshotUrl: (n["snapshot_url"] as string) ?? (snap["snapshot_url"] as string) ?? null,
        firstSeen: parseTs(n["startDate"] ?? n["start_date"]) ?? new Date(),
        lastSeen: parseTs(n["endDate"] ?? n["end_date"]) ?? new Date(),
        isActive: !(n["endDate"] ?? n["end_date"]),
      })
      return
    }

    Object.values(n).forEach(walk)
  }

  walk(raw)
  return results
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function scrapeMetaAds(pageId: string): Promise<MetaAd[]> {
  // Use a sticky session ID so both the LSD-token GET and the GraphQL POST
  // go through the same residential IP (Meta's CSRF checks require this).
  const sessionId = String(Math.floor(Math.random() * 90000) + 10000)
  const lsd = await getLSDToken(pageId, sessionId)

  const variables = {
    queryParams: {
      active_status: "all",
      ad_type: "all",
      country: "ALL",
      view_all_page_id: pageId,
      search_type: "page",
      media_type: "all",
    },
    cursor: null,
    count: 50,
    fetchPageInfo: true,
    fetchSharedDisclaimers: false,
  }

  const postBody = new URLSearchParams({
    av: "0",
    __user: "0",
    __a: "1",
    lsd,
    fb_api_caller_class: "RelayModern",
    fb_api_req_friendly_name: "AdLibraryPagedAdDisplayQuery",
    variables: JSON.stringify(variables),
    server_timestamps: "true",
    doc_id: DOC_ID,
  })

  let res: Response
  try {
    res = await proxyFetch("https://www.facebook.com/api/graphql/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": BROWSER_UA,
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Origin: "https://www.facebook.com",
        Referer: `https://www.facebook.com/ads/library/?view_all_page_id=${pageId}`,
        "X-FB-Friendly-Name": "AdLibraryPagedAdDisplayQuery",
      },
      body: postBody.toString(),
    }, sessionId)
  } catch (e) {
    throw new Error(`Network error calling Meta GraphQL: ${(e as Error).message}`)
  }

  if (!res.ok) throw new Error(`Meta GraphQL returned HTTP ${res.status}`)

  const text = await res.text()

  let ads: MetaAd[] = []
  for (const line of text.split("\n")) {
    if (!line.trim()) continue
    try {
      const parsed = JSON.parse(line)
      const errMsg: string = parsed?.errors?.[0]?.message ?? ""
      if (errMsg.toLowerCase().includes("doc_id") || errMsg.toLowerCase().includes("no_query")) {
        throw new Error(`doc_id_stale: ${errMsg}`)
      }
      ads = ads.concat(extractAds(parsed))
    } catch (e) {
      if ((e as Error).message.startsWith("doc_id_stale")) throw e
    }
  }

  return ads.slice(0, 50)
}
