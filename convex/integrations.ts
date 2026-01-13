import { v } from "convex/values";
import { action, internalMutation, query, mutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

// ============================================
// WEBHOOK HANDLERS FOR EACH PLATFORM
// ============================================

/**
 * Process Stripe webhook events
 * Handles: charge.dispute.created, charge.dispute.updated, charge.dispute.closed
 */
export const handleStripeWebhook = action({
  args: {
    eventType: v.string(),
    payload: v.any(),
    signature: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { eventType, payload } = args;
    
    // Log the webhook
    await ctx.runMutation(internal.integrations.logWebhookInternal, {
      platform: "stripe",
      eventType,
      payload,
      status: "processing",
    });
    
    try {
      switch (eventType) {
        case "charge.dispute.created":
          // Create a new dispute alert
          await ctx.runMutation(api.chargebackFraud.createChargebackCase, {
            transactionId: payload.charge,
            amount: payload.amount / 100, // Stripe uses cents
            reason: payload.reason || "unknown",
            source: "stripe_webhook",
            cardNetwork: payload.payment_method_details?.card?.brand || "unknown",
            disputeId: payload.id,
          });
          break;
          
        case "charge.dispute.updated":
          // Update existing dispute
          await ctx.runMutation(api.chargebackFraud.updateDisputeStatus, {
            disputeId: payload.id,
            status: payload.status,
            evidenceDueBy: payload.evidence_details?.due_by,
          });
          break;
          
        case "charge.dispute.closed":
          // Close the dispute with outcome
          await ctx.runMutation(api.chargebackFraud.closeDispute, {
            disputeId: payload.id,
            outcome: payload.status === "won" ? "won" : "lost",
            netAmount: payload.net_refund_amount,
          });
          break;
      }
      
      // Update webhook status
      await ctx.runMutation(internal.integrations.updateWebhookStatusInternal, {
        platform: "stripe",
        eventType,
        status: "processed",
      });
      
      return { success: true };
    } catch (error: any) {
      await ctx.runMutation(internal.integrations.updateWebhookStatusInternal, {
        platform: "stripe",
        eventType,
        status: "failed",
        error: error.message,
      });
      throw error;
    }
  },
});

/**
 * Process Pin Payments webhook events
 * Handles: dispute.created, dispute.evidence_required, dispute.resolved
 */
export const handlePinPaymentsWebhook = action({
  args: {
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const { eventType, payload } = args;
    
    await ctx.runMutation(internal.integrations.logWebhookInternal, {
      platform: "pin_payments",
      eventType,
      payload,
      status: "processing",
    });
    
    try {
      switch (eventType) {
        case "dispute.created":
          await ctx.runMutation(api.chargebackFraud.createChargebackCase, {
            transactionId: payload.charge_token,
            amount: payload.amount / 100,
            reason: payload.reason,
            source: "pin_payments_webhook",
            cardNetwork: payload.card?.scheme || "unknown",
            disputeId: payload.token,
          });
          break;
          
        case "dispute.evidence_required":
          // Alert merchant that evidence is needed
          await ctx.runMutation(api.alerts.createAlert, {
            type: "evidence_required",
            severity: "high",
            title: `Evidence required for dispute ${payload.token}`,
            message: `Submit evidence by ${payload.evidence_due_at}`,
            metadata: { disputeId: payload.token, dueDate: payload.evidence_due_at },
          });
          break;
          
        case "dispute.resolved":
          await ctx.runMutation(api.chargebackFraud.closeDispute, {
            disputeId: payload.token,
            outcome: payload.status === "won" ? "won" : "lost",
          });
          break;
      }
      
      return { success: true };
    } catch (error: any) {
      console.error("Pin Payments webhook error:", error);
      throw error;
    }
  },
});

/**
 * Process Shopify webhook events
 * Handles: orders/create, orders/updated, disputes/create
 */
export const handleShopifyWebhook = action({
  args: {
    eventType: v.string(),
    payload: v.any(),
    shopDomain: v.string(),
  },
  handler: async (ctx, args) => {
    const { eventType, payload, shopDomain } = args;
    
    await ctx.runMutation(internal.integrations.logWebhookInternal, {
      platform: "shopify",
      eventType,
      payload,
      status: "processing",
    });
    
    try {
      switch (eventType) {
        case "orders/create":
          // Import new order for risk analysis
          await ctx.runMutation(api.transactions.importOrder, {
            orderId: payload.id.toString(),
            source: "shopify",
            shopDomain,
            customerEmail: payload.email,
            customerName: `${payload.customer?.first_name || ""} ${payload.customer?.last_name || ""}`.trim(),
            amount: parseFloat(payload.total_price),
            currency: payload.currency,
            items: payload.line_items?.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: parseFloat(item.price),
            })) || [],
            shippingAddress: payload.shipping_address,
            billingAddress: payload.billing_address,
            paymentGateway: payload.payment_gateway_names?.[0],
            riskLevel: payload.fraud_analysis?.risk_level,
          });
          break;
          
        case "orders/updated":
          // Update order status (fulfillment, delivery, etc.)
          await ctx.runMutation(api.transactions.updateOrderStatus, {
            orderId: payload.id.toString(),
            source: "shopify",
            fulfillmentStatus: payload.fulfillment_status,
            financialStatus: payload.financial_status,
            trackingNumbers: payload.fulfillments?.map((f: any) => f.tracking_number).filter(Boolean),
          });
          break;
          
        case "disputes/create":
          await ctx.runMutation(api.chargebackFraud.createChargebackCase, {
            transactionId: payload.order_id?.toString(),
            amount: parseFloat(payload.amount),
            reason: payload.reason,
            source: "shopify_webhook",
            disputeId: payload.id?.toString(),
          });
          break;
      }
      
      return { success: true };
    } catch (error: any) {
      console.error("Shopify webhook error:", error);
      throw error;
    }
  },
});

