/**
 * popup.js
 * Runs when the extension popup opens.
 * Auto-connects to Signal using the user's existing browser session —
 * no manual API key required.
 */

const SIGNAL_URL = "https://signal-theta-one.vercel.app";

const $ = (id) => document.getElementById(id);

const views = {
  loading:    document.getElementById("view-loading"),
  login:      document.getElementById("view-login"),
  idle:       document.getElementById("view-idle"),
  active:     document.getElementById("view-active"),
  success:    document.getElementById("view-success"),
};

function show(name) {
  Object.entries(views).forEach(([k, el]) => {
    if (el) el.style.display = k === name ? "" : "none";
  });
}

// ── Auto-connect using Signal session cookie ───────────────────────────────────
async function fetchApiKey() {
  try {
    // Fetch settings — the browser includes the Signal session cookie automatically
    // because the extension has host_permissions for signal-theta-one.vercel.app
    const res = await fetch(`${SIGNAL_URL}/api/settings`, { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();

    // If key already exists, return it
    if (data.extensionKey) return data.extensionKey;

    // Auto-generate one silently
    const gen = await fetch(`${SIGNAL_URL}/api/settings`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generateExtensionKey: true }),
    });
    if (!gen.ok) return null;
    const genData = await gen.json();
    return genData.extensionKey || null;
  } catch (_) {
    return null;
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
(async function init() {
  show("loading");

  // Check for a cached key first (fast path)
  let { apiKey } = await chrome.storage.local.get("apiKey");

  if (!apiKey) {
    // Try to auto-connect via Signal session
    apiKey = await fetchApiKey();
    if (apiKey) {
      await chrome.storage.local.set({ apiKey });
    } else {
      // Not logged in to Signal — show login prompt
      show("login");
      return;
    }
  }

  // Check active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url?.includes("facebook.com/ads/library")) {
    show("idle");
    return;
  }

  const params = new URL(tab.url).searchParams;
  const pageId = params.get("view_all_page_id") || params.get("advertiser_id");

  if (!pageId) {
    show("idle");
    return;
  }

  // Re-inject interceptor in case extension was reloaded without page refresh
  chrome.runtime.sendMessage({ type: "INJECT_INTERCEPTOR", tabId: tab.id });

  const ads = await getAds(pageId);
  renderActive(pageId, ads, tab);
})();

// ── Active view ───────────────────────────────────────────────────────────────
function renderActive(pageId, ads, tab) {
  show("active");

  const pageName = ads.find(a => a.pageName)?.pageName || null;
  const displayName = pageName || `Page ${pageId}`;
  $("comp-avatar").textContent = displayName[0]?.toUpperCase() ?? "?";
  $("comp-name").textContent   = displayName;
  $("comp-sub").textContent    = `Meta ID: ${pageId}`;
  $("ad-count").textContent    = ads.length;
  $("new-count").textContent   = ads.length > 0 ? ads.length : "—";

  const syncBtn = $("sync-btn");
  if (ads.length > 0) {
    syncBtn.disabled = false;
    syncBtn.innerHTML = `Sync ${ads.length} ad${ads.length !== 1 ? "s" : ""} to Signal`;
    $("tip-text").textContent =
      ads.length >= 10
        ? "Scroll the page to capture even more before syncing."
        : "Scroll the page to load more ads, then sync.";
  } else {
    syncBtn.disabled = true;
    syncBtn.textContent = "Waiting for ads…";
    $("tip-text").textContent =
      "Ads are captured as they load. Wait a moment or scroll to trigger loading.";
  }

  syncBtn.onclick = async () => {
    const { apiKey } = await chrome.storage.local.get("apiKey");
    syncBtn.disabled = true;
    syncBtn.innerHTML = `<div class="spinner"></div> Syncing…`;

    const currentAds = await getAds(pageId);

    const result = await chrome.runtime.sendMessage({
      type: "SYNC_ADS",
      pageId,
      ads: currentAds,
      signalUrl: SIGNAL_URL,
      apiKey,
    });

    if (result?.error) {
      // If auth error, clear cached key and retry on next open
      if (result.error.includes("Invalid API key") || result.error.includes("Missing API key")) {
        await chrome.storage.local.remove("apiKey");
      }
      syncBtn.disabled = false;
      syncBtn.textContent = `⚠️ ${result.error}`;
      return;
    }

    await chrome.runtime.sendMessage({ type: "CLEAR_ADS", pageId });
    chrome.action.setBadgeText({ text: "", tabId: tab.id });

    $("success-title").textContent =
      result.imported > 0
        ? `${result.imported} new ad${result.imported !== 1 ? "s" : ""} added!`
        : "Already up to date";
    $("success-detail").textContent =
      result.imported > 0
        ? `${result.updated > 0 ? result.updated + " updated. " : ""}Opening Signal…`
        : `All ${result.total} ads were already in Signal.`;

    show("success");

    if (result.imported > 0) {
      setTimeout(() => chrome.tabs.create({ url: `${SIGNAL_URL}/ads` }), 1200);
    }
  };

  // Interceptor status check
  setTimeout(() => {
    chrome.runtime.sendMessage({ type: "CHECK_INTERCEPTOR", tabId: tab.id }, (res) => {
      const el = $("interceptor-status");
      if (!el) return;
      if (res?.active) {
        el.textContent = "✓ interceptor on";
      } else {
        el.textContent = "⚠ Refresh the Ad Library page";
        el.style.color = "#f59e0b";
      }
    });
  }, 800);

  // Poll for new ads every 2s
  const interval = setInterval(async () => {
    const fresh = await getAds(pageId);
    if (fresh.length !== ads.length) {
      $("ad-count").textContent = fresh.length;
      $("new-count").textContent = fresh.length;
      if (fresh.length > 0 && syncBtn.disabled && syncBtn.textContent.includes("Waiting")) {
        syncBtn.disabled = false;
        syncBtn.innerHTML = `Sync ${fresh.length} ad${fresh.length !== 1 ? "s" : ""} to Signal`;
        $("tip-text").textContent = "Scroll the page to capture even more before syncing.";
      } else if (fresh.length > 0) {
        syncBtn.innerHTML = `Sync ${fresh.length} ad${fresh.length !== 1 ? "s" : ""} to Signal`;
      }
    }
  }, 2000);

  window.addEventListener("unload", () => clearInterval(interval));
}

// ── Login view ────────────────────────────────────────────────────────────────
$("open-signal-btn").onclick = () => {
  chrome.tabs.create({ url: `${SIGNAL_URL}/login` });
};

// ── Success view ──────────────────────────────────────────────────────────────
$("sync-more-btn").onclick = () => location.reload();

// ── Footer ────────────────────────────────────────────────────────────────────
$("disconnect-link").onclick = async (e) => {
  e.preventDefault();
  await chrome.storage.local.remove("apiKey");
  location.reload();
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAds(pageId) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_ADS", pageId }, (ads) => {
      resolve(Array.isArray(ads) ? ads : []);
    });
  });
}
