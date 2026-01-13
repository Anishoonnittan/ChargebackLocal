import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// =============================================================================
// WEBHOOK HANDLER - Processes incoming webhooks from all integrated platforms
// =============================================================================

/**
 * Main webhook processor - routes incoming webhooks to appropriate handlers
 * Each platform sends webhooks in different formats, this normalizes them
 */
export const processIncomingWebhook = action({
  args: {
    platform: v.string(),
    payload: v.any(),
    headers: v.optional(v.any()),
    signature: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { platform, payload, headers, signature } = args;

    // Log the incoming webhook
    await ctx.runMutation(api.integrationWebhooks.logWebhookEvent, {
      platform,
      eventType: payload.type || payload.event_type || "unknown",
      payload: JSON.stringify(payload),
      status: "processing",
    });

    try {
      let result;

      switch (platform.toLowerCase()) {
        // =====================================================================
        // PAYMENT GATEWAY WEBHOOKS
        // =====================================================================
        case "stripe":
          result = await handleStripeWebhook(ctx, payload);
          break;

        case "pin_payments":
          result = await handlePinPaymentsWebhook(ctx, payload);
          break;

        case "tyro":
          result = await handleTyroWebhook(ctx, payload);
          break;

        case "paypal":
          result = await handlePayPalWebhook(ctx, payload);
          break;

        case "square":
          result = await handleSquareWebhook(ctx, payload);
          break;

        // =====================================================================
        // E-COMMERCE PLATFORM WEBHOOKS
        // =====================================================================
        case "shopify":
          result = await handleShopifyWebhook(ctx, payload, headers);
          break;

        case "woocommerce":
          result = await handleWooCommerceWebhook(ctx, payload);
          break;

        case "bigcommerce":
          result = await handleBigCommerceWebhook(ctx, payload);
          break;

        // =====================================================================
        // SHIPPING PROVIDER WEBHOOKS
        // =====================================================================
        case "australia_post":
          result = await handleAustraliaPostWebhook(ctx, payload);
          break;

        case "sendle":
          result = await handleSendleWebhook(ctx, payload);
          break;

        case "startrack":
          result = await handleStarTrackWebhook(ctx, payload);
          break;

        // =====================================================================
        // ACCOUNTING WEBHOOKS
        // =====================================================================
        case "xero":
          result = await handleXeroWebhook(ctx, payload);
          break;

        case "myob":
          result = await handleMYOBWebhook(ctx, payload);
          break;

        // =====================================================================
        // CUSTOMER SERVICE WEBHOOKS
        // =====================================================================
        case "zendesk":
          result = await handleZendeskWebhook(ctx, payload);
          break;

        case "gorgias":
          result = await handleGorgiasWebhook(ctx, payload);
          break;

        case "freshdesk":
          result = await handleFreshdeskWebhook(ctx, payload);
          break;

        default:
          throw new Error(`Unknown platform: ${platform}`);
      }

      // Update webhook log with success
      await ctx.runMutation(api.integrationWebhooks.updateWebhookStatus, {
        platform,
        eventType: payload.type || payload.event_type || "unknown",
        status: "processed",
        result: JSON.stringify(result),
      });

      return { success: true, result };
    } catch (error: any) {
      // Log the error
      await ctx.runMutation(api.integrationWebhooks.updateWebhookStatus, {
        platform,
        eventType: payload.type || payload.event_type || "unknown",
        status: "failed",
        error: error.message,
      });

      return { success: false, error: error.message };
    }
  },
});

