import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";

/**
 * Real-Time Call Screening Functions
 * Detects scam calls and alerts users mid-call
 * Market: Truecaller competitor with privacy-first approach
 */

// Scam patterns detected in call conversations
const SCAM_PATTERNS = {
  urgency: {
    keywords: ["urgent", "immediately", "now", "right now", "act now", "limited time", "hurry", "quickly"],
    confidence: 0.8,
  },
  impersonation: {
    keywords: ["this is", "i'm calling from", "i represent", "ato", "nbn", "bank", "police", "government"],
    confidence: 0.9,
  },
  paymentRequest: {
    keywords: ["pay", "transfer", "send money", "credit card", "bank details", "payment", "$", "wire"],
    confidence: 0.95,
  },
  passwordRequest: {
    keywords: ["password", "pin", "code", "verify", "confirm", "security", "authentication"],
    confidence: 0.9,
  },
  personalInfoRequest: {
    keywords: ["name", "address", "date of birth", "ssn", "tax file", "license", "id number"],
    confidence: 0.85,
  },
  threatOrPressure: {
    keywords: ["cancel", "close", "lawsuit", "arrest", "jail", "fine", "penalty", "legal"],
    confidence: 0.85,
  },
  suspiciousBehavior: {
    keywords: ["hang up", "don't tell", "don't talk", "don't call", "secret", "quiet"],
    confidence: 0.8,
  },
};

// Known scam caller patterns
const KNOWN_SCAM_PATTERNS = [
  { pattern: /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/, name: "US phone number" },
  { pattern: /\+1\d{10}/, name: "International number" },
];

/**
 * Analyze call transcript for scam patterns
 */
export const analyzeCallTranscript = mutation({
  args: {
    phoneNumber: v.string(),
    transcript: v.string(),
    callerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    const userId = (await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", user.tokenIdentifier))
      .first()) as any;

    if (!userId) throw new Error("User not found");

    const transcript = args.transcript.toLowerCase();
    const detectedPatterns: any[] = [];
    let totalRiskScore = 0;

    // Detect scam patterns
    Object.entries(SCAM_PATTERNS).forEach(([type, data]: any) => {
      data.keywords.forEach((keyword: string) => {
        if (transcript.includes(keyword)) {
          const matches = transcript.split(keyword).length - 1;
          if (matches > 0) {
            detectedPatterns.push({
              type,
              confidence: data.confidence * (1 + Math.min(matches * 0.1, 0.5)),
              description: `Detected "${keyword}" ${matches} time(s)`,
              severity: data.confidence > 0.9 ? "high" : "medium",
            });
            totalRiskScore += data.confidence * 100 * matches;
          }
        }
      });
    });

    // Normalize risk score
    const riskScore = Math.min(totalRiskScore / (detectedPatterns.length || 1), 100);
    const riskLevel =
      riskScore >= 80
        ? "scam"
        : riskScore >= 60
          ? "high_risk"
          : riskScore >= 40
            ? "suspicious"
            : "safe";

    // Check against known scammer database
    const phoneNumberForLookup = normalizePhoneNumberForStorage(args.phoneNumber);
    const knownScammer = await ctx.db
      .query("communityReports")
      .withIndex("by_phone_number", (q) => q.eq("phoneNumber", phoneNumberForLookup))
      .collect();

    const isKnownScammer = knownScammer.length > 2; // Verified if 3+ reports

    // Save call screening record
    const callScreeningId = await ctx.db.insert("callScreening", {
      userId: userId._id,
      phoneNumber: args.phoneNumber,
      callerName: args.callerName,
      callDirection: "incoming",
      transcription: args.transcript,
      detectedScamPatterns: detectedPatterns,
      riskScore: Math.round(riskScore),
      riskLevel,
      isKnownScammer,
      communityReportCount: knownScammer.length,
      claimedToBeFrom: detectClaims(args.transcript),
      scamType: detectScamType(detectedPatterns),
      recommendedAction: getRiskRecommendation(riskLevel, isKnownScammer),
      callTime: Date.now(),
      callAnswered: true,
      alertShownDuringCall: riskScore > 60,
    });

    // Alert guardians if protected user
    await alertGuardians(ctx, userId._id, {
      alertType: "call_screening",
      severity: riskLevel === "scam" ? "critical" : riskLevel === "high_risk" ? "high" : "medium",
      title: `Suspicious Call Detected: ${args.phoneNumber}`,
      description: `Risk Level: ${riskLevel.toUpperCase()} (${Math.round(riskScore)}/100)`,
      scanType: "call",
      scanId: callScreeningId,
      riskScore: Math.round(riskScore),
      riskLevel,
      detectedContent: args.transcript.substring(0, 100),
    });

    return {
      callScreeningId,
      riskScore: Math.round(riskScore),
      riskLevel,
      detectedPatterns,
      isKnownScammer,
      recommendation: getRiskRecommendation(riskLevel, isKnownScammer),
    };
  },
});

