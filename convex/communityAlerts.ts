import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

/**
 * TrueProfile Pro - Community Alerts Functions
 * Real-time community safety alerts for door-to-door scams, marketplace fraud, etc.
 */

// Submit a community alert
export const submitCommunityAlert = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(), // "Door-to-door", "Marketplace", "Phone scam", "Contractor", etc.
    location: v.string(), // Suburb/region
    severity: v.string(), // "low", "medium", "high"
    type: v.string(), // "scam", "suspicious", "resolved"
  },
  returns: v.id("scamReports"),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    
    // Get user info for reporter name
    const user = userId ? await ctx.db.get(userId) : null;
    
    const reportId = await ctx.db.insert("scamReports", {
      reporterId: userId ?? undefined,
      scamType: args.category,
      description: `${args.title}\n\n${args.description}`,
      postcode: args.location,
      state: "NSW", // Default to NSW, can be extracted from location
      isVerified: false,
      status: args.type === "resolved" ? "resolved" : "submitted",
      reportedAt: Date.now(),
      additionalNotes: `Severity: ${args.severity}`,
    });
    
    return reportId;
  },
});

// Get community alerts with filtering
export const getCommunityAlerts = query({
  args: {
    filter: v.optional(v.union(v.literal("all"), v.literal("scam"), v.literal("suspicious"), v.literal("resolved"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    const reports = await ctx.db
      .query("scamReports")
      .order("desc")
      .take(limit);
    
    // Transform into alert format
    const alerts = await Promise.all(reports.map(async (report) => {
      // Get reporter info
      const reporter = report.reporterId ? await ctx.db.get(report.reporterId) : null;
      const reporterName = reporter?.name ?? "Anonymous User";
      const firstName = reporterName.split(' ')[0];
      const lastInitial = reporterName.split(' ')[1]?.[0] ?? "";
      const displayName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;
      
      // Extract title and description
      const fullText = report.description ?? "";
      const lines = fullText.split("\n\n");
      const title = lines[0] ?? "Community Alert";
      const description = lines.slice(1).join("\n\n") || fullText;
      
      // Extract severity from additionalNotes
      const severity = report.additionalNotes?.includes("high") ? "high" : 
                       report.additionalNotes?.includes("medium") ? "medium" : "low";
      
      // Determine type
      let type: "scam" | "suspicious" | "resolved" = "suspicious";
      if (report.status === "resolved") type = "resolved";
      else if (severity === "high") type = "scam";
      
      // Calculate relative time
      const now = Date.now();
      const diff = now - (report.reportedAt ?? now);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      let timestamp = "just now";
      if (days > 0) timestamp = `${days} day${days > 1 ? 's' : ''} ago`;
      else if (hours > 0) timestamp = `${hours} hour${hours > 1 ? 's' : ''} ago`;
      
      // Return without system fields
      return {
        id: report._id,
        type,
        title,
        description,
        location: report.postcode ?? "Sydney, NSW",
        reporter: displayName,
        timestamp,
        severity,
        category: report.scamType ?? "Other",
        helpfulCount: 12, // Mock for now
        commentCount: 3, // Mock for now
      };
    }));
    
    // Apply filter
    const filter = args.filter ?? "all";
    if (filter === "all") return alerts;
    return alerts.filter((alert) => alert.type === filter);
  },
});

// Get community stats
export const getCommunityStats = query({
  args: {},
  handler: async (ctx) => {
    // Count total users
    const users = await ctx.db.query("users").collect();
    const membersCount = users.length;
    
    // Count alerts from last 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentReports = await ctx.db
      .query("scamReports")
      .order("desc")
      .take(1000);
    
    const alertsToday = recentReports.filter((r) => 
      (r.reportedAt ?? 0) > oneDayAgo
    ).length;
    
    // Count "resolved" reports as scams stopped
    const scamsStopped = recentReports.filter((r) => 
      r.status === "resolved"
    ).length;
    
    return {
      membersCount,
      alertsTodayCount: alertsToday,
      scamsStoppedCount: scamsStopped,
    };
  },
});

// Vote on alert (helpful/not helpful)
export const voteOnAlert = mutation({
  args: {
    alertId: v.id("scamReports"),
    vote: v.union(v.literal("helpful"), v.literal("not_helpful")),
  },
  handler: async (ctx, args) => {
    // For now, just a placeholder
    // In production, you'd track votes in a separate table
    return null;
  },
});