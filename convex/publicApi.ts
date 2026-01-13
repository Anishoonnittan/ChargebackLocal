import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Public API Endpoints
 * These endpoints can be called by external applications using Business API keys
 */

// Simple hash function (must match developerApi.ts)
function hashKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Verify API key and check rate limits
 */
async function verifyApiKey(ctx: any, apiKey: string, endpoint: string) {
  // Hash the provided key
  const hashedKey = hashKey(apiKey);

  // Find API key in database
  const apiKeyRecord = await ctx.db
    .query("businessApiKeys")
    .filter((q: any) => q.eq(q.field("apiKey"), hashedKey))
    .first();

  if (!apiKeyRecord) {
    throw new Error("Invalid API key");
  }

  if (!apiKeyRecord.isActive) {
    throw new Error("API key is inactive");
  }

  // Check if endpoint is allowed
  if (
    apiKeyRecord.allowedEndpoints.length > 0 &&
    !apiKeyRecord.allowedEndpoints.includes(endpoint)
  ) {
    throw new Error("Endpoint not allowed for this API key");
  }

  // Check daily quota
  if (apiKeyRecord.requestsToday >= apiKeyRecord.dailyQuota) {
    throw new Error("Daily quota exceeded");
  }

  return apiKeyRecord;
}

/**
 * Log API request for analytics
 */
async function logApiRequest(
  ctx: any,
  apiKeyId: any,
  userId: any,
  endpoint: string,
  statusCode: number,
  responseTime: number,
  errorMessage?: string
) {
  await ctx.db.insert("apiRequestLogs", {
    apiKeyId,
    userId,
    endpoint,
    method: "POST",
    statusCode,
    responseTime,
    errorMessage,
    timestamp: Date.now(),
  });

  // Update API key usage
  const apiKey = await ctx.db.get(apiKeyId);
  await ctx.db.patch(apiKeyId, {
    requestsToday: apiKey.requestsToday + 1,
    requestsThisMonth: apiKey.requestsThisMonth + 1,
    totalRequests: apiKey.totalRequests + 1,
    lastUsedAt: Date.now(),
  });
}

/**
 * PUBLIC API: Check Phone Number
 * POST /api/v1/check-phone
 */
