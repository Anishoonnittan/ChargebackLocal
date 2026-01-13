import convexClient from "../lib/convex-client.js";

// ScamVigil - Background Service Worker (MV3)
// Uses Convex for scanning + persistence, and chrome.* APIs for UX (menus, notifications, caching).

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const WATCHLIST_CHECK_PERIOD_MINUTES = 15;

// -----------------------------
// Install / Update
// -----------------------------

chrome.runtime.onInstalled.addListener((details) => {
  // Context menus
  chrome.contextMenus.create({
    id: "scan-link",
    title: "🔗 Scan Link with ScamVigil",
    contexts: ["link"],
  });

  chrome.contextMenus.create({
    id: "scan-selection",
    title: "🔍 Scan Selection with ScamVigil",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "scan-email",
    title: "📧 Verify Email with ScamVigil",
    contexts: ["selection"],
  });

  if (details.reason === "install") {
    chrome.tabs.create({ url: "https://scamvigil.com.au/extension/welcome" });

    chrome.storage.sync.set({
      autoScan: false,
      notificationsEnabled: true,
      watchlistAlerts: true,
      alertLevel: "medium", // low | medium | high
    });
  }

  if (details.reason === "update") {
    console.log("ScamVigil extension updated to", chrome.runtime.getManifest().version);
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === "scan-link") {
      await scanLink(info.linkUrl, tab?.id);
      return;
    }

    if (info.menuItemId === "scan-selection") {
      await scanMessage(info.selectionText, tab?.id);
      return;
    }

    if (info.menuItemId === "scan-email") {
      await scanEmail(info.selectionText, tab?.id);
      return;
    }
  } catch (error) {
    console.error("Context menu action failed:", error);
  }
});

// -----------------------------
// Message router (popup + content scripts)
// -----------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (!message?.action) {
      return sendResponse({ success: false, error: "Invalid message" });
    }

    // Profile scan (content scripts send { data: { profileUrl, profileData, platform }})
    // Popup sends { url, platform }
    if (message.action === "performScan") {
      const profileUrl = message.data?.profileUrl ?? message.url;
      const platform = message.data?.platform ?? message.platform ?? inferPlatformFromUrl(profileUrl);
      const profileData = message.data?.profileData;

      const result = await scanProfile({ profileUrl, platform, profileData }, sender.tab?.id);
      return sendResponse({ success: true, result });
    }

    if (message.action === "scanLink") {
      const result = await scanLink(message.url, sender.tab?.id);
      return sendResponse({ success: true, result });
    }

    if (message.action === "scanEmail") {
      const result = await scanEmail(message.email, sender.tab?.id);
      return sendResponse({ success: true, result });
    }

    if (message.action === "scanMessage") {
      const result = await scanMessage(message.text, sender.tab?.id);
      return sendResponse({ success: true, result });
    }

    if (message.action === "getScanResult") {
      const cached = await getCachedScan(message.profileUrl);
      return sendResponse({ success: true, result: cached });
    }

    if (message.action === "addToWatchlist") {
      const watchlistResult = await addToWatchlist(message.profileUrl);
      return sendResponse({ success: true, result: watchlistResult });
    }

    return sendResponse({ success: false, error: `Unknown action: ${message.action}` });
  })()
    .catch((error) => {
      sendResponse({ success: false, error: error?.message || "Unknown error" });
    });

  return true; // keep channel open
});

// Keyboard shortcut (Ctrl+Shift+S) triggers content script scan
chrome.commands.onCommand.addListener((command) => {
  if (command !== "scan-profile") {
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "scanProfile" });
    }
  });
});

// -----------------------------
// Convex auth helper
// -----------------------------

async function ensureConvexAuthOrThrow() {
  const { convexAuthToken } = await chrome.storage.sync.get(["convexAuthToken"]);

  if (!convexAuthToken) {
    throw new Error("Please sign in to ScamVigil in the extension first.");
  }

  // Keep local instance updated.
  await convexClient.setAuth(convexAuthToken);
}