// =============================================================================
// STRIPE WEBHOOK HANDLER
// =============================================================================
async function handleStripeWebhook(ctx: any, payload: any) {
  const eventType = payload.type;
  const data = payload.data?.object;

  switch (eventType) {
    // Dispute events - CRITICAL for chargeback management
    case "charge.dispute.created":
      return await createDisputeAlert(ctx, {
        platform: "stripe",
        disputeId: data.id,
        chargeId: data.charge,
        amount: data.amount / 100, // Stripe amounts are in cents
        currency: data.currency?.toUpperCase() || "AUD",
        reason: data.reason,
        status: "needs_response",
        evidenceDueBy: data.evidence_details?.due_by
          ? new Date(data.evidence_details.due_by * 1000).toISOString()
          : null,
        customerEmail: data.evidence?.customer_email_address,
      });

    case "charge.dispute.updated":
      return await updateDisputeStatus(ctx, {
        platform: "stripe",
        disputeId: data.id,
        status: data.status,
        reason: data.reason,
      });

    case "charge.dispute.closed":
      return await closeDispute(ctx, {
        platform: "stripe",
        disputeId: data.id,
        status: data.status, // won, lost, or accepted
      });

    // Early fraud warning - PRE-DISPUTE ALERT
    case "radar.early_fraud_warning.created":
      return await createPreDisputeAlert(ctx, {
        platform: "stripe",
        warningId: data.id,
        chargeId: data.charge,
        fraudType: data.fraud_type,
        actionable: data.actionable,
      });

    // Payment events for transaction tracking
    case "payment_intent.succeeded":
      return await recordTransaction(ctx, {
        platform: "stripe",
        transactionId: data.id,
        amount: data.amount / 100,
        currency: data.currency?.toUpperCase() || "AUD",
        status: "succeeded",
        customerEmail: data.receipt_email,
      });

    case "charge.refunded":
      return await recordRefund(ctx, {
        platform: "stripe",
        chargeId: data.id,
        refundAmount: data.amount_refunded / 100,
        reason: data.refund_reason,
      });

    default:
      return { handled: false, eventType };
  }
}

// =============================================================================
// PIN PAYMENTS WEBHOOK HANDLER (AU Priority)
// =============================================================================
async function handlePinPaymentsWebhook(ctx: any, payload: any) {
  const eventType = payload.event_type;
  const data = payload.data;

  switch (eventType) {
    // Charge events
    case "charge.success":
      return await recordTransaction(ctx, {
        platform: "pin_payments",
        transactionId: data.token,
        amount: parseFloat(data.amount) / 100,
        currency: data.currency || "AUD",
        status: "succeeded",
        customerEmail: data.email,
        cardBrand: data.card?.scheme,
        cardLast4: data.card?.display_number?.slice(-4),
      });

    case "charge.failed":
      return await recordTransaction(ctx, {
        platform: "pin_payments",
        transactionId: data.token,
        amount: parseFloat(data.amount) / 100,
        currency: data.currency || "AUD",
        status: "failed",
        failureReason: data.error_message,
      });

    // Refund events
    case "refund.success":
      return await recordRefund(ctx, {
        platform: "pin_payments",
        chargeId: data.charge_token,
        refundAmount: parseFloat(data.amount) / 100,
        reason: "merchant_initiated",
      });

    // Dispute events (Pin Payments calls them "chargebacks")
    case "chargeback.open":
      return await createDisputeAlert(ctx, {
        platform: "pin_payments",
        disputeId: data.token,
        chargeId: data.charge_token,
        amount: parseFloat(data.amount) / 100,
        currency: data.currency || "AUD",
        reason: data.reason,
        status: "needs_response",
        evidenceDueBy: data.evidence_due_date,
      });

    case "chargeback.won":
      return await closeDispute(ctx, {
        platform: "pin_payments",
        disputeId: data.token,
        status: "won",
      });

    case "chargeback.lost":
      return await closeDispute(ctx, {
        platform: "pin_payments",
        disputeId: data.token,
        status: "lost",
      });

    default:
      return { handled: false, eventType };
  }
}

