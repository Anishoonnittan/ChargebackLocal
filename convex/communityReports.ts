import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Report a scam number
export const reportScamNumber = mutation({
  args: {
    phoneNumber: v.string(),
    scamType: v.union(
      v.literal("impersonation"),
      v.literal("phishing"),
      v.literal("lottery"),
      v.literal("tech_support"),
      v.literal("tax_scam"),
      v.literal("banking"),
      v.literal("romance"),
      v.literal("other")
    ),
    claimedToBeFrom: v.optional(v.string()), // e.g., "ATO", "NBN", "Bank"
    description: v.optional(v.string()),
    hadFinancialLoss: v.optional(v.boolean()),
    lossAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity().then(u => u?.subject);
    
    const reportId = await ctx.db.insert("communityReports", {
      phoneNumber: args.phoneNumber,
      scamType: args.scamType,
      claimedToBeFrom: args.claimedToBeFrom,
      description: args.description,
      hadFinancialLoss: args.hadFinancialLoss || false,
      lossAmount: args.lossAmount || 0,
      reportedBy: userId || "anonymous",
      reportedAt: Date.now(),
      verified: false,
      upvotes: 0,
      downvotes: 0,
    });
    
    // Update aggregated intelligence
    await updateNumberIntelligence(ctx, args.phoneNumber);
    
    return reportId;
  },
});

// Get community intelligence for a number
export const getNumberIntelligence = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, { phoneNumber }) => {
    const intelligence = await ctx.db
      .query("numberIntelligence")
      .withIndex("by_phone_number", (q) => q.eq("phoneNumber", phoneNumber))
      .first();
    
    return intelligence || {
      phoneNumber,
      totalReports: 0,
      uniqueReporters: 0,
      riskScore: 0,
      isVerified: false,
    };
  },
});

// Get recent reports for a number
export const getNumberReports = query({
  args: { 
    phoneNumber: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { phoneNumber, limit = 10 }) => {
    const reports = await ctx.db
      .query("communityReports")
      .withIndex("by_phone_number", (q) => q.eq("phoneNumber", phoneNumber))
      .order("desc")
      .take(limit);
    
    return reports.map(r => ({
      scamType: r.scamType,
      claimedToBeFrom: r.claimedToBeFrom,
      description: r.description,
      reportedAt: r.reportedAt,
      hadFinancialLoss: r.hadFinancialLoss,
      upvotes: r.upvotes,
      verified: r.verified,
    }));
  },
});

// Upvote a report (confirm it's accurate)
export const upvoteReport = mutation({
  args: { reportId: v.id("communityReports") },
  handler: async (ctx, { reportId }) => {
    const report = await ctx.db.get(reportId);
    if (!report) throw new Error("Report not found");
    
    await ctx.db.patch(reportId, {
      upvotes: report.upvotes + 1,
      verified: report.upvotes + 1 >= 5, // Auto-verify after 5 upvotes
    });
    
    // Update aggregated intelligence
    await updateNumberIntelligence(ctx, report.phoneNumber);
  },
});

// Helper: Update aggregated intelligence
async function updateNumberIntelligence(ctx: any, phoneNumber: string) {
  const reports = await ctx.db
    .query("communityReports")
    .withIndex("by_phone_number", (q) => q.eq("phoneNumber", phoneNumber))
    .collect();
  
  const uniqueReporters = new Set(reports.map((r: any) => r.reportedBy)).size;
  const verifiedReports = reports.filter((r: any) => r.verified).length;
  const totalLoss = reports.reduce((sum: number, r: any) => sum + (r.lossAmount || 0), 0);
  
  // Calculate risk score
  let riskScore = 0;
  if (reports.length >= 3) riskScore += 20;
  if (reports.length >= 10) riskScore += 20;
  if (uniqueReporters >= 5) riskScore += 30;
  if (verifiedReports >= 3) riskScore += 30;
  
  // Find most common scam type
  const scamTypeCounts = reports.reduce((acc: any, r: any) => {
    acc[r.scamType] = (acc[r.scamType] || 0) + 1;
    return acc;
  }, {});
  const mostCommonScamType = Object.entries(scamTypeCounts)
    .sort((a: any, b: any) => b[1] - a[1])[0]?.[0];
  
  // Upsert intelligence record
  const existing = await ctx.db
    .query("numberIntelligence")
    .withIndex("by_phone_number", (q: any) => q.eq("phoneNumber", phoneNumber))
    .first();
  
  const intelligenceData = {
    phoneNumber,
    totalReports: reports.length,
    uniqueReporters,
    verifiedReports,
    riskScore: Math.min(riskScore, 100),
    mostCommonScamType,
    totalFinancialLoss: totalLoss,
    lastReportedAt: Date.now(),
    isVerified: verifiedReports >= 3,
  };
  
  if (existing) {
    await ctx.db.patch(existing._id, intelligenceData);
  } else {
    await ctx.db.insert("numberIntelligence", intelligenceData);
  }
}