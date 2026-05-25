/**
 * content.js — runs at document_start in the ISOLATED world
 *
 * The actual fetch interception happens in background.js via
 * chrome.scripting.executeScript (bypasses Facebook's CSP).
 * This script just:
 *   1. Asks the background to inject the interceptor (fallback for
 *      tabs that were already open when the extension was installed)
 *   2. Listens for postMessage events from the injected interceptor
 *   3. Parses the ad data and forwards to background for storage
 */

// Ask background to inject interceptor (covers already-open tabs)
chrome.runtime.sendMessage({ type: "INJECT_INTERCEPTOR" });

// Receive intercepted GraphQL payloads from the page's main world
window.addEventListener("message", function (event) {
  if (!event.data || !event.data.__signal || event.data.type !== "ADS_RAW") return;

  var text   = event.data.text;
  var pageId = event.data.pageId;
  if (!text || !pageId) return;

  var ads = parseAds(text);
  if (!ads.length) return;

  chrome.runtime.sendMessage({ type: "ADS_CAPTURED", pageId: pageId, ads: ads });
});

// ── Ad parser ────────────────────────────────────────────────────────────────

function parseAds(text) {
  var results = [];

  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(walk); return; }

    var archiveId =
      node["adArchiveID"] !== undefined ? node["adArchiveID"] :
      node["ad_archive_id"] !== undefined ? node["ad_archive_id"] :
      node["archiveID"] !== undefined ? node["archiveID"] : null;

    if (archiveId !== null && archiveId !== undefined) {
      var snap    = node["snapshot"] || {};
      var bodyObj = snap["body"] || null;

      var headline =
        snap["title"] || snap["link_title"] || snap["link_description"] ||
        node["page_name"] || "Untitled Ad";

      var body =
        (bodyObj && bodyObj["markup"] && bodyObj["markup"]["__html"]) ||
        (bodyObj && bodyObj["text"]) ||
        snap["body_text"] || snap["message"] || null;

      results.push({
        externalId:  String(archiveId),
        headline:    String(headline),
        body:        body ? String(body) : null,
        snapshotUrl: node["snapshot_url"] || snap["snapshot_url"] || null,
        firstSeen:   node["startDate"]    || node["start_date"]   || null,
        lastSeen:    node["endDate"]      || node["end_date"]     || null,
        isActive:    !(node["endDate"]    || node["end_date"]),
      });
      return;
    }

    Object.values(node).forEach(walk);
  }

  var lines = text.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    try { walk(JSON.parse(line)); } catch (_) {}
  }

  return results;
}
