import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get merchant settings for the current user
export const get = query({
args: {},
handler: async (ctx) => {
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
throw new Error("Not authenticated");
}

const settings = await ctx.db
.query("merchantSettings")
.withIndex("by_user", (q) => q.eq("userId", identity.subject))
.first();

return settings;
},
});

// Create or update merchant settings
export const upsert = mutation({
args: {
automaticScanningEnabled: v.boolean(),
autoApproveEnabled: v.boolean(),
autoApproveThreshold: v.number(),
autoBlockEnabled: v.boolean(),
autoBlockThreshold: v.number(),
notifyHighRisk: v.boolean(),
notifyAutoBlock: v.boolean(),
notifyDailySummary: v.boolean(),
},
handler: async (ctx, args) => {
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
throw new Error("Not authenticated");
}

const existing = await ctx.db
.query("merchantSettings")
.withIndex("by_user", (q) => q.eq("userId", identity.subject))
.first();

const now = Date.now();

if (existing) {
// Update existing settings
await ctx.db.patch(existing._id, {
...args,
updatedAt: now,
});
return existing._id;
} else {
// Create new settings
const settingsId = await ctx.db.insert("merchantSettings", {
userId: identity.subject,
...args,
storeConnected: false,
createdAt: now,
updatedAt: now,
});
return settingsId;
}
},
});

// Update store connection status
export const updateStoreStatus = mutation({
args: {
storeConnected: v.boolean(),
storeType: v.optional(v.string()),
},
handler: async (ctx, args) => {
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
throw new Error("Not authenticated");
}

const settings = await ctx.db
.query("merchantSettings")
.withIndex("by_user", (q) => q.eq("userId", identity.subject))
.first();

if (!settings) {
throw new Error("Settings not found");
}

await ctx.db.patch(settings._id, {
storeConnected: args.storeConnected,
storeType: args.storeType,
updatedAt: Date.now(),
});
},
});
