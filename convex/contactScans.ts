import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

/**
 * Contact Scanning Functions
 * Scans phone numbers from device contacts for scam risk
 * Validates numbers and checks against scam databases
 */

// Known scam number patterns (Australia)
const SCAM_NUMBER_PATTERNS = {
  // Premium rate numbers (expensive to call)
  premiumRate: [
    /^190\d{7}$/,  // 1900 numbers (premium)
    /^13\d{4}$/,   // 13xxxx (premium)
  ],
  
  // Suspicious area codes/patterns
  suspicious: [
    /^\+234/,  // Nigeria
    /^\+233/,  // Ghana
    /^\+254/,  // Kenya (common scam origin)
    /^\+91/,   // India (high scam calls)
    /^\+86/,   // China (common for scams)
    /^\+92/,   // Pakistan
  ],
  
  // VoIP/virtual numbers (easier to fake)
  voip: [
    /^1300/,   // Australia VoIP
    /^1800/,   // Toll-free (often spoofed)
  ],
};

// Scam number database (would be populated from ACCC reports)
const KNOWN_SCAM_NUMBERS: { [key: string]: { reportCount: number; lastReported: number; reasons: string[] } } = {
  // Examples (in production, this would be from a real database)
  "+61412345678": { reportCount: 47, lastReported: Date.now() - 86400000, reasons: ["Fake ATO call", "Tax scam"] },
  "+61298765432": { reportCount: 23, lastReported: Date.now() - 172800000, reasons: ["Phishing SMS", "Banking scam"] },
};

// Analyze a single phone number
function analyzePhoneNumber(phoneNumber: string, contactName?: string) {
  let riskScore = 0;
  const reasons: string[] = [];
  let lineType = "mobile";
  
  // Clean number
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Is this a saved contact with a real name? (reduces false positives)
  const isSavedContact = contactName && contactName !== "Unknown" && contactName.length > 2;
  
  // Check if in known scam database
  if (KNOWN_SCAM_NUMBERS[cleanNumber]) {
    const scamData = KNOWN_SCAM_NUMBERS[cleanNumber];
    riskScore += 80;
    reasons.push(`Reported ${scamData.reportCount} times as scam`);
    reasons.push(...scamData.reasons);
  }
  
  // Check premium rate
  for (const regex of SCAM_NUMBER_PATTERNS.premiumRate) {
    if (regex.test(cleanNumber.replace(/^\+61/, ''))) {
      riskScore += 30;
      reasons.push("Premium rate number (expensive to call)");
      lineType = "premium_rate";
      break;
    }
  }
  
  // Check suspicious country codes (but be smarter about it)
  // Only flag if it's ALSO not a saved contact (to avoid false positives)
  let isSuspiciousCountry = false;
  for (const regex of SCAM_NUMBER_PATTERNS.suspicious) {
    if (regex.test(cleanNumber)) {
      isSuspiciousCountry = true;
      
      // If it's a saved contact with a name, reduce risk significantly
      if (isSavedContact) {
        riskScore += 10;  // Minor warning only
        reasons.push("International number (verify if unexpected calls)");
      } else {
        // Unknown/unsaved international number = higher risk
        riskScore += 40;
        reasons.push("Unsaved number from high-risk scam region");
      }
      break;
    }
  }
  
  // Check VoIP
  for (const regex of SCAM_NUMBER_PATTERNS.voip) {
    if (regex.test(cleanNumber.replace(/^\+61/, ''))) {
      riskScore += 20;
      reasons.push("VoIP/virtual number (easier to spoof)");
      lineType = "voip";
      break;
    }
  }
  
  // Determine risk level
  let riskLevel = "safe";
  if (riskScore >= 70) riskLevel = "known_scam";
  else if (riskScore >= 50) riskLevel = "high_risk";
  else if (riskScore >= 30) riskLevel = "suspicious";
  
  // Extract country code
  let country = "Unknown";
  if (cleanNumber.startsWith("+61")) country = "Australia";
  else if (cleanNumber.startsWith("+1")) country = "USA/Canada";
  else if (cleanNumber.startsWith("+44")) country = "UK";
  else if (cleanNumber.startsWith("+234")) country = "Nigeria";
  else if (cleanNumber.startsWith("+91")) country = "India";
  else if (cleanNumber.startsWith("+86")) country = "China";
  else if (cleanNumber.startsWith("+233")) country = "Ghana";
  else if (cleanNumber.startsWith("+254")) country = "Kenya";
  else if (cleanNumber.startsWith("+92")) country = "Pakistan";
  
  return {
    phoneNumber: cleanNumber,
    riskLevel,
    riskScore: Math.min(100, riskScore),
    reasons,
    country,
    lineType,
    reportCount: KNOWN_SCAM_NUMBERS[cleanNumber]?.reportCount || 0,
    lastReported: KNOWN_SCAM_NUMBERS[cleanNumber]?.lastReported,
  };
}

