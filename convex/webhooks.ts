/**
 * Webhook HTTP Endpoints
 * Handles incoming webhooks from e-commerce platforms and payment processors
 */

import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Shopify Order Created Webhook
 * Automatically scans new orders for fraud risk
 */
export const shopify = httpAction(async (ctx, request) => {
  // Verify Shopify webhook signature
  const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");
  const shopDomain = request.headers.get("X-Shopify-Shop-Domain");
  const topic = request.headers.get("X-Shopify-Topic");
  
  console.log(`📦 Shopify webhook received: ${topic} from ${shopDomain}`);
  
  const body = await request.json();
  
  // In production: verify HMAC signature
  // const isValid = verifyShopifyHmac(body, hmacHeader, SHOPIFY_SECRET);
  // if (!isValid) {
  //   return new Response("Invalid signature", { status: 401 });
  // }
  
  // Find the merchant by shop domain
  // For now, we'll use the email to find the user
  const userEmail = body.email || body.customer?.email;
  if (!userEmail) {
    console.warn("No email in Shopify webhook");
    return new Response("OK", { status: 200 });
  }
  
  // Get user by email (simplified - in production, store shop domain → userId mapping)
  const user = await ctx.runQuery(internal.users.getUserByEmail, { email: userEmail });
  if (!user) {
    console.warn(`User not found for email ${userEmail}`);
    return new Response("OK", { status: 200 });
  }
  
  // Create a session token for the action (temporary)
  const sessionToken = await ctx.runMutation(internal.auth.createTempSession, { userId: user._id });
  
  // Handle different webhook topics
  if (topic === "orders/create" || topic === "orders/paid") {
    const order = body;
    
    // Extract order data
    const orderData = {
      orderId: String(order.id),
      customerEmail: order.email,
      customerPhone: order.phone || order.customer?.phone,
      orderAmount: parseFloat(order.total_price),
      billingAddress: formatShopifyAddress(order.billing_address),
      shippingAddress: formatShopifyAddress(order.shipping_address),
      ipAddress: order.browser_ip,
      deviceFingerprint: order.client_details?.user_agent,
      cardBin: order.payment_gateway_names?.[0] === "bogus" ? undefined : order.payment_details?.credit_card_bin,
      sessionData: {
        landedAt: new Date(order.created_at).getTime() - 60000, // Estimate
        timeToCheckout: 60000, // Estimate 1 minute
        pagesViewed: 3, // Estimate
      },
    };
    
    // Run fraud analysis
    try {
      const analysis = await ctx.runAction(api.chargebackFraud.analyzeOrder, {
        sessionToken,
        ...orderData,
      });
      
      console.log(`✅ Fraud scan complete for order ${order.id}: Risk ${analysis.riskLevel} (${analysis.riskScore}/100)`);
      
      // If high risk, you could auto-cancel the order or mark it for review
      if (analysis.riskLevel === "CRITICAL") {
        console.log(`🚨 HIGH RISK ORDER: ${order.id} - Consider canceling before fulfillment`);
        // In production:
        // - Cancel Shopify order via API
        // - Send email/SMS to merchant
        // - Create urgent alert
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Error analyzing order:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  
  // Handle other topics (refunds, cancellations, etc.)
  return new Response("OK", { status: 200 });
});

/**
 * Stripe Webhook Handler
 * Handles early fraud warnings, disputes, and payment events
 */
export const stripe = httpAction(async (ctx, request) => {
  const signature = request.headers.get("Stripe-Signature");
  const body = await request.text();
  
  console.log(`💳 Stripe webhook received`);
  
  // In production: verify Stripe signature
  // const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  
  // For now, parse as JSON
  const event = JSON.parse(body);
  
  console.log(`Stripe event type: ${event.type}`);
  
  // Handle early fraud warnings
  if (event.type === "radar.early_fraud_warning.created") {
    const warning = event.data.object;
    
    await ctx.runMutation(internal.chargebackFraud.handleEarlyFraudWarning, {
      chargeId: warning.charge,
      fraudType: warning.fraud_type,
      actionable: warning.actionable,
    });
    
    console.log(`✅ Early fraud warning processed for charge ${warning.charge}`);
  }
  
  // Handle dispute creation
  if (event.type === "charge.dispute.created") {
    const dispute = event.data.object;
    
    // Create alert for merchant
    console.log(`⚠️ Dispute created for charge ${dispute.charge}: ${dispute.reason}`);
    
    // In production: create dispute alert, generate evidence package
  }
  
  // Handle dispute updates
  if (event.type === "charge.dispute.closed") {
    const dispute = event.data.object;
    
    console.log(`✅ Dispute ${dispute.status} for charge ${dispute.charge}`);
  }
  
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * Ethoca/Verifi Pre-Dispute Alert Handler
 * Allows merchants to prevent chargebacks by issuing refunds early
 */
export const ethoca = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  console.log(`⚠️ Ethoca pre-dispute alert received`);
  
  // Extract alert data (format varies by provider)
  const alert = {
    orderId: body.merchant_order_id || body.order_id,
    customerEmail: body.cardholder_email,
    amount: body.transaction_amount,
    reason: body.dispute_reason,
    source: "ETHOCA",
  };
  
  // Process pre-dispute alert
  const result = await ctx.runMutation(internal.chargebackFraud.handlePreDisputeAlert, alert);
  
  console.log(`✅ Pre-dispute alert processed: ${result.action}`);
  
  return new Response(JSON.stringify({ 
    success: true,
    action: result.action,
    savedAmount: result.savedAmount,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * Verifi (Visa) Pre-Dispute Alert Handler
 */
export const verifi = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  console.log(`⚠️ Verifi pre-dispute alert received`);
  
  const alert = {
    orderId: body.order_id,
    customerEmail: body.email,
    amount: body.amount,
    reason: body.reason_code,
    source: "VERIFI",
  };
  
  const result = await ctx.runMutation(internal.chargebackFraud.handlePreDisputeAlert, alert);
  
  console.log(`✅ Pre-dispute alert processed: ${result.action}`);
  
  return new Response(JSON.stringify({ 
    success: true,
    action: result.action,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * Test webhook endpoint (for development)
 */
export const test = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  console.log("🧪 Test webhook received:", body);
  
  return new Response(JSON.stringify({ 
    success: true,
    received: body,
    timestamp: Date.now(),
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// Helper functions
function formatShopifyAddress(address: any): string {
  if (!address) return "";
  return `${address.address1 || ""} ${address.address2 || ""}, ${address.city || ""}, ${address.province || ""} ${address.zip || ""}, ${address.country || ""}`.trim();
}

/**
 * Handle incoming Shopify order webhook
 * Parses Shopify order format and saves to incomingOrders
 */
export const handleShopifyOrder = internalMutation({
  args: {
    shopifyDomain: v.string(),
    order: v.any(),
  },
  handler: async (ctx, args) => {
    const { shopifyDomain, order } = args;
    
    // Find the store connection for this Shopify domain
    const connection = await ctx.db
      .query("storeConnections")
      .filter((q) =>
        q.and(
          q.eq(q.field("platform"), "shopify"),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();
    
    if (!connection) {
      console.error("No active Shopify connection found for:", shopifyDomain);
      return { success: false, error: "Store not connected" };
    }
    
    // Parse Shopify order format
    const customerEmail = order.customer?.email || order.email;
    const customerPhone = order.customer?.phone || order.phone;
    const orderAmount = parseFloat(order.total_price || order.current_total_price || "0");
    const shippingAddress = order.shipping_address
      ? `${order.shipping_address.address1}, ${order.shipping_address.city}, ${order.shipping_address.province} ${order.shipping_address.zip}`
      : undefined;
    const billingAddress = order.billing_address
      ? `${order.billing_address.address1}, ${order.billing_address.city}, ${order.billing_address.province} ${order.billing_address.zip}`
      : undefined;
    
    // Save to incomingOrders table
    const incomingOrderId = await ctx.db.insert("incomingOrders", {
      userId: connection.userId,
      storeConnectionId: connection._id,
      platform: "shopify",
      platformOrderId: order.id?.toString() || order.order_number?.toString(),
      customerEmail,
      customerPhone,
      orderAmount,
      billingAddress,
      shippingAddress,
      ipAddress: order.browser_ip,
      status: "pending",
      rawPayload: order,
      receivedAt: Date.now(),
      createdAt: Date.now(),
    });
    
    console.log("✅ Shopify order saved:", incomingOrderId);
    
    return { success: true, incomingOrderId };
  },
});

/**
 * Handle incoming WooCommerce order webhook
 * Parses WooCommerce order format and saves to incomingOrders
 */
export const handleWooCommerceOrder = internalMutation({
  args: {
    order: v.any(),
  },
  handler: async (ctx, args) => {
    const { order } = args;
    
    // Find any active WooCommerce connection
    const connection = await ctx.db
      .query("storeConnections")
      .filter((q) =>
        q.and(
          q.eq(q.field("platform"), "woocommerce"),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();
    
    if (!connection) {
      console.error("No active WooCommerce connection found");
      return { success: false, error: "Store not connected" };
    }
    
    // Parse WooCommerce order format
    const customerEmail = order.billing?.email;
    const customerPhone = order.billing?.phone;
    const orderAmount = parseFloat(order.total || "0");
    const shippingAddress = order.shipping
      ? `${order.shipping.address_1}, ${order.shipping.city}, ${order.shipping.state} ${order.shipping.postcode}`
      : undefined;
    const billingAddress = order.billing
      ? `${order.billing.address_1}, ${order.billing.city}, ${order.billing.state} ${order.billing.postcode}`
      : undefined;
    
    // Save to incomingOrders table
    const incomingOrderId = await ctx.db.insert("incomingOrders", {
      userId: connection.userId,
      storeConnectionId: connection._id,
      platform: "woocommerce",
      platformOrderId: order.id?.toString(),
      customerEmail,
      customerPhone,
      orderAmount,
      billingAddress,
      shippingAddress,
      ipAddress: order.customer_ip_address,
      status: "pending",
      rawPayload: order,
      receivedAt: Date.now(),
      createdAt: Date.now(),
    });
    
    console.log("✅ WooCommerce order saved:", incomingOrderId);
    
    return { success: true, incomingOrderId };
  },
});

/**
 * Handle incoming Custom API order webhook
 * Parses generic order format and saves to incomingOrders
 */
export const handleCustomOrder = internalMutation({
  args: {
    apiKey: v.string(),
    order: v.any(),
  },
  handler: async (ctx, args) => {
    const { apiKey, order } = args;
    
    // Find the store connection by API key
    const connection = await ctx.db
      .query("storeConnections")
      .filter((q) =>
        q.and(
          q.eq(q.field("platform"), "custom_api"),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();
    
    if (!connection) {
      console.error("No active Custom API connection found");
      return { success: false, error: "Store not connected" };
    }
    
    // Verify API key matches
    if (connection.credentials?.apiKey !== apiKey) {
      console.error("Invalid API key");
      return { success: false, error: "Invalid API key" };
    }
    
    // Parse generic order format
    const customerEmail = order.email || order.customer_email;
    const customerPhone = order.phone || order.customer_phone;
    const orderAmount = parseFloat(order.amount || order.total || "0");
    const shippingAddress = order.shipping_address || order.address;
    const billingAddress = order.billing_address;
    
    // Save to incomingOrders table
    const incomingOrderId = await ctx.db.insert("incomingOrders", {
      userId: connection.userId,
      storeConnectionId: connection._id,
      platform: "custom_api",
      platformOrderId: order.order_id || order.id?.toString(),
      customerEmail,
      customerPhone,
      orderAmount,
      billingAddress,
      shippingAddress,
      ipAddress: order.ip || order.ip_address,
      status: "pending",
      rawPayload: order,
      receivedAt: Date.now(),
      createdAt: Date.now(),
    });
    
    console.log("✅ Custom API order saved:", incomingOrderId);
    
    return { success: true, incomingOrderId };
  },
});