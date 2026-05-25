/**
 * popup.js
 * Runs when the extension popup opens.
 */

const SIGNAL_URL = "https://signal-theta-one.vercel.app";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const views = {
  setup:   document.getElementById("view-setup"),
  idle:    document.getElementById("view-idle"),
  active:  document.getElementById("view-active"),
  success: document.getElementById("view-success"),
};

const $ = (id) => document.getElementById(id);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
(async function init() {
  const { apiKey } = await chrome.storage.local.get("apiKey");

  if (!apiKey) {
    show("setup");
    return;
  }

  $("connected-as").textContent = "Connected";
  $("disconnect-link").style.display = "block";

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

  // Load captured ads for this page
  const ads = await getAds(pageId);
  renderActive(pageId, ads, tab);
})();

// ── Views ─────────────────────────────────────────────────────────────────────
function show(name) {
  Object.entries(views).forEach(([k, el]) => {
    el.style.display = k === name ? "" : "none";
  });
}

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

  // Sync button
  syncBtn.onclick = async () => {
    const { apiKey } = await chrome.storage.local.get("apiKey");
    syncBtn.disabled = true;
    syncBtn.innerHTML = `<div class="spinner"></div> Syncing…`;

    const result = await chrome.runtime.sendMessage({
      type: "SYNC_ADS",
      pageId,
      ads,
      signalUrl: SIGNAL_URL,
      apiKey,
    });

    if (result?.error) {
      syncBtn.disabled = false;
      syncBtn.textContent = `⚠️ ${result.error}`;
      return;
    }

    // Clear stored ads for this page
    await chrome.runtime.sendMessage({ type: "CLEAR_ADS", pageId });
    // Update badge
    chrome.action.setBadgeText({ text: "", tabId: tab.id });

    // Show success
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

  // Check interceptor status and show in footer
  chrome.runtime.sendMessage({ type: "CHECK_INTERCEPTOR", tabId: tab.id }, (res) => {
    const el = document.getElementById("interceptor-status");
    if (el) el.textContent = res?.active ? "✓ interceptor on" : "✗ interceptor off";
  });

  // Poll for new ads every 2s while popup is open
  const interval = setInterval(async () => {
    const fresh = await getAds(pageId);
    if (fresh.length !== ads.length) {
      // Re-render without reopening views
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

// ── Setup view ────────────────────────────────────────────────────────────────
$("save-key-btn").onclick = async () => {
  const key = $("api-key-input").value.trim();
  if (!key) return;
  await chrome.storage.local.set({ apiKey: key });
  location.reload();
};

$("api-key-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("save-key-btn").click();
});

$("open-settings-link").onclick = (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${SIGNAL_URL}/settings` });
};

// ── Footer ────────────────────────────────────────────────────────────────────
$("disconnect-link").onclick = async (e) => {
  e.preventDefault();
  await chrome.storage.local.remove("apiKey");
  location.reload();
};

$("sync-more-btn").onclick = () => location.reload();

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAds(pageId) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_ADS", pageId }, (ads) => {
      resolve(Array.isArray(ads) ? ads : []);
    });
  });
}
