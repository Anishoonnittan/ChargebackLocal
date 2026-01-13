import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Developer API Key Management
 * Allows users to create API keys to integrate ScamVigil into their apps
 */

// Generate a random API key
function createRandomApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "sv_";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Generate a random API secret
function createRandomApiSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let secret = "";
  for (let i = 0; i < 48; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// Simple hash function (in production, use proper hashing)
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
 * Generate a new API key
 */
export const generateApiKey = mutation({
  args: {
    keyName: v.string(),
    environment: v.string(), // "production", "development", "sandbox"
    allowedEndpoints: v.array(v.string()),
    rateLimit: v.optional(v.number()),
    dailyQuota: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user by tokenIdentifier
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Generate keys
    const apiKey = createRandomApiKey();
    const apiSecret = createRandomApiSecret();
    const hashedKey = hashKey(apiKey);

    // Default limits based on subscription tier
    const defaultRateLimit = user.subscriptionTier === "pro" ? 100 : 60; // requests per minute
    const defaultDailyQuota = user.subscriptionTier === "pro" ? 10000 : 1000; // requests per day

    // Create API key record
    const apiKeyId = await ctx.db.insert("businessApiKeys", {
      userId: user._id,
      keyName: args.keyName,
      apiKey: hashedKey,
      apiSecret: apiSecret,
      isActive: true,
      environment: args.environment,
      allowedEndpoints: args.allowedEndpoints,
      rateLimit: args.rateLimit || defaultRateLimit,
      dailyQuota: args.dailyQuota || defaultDailyQuota,
      requestsToday: 0,
      requestsThisMonth: 0,
      totalRequests: 0,
      createdAt: Date.now(),
    });

    return {
      apiKeyId,
      apiKey, // Only returned once!
      apiSecret,
      message: "⚠️ Save these credentials securely - you won't see them again!",
    };
  },
});

/**
 * List user's API keys
 */
export const listApiKeys = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) {
      return [];
    }

    const apiKeys = await ctx.db
      .query("businessApiKeys")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    // Mask API keys (show only first 8 chars)
    return apiKeys.map((key) => ({
      ...key,
      apiKey: "sv_" + "*".repeat(24) + " (hidden)",
      apiSecret: "*".repeat(48) + " (hidden)",
    }));
  },
});

/**
 * Get API key usage statistics
 */
export const getApiKeyStats = query({
  args: { apiKeyId: v.id("businessApiKeys") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const apiKey = await ctx.db.get(args.apiKeyId);
    if (!apiKey || apiKey.userId !== user._id) {
      throw new Error("API key not found or unauthorized");
    }

    // Get recent request logs
    const recentLogs = await ctx.db
      .query("apiRequestLogs")
      .filter((q) => q.eq(q.field("apiKeyId"), args.apiKeyId))
      .order("desc")
      .take(100);

    // Calculate stats
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const requestsLast24h = recentLogs.filter((log) => log.timestamp > last24Hours).length;
    
    const successfulRequests = recentLogs.filter((log) => log.statusCode === 200).length;
    const errorRequests = recentLogs.filter((log) => log.statusCode >= 400).length;
    
    const avgResponseTime = recentLogs.length > 0
      ? recentLogs.reduce((sum, log) => sum + log.responseTime, 0) / recentLogs.length
      : 0;

    // Endpoint usage breakdown
    const endpointStats: Record<string, number> = {};
    recentLogs.forEach((log) => {
      endpointStats[log.endpoint] = (endpointStats[log.endpoint] || 0) + 1;
    });

    return {
      apiKey,
      stats: {
        requestsToday: apiKey.requestsToday,
        requestsThisMonth: apiKey.requestsThisMonth,
        totalRequests: apiKey.totalRequests,
        requestsLast24h,
        successfulRequests,
        errorRequests,
        successRate: recentLogs.length > 0 ? (successfulRequests / recentLogs.length) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
        quotaUsagePercent: (apiKey.requestsToday / apiKey.dailyQuota) * 100,
      },
      endpointStats,
      recentLogs: recentLogs.slice(0, 20), // Last 20 requests
    };
  },
});

/**
 * Revoke (deactivate) an API key
 */
export const revokeApiKey = mutation({
  args: { apiKeyId: v.id("businessApiKeys") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const apiKey = await ctx.db.get(args.apiKeyId);
    if (!apiKey || apiKey.userId !== user._id) {
      throw new Error("API key not found or unauthorized");
    }

    await ctx.db.patch(args.apiKeyId, { isActive: false });

    return { success: true, message: "API key revoked successfully" };
  },
});

/**
 * Reactivate an API key
 */
export const reactivateApiKey = mutation({
  args: { apiKeyId: v.id("businessApiKeys") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const apiKey = await ctx.db.get(args.apiKeyId);
    if (!apiKey || apiKey.userId !== user._id) {
      throw new Error("API key not found or unauthorized");
    }

    await ctx.db.patch(args.apiKeyId, { isActive: true });

    return { success: true, message: "API key reactivated successfully" };
  },
});

/**
 * Delete an API key permanently
 */
export const deleteApiKey = mutation({
  args: { apiKeyId: v.id("businessApiKeys") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const apiKey = await ctx.db.get(args.apiKeyId);
    if (!apiKey || apiKey.userId !== user._id) {
      throw new Error("API key not found or unauthorized");
    }

    await ctx.db.delete(args.apiKeyId);

    return { success: true, message: "API key deleted successfully" };
  },
});

/**
 * Update API key settings
 */
export const updateApiKey = mutation({
  args: {
    apiKeyId: v.id("businessApiKeys"),
    keyName: v.optional(v.string()),
    allowedEndpoints: v.optional(v.array(v.string())),
    rateLimit: v.optional(v.number()),
    dailyQuota: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const apiKey = await ctx.db.get(args.apiKeyId);
    if (!apiKey || apiKey.userId !== user._id) {
      throw new Error("API key not found or unauthorized");
    }

    const updates: Partial<Doc<"businessApiKeys">> = {};
    if (args.keyName) updates.keyName = args.keyName;
    if (args.allowedEndpoints) updates.allowedEndpoints = args.allowedEndpoints;
    if (args.rateLimit) updates.rateLimit = args.rateLimit;
    if (args.dailyQuota) updates.dailyQuota = args.dailyQuota;

    await ctx.db.patch(args.apiKeyId, updates);

    return { success: true, message: "API key updated successfully" };
  },
});