// -----------------------------
// Profile scan (Convex)
// -----------------------------

async function scanProfile({ profileUrl, platform, profileData }, tabId) {
  if (!profileUrl) {
    throw new Error("Missing profile URL");
  }

  await ensureConvexAuthOrThrow();

  // Cache first
  const cached = await getCachedScan(profileUrl);
  if (cached && Date.now() - cached.scannedAt < CACHE_DURATION_MS) {
    if (tabId) {
      chrome.tabs.sendMessage(tabId, { action: "scanComplete", result: cached });
    }
    return cached;
  }

  const mappedProfileData = mapExtractedProfileData(profileData);

  const analysis = await convexClient.action("scans.scanProfile", {
    profileUrl,
    platform,
    profileData: mappedProfileData,
  });

  // Persist for history/stats.
  // NOTE: scans.saveScanResult expects riskLevel: "real" | "suspicious" | "fake"
  try {
    await convexClient.mutation("scans.saveScanResult", {
      profileUrl,
      platform,
      profileName: profileData?.name || undefined,
      trustScore: analysis.trustScore,
      riskLevel: analysis.riskLevel,
      insights: Array.isArray(analysis.insights) ? analysis.insights : [],
      scamPhrases: Array.isArray(analysis.scamPhrases) ? analysis.scamPhrases : [],
    });
  } catch (error) {
    // Non-fatal (scan result still usable).
    console.warn("Failed to persist scan:", error);
  }

  const normalizedRiskLevel = mapProfileRiskToExtensionRisk(analysis.riskLevel);
  const flags = extractFlags(analysis);

  const result = {
    profileUrl,
    platform,
    trustScore: analysis.trustScore,
    riskLevel: normalizedRiskLevel, // low | medium | high (what content scripts expect)
    flags,
    analysis: analysis.reasoning || "",
    scannedAt: Date.now(),
  };

  await chrome.storage.local.set({ [`scan_${profileUrl}`]: result });

  if (tabId) {
    chrome.tabs.sendMessage(tabId, { action: "scanComplete", result });
  }

  // Notification on high risk
  const { notificationsEnabled } = await chrome.storage.sync.get(["notificationsEnabled"]);
  if (notificationsEnabled !== false && result.riskLevel === "high") {
    showNotification(
      "warning",
      "High Risk Profile Detected",
      `Trust Score: ${result.trustScore}% — proceed with caution.`
    );
  }

  return result;
}

function mapExtractedProfileData(profileData) {
  if (!profileData || typeof profileData !== "object") {
    return undefined;
  }

  // We only pass the fields the Convex action expects.
  return {
    followerCount: typeof profileData.followers === "number" ? profileData.followers : undefined,
    followingCount: typeof profileData.following === "number" ? profileData.following : undefined,
    postCount: typeof profileData.posts === "number" ? profileData.posts : undefined,
    bio: typeof profileData.bio === "string" ? profileData.bio : undefined,
    recentActivity: undefined,
    accountAge: undefined,
  };
}

function mapProfileRiskToExtensionRisk(riskLevel) {
  // Convex scanProfile returns: real | suspicious | fake
  if (riskLevel === "real") return "low";
  if (riskLevel === "suspicious") return "medium";
  return "high";
}

function extractFlags(analysis) {
  const insights = Array.isArray(analysis?.insights) ? analysis.insights : [];
  const warningTexts = insights
    .filter((i) => i && (i.type === "warning" || i.type === "critical"))
    .map((i) => i.text)
    .filter(Boolean);

  if (warningTexts.length > 0) {
    return warningTexts.slice(0, 6);
  }

  // Fallback: show a few informative lines.
  const infoTexts = insights.map((i) => i?.text).filter(Boolean);
  return infoTexts.slice(0, 4);
}

// -----------------------------
// Link scan (Convex)
// -----------------------------

