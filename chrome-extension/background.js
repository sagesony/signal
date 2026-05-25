/**
 * background.js — service worker
 */

// ── Inject interceptor when Ad Library tab loads ──────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "loading" &&
    tab.url &&
    tab.url.includes("facebook.com/ads/library")
  ) {
    injectIntoTab(tabId);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "INJECT_INTERCEPTOR" && sender.tab?.id) {
    injectIntoTab(sender.tab.id);
    return false;
  }

  if (msg.type === "ADS_CAPTURED") {
    storeMerge(msg.pageId, msg.ads).then(() => {
      if (sender.tab?.id) {
        getStored(msg.pageId).then((stored) => {
          chrome.action.setBadgeText({ text: String(stored.length), tabId: sender.tab.id });
          chrome.action.setBadgeBackgroundColor({ color: "#6366f1", tabId: sender.tab.id });
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
    syncToSignal(msg.pageId, msg.ads, msg.signalUrl, msg.apiKey).then(sendResponse);
    return true;
  }

  if (msg.type === "CLEAR_ADS") {
    clearStored(msg.pageId).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === "CHECK_INTERCEPTOR") {
    chrome.scripting.executeScript({
      target: { tabId: msg.tabId },
      world: "MAIN",
      func: () => window.__signalIntercepted === true,
    }).then((results) => sendResponse({ active: results?.[0]?.result === true }))
      .catch((e) => sendResponse({ active: false, error: e.message }));
    return true;
  }
});

function injectIntoTab(tabId) {
  chrome.scripting
    .executeScript({
      target: { tabId },
      world: "MAIN",
      func: pageInterceptor,
      injectImmediately: true,
    })
    .catch(() => {});
}

// ── Page interceptor — injected into the page's main world ───────────────────
// Intercepts both fetch AND XMLHttpRequest so we catch Meta's GraphQL calls
// regardless of which API they use internally.

function pageInterceptor() {
  if (window.__signalIntercepted) return;
  window.__signalIntercepted = true;
  console.log("[Signal] interceptor active ✓");

  function handle(url, text) {
    if (!url || (url.indexOf("graphql") === -1)) return;
    if (text.indexOf("adArchiveID") === -1 && text.indexOf("ad_archive_id") === -1) return;

    var p = new URLSearchParams(window.location.search);
    var pageId = p.get("view_all_page_id") || p.get("advertiser_id");
    if (!pageId) return;

    console.log("[Signal] captured GraphQL response, pageId=" + pageId + " len=" + text.length);
    window.postMessage({ __signal: true, type: "ADS_RAW", text: text, pageId: pageId }, "*");
  }

  // ── fetch override ───────────────────────────────────────────────────────
  var _fetch = window.fetch;
  window.fetch = function () {
    var args = Array.prototype.slice.call(arguments);
    return _fetch.apply(this, args).then(function (response) {
      try {
        var url = typeof args[0] === "string" ? args[0] : (args[0] && args[0].url ? args[0].url : "");
        response.clone().text().then(function (text) { handle(url, text); });
      } catch (_) {}
      return response;
    });
  };

  // ── XMLHttpRequest override ──────────────────────────────────────────────
  var _open = XMLHttpRequest.prototype.open;
  var _send = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._signalURL = url;
    return _open.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    var self = this;
    this.addEventListener("load", function () {
      try { handle(self._signalURL || self.responseURL || "", self.responseText); } catch (_) {}
    });
    return _send.apply(this, arguments);
  };
}

// ── Storage ───────────────────────────────────────────────────────────────────

async function getStored(pageId) {
  const r = await chrome.storage.session.get("ads_" + pageId);
  return r["ads_" + pageId] ?? [];
}

async function storeMerge(pageId, newAds) {
  const existing = await getStored(pageId);
  const seen = new Set(existing.map((a) => a.externalId));
  const merged = [...existing, ...newAds.filter((a) => !seen.has(a.externalId))];
  await chrome.storage.session.set({ ["ads_" + pageId]: merged });
}

async function clearStored(pageId) {
  await chrome.storage.session.remove("ads_" + pageId);
}

// ── Signal API sync ───────────────────────────────────────────────────────────

async function syncToSignal(pageId, ads, signalUrl, apiKey) {
  try {
    const res = await fetch(signalUrl + "/api/ads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-signal-key": apiKey },
      body: JSON.stringify({ pageId, ads }),
    });
    const data = await res.json();
    return res.ok ? data : { error: data.error ?? "Sync failed" };
  } catch (e) {
    return { error: e.message ?? "Network error" };
  }
}