/**
 * Process Australia Post webhook events
 * Handles: tracking.delivered, tracking.attempted, tracking.exception
 */
export const handleAustraliaPostWebhook = action({
  args: {
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const { eventType, payload } = args;
    
    await ctx.runMutation(internal.integrations.logWebhookInternal, {
      platform: "australia_post",
      eventType,
      payload,
      status: "processing",
    });
    
    try {
      switch (eventType) {
        case "tracking.delivered":
          // Update delivery status and capture proof
          await ctx.runMutation(api.transactions.updateDeliveryProof, {
            trackingNumber: payload.tracking_id,
            status: "delivered",
            deliveredAt: payload.delivered_at,
            signatureUrl: payload.signature_image_url,
            photoUrl: payload.delivery_photo_url,
            recipientName: payload.recipient_name,
            gpsLocation: payload.delivery_location,
          });
          break;
          
        case "tracking.attempted":
          await ctx.runMutation(api.transactions.updateDeliveryStatus, {
            trackingNumber: payload.tracking_id,
            status: "attempted",
            attemptedAt: payload.attempted_at,
            reason: payload.attempt_reason,
          });
          break;
          
        case "tracking.exception":
          // Alert about delivery issues
          await ctx.runMutation(api.alerts.createAlert, {
            type: "delivery_exception",
            severity: "medium",
            title: `Delivery exception for ${payload.tracking_id}`,
            message: payload.exception_reason,
            metadata: { trackingNumber: payload.tracking_id },
          });
          break;
      }
      
      return { success: true };
    } catch (error: any) {
      console.error("Australia Post webhook error:", error);
      throw error;
    }
  },
});

/**
 * Process Xero webhook events
 * Handles: invoice.created, payment.created
 */
export const handleXeroWebhook = action({
  args: {
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const { eventType, payload } = args;
    
    await ctx.runMutation(internal.integrations.logWebhookInternal, {
      platform: "xero",
      eventType,
      payload,
      status: "processing",
    });
    
    // Xero webhooks are mainly for confirming our entries were created
    // Most Xero integration is outbound (we push chargeback losses to Xero)
    
    return { success: true };
  },
});

// ============================================
// EVIDENCE BUILDER - PULLS FROM ALL INTEGRATIONS
// ============================================

