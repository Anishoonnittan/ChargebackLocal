import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get store connection for the current user
export const get = query({
args: {},
handler: async (ctx) => {
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
throw new Error("Not authenticated");
}

const connection = await ctx.db
.query("storeConnections")
.withIndex("by_user", (q) => q.eq("userId", identity.subject))
.filter((q) => q.eq(q.field("isActive"), true))
.first();

return connection;
},
});

// Create or update store connection
export const upsert = mutation({
args: {
platform: v.string(),
credentials: v.object({
shopifyDomain: v.optional(v.string()),
shopifyApiKey: v.optional(v.string()),
shopifyPassword: v.optional(v.string()),
wooStoreUrl: v.optional(v.string()),
wooConsumerKey: v.optional(v.string()),
wooConsumerSecret: v.optional(v.string()),
webhookUrl: v.optional(v.string()),
apiKey: v.optional(v.string()),
}),
enableAutomaticScanning: v.boolean(),
},
handler: async (ctx, args) => {
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
throw new Error("Not authenticated");
}

// Deactivate any existing connections
const existing = await ctx.db
.query("storeConnections")
.withIndex("by_user", (q) => q.eq("userId", identity.subject))
.filter((q) => q.eq(q.field("isActive"), true))
.collect();

for (const conn of existing) {
await ctx.db.patch(conn._id, {
isActive: false,
updatedAt: Date.now(),
});
}

const now = Date.now();

// Create new connection
const connectionId = await ctx.db.insert("storeConnections", {
userId: identity.subject,
platform: args.platform,
status: "connected",
isActive: true,
credentials: args.credentials,
webhookSecret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
webhookUrl: `https://your-app.convex.site/webhooks/${args.platform}`,
totalOrdersSynced: 0,
connectedAt: now,
createdAt: now,
updatedAt: now,
});

// Update merchant settings to reflect store connection
const settings = await ctx.db
.query("merchantSettings")
.withIndex("by_user", (q) => q.eq("userId", identity.subject))
.first();

if (settings) {
await ctx.db.patch(settings._id, {
storeConnected: true,
storeType: args.platform,
automaticScanningEnabled: args.enableAutomaticScanning,
updatedAt: now,
});
}

return connectionId;
},
});

// Disconnect store
export const disconnect = mutation({
args: {},
handler: async (ctx) => {
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
throw new Error("Not authenticated");
}

const connection = await ctx.db
.query("storeConnections")
.withIndex("by_user", (q) => q.eq("userId", identity.subject))
.filter((q) => q.eq(q.field("isActive"), true))
.first();

if (!connection) {
throw new Error("No active connection found");
}

await ctx.db.patch(connection._id, {
isActive: false,
status: "disconnected",
updatedAt: Date.now(),
});

// Update merchant settings
const settings = await ctx.db
.query("merchantSettings")
.withIndex("by_user", (q) => q.eq(identity.subject))
.first();

if (settings) {
await ctx.db.patch(settings._id, {
storeConnected: false,
storeType: undefined,
automaticScanningEnabled: false,
updatedAt: Date.now(),
});
}
},
});
