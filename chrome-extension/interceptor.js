/**
 * interceptor.js — runs in the PAGE's main world (world: "MAIN")
 *
 * Overrides window.fetch so we can read Meta Ad Library's GraphQL
 * responses as they arrive. Captured ad JSON is posted to the
 * content script via window.postMessage.
 */
(function () {
  "use strict";

  const _fetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await _fetch.apply(this, args);

    try {
      const url =
        typeof args[0] === "string"
          ? args[0]
          : args[0]?.url ?? "";

      if (url.includes("/api/graphql/") || url.includes("graphql")) {
        const clone = response.clone();
        clone.text().then((text) => {
          if (text.includes("adArchiveID") || text.includes("ad_archive_id")) {
            const pageId =
              new URLSearchParams(window.location.search).get("view_all_page_id") ||
              new URLSearchParams(window.location.search).get("advertiser_id");

            window.postMessage(
              { __signal: true, type: "ADS_RAW", text, pageId },
              "*"
            );
          }
        });
      }
    } catch (_) {
      // Never let our interception break the page
    }

    return response;
  };
})();