/**
 * Action wrapper for call screening (used by app)
 */
export const screenCall = action({
  args: {
    phoneNumber: v.string(),
    callerName: v.string(),
    transcript: v.string(),
  },
  handler: async (ctx, args) => {
    // Call the mutation
    const result = await ctx.runMutation(api.callScreening.analyzeCallTranscript, {
      phoneNumber: args.phoneNumber,
      callerName: args.callerName,
      transcript: args.transcript,
    });

    return {
      riskScore: result.riskScore,
      patterns: result.detectedPatterns.map((p: any) => ({
        type: p.type,
        description: p.description,
        severity: p.severity,
      })),
      recommendation: getRecommendationText(result.recommendation),
      isKnownScammer: result.isKnownScammer,
    };
  },
});

/**
 * Get call screening history
 */
export const getCallScreeningHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return []; // Return empty array if not authenticated

    const userId = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", user.tokenIdentifier))
      .first();

    if (!userId) return []; // Return empty array if user not found (instead of throwing)

    return await ctx.db
      .query("callScreening")
      .withIndex("by_user", (q) => q.eq("userId", userId._id))
      .order("desc")
      .take(args.limit || 50);
  },
});

/**
 * Report call as scam
 */
export const reportCallAsScam = mutation({
  args: {
    callScreeningId: v.id("callScreening"),
    scamType: v.string(),
    lossAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    const callScreening = await ctx.db.get(args.callScreeningId);
    if (!callScreening) throw new Error("Call screening record not found");

    // Update call screening record
    await ctx.db.patch(args.callScreeningId, {
      reportedAsScam: true,
      scamType: args.scamType,
    });

    // Add to community reports
    await ctx.db.insert("communityReports", {
      phoneNumber: callScreening.phoneNumber as string,
      scamType: args.scamType,
      claimedToBeFrom: callScreening.claimedToBeFrom,
      description: callScreening.transcription,
      hadFinancialLoss: !!args.lossAmount,
      lossAmount: args.lossAmount || 0,
      reportedBy: user.tokenIdentifier,
      reportedAt: Date.now(),
      verified: false,
      upvotes: 0,
      downvotes: 0,
    });

    return { success: true, callScreeningId: args.callScreeningId };
  },
});

/**
 * Block a phone number
 */
export const blockPhoneNumber = mutation({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    // In a real app, this would integrate with OS-level call blocking
    // For now, we store in database for future integration
    const existingBlock = await ctx.db
      .query("communityReports")
      .withIndex("by_phone_number", (q) => q.eq("phoneNumber", args.phoneNumber))
      .first();

    if (!existingBlock) {
      await ctx.db.insert("communityReports", {
        phoneNumber: args.phoneNumber,
        scamType: "blocked_by_user",
        hadFinancialLoss: false,
        lossAmount: 0,
        reportedBy: "system",
        reportedAt: Date.now(),
        verified: true,
        upvotes: 0,
        downvotes: 0,
      });
    }

    return { success: true, blocked: true };
  },
});

/**
 * Get call screening settings
 */
export const getCallScreeningSettings = query({
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return null;

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", user.tokenIdentifier))
      .first();

    // If the auth identity exists but the users row hasn't been created yet,
    // return safe defaults instead of throwing.
    if (!userDoc) {
      return {
        enableCallScreening: true,
        enableRealTimeAlerts: true,
        enableTranscription: false,
        enableVoiceCloneDetection: false,
        blockHighRiskCalls: false,
        blockKnownScammers: false,
        sendAlerts: true,
        alertThreshold: "high_risk",
      };
    }

    // Return default settings (in future, store user-specific settings)
    return {
      enableCallScreening: true,
      enableRealTimeAlerts: true,
      enableTranscription: true,
      enableVoiceCloneDetection: true,
      blockHighRiskCalls: false,
      blockKnownScammers: true,
      sendAlerts: true,
      alertThreshold: "high_risk",
    };
  },
});

/**
 * Report a phone number as a scam (without needing an existing callScreening record).
 * This powers fast community reporting from the Lookup UI.
 */
