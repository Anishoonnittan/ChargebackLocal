// ... existing imports ...

// Add HTTP webhook endpoint for pre-dispute alerts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Shopify Order Webhook
 * Receives new orders from Shopify stores
 */
http.route({
  path: "/webhooks/shopify/orders",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json();
      const shopifyDomain = request.headers.get("X-Shopify-Shop-Domain");
      const hmac = request.headers.get("X-Shopify-Hmac-SHA256");
      
      console.log("🛒 Shopify order received:", payload);
      
      // Extract order data
      const order = payload as any;
      
      await ctx.runMutation(internal.webhooks.handleShopifyOrder, {
        shopifyDomain: shopifyDomain || "",
        order,
      });
      
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Shopify webhook error:", error);
      return new Response("Webhook error", { status: 500 });
    }
  }),
});

/**
 * WooCommerce Order Webhook
 * Receives new orders from WooCommerce stores
 */
http.route({
  path: "/webhooks/woocommerce/orders",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json();
      const signature = request.headers.get("X-WC-Webhook-Signature");
      
      console.log("🛒 WooCommerce order received:", payload);
      
      await ctx.runMutation(internal.webhooks.handleWooCommerceOrder, {
        order: payload,
      });
      
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("WooCommerce webhook error:", error);
      return new Response("Webhook error", { status: 500 });
    }
  }),
});

/**
 * Custom API Order Webhook
 * Receives orders from custom integrations
 */
http.route({
  path: "/webhooks/custom/orders",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json();
      const apiKey = request.headers.get("X-API-Key");
      
      console.log("🛒 Custom API order received:", payload);
      
      await ctx.runMutation(internal.webhooks.handleCustomOrder, {
        apiKey: apiKey || "",
        order: payload,
      });
      
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Custom API webhook error:", error);
      return new Response("Webhook error", { status: 500 });
    }
  }),
});

/**
 * Webhook endpoint for Ethoca/Verifi dispute alerts
 * Called when a customer contacts their bank before filing chargeback
 */
http.route({
  path: "/webhooks/pre-dispute-alert",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json();
      
      // Verify webhook signature (in production)
      // const signature = request.headers.get("X-Webhook-Signature");
      // if (!verifyWebhookSignature(payload, signature)) {
      //   return new Response("Invalid signature", { status: 401 });
      // }
      
      console.log("📢 Pre-dispute alert received:", payload);
      
      // Extract alert data
      const {
        orderId,
        customerEmail,
        amount,
        reason,
        source, // "ETHOCA" or "VERIFI"
        alertedAt,
      } = payload as {
        orderId: string;
        customerEmail: string;
        amount: string;
        reason?: string;
        source: string;
        alertedAt?: number;
      };
      
      // Find the original scan by order ID or email
      // Then create a dispute alert
      await ctx.runMutation(internal.http.handlePreDisputeAlert, {
        orderId,
        customerEmail,
        amount: parseFloat(amount),
        reason: reason || "Customer disputed with bank",
        source,
      });
      
      return new Response(
        JSON.stringify({
          received: true,
          status: "processing",
          message: "Dispute alert received and processing",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * Stripe Early Fraud Warning webhook
 * Receives alerts about potentially fraudulent transactions
 */
http.route({
  path: "/webhooks/stripe/early-fraud-warning",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json();
      const signature = request.headers.get("stripe-signature");
      
      // Verify Stripe webhook signature (in production)
      // const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      console.log("⚠️ Stripe early fraud warning:", payload);
      
      const typedPayload = payload as {
        type: string;
        data: {
          object: {
            charge: string;
            fraud_type: string;
            actionable: boolean;
          };
        };
      };
      
      if (typedPayload.type === "radar.early_fraud_warning.created") {
        const earlyFraudWarning = typedPayload.data.object;
        
        await ctx.runMutation(internal.http.handleEarlyFraudWarning, {
          chargeId: earlyFraudWarning.charge,
          fraudType: earlyFraudWarning.fraud_type,
          actionable: earlyFraudWarning.actionable,
        });
      }
      
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      return new Response("Webhook error", { status: 500 });
    }
  }),
});

export default http;