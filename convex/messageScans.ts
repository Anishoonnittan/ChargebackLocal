import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";

/**
 * Message Scanning Functions
 * Analyzes WhatsApp/SMS/text messages for scam patterns
 * Detects: Urgency, impersonation, phishing links, payment requests
 */

// Known scam patterns database
const SCAM_PATTERNS = {
  urgency: [
    /act now/i, /urgent/i, /immediately/i, /expire(s|d)? (today|soon)/i,
    /limited time/i, /last chance/i, /don't miss/i, /claim (now|today)/i,
    /within 24 hours/i, /by midnight/i, /hurry/i, /time sensitive/i
  ],
  impersonation: [
    /australian tax office/i, /ato/i, /centrelink/i, /medicare/i,
    /australia post/i, /auspost/i, /bank of (australia|queensland|melbourne)/i,
    /commonwealth bank/i, /westpac/i, /anz bank/i, /nab/i,
    /federal police/i, /immigration/i, /department of/i, /government/i,
    /your (bank|account|card)/i, /we are (your|the) bank/i
  ],
  phishing: [
    /click (here|this link|below)/i, /verify your (account|identity|details)/i,
    /suspended account/i, /unusual activity/i, /confirm your/i,
    /update your (info|details|password)/i, /security alert/i,
    /unauthorized (access|transaction)/i, /reset your password/i
  ],
  payment: [
    /send (money|payment|funds)/i, /wire transfer/i, /bitcoin/i, /crypto/i,
    /gift card/i, /western union/i, /moneygram/i, /paypal me/i,
    /venmo/i, /cash app/i, /transfer.*dollars?/i, /pay.*fee/i,
    /upfront payment/i, /processing fee/i, /tax refund/i
  ],
  lottery: [
    /won.*lottery/i, /won.*prize/i, /congratulations.*winner/i,
    /claim.*winnings/i, /million dollars/i, /inheritance/i,
    /beneficiary/i, /unclaimed (funds|money)/i
  ],
  romance: [
    /need (money|help|funds)/i, /medical emergency/i, /stranded/i,
    /ticket (to|back) home/i, /visa fee/i, /lawyer fee/i,
    /investment opportunity/i, /business proposal/i
  ],
};

// Analyze message text for scam patterns
function detectScamPatterns(text: string) {
  const patterns = [];
  
  // Check urgency
  for (const regex of SCAM_PATTERNS.urgency) {
    if (regex.test(text)) {
      patterns.push({
        type: "urgency",
        description: "Uses urgent/time-pressure language to rush your decision",
        severity: "medium" as const,
      });
      break;
    }
  }
  
  // Check impersonation
  for (const regex of SCAM_PATTERNS.impersonation) {
    if (regex.test(text)) {
      patterns.push({
        type: "impersonation",
        description: "Claims to be from government, bank, or official organization",
        severity: "high" as const,
      });
      break;
    }
  }
  
  // Check phishing
  for (const regex of SCAM_PATTERNS.phishing) {
    if (regex.test(text)) {
      patterns.push({
        type: "phishing_link",
        description: "Asks you to click links or verify personal information",
        severity: "high" as const,
      });
      break;
    }
  }
  
  // Check payment requests
  for (const regex of SCAM_PATTERNS.payment) {
    if (regex.test(text)) {
      patterns.push({
        type: "payment_request",
        description: "Requests money, gift cards, or cryptocurrency",
        severity: "high" as const,
      });
      break;
    }
  }
  
  // Check lottery scam
  for (const regex of SCAM_PATTERNS.lottery) {
    if (regex.test(text)) {
      patterns.push({
        type: "known_scam",
        description: "Lottery/prize scam pattern (you didn't enter, you can't win)",
        severity: "high" as const,
      });
      break;
    }
  }
  
  // Check romance scam
  for (const regex of SCAM_PATTERNS.romance) {
    if (regex.test(text)) {
      patterns.push({
        type: "known_scam",
        description: "Romance scam pattern (asking for money/help)",
        severity: "high" as const,
      });
      break;
    }
  }
  
  // Check grammar/spelling errors (common in scams)
  const grammarErrors = [
    /kindly/ig, // "kindly send" is common in scams
    /dear (customer|sir|madam)/i,
    /revert back/i,
    /do the needful/i,
  ];
  
  for (const regex of grammarErrors) {
    if (regex.test(text)) {
      patterns.push({
        type: "grammar_errors",
        description: "Uses non-native English phrases common in scams",
        severity: "low" as const,
      });
      break;
    }
  }
  
  return patterns;
}

