/**
 * background.js — service worker
 *
 * Two jobs:
 *  1. Inject the fetch interceptor into the page's main world using
 *     chrome.scripting.executeScript — the ONLY way that bypasses
 *     Facebook's strict Content-Security-Policy.
 *  2. Accumulate captured ads in chrome.storage.session and handle
 *     sync requests from popup.js.
 */

// ── 1. Inject interceptor whenever Ad Library tab loads ───────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "loading" &&
    tab.url &&
    tab.url.includes("facebook.com/ads/library")
  ) {
    chrome.scripting
      .executeScript({
        target: { tabId },
        world: "MAIN",          // runs in the page's JS context, bypasses CSP
        func: pageInterceptor,
        injectImmediately: true,
      })
      .catch(() => {}); // tab may have navigated away — ignore
  }
});

/**
 * This function is serialised by Chrome and injected into the page.
 * It MUST be self-contained — no references to outer scope.
 */
function pageInterceptor() {
  if (window.__signalIntercepted) return;
  window.__signalIntercepted = true;

  const _fetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await _fetch.apply(this, args);
    try {
      const url =
        typeof args[0] === "string"
          ? args[0]
          : args[0] && args[0].url
          ? args[0].url
          : "";

      if (url.indexOf("/api/graphql") !== -1) {
        const clone = response.clone();
        clone.text().then(function (text) {
          if (
            text.indexOf("adArchiveID") !== -1 ||
            text.indexOf("ad_archive_id") !== -1
          ) {
            const p = new URLSearchParams(window.location.search);
            const pageId =
              p.get("view_all_page_id") || p.get("advertiser_id");
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

// ── 2. Also inject on demand from content.js (backup for already-loaded tabs) ─

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "INJECT_INTERCEPTOR" && sender.tab?.id) {
    chrome.scripting
      .executeScript({
        target: { tabId: sender.tab.id },
        world: "MAIN",
        func: pageInterceptor,
        injectImmediately: true,
      })
      .catch(() => {});
    return false;
  }

  if (msg.type === "ADS_CAPTURED") {
    const { pageId, ads } = msg;
    storeMerge(pageId, ads).then(() => {
      if (sender.tab?.id) {
        getStored(pageId).then((stored) => {
          chrome.action.setBadgeText({
            text: String(stored.length),
            tabId: sender.tab.id,
          });
          chrome.action.setBadgeBackgroundColor({
            color: "#6366f1",
            tabId: sender.tab.id,
          });
        });
      }
    });
    return false;
  }

  if (msg.type === "GET_ADS") {
    getStored(msg.pageId).then(sendResponse);
    return true;
  }

  if (msg.type === "SYNC_ADS") {
    const { pageId, ads, signalUrl, apiKey } = msg;
    syncToSignal(pageId, ads, signalUrl, apiKey).then(sendResponse);
    return true;
  }

  if (msg.type === "CLEAR_ADS") {
    clearStored(msg.pageId).then(() => sendResponse({ ok: true }));
    return true;
  }
});

// ── Storage helpers ───────────────────────────────────────────────────────────

async function getStored(pageId) {
  const key = `ads_${pageId}`;
  const result = await chrome.storage.session.get(key);
  return result[key] ?? [];
}

async function storeMerge(pageId, newAds) {
  const existing = await getStored(pageId);
  const seen = new Set(existing.map((a) => a.externalId));
  const merged = [
    ...existing,
    ...newAds.filter((a) => !seen.has(a.externalId)),
  ];
  await chrome.storage.session.set({ [`ads_${pageId}`]: merged });
}

async function clearStored(pageId) {
  await chrome.storage.session.remove(`ads_${pageId}`);
}

// ── Signal API sync ───────────────────────────────────────────────────────────

async function syncToSignal(pageId, ads, signalUrl, apiKey) {
  try {
    const res = await fetch(`${signalUrl}/api/ads/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signal-key": apiKey,
      },
      body: JSON.stringify({ pageId, ads }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Sync failed" };
    return data;
  } catch (e) {
    return { error: e.message ?? "Network error" };
  }
}
