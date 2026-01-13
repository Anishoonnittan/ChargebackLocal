import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Convex actions run on the server (Node) where `fetch` and `URLSearchParams` exist.
// Our TS lint config doesn't include DOM libs, so we declare them here to keep builds green.
/* global fetch, URLSearchParams */
declare const fetch: any;
declare const URLSearchParams: any;

type AnalysisResult = {
  trustScore: number;
  riskLevel: "real" | "suspicious" | "fake";
  insights: Array<{ type: "warning" | "info" | "positive"; text: string }>;
  scamPhrases: string[];
  reasoning: string;
};

async function analyzeProfileWithAI(args: {
  profileUrl: string;
  platform: string;
  profileData?: {
    accountAge?: string;
    followerCount?: number;
    followingCount?: number;
    postCount?: number;
    bio?: string;
    recentActivity?: string;
  };
}): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(args.profileUrl, args.platform, args.profileData);

  const schema = {
    type: "object",
    properties: {
      trustScore: {
        type: "number",
        description: "Trust score from 0-100",
      },
      riskLevel: {
        type: "string",
        enum: ["real", "suspicious", "fake"],
      },
      insights: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["warning", "info", "positive"] },
            text: { type: "string" },
          },
          required: ["type", "text"],
        },
      },
      scamPhrases: {
        type: "array",
        items: { type: "string" },
      },
      reasoning: { type: "string" },
    },
    required: ["trustScore", "riskLevel", "insights", "scamPhrases", "reasoning"],
  };

  try {
    const response = await globalThis.fetch("https://api.a0.dev/ai/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are an expert at detecting fake, bot, and scam social media accounts. Analyze based on Australian scam patterns and provide explainable, privacy-respecting insights using only public signals.",
          },
          { role: "user", content: prompt },
        ],
        schema,
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const result = await response.json();

    if (result.is_structured && result.schema_data) {
      return result.schema_data as AnalysisResult;
    }

    return parseUnstructuredResponse(result.completion) as AnalysisResult;
  } catch (error) {
    console.error("AI analysis failed:", error);
    return fallbackAnalysis(args.profileUrl, args.platform, args.profileData) as AnalysisResult;
  }
}