// Extract URLs from text
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-z0-9-]+\.(com|net|org|au|co\.uk|io|xyz|click|link|top|info)[^\s]*)/gi;
  const matches = text.match(urlRegex) || [];
  return matches.map(url => {
    // Add https if missing
    if (!url.startsWith('http')) {
      return 'https://' + url;
    }
    return url;
  });
}

// Extract phone numbers from text
function extractPhoneNumbers(text: string): string[] {
  const phoneRegex = /(\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/g;
  const matches = text.match(phoneRegex) || [];
  return matches.map(phone => phone.replace(/[\s-()]/g, ''));
}

// Calculate risk score based on detected patterns
function calculateRiskScore(patterns: any[]): { score: number; level: string } {
  let score = 0;
  
  for (const pattern of patterns) {
    if (pattern.severity === "high") score += 35;
    else if (pattern.severity === "medium") score += 20;
    else if (pattern.severity === "low") score += 10;
  }
  
  score = Math.min(100, score);
  
  let level = "safe";
  if (score >= 70) level = "scam";
  else if (score >= 50) level = "high_risk";
  else if (score >= 30) level = "suspicious";
  
  return { score, level };
}

// Get recommendation based on risk level
function getRecommendation(riskLevel: string, patterns: any[]): string {
  const hasPhishing = patterns.some(p => p.type === "phishing_link");
  const hasPayment = patterns.some(p => p.type === "payment_request");
  const hasImpersonation = patterns.some(p => p.type === "impersonation");
  
  if (riskLevel === "scam" || (hasImpersonation && hasPayment)) {
    return "report_to_authorities";
  } else if (riskLevel === "high_risk" || hasPhishing || hasPayment) {
    return "block_sender";
  } else if (riskLevel === "suspicious") {
    return "do_not_respond";
  } else if (patterns.length > 0) {
    return "verify_manually";
  } else {
    return "safe_to_proceed";
  }
}

/**
 * Scan a message for scam patterns
 */
export const scanMessage = mutation({
  args: {
    messageText: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Detect patterns
    const patterns = detectScamPatterns(args.messageText);
    
    // Calculate risk
    const { score, level } = calculateRiskScore(patterns);
    
    // Extract links and phones
    const extractedLinks = extractUrls(args.messageText);
    const extractedPhones = extractPhoneNumbers(args.messageText);
    
    // Get recommendation
    const recommendation = getRecommendation(level, patterns);
    
    // Store scan result
    const scanId = await ctx.db.insert("messageScans", {
      userId,
      messageText: args.messageText,
      source: args.source,
      riskScore: score,
      riskLevel: level,
      detectedPatterns: patterns,
      extractedLinks: extractedLinks.length > 0 ? extractedLinks : undefined,
      extractedPhones: extractedPhones.length > 0 ? extractedPhones : undefined,
      recommendation,
      scannedAt: Date.now(),
    });
    
    return {
      scanId,
      riskScore: score,
      riskLevel: level,
      detectedPatterns: patterns,
      extractedLinks,
      extractedPhones,
      recommendation,
    };
  },
});

/**
 * Get user's message scan history
 */
export const getMessageScans = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    
    const scans = await ctx.db
      .query("messageScans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 50);
    
    return scans;
  },
});

/**
 * Get a single message scan by ID
 */
