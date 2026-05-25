/**
 * content.js — runs at document_start in the ISOLATED world
 *
 * Injects the fetch interceptor as an inline <script> tag so it
 * runs in the PAGE's main JavaScript context (same window as Meta's
 * React app). This is the reliable cross-version way to override
 * window.fetch before any page scripts execute.
 */

// ── 1. Inject interceptor into page's main world ──────────────────────────────
(function injectInterceptor() {
  const code = `(${pageInterceptor.toString()})()`;
  const s = document.createElement("script");
  s.textContent = code;
  // document.head may not exist yet at document_start — use documentElement
  (document.head || document.documentElement).appendChild(s);
  s.remove(); // clean up DOM
})();

/**
 * This function's body is serialised and injected into the page.
 * It MUST be self-contained (no closure references).
 */
function pageInterceptor() {
  const _fetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await _fetch.apply(this, args);
    try {
      const url =
        typeof args[0] === "string"
          ? args[0]
          : args[0] && typeof args[0] === "object" && args[0].url
          ? args[0].url
          : "";

      if (url.includes("/api/graphql")) {
        const clone = response.clone();
        clone.text().then(function (text) {
          if (text.indexOf("adArchiveID") !== -1 || text.indexOf("ad_archive_id") !== -1) {
            const params = new URLSearchParams(window.location.search);
            const pageId =
              params.get("view_all_page_id") ||
              params.get("advertiser_id");
            if (pageId) {
              window.postMessage(
                { __signal: true, type: "ADS_RAW", text: text, pageId: pageId },
                "*"
              );
            }
          }
        });
      }
    } catch (_) {}
    return response;
  };
}

// ── 2. Receive messages and forward to background ────────────────────────────
window.addEventListener("message", function (event) {
  if (
    !event.data ||
    !event.data.__signal ||
    event.data.type !== "ADS_RAW"
  ) return;

  var text   = event.data.text;
  var pageId = event.data.pageId;
  if (!text || !pageId) return;

  var ads = parseAds(text);
  if (!ads.length) return;

  chrome.runtime.sendMessage({ type: "ADS_CAPTURED", pageId: pageId, ads: ads });
});

// ── 3. Ad parser (mirrors meta-scraper.ts extractAds) ────────────────────────
function parseAds(text) {
  var results = [];

  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(walk); return; }

    var archiveId =
      node["adArchiveID"] !== undefined ? node["adArchiveID"] :
      node["ad_archive_id"] !== undefined ? node["ad_archive_id"] :
      node["archiveID"] !== undefined ? node["archiveID"] : null;

    if (archiveId !== null) {
      var snap    = node["snapshot"] || {};
      var bodyObj = snap["body"] || null;

      var headline =
        (snap["title"] || snap["link_title"] || snap["link_description"] ||
         node["page_name"] || "Untitled Ad");

      var body =
        (bodyObj && bodyObj["markup"] && bodyObj["markup"]["__html"]) ||
        (bodyObj && bodyObj["text"]) ||
        snap["body_text"] ||
        snap["message"] ||
        null;

      results.push({
        externalId:  String(archiveId),
        headline:    headline,
        body:        body || null,
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
    try {
      var parsed = JSON.parse(line);
      walk(parsed);
    } catch (_) {}
  }

  return results;
}
