import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
* Process pending incoming orders
* Runs fraud check and applies auto-decision logic
*/
export const processPendingOrders = internalMutation({
args: {},
handler: async (ctx) => {
// Get all pending orders
const pendingOrders = await ctx.db
.query("incomingOrders")
.filter((q) => q.eq(q.field("status"), "pending"))
.take(10); // Process 10 at a time

console.log(`📋 Processing ${pendingOrders.length} pending orders`);

for (const order of pendingOrders) {
try {
// Update status to processing
await ctx.db.patch(order._id, { status: "processing" });

// Get merchant settings for auto-decision rules
const settings = await ctx.db
.query("merchantSettings")
.filter((q) => q.eq(q.field("userId"), order.userId))
.first();

// Run pre-auth fraud check
const scanResult = await ctx.scheduler.runAfter(0, internal.preAuth.runPreAuthCheck, {
userId: order.userId,
orderData: {
orderId: order.platformOrderId,
email: order.customerEmail || "",
amount: order.orderAmount.toString(),
name: "",
phone: order.customerPhone,
address: order.shippingAddress,
payment: "",
ip: order.ipAddress,
notes: `Auto-scan from ${order.platform}`,
},
behavioralData: {
typingSpeed: 0,
formFillTime: 0,
fieldInteractions: 0,
copyPasteCount: 0,
autoFillDetected: false,
},
});

console.log(`✅ Order ${order.platformOrderId} scanned`);

// Mark as scanned
await ctx.db.patch(order._id, { 
status: "scanned",
});

} catch (error) {
console.error(`❌ Error processing order ${order.platformOrderId}:`, error);
await ctx.db.patch(order._id, { 
status: "failed",
});
}
}

return { processed: pendingOrders.length };
},
});

/**
* Get count of pending orders
*/
export const getPendingOrderCount = query({
args: {},
handler: async (ctx) => {
const userId = await ctx.auth.getUserIdentity().then(u => u?.subject);
if (!userId) return 0;

const count = await ctx.db
.query("incomingOrders")
.filter((q) => 
q.and(
q.eq(q.field("userId"), userId),
q.eq(q.field("status"), "pending")
)
)
.collect()
.then(orders => orders.length);

return count;
},
});

/**
* Manually trigger order processing
*/
export const triggerProcessing = mutation({
args: {},
handler: async (ctx) => {
await ctx.scheduler.runAfter(0, internal.orderProcessor.processPendingOrders, {});
return { success: true };
},
});
