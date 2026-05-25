/**
 * content.js — runs in the ISOLATED content-script world
 *
 * Listens for messages from interceptor.js (main world) and
 * forwards parsed ad data to the background service worker.
 */

window.addEventListener("message", (event) => {
  if (!event.data?.__signal || event.data.type !== "ADS_RAW") return;

  const { text, pageId } = event.data;
  if (!pageId) return;

  const ads = parseAds(text);
  if (!ads.length) return;

  chrome.runtime.sendMessage({ type: "ADS_CAPTURED", pageId, ads });
});

// ── Parser (mirrors lib/meta-scraper.ts extractAds) ──────────────────────────

function parseAds(text) {
  const results = [];

  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(walk); return; }

    const archiveId =
      node["adArchiveID"] ?? node["ad_archive_id"] ?? node["archiveID"];

    if (archiveId) {
      const snap = (node["snapshot"] ?? {});
      const bodyObj = snap["body"];

      const headline =
        snap["title"] ||
        snap["link_title"] ||
        snap["link_description"] ||
        node["page_name"] ||
        "Untitled Ad";

      const body =
        bodyObj?.["markup"]?.["__html"] ??
        bodyObj?.["text"] ??
        snap["body_text"] ??
        snap["message"] ??
        null;

      results.push({
        externalId: String(archiveId),
        headline,
        body: body || null,
        snapshotUrl: node["snapshot_url"] ?? snap["snapshot_url"] ?? null,
        firstSeen: node["startDate"] ?? node["start_date"] ?? null,
        lastSeen: node["endDate"] ?? node["end_date"] ?? null,
        isActive: !(node["endDate"] ?? node["end_date"]),
      });
      return;
    }

    Object.values(node).forEach(walk);
  }

  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      walk(parsed);
    } catch (_) {}
  }

  return results;
}