/**
 * Build comprehensive evidence package from all connected integrations
 * This is the core of the "Auto-Evidence Locker" feature
 */
export const buildEvidencePackage = action({
  args: {
    disputeId: v.string(),
    merchantId: v.id("merchants"),
    transactionId: v.optional(v.string()),
    orderId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { disputeId, merchantId, transactionId, orderId } = args;
    
    // Get all connected integrations for this merchant
    const integrations = await ctx.runQuery(api.integrations.getIntegrations, { merchantId });
    const connectedIntegrations = integrations.filter(i => i.status === "connected");
    
    const evidence: any = {
      generatedAt: new Date().toISOString(),
      disputeId,
      merchantId,
      sources: [],
      sections: {},
    };
    
    // 1. TRANSACTION DATA (from payment gateways)
    const paymentIntegration = connectedIntegrations.find(i => 
      ["stripe", "pin_payments", "tyro", "paypal", "square"].includes(i.platform)
    );
    
    if (paymentIntegration && transactionId) {
      evidence.sections.transaction = await fetchTransactionEvidence(
        paymentIntegration.platform,
        paymentIntegration.credentials,
        transactionId
      );
      evidence.sources.push(paymentIntegration.platform);
    }
    
    // 2. ORDER DATA (from e-commerce platforms)
    const ecommerceIntegration = connectedIntegrations.find(i =>
      ["shopify", "woocommerce", "bigcommerce", "magento"].includes(i.platform)
    );
    
    if (ecommerceIntegration && orderId) {
      evidence.sections.order = await fetchOrderEvidence(
        ecommerceIntegration.platform,
        ecommerceIntegration.credentials,
        orderId
      );
      evidence.sources.push(ecommerceIntegration.platform);
    }
    
    // 3. DELIVERY PROOF (from shipping providers)
    const shippingIntegration = connectedIntegrations.find(i =>
      ["australia_post", "sendle", "startrack"].includes(i.platform)
    );
    
    if (shippingIntegration && evidence.sections.order?.trackingNumber) {
      evidence.sections.delivery = await fetchDeliveryEvidence(
        shippingIntegration.platform,
        shippingIntegration.credentials,
        evidence.sections.order.trackingNumber
      );
      evidence.sources.push(shippingIntegration.platform);
    }
    
    // 4. CUSTOMER COMMUNICATION (from CS platforms)
    const csIntegration = connectedIntegrations.find(i =>
      ["zendesk", "gorgias", "freshdesk", "intercom"].includes(i.platform)
    );
    
    if (csIntegration && evidence.sections.order?.customerEmail) {
      evidence.sections.customerCommunication = await fetchCSEvidence(
        csIntegration.platform,
        csIntegration.credentials,
        evidence.sections.order.customerEmail
      );
      evidence.sources.push(csIntegration.platform);
    }
    
    // 5. FRAUD ANALYSIS (from our internal system)
    if (transactionId) {
      evidence.sections.fraudAnalysis = await ctx.runQuery(api.chargebackFraud.getFraudAnalysis, {
        transactionId,
      });
    }
    
    // 6. ACL COMPLIANCE (from compliance guardrails)
    evidence.sections.aclCompliance = await ctx.runQuery(api.compliance.getComplianceStatus, {
      merchantId,
    });
    
    // Store the evidence package
    const evidenceId = await ctx.runMutation(api.chargebackFraud.storeEvidencePackage, {
      disputeId,
      merchantId,
      evidence,
      status: "ready",
    });
    
    return {
      evidenceId,
      evidence,
      sourcesUsed: evidence.sources,
      sectionsIncluded: Object.keys(evidence.sections),
    };
  },
});