// =============================================================================
// TYRO WEBHOOK HANDLER (AU Priority)
// =============================================================================
async function handleTyroWebhook(ctx: any, payload: any) {
  const eventType = payload.eventType || payload.type;
  const data = payload.data || payload;

  switch (eventType) {
    case "TRANSACTION_COMPLETED":
      return await recordTransaction(ctx, {
        platform: "tyro",
        transactionId: data.transactionId,
        amount: parseFloat(data.amount),
        currency: "AUD",
        status: "succeeded",
        cardBrand: data.cardType,
        cardLast4: data.maskedCardNumber?.slice(-4),
        terminalId: data.terminalId,
      });

    case "CHARGEBACK_RECEIVED":
      return await createDisputeAlert(ctx, {
        platform: "tyro",
        disputeId: data.chargebackId,
        chargeId: data.transactionId,
        amount: parseFloat(data.amount),
        currency: "AUD",
        reason: data.reasonCode,
        status: "needs_response",
        evidenceDueBy: data.responseDueDate,
      });

    case "CHARGEBACK_RESOLVED":
      return await closeDispute(ctx, {
        platform: "tyro",
        disputeId: data.chargebackId,
        status: data.outcome === "MERCHANT_WIN" ? "won" : "lost",
      });

    default:
      return { handled: false, eventType };
  }
}

// =============================================================================
// PAYPAL WEBHOOK HANDLER
// =============================================================================
async function handlePayPalWebhook(ctx: any, payload: any) {
  const eventType = payload.event_type;
  const resource = payload.resource;

  switch (eventType) {
    case "PAYMENT.CAPTURE.COMPLETED":
      return await recordTransaction(ctx, {
        platform: "paypal",
        transactionId: resource.id,
        amount: parseFloat(resource.amount?.value || "0"),
        currency: resource.amount?.currency_code || "AUD",
        status: "succeeded",
      });

    case "CUSTOMER.DISPUTE.CREATED":
      return await createDisputeAlert(ctx, {
        platform: "paypal",
        disputeId: resource.dispute_id,
        chargeId: resource.disputed_transactions?.[0]?.buyer_transaction_id,
        amount: parseFloat(
          resource.dispute_amount?.value ||
            resource.disputed_transactions?.[0]?.gross_amount?.value ||
            "0"
        ),
        currency:
          resource.dispute_amount?.currency_code ||
          resource.disputed_transactions?.[0]?.gross_amount?.currency_code ||
          "AUD",
        reason: resource.reason,
        status: "needs_response",
        evidenceDueBy: resource.seller_response_due_date,
      });

    case "CUSTOMER.DISPUTE.RESOLVED":
      return await closeDispute(ctx, {
        platform: "paypal",
        disputeId: resource.dispute_id,
        status: resource.dispute_outcome?.outcome_code === "RESOLVED_SELLER_FAVOUR" ? "won" : "lost",
      });

    default:
      return { handled: false, eventType };
  }
}

// =============================================================================
// SQUARE WEBHOOK HANDLER
// =============================================================================
async function handleSquareWebhook(ctx: any, payload: any) {
  const eventType = payload.type;
  const data = payload.data?.object;

  switch (eventType) {
    case "payment.completed":
      return await recordTransaction(ctx, {
        platform: "square",
        transactionId: data.payment?.id,
        amount: (data.payment?.amount_money?.amount || 0) / 100,
        currency: data.payment?.amount_money?.currency || "AUD",
        status: "succeeded",
      });

    case "dispute.created":
      return await createDisputeAlert(ctx, {
        platform: "square",
        disputeId: data.dispute?.id,
        chargeId: data.dispute?.payment_id,
        amount: (data.dispute?.amount_money?.amount || 0) / 100,
        currency: data.dispute?.amount_money?.currency || "AUD",
        reason: data.dispute?.reason,
        status: "needs_response",
        evidenceDueBy: data.dispute?.due_at,
      });

    default:
      return { handled: false, eventType };
  }
}

