import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Profile Monitoring Functions
 * 24/7 watchlist tracking with change detection and alerts
 */

// Add profile to watchlist
export const addToWatchlist = mutation({
  args: {
    profileUrl: v.string(),
    profileName: v.optional(v.string()),
    platform: v.string(),
    checkFrequency: v.string(), // "hourly" | "daily" | "weekly"
    initialTrustScore: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if already in watchlist
    const existing = await ctx.db
      .query("watchlist")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("profileUrl"), args.profileUrl))
      .unique();

    if (existing) {
      throw new Error("Profile already in watchlist");
    }

    // Calculate next check time
    const now = Date.now();
    const nextCheckAt = calculateNextCheck(now, args.checkFrequency);

    // Insert into watchlist
    const watchlistId = await ctx.db.insert("watchlist", {
      userId: user._id,
      profileUrl: args.profileUrl,
      profileName: args.profileName,
      platform: args.platform,
      checkFrequency: args.checkFrequency,
      lastCheckedAt: now,
      nextCheckAt,
      alertsCount: 0,
      status: "active",
      initialTrustScore: args.initialTrustScore,
      currentTrustScore: args.initialTrustScore,
      addedAt: now,
    });

    // Schedule initial snapshot
    await ctx.scheduler.runAfter(0, internal.monitoring.captureProfileSnapshot, {
      watchlistId,
    });

    return { watchlistId };
  },
});

// Remove profile from watchlist
export const removeFromWatchlist = mutation({
  args: {
    watchlistId: v.id("watchlist"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.delete(args.watchlistId);
    return { success: true };
  },
});

// Get user's watchlist
export const getWatchlist = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) return [];

    const watchlist = await ctx.db
      .query("watchlist")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return watchlist.map((item) => ({
      watchlistId: item._id,
      profileUrl: item.profileUrl,
      profileName: item.profileName,
      platform: item.platform,
      checkFrequency: item.checkFrequency,
      lastCheckedAt: item.lastCheckedAt,
      nextCheckAt: item.nextCheckAt,
      alertsCount: item.alertsCount,
      status: item.status,
      initialTrustScore: item.initialTrustScore,
      currentTrustScore: item.currentTrustScore,
      trustScoreChange: item.currentTrustScore - item.initialTrustScore,
      addedAt: item.addedAt,
    }));
  },
});

