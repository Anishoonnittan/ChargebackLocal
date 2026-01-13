import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Customer Communication Automation
 * 
 * Auto-sends de-escalation messages when risk is high:
 * - Pre-shipment: "Thanks for your order! Tracking updates here → [link]"
 * - Post-delivery: "Your order arrived! Need help? Reply here — no need to contact your bank."
 * - Pre-dispute alert: "We noticed a query on your order — here's proof of delivery. Can we help?"
 * 
 * Channels: SMS (Twilio), Email (SendGrid), WhatsApp (opt-in)
 * Compliance: All messages include "STOP" (ACMA) + privacy notice
 */

// ============================================
// MESSAGE TEMPLATE MANAGEMENT
// ============================================

// Get all message templates for an app
export const getMessageTemplates = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get the user's apps
    const apps = await ctx.db
      .query("apps")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    if (apps.length === 0) return [];
    
    const appId = apps[0]._id;
    
    return await ctx.db
      .query("messageTemplates")
      .withIndex("by_app", (q) => q.eq("appId", appId))
      .collect();
  },
});

// Create a message template
export const createMessageTemplate = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    type: v.string(),
    channel: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
    includeStopText: v.boolean(),
    includePrivacyNotice: v.boolean(),
    includeBusinessDetails: v.boolean(),
    triggerConditions: v.optional(v.object({
      riskScoreMin: v.optional(v.number()),
      orderValueMin: v.optional(v.number()),
      customerType: v.optional(v.string()),
      delayMinutes: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Get the user's app
    const apps = await ctx.db
      .query("apps")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    if (apps.length === 0) {
      throw new Error("No app found for user");
    }
    
    const appId = apps[0]._id;
    
    return await ctx.db.insert("messageTemplates", {
      appId,
      name: args.name,
      type: args.type,
      channel: args.channel,
      subject: args.subject,
      body: args.body,
      isActive: true,
      includeStopText: args.includeStopText,
      includePrivacyNotice: args.includePrivacyNotice,
      includeBusinessDetails: args.includeBusinessDetails,
      triggerConditions: args.triggerConditions,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update a message template
export const updateMessageTemplate = mutation({
  args: {
    templateId: v.id("messageTemplates"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    channel: v.optional(v.string()),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    includeStopText: v.optional(v.boolean()),
    includePrivacyNotice: v.optional(v.boolean()),
    includeBusinessDetails: v.optional(v.boolean()),
    triggerConditions: v.optional(v.object({
      riskScoreMin: v.optional(v.number()),
      orderValueMin: v.optional(v.number()),
      customerType: v.optional(v.string()),
      delayMinutes: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const { templateId, ...updates } = args;
    
    const template = await ctx.db.get(templateId);
    if (!template) {
      throw new Error("Template not found");
    }
    
    // Filter out undefined values
    const filteredUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }
    
    await ctx.db.patch(templateId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
    
    return templateId;
  },
});

// Delete a message template
export const deleteMessageTemplate = mutation({
  args: { templateId: v.id("messageTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.templateId);
  },
});

// ============================================
// CUSTOMER PREFERENCES (OPT-IN/OPT-OUT)
// ============================================

// Get customer preferences
export const getCustomerPreferences = query({
  args: {
    userId: v.id("users"),
    customerEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const apps = await ctx.db
      .query("apps")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    if (apps.length === 0) return null;
    
    const appId = apps[0]._id;
    
    const preferences = await ctx.db
      .query("customerPreferences")
      .withIndex("by_email", (q) => 
        q.eq("appId", appId).eq("customerEmail", args.customerEmail)
      )
      .first();
    
    return preferences;
  },
});

// Update customer preferences (opt-in/opt-out)
export const updateCustomerPreferences = mutation({
  args: {
    userId: v.id("users"),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    emailOptIn: v.optional(v.boolean()),
    smsOptIn: v.optional(v.boolean()),
    whatsappOptIn: v.optional(v.boolean()),
    consentSource: v.optional(v.string()),
    consentIpAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apps = await ctx.db
      .query("apps")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    if (apps.length === 0) {
      throw new Error("No app found for user");
    }
    
    const appId = apps[0]._id;
    
    // Check if preferences exist
    const existing = await ctx.db
      .query("customerPreferences")
      .withIndex("by_email", (q) => 
        q.eq("appId", appId).eq("customerEmail", args.customerEmail)
      )
      .first();
    
    const now = Date.now();
    
    if (existing) {
      // Update existing preferences
      const updates: Record<string, any> = { updatedAt: now };
      
      if (args.customerPhone !== undefined) updates.customerPhone = args.customerPhone;
      if (args.emailOptIn !== undefined) {
        updates.emailOptIn = args.emailOptIn;
        if (!args.emailOptIn) updates.emailOptOutAt = now;
      }
      if (args.smsOptIn !== undefined) {
        updates.smsOptIn = args.smsOptIn;
        if (!args.smsOptIn) updates.smsOptOutAt = now;
      }
      if (args.whatsappOptIn !== undefined) {
        updates.whatsappOptIn = args.whatsappOptIn;
        if (!args.whatsappOptIn) updates.whatsappOptOutAt = now;
      }
      
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      // Create new preferences
      return await ctx.db.insert("customerPreferences", {
        appId,
        customerEmail: args.customerEmail,
        customerPhone: args.customerPhone,
        emailOptIn: args.emailOptIn ?? true,
        smsOptIn: args.smsOptIn ?? false,
        whatsappOptIn: args.whatsappOptIn ?? false,
        consentRecordedAt: now,
        consentSource: args.consentSource ?? "manual",
        consentIpAddress: args.consentIpAddress,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Handle STOP opt-out (ACMA compliance)
export const handleStopOptOut = mutation({
  args: {
    userId: v.id("users"),
    customerPhone: v.string(),
    channel: v.string(), // "sms" or "whatsapp"
  },
  handler: async (ctx, args) => {
    const apps = await ctx.db
      .query("apps")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    if (apps.length === 0) return;
    
    const appId = apps[0]._id;
    
    // Find customer by phone
    const preferences = await ctx.db
      .query("customerPreferences")
      .withIndex("by_phone", (q) => 
        q.eq("appId", appId).eq("customerPhone", args.customerPhone)
      )
      .first();
    
    if (preferences) {
      const now = Date.now();
      const updates: Record<string, any> = {
        optOutReason: "STOP received",
        updatedAt: now,
      };
      
      if (args.channel === "sms") {
        updates.smsOptIn = false;
        updates.smsOptOutAt = now;
      } else if (args.channel === "whatsapp") {
        updates.whatsappOptIn = false;
        updates.whatsappOptOutAt = now;
      }
      
      await ctx.db.patch(preferences._id, updates);
    }
  },
});

// ============================================
// NOTIFICATION SENDING
// ============================================

// Send a de-escalation message
export const sendDeescalationMessage = action({
  args: {
    userId: v.id("users"),
    triggerType: v.string(), // "pre_shipment", "post_delivery", "pre_dispute", "high_risk"
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    customerName: v.optional(v.string()),
    orderId: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    disputeAlertId: v.optional(v.id("disputeAlerts")),
    channel: v.string(), // "email", "sms", "whatsapp"
    // Template variable data
    trackingLink: v.optional(v.string()),
    deliveryDate: v.optional(v.string()),
    deliveryProofUrl: v.optional(v.string()),
    orderTotal: v.optional(v.number()),
    productName: v.optional(v.string()),
    businessName: v.optional(v.string()),
    businessAbn: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    supportPhone: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    // Default templates for each trigger type
    const defaultTemplates: Record<string, { subject?: string; body: string }> = {
      pre_shipment: {
        subject: "Thanks for your order! Tracking info inside 📦",
        body: `Hi {{customer_name}},

Thanks for your order #{{order_id}}!

We're preparing your {{product_name}} for shipment. You'll receive tracking updates here:
{{tracking_link}}

Questions? Reply to this message — we're happy to help!

{{business_details}}
{{stop_text}}`,
      },
      post_delivery: {
        subject: "Your order has arrived! 🎉",
        body: `Hi {{customer_name}},

Great news — your order #{{order_id}} was delivered on {{delivery_date}}!

Everything look good? If you have any questions or concerns about your order, please reply to this message. We're here to help — no need to contact your bank.

{{business_details}}
{{stop_text}}`,
      },
      pre_dispute: {
        subject: "We noticed a query on your order — can we help?",
        body: `Hi {{customer_name}},

We noticed a query regarding your order #{{order_id}}.

Here's what we have on file:
✅ Order placed: {{order_total}}
✅ Delivered on: {{delivery_date}}
✅ Delivery proof: {{delivery_proof_url}}

If there's anything wrong with your order, please reply to this message — we'll make it right immediately. No need to contact your bank.

{{business_details}}
{{stop_text}}`,
      },
      high_risk: {
        subject: "Confirming your recent order",
        body: `Hi {{customer_name}},

We're processing your order #{{order_id}} for {{order_total}}.

To ensure smooth delivery, please confirm:
1. Shipping address is correct
2. Contact details are up to date

If you didn't place this order, please reply immediately and we'll cancel it.

{{business_details}}
{{stop_text}}`,
      },
    };

    const template = defaultTemplates[args.triggerType];
    if (!template) {
      return { success: false, error: `Unknown trigger type: ${args.triggerType}` };
    }

    // Build the message body with variable replacement
    let body = template.body;
    const subject = template.subject;

    // Replace template variables
    const replacements: Record<string, string> = {
      "{{customer_name}}": args.customerName || "Valued Customer",
      "{{order_id}}": args.orderId || "N/A",
      "{{tracking_link}}": args.trackingLink || "#",
      "{{delivery_date}}": args.deliveryDate || "recently",
      "{{delivery_proof_url}}": args.deliveryProofUrl || "#",
      "{{order_total}}": args.orderTotal ? `$${args.orderTotal.toFixed(2)}` : "your order",
      "{{product_name}}": args.productName || "your item",
    };

    for (const [key, value] of Object.entries(replacements)) {
      body = body.replace(new RegExp(key, "g"), value);
    }

    // Add business details (ACMA compliance)
    const businessDetails = args.businessName
      ? `\n---\n${args.businessName}${args.businessAbn ? ` (ABN: ${args.businessAbn})` : ""}\n${args.supportEmail ? `Email: ${args.supportEmail}` : ""}${args.supportPhone ? ` | Phone: ${args.supportPhone}` : ""}`
      : "";
    body = body.replace("{{business_details}}", businessDetails);

    // Add STOP text for SMS/WhatsApp (ACMA compliance)
    const stopText = args.channel !== "email"
      ? "\n\nReply STOP to unsubscribe. Privacy policy: https://yoursite.com/privacy"
      : "\n\nTo unsubscribe from these notifications, click here: [unsubscribe link]";
    body = body.replace("{{stop_text}}", stopText);

    // Send via appropriate channel
    try {
      let externalMessageId: string | undefined;

      if (args.channel === "email") {
        // SendGrid integration
        const sendGridResult = await sendEmailViaSendGrid({
          to: args.customerEmail,
          subject: subject || "Update on your order",
          body,
          from: args.supportEmail || "noreply@yourstore.com",
          fromName: args.businessName || "Your Store",
        });
        externalMessageId = sendGridResult.messageId;
      } else if (args.channel === "sms" && args.customerPhone) {
        // Twilio SMS integration
        const twilioResult = await sendSmsViaTwilio({
          to: args.customerPhone,
          body,
          from: args.supportPhone,
        });
        externalMessageId = twilioResult.messageId;
      } else if (args.channel === "whatsapp" && args.customerPhone) {
        // WhatsApp Business API integration
        const whatsappResult = await sendWhatsAppMessage({
          to: args.customerPhone,
          body,
          from: args.supportPhone,
        });
        externalMessageId = whatsappResult.messageId;
      } else {
        return { success: false, error: "Invalid channel or missing phone number" };
      }

      // Log the notification event
      await ctx.runMutation(api.notifications.logNotificationEvent, {
        userId: args.userId,
        customerEmail: args.customerEmail,
        customerPhone: args.customerPhone,
        customerName: args.customerName,
        channel: args.channel,
        subject,
        body,
        orderId: args.orderId,
        transactionId: args.transactionId,
        disputeAlertId: args.disputeAlertId,
        triggerType: args.triggerType,
        status: "sent",
        externalMessageId,
      });

      return { success: true, messageId: externalMessageId };
    } catch (error: any) {
      // Log failed attempt
      await ctx.runMutation(api.notifications.logNotificationEvent, {
        userId: args.userId,
        customerEmail: args.customerEmail,
        customerPhone: args.customerPhone,
        customerName: args.customerName,
        channel: args.channel,
        subject,
        body,
        orderId: args.orderId,
        transactionId: args.transactionId,
        disputeAlertId: args.disputeAlertId,
        triggerType: args.triggerType,
        status: "failed",
        errorMessage: error.message || "Unknown error",
      });

      return { success: false, error: error.message || "Failed to send message" };
    }
  },
});

// Log notification event
export const logNotificationEvent = mutation({
  args: {
    userId: v.id("users"),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerName: v.optional(v.string()),
    channel: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
    orderId: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    disputeAlertId: v.optional(v.id("disputeAlerts")),
    triggerType: v.string(),
    status: v.string(),
    externalMessageId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apps = await ctx.db
      .query("apps")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    if (apps.length === 0) {
      throw new Error("No app found for user");
    }
    
    const appId = apps[0]._id;
    const now = Date.now();
    
    return await ctx.db.insert("notificationEvents", {
      appId,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      customerName: args.customerName,
      channel: args.channel,
      subject: args.subject,
      body: args.body,
      orderId: args.orderId,
      transactionId: args.transactionId,
      disputeAlertId: args.disputeAlertId,
      triggerType: args.triggerType,
      status: args.status,
      externalMessageId: args.externalMessageId,
      errorMessage: args.errorMessage,
      sentAt: args.status === "sent" ? now : undefined,
      createdAt: now,
    });
  },
});

// Get notification history
export const getNotificationHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    filterByStatus: v.optional(v.string()),
    filterByTrigger: v.optional(v.string()),
    filterByChannel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apps = await ctx.db
      .query("apps")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    if (apps.length === 0) return [];
    
    const appId = apps[0]._id;
    const limit = args.limit ?? 50;
    
    let query = ctx.db
      .query("notificationEvents")
      .withIndex("by_app", (q) => q.eq("appId", appId));
    
    let results = await query.collect();
    
    // Apply filters
    if (args.filterByStatus) {
      results = results.filter(r => r.status === args.filterByStatus);
    }
    if (args.filterByTrigger) {
      results = results.filter(r => r.triggerType === args.filterByTrigger);
    }
    if (args.filterByChannel) {
      results = results.filter(r => r.channel === args.filterByChannel);
    }
    
    // Sort by createdAt descending and limit
    return results
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

// Get notification stats
export const getNotificationStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const apps = await ctx.db
      .query("apps")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    if (apps.length === 0) {
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        disputesPrevented: 0,
        byChannel: { email: 0, sms: 0, whatsapp: 0 },
        byTrigger: { pre_shipment: 0, post_delivery: 0, pre_dispute: 0, high_risk: 0 },
      };
    }
    
    const appId = apps[0]._id;
    
    const events = await ctx.db
      .query("notificationEvents")
      .withIndex("by_app", (q) => q.eq("appId", appId))
      .collect();
    
    const stats = {
      totalSent: events.filter(e => e.status === "sent" || e.status === "delivered").length,
      totalDelivered: events.filter(e => e.status === "delivered").length,
      totalFailed: events.filter(e => e.status === "failed").length,
      disputesPrevented: events.filter(e => e.disputePrevented === true).length,
      byChannel: {
        email: events.filter(e => e.channel === "email").length,
        sms: events.filter(e => e.channel === "sms").length,
        whatsapp: events.filter(e => e.channel === "whatsapp").length,
      },
      byTrigger: {
        pre_shipment: events.filter(e => e.triggerType === "pre_shipment").length,
        post_delivery: events.filter(e => e.triggerType === "post_delivery").length,
        pre_dispute: events.filter(e => e.triggerType === "pre_dispute").length,
        high_risk: events.filter(e => e.triggerType === "high_risk").length,
      },
    };
    
    return stats;
  },
});

// ============================================
// AUTO-TRIGGER AUTOMATION
// ============================================

// Auto-trigger notifications based on events
export const autoTriggerNotification = action({
  args: {
    userId: v.id("users"),
    eventType: v.string(), // "order_created", "order_shipped", "order_delivered", "dispute_alert", "high_risk_detected"
    eventData: v.object({
      orderId: v.optional(v.string()),
      customerEmail: v.string(),
      customerPhone: v.optional(v.string()),
      customerName: v.optional(v.string()),
      orderTotal: v.optional(v.number()),
      productName: v.optional(v.string()),
      trackingLink: v.optional(v.string()),
      deliveryDate: v.optional(v.string()),
      deliveryProofUrl: v.optional(v.string()),
      riskScore: v.optional(v.number()),
      disputeAlertId: v.optional(v.id("disputeAlerts")),
    }),
  },
  handler: async (ctx, args): Promise<{ triggered: boolean; channel?: string; error?: string }> => {
    // Map event types to trigger types
    const eventToTrigger: Record<string, string> = {
      order_created: "pre_shipment",
      order_shipped: "pre_shipment",
      order_delivered: "post_delivery",
      dispute_alert: "pre_dispute",
      high_risk_detected: "high_risk",
    };

    const triggerType = eventToTrigger[args.eventType];
    if (!triggerType) {
      return { triggered: false, error: `Unknown event type: ${args.eventType}` };
    }

    // Determine preferred channel (email first, then SMS if phone available)
    const channel = args.eventData.customerPhone ? "sms" : "email";

    // Send the de-escalation message
    const result = await ctx.runAction(api.notifications.sendDeescalationMessage, {
      userId: args.userId,
      triggerType,
      customerEmail: args.eventData.customerEmail,
      customerPhone: args.eventData.customerPhone,
      customerName: args.eventData.customerName,
      orderId: args.eventData.orderId,
      disputeAlertId: args.eventData.disputeAlertId,
      channel,
      trackingLink: args.eventData.trackingLink,
      deliveryDate: args.eventData.deliveryDate,
      deliveryProofUrl: args.eventData.deliveryProofUrl,
      orderTotal: args.eventData.orderTotal,
      productName: args.eventData.productName,
    });

    if (result.success) {
      return { triggered: true, channel };
    } else {
      return { triggered: false, error: result.error };
    }
  },
});

// ============================================
// HELPER FUNCTIONS (API INTEGRATIONS)
// ============================================

// SendGrid Email Integration
async function sendEmailViaSendGrid(params: {
  to: string;
  subject: string;
  body: string;
  from: string;
  fromName: string;
}): Promise<{ messageId: string }> {
  // In production, use actual SendGrid API
  // For now, simulate the API call
  
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  
  if (SENDGRID_API_KEY) {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: params.from, name: params.fromName },
        subject: params.subject,
        content: [{ type: "text/plain", value: params.body }],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid API error: ${errorText}`);
    }
    
    // SendGrid returns message ID in headers
    const messageId = response.headers.get("X-Message-Id") || `sg_${Date.now()}`;
    return { messageId };
  }
  
  // Simulate successful send for demo
  console.log(`[SendGrid Demo] Sending email to ${params.to}: ${params.subject}`);
  return { messageId: `demo_email_${Date.now()}` };
}

// Twilio SMS Integration
async function sendSmsViaTwilio(params: {
  to: string;
  body: string;
  from?: string;
}): Promise<{ messageId: string }> {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || params.from;
  
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: params.to,
          From: TWILIO_PHONE_NUMBER,
          Body: params.body,
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Twilio API error: ${errorData.message || "Unknown error"}`);
    }
    
    const data = await response.json();
    return { messageId: data.sid };
  }
  
  // Simulate successful send for demo
  console.log(`[Twilio Demo] Sending SMS to ${params.to}: ${params.body.substring(0, 50)}...`);
  return { messageId: `demo_sms_${Date.now()}` };
}

// WhatsApp Business API Integration
async function sendWhatsAppMessage(params: {
  to: string;
  body: string;
  from?: string;
}): Promise<{ messageId: string }> {
  // WhatsApp Business API via Twilio
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || params.from;
  
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER) {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: `whatsapp:${params.to}`,
          From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
          Body: params.body,
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`WhatsApp API error: ${errorData.message || "Unknown error"}`);
    }
    
    const data = await response.json();
    return { messageId: data.sid };
  }
  
  // Simulate successful send for demo
  console.log(`[WhatsApp Demo] Sending WhatsApp to ${params.to}: ${params.body.substring(0, 50)}...`);
  return { messageId: `demo_whatsapp_${Date.now()}` };
}

// ============================================
// DEFAULT TEMPLATE SEEDING
// ============================================

// Seed default templates for a new user
export const seedDefaultTemplates = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const apps = await ctx.db
      .query("apps")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    if (apps.length === 0) {
      throw new Error("No app found for user");
    }
    
    const appId = apps[0]._id;
    
    // Check if templates already exist
    const existingTemplates = await ctx.db
      .query("messageTemplates")
      .withIndex("by_app", (q) => q.eq("appId", appId))
      .collect();
    
    if (existingTemplates.length > 0) {
      return { created: 0, message: "Templates already exist" };
    }
    
    const now = Date.now();
    
    const defaultTemplates = [
      {
        name: "Pre-Shipment Confirmation",
        type: "pre_shipment",
        channel: "email",
        subject: "Thanks for your order! Tracking info inside 📦",
        body: `Hi {{customer_name}},

Thanks for your order #{{order_id}}!

We're preparing your {{product_name}} for shipment. You'll receive tracking updates here:
{{tracking_link}}

Questions? Reply to this message — we're happy to help!

{{business_details}}
{{stop_text}}`,
        includeStopText: true,
        includePrivacyNotice: true,
        includeBusinessDetails: true,
      },
      {
        name: "Post-Delivery Follow-up",
        type: "post_delivery",
        channel: "email",
        subject: "Your order has arrived! 🎉",
        body: `Hi {{customer_name}},

Great news — your order #{{order_id}} was delivered on {{delivery_date}}!

Everything look good? If you have any questions or concerns about your order, please reply to this message. We're here to help — no need to contact your bank.

{{business_details}}
{{stop_text}}`,
        includeStopText: true,
        includePrivacyNotice: true,
        includeBusinessDetails: true,
      },
      {
        name: "Pre-Dispute Alert",
        type: "pre_dispute",
        channel: "email",
        subject: "We noticed a query on your order — can we help?",
        body: `Hi {{customer_name}},

We noticed a query regarding your order #{{order_id}}.

Here's what we have on file:
✅ Order placed: {{order_total}}
✅ Delivered on: {{delivery_date}}
✅ Delivery proof: {{delivery_proof_url}}

If there's anything wrong with your order, please reply to this message — we'll make it right immediately. No need to contact your bank.

{{business_details}}
{{stop_text}}`,
        includeStopText: true,
        includePrivacyNotice: true,
        includeBusinessDetails: true,
      },
      {
        name: "High-Risk Order Confirmation",
        type: "high_risk",
        channel: "sms",
        subject: undefined,
        body: `Hi {{customer_name}}, we're processing your order #{{order_id}} for {{order_total}}. If you didn't place this order, please reply CANCEL immediately. Questions? Reply here. {{stop_text}}`,
        includeStopText: true,
        includePrivacyNotice: false,
        includeBusinessDetails: false,
      },
    ];
    
    for (const template of defaultTemplates) {
      await ctx.db.insert("messageTemplates", {
        appId,
        name: template.name,
        type: template.type,
        channel: template.channel,
        subject: template.subject,
        body: template.body,
        isActive: true,
        includeStopText: template.includeStopText,
        includePrivacyNotice: template.includePrivacyNotice,
        includeBusinessDetails: template.includeBusinessDetails,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    return { created: defaultTemplates.length, message: "Default templates created" };
  },
});