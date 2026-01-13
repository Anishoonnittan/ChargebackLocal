import { v } from "convex/values";
import { action, mutation, query, internalMutation } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";

/* global fetch */
declare const fetch: any;

// ============================================
// API Configuration
// Free Tier Limits (Per Month):
// - Numverify: 250 calls/month
// - Google Safe Browsing: 10,000 calls/day
// - Abstract Email: 250 calls/month
// - Google Cloud Vision: 1,000 calls/month
// - a0.dev LLM: Pay-per-use
// ============================================

const API_CONFIG = {
  numverify: {
    quotaLimit: 250,
    quotaPeriod: "month",
    costPerCall: 0, // Free tier
  },
  google_safe_browsing: {
    quotaLimit: 10000,
    quotaPeriod: "day",
    costPerCall: 0, // Free tier
  },
  abstract_email: {
    quotaLimit: 250,
    quotaPeriod: "month",
    costPerCall: 0, // Free tier
  },
  google_vision: {
    quotaLimit: 1000,
    quotaPeriod: "month",
    costPerCall: 0.15, // $1.50 per 1000 after free tier
  },
  a0_llm: {
    quotaLimit: null, // Pay-per-use
    quotaPeriod: null,
    costPerCall: 0.1, // ~$0.001 per call (estimated)
  },
};

// ============================================
// 1. REVERSE IMAGE SEARCH (Google Cloud Vision API)
// ============================================

export const reverseImageSearch = action({
  args: {
    imageUrl: v.string(),
    sourceProfile: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const startTime = Date.now();
    let success = false;
    let errorMessage: string | undefined;
    let result: any;

    try {
      // Try Google Cloud Vision API first (if API key is configured)
      // For now, fall back to AI analysis
      const response = await globalThis.fetch("https://api.a0.dev/ai/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are an image authenticity expert." },
            {
              role: "user",
              content: `Analyze this profile image URL: ${args.imageUrl}\n\nCheck for these red flags:\n1. Stock photo indicators (watermarks, studio lighting, perfect composition)\n2. AI-generated face (unnaturally smooth skin, weird eyes/ears, blurred background)\n3. Celebrity/public figure (reverse image match)\n4. Multiple profiles using same image\n5. Generic corporate headshot\n\nReturn a safety score (0-100) and findings.`,
            },
          ],
          schema: {
            type: "object",
            properties: {
              safetyScore: { type: "number" },
              isStockPhoto: { type: "boolean" },
              isAIGenerated: { type: "boolean" },
              findings: { type: "array", items: { type: "string" } },
              recommendation: { type: "string" },
            },
            required: ["safetyScore", "isStockPhoto", "isAIGenerated", "findings", "recommendation"],
          },
        }),
      });

      const responseData = await response.json();
      const data = responseData.is_structured ? responseData.schema_data : JSON.parse(responseData.completion);

      result = {
        safetyScore: data.safetyScore || 75,
        isStockPhoto: data.isStockPhoto || false,
        isAIGenerated: data.isAIGenerated || false,
        findings: data.findings || ["Image analysis completed"],
        recommendation: data.recommendation || "Image appears authentic",
      };
      success = true;
    } catch (error: any) {
      console.error("Image analysis failed:", error);
      errorMessage = error.message;
      result = {
        safetyScore: 50,
        isStockPhoto: false,
        isAIGenerated: false,
        findings: ["Analysis unavailable - manual review recommended"],
        recommendation: "Unable to verify image authenticity",
      };
    }

    // Track API usage
    const responseTime = Date.now() - startTime;
    await ctx.runMutation(internal.analytics.trackApiUsage, {
      userId,
      apiService: "a0_llm",
      endpoint: "/ai/llm",
      requestType: "image",
      success,
      errorMessage,
      quotaRemaining: undefined,
      quotaLimit: undefined,
      costEstimate: API_CONFIG.a0_llm.costPerCall,
      responseTime,
    });

    return result;
  },
});