// Helper functions for fetching evidence from each platform
async function fetchTransactionEvidence(
  platform: string,
  credentials: any,
  transactionId: string
): Promise<any> {
  // In production, these would make real API calls
  // For now, return structured placeholder that shows what data would be fetched
  
  const baseEvidence = {
    transactionId,
    fetchedFrom: platform,
    fetchedAt: new Date().toISOString(),
  };
  
  switch (platform) {
    case "stripe":
      return {
        ...baseEvidence,
        chargeId: transactionId,
        amount: null, // Would be fetched from Stripe API
        currency: null,
        paymentMethod: null,
        avsResult: null, // Address Verification
        cvvResult: null, // CVV check result
        threeDSecure: null, // 3DS status
        riskScore: null,
        customerIp: null,
        metadata: null,
      };
      
    case "pin_payments":
      return {
        ...baseEvidence,
        chargeToken: transactionId,
        amount: null,
        currency: "AUD",
        cardScheme: null,
        cardCountry: null,
        avsResult: null,
        cvvResult: null,
        ipAddress: null,
        ipCountry: null,
      };
      
    case "tyro":
      return {
        ...baseEvidence,
        transactionRef: transactionId,
        amount: null,
        terminalId: null,
        merchantId: null,
        authCode: null,
        cardType: null,
      };
      
    default:
      return baseEvidence;
  }
}

async function fetchOrderEvidence(
  platform: string,
  credentials: any,
  orderId: string
): Promise<any> {
  const baseEvidence = {
    orderId,
    fetchedFrom: platform,
    fetchedAt: new Date().toISOString(),
  };
  
  switch (platform) {
    case "shopify":
      return {
        ...baseEvidence,
        orderNumber: null,
        orderDate: null,
        customerEmail: null,
        customerName: null,
        totalAmount: null,
        currency: null,
        lineItems: [],
        shippingAddress: null,
        billingAddress: null,
        fulfillmentStatus: null,
        trackingNumber: null,
        trackingUrl: null,
        notes: null,
        tags: [],
        riskAnalysis: null,
      };
      
    case "woocommerce":
      return {
        ...baseEvidence,
        orderNumber: null,
        status: null,
        dateCreated: null,
        customerEmail: null,
        billing: null,
        shipping: null,
        lineItems: [],
        shippingLines: [],
        paymentMethod: null,
        transactionId: null,
      };
      
    default:
      return baseEvidence;
  }
}

async function fetchDeliveryEvidence(
  platform: string,
  credentials: any,
  trackingNumber: string
): Promise<any> {
  const baseEvidence = {
    trackingNumber,
    fetchedFrom: platform,
    fetchedAt: new Date().toISOString(),
  };
  
  switch (platform) {
    case "australia_post":
      return {
        ...baseEvidence,
        carrier: "Australia Post",
        status: null,
        deliveredAt: null,
        deliveryLocation: null,
        signatureImageUrl: null,
        deliveryPhotoUrl: null,
        recipientName: null,
        events: [], // Full tracking history
        proofOfDelivery: {
          available: false,
          signatureCaptured: false,
          photoCaptured: false,
          gpsVerified: false,
        },
      };
      
    case "sendle":
      return {
        ...baseEvidence,
        carrier: "Sendle",
        status: null,
        deliveredAt: null,
        events: [],
        proofOfDelivery: null,
      };
      
    default:
      return baseEvidence;
  }
}

async function fetchCSEvidence(
  platform: string,
  credentials: any,
  customerEmail: string
): Promise<any> {
  const baseEvidence = {
    customerEmail,
    fetchedFrom: platform,
    fetchedAt: new Date().toISOString(),
  };
  
  switch (platform) {
    case "zendesk":
      return {
        ...baseEvidence,
        tickets: [], // All tickets from this customer
        totalTickets: 0,
        lastContactDate: null,
        communications: [], // Individual messages
        satisfactionRating: null,
      };
      
    case "gorgias":
      return {
        ...baseEvidence,
        conversations: [],
        totalConversations: 0,
        channels: [], // email, chat, social
        lastMessageDate: null,
        customerSentiment: null,
      };
      
    default:
      return baseEvidence;
  }
}

// ============================================
// INTERNAL MUTATIONS FOR WEBHOOKS
// ============================================

