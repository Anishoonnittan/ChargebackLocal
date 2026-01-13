import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
* A/B Testing - lightweight, production-friendly aggregate counters.
*
* We avoid storing every event row to keep storage/cost down.
* Instead we update counters in abTestAggregates.
*/

const eventTypeValidator = v.union(
v.literal("exposure"),
v.literal("complete"),
v.literal("skip"),
v.literal("video_click"),
v.literal("cta_click"),
);

export const track = mutation({
args: {
sessionToken: v.string(),
experimentKey: v.string(),
variant: v.string(),
eventType: eventTypeValidator,
app: v.union(v.literal("scamvigil"), v.literal("chargeback")),
},
returns: v.null(),
handler: async (ctx, args) => {
const session = await ctx.db
.query("sessions")
.withIndex("by_token", (q) => q.eq("token", args.sessionToken))
.first();

if (!session) {
// Don't throw. Tracking must never break the app.
return null;
}

if (session.expiresAt < Date.now()) {
// Session expired.
return null;
}

const key = `${args.app}:${args.experimentKey}:${args.variant}`;

const existing = await ctx.db
.query("abTestAggregates")
.withIndex("by_key", (q) => q.eq("key", key))
.first();

const now = Date.now();

const increment = {
exposures: args.eventType === "exposure" ? 1 : 0,
completes: args.eventType === "complete" ? 1 : 0,
skips: args.eventType === "skip" ? 1 : 0,
videoClicks: args.eventType === "video_click" ? 1 : 0,
ctaClicks: args.eventType === "cta_click" ? 1 : 0,
};

if (!existing) {
await ctx.db.insert("abTestAggregates", {
key,
app: args.app,
experimentKey: args.experimentKey,
variant: args.variant,
exposures: increment.exposures,
completes: increment.completes,
skips: increment.skips,
videoClicks: increment.videoClicks,
ctaClicks: increment.ctaClicks,
updatedAt: now,
});
return null;
}

await ctx.db.patch(existing._id, {
exposures: existing.exposures + increment.exposures,
completes: existing.completes + increment.completes,
skips: existing.skips + increment.skips,
videoClicks: existing.videoClicks + increment.videoClicks,
ctaClicks: existing.ctaClicks + increment.ctaClicks,
updatedAt: now,
});

return null;
},
});

export const getExperimentSummary = query({
args: {
app: v.union(v.literal("scamvigil"), v.literal("chargeback")),
experimentKey: v.string(),
},
returns: v.object({
app: v.union(v.literal("scamvigil"), v.literal("chargeback")),
experimentKey: v.string(),
variants: v.array(
v.object({
variant: v.string(),
exposures: v.number(),
completes: v.number(),
skips: v.number(),
videoClicks: v.number(),
ctaClicks: v.number(),
completionRate: v.number(),
})
),
totalExposures: v.number(),
isDataSufficient: v.boolean(),
}),
handler: async (ctx, args) => {
const rows = await ctx.db
.query("abTestAggregates")
.withIndex("by_app_and_experiment", (q) =>
q.eq("app", args.app).eq("experimentKey", args.experimentKey)
)
.collect();

const variants = rows
.map((r) => {
const completionRate = r.exposures > 0 ? r.completes / r.exposures : 0;
return {
variant: r.variant,
exposures: r.exposures,
completes: r.completes,
skips: r.skips,
videoClicks: r.videoClicks,
ctaClicks: r.ctaClicks,
completionRate,
};
})
.sort((a, b) => a.variant.localeCompare(b.variant));

const totalExposures = variants.reduce((acc, v) => acc + v.exposures, 0);

return {
app: args.app,
experimentKey: args.experimentKey,
variants,
totalExposures,
isDataSufficient: totalExposures >= 1000,
};
},
});

/**
 * Get all experiment results for the analytics dashboard
 */
export const getExperimentResults = query({
  args: {
    timeRange: v.optional(v.union(v.literal("24h"), v.literal("7d"), v.literal("30d"), v.literal("all"))),
  },
  returns: v.array(
    v.object({
      experimentKey: v.string(),
      name: v.string(),
      description: v.string(),
      variantATitle: v.string(),
      variantBTitle: v.string(),
      variants: v.array(
        v.object({
          variant: v.string(),
          exposures: v.number(),
          conversions: v.number(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    // Fetch all A/B test aggregates
    const allAggregates = await ctx.db.query("abTestAggregates").collect();

    // Group by experiment key
    const experimentMap = new Map<string, any>();

    for (const agg of allAggregates) {
      if (!experimentMap.has(agg.experimentKey)) {
        experimentMap.set(agg.experimentKey, {
          experimentKey: agg.experimentKey,
          variants: [],
        });
      }

      const exp = experimentMap.get(agg.experimentKey);
      exp.variants.push({
        variant: agg.variant,
        exposures: agg.exposures,
        conversions: agg.completes, // "complete" is our conversion event
      });
    }

    // Define experiment metadata (in production, this could come from a separate table)
    const experimentMetadata: Record<string, { name: string; description: string; variantATitle: string; variantBTitle: string }> = {
      "sv_tutorial_welcome_v1": {
        name: "ScamVigil Welcome Message",
        description: "Testing different welcome messages to improve tutorial completion",
        variantATitle: "Welcome to ScamVigil",
        variantBTitle: "Stop scams before they start",
      },
      "cb_tutorial_welcome_v1": {
        name: "ChargebackShield Welcome Message",
        description: "Testing different welcome messages for business users",
        variantATitle: "Welcome to ChargebackShield",
        variantBTitle: "Protect revenue automatically",
      },
      "sv_cta_scan_v1": {
        name: "Scan Button CTA",
        description: "Testing different CTAs on the scan button",
        variantATitle: "Scan Now",
        variantBTitle: "Check for Scams",
      },
      "sv_color_primary_v1": {
        name: "Primary Color",
        description: "Testing blue vs purple primary color",
        variantATitle: "Blue (#2563EB)",
        variantBTitle: "Purple (#7C3AED)",
      },
    };

    // Convert to array and add metadata
    const experiments = Array.from(experimentMap.values()).map((exp) => {
      const metadata = experimentMetadata[exp.experimentKey] || {
        name: exp.experimentKey,
        description: "No description available",
        variantATitle: "Variant A",
        variantBTitle: "Variant B",
      };

      return {
        ...exp,
        ...metadata,
      };
    });

    return experiments;
  },
});