async function scanLink(url, tabId) {
  if (!url) {
    throw new Error("Missing URL");
  }

  await ensureConvexAuthOrThrow();

  const scan = await convexClient.action("security.scanLink", { url, context: "browser-extension" });

  // Normalize for popup UI expectations
  const normalizedRiskLevel = scan.riskLevel === "dangerous" ? "high_risk" : scan.riskLevel;

  const threats = Array.isArray(scan.threats) ? scan.threats : [];
  const findings = threats.map((t) => t.description).filter(Boolean);

  const result = {
    url,
    trustScore: typeof scan.safetyScore === "number" ? scan.safetyScore : 0,
    riskLevel: normalizedRiskLevel,
    summary: scan.recommendation,
    details: findings.join(" • "),
    isPhishing: threats.some((t) => (t.type || "").toLowerCase().includes("phish") || (t.type || "").toLowerCase().includes("social")),
    isMalware: threats.some((t) => (t.type || "").toLowerCase().includes("malware")),
  };

  // Persist security scan (best-effort)
  try {
    await convexClient.mutation("security.saveSecurityScan", {
      scanType: "link",
      input: url,
      score: result.trustScore,
      riskLevel: result.riskLevel,
      findings: findings.length > 0 ? findings : [result.summary || "Link scan completed"],
    });
  } catch (error) {
    console.warn("Failed to persist link scan:", error);
  }

  if (tabId) {
    chrome.tabs.sendMessage(tabId, { action: "linkScanComplete", result });
  }

  return result;
}

// -----------------------------
// Email scan (Convex)
// -----------------------------

async function scanEmail(emailText, tabId) {
  if (!emailText) {
    throw new Error("Missing email");
  }

  const emailMatch = String(emailText).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : String(emailText).trim();

  await ensureConvexAuthOrThrow();

  const scan = await convexClient.action("security.verifyEmail", {
    email,
    senderName: undefined,
    subject: undefined,
    bodyPreview: undefined,
  });

  const normalizedRiskLevel = scan.riskLevel === "legitimate" ? "safe" : scan.riskLevel === "fake" ? "high_risk" : "suspicious";

  const risks = Array.isArray(scan.risks) ? scan.risks : [];
  const findings = risks.map((r) => r.description).filter(Boolean);

  const domain = (email.split("@")[1] || "").toLowerCase();
  const freeProviders = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "proton.me", "protonmail.com"];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const result = {
    email,
    riskLevel: normalizedRiskLevel,
    riskScore: Math.max(0, Math.min(100, 100 - (scan.trustScore ?? 0))),
    isValid: emailRegex.test(email),
    isDisposable: risks.some((r) => (r.type || "").toLowerCase().includes("temporary")),
    isFreeProvider: freeProviders.includes(domain),
    details: findings.join(" • ") || scan.recommendation,
  };

  try {
    await convexClient.mutation("security.saveSecurityScan", {
      scanType: "email",
      input: email,
      score: scan.trustScore ?? 0,
      riskLevel: normalizedRiskLevel,
      findings: findings.length > 0 ? findings : [scan.recommendation || "Email check completed"],
    });
  } catch (error) {
    console.warn("Failed to persist email scan:", error);
  }

  if (tabId) {
    chrome.tabs.sendMessage(tabId, { action: "emailScanComplete", result });
  }

  return result;
}

// -----------------------------
// Message scan (Convex)
// -----------------------------

async function scanMessage(text, tabId) {
  if (!text) {
    throw new Error("Missing text");
  }

  await ensureConvexAuthOrThrow();

  // Use the same mutation the mobile app uses so we get the richer risk levels.
  const scan = await convexClient.mutation("messageScans.scanMessage", {
    messageText: String(text),
    source: "browser-extension",
  });

  const result = {
    riskScore: scan.riskScore ?? 0,
    riskLevel: scan.riskLevel ?? "safe",
    detectedPatterns: scan.detectedPatterns ?? [],
    recommendation: scan.recommendation ?? "verify_manually",
  };

  if (tabId) {
    chrome.tabs.sendMessage(tabId, { action: "messageScanComplete", result });
  }

  return result;
}

