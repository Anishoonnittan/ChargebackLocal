import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Bulk Profile Scanning Functions
 * Handles CSV upload, batch processing, and comparison reports
 */

// Create a new bulk scan job
export const createBulkScan = mutation({
  args: {
    profileUrls: v.array(v.string()),
    fileName: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    // Generate unique job ID
    const jobId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create bulk scan record
    const bulkScanId = await ctx.db.insert("bulkScans", {
      userId: user._id,
      jobId,
      status: "pending",
      totalProfiles: args.profileUrls.length,
      processedCount: 0,
      successCount: 0,
      failureCount: 0,
      results: [],
      fileName: args.fileName,
      source: args.source || "manual_paste",
      createdAt: Date.now(),
    });

    // Schedule background processing
    await ctx.scheduler.runAfter(0, internal.bulkScans.processBulkScanInternal, {
      bulkScanId,
      profileUrls: args.profileUrls,
    });

    return { jobId, bulkScanId };
  },
});

// Internal function to process bulk scan (background job)
export const processBulkScanInternal = action({
  args: {
    bulkScanId: v.id("bulkScans"),
    profileUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Update status to processing
    await ctx.runMutation(internal.bulkScans.updateBulkScanStatus, {
      bulkScanId: args.bulkScanId,
      status: "processing",
      startedAt: Date.now(),
    });

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each profile sequentially
    for (let i = 0; i < args.profileUrls.length; i++) {
      const profileUrl = args.profileUrls[i];

      try {
        // Detect platform
        const platform = detectPlatform(profileUrl);

        // Perform scan using existing scan logic
        const scanResult = await ctx.runAction(api.scans.scanProfileAction, {
          profileUrl,
          advanced: false,
        });

        results.push({
          profileUrl,
          profileName: scanResult.profileName || "Unknown",
          platform,
          trustScore: scanResult.trustScore,
          riskLevel: scanResult.riskLevel,
          flags: scanResult.insights?.map((i) => i.text) || [],
          scannedAt: Date.now(),
        });

        successCount++;
      } catch (error: any) {
        results.push({
          profileUrl,
          profileName: "Unknown",
          platform: "unknown",
          trustScore: 0,
          riskLevel: "error",
          flags: [],
          scannedAt: Date.now(),
          error: error.message || "Failed to scan",
        });

        failureCount++;
      }

      // Update progress after each scan
      await ctx.runMutation(internal.bulkScans.updateBulkScanProgress, {
        bulkScanId: args.bulkScanId,
        processedCount: i + 1,
        successCount,
        failureCount,
        results,
      });
    }

    // Mark as completed
    await ctx.runMutation(internal.bulkScans.updateBulkScanStatus, {
      bulkScanId: args.bulkScanId,
      status: "completed",
      completedAt: Date.now(),
    });
  },
});

// Update bulk scan status (internal mutation)
export const updateBulkScanStatus = mutation({
  args: {
    bulkScanId: v.id("bulkScans"),
    status: v.string(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bulkScanId, {
      status: args.status,
      startedAt: args.startedAt,
      completedAt: args.completedAt,
    });
  },
});

// Update bulk scan progress (internal mutation)
export const updateBulkScanProgress = mutation({
  args: {
    bulkScanId: v.id("bulkScans"),
    processedCount: v.number(),
    successCount: v.number(),
    failureCount: v.number(),
    results: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bulkScanId, {
      processedCount: args.processedCount,
      successCount: args.successCount,
      failureCount: args.failureCount,
      results: args.results,
    });
  },
});

// Get bulk scan status (for real-time progress updates)
export const getBulkScanStatus = query({
  args: {
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const bulkScan = await ctx.db
      .query("bulkScans")
      .withIndex("by_job_id", (q) => q.eq("jobId", args.jobId))
      .unique();

    if (!bulkScan) return null;

    return {
      jobId: bulkScan.jobId,
      status: bulkScan.status,
      totalProfiles: bulkScan.totalProfiles,
      processedCount: bulkScan.processedCount,
      successCount: bulkScan.successCount,
      failureCount: bulkScan.failureCount,
      progress: Math.round((bulkScan.processedCount / bulkScan.totalProfiles) * 100),
      estimatedTimeRemaining: bulkScan.status === "processing" 
        ? Math.round((bulkScan.totalProfiles - bulkScan.processedCount) * 3) // ~3 seconds per profile
        : 0,
      createdAt: bulkScan.createdAt,
      completedAt: bulkScan.completedAt,
    };
  },
});

// Get bulk scan results (ranked comparison table)
export const getBulkScanResults = query({
  args: {
    jobId: v.string(),
    sortBy: v.optional(v.string()), // "trustScore" | "riskLevel" | "platform"
    filterRisk: v.optional(v.string()), // "real" | "suspicious" | "fake"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const bulkScan = await ctx.db
      .query("bulkScans")
      .withIndex("by_job_id", (q) => q.eq("jobId", args.jobId))
      .unique();

    if (!bulkScan) return null;

    let results = bulkScan.results;

    // Filter by risk level
    if (args.filterRisk) {
      results = results.filter((r) => r.riskLevel === args.filterRisk);
    }

    // Sort results
    if (args.sortBy === "trustScore") {
      results.sort((a, b) => b.trustScore - a.trustScore);
    } else if (args.sortBy === "riskLevel") {
      const riskOrder = { fake: 0, suspicious: 1, real: 2, error: 3 };
      results.sort((a, b) => (riskOrder[a.riskLevel as keyof typeof riskOrder] || 0) - (riskOrder[b.riskLevel as keyof typeof riskOrder] || 0));
    }

    // Calculate aggregate stats
    const stats = {
      total: bulkScan.totalProfiles,
      real: results.filter((r) => r.riskLevel === "real").length,
      suspicious: results.filter((r) => r.riskLevel === "suspicious").length,
      fake: results.filter((r) => r.riskLevel === "fake").length,
      error: results.filter((r) => r.riskLevel === "error").length,
      averageTrustScore: Math.round(
        results.reduce((sum, r) => sum + r.trustScore, 0) / results.length
      ),
    };

    return {
      jobId: bulkScan.jobId,
      status: bulkScan.status,
      fileName: bulkScan.fileName,
      results,
      stats,
      createdAt: bulkScan.createdAt,
      completedAt: bulkScan.completedAt,
    };
  },
});

// Get user's bulk scan history
export const getUserBulkScans = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) return [];

    const bulkScans = await ctx.db
      .query("bulkScans")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);

    return bulkScans.map((scan) => ({
      jobId: scan.jobId,
      fileName: scan.fileName,
      status: scan.status,
      totalProfiles: scan.totalProfiles,
      processedCount: scan.processedCount,
      successCount: scan.successCount,
      failureCount: scan.failureCount,
      createdAt: scan.createdAt,
      completedAt: scan.completedAt,
    }));
  },
});

// Cancel bulk scan
export const cancelBulkScan = mutation({
  args: {
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const bulkScan = await ctx.db
      .query("bulkScans")
      .withIndex("by_job_id", (q) => q.eq("jobId", args.jobId))
      .unique();

    if (!bulkScan) throw new Error("Bulk scan not found");

    await ctx.db.patch(bulkScan._id, {
      status: "canceled",
      completedAt: Date.now(),
    });

    return { success: true };
  },
});

// Helper function to detect platform from URL
function detectPlatform(url: string): string {
  if (url.includes("facebook.com")) return "facebook";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("linkedin.com")) return "linkedin";
  return "unknown";
}