export const getMessageScan = query({
  args: { scanId: v.id("messageScans") },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const scan = await ctx.db.get(args.scanId);
    
    if (!scan || scan.userId !== userId) {
      throw new Error("Scan not found");
    }
    
    return scan;
  },
});

/**
 * Mark message as reported to authorities
 */
export const reportToAuthorities = mutation({
  args: { scanId: v.id("messageScans") },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const scan = await ctx.db.get(args.scanId);
    
    if (!scan || scan.userId !== userId) {
      throw new Error("Scan not found");
    }
    
    await ctx.db.patch(args.scanId, {
      reportedToAuthorities: true,
    });
    
    return { success: true };
  },
});

/**
 * Get message scan statistics
 */
export const getMessageStats = query({
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return {
        totalScans: 0,
        safeCount: 0,
        suspiciousCount: 0,
        highRiskCount: 0,
        scamCount: 0,
        scamsBlockedPercentage: 0,
      };
    }
    
    const allScans = await ctx.db
      .query("messageScans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    
    const totalScans = allScans.length;
    const safeCount = allScans.filter((s: any) => s.riskLevel === "safe").length;
    const suspiciousCount = allScans.filter((s: any) => s.riskLevel === "suspicious").length;
    const highRiskCount = allScans.filter((s: any) => s.riskLevel === "high_risk").length;
    const scamCount = allScans.filter((s: any) => s.riskLevel === "scam").length;
    
    return {
      totalScans,
      safeCount,
      suspiciousCount,
      highRiskCount,
      scamCount,
      scamsBlockedPercentage: totalScans > 0 ? Math.round(((highRiskCount + scamCount) / totalScans) * 100) : 0,
    };
  },
});

/**
 * Delete a message scan
 */
export const deleteMessageScan = mutation({
  args: { scanId: v.id("messageScans") },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const scan = await ctx.db.get(args.scanId);
    
    if (!scan || scan.userId !== userId) {
      throw new Error("Scan not found");
    }
    
    await ctx.db.delete(args.scanId);
    return { success: true };
  },
});

/**
 * Get user's SMS auto-scan settings
 * Returns: isEnabled, permissionGranted, alertThreshold, etc.
 */
export const getSmsAutoScanSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);

    const settings = await ctx.db
      .query("smsAutoScanSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!settings) {
      // Create default settings for new users
      const defaultSettings = {
        userId,
        isEnabled: false,
        permissionGranted: false,
        sendAlerts: true,
        alertThreshold: "high_risk",
        whitelistedContacts: [],
        whitelistedKeywords: [],
        storeScannedMessages: false,
        totalMessagesScanned: 0,
        totalScamsDetected: 0,
      };
      const newSettingsId = await ctx.db.insert("smsAutoScanSettings", defaultSettings);
      return { ...defaultSettings, _id: newSettingsId };
    }

    return settings;
  },
});

/**
 * Request SMS permission from user
 * Stores permission request timestamp for tracking
 */
export const requestSmsPermission = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);

    const existingSettings = await ctx.db
      .query("smsAutoScanSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        permissionRequestedAt: Date.now(),
      });
      return existingSettings;
    }

    const defaultSettings = {
      userId,
      isEnabled: false,
      permissionGranted: false,
      sendAlerts: true,
      alertThreshold: "high_risk",
      whitelistedContacts: [],
      whitelistedKeywords: [],
      storeScannedMessages: false,
      totalMessagesScanned: 0,
      totalScamsDetected: 0,
      permissionRequestedAt: Date.now(),
    };

    const newId = await ctx.db.insert("smsAutoScanSettings", defaultSettings);
    return { ...defaultSettings, _id: newId };
  },
});

/**
 * Grant SMS permission & enable auto-scan
 * Called after user approves permission dialog
 */
export const grantSmsPermission = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);

    const settings = await ctx.db
      .query("smsAutoScanSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!settings) {
      throw new Error("Settings not found");
    }

    await ctx.db.patch(settings._id, {
      permissionGranted: true,
      isEnabled: true,
      permissionGrantedAt: Date.now(),
      enabledAt: Date.now(),
    });

    return { success: true, message: "SMS auto-scan enabled!" };
  },
});

