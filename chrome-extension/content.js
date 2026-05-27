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

  console.log("[Signal] content.js got ADS_RAW len=" + text.length);

  var ads = parseAds(text);
  console.log("[Signal] parseAds result count=" + ads.length);
  if (!ads.length) return;

  chrome.runtime.sendMessage({ type: "ADS_CAPTURED", pageId: pageId, ads: ads });
});

// ── Ad parser ────────────────────────────────────────────────────────────────

function parseAds(text) {
  var results = [];

  // Scan the full raw text for pageName — works regardless of nesting depth.
  // Meta's GraphQL uses camelCase internally; snake_case appears in some older responses.
  var globalPageName = null;
  var pnMatch = text.match(/"pageName"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (!pnMatch) pnMatch = text.match(/"page_name"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (pnMatch) globalPageName = pnMatch[1].replace(/\\"/g, '"');

  function extractImage(node) {
    // Structured field checks first
    var snap = (node && node["snapshot"]) || {};
    var imgs = snap["images"];
    if (Array.isArray(imgs) && imgs.length > 0) {
      var u = imgs[0]["resized_image_url"] || imgs[0]["original_image_url"];
      if (u) return u;
    }
    var cards = snap["cards"];
    if (Array.isArray(cards) && cards.length > 0) {
      var u = cards[0]["resized_image_url"] || cards[0]["original_image_url"] ||
              cards[0]["video_preview_image_url"];
      if (u) return u;
    }
    var videos = snap["videos"];
    if (Array.isArray(videos) && videos.length > 0) {
      var u = videos[0]["video_preview_image_url"] || videos[0]["videoPreviewImageUrl"] ||
              videos[0]["resized_image_url"] || videos[0]["original_image_url"];
      if (u) return u;
    }
    var direct = snap["resized_image_url"] || snap["original_image_url"] ||
                 snap["video_preview_image_url"] || snap["videoPreviewImageUrl"] ||
                 snap["thumbnail_url"] || snap["thumbnailUrl"] ||
                 snap["video_sd_url"] || snap["video_hd_url"];
    if (direct && direct.indexOf("fbcdn") !== -1) return direct;
    if (direct) return direct;

    // Fallback: regex-scan the whole node JSON for any fbcdn URL
    try {
      var nodeStr = JSON.stringify(node);
      var m = nodeStr.match(/"(https:(?:\\\/|\/){2}[^"\\]*fbcdn\.net[^"\\]*)"/i);
      if (m) {
        return m[1].replace(/\\\//g, "/").replace(/\\u0026/g, "&");
      }
    } catch (_) {}
    return null;
  }

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
        node["pageName"] || node["page_name"] || "Untitled Ad";

      var body =
        (bodyObj && bodyObj["markup"] && bodyObj["markup"]["__html"]) ||
        (bodyObj && bodyObj["text"]) ||
        snap["body_text"] || snap["message"] || null;

      var pageName = node["pageName"] || node["page_name"] ||
                     snap["pageName"] || snap["page_name"] || globalPageName || null;

      // Debug: log raw node keys and snapshot keys on first ad only
      if (results.length === 0) {
        console.log("[Signal] node keys:", Object.keys(node));
        console.log("[Signal] snap keys:", Object.keys(snap));
        console.log("[Signal] snap sample:", JSON.stringify(snap).substring(0, 500));
      }

      results.push({
        externalId:  String(archiveId),
        headline:    String(headline),
        body:        body ? String(body) : null,
        imageUrl:    extractImage(node),
        pageName:    pageName,
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

  // Debug: log first captured ad so we can inspect the structure
  if (results.length > 0) {
    var sample = results[0];
    console.log("[Signal] pageName found:", sample.pageName);
    console.log("[Signal] imageUrl found:", sample.imageUrl);
    console.log("[Signal] globalPageName:", globalPageName);
  } else {
    console.log("[Signal] 0 ads parsed — raw text start:", text.substring(0, 300));
  }

  return results;
}