// Get profile timeline (historical snapshots)
export const getProfileTimeline = query({
  args: {
    watchlistId: v.id("watchlist"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const snapshots = await ctx.db
      .query("profileSnapshots")
      .withIndex("by_watchlist", (q) => q.eq("watchlistId", args.watchlistId))
      .order("desc")
      .take(100);

    return snapshots.map((snapshot) => ({
      snapshotId: snapshot._id,
      snapshotData: snapshot.snapshotData,
      trustScore: snapshot.trustScore,
      riskLevel: snapshot.riskLevel,
      flags: snapshot.flags,
      capturedAt: snapshot.capturedAt,
    }));
  },
});

// Get monitoring alerts
export const getMonitoringAlerts = query({
  args: {
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) return [];

    let alertsQuery = ctx.db
      .query("monitoringAlerts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    const alerts = await alertsQuery.take(50);

    // Filter unread if requested
    const filtered = args.unreadOnly ? alerts.filter((a) => !a.read) : alerts;

    return filtered.map((alert) => ({
      alertId: alert._id,
      watchlistId: alert.watchlistId,
      profileUrl: alert.profileUrl,
      profileName: alert.profileName,
      alertType: alert.alertType,
      severity: alert.severity,
      title: alert.title,
      details: alert.details,
      oldValue: alert.oldValue,
      newValue: alert.newValue,
      read: alert.read,
      dismissed: alert.dismissed,
      createdAt: alert.createdAt,
    }));
  },
});

// Mark alert as read
export const markAlertAsRead = mutation({
  args: {
    alertId: v.id("monitoringAlerts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, { read: true });
    return { success: true };
  },
});

// Dismiss alert
export const dismissAlert = mutation({
  args: {
    alertId: v.id("monitoringAlerts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, { dismissed: true, read: true });
    return { success: true };
  },
});

// Internal: Capture profile snapshot (scheduled action)
export const captureProfileSnapshot = action({
  args: {
    watchlistId: v.id("watchlist"),
  },
  handler: async (ctx, args) => {
    // Get watchlist entry
    const watchlist = await ctx.runQuery(api.monitoring.getWatchlistEntry, {
      watchlistId: args.watchlistId,
    });

    if (!watchlist) return;

    try {
      // Scan profile to get current data
      const scanResult = await ctx.runAction(api.scans.scanProfileAction, {
        profileUrl: watchlist.profileUrl,
        advanced: true,
      });

      // Store snapshot
      await ctx.runMutation(internal.monitoring.storeProfileSnapshot, {
        watchlistId: args.watchlistId,
        profileUrl: watchlist.profileUrl,
        snapshotData: {
          bio: scanResult.bio || undefined,
          followersCount: scanResult.followersCount || undefined,
          followingCount: scanResult.followingCount || undefined,
          postsCount: scanResult.postsCount || undefined,
          profilePicUrl: scanResult.profilePicUrl || undefined,
          location: scanResult.location || undefined,
          verified: scanResult.verified || undefined,
          website: scanResult.website || undefined,
          joinedDate: scanResult.joinedDate || undefined,
        },
        trustScore: scanResult.trustScore,
        riskLevel: scanResult.riskLevel,
        flags: scanResult.insights?.map((i: any) => i.text) || [],
      });

      // Get previous snapshot for comparison
      const previousSnapshot = await ctx.runQuery(
        api.monitoring.getPreviousSnapshot,
        { watchlistId: args.watchlistId }
      );

      // Detect changes and create alerts
      if (previousSnapshot) {
        await detectChangesAndAlert(ctx, watchlist, previousSnapshot, scanResult);
      }

      // Update watchlist status
      await ctx.runMutation(internal.monitoring.updateWatchlistStatus, {
        watchlistId: args.watchlistId,
        currentTrustScore: scanResult.trustScore,
        status: scanResult.riskLevel === "fake" ? "alerting" : "active",
      });
    } catch (error: any) {
      // Update status to error
      await ctx.runMutation(internal.monitoring.updateWatchlistStatus, {
        watchlistId: args.watchlistId,
        status: "error",
      });
    }
  },
});

// Internal: Store profile snapshot
export const storeProfileSnapshot = internalMutation({
  args: {
    watchlistId: v.id("watchlist"),
    profileUrl: v.string(),
    snapshotData: v.any(),
    trustScore: v.number(),
    riskLevel: v.string(),
    flags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("profileSnapshots", {
      watchlistId: args.watchlistId,
      profileUrl: args.profileUrl,
      snapshotData: args.snapshotData,
      trustScore: args.trustScore,
      riskLevel: args.riskLevel,
      flags: args.flags,
      capturedAt: Date.now(),
    });
  },
});

// Internal: Update watchlist status
export const updateWatchlistStatus = internalMutation({
  args: {
    watchlistId: v.id("watchlist"),
    currentTrustScore: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: any = {
      lastCheckedAt: Date.now(),
    };

    if (args.currentTrustScore !== undefined) {
      updateData.currentTrustScore = args.currentTrustScore;
    }

    if (args.status) {
      updateData.status = args.status;
    }

    // Calculate next check time
    const watchlist = await ctx.db.get(args.watchlistId);
    if (watchlist) {
      updateData.nextCheckAt = calculateNextCheck(
        Date.now(),
        watchlist.checkFrequency
      );
    }

    await ctx.db.patch(args.watchlistId, updateData);
  },
});

// Query: Get single watchlist entry
export const getWatchlistEntry = query({
  args: {
    watchlistId: v.id("watchlist"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.watchlistId);
  },
});

// Query: Get previous snapshot
export const getPreviousSnapshot = query({
  args: {
    watchlistId: v.id("watchlist"),
  },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("profileSnapshots")
      .withIndex("by_watchlist", (q) => q.eq("watchlistId", args.watchlistId))
      .order("desc")
      .take(2);

    return snapshots.length > 1 ? snapshots[1] : null;
  },
});

// Helper: Calculate next check time
function calculateNextCheck(now: number, frequency: string): number {
  switch (frequency) {
    case "hourly":
      return now + 60 * 60 * 1000; // 1 hour
    case "daily":
      return now + 24 * 60 * 60 * 1000; // 24 hours
    case "weekly":
      return now + 7 * 24 * 60 * 60 * 1000; // 7 days
    default:
      return now + 24 * 60 * 60 * 1000;
  }
}

// Helper: Detect changes and create alerts
async function detectChangesAndAlert(
  ctx: any,
  watchlist: any,
  previousSnapshot: any,
  currentData: any
) {
  const alerts = [];
  const prev = previousSnapshot.snapshotData;
  const curr = {
    bio: currentData.bio,
    followersCount: currentData.followersCount,
    followingCount: currentData.followingCount,
    postsCount: currentData.postsCount,
    trustScore: currentData.trustScore,
  };

  // Bio changed
  if (prev.bio !== curr.bio && prev.bio && curr.bio) {
    alerts.push({
      alertType: "bio_changed",
      severity: "medium",
      title: "Bio Changed",
      details: `Profile bio was updated`,
      oldValue: prev.bio,
      newValue: curr.bio,
    });
  }

  // Follower spike (>20% increase)
  if (
    prev.followersCount &&
    curr.followersCount &&
    curr.followersCount > prev.followersCount * 1.2
  ) {
    alerts.push({
      alertType: "follower_spike",
      severity: "high",
      title: "Suspicious Follower Spike",
      details: `Followers increased from ${prev.followersCount} to ${curr.followersCount} (+${Math.round(((curr.followersCount - prev.followersCount) / prev.followersCount) * 100)}%)`,
      oldValue: String(prev.followersCount),
      newValue: String(curr.followersCount),
    });
  }

  // Follower drop (>20% decrease)
  if (
    prev.followersCount &&
    curr.followersCount &&
    curr.followersCount < prev.followersCount * 0.8
  ) {
    alerts.push({
      alertType: "follower_drop",
      severity: "medium",
      title: "Follower Drop Detected",
      details: `Followers decreased from ${prev.followersCount} to ${curr.followersCount} (-${Math.round(((prev.followersCount - curr.followersCount) / prev.followersCount) * 100)}%)`,
      oldValue: String(prev.followersCount),
      newValue: String(curr.followersCount),
    });
  }

  // Trust score dropped significantly (>15 points)
  if (
    previousSnapshot.trustScore &&
    curr.trustScore &&
    previousSnapshot.trustScore - curr.trustScore > 15
  ) {
    alerts.push({
      alertType: "trust_drop",
      severity: "critical",
      title: "Trust Score Dropped",
      details: `Trust Score decreased from ${previousSnapshot.trustScore}% to ${curr.trustScore}% (-${previousSnapshot.trustScore - curr.trustScore} points)`,
      oldValue: String(previousSnapshot.trustScore),
      newValue: String(curr.trustScore),
    });
  }

  // Create alerts in database
  for (const alert of alerts) {
    await ctx.runMutation(internal.monitoring.createAlert, {
      userId: watchlist.userId,
      watchlistId: watchlist._id,
      profileUrl: watchlist.profileUrl,
      profileName: watchlist.profileName,
      ...alert,
    });
  }
}

// Internal: Create alert
export const createAlert = internalMutation({
  args: {
    userId: v.id("users"),
    watchlistId: v.id("watchlist"),
    profileUrl: v.string(),
    profileName: v.optional(v.string()),
    alertType: v.string(),
    severity: v.string(),
    title: v.string(),
    details: v.string(),
    oldValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("monitoringAlerts", {
      userId: args.userId,
      watchlistId: args.watchlistId,
      profileUrl: args.profileUrl,
      profileName: args.profileName,
      alertType: args.alertType,
      severity: args.severity,
      title: args.title,
      details: args.details,
      oldValue: args.oldValue,
      newValue: args.newValue,
      read: false,
      dismissed: false,
      createdAt: Date.now(),
    });

    // Increment alerts count
    const watchlist = await ctx.db.get(args.watchlistId);
    if (watchlist) {
      await ctx.db.patch(args.watchlistId, {
        alertsCount: watchlist.alertsCount + 1,
      });
    }
  },
});