export const saveScanResult = mutation({
  args: {
    profileUrl: v.string(),
    platform: v.string(),
    profileName: v.optional(v.string()),
    trustScore: v.number(),
    riskLevel: v.union(v.literal("real"), v.literal("suspicious"), v.literal("fake")),
    insights: v.array(v.object({ type: v.string(), text: v.string() })),
    scamPhrases: v.array(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const scanId = await ctx.db.insert("scans", {
      userId,
      profileUrl: args.profileUrl,
      platform: args.platform,
      profileName: args.profileName,
      trustScore: args.trustScore,
      riskLevel: args.riskLevel,
      insights: args.insights,
      scamPhrases: args.scamPhrases,
      createdAt: Date.now(),
      scannedAt: Date.now(),
    });

    const realIncrement = args.riskLevel === "real" ? 1 : 0;
    const suspiciousIncrement = args.riskLevel === "suspicious" ? 1 : 0;
    const fakeIncrement = args.riskLevel === "fake" ? 1 : 0;

    await ctx.db.patch(userId, {
      totalScans: (user.totalScans ?? 0) + 1,
      realProfiles: (user.realProfiles ?? 0) + realIncrement,
      suspiciousProfiles: (user.suspiciousProfiles ?? 0) + suspiciousIncrement,
      fakeProfiles: (user.fakeProfiles ?? 0) + fakeIncrement,
      estimatedSavings: (user.estimatedSavings ?? 0) + (fakeIncrement + suspiciousIncrement) * 15,
    });

    return { scanId };
  },
});

export const saveBulkScanResults = mutation({
  args: {
    scans: v.array(
      v.object({
        profileUrl: v.string(),
        platform: v.string(),
        profileName: v.string(),
        trustScore: v.number(),
        riskLevel: v.union(v.literal("real"), v.literal("suspicious"), v.literal("fake")),
        insights: v.array(v.object({ type: v.string(), text: v.string() })),
        scamPhrases: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    let realCount = 0;
    let suspiciousCount = 0;
    let fakeCount = 0;

    const createdAt = Date.now();
    for (const s of args.scans) {
      await ctx.db.insert("scans", {
        userId,
        profileUrl: s.profileUrl,
        platform: s.platform,
        profileName: s.profileName,
        trustScore: s.trustScore,
        riskLevel: s.riskLevel,
        insights: s.insights,
        scamPhrases: s.scamPhrases,
        createdAt,
        scannedAt: Date.now(),
      });

      if (s.riskLevel === "real") realCount++;
      else if (s.riskLevel === "suspicious") suspiciousCount++;
      else fakeCount++;
    }

    await ctx.db.patch(userId, {
      totalScans: (user.totalScans ?? 0) + args.scans.length,
      realProfiles: (user.realProfiles ?? 0) + realCount,
      suspiciousProfiles: (user.suspiciousProfiles ?? 0) + suspiciousCount,
      fakeProfiles: (user.fakeProfiles ?? 0) + fakeCount,
      estimatedSavings: (user.estimatedSavings ?? 0) + (fakeCount + suspiciousCount) * 15,
    });

    return { realCount, suspiciousCount, fakeCount };
  },
});

function buildAnalysisPrompt(
  profileUrl: string,
  platform: string,
  profileData?: {
    accountAge?: string;
    followerCount?: number;
    followingCount?: number;
    postCount?: number;
    bio?: string;
    recentActivity?: string;
  }
) {
  let prompt = `Analyze this ${platform} profile for authenticity and scam indicators:\n\nURL: ${profileUrl}\n\n`;

  if (profileData) {
    if (profileData.accountAge) prompt += `Account Age: ${profileData.accountAge}\n`;
    if (profileData.followerCount !== undefined) prompt += `Followers: ${profileData.followerCount}\n`;
    if (profileData.followingCount !== undefined) prompt += `Following: ${profileData.followingCount}\n`;
    if (profileData.postCount !== undefined) prompt += `Posts: ${profileData.postCount}\n`;
    if (profileData.bio) prompt += `Bio: ${profileData.bio}\n`;
    if (profileData.recentActivity) prompt += `Recent Activity: ${profileData.recentActivity}\n`;
  }

  prompt += `\n**IMPORTANT ANALYSIS GUIDELINES**:

**DEFAULT ASSUMPTION**: Most profiles are REAL unless there are MULTIPLE STRONG signals of scam/bot behavior.

**Positive Signals (BOOST SCORE)**:
✅ Account age > 1 year = +20 points
✅ Consistent posting history = +15 points
✅ Personal photos, tagged friends = +15 points
✅ Natural bio (hobbies, location, job) = +10 points
✅ Balanced follower/following ratio = +10 points
✅ Verified badge or well-known person = +20 points
✅ Real name format (FirstName LastName) = +10 points

**SCAM PHRASE CONTEXT IS CRITICAL**:
❌ DON'T flag if mentioned casually or in legitimate context
✅ ONLY flag if used in PROMOTIONAL/COMMERCIAL posts like:
   - "DM me for guaranteed visa approval" = 🔴 SCAM
   - "I got my visa approved, so happy!" = ✅ REAL (just sharing)
   - "Work from home with passive income" = 🔴 SCAM
   - "Enjoying my passive income from my business" = ✅ REAL (personal)

**Australian Scam Patterns (REQUIRE COMMERCIAL CONTEXT)**:
1. **Migration/Visa Scams** 🔴
   - ONLY flag if offering services: "DM for visa", "guaranteed approval for $X"
   - NOT if discussing personal experience: "got my visa today!"

2. **Investment/Crypto Scams** 🔴
   - ONLY flag if promoting: "join my crypto group", "guaranteed returns"
   - NOT if discussing: "learning about crypto", "invested in Bitcoin"

3. **Romance Scams** 🟡
   - Military overseas + asking for money
   - Quick emotional connection + financial emergency

4. **Phishing** 🔴
   - Impersonating gov/banks: fake myGov, ATO, Centrelink
   - "Click to verify", "account suspended"

**Bot Indicators (NEED 3+ TO FLAG)**:
- Account created < 7 days ago
- Following/Followers ratio > 10:1
- Only emoji comments or copy-paste spam
- Generic AI-generated name (john_smith_1234)
- No profile picture or AI-generated face
- Link shorteners in every post

**Scoring Guidelines (0-100)**:
- **90-100** = REAL: Verified OR 2+ years old with consistent personal activity
- **70-89** = REAL: 1+ year old, natural content, no red flags
- **50-69** = SUSPICIOUS: New account OR 1-2 minor concerns (needs monitoring)
- **30-49** = SUSPICIOUS: Multiple concerns OR bot indicators OR 1 scam phrase in promo context
- **0-29** = FAKE: Clear scam operation OR 3+ ACCC scam phrases in commercial posts OR obvious bot

**CRITICAL**: 
- A personal Facebook account with years of history should score 70-90 even if bio mentions common words
- ONLY detect scam phrases if they're in a COMMERCIAL/PROMOTIONAL context
- Favor "real" or "suspicious" over "fake" unless evidence is overwhelming`;

  return prompt;
}

function parseUnstructuredResponse(completion: string) {
  const trustScoreMatch = completion.match(/trust\s*score[:\s]*(\d+)/i);
  const trustScore = trustScoreMatch ? parseInt(trustScoreMatch[1]) : 65; // Default to 65 instead of 50
  const riskLevel = trustScore >= 70 ? "real" : trustScore >= 40 ? "suspicious" : "fake";

  return {
    trustScore,
    riskLevel,
    insights: [{ type: "info" as const, text: "Analysis completed based on available data" }],
    scamPhrases: [],
    reasoning: completion,
  };
}

function fallbackAnalysis(
  profileUrl: string,
  platform: string,
  profileData?: {
    accountAge?: string;
    followerCount?: number;
    followingCount?: number;
    postCount?: number;
    bio?: string;
  }
) {
  let score = 65; // Start at 65 (suspicious) instead of 50
  const insights: Array<{ type: "warning" | "info" | "positive"; text: string }> = [];
  const scamPhrases: string[] = [];

  // Account age (most important signal)
  if (profileData?.accountAge) {
    if (profileData.accountAge.includes("year")) {
      const years = parseInt(profileData.accountAge);
      if (years >= 2) {
        score += 25;
        insights.push({ type: "positive", text: "Well-established account (2+ years)" });
      } else {
        score += 15;
        insights.push({ type: "positive", text: "Established account (1+ year)" });
      }
    } else if (profileData.accountAge.includes("month")) {
      const months = parseInt(profileData.accountAge);
      if (months >= 6) {
        score += 10;
        insights.push({ type: "positive", text: "Account has some history (6+ months)" });
      } else {
        score -= 5;
        insights.push({ type: "info", text: "Relatively new account" });
      }
    } else if (profileData.accountAge.includes("day") || profileData.accountAge.includes("hour")) {
      score -= 15;
      insights.push({ type: "warning", text: "Very new account - needs monitoring" });
    }
  }

  // Follower ratio
  if (profileData?.followerCount !== undefined && profileData?.followingCount !== undefined) {
    const ratio = profileData.followingCount / Math.max(profileData.followerCount, 1);
    if (ratio > 10) {
      score -= 15;
      insights.push({ type: "warning", text: "Following many more accounts than followers" });
    } else if (ratio < 2 && profileData.followerCount > 100) {
      score += 10;
      insights.push({ type: "positive", text: "Healthy follower engagement" });
    }
  }

  // Bio analysis - ONLY flag if clearly promotional
  if (profileData?.bio) {
    const commercialScamKeywords = [
      { phrase: "DM me for", context: "commercial offer" },
      { phrase: "guaranteed visa", context: "visa service scam" },
      { phrase: "100% approval", context: "unrealistic promise" },
      { phrase: "click link in bio", context: "promotional redirect" },
      { phrase: "join my crypto", context: "investment scam" },
      { phrase: "double your money", context: "investment scam" },
    ];

    let scamKeywordCount = 0;
    for (const item of commercialScamKeywords) {
      if (profileData.bio.toLowerCase().includes(item.phrase.toLowerCase())) {
        score -= 10;
        scamPhrases.push(item.phrase);
        insights.push({ type: "warning", text: `Bio contains suspicious phrase: "${item.phrase}"` });
        scamKeywordCount++;
      }
    }

    // Only penalize heavily if multiple scam phrases
    if (scamKeywordCount === 0) {
      score += 5;
      insights.push({ type: "positive", text: "Bio appears natural" });
    }
  }

  // Post count
  if (profileData?.postCount !== undefined) {
    if (profileData.postCount > 50) {
      score += 10;
      insights.push({ type: "positive", text: "Active posting history" });
    } else if (profileData.postCount === 0) {
      score -= 10;
      insights.push({ type: "info", text: "No posts visible" });
    }
  }

  // Ensure score stays in reasonable range
  score = Math.max(20, Math.min(95, score));

  const riskLevel = score >= 70 ? "real" : score >= 40 ? "suspicious" : "fake";
  
  return {
    trustScore: score,
    riskLevel,
    insights: insights.length > 0 ? insights : [{ type: "info" as const, text: "Limited data - score based on basic heuristics" }],
    scamPhrases,
    reasoning: "Heuristic analysis based on profile signals. Score is conservative without full profile data.",
  };
}

// Scan single profile - now calls the action instead of fetch
export const scanProfile = action({
  args: {
    profileUrl: v.string(),
    platform: v.string(),
    profileData: v.optional(v.object({
      accountAge: v.optional(v.string()),
      followerCount: v.optional(v.number()),
      followingCount: v.optional(v.number()),
      postCount: v.optional(v.number()),
      bio: v.optional(v.string()),
      recentActivity: v.optional(v.string()),
    })),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const analysisResult = await analyzeProfileWithAI({
      profileUrl: args.profileUrl,
      platform: args.platform,
      profileData: args.profileData,
    });

    return {
      ...analysisResult,
      suggestedProfileName: args.profileData?.bio?.split("\n")[0] || "Unknown",
    };
  },
});

// Bulk CSV analysis
export const bulkScanProfiles = action({
  args: {
    profiles: v.array(
      v.object({
        name: v.string(),
        profileUrl: v.optional(v.string()),
        platform: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const results: any[] = [];
    const scansToPersist: Array<{
      profileUrl: string;
      platform: string;
      profileName: string;
      trustScore: number;
      riskLevel: "real" | "suspicious" | "fake";
      insights: Array<{ type: string; text: string }>;
      scamPhrases: string[];
    }> = [];

    const batchSize = Math.min(args.profiles.length, 50);

    for (let i = 0; i < batchSize; i++) {
      const profile = args.profiles[i];
      const profileUrl = profile.profileUrl || `https://facebook.com/${profile.name}`;
      const platform = profile.platform || "Facebook";

      try {
        const analysisResult = await analyzeProfileWithAI({
          profileUrl,
          platform,
          profileData: undefined,
        });

        scansToPersist.push({
          profileUrl,
          platform,
          profileName: profile.name,
          trustScore: analysisResult.trustScore,
          riskLevel: analysisResult.riskLevel,
          insights: analysisResult.insights,
          scamPhrases: analysisResult.scamPhrases,
        });

        results.push({
          name: profile.name,
          profileUrl,
          trustScore: analysisResult.trustScore,
          riskLevel: analysisResult.riskLevel,
        });
      } catch (error) {
        console.error(`Failed to scan ${profile.name}:`, error);
        results.push({ name: profile.name, profileUrl, error: "Failed" });
      }
    }

    return {
      processed: batchSize,
      total: args.profiles.length,
      scansToPersist,
      results,
    };
  },
});

// Export scans as CSV
export const exportScansToCSV = query({
  args: {
    filterRiskLevel: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const allScans = await ctx.db
      .query("scans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    let filteredScans = allScans;

    if (args.filterRiskLevel) {
      filteredScans = filteredScans.filter((s: any) => s.riskLevel === args.filterRiskLevel);
    }
    if (args.startDate) {
      filteredScans = filteredScans.filter((s: any) => s.scannedAt >= args.startDate!);
    }
    if (args.endDate) {
      filteredScans = filteredScans.filter((s: any) => s.scannedAt <= args.endDate!);
    }

    const csvRows = [
      "Profile URL,Platform,Trust Score,Risk Level,Scam Phrases,Scan Date",
      ...filteredScans.map((s: any) => {
        const phrases = s.scamPhrases.join("; ").replace(/,/g, ";");
        const date = new Date(s.scannedAt).toISOString().split("T")[0];
        return `"${s.profileUrl}","${s.platform}",${s.trustScore},"${s.riskLevel}","${phrases}","${date}"`;
      }),
    ];

    return {
      csvContent: csvRows.join("\n"),
      filename: `trueprofile-exclusions-${new Date().toISOString().split("T")[0]}.csv`,
      count: filteredScans.length,
    };
  },
});

// Report to Scamwatch
export const reportToScamwatch = mutation({
  args: {
    scanId: v.id("scans"),
    scamType: v.string(),
    additionalNotes: v.optional(v.string()),
    reporterEmail: v.string(),
    state: v.string(),
    lossAmount: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const scan = await ctx.db.get(args.scanId);
    if (!scan) throw new Error("Scan not found");

    const reportId = await ctx.db.insert("scamReports", {
      scanId: args.scanId,
      profileUrl: scan.profileUrl,
      platform: scan.platform,
      scamType: args.scamType,
      trustScore: scan.trustScore,
      scamPhrases: scan.scamPhrases,
      reporterEmail: args.reporterEmail,
      state: args.state,
      lossAmount: args.lossAmount,
      additionalNotes: args.additionalNotes,
      submittedAt: Date.now(),
      status: "submitted",
    });

    const scamwatchUrl = buildScamwatchReportUrl(scan, args);

    return {
      reportId,
      scamwatchUrl,
      message: "Report logged. Complete submission via the provided link.",
    };
  },
});

function buildScamwatchReportUrl(scan: any, args: any) {
  const baseUrl = "https://www.scamwatch.gov.au/report-a-scam";
  const params = new globalThis.URLSearchParams({
    description: `TrueProfile Pro Report\nProfile: ${scan.profileUrl}\nPlatform: ${scan.platform}\nTrust Score: ${scan.trustScore}\nPhrases: ${scan.scamPhrases.join(", ")}\n${args.additionalNotes || ""}`,
    state: args.state,
    lossAmount: args.lossAmount?.toString() || "",
  });
  return `${baseUrl}?${params.toString()}`;
}

// Get scam phrases library
export const getScamPhrasesLibrary = query({
  handler: async () => {
    return {
      categories: [
        {
          category: "Migration/Visa",
          severity: "high",
          phrases: ["guaranteed visa", "skip queue", "100% approval", "express visa"],
        },
        {
          category: "Investment/Crypto",
          severity: "high",
          phrases: ["guaranteed returns", "passive income", "crypto signals", "double your money"],
        },
        {
          category: "Phishing",
          severity: "high",
          phrases: ["verify account", "suspended", "click link", "refund pending"],
        },
      ],
    };
  },
});

// Get user's recent scans
export const getUserScans = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const scans = await ctx.db
      .query("scans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 10);

    return scans;
  },
});

// Alias for backward compatibility
export const getRecentScans = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const scans = await ctx.db
      .query("scans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 10);

    return scans;
  },
});