// =============================================================================
// SHOPIFY WEBHOOK HANDLER
// =============================================================================
async function handleShopifyWebhook(ctx: any, payload: any, headers: any) {
  // Shopify uses X-Shopify-Topic header to identify event type
  const topic = headers?.["x-shopify-topic"] || payload.topic;

  switch (topic) {
    case "orders/create":
      return await syncShopifyOrder(ctx, payload, "created");

    case "orders/updated":
      return await syncShopifyOrder(ctx, payload, "updated");

    case "orders/fulfilled":
      return await updateOrderFulfillment(ctx, {
        platform: "shopify",
        orderId: payload.id?.toString(),
        fulfillmentStatus: "fulfilled",
        trackingNumber: payload.fulfillments?.[0]?.tracking_number,
        trackingCompany: payload.fulfillments?.[0]?.tracking_company,
        trackingUrl: payload.fulfillments?.[0]?.tracking_url,
      });

    case "orders/cancelled":
      return await cancelOrder(ctx, {
        platform: "shopify",
        orderId: payload.id?.toString(),
        cancelReason: payload.cancel_reason,
      });

    case "refunds/create":
      return await recordRefund(ctx, {
        platform: "shopify",
        chargeId: payload.order_id?.toString(),
        refundAmount: payload.transactions?.reduce(
          (sum: number, t: any) => sum + parseFloat(t.amount || "0"),
          0
        ),
        reason: payload.note || "customer_request",
      });

    case "disputes/create":
      return await createDisputeAlert(ctx, {
        platform: "shopify",
        disputeId: payload.id?.toString(),
        chargeId: payload.order_id?.toString(),
        amount: parseFloat(payload.amount || "0"),
        currency: payload.currency || "AUD",
        reason: payload.reason,
        status: "needs_response",
        evidenceDueBy: payload.evidence_due_by,
      });

    case "customers/create":
    case "customers/update":
      return await syncShopifyCustomer(ctx, payload);

    default:
      return { handled: false, topic };
  }
}