export const checkPhoneNumber = action({
  args: {
    apiKey: v.string(),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    try {
      // Verify API key
      const apiKeyRecord = await verifyApiKey(ctx, args.apiKey, "/api/v1/check-phone");

      // Check phone number against community reports
      const reports = await ctx.db
        .query("communityReports")
        .filter((q: any) => q.eq(q.field("phoneNumber"), args.phoneNumber))
        .collect();

      // Calculate risk
      const totalReports = reports.length;
      const verifiedReports = reports.filter((r: any) => r.verified).length;
      const avgUpvotes =
        reports.length > 0
          ? reports.reduce((sum: number, r: any) => sum + r.upvotes, 0) / reports.length
          : 0;

      let riskLevel = "safe";
      let riskScore = 0;

      if (verifiedReports >= 3) {
        riskLevel = "known_scam";
        riskScore = 95;
      } else if (totalReports >= 5) {
        riskLevel = "high_risk";
        riskScore = 75;
      } else if (totalReports >= 2) {
        riskLevel = "suspicious";
        riskScore = 50;
      }

      const mostCommonScamType =
        reports.length > 0 ? reports[0].scamType : undefined;

      // Log request
      const responseTime = Date.now() - startTime;
      await logApiRequest(
        ctx,
        apiKeyRecord._id,
        apiKeyRecord.userId,
        "/api/v1/check-phone",
        200,
        responseTime
      );

      return {
        phoneNumber: args.phoneNumber,
        riskLevel,
        riskScore,
        scamType: mostCommonScamType,
        totalReports,
        verifiedReports,
        confidence: verifiedReports >= 3 ? 0.95 : totalReports >= 2 ? 0.7 : 0.5,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      // Log error
      const responseTime = Date.now() - startTime;
      await logApiRequest(
        ctx,
        null,
        null,
        "/api/v1/check-phone",
        400,
        responseTime,
        error.message
      );

      throw error;
    }
  },
});

/**
 * PUBLIC API: Check Link Safety
 * POST /api/v1/check-link
 */
export const checkLink = action({
  args: {
    apiKey: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    try {
      // Verify API key
      const apiKeyRecord = await verifyApiKey(ctx, args.apiKey, "/api/v1/check-link");

      // Check against security scans database
      const existingScans = await ctx.db
        .query("securityScans")
        .filter((q: any) =>
          q.and(
            q.eq(q.field("scanType"), "link"),
            q.eq(q.field("input"), args.url)
          )
        )
        .order("desc")
        .take(1);

      let result;
      if (existingScans.length > 0) {
        const scan = existingScans[0];
        result = {
          url: args.url,
          riskLevel: scan.riskLevel,
          riskScore: scan.score,
          findings: scan.findings,
          cached: true,
        };
      } else {
        // New scan - basic analysis
        const lowerUrl = args.url.toLowerCase();
        const suspiciousKeywords = [
          "free",
          "win",
          "prize",
          "click",
          "verify",
          "urgent",
          "account",
          "suspended",
        ];

        const hasSuspiciousKeyword = suspiciousKeywords.some((keyword) =>
          lowerUrl.includes(keyword)
        );
        const hasHttps = args.url.startsWith("https://");

        let riskLevel = "safe";
        let riskScore = 10;

        if (hasSuspiciousKeyword && !hasHttps) {
          riskLevel = "dangerous";
          riskScore = 90;
        } else if (hasSuspiciousKeyword) {
          riskLevel = "suspicious";
          riskScore = 60;
        } else if (!hasHttps) {
          riskLevel = "suspicious";
          riskScore = 40;
        }

        result = {
          url: args.url,
          riskLevel,
          riskScore,
          findings: [
            hasHttps ? "✅ Uses HTTPS" : "⚠️ No HTTPS encryption",
            hasSuspiciousKeyword ? "⚠️ Contains suspicious keywords" : "✅ No suspicious keywords",
          ],
          cached: false,
        };
      }

      // Log request
      const responseTime = Date.now() - startTime;
      await logApiRequest(
        ctx,
        apiKeyRecord._id,
        apiKeyRecord.userId,
        "/api/v1/check-link",
        200,
        responseTime
      );

      return {
        ...result,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      await logApiRequest(
        ctx,
        null,
        null,
        "/api/v1/check-link",
        400,
        responseTime,
        error.message
      );

      throw error;
    }
  },
});

/**
 * PUBLIC API: Check Email Safety
 * POST /api/v1/check-email
 */
export const checkEmail = action({
  args: {
    apiKey: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    try {
      // Verify API key
      const apiKeyRecord = await verifyApiKey(ctx, args.apiKey, "/api/v1/check-email");

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidFormat = emailRegex.test(args.email);

      if (!isValidFormat) {
        throw new Error("Invalid email format");
      }

      // Check against scam reports
      const existingScans = await ctx.db
        .query("securityScans")
        .filter((q: any) =>
          q.and(
            q.eq(q.field("scanType"), "email"),
            q.eq(q.field("input"), args.email)
          )
        )
        .order("desc")
        .take(1);

      let result;
      if (existingScans.length > 0) {
        const scan = existingScans[0];
        result = {
          email: args.email,
          riskLevel: scan.riskLevel,
          riskScore: scan.score,
          findings: scan.findings,
          cached: true,
        };
      } else {
        // New scan - basic analysis
        const domain = args.email.split("@")[1];
        const commonDomains = ["gmail.com", "outlook.com", "yahoo.com", "icloud.com"];
        const isCommonDomain = commonDomains.includes(domain);

        const suspiciousPatterns = [
          /\d{5,}/, // 5+ consecutive digits
          /[._-]{2,}/, // Multiple special chars
          /^admin@/,
          /^support@/,
          /^noreply@/,
        ];

        const hasSuspiciousPattern = suspiciousPatterns.some((pattern) =>
          pattern.test(args.email)
        );

        let riskLevel = "safe";
        let riskScore = 10;

        if (hasSuspiciousPattern) {
          riskLevel = "suspicious";
          riskScore = 60;
        }

        result = {
          email: args.email,
          riskLevel,
          riskScore,
          findings: [
            isValidFormat ? "✅ Valid email format" : "❌ Invalid format",
            isCommonDomain ? "✅ Common email provider" : "⚠️ Uncommon domain",
            hasSuspiciousPattern ? "⚠️ Suspicious pattern detected" : "✅ No suspicious patterns",
          ],
          cached: false,
        };
      }

      // Log request
      const responseTime = Date.now() - startTime;
      await logApiRequest(
        ctx,
        apiKeyRecord._id,
        apiKeyRecord.userId,
        "/api/v1/check-email",
        200,
        responseTime
      );

      return {
        ...result,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      await logApiRequest(
        ctx,
        null,
        null,
        "/api/v1/check-email",
        400,
        responseTime,
        error.message
      );

      throw error;
    }
  },
});

/**
 * PUBLIC API: Get Usage Statistics
 * GET /api/v1/usage
 */
export const getUsage = action({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Verify API key
      const apiKeyRecord = await verifyApiKey(ctx, args.apiKey, "/api/v1/usage");

      return {
        keyName: apiKeyRecord.keyName,
        environment: apiKeyRecord.environment,
        requestsToday: apiKeyRecord.requestsToday,
        requestsThisMonth: apiKeyRecord.requestsThisMonth,
        totalRequests: apiKeyRecord.totalRequests,
        dailyQuota: apiKeyRecord.dailyQuota,
        quotaRemaining: apiKeyRecord.dailyQuota - apiKeyRecord.requestsToday,
        rateLimit: apiKeyRecord.rateLimit,
        lastUsedAt: apiKeyRecord.lastUsedAt,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      throw error;
    }
  },
});