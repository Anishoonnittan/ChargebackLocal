import { v } from "convex/values";
import { action, mutation, query, internalMutation } from "./_generated/server";
import { auth } from "./auth";

/**
 * TrueProfile Pro Analytics
 * Tracks API usage, quotas, exports, and generates comprehensive reports
 */

// ============================================
// API USAGE TRACKING
// ============================================

/**
 * Track API usage (called by security scanners)
 */
export const trackApiUsage = internalMutation({
  args: {
    userId: v.id("users"),
    apiService: v.string(),
    endpoint: v.optional(v.string()),
    requestType: v.string(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    quotaRemaining: v.optional(v.number()),
    quotaLimit: v.optional(v.number()),
    costEstimate: v.optional(v.number()),
    responseTime: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.insert("apiUsage", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

/**
 * Get API usage statistics for a specific service
 */
export const getApiUsageByService = query({
  args: {
    apiService: v.string(),
    period: v.optional(v.string()), // "day", "week", "month"
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const now = Date.now();
    const periodMap: Record<string, number> = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    const periodMs = periodMap[args.period || "month"];
    const startTime = now - periodMs;

    const usage = await ctx.db
      .query("apiUsage")
      .withIndex("by_user_service", (q: any) =>
        q.eq("userId", userId).eq("apiService", args.apiService)
      )
      .filter((q: any) => q.gte(q.field("timestamp"), startTime))
      .collect();

    const totalCalls = usage.length;
    const successfulCalls = usage.filter((u: any) => u.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const totalCost = usage.reduce((sum: number, u: any) => sum + (u.costEstimate || 0), 0);
    const avgResponseTime =
      usage.length > 0
        ? usage.reduce((sum: number, u: any) => sum + (u.responseTime || 0), 0) / usage.length
        : 0;

    // Get quota info from the most recent call
    const mostRecent = usage.sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
    const quotaRemaining = mostRecent?.quotaRemaining;
    const quotaLimit = mostRecent?.quotaLimit;

    return {
      apiService: args.apiService,
      totalCalls,
      successfulCalls,
      failedCalls,
      totalCost,
      avgResponseTime: Math.round(avgResponseTime),
      quotaRemaining,
      quotaLimit,
      quotaUsed: quotaLimit && quotaRemaining ? quotaLimit - quotaRemaining : null,
      quotaPercentage:
        quotaLimit && quotaRemaining ? ((quotaLimit - quotaRemaining) / quotaLimit) * 100 : null,
    };
  },
});

/**
 * Get comprehensive API analytics for all services
 */
export const getApiAnalytics = query({
  args: {
    period: v.optional(v.string()), // "day", "week", "month"
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const now = Date.now();
    const periodMap: Record<string, number> = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    const periodMs = periodMap[args.period || "month"];
    const startTime = now - periodMs;

    const usage = await ctx.db
      .query("apiUsage")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.gte(q.field("timestamp"), startTime))
      .collect();

    // Group by service
    const byService: Record<string, any> = {};
    for (const record of usage) {
      if (!byService[record.apiService]) {
        byService[record.apiService] = {
          apiService: record.apiService,
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          totalCost: 0,
          responseTimes: [],
        };
      }
      byService[record.apiService].totalCalls++;
      if (record.success) {
        byService[record.apiService].successfulCalls++;
      } else {
        byService[record.apiService].failedCalls++;
      }
      byService[record.apiService].totalCost += record.costEstimate || 0;
      if (record.responseTime) {
        byService[record.apiService].responseTimes.push(record.responseTime);
      }
    }

    // Calculate averages and add quota info
    const services = Object.values(byService).map((service: any) => ({
      ...service,
      avgResponseTime:
        service.responseTimes.length > 0
          ? Math.round(
              service.responseTimes.reduce((a: number, b: number) => a + b, 0) /
                service.responseTimes.length
            )
          : 0,
      responseTimes: undefined,
    }));

    // Get quota info for each service
    for (const service of services) {
      const mostRecent = usage
        .filter((u: any) => u.apiService === service.apiService)
        .sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
      service.quotaRemaining = mostRecent?.quotaRemaining;
      service.quotaLimit = mostRecent?.quotaLimit;
      service.quotaUsed =
        service.quotaLimit && service.quotaRemaining
          ? service.quotaLimit - service.quotaRemaining
          : null;
      service.quotaPercentage =
        service.quotaLimit && service.quotaRemaining
          ? ((service.quotaLimit - service.quotaRemaining) / service.quotaLimit) * 100
          : null;
    }

    // Overall stats
    const totalCalls = usage.length;
    const successfulCalls = usage.filter((u: any) => u.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const totalCost = usage.reduce((sum: number, u: any) => sum + (u.costEstimate || 0), 0);

    // Group by request type
    const byRequestType: Record<string, number> = {};
    for (const record of usage) {
      byRequestType[record.requestType] = (byRequestType[record.requestType] || 0) + 1;
    }

    return {
      period: args.period || "month",
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      totalCost,
      services,
      byRequestType,
    };
  },
});

// ============================================
// EXPORT TRACKING
// ============================================

/**
 * Track CSV/PDF export
 */
export const trackExport = mutation({
  args: {
    exportType: v.string(),
    recordCount: v.number(),
    filters: v.optional(
      v.object({
        riskLevel: v.optional(v.string()),
        platform: v.optional(v.string()),
        dateRange: v.optional(v.string()),
      })
    ),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    await ctx.db.insert("exports", {
      userId,
      ...args,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get export analytics
 */
export const getExportAnalytics = query({
  args: {
    period: v.optional(v.string()), // "day", "week", "month"
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const now = Date.now();
    const periodMap: Record<string, number> = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    const periodMs = periodMap[args.period || "month"];
    const startTime = now - periodMs;

    const exports = await ctx.db
      .query("exports")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.gte(q.field("createdAt"), startTime))
      .collect();

    const totalExports = exports.length;
    const totalRecords = exports.reduce((sum: number, e: any) => sum + e.recordCount, 0);
    const totalFileSize = exports.reduce((sum: number, e: any) => sum + (e.fileSize || 0), 0);

    // Group by type
    const byType: Record<string, number> = {};
    for (const exp of exports) {
      byType[exp.exportType] = (byType[exp.exportType] || 0) + 1;
    }

    return {
      period: args.period || "month",
      totalExports,
      totalRecords,
      totalFileSize,
      byType,
      recentExports: exports
        .sort((a: any, b: any) => b.createdAt - a.createdAt)
        .slice(0, 10)
        .map((e: any) => ({
          exportType: e.exportType,
          recordCount: e.recordCount,
          createdAt: e.createdAt,
        })),
    };
  },
});

// ============================================
// QUOTA MONITORING
// ============================================

/**
 * Get quota warnings for services approaching limits
 */
export const getQuotaWarnings = query({
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    // Get most recent usage for each service
    const services = ["numverify", "google_safe_browsing", "abstract_email", "google_vision", "a0_llm"];
    const warnings = [];

    for (const service of services) {
      const recentUsage = await ctx.db
        .query("apiUsage")
        .withIndex("by_user_service", (q: any) =>
          q.eq("userId", userId).eq("apiService", service)
        )
        .order("desc")
        .first();

      if (recentUsage?.quotaLimit && recentUsage?.quotaRemaining !== undefined) {
        const quotaUsed = recentUsage.quotaLimit - recentUsage.quotaRemaining;
        const quotaPercentage = (quotaUsed / recentUsage.quotaLimit) * 100;

        if (quotaPercentage >= 80) {
          warnings.push({
            service,
            quotaUsed,
            quotaLimit: recentUsage.quotaLimit,
            quotaRemaining: recentUsage.quotaRemaining,
            quotaPercentage,
            severity: quotaPercentage >= 95 ? "critical" : quotaPercentage >= 90 ? "high" : "medium",
          });
        }
      }
    }

    return warnings;
  },
});

/**
 * Check if a service has exceeded its quota
 */
export const checkQuotaExceeded = query({
  args: { apiService: v.string() },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return { exceeded: false };

    const recentUsage = await ctx.db
      .query("apiUsage")
      .withIndex("by_user_service", (q: any) =>
        q.eq("userId", userId).eq("apiService", args.apiService)
      )
      .order("desc")
      .first();

    if (!recentUsage?.quotaLimit || recentUsage?.quotaRemaining === undefined) {
      return { exceeded: false, message: "No quota information available" };
    }

    const exceeded = recentUsage.quotaRemaining <= 0;

    return {
      exceeded,
      quotaRemaining: recentUsage.quotaRemaining,
      quotaLimit: recentUsage.quotaLimit,
      message: exceeded
        ? `⚠️ ${args.apiService} quota exceeded. Limit: ${recentUsage.quotaLimit}/month`
        : `✅ ${recentUsage.quotaRemaining} of ${recentUsage.quotaLimit} calls remaining`,
    };
  },
});

// ============================================
// DASHBOARD SUMMARY
// ============================================

/**
 * Get comprehensive analytics dashboard summary
 */
export const getAnalyticsSummary = query({
  args: {
    period: v.optional(v.string()), // "day", "week", "month"
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const now = Date.now();
    const periodMap: Record<string, number> = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    const periodMs = periodMap[args.period || "month"];
    const startTime = now - periodMs;

    // Get API usage
    const apiUsage = await ctx.db
      .query("apiUsage")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.gte(q.field("timestamp"), startTime))
      .collect();

    // Get exports
    const exports = await ctx.db
      .query("exports")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.gte(q.field("createdAt"), startTime))
      .collect();

    // Get scans
    const scans = await ctx.db
      .query("scans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.gte(q.field("createdAt"), startTime))
      .collect();

    // Get security scans
    const securityScans = await ctx.db
      .query("securityScans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.gte(q.field("scannedAt"), startTime))
      .collect();

    return {
      period: args.period || "month",
      apiUsage: {
        totalCalls: apiUsage.length,
        successfulCalls: apiUsage.filter((u: any) => u.success).length,
        failedCalls: apiUsage.filter((u: any) => !u.success).length,
        totalCost: apiUsage.reduce((sum: number, u: any) => sum + (u.costEstimate || 0), 0),
      },
      exports: {
        totalExports: exports.length,
        totalRecords: exports.reduce((sum: number, e: any) => sum + e.recordCount, 0),
      },
      scans: {
        totalScans: scans.length,
        profileScans: scans.length,
        securityScans: securityScans.length,
      },
    };
  },
});

/**
 * Alias for compatibility with Admin Panel (used by Analytics tab)
 */
export const getApiUsageStats = getApiAnalytics;