export const reportPhoneNumberAsScam = mutation({
  args: {
    phoneNumber: v.string(),
    scamType: v.string(),
    claimedToBeFrom: v.optional(v.string()),
    description: v.optional(v.string()),
    hadFinancialLoss: v.optional(v.boolean()),
    lossAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    const normalizedNumber = normalizePhoneNumberForStorage(args.phoneNumber);

    await ctx.db.insert("communityReports", {
      phoneNumber: normalizedNumber,
      scamType: args.scamType,
      claimedToBeFrom: args.claimedToBeFrom,
      description: args.description,
      hadFinancialLoss: args.hadFinancialLoss ?? false,
      lossAmount: args.lossAmount ?? 0,
      reportedBy: user.tokenIdentifier,
      reportedAt: Date.now(),
      verified: false,
      upvotes: 0,
      downvotes: 0,
    });

    return { success: true };
  },
});

/**
 * iOS Tier 1: Optimized, deduped, numerically-sorted blocklist for Call Directory Extension.
 * Note: iOS Call Directory requires numbers to be in strictly increasing order.
 */
export const getOptimizedIOSBlocklist = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 80000;

    const reports = await ctx.db
      .query("communityReports")
      .withIndex("by_reported_at")
      .order("desc")
      .take(5000);

    const unique = new Set<string>();
    for (const r of reports) {
      const normalized = normalizePhoneNumberForStorage(r.phoneNumber);
      if (normalized) {
        unique.add(normalized);
      }
      if (unique.size >= limit) {
        break;
      }
    }

    // iOS wants numeric ordering (as integers). We store digits-only strings.
    return Array.from(unique)
      .filter((n) => /^\d{8,15}$/.test(n))
      .sort((a, b) => {
        // Use BigInt to avoid overflow with longer numbers.
        const aNum = BigInt(a);
        const bNum = BigInt(b);
        return aNum < bNum ? -1 : aNum > bNum ? 1 : 0;
      });
  },
});

/**
 * Android Tier 1: Optimized, deduped list for on-device cache.
 * In a native Android implementation, we'd store this in SQLite/Room.
 */
export const getOptimizedAndroidBlocklist = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200000;

    const reports = await ctx.db
      .query("communityReports")
      .withIndex("by_reported_at")
      .order("desc")
      .take(20000);

    const unique = new Set<string>();
    for (const r of reports) {
      const normalized = normalizePhoneNumberForStorage(r.phoneNumber);
      if (normalized) {
        unique.add(normalized);
      }
      if (unique.size >= limit) {
        break;
      }
    }

    return Array.from(unique);
  },
});

function normalizePhoneNumberForStorage(phoneNumber: string): string {
  // Store as digits-only so indexes match reliably.
  // We intentionally don't attempt full E.164 parsing here.
  return phoneNumber.replace(/[^0-9]/g, "");
}

/**
 * Lookup phone number against scam databases
 */
export const lookupPhoneNumber = action({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    // Check community reports
    const communityReports = await ctx.runQuery(
      api.callScreening.getCommunityReportsForNumber,
      { phoneNumber: args.phoneNumber }
    );

    const reportCount = communityReports.length;
    const isKnownScammer = reportCount >= 3;

    // Calculate scam likelihood based on reports
    let scamLikelihood = 0;
    let scamTypes: string[] = [];
    let totalLoss = 0;

    if (reportCount > 0) {
      scamLikelihood = Math.min((reportCount / 10) * 100, 100);
      scamTypes = Array.from(
        new Set<string>(communityReports.map((r: any) => String(r.scamType)))
      );
      totalLoss = communityReports.reduce((sum: number, r: any) => sum + (r.lossAmount || 0), 0);
    }

    // Determine risk level
    let riskLevel: "safe" | "suspicious" | "high_risk" | "scam";
    if (reportCount === 0) {
      riskLevel = "safe";
    } else if (reportCount >= 5) {
      riskLevel = "scam";
    } else if (reportCount >= 3) {
      riskLevel = "high_risk";
    } else {
      riskLevel = "suspicious";
    }

    return {
      phoneNumber: args.phoneNumber,
      isKnownScammer,
      reportCount,
      scamLikelihood: Math.round(scamLikelihood),
      riskLevel,
      scamTypes,
      totalReportedLoss: totalLoss,
      reports: communityReports.slice(0, 5).map((r: any) => ({
        scamType: r.scamType,
        claimedToBeFrom: r.claimedToBeFrom,
        reportedAt: r.reportedAt,
        hadFinancialLoss: r.hadFinancialLoss,
        lossAmount: r.lossAmount,
      })),
      recommendation: getLookupRecommendation(riskLevel, reportCount),
    };
  },
});

/**
 * Get community reports for a phone number
 */