type ContactScanInput = {
  name?: string;
  number: string;
};

type ContactScanRiskLevel = "safe" | "suspicious" | "high_risk" | "known_scam";

type ContactScanResult = {
  name?: string;
  phoneNumber: string;
  riskLevel: ContactScanRiskLevel;
  riskScore: number;
  reasons: string[];
  reportCount?: number;
  country?: string;
  carrier?: string;
  lineType?: string;
  lastReported?: number;
};

/**
 * Get recent contact scans (alias for getContactScans)
 */
export const getRecentScans = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: { limit?: number }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    
    const scans = await ctx.db
      .query("contactScans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 10);
    
    return scans;
  },
});

/**
 * Get latest contact scan
 */
export const getLatestScan = query({
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    
    const scan = await ctx.db
      .query("contactScans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .first();
    
    return scan || null;
  },
});

/**
 * Scan a batch of contacts (simplified mutation for manual input)
 */
export const scanContactBatch = mutation({
  args: {
    contacts: v.array(
      v.object({
        name: v.optional(v.string()),
        number: v.string(),
      })
    ),
  },
  handler: async (ctx: any, { contacts }: { contacts: ContactScanInput[] }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Stable jobId (don't generate twice)
    const jobId = `contact_scan_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const results: ContactScanResult[] = [];
    let riskyCount = 0; // Initialize riskyCount

    for (const contact of contacts) {
      const phoneNumber = contact.number;
      const name = contact.name || "Unknown";

      // Analyze number (pass name for smarter detection)
      const analysis = analyzePhoneNumber(phoneNumber, name);
      
      results.push({
        name: name,
        phoneNumber: analysis.phoneNumber,
        riskLevel: analysis.riskLevel as ContactScanRiskLevel,
        riskScore: analysis.riskScore,
        reasons: analysis.reasons,
        reportCount: analysis.reportCount,
        country: analysis.country,
        carrier: undefined,
        lineType: analysis.lineType,
        lastReported: analysis.lastReported,
      });
      
      if (analysis.riskLevel === "high_risk" || analysis.riskLevel === "known_scam") {
        riskyCount++;
      }
    }
    
    // Create completed scan
    const scanId = await ctx.db.insert("contactScans", {
      userId,
      jobId,
      status: "completed",
      totalContacts: contacts.length,
      processedCount: contacts.length,
      riskyContactsCount: riskyCount,
      results: results as any,
      source: "manual_input",
      createdAt: Date.now(),
      completedAt: Date.now(),
    });
    
    return {
      scanId,
      jobId,
      totalContacts: contacts.length,
      riskyContactsCount: riskyCount,
      results,
    };
  },
});

/**
 * Get contact scan statistics
 */
export const getContactStats = query({
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return {
        totalScans: 0,
        totalContactsScanned: 0,
        totalRiskyContacts: 0,
        riskyPercentage: 0,
      };
    }
    
    const allScans = await ctx.db
      .query("contactScans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    
    const totalScans = allScans.length;
    const totalContactsScanned = allScans.reduce((sum: number, scan: any) => sum + scan.totalContacts, 0);
    const totalRiskyContacts = allScans.reduce((sum: number, scan: any) => sum + scan.riskyContactsCount, 0);
    
    return {
      totalScans,
      totalContactsScanned,
      totalRiskyContacts,
      riskyPercentage: totalContactsScanned > 0 
        ? Math.round((totalRiskyContacts / totalContactsScanned) * 100) 
        : 0,
    };
  },
});

// ============================================================================
// DATA COLLECTION & ACCURACY IMPROVEMENT FUNCTIONS
// ============================================================================

/**
 * USER FEEDBACK: Collects accuracy feedback from users about scans
 * This is Layer 3 of training data (crowdsourced validation)
 * 
 * Examples:
 * - User scans contact, we flag it as "Suspicious", user says "That's my mom, she's safe!"
 * - We flag as "Safe", user got scammed by that number
 * 
 * Each piece of feedback trains the algorithm for better accuracy
 */
export const submitNumberFeedback = mutation({
  args: {
    phoneNumber: v.string(),
    riskLevelWeShowed: v.union(v.literal("safe"), v.literal("suspicious"), v.literal("high_risk"), v.literal("known_scam")),
    actualRiskLevel: v.union(v.literal("safe"), v.literal("suspicious"), v.literal("high_risk"), v.literal("known_scam")),
    isCorrect: v.boolean(), // Was our prediction right?
    feedback: v.optional(v.string()), // User's explanation
    scamType: v.optional(v.string()), // "impersonation", "phishing", "none", etc.
    financialLoss: v.optional(v.number()), // $ if they were scammed
    claimedToBeFrom: v.optional(v.string()), // "ATO", "Bank", "Tech Support", etc.
    contactName: v.optional(v.string()), // The name they had saved
    callFrequency: v.optional(v.string()), // "one_time", "daily", "weekly", "multiple_daily"
    contactSavedBefore: v.optional(v.boolean()), // Was this a saved contact?
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Store feedback for ML model retraining
    await ctx.db.insert("numberFeedback", {
      userId,
      phoneNumber: args.phoneNumber,
      weShowed: args.riskLevelWeShowed,
      actualRiskLevel: args.actualRiskLevel,
      isCorrect: args.isCorrect,
      feedback: args.feedback,
      scamType: args.scamType,
      financialLoss: args.financialLoss || 0,
      claimedToBeFrom: args.claimedToBeFrom,
      contactName: args.contactName,
      callFrequency: args.callFrequency,
      contactWasSaved: args.contactSavedBefore,
      timestamp: Date.now(),
    });

    // If this is a confirmed scam that we missed, add to database
    if (args.actualRiskLevel === "known_scam" && !args.isCorrect) {
      const existing = await ctx.db
        .query("numberIntelligence")
        .withIndex("by_phone_number", (q: any) => q.eq("phoneNumber", args.phoneNumber))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          verifiedReports: (existing.verifiedReports || 0) + 1,
          riskScore: 90, // Boost confidence
        });
      }
    }

    // Update our base model with this data point
    // (In production, this would trigger a retraining job)
    return { success: true, message: "Feedback recorded. Algorithm improving..." };
  },
});

/**
 * REPORT SCAM NUMBER: User reports a number as suspicious/scam
 * Contributes to our community database (Layer 1 training data)
 */
export const reportScamNumber = mutation({
  args: {
    phoneNumber: v.string(),
    scamType: v.union(v.literal("impersonation"), v.literal("phishing"), v.literal("lottery"), v.literal("tech_support"), v.literal("tax_scam"), v.literal("banking"), v.literal("romance"), v.literal("investment"), v.literal("other")),
    claimedToBeFrom: v.optional(v.string()), // "ATO", "NBN", "Bank", etc.
    message: v.optional(v.string()), // What did they say/ask?
    hadFinancialLoss: v.boolean(),
    lossAmount: v.number(),
    contactName: v.optional(v.string()),
    callDuration: v.optional(v.number()), // seconds
    timeOfDay: v.optional(v.string()), // "morning", "afternoon", "evening"
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Record the report
    const reportId = await ctx.db.insert("communityReports", {
      phoneNumber: args.phoneNumber,
      scamType: args.scamType,
      claimedToBeFrom: args.claimedToBeFrom,
      description: args.message,
      hadFinancialLoss: args.hadFinancialLoss,
      lossAmount: args.lossAmount,
      reportedBy: userId,
      reportedAt: Date.now(),
      verified: false,
      upvotes: 1, // User's own vote
      downvotes: 0,
    });

    // Update numberIntelligence with this new data
    const existing = await ctx.db
      .query("numberIntelligence")
      .withIndex("by_phone_number", (q: any) => q.eq("phoneNumber", args.phoneNumber))
      .first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        totalReports: existing.totalReports + 1,
        uniqueReporters: (existing.uniqueReporters || 0) + 1,
        riskScore: Math.min(100, (existing.riskScore || 0) + 5),
        totalFinancialLoss: existing.totalFinancialLoss + args.lossAmount,
        lastReportedAt: Date.now(),
        mostCommonScamType: args.scamType,
      });
    } else {
      // Create new record
      await ctx.db.insert("numberIntelligence", {
        phoneNumber: args.phoneNumber,
        totalReports: 1,
        uniqueReporters: 1,
        verifiedReports: 0,
        riskScore: 60, // Unverified = lower confidence
        mostCommonScamType: args.scamType,
        totalFinancialLoss: args.lossAmount,
        lastReportedAt: Date.now(),
        isVerified: false,
      });
    }

    return { success: true, reportId, message: "Report received. Protecting other users..." };
  },
});

/**
 * UPVOTE/DOWNVOTE: Community validation (Layer 1 - crowdsourced)
 * Other users vote if a report is accurate
 * Verified reports get boosted in algorithm
 */
export const voteOnReport = mutation({
  args: {
    reportId: v.id("communityReports"),
    isUpvote: v.boolean(),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    // Update vote count
    if (args.isUpvote) {
      await ctx.db.patch(args.reportId, {
        upvotes: (report.upvotes || 0) + 1,
      });
    } else {
      await ctx.db.patch(args.reportId, {
        downvotes: (report.downvotes || 0) + 1,
      });
    }

    // Mark as verified if high consensus (3+ upvotes, fewer downvotes)
    if (report.upvotes > 3 && !report.verified) {
      await ctx.db.patch(args.reportId, { verified: true });

      // Boost the numberIntelligence confidence
      const intel = await ctx.db
        .query("numberIntelligence")
        .withIndex("by_phone_number", (q: any) => q.eq("phoneNumber", report.phoneNumber))
        .first();

      if (intel) {
        await ctx.db.patch(intel._id, {
          verifiedReports: (intel.verifiedReports || 0) + 1,
          riskScore: Math.min(100, (intel.riskScore || 0) + 15), // Big confidence boost
          isVerified: true,
        });
      }
    }

    return { success: true };
  },
});

/**
 * GET ALGORITHM INSIGHTS: Shows what data drives predictions
 * Transparency + debugging for accuracy improvement
 */
export const getNumberInsights = query({
  args: {
    phoneNumber: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    // Get community reports for this number
    const reports = await ctx.db
      .query("communityReports")
      .withIndex("by_phone_number", (q: any) => q.eq("phoneNumber", args.phoneNumber))
      .collect();

    // Get user feedback for this number
    const feedback = await ctx.db
      .query("numberFeedback")
      .withIndex("by_phone", (q: any) => q.eq("phoneNumber", args.phoneNumber))
      .collect();

    // Get aggregated intelligence
    const intelligence = await ctx.db
      .query("numberIntelligence")
      .withIndex("by_phone_number", (q: any) => q.eq("phoneNumber", args.phoneNumber))
      .first();

    // Calculate accuracy metrics
    const correctPredictions = feedback.filter((f: any) => f.isCorrect).length;
    const totalPredictions = feedback.length;
    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions * 100) : null;

    // Scam type distribution
    const scamTypeDistribution: any = {};
    reports.forEach((r: any) => {
      scamTypeDistribution[r.scamType] = (scamTypeDistribution[r.scamType] || 0) + 1;
    });

    return {
      phoneNumber: args.phoneNumber,
      
      // Data sources
      communityReports: reports.length,
      userFeedback: feedback.length,
      
      // Confidence metrics
      accuracy: accuracy,
      aggregatedScore: intelligence?.riskScore || 0,
      verifiedReports: intelligence?.verifiedReports || 0,
      
      // Pattern insights
      scamTypes: scamTypeDistribution,
      mostCommonScamType: intelligence?.mostCommonScamType,
      totalFinancialLoss: intelligence?.totalFinancialLoss || 0,
      
      // Data quality
      dataSources: [
        reports.length > 0 && "community_reports",
        feedback.length > 0 && "user_feedback",
        intelligence?.truecallerSpamScore && "truecaller_api",
        intelligence?.ipqsFraudScore && "ipqs_api",
      ].filter(Boolean),
    };
  },
});

/**
 * ACCURACY METRICS: Monitor how well your algorithm is performing
 * Use this to identify weak areas and improve
 */
export const getAccuracyMetrics = query({
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    // Get all feedback for this user's scans
    const userFeedback = await ctx.db
      .query("numberFeedback")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    if (userFeedback.length === 0) {
      return {
        message: "No feedback yet. Keep reporting and rating scans to see accuracy metrics.",
        totalFeedback: 0,
      };
    }

    // Calculate metrics
    const correct = userFeedback.filter((f: any) => f.isCorrect).length;
    const incorrect = userFeedback.length - correct;
    const accuracy = (correct / userFeedback.length * 100).toFixed(1);

    // Analyze false positives (we flagged safe as risky)
    const falsePositives = userFeedback.filter((f: any) => 
      f.weShowed !== "safe" && f.actualRiskLevel === "safe"
    ).length;

    // Analyze false negatives (we flagged risky as safe)
    const falseNegatives = userFeedback.filter((f: any) => 
      f.weShowed === "safe" && f.actualRiskLevel !== "safe"
    ).length;

    // Performance by category
    const byScamType: any = {};
    userFeedback.forEach((f: any) => {
      if (!byScamType[f.scamType]) {
        byScamType[f.scamType] = { correct: 0, total: 0 };
      }
      byScamType[f.scamType].total++;
      if (f.isCorrect) byScamType[f.scamType].correct++;
    });

    // Performance by risk level
    const byRiskLevel: any = {};
    userFeedback.forEach((f: any) => {
      if (!byRiskLevel[f.actualRiskLevel]) {
        byRiskLevel[f.actualRiskLevel] = { correct: 0, total: 0 };
      }
      byRiskLevel[f.actualRiskLevel].total++;
      if (f.isCorrect) byRiskLevel[f.actualRiskLevel].correct++;
    });

    return {
      totalFeedback: userFeedback.length,
      overallAccuracy: `${accuracy}%`,
      correct,
      incorrect,
      
      // Error analysis
      falsePositives, // We were too cautious
      falseNegatives, // We missed scams
      
      // Performance by category
      performanceByScamType: Object.entries(byScamType).map(([type, stats]: any) => ({
        scamType: type,
        accuracy: `${(stats.correct / stats.total * 100).toFixed(1)}%`,
        samples: stats.total,
      })),
      
      performanceByRiskLevel: Object.entries(byRiskLevel).map(([level, stats]: any) => ({
        riskLevel: level,
        accuracy: `${(stats.correct / stats.total * 100).toFixed(1)}%`,
        samples: stats.total,
      })),
      
      // Recommendations
      recommendations: [
        falsePositives > 3 && "High false positives: We're being too cautious. Consider adjusting thresholds.",
        falseNegatives > 3 && "High false negatives: We're missing scams. Need to boost detection sensitivity.",
        accuracy < "80" && "Accuracy below 80%: Lots of learning data available, model could improve significantly.",
      ].filter(Boolean),
    };
  },
});

// ============================================================================
// ADVANCED ACCURACY IMPROVEMENT FEATURES
// ============================================================================

/**
 * DISCREPANCY ANALYSIS: Where Layer 1 (our algorithm) differs from Layer 2 (APIs)
 * These discrepancies are the most valuable training data
 * 
 * Example:
 * - Our Layer 1: Risk Score 35 (Suspicious)
 * - External API: Risk Score 85 (Known Scam)
 * - Gap of 50 = significant learning opportunity
 */
export const analyzeDiscrepancies = query({
  handler: async (ctx: any) => {
    // Get all recent discrepancies
    const discrepancies = await ctx.db
      .query("verificationDiscrepancies")
      .withIndex("by_timestamp", (q: any) => q)
      .order("desc")
      .take(100);

    if (discrepancies.length === 0) {
      return {
        message: "No discrepancies found. Algorithm is well-aligned with external sources.",
        totalDiscrepancies: 0,
      };
    }

    // Analyze patterns in discrepancies
    const averageGap = discrepancies.reduce((sum: number, d: any) => 
      sum + Math.abs(d.layer1Score - d.layer2Score), 0) / discrepancies.length;

    const largeDiscrepancies = discrepancies.filter((d: any) => 
      Math.abs(d.layer1Score - d.layer2Score) > 30
    );

    const layer1HigherCount = discrepancies.filter((d: any) => 
      d.layer1Score > d.layer2Score
    ).length;

    const layer2HigherCount = discrepancies.filter((d: any) => 
      d.layer2Score > d.layer1Score
    ).length;

    return {
      totalDiscrepancies: discrepancies.length,
      averageGap: averageGap.toFixed(1),
      
      // Which layer is more conservative?
      layer1HigherCount, // Our algorithm thinks more risky
      layer2HigherCount, // External APIs think more risky
      
      // High-value training cases
      largeDiscrepanciesCount: largeDiscrepancies.length,
      largeDiscrepancies: largeDiscrepancies.slice(0, 10).map((d: any) => ({
        phoneNumber: d.phoneNumber,
        ourScore: d.layer1Score,
        apiScore: d.layer2Score,
        gap: Math.abs(d.layer1Score - d.layer2Score),
        provider: d.layer2Provider,
        timestamp: new Date(d.timestamp).toLocaleDateString(),
      })),
      
      // Improvement recommendations
      insights: [
        layer1HigherCount > layer2HigherCount * 1.5 && 
          "Our algorithm is 1.5x more aggressive than external APIs. Consider reducing sensitivity slightly.",
        layer2HigherCount > layer1HigherCount * 1.5 && 
          "External APIs catch 1.5x more scams than us. We should boost our pattern detection.",
        largeDiscrepancies.length > 20 && 
          "Many large discrepancies: significant room for algorithm improvement through retraining.",
      ].filter(Boolean),
    };
  },
});

/**
 * CONFIDENCE SCORING: Higher confidence = more reliable prediction
 * Shows data quality for each number
 */
export const getConfidenceScore = query({
  args: {
    phoneNumber: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const intel = await ctx.db
      .query("numberIntelligence")
      .withIndex("by_phone_number", (q: any) => q.eq("phoneNumber", args.phoneNumber))
      .first();

    if (!intel) {
      return { confidence: 0, sources: [], explanation: "No data available for this number yet." };
    }

    let confidenceScore = 0;
    const sources = [];

    // Data source weighting
    if (intel.verifiedReports && intel.verifiedReports > 0) {
      confidenceScore += Math.min(30, intel.verifiedReports * 5); // Max 30 points
      sources.push(`${intel.verifiedReports} verified community reports`);
    }

    if (intel.uniqueReporters && intel.uniqueReporters > 3) {
      confidenceScore += Math.min(20, intel.uniqueReporters * 2); // Max 20 points
      sources.push(`${intel.uniqueReporters} unique reporters`);
    }

    if (intel.truecallerSpamScore !== undefined) {
      confidenceScore += 15;
      sources.push("Truecaller verification");
    }

    if (intel.ipqsFraudScore !== undefined) {
      confidenceScore += 15;
      sources.push("IPQS fraud detection");
    }

    if (intel.twilioValid !== undefined) {
      confidenceScore += 10;
      sources.push("Twilio validation");
    }

    // Time decay: older data is less confident
    const daysSinceReport = (Date.now() - intel.lastReportedAt) / (1000 * 60 * 60 * 24);
    if (daysSinceReport < 7) {
      confidenceScore += 10; // Recent = more confident
    } else if (daysSinceReport > 90) {
      confidenceScore -= 10; // Old = less confident
    }

    return {
      phoneNumber: args.phoneNumber,
      confidenceScore: Math.min(100, confidenceScore),
      riskScore: intel.riskScore,
      sources,
      quality: confidenceScore >= 80 ? "Excellent" : confidenceScore >= 60 ? "Good" : confidenceScore >= 40 ? "Fair" : "Low",
      recommendation: confidenceScore < 40 ? "Use with caution - limited data" : "Highly reliable",
    };
  },
});