/**
 * Revoke SMS permission & disable auto-scan
 * User can turn this off anytime
 */
export const revokeSmsPermission = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);

    const settings = await ctx.db
      .query("smsAutoScanSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!settings) {
      throw new Error("Settings not found");
    }

    await ctx.db.patch(settings._id, {
      permissionGranted: false,
      isEnabled: false,
      disabledAt: Date.now(),
    });

    return { success: true, message: "SMS auto-scan disabled" };
  },
});

/**
 * Toggle SMS auto-scan on/off
 * User can enable/disable without re-requesting permission
 */
export const toggleSmsAutoScan = mutation({
  args: { isEnabled: v.boolean() },
  handler: async (ctx, { isEnabled }) => {
    const userId = await getAuthenticatedUser(ctx);

    const settings = await ctx.db
      .query("smsAutoScanSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!settings) {
      throw new Error("Settings not found");
    }

    if (isEnabled && !settings.permissionGranted) {
      throw new Error("Permission not granted for SMS scanning");
    }

    await ctx.db.patch(settings._id, {
      isEnabled,
      ...(isEnabled ? { enabledAt: Date.now() } : { disabledAt: Date.now() }),
    });

    return { success: true, isEnabled };
  },
});

/**
 * Update SMS auto-scan settings
 * User can customize alerts, whitelist, time windows, etc.
 */
export const updateSmsAutoScanSettings = mutation({
  args: {
    sendAlerts: v.optional(v.boolean()),
    alertThreshold: v.optional(v.string()), // "suspicious" | "high_risk" | "scam"
    whitelistedContacts: v.optional(v.array(v.string())),
    whitelistedKeywords: v.optional(v.array(v.string())),
    scanningStartTime: v.optional(v.number()), // 0-23
    scanningEndTime: v.optional(v.number()), // 0-23
    storeScannedMessages: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);

    const settings = await ctx.db
      .query("smsAutoScanSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!settings) {
      throw new Error("Settings not found");
    }

    // Validate time window
    if (args.scanningStartTime !== undefined && args.scanningEndTime !== undefined) {
      if (args.scanningStartTime < 0 || args.scanningStartTime > 23) {
        throw new Error("Start time must be between 0-23");
      }
      if (args.scanningEndTime < 0 || args.scanningEndTime > 23) {
        throw new Error("End time must be between 0-23");
      }
    }

    // Validate alert threshold
    if (args.alertThreshold && !["suspicious", "high_risk", "scam"].includes(args.alertThreshold)) {
      throw new Error("Invalid alert threshold");
    }

    const updateData = Object.fromEntries(
      Object.entries(args).filter(([, value]) => value !== undefined)
    );

    await ctx.db.patch(settings._id, updateData);

    return { success: true, message: "Settings updated" };
  },
});

/**
 * Add phone number to whitelist (won't scan messages from these contacts)
 */
export const addWhitelistContact = mutation({
  args: { phoneNumber: v.string() },
  handler: async (ctx, { phoneNumber }) => {
    const userId = await getAuthenticatedUser(ctx);

    const settings = await ctx.db
      .query("smsAutoScanSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!settings) {
      throw new Error("Settings not found");
    }

    if (settings.whitelistedContacts.includes(phoneNumber)) {
      return { success: false, message: "Already whitelisted" };
    }

    await ctx.db.patch(settings._id, {
      whitelistedContacts: [...settings.whitelistedContacts, phoneNumber],
    });

    return { success: true, message: "Contact whitelisted" };
  },
});

/**
 * Remove phone number from whitelist
 */