export const getCommunityReportsForNumber = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    const normalized = normalizePhoneNumberForStorage(args.phoneNumber);

    const primary = await ctx.db
      .query("communityReports")
      .withIndex("by_phone_number", (q) => q.eq("phoneNumber", normalized))
      .collect();

    // Backward-compat: older rows may have stored formatted numbers.
    if (normalized !== args.phoneNumber) {
      const legacy = await ctx.db
        .query("communityReports")
        .withIndex("by_phone_number", (q) => q.eq("phoneNumber", args.phoneNumber))
        .collect();

      const merged = new Map<string, any>();
      for (const r of [...primary, ...legacy]) {
        merged.set(String(r._id), r);
      }
      return Array.from(merged.values());
    }

    return primary;
  },
});

/**
 * Helper: Detect what the caller claimed to be from
 */
function detectClaims(transcript: string): string | undefined {
  const lower = transcript.toLowerCase();
  const claims = [
    { name: "ATO", keywords: ["ato", "tax office", "australian tax"] },
    { name: "NBN", keywords: ["nbn", "national broadband"] },
    { name: "Bank", keywords: ["bank", "banking", "account", "credit card"] },
    { name: "Police", keywords: ["police", "officer", "detective"] },
    { name: "Government", keywords: ["government", "department", "agency"] },
    { name: "Tech Support", keywords: ["microsoft", "apple", "amazon", "tech support"] },
  ];

  for (const claim of claims) {
    if (claim.keywords.some((k) => lower.includes(k))) {
      return claim.name;
    }
  }

  return undefined;
}

/**
 * Helper: Detect scam type from patterns
 */
function detectScamType(patterns: any[]): string {
  const typeCount: any = {};
  patterns.forEach((p) => {
    typeCount[p.type] = (typeCount[p.type] || 0) + 1;
  });

  const topType = Object.entries(typeCount).sort((a: any, b: any) => b[1] - a[1])[0];
  return topType ? (topType[0] as string) : "unknown";
}

/**
 * Helper: Get recommendation based on risk
 */
function getRiskRecommendation(riskLevel: string, isKnownScammer: boolean): string {
  if (riskLevel === "scam" || isKnownScammer)
    return "hang_up_immediately";
  if (riskLevel === "high_risk") return "do_not_provide_information";
  if (riskLevel === "suspicious") return "verify_independently";
  return "call_appears_safe";
}

/**
 * Helper: Convert recommendation code to text
 */
function getRecommendationText(recommendation: string): string {
  const recommendations: Record<string, string> = {
    hang_up_immediately: "🚨 HANG UP IMMEDIATELY - This is a scam call. Do not provide any information.",
    do_not_provide_information: "⚠️ DO NOT provide any personal or financial information. Verify caller independently.",
    verify_independently: "⚠️ Be cautious. Verify the caller's identity by calling the organization directly using a number from their official website.",
    call_appears_safe: "✅ Call appears safe, but remain vigilant for unusual requests.",
  };
  return recommendations[recommendation] || recommendations.call_appears_safe;
}

/**
 * Helper: Get recommendation for phone lookup
 */
function getLookupRecommendation(riskLevel: string, reportCount: number): string {
  if (riskLevel === "scam") {
    return `🚨 BLOCK THIS NUMBER - ${reportCount} people have reported this as a scam. Do not answer calls from this number.`;
  }
  if (riskLevel === "high_risk") {
    return `⚠️ HIGH RISK - ${reportCount} reports of scam activity. Exercise extreme caution if you answer.`;
  }
  if (riskLevel === "suspicious") {
    return `⚠️ SUSPICIOUS - ${reportCount} report(s) received. Be very careful and verify any claims independently.`;
  }
  return "✅ No scam reports found for this number. However, always verify unexpected calls claiming to be from official organizations.";
}

/**
 * Helper: Alert guardians of suspicious call
 */
async function alertGuardians(ctx: any, userId: any, alertData: any) {
  // Find family protection records where this user is protected
  const familyProtections = await ctx.db
    .query("familyProtection")
    .withIndex("by_protected_user", (q) => q.eq("protectedUserId", userId))
    .filter((fp) => fp.isActive === true)
    .collect();

  // Send alerts to all guardians
  for (const protection of familyProtections) {
    await ctx.db.insert("guardianAlerts", {
      familyProtectionId: protection._id,
      guardianUserId: protection.guardianUserId,
      protectedUserId: userId,
      alertType: alertData.alertType,
      severity: alertData.severity,
      title: alertData.title,
      description: alertData.description,
      scanType: alertData.scanType,
      scanId: alertData.scanId,
      riskScore: alertData.riskScore,
      riskLevel: alertData.riskLevel,
      detectedContent: alertData.detectedContent,
      read: false,
      dismissed: false,
      createdAt: Date.now(),
    });
  }
}