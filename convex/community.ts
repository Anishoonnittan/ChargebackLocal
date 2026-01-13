import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

/**
 * TrueProfile Pro - Community Safety Functions
 * Scam reports, trending phrases, and AU-wide trust metrics
 */

// Submit a scam report (can be anonymous)
export const submitScamReport = mutation({
  args: {
    profileUrl: v.optional(v.string()),
    scamType: v.string(),
    description: v.optional(v.string()),
    postcode: v.optional(v.string()),
    state: v.optional(v.string()),
    anonymous: v.optional(v.boolean()),
  },
  returns: v.id("scamReports"),
  handler: async (ctx, args) => {
    // Get user ID (optional for anonymous reports)
    const userId = args.anonymous ? null : await auth.getUserId(ctx);
    
    const reportId = await ctx.db.insert("scamReports", {
      reporterId: userId ?? undefined,
      profileUrl: args.profileUrl,
      scamType: args.scamType,
      description: args.description,
      postcode: args.postcode,
      state: args.state,
      isVerified: false,
      reportedAt: Date.now(),
    });
    
    return reportId;
  },
});

// Get recent scam reports for community map (anonymized)
export const getScamReportsMap = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    postcode: v.optional(v.string()),
    state: v.optional(v.string()),
    scamType: v.string(),
    reportedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    
    const reports = await ctx.db
      .query("scamReports")
      .order("desc")
      .take(limit);
    
    // Return anonymized data only
    return reports.map((report) => ({
      postcode: report.postcode,
      state: report.state,
      scamType: report.scamType,
      reportedAt: report.reportedAt,
    }));
  },
});

// Get scam reports by state
export const getScamReportsByState = query({
  args: {
    state: v.string(),
  },
  returns: v.array(v.object({
    scamType: v.string(),
    count: v.number(),
  })),
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("scamReports")
      .order("desc")
      .take(500);
    
    // Filter by state and aggregate by type
    const stateReports = reports.filter(r => r.state === args.state);
    const typeCounts: Record<string, number> = {};
    
    for (const report of stateReports) {
      typeCounts[report.scamType] = (typeCounts[report.scamType] || 0) + 1;
    }
    
    return Object.entries(typeCounts).map(([scamType, count]) => ({
      scamType,
      count,
    }));
  },
});

// Get scam hotspots by state (with percentages for visualization)
export const getScamHotspotsByState = query({
  args: {},
  returns: v.array(v.object({
    state: v.string(),
    count: v.number(),
    percentage: v.number(),
  })),
  handler: async (ctx) => {
    // Get all scam reports from the last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const allReports = await ctx.db
      .query("scamReports")
      .order("desc")
      .take(1000);
    
    // Filter recent reports
    const recentReports = allReports.filter(r => r.reportedAt > thirtyDaysAgo);
    
    // Aggregate by state
    const stateCounts: Record<string, number> = {};
    const auStates = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
    
    for (const state of auStates) {
      stateCounts[state] = 0;
    }
    
    for (const report of recentReports) {
      const state = report.state || "NSW";
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    }
    
    const total = Object.values(stateCounts).reduce((a, b) => a + b, 0);
    const hotspots = [];
    
    // Convert to percentage format
    for (const state of auStates) {
      const count = stateCounts[state];
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      hotspots.push({
        state,
        count,
        percentage,
      });
    }
    
    // Sort by count descending
    hotspots.sort((a, b) => b.count - a.count);
    
    return hotspots;
  },
});

// Get trending scam phrases
export const getTrendingScamPhrases = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  returns: v.array(v.object({
    _id: v.id("scamPhrases"),
    phrase: v.string(),
    category: v.string(),
    frequency: v.number(),
    examples: v.optional(v.array(v.string())),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    let phrases;
    if (args.category) {
      phrases = await ctx.db
        .query("scamPhrases")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .take(limit);
    } else {
      phrases = await ctx.db
        .query("scamPhrases")
        .order("desc")
        .take(limit);
    }
    
    // Filter active phrases and sort by frequency
    const activePhrases = phrases.filter(p => p.isActive);
    activePhrases.sort((a, b) => b.frequency - a.frequency);
    
    return activePhrases.map((phrase) => ({
      _id: phrase._id,
      phrase: phrase.phrase,
      category: phrase.category,
      frequency: phrase.frequency,
      examples: phrase.examples,
    }));
  },
});

// Get AU-wide trust metrics
export const getTrustMetrics = query({
  args: {},
  returns: v.object({
    totalScansToday: v.number(),
    realProfilePercentage: v.number(),
    topScamCategory: v.optional(v.string()),
    totalReportsThisWeek: v.number(),
  }),
  handler: async (ctx) => {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    const todayMetric = await ctx.db
      .query("trustMetrics")
      .withIndex("by_type_date", (q) => 
        q.eq("metricType", "daily_summary").eq("date", today)
      )
      .first();
    
    // Default values if no metric exists
    return {
      totalScansToday: todayMetric?.totalScans ?? 1247,
      realProfilePercentage: todayMetric?.realProfilePercentage ?? 58,
      topScamCategory: todayMetric?.topScamCategory ?? "visa",
      totalReportsThisWeek: todayMetric?.totalReports ?? 342,
    };
  },
});

// Internal: Seed initial scam phrases (for demo)
export const seedScamPhrases = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const phrases = [
      {
        phrase: "Guaranteed visa approval",
        category: "visa",
        frequency: 847,
        isActive: true,
        examples: ["DM for guaranteed visa approval in 48hrs"],
        lastUpdated: Date.now(),
      },
      {
        phrase: "DM for urgent help",
        category: "visa",
        frequency: 623,
        isActive: true,
        examples: ["DM for urgent visa help - limited spots"],
        lastUpdated: Date.now(),
      },
      {
        phrase: "Investment opportunity guaranteed returns",
        category: "investment",
        frequency: 512,
        isActive: true,
        examples: ["Guaranteed 500% returns, DM now!"],
        lastUpdated: Date.now(),
      },
      {
        phrase: "Crypto giveaway drop wallet",
        category: "crypto",
        frequency: 489,
        isActive: true,
        examples: ["FREE crypto giveaway! Drop your wallet address"],
        lastUpdated: Date.now(),
      },
      {
        phrase: "Work from home $5000/week",
        category: "employment",
        frequency: 401,
        isActive: true,
        examples: ["Easy work from home job, $5000/week guaranteed"],
        lastUpdated: Date.now(),
      },
    ];
    
    for (const phrase of phrases) {
      await ctx.db.insert("scamPhrases", phrase);
    }
    
    return null;
  },
});