export const removeWhitelistContact = mutation({
  args: { phoneNumber: v.string() },
  handler: async (ctx, { phoneNumber }) => {
    const userId = await getAuthenticatedUser(ctx);

    const settings = await ctx.db
      .query("smsAutoScanSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!settings) {
      throw new Error("Settings not found");
    }

    const updated = settings.whitelistedContacts.filter((p) => p !== phoneNumber);

    await ctx.db.patch(settings._id, {
      whitelistedContacts: updated,
    });

    return { success: true, message: "Contact removed from whitelist" };
  },
});

/**
 * Process auto-scanned SMS message
 * Called by background task when SMS is received
 * Only runs if user has enabled auto-scan
 */
export const autoScanMessage = action({
  args: {
    messageText: v.string(),
    senderPhone: v.string(),
  },
  handler: async (ctx, { messageText, senderPhone }) => {
    const userId = await getAuthenticatedUser(ctx);

    // Check if user has enabled auto-scan
    const settings = await ctx.runQuery(api.messageScans.getSmsAutoScanSettings);

    if (!settings.isEnabled) {
      return { success: false, reason: "Auto-scan not enabled" };
    }

    // Check if sender is whitelisted
    if (settings.whitelistedContacts.includes(senderPhone)) {
      return { success: false, reason: "Sender is whitelisted" };
    }

    // Check if within scanning time window
    if (settings.scanningStartTime && settings.scanningEndTime) {
      const now = new Date();
      const currentHour = now.getHours();

      if (settings.scanningStartTime > settings.scanningEndTime) {
        // Window crosses midnight
        const inWindow = currentHour >= settings.scanningStartTime || currentHour < settings.scanningEndTime;
        if (!inWindow) {
          return { success: false, reason: "Outside scanning time window" };
        }
      } else {
        // Normal window
        if (currentHour < settings.scanningStartTime || currentHour >= settings.scanningEndTime) {
          return { success: false, reason: "Outside scanning time window" };
        }
      }
    }

    // Scan the message
    const scanResult = await ctx.runMutation(api.messageScans.scanMessage, {
      messageText,
      source: "sms",
    });

    // Update auto-scan stats
    await ctx.db.patch(settings._id, {
      lastScanAt: Date.now(),
      totalMessagesScanned: settings.totalMessagesScanned + 1,
      ...(["high_risk", "scam"].includes(scanResult.riskLevel) && {
        totalScamsDetected: settings.totalScamsDetected + 1,
      }),
    });

    // Check if should send alert
    const thresholdMap = {
      suspicious: ["suspicious", "high_risk", "scam"],
      high_risk: ["high_risk", "scam"],
      scam: ["scam"],
    };

    const shouldAlert = thresholdMap[settings.alertThreshold as keyof typeof thresholdMap]?.includes(
      scanResult.riskLevel
    );

    if (shouldAlert && settings.sendAlerts) {
      // Send push notification
      // (integrate with Expo Notifications)
      console.log(`[AUTO-SCAN] ALERT: ${scanResult.riskLevel} message from ${senderPhone}`);
    }

    return {
      success: true,
      riskLevel: scanResult.riskLevel,
      riskScore: scanResult.riskScore,
      alerted: shouldAlert && settings.sendAlerts,
    };
  },
});

/**
 * Get SMS auto-scan statistics for user
 */
export const getSmsAutoScanStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);

    const settings = await ctx.db
      .query("smsAutoScanSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!settings) {
      return {
        isEnabled: false,
        totalMessagesScanned: 0,
        totalScamsDetected: 0,
        lastScanAt: null,
      };
    }

    return {
      isEnabled: settings.isEnabled,
      permissionGranted: settings.permissionGranted,
      totalMessagesScanned: settings.totalMessagesScanned,
      totalScamsDetected: settings.totalScamsDetected,
      lastScanAt: settings.lastScanAt,
      detectRate: settings.totalMessagesScanned > 0 
        ? ((settings.totalScamsDetected / settings.totalMessagesScanned) * 100).toFixed(1) 
        : "0",
    };
  },
});

// Helper function to get authenticated user
async function getAuthenticatedUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}