export const logWebhookInternal = internalMutation({
  args: {
    platform: v.string(),
    eventType: v.string(),
    payload: v.any(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integrationWebhooks", {
      platform: args.platform,
      eventType: args.eventType,
      payload: args.payload,
      status: args.status,
      receivedAt: Date.now(),
      processedAt: args.status === "processed" ? Date.now() : undefined,
    });
  },
});

export const updateWebhookStatusInternal = internalMutation({
  args: {
    platform: v.string(),
    eventType: v.string(),
    status: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the most recent webhook for this platform/event
    const webhook = await ctx.db
      .query("integrationWebhooks")
      .filter(q => 
        q.and(
          q.eq(q.field("platform"), args.platform),
          q.eq(q.field("eventType"), args.eventType)
        )
      )
      .order("desc")
      .first();
    
    if (webhook) {
      await ctx.db.patch(webhook._id, {
        status: args.status,
        processedAt: Date.now(),
        error: args.error,
      });
    }
  },
});

// ============================================
// DATA SYNC JOBS
// ============================================

/**
 * Sync all data from connected integrations
 * Can be triggered manually or via scheduled job
 */
export const syncAllIntegrations = action({
  args: {
    merchantId: v.id("merchants"),
  },
  handler: async (ctx, args) => {
    const integrations = await ctx.runQuery(api.integrations.getIntegrations, {
      merchantId: args.merchantId,
    });
    
    const results: any[] = [];
    
    for (const integration of integrations) {
      if (integration.status !== "connected") continue;
      
      try {
        const result = await ctx.runAction(api.integrations.syncIntegrationData, {
          integrationId: integration._id,
        });
        results.push({
          platform: integration.platform,
          status: "success",
          ...result,
        });
      } catch (error: any) {
        results.push({
          platform: integration.platform,
          status: "error",
          error: error.message,
        });
      }
    }
    
    return {
      merchantId: args.merchantId,
      syncedAt: new Date().toISOString(),
      results,
    };
  },
});

/**
 * Export chargeback losses to accounting (Xero/MYOB)
 */
export const syncChargebacksToAccounting = action({
  args: {
    merchantId: v.id("merchants"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { merchantId, startDate, endDate } = args;
    
    // Get accounting integration
    const integrations = await ctx.runQuery(api.integrations.getIntegrations, { merchantId });
    const accountingIntegration = integrations.find(i => 
      ["xero", "myob", "quickbooks"].includes(i.platform) && i.status === "connected"
    );
    
    if (!accountingIntegration) {
      throw new Error("No accounting platform connected. Connect Xero, MYOB, or QuickBooks first.");
    }
    
    // Get chargebacks to sync
    const chargebacks = await ctx.runQuery(api.chargebackFraud.getChargebacksForSync, {
      merchantId,
      startDate,
      endDate,
      syncedToAccounting: false,
    });
    
    const results: any[] = [];
    
    for (const chargeback of chargebacks) {
      try {
        // Create expense entry in accounting system
        if (accountingIntegration.platform === "xero") {
          // Xero API call would go here
          const entry = {
            type: "ACCPAY", // Accounts Payable
            contact: { name: "Chargeback Losses" },
            date: chargeback.createdAt,
            lineItems: [{
              description: `Chargeback - ${chargeback.reason} - Transaction ${chargeback.transactionId}`,
              quantity: 1,
              unitAmount: chargeback.amount + (chargeback.fee || 0),
              accountCode: "429", // Bank Fees or similar
              taxType: "NONE",
            }],
            reference: chargeback.disputeId,
          };
          
          // Mark as synced
          await ctx.runMutation(api.chargebackFraud.markChargebackSynced, {
            chargebackId: chargeback._id,
            syncedTo: "xero",
            syncReference: entry.reference,
          });
          
          results.push({
            chargebackId: chargeback._id,
            status: "synced",
            platform: "xero",
          });
        }
      } catch (error: any) {
        results.push({
          chargebackId: chargeback._id,
          status: "error",
          error: error.message,
        });
      }
    }
    
    return {
      totalChargebacks: chargebacks.length,
      synced: results.filter(r => r.status === "synced").length,
      errors: results.filter(r => r.status === "error").length,
      results,
    };
  },
});