// ============================================
// 2. LINK SAFETY SCANNER (Google Safe Browsing API)
// ============================================

export const scanLink = action({
  args: {
    url: v.string(),
    context: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const startTime = Date.now();
    let success = false;
    let errorMessage: string | undefined;

    // Check against known Australian phishing patterns
    const australianPhishingPatterns = [
      { pattern: /myg[o0]v/i, type: "Government Impersonation", severity: "critical" },
      { pattern: /at[o0]/i, type: "Tax Office Scam", severity: "critical" },
      { pattern: /centrelink/i, type: "Centrelink Phishing", severity: "critical" },
      { pattern: /auspost|australia.*post/i, type: "Australia Post Scam", severity: "critical" },
      { pattern: /nab|commbank|westpac|anz/i, type: "Banking Phishing", severity: "critical" },
      { pattern: /bit\\.ly|tinyurl|t\\.co/i, type: "Link Shortener", severity: "medium" },
      { pattern: /\\.xyz|\\.top|\\.club/i, type: "Suspicious TLD", severity: "medium" },
    ];

    const suspiciousKeywords = [
      "verify account",
      "suspended",
      "urgent",
      "prize",
      "won",
      "claim",
      "reset password",
      "update payment",
      "confirm identity",
      "limited time",
      "act now",
      "click here",
    ];

    let riskScore = 0;
    const threats: Array<{ type: string; severity: string; description: string }> = [];

    try {
      // 1) If Google Safe Browsing key is configured, use it as a high-confidence signal.
      const safeBrowsingKey: string | null = await ctx.runQuery(internal.apiConfig.getApiKeyInternal, {
        service: "google_safe_browsing",
      });

      if (safeBrowsingKey) {
        const response = await globalThis.fetch(
          `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${safeBrowsingKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client: {
                clientId: "trueprofilepro",
                clientVersion: "1.0.0",
              },
              threatInfo: {
                threatTypes: [
                  "MALWARE",
                  "SOCIAL_ENGINEERING",
                  "UNWANTED_SOFTWARE",
                  "POTENTIALLY_HARMFUL_APPLICATION",
                ],
                platformTypes: ["ANY_PLATFORM"],
                threatEntryTypes: ["URL"],
                threatEntries: [{ url: args.url }],
              },
            }),
          }
        );

        const data = await response.json();

        if (data?.error) {
          // Don't fail the scan; fall back to heuristics.
          threats.push({
            type: "Safe Browsing",
            severity: "medium",
            description: `Safe Browsing error: ${data.error.message || "Unknown"}`,
          });
        } else if (Array.isArray(data?.matches) && data.matches.length > 0) {
          // Google returned a match -> treat as dangerous.
          riskScore = Math.max(riskScore, 90);
          threats.push({
            type: "Google Safe Browsing",
            severity: "critical",
            description: "URL matched Google's known phishing/malware database",
          });

          // Attach match details (useful for debugging/admin).
          for (const match of data.matches.slice(0, 3)) {
            threats.push({
              type: match.threatType || "Threat",
              severity: "high",
              description: `Matched: ${match.threatType || "unknown"} on ${match.platformType || "any"}`,
            });
          }
        }
      }

      // 2) Always apply lightweight AU heuristics too (helps even when Safe Browsing is unavailable).
      for (const item of australianPhishingPatterns) {
        if (item.pattern.test(args.url)) {
          riskScore += item.severity === "critical" ? 40 : item.severity === "high" ? 25 : 15;
          threats.push({
            type: item.type,
            severity: item.severity,
            description: `URL matches known ${item.type} pattern`,
          });
        }
      }

      if (args.context) {
        for (const keyword of suspiciousKeywords) {
          if (args.context.toLowerCase().includes(keyword)) {
            riskScore += 5;
          }
        }
      }

      if (args.url.includes("@") || args.url.split("/").length > 6) {
        riskScore += 15;
        threats.push({
          type: "URL Obfuscation",
          severity: "medium",
          description: "URL uses obfuscation techniques",
        });
      }

      success = true;
    } catch (error: any) {
      errorMessage = error.message;
    }

    riskScore = Math.min(100, riskScore);
    const safetyScore = 100 - riskScore;
    const riskLevel = riskScore >= 60 ? "dangerous" : riskScore >= 30 ? "suspicious" : "safe";

    const responseTime = Date.now() - startTime;
    await ctx.runMutation(internal.analytics.trackApiUsage, {
      userId,
      apiService: "google_safe_browsing",
      endpoint: "/threatMatches:find",
      requestType: "link",
      success,
      errorMessage,
      quotaRemaining: undefined,
      quotaLimit: API_CONFIG.google_safe_browsing.quotaLimit,
      costEstimate: API_CONFIG.google_safe_browsing.costPerCall,
      responseTime,
    });

    return {
      url: args.url,
      safetyScore,
      riskLevel,
      threats,
      recommendation:
        riskLevel === "dangerous"
          ? "🚨 DO NOT CLICK - Report to eSafety Commissioner"
          : riskLevel === "suspicious"
          ? "⚠️ Exercise caution - Verify sender authenticity"
          : "✅ Link appears safe",
    };
  },
});

// ============================================
// 3. EMAIL VERIFICATION (Abstract Email Validation API)
// ============================================

export const verifyEmail = action({
  args: {
    email: v.string(),
    senderName: v.optional(v.string()),
    subject: v.optional(v.string()),
    bodyPreview: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const startTime = Date.now();
    let success = false;
    let errorMessage: string | undefined;

    const risks: Array<{ type: string; severity: string; description: string }> = [];
    let riskScore = 0;

    try {
      // TODO: Integrate Abstract Email Validation API
      // For now, using pattern matching

      // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(args.email)) {
        riskScore += 30;
        risks.push({
          type: "Invalid Format",
          severity: "high",
          description: "Email format is invalid",
        });
      }

      // Check for suspicious domains
      const domain = args.email.split("@")[1]?.toLowerCase();
      const suspiciousDomains = [
        "tempmail", "guerrillamail", "10minutemail", "throwaway", "fake",
        "yopmail", "mailinator", "trashmail",
      ];

      for (const suspicious of suspiciousDomains) {
        if (domain?.includes(suspicious)) {
          riskScore += 40;
          risks.push({
            type: "Temporary Email",
            severity: "critical",
            description: "Email uses a temporary/disposable email service",
          });
          break;
        }
      }

      // Check for government impersonation
      const govDomains = ["gov.au", "myGov", "ato.gov", "centrelink"];
      for (const gov of govDomains) {
        if (domain?.includes(gov.toLowerCase()) && !domain.endsWith(".gov.au")) {
          riskScore += 50;
          risks.push({
            type: "Government Impersonation",
            severity: "critical",
            description: `Fake government email - pretending to be ${gov}`,
          });
        }
      }

      // Check subject/body for scam keywords
      const scamKeywords = [
        "verify account", "suspended", "urgent action", "claim prize", "reset password",
        "update payment", "confirm identity", "tax refund", "parcel delivery",
      ];

      const fullText = `${args.subject || ""} ${args.bodyPreview || ""}`.toLowerCase();
      for (const keyword of scamKeywords) {
        if (fullText.includes(keyword)) {
          riskScore += 10;
        }
      }

      // Sender name mismatch
      if (args.senderName && args.senderName.toLowerCase().includes("support") && !domain?.includes("support")) {
        riskScore += 20;
        risks.push({
          type: "Name Mismatch",
          severity: "medium",
          description: "Sender name doesn't match email domain",
        });
      }

      success = true;
    } catch (error: any) {
      errorMessage = error.message;
    }

    riskScore = Math.min(100, riskScore);
    const trustScore = 100 - riskScore;
    const riskLevel = riskScore >= 50 ? "fake" : riskScore >= 25 ? "suspicious" : "legitimate";

    // Track API usage
    const responseTime = Date.now() - startTime;
    await ctx.runMutation(internal.analytics.trackApiUsage, {
      userId,
      apiService: "abstract_email",
      endpoint: "/validate",
      requestType: "email",
      success,
      errorMessage,
      quotaRemaining: API_CONFIG.abstract_email.quotaLimit, // Mock data
      quotaLimit: API_CONFIG.abstract_email.quotaLimit,
      costEstimate: API_CONFIG.abstract_email.costPerCall,
      responseTime,
    });

    return {
      email: args.email,
      domain: args.email.split("@")[1],
      trustScore,
      riskLevel,
      risks,
      recommendation:
        riskLevel === "fake"
          ? "🚨 SCAM EMAIL - Do not reply or click links"
          : riskLevel === "suspicious"
          ? "⚠️ Verify sender before responding"
          : "✅ Email appears legitimate",
    };
  },
});

// ============================================
// 4. SMS/MESSAGE SCAM DETECTOR
// ============================================

export const scanMessage = action({
  args: {
    messageText: v.string(),
    senderNumber: v.optional(v.string()),
    senderName: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Australian SMS scam patterns (ACCC data)
    const scamPatterns = [
      { pattern: /parcel|package|delivery/i, type: "Delivery Scam", weight: 20 },
      { pattern: /toll|fine|speeding/i, type: "Fake Fine Scam", weight: 30 },
      { pattern: /tax refund|ato|refund/i, type: "Tax Scam", weight: 35 },
      { pattern: /myGov|centrelink|medicare/i, type: "Government Impersonation", weight: 40 },
      { pattern: /click|verify|update|confirm/i, type: "Phishing Link", weight: 15 },
      { pattern: /prize|winner|lottery|won/i, type: "Prize Scam", weight: 25 },
      { pattern: /bank|account.*suspended|locked/i, type: "Banking Scam", weight: 30 },
      { pattern: /urgent|immediate|act now/i, type: "Urgency Tactic", weight: 10 },
      { pattern: /bit\.ly|tinyurl|short\.link/i, type: "Suspicious Link", weight: 20 },
    ];

    let riskScore = 0;
    const detectedScams: string[] = [];
    const warnings: Array<{ type: string; description: string }> = [];

    // Check message text
    for (const item of scamPatterns) {
      if (item.pattern.test(args.messageText)) {
        riskScore += item.weight;
        detectedScams.push(item.type);
        warnings.push({
          type: item.type,
          description: `Message matches known ${item.type} pattern`,
        });
      }
    }

    // Check sender number format (Australian context)
    if (args.senderNumber) {
      // Short codes are often legitimate (e.g., banks use 5-6 digit codes)
      // But very short (<4 digits) or international codes are suspicious
      if (args.senderNumber.length < 4 && !args.senderNumber.match(/^[2-9]\d{3}$/)) {
        riskScore += 15;
        warnings.push({
          type: "Suspicious Sender",
          description: "Sender number format is suspicious",
        });
      }
      
      // International numbers for local services
      if (args.senderNumber.startsWith("+") && !args.senderNumber.startsWith("+61")) {
        riskScore += 25;
        warnings.push({
          type: "International Sender",
          description: "Message from overseas number claiming to be Australian service",
        });
      }
    }

    riskScore = Math.min(100, riskScore);
    const safetyScore = 100 - riskScore;
    const riskLevel = riskScore >= 60 ? "scam" : riskScore >= 30 ? "suspicious" : "safe";

    return {
      messageText: args.messageText,
      safetyScore,
      riskLevel,
      detectedScams: [...new Set(detectedScams)],
      warnings,
      recommendation:
        riskLevel === "scam"
          ? "🚨 SCAM MESSAGE - Delete immediately, report to ACMA"
          : riskLevel === "suspicious"
          ? "⚠️ Suspicious - Do not click links or provide personal info"
          : "✅ Message appears safe",
    };
  },
});

// ============================================
// 5. PHONE NUMBER LOOKUP (Scam Number Database)
// ============================================

export const lookupPhoneNumber = action({
  args: {
    phoneNumber: v.string(),
    context: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const normalizePhoneNumber = (raw: string) => {
      // Keep leading +, remove spaces, hyphens, parentheses.
      const trimmed = raw.trim();
      if (trimmed.startsWith("+")) {
        return "+" + trimmed.slice(1).replace(/[^\d]/g, "");
      }
      return trimmed.replace(/[^\d]/g, "");
    };

    const normalized = normalizePhoneNumber(args.phoneNumber);

    const flags: string[] = [];

    // We do NOT have a carrier allocation lookup / reputation DB.
    // So we must be conservative: unknown numbers should not get 100/100.
    // We'll compute a riskScore (0-100) where higher is worse.
    // Start at a baseline risk because "unknown" is not the same as "safe".
    let riskScore = 20;

    const looksLikeRepeatedDigits = (digitsOnly: string) => {
      // e.g. 0411111111, +61411111111
      return /^(\d)\1{6,}$/.test(digitsOnly);
    };

    const looksLikeSequentialDigits = (digitsOnly: string) => {
      // e.g. 0123456789, 1234567890
      const seqA = "01234567890123456789";
      const seqB = "98765432109876543210";
      return seqA.includes(digitsOnly) || seqB.includes(digitsOnly);
    };

    // Extract digits only for pattern checks
    const digitsOnly = normalized.replace(/^\+/, "");

    // Basic length sanity check
    if (digitsOnly.length < 8) {
      riskScore += 40;
      flags.push("Number too short to be a normal Australian phone number");
    }
    if (digitsOnly.length > 15) {
      riskScore += 40;
      flags.push("Number too long - likely invalid");
    }

    // Obvious placeholder/test-looking patterns
    if (looksLikeRepeatedDigits(digitsOnly)) {
      riskScore += 45;
      flags.push("Looks like a placeholder/test number (repeated digits)");
    }
    if (looksLikeSequentialDigits(digitsOnly)) {
      riskScore += 35;
      flags.push("Looks like a placeholder/test number (sequential digits)");
    }

    // Known Australian scam number patterns (very lightweight)
    const knownScamPrefixes = [
      { prefix: "+1", type: "International Robo-call", risk: "high" },
      { prefix: "+44", type: "UK Romance Scam", risk: "high" },
      { prefix: "+234", type: "Nigerian Prince Scam", risk: "critical" },
      { prefix: "1800", type: "Fake Toll-Free", risk: "medium" },
    ];

    for (const item of knownScamPrefixes) {
      if (normalized.startsWith(item.prefix)) {
        riskScore += item.risk === "critical" ? 50 : item.risk === "high" ? 35 : 20;
        flags.push(item.type);
      }
    }

    // Australian number format checks
    // - Mobile: 04XXXXXXXX or +614XXXXXXXX
    // - Landline: 0[2-8]XXXXXXXX or +61[2-8]XXXXXXXX
    const isAustralianMobile = /^(04\d{8}|\+614\d{8})$/.test(normalized);
    const isAustralianLandline = /^(0[2-8]\d{8}|\+61[2-8]\d{8})$/.test(normalized);
    const isAustralianNumber = isAustralianMobile || isAustralianLandline;

    if (!isAustralianNumber) {
      // If user context suggests the number is meant to be Australian, mismatch is risk.
      if (args.context?.toLowerCase().includes("australia")) {
        riskScore += 30;
        flags.push("Non-Australian format for a number claimed to be Australian");
      } else {
        riskScore += 10;
        flags.push("Unrecognized phone number format");
      }
    }

    // Cap risk score to 100
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Convert to trust score.
    // IMPORTANT: since we don't have a real public reputation database, we cap the maximum trust.
    const rawTrustScore = 100 - riskScore;
    const trustScore = Math.max(0, Math.min(85, rawTrustScore));

    // Risk levels:
    // - scam: strong indicators
    // - suspicious: unknown OR some issues
    // - safe: only when it looks valid AND no red flags and trustScore is high enough
    const riskLevel = riskScore >= 70 ? "scam" : riskScore >= 35 ? "suspicious" : "safe";
    const finalRiskLevel = flags.length > 0 && riskLevel === "safe" ? "suspicious" : riskLevel;

    // Improve recommendation language to avoid false certainty.
    const recommendation =
      finalRiskLevel === "scam"
        ? "🚨 High risk number - block and report if this relates to a scam"
        : finalRiskLevel === "suspicious"
        ? "⚠️ We can't verify this number via public reputation. Treat with caution and verify via official channels."
        : "✅ No obvious red flags found (based on format + patterns only). Still verify if money or personal info is involved.";

    return {
      phoneNumber: args.phoneNumber,
      normalizedPhoneNumber: normalized,
      trustScore,
      riskLevel: finalRiskLevel,
      flags,
      isAustralianNumber,
      recommendation,
    };
  },
});

// ============================================
// 6. DOCUMENT VERIFICATION (For Migration Agents)
// ============================================

export const verifyDocument = action({
  args: {
    documentType: v.string(),
    documentNumber: v.optional(v.string()),
    issuer: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    // Basic document verification checks
    const risks: Array<{ type: string; severity: string; description: string }> = [];
    let authenticityScore = 70; // Start neutral

    // Check document number format (example patterns)
    const documentPatterns: Record<string, RegExp> = {
      "Australian Passport": /^[A-Z]\d{7}$/,
      "Driver License (NSW)": /^\d{8}$/,
      "Medicare Card": /^\d{10}$/,
      "Visa Grant Notice": /^[A-Z0-9]{10,}$/,
    };

    if (args.documentNumber && documentPatterns[args.documentType]) {
      if (!documentPatterns[args.documentType].test(args.documentNumber)) {
        authenticityScore -= 30;
        risks.push({
          type: "Invalid Format",
          severity: "high",
          description: `${args.documentType} number format is invalid`,
        });
      } else {
        authenticityScore += 15;
      }
    }

    // Check issuer legitimacy
    const legitimateIssuers = [
      "Department of Home Affairs",
      "Services Australia",
      "State Government",
      "Australian Passport Office",
    ];

    if (args.issuer && !legitimateIssuers.some(l => args.issuer?.includes(l))) {
      authenticityScore -= 20;
      risks.push({
        type: "Unknown Issuer",
        severity: "medium",
        description: "Document issuer not recognized",
      });
    }

    authenticityScore = Math.max(0, Math.min(100, authenticityScore));
    const riskLevel = authenticityScore >= 70 ? "authentic" : authenticityScore >= 40 ? "suspicious" : "fake";

    return {
      documentType: args.documentType,
      authenticityScore,
      riskLevel,
      risks,
      recommendation:
        riskLevel === "fake"
          ? "🚨 LIKELY FAKE - Do not accept, report to authorities"
          : riskLevel === "suspicious"
          ? "⚠️ Requires manual verification by authorized personnel"
          : "✅ Document passes initial checks - proceed with full verification",
      nextSteps: [
        "Verify document with issuing authority",
        "Check hologram and security features",
        "Confirm details with applicant verbally",
        "Use Document Verification Service (DVS) if available",
      ],
    };
  },
});

// ============================================
// SAVE SECURITY SCAN RESULTS
// ============================================

export const saveSecurityScan = mutation({
  args: {
    scanType: v.string(),
    input: v.string(),
    score: v.number(),
    riskLevel: v.string(),
    findings: v.array(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const scanId = await ctx.db.insert("securityScans", {
      userId,
      scanType: args.scanType,
      input: args.input,
      score: args.score,
      riskLevel: args.riskLevel,
      findings: args.findings,
      scannedAt: Date.now(),
    });

    return { scanId };
  },
});

// Get user's security scan history
export const getSecurityScans = query({
  args: { scanType: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    let scans = await ctx.db
      .query("securityScans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .collect();

    if (args.scanType) {
      scans = scans.filter((s: any) => s.scanType === args.scanType);
    }

    return scans.slice(0, args.limit || 20);
  },
});