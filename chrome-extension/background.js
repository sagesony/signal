/**
 * background.js — service worker
 *
 * Accumulates captured ads in chrome.storage.session (survives
 * popup open/close but clears on browser restart).
 * Handles sync requests from popup.js.
 */

// ── Accumulate ads ────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "ADS_CAPTURED") {
    const { pageId, ads } = msg;
    storeMerge(pageId, ads).then(() => {
      // Update badge on the tab that sent the message
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
    return true; // async response
  }

  if (msg.type === "SYNC_ADS") {
    const { pageId, ads, signalUrl, apiKey } = msg;
    syncToSignal(pageId, ads, signalUrl, apiKey).then(sendResponse);
    return true; // async response
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
  const merged = [...existing, ...newAds.filter((a) => !seen.has(a.externalId))];
  await chrome.storage.session.set({ [`ads_${pageId}`]: merged });
}

async function clearStored(pageId) {
  await chrome.storage.session.remove(`ads_${pageId}`);
}

// ── Sync to Signal API ────────────────────────────────────────────────────────

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