async function syncShopifyOrder(ctx: any, order: any, action: string) {
  // Store order for evidence generation
  return await ctx.runMutation(api.integrationWebhooks.storeOrderData, {
    platform: "shopify",
    orderId: order.id?.toString(),
    orderNumber: order.order_number?.toString() || order.name,
    customerEmail: order.email,
    customerName: `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim(),
    totalAmount: parseFloat(order.total_price || "0"),
    currency: order.currency || "AUD",
    lineItems: order.line_items?.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: parseFloat(item.price || "0"),
      sku: item.sku,
    })),
    shippingAddress: order.shipping_address
      ? {
          address1: order.shipping_address.address1,
          address2: order.shipping_address.address2,
          city: order.shipping_address.city,
          province: order.shipping_address.province,
          country: order.shipping_address.country,
          zip: order.shipping_address.zip,
        }
      : null,
    billingAddress: order.billing_address
      ? {
          address1: order.billing_address.address1,
          city: order.billing_address.city,
          province: order.billing_address.province,
          country: order.billing_address.country,
          zip: order.billing_address.zip,
        }
      : null,
    fulfillmentStatus: order.fulfillment_status,
    financialStatus: order.financial_status,
    createdAt: order.created_at,
    action,
  });
}

async function syncShopifyCustomer(ctx: any, customer: any) {
  return await ctx.runMutation(api.integrationWebhooks.storeCustomerData, {
    platform: "shopify",
    customerId: customer.id?.toString(),
    email: customer.email,
    firstName: customer.first_name,
    lastName: customer.last_name,
    phone: customer.phone,
    ordersCount: customer.orders_count,
    totalSpent: parseFloat(customer.total_spent || "0"),
    tags: customer.tags?.split(",").map((t: string) => t.trim()) || [],
  });
}

// =============================================================================
// WOOCOMMERCE WEBHOOK HANDLER
// =============================================================================
async function handleWooCommerceWebhook(ctx: any, payload: any) {
  // WooCommerce sends different formats based on webhook type
  const action = payload.action || "unknown";
  const data = payload.data || payload;

  if (payload.order_id || payload.id) {
    // Order webhook
    return await ctx.runMutation(api.integrationWebhooks.storeOrderData, {
      platform: "woocommerce",
      orderId: (payload.order_id || payload.id)?.toString(),
      orderNumber: payload.number?.toString(),
      customerEmail: payload.billing?.email,
      customerName: `${payload.billing?.first_name || ""} ${payload.billing?.last_name || ""}`.trim(),
      totalAmount: parseFloat(payload.total || "0"),
      currency: payload.currency || "AUD",
      lineItems: payload.line_items?.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price || "0"),
        sku: item.sku,
      })),
      shippingAddress: payload.shipping
        ? {
            address1: payload.shipping.address_1,
            address2: payload.shipping.address_2,
            city: payload.shipping.city,
            province: payload.shipping.state,
            country: payload.shipping.country,
            zip: payload.shipping.postcode,
          }
        : null,
      fulfillmentStatus: payload.status,
      createdAt: payload.date_created,
      action,
    });
  }

  return { handled: false, action };
}

// =============================================================================
// BIGCOMMERCE WEBHOOK HANDLER
// =============================================================================
async function handleBigCommerceWebhook(ctx: any, payload: any) {
  const scope = payload.scope;
  const data = payload.data;

  if (scope?.includes("store/order")) {
    return { handled: true, scope, message: "Order webhook received" };
  }

  return { handled: false, scope };
}

// =============================================================================
// AUSTRALIA POST WEBHOOK HANDLER (AU Priority)
// =============================================================================
async function handleAustraliaPostWebhook(ctx: any, payload: any) {
  const eventType = payload.event_type || payload.eventType;
  const data = payload.data || payload;

  switch (eventType) {
    case "DELIVERED":
    case "delivery.completed":
      return await recordDeliveryProof(ctx, {
        platform: "australia_post",
        trackingNumber: data.tracking_id || data.trackingNumber,
        status: "delivered",
        deliveredAt: data.event_date || data.deliveredAt,
        deliveryLocation: data.location,
        signedBy: data.signed_by || data.signedBy,
        hasPhoto: !!data.delivery_photo_url,
        photoUrl: data.delivery_photo_url,
        deliveryDetails: {
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.delivery_address,
        },
      });

    case "IN_TRANSIT":
    case "tracking.updated":
      return await updateTrackingStatus(ctx, {
        platform: "australia_post",
        trackingNumber: data.tracking_id || data.trackingNumber,
        status: "in_transit",
        lastLocation: data.location,
        estimatedDelivery: data.estimated_delivery_date,
      });

    case "OUT_FOR_DELIVERY":
      return await updateTrackingStatus(ctx, {
        platform: "australia_post",
        trackingNumber: data.tracking_id || data.trackingNumber,
        status: "out_for_delivery",
        lastLocation: data.location,
      });

    case "EXCEPTION":
    case "delivery.failed":
      return await updateTrackingStatus(ctx, {
        platform: "australia_post",
        trackingNumber: data.tracking_id || data.trackingNumber,
        status: "exception",
        exceptionReason: data.reason || data.exception_reason,
      });

    default:
      return { handled: false, eventType };
  }
}

// =============================================================================
// SENDLE WEBHOOK HANDLER (AU Priority)
// =============================================================================
async function handleSendleWebhook(ctx: any, payload: any) {
  const eventType = payload.event || payload.event_type;
  const data = payload.data || payload;

  switch (eventType) {
    case "delivered":
      return await recordDeliveryProof(ctx, {
        platform: "sendle",
        trackingNumber: data.tracking_url?.split("/").pop() || data.sendle_reference,
        status: "delivered",
        deliveredAt: data.delivered_at,
        signedBy: data.signed_by,
        deliveryDetails: {
          address: data.to?.address,
        },
      });

    case "pickup":
      return await updateTrackingStatus(ctx, {
        platform: "sendle",
        trackingNumber: data.sendle_reference,
        status: "picked_up",
      });

    case "in_transit":
      return await updateTrackingStatus(ctx, {
        platform: "sendle",
        trackingNumber: data.sendle_reference,
        status: "in_transit",
        estimatedDelivery: data.estimated_delivery_date,
      });

    default:
      return { handled: false, eventType };
  }
}

// =============================================================================
// STARTRACK WEBHOOK HANDLER
// =============================================================================
async function handleStarTrackWebhook(ctx: any, payload: any) {
  // StarTrack uses similar format to Australia Post (same parent company)
  return await handleAustraliaPostWebhook(ctx, payload);
}

// =============================================================================
// XERO WEBHOOK HANDLER
// =============================================================================
async function handleXeroWebhook(ctx: any, payload: any) {
  // Xero webhooks are mainly for connection status
  const eventType = payload.eventType;

  switch (eventType) {
    case "INVOICE.CREATED":
    case "INVOICE.UPDATED":
      return { handled: true, eventType, message: "Invoice event received" };

    case "CONTACT.UPDATED":
      return { handled: true, eventType, message: "Contact event received" };

    default:
      return { handled: false, eventType };
  }
}

// =============================================================================
// MYOB WEBHOOK HANDLER
// =============================================================================
async function handleMYOBWebhook(ctx: any, payload: any) {
  const eventType = payload.EventType || payload.event_type;
  return { handled: true, eventType, message: "MYOB event received" };
}

// =============================================================================
// ZENDESK WEBHOOK HANDLER
// =============================================================================
async function handleZendeskWebhook(ctx: any, payload: any) {
  const eventType = payload.type || "ticket_event";
  const ticket = payload.ticket || payload;

  if (ticket.id) {
    return await ctx.runMutation(api.integrationWebhooks.storeSupportTicket, {
      platform: "zendesk",
      ticketId: ticket.id?.toString(),
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      requesterEmail: ticket.requester?.email,
      requesterName: ticket.requester?.name,
      assigneeEmail: ticket.assignee?.email,
      tags: ticket.tags || [],
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      description: ticket.description,
      comments: ticket.comments?.map((c: any) => ({
        body: c.body,
        author: c.author?.name,
        createdAt: c.created_at,
        public: c.public,
      })),
    });
  }

  return { handled: false, eventType };
}

// =============================================================================
// GORGIAS WEBHOOK HANDLER
// =============================================================================
async function handleGorgiasWebhook(ctx: any, payload: any) {
  const eventType = payload.event || "ticket_event";
  const ticket = payload.ticket || payload;

  if (ticket.id) {
    return await ctx.runMutation(api.integrationWebhooks.storeSupportTicket, {
      platform: "gorgias",
      ticketId: ticket.id?.toString(),
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      requesterEmail: ticket.customer?.email,
      requesterName: ticket.customer?.name,
      assigneeEmail: ticket.assignee_user?.email,
      tags: ticket.tags?.map((t: any) => t.name) || [],
      createdAt: ticket.created_datetime,
      updatedAt: ticket.updated_datetime,
      messages: ticket.messages?.map((m: any) => ({
        body: m.body_text,
        sender: m.sender?.email,
        createdAt: m.created_datetime,
        channel: m.channel,
      })),
    });
  }

  return { handled: false, eventType };
}

// =============================================================================
// FRESHDESK WEBHOOK HANDLER
// =============================================================================
async function handleFreshdeskWebhook(ctx: any, payload: any) {
  const ticket = payload.ticket || payload;

  if (ticket.id) {
    return await ctx.runMutation(api.integrationWebhooks.storeSupportTicket, {
      platform: "freshdesk",
      ticketId: ticket.id?.toString(),
      subject: ticket.subject,
      status: ticket.status_name || ticket.status,
      priority: ticket.priority_name || ticket.priority,
      requesterEmail: ticket.requester?.email,
      requesterName: ticket.requester?.name,
      tags: ticket.tags || [],
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      description: ticket.description,
    });
  }

  return { handled: false };
}

// =============================================================================
// HELPER FUNCTIONS - Create alerts, record data, etc.
// =============================================================================

async function createDisputeAlert(ctx: any, data: any) {
  // Create a high-priority alert for the merchant
  return await ctx.runMutation(api.integrationWebhooks.createDisputeAlertRecord, {
    platform: data.platform,
    disputeId: data.disputeId,
    chargeId: data.chargeId,
    amount: data.amount,
    currency: data.currency,
    reason: data.reason,
    status: data.status,
    evidenceDueBy: data.evidenceDueBy,
    customerEmail: data.customerEmail,
  });
}

async function createPreDisputeAlert(ctx: any, data: any) {
  // Pre-dispute alert - high priority, can prevent chargeback
  return await ctx.runMutation(api.integrationWebhooks.createPreDisputeAlertRecord, {
    platform: data.platform,
    warningId: data.warningId,
    chargeId: data.chargeId,
    fraudType: data.fraudType,
    actionable: data.actionable,
  });
}

async function updateDisputeStatus(ctx: any, data: any) {
  return { action: "dispute_updated", ...data };
}

async function closeDispute(ctx: any, data: any) {
  return await ctx.runMutation(api.integrationWebhooks.closeDisputeRecord, {
    platform: data.platform,
    disputeId: data.disputeId,
    status: data.status,
  });
}

async function recordTransaction(ctx: any, data: any) {
  return await ctx.runMutation(api.integrationWebhooks.storeTransaction, {
    platform: data.platform,
    transactionId: data.transactionId,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    customerEmail: data.customerEmail,
    cardBrand: data.cardBrand,
    cardLast4: data.cardLast4,
    failureReason: data.failureReason,
    terminalId: data.terminalId,
  });
}

async function recordRefund(ctx: any, data: any) {
  return await ctx.runMutation(api.integrationWebhooks.storeRefund, {
    platform: data.platform,
    chargeId: data.chargeId,
    refundAmount: data.refundAmount,
    reason: data.reason,
  });
}

async function recordDeliveryProof(ctx: any, data: any) {
  return await ctx.runMutation(api.integrationWebhooks.storeDeliveryProof, {
    platform: data.platform,
    trackingNumber: data.trackingNumber,
    status: data.status,
    deliveredAt: data.deliveredAt,
    deliveryLocation: data.deliveryLocation,
    signedBy: data.signedBy,
    hasPhoto: data.hasPhoto,
    photoUrl: data.photoUrl,
    deliveryDetails: data.deliveryDetails,
  });
}

async function updateTrackingStatus(ctx: any, data: any) {
  return await ctx.runMutation(api.integrationWebhooks.updateTrackingRecord, {
    platform: data.platform,
    trackingNumber: data.trackingNumber,
    status: data.status,
    lastLocation: data.lastLocation,
    estimatedDelivery: data.estimatedDelivery,
    exceptionReason: data.exceptionReason,
  });
}

async function updateOrderFulfillment(ctx: any, data: any) {
  return { action: "order_fulfilled", ...data };
}

async function cancelOrder(ctx: any, data: any) {
  return { action: "order_cancelled", ...data };
}

// =============================================================================
// MUTATIONS FOR STORING WEBHOOK DATA
// =============================================================================

export const logWebhookEvent = mutation({
  args: {
    platform: v.string(),
    eventType: v.string(),
    payload: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integrationWebhooks", {
      platform: args.platform,
      eventType: args.eventType,
      payload: args.payload,
      status: args.status,
      receivedAt: Date.now(),
    });
  },
});

export const updateWebhookStatus = mutation({
  args: {
    platform: v.string(),
    eventType: v.string(),
    status: v.string(),
    result: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the most recent webhook for this platform/eventType and update it
    const webhooks = await ctx.db
      .query("integrationWebhooks")
      .filter((q) =>
        q.and(
          q.eq(q.field("platform"), args.platform),
          q.eq(q.field("eventType"), args.eventType)
        )
      )
      .order("desc")
      .take(1);

    if (webhooks.length > 0) {
      await ctx.db.patch(webhooks[0]._id, {
        status: args.status,
        processedAt: Date.now(),
        result: args.result,
        error: args.error,
      });
    }

    return { updated: true };
  },
});

export const storeOrderData = mutation({
  args: {
    platform: v.string(),
    orderId: v.string(),
    orderNumber: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerName: v.optional(v.string()),
    totalAmount: v.number(),
    currency: v.string(),
    lineItems: v.optional(v.array(v.any())),
    shippingAddress: v.optional(v.any()),
    billingAddress: v.optional(v.any()),
    fulfillmentStatus: v.optional(v.string()),
    financialStatus: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    action: v.string(),
  },
  handler: async (ctx, args) => {
    // Store order data for evidence generation
    // In a real implementation, this would upsert to an orders table
    return { stored: true, orderId: args.orderId, platform: args.platform };
  },
});

export const storeCustomerData = mutation({
  args: {
    platform: v.string(),
    customerId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    ordersCount: v.optional(v.number()),
    totalSpent: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return { stored: true, customerId: args.customerId, platform: args.platform };
  },
});

export const storeTransaction = mutation({
  args: {
    platform: v.string(),
    transactionId: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    customerEmail: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
    cardLast4: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    terminalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return { stored: true, transactionId: args.transactionId, platform: args.platform };
  },
});

export const storeRefund = mutation({
  args: {
    platform: v.string(),
    chargeId: v.string(),
    refundAmount: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return { stored: true, chargeId: args.chargeId, platform: args.platform };
  },
});

export const storeDeliveryProof = mutation({
  args: {
    platform: v.string(),
    trackingNumber: v.string(),
    status: v.string(),
    deliveredAt: v.optional(v.string()),
    deliveryLocation: v.optional(v.string()),
    signedBy: v.optional(v.string()),
    hasPhoto: v.optional(v.boolean()),
    photoUrl: v.optional(v.string()),
    deliveryDetails: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return { stored: true, trackingNumber: args.trackingNumber, platform: args.platform };
  },
});

export const updateTrackingRecord = mutation({
  args: {
    platform: v.string(),
    trackingNumber: v.string(),
    status: v.string(),
    lastLocation: v.optional(v.string()),
    estimatedDelivery: v.optional(v.string()),
    exceptionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return { updated: true, trackingNumber: args.trackingNumber };
  },
});

export const storeSupportTicket = mutation({
  args: {
    platform: v.string(),
    ticketId: v.string(),
    subject: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    requesterEmail: v.optional(v.string()),
    requesterName: v.optional(v.string()),
    assigneeEmail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
    description: v.optional(v.string()),
    comments: v.optional(v.array(v.any())),
    messages: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    return { stored: true, ticketId: args.ticketId, platform: args.platform };
  },
});

export const createDisputeAlertRecord = mutation({
  args: {
    platform: v.string(),
    disputeId: v.string(),
    chargeId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    reason: v.optional(v.string()),
    status: v.string(),
    evidenceDueBy: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create a dispute alert that will show in the merchant dashboard
    return {
      created: true,
      disputeId: args.disputeId,
      platform: args.platform,
      amount: args.amount,
      message: `New dispute alert: $${args.amount} ${args.currency} from ${args.platform}`,
    };
  },
});

export const createPreDisputeAlertRecord = mutation({
  args: {
    platform: v.string(),
    warningId: v.string(),
    chargeId: v.optional(v.string()),
    fraudType: v.optional(v.string()),
    actionable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Create a pre-dispute alert - very high priority
    return {
      created: true,
      warningId: args.warningId,
      platform: args.platform,
      message: `Pre-dispute alert! Customer may file chargeback. Action recommended.`,
      priority: "critical",
    };
  },
});

export const closeDisputeRecord = mutation({
  args: {
    platform: v.string(),
    disputeId: v.string(),
    status: v.string(), // won, lost, accepted
  },
  handler: async (ctx, args) => {
    return {
      closed: true,
      disputeId: args.disputeId,
      status: args.status,
      message: `Dispute ${args.disputeId} closed with status: ${args.status}`,
    };
  },
});

// =============================================================================
// QUERY: Get recent webhook events for monitoring
// =============================================================================
export const getRecentWebhooks = query({
  args: {
    platform: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let webhooksQuery = ctx.db.query("integrationWebhooks").order("desc");

    if (args.platform) {
      webhooksQuery = webhooksQuery.filter((q) =>
        q.eq(q.field("platform"), args.platform)
      );
    }

    return await webhooksQuery.take(limit);
  },
});