// -----------------------------
// Watchlist (Convex)
// -----------------------------

async function addToWatchlist(profileUrl) {
  if (!profileUrl) {
    throw new Error("Missing profile URL");
  }

  await ensureConvexAuthOrThrow();

  const cached = await getCachedScan(profileUrl);
  const initialTrustScore = cached?.trustScore ?? 50;

  const platform = inferPlatformFromUrl(profileUrl);

  const result = await convexClient.mutation("monitoring.addToWatchlist", {
    profileUrl,
    profileName: undefined,
    platform,
    checkFrequency: "daily",
    initialTrustScore,
  });

  const { notificationsEnabled } = await chrome.storage.sync.get(["notificationsEnabled"]);
  if (notificationsEnabled !== false) {
    showNotification("success", "Added to Watchlist", "We'll monitor this profile for suspicious changes.");
  }

  return result;
}

// -----------------------------
// Cache helpers
// -----------------------------

async function getCachedScan(profileUrl) {
  const key = `scan_${profileUrl}`;
  const result = await chrome.storage.local.get([key]);
  return result[key] || null;
}

// -----------------------------
// Watchlist monitoring loop
// -----------------------------

chrome.alarms.create("monitorWatchlist", { periodInMinutes: WATCHLIST_CHECK_PERIOD_MINUTES });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "monitorWatchlist") {
    return;
  }

  const { watchlistAlerts, notificationsEnabled } = await chrome.storage.sync.get([
    "watchlistAlerts",
    "notificationsEnabled",
  ]);

  if (watchlistAlerts === false || notificationsEnabled === false) {
    return;
  }

  try {
    await ensureConvexAuthOrThrow();

    const alerts = await convexClient.query("monitoring.getMonitoringAlerts", { unreadOnly: true });

    if (!Array.isArray(alerts) || alerts.length === 0) {
      return;
    }

    const { lastNotifiedAlertId } = await chrome.storage.local.get(["lastNotifiedAlertId"]);

    // Only notify on the newest unread alert that we haven't notified about yet.
    const newest = alerts[0];

    if (newest.alertId && newest.alertId === lastNotifiedAlertId) {
      return;
    }

    await chrome.storage.local.set({ lastNotifiedAlertId: newest.alertId });

    const severityEmoji =
      newest.severity === "critical" ? "🚨" : newest.severity === "high" ? "⚠️" : "ℹ️";

    showNotification(
      newest.severity === "critical" ? "error" : newest.severity === "high" ? "warning" : "info",
      `${severityEmoji} ${newest.title || "Watchlist Alert"}`,
      newest.details || "A watched profile changed"
    );
  } catch (error) {
    // Quietly ignore (no auth, no convex url, etc.)
    console.warn("Watchlist check failed:", error?.message || error);
  }
});

// -----------------------------
// Notifications
// -----------------------------

function showNotification(type, title, message = "") {
  const icons = {
    success: "✅",
    warning: "⚠️",
    error: "❌",
    info: "ℹ️",
  };

  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("assets/icon-48.png"),
    title: `${icons[type] || ""} ${title}`,
    message,
    priority: type === "error" || type === "warning" ? 2 : 1,
  });
}

// -----------------------------
// Utilities
// -----------------------------

function inferPlatformFromUrl(url) {
  const value = String(url || "").toLowerCase();
  if (value.includes("facebook.com")) return "facebook";
  if (value.includes("instagram.com")) return "instagram";
  if (value.includes("twitter.com") || value.includes("x.com")) return "twitter";
  if (value.includes("linkedin.com")) return "linkedin";
  return "unknown";
}

console.log("ScamVigil extension - background service worker loaded");