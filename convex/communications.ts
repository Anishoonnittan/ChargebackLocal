import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

// ============================================================================
// CUSTOMER COMMUNICATION AUTOMATION
// Auto-sends de-escalation messages to prevent chargebacks
// Channels: Email (SendGrid), SMS (Twilio), WhatsApp (Twilio)
// Compliance: ACMA (Australia) - includes STOP + privacy notice
// ============================================================================

// ----------------------------------------------------------------------------
// MESSAGE TEMPLATES
// ----------------------------------------------------------------------------

/**
 * Get all message templates for a business
 */
export const getMessageTemplates = query({
  args: { businessId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Return default templates if no business-specific ones exist
    const defaultTemplates = [
      {
        _id: "template_pre_shipment",
        name: "Pre-Shipment Confirmation",
        trigger: "order_created",
        channel: "email",
        subject: "Thanks for your order! 🎉",
        body: `Hi {{customer_name}},

Thanks for your order #{{order_number}}!

We're preparing your items now. You'll receive tracking updates as soon as your order ships.

📦 Order Summary:
{{order_items}}

💰 Total: {{order_total}}

Track your order: {{tracking_url}}

Questions? Reply to this email — no need to contact your bank.

{{business_name}}
{{business_address}}
ABN: {{business_abn}}

To unsubscribe, reply STOP. Privacy: {{privacy_url}}`,
        isActive: true,
        delayMinutes: 5,
        category: "pre_shipment",
      },
      {
        _id: "template_order_shipped",
        name: "Order Shipped",
        trigger: "order_shipped",
        channel: "email",
        subject: "Your order is on its way! 📦",
        body: `Hi {{customer_name}},

Great news! Your order #{{order_number}} has shipped.

🚚 Carrier: {{carrier_name}}
📍 Tracking: {{tracking_number}}
📅 Estimated delivery: {{estimated_delivery}}

Track your package: {{tracking_url}}

If you have any questions about your delivery, please reply to this email first — we're here to help!

{{business_name}}

To unsubscribe, reply STOP. Privacy: {{privacy_url}}`,
        isActive: true,
        delayMinutes: 0,
        category: "shipping",
      },
      {
        _id: "template_post_delivery",
        name: "Post-Delivery Follow-up",
        trigger: "order_delivered",
        channel: "email",
        subject: "Your order has arrived! Need help? 📬",
        body: `Hi {{customer_name}},

Your order #{{order_number}} has been delivered! 🎉

📍 Delivered to: {{delivery_address}}
📅 Delivered on: {{delivery_date}}
{{#if signature}}✍️ Signed by: {{signature}}{{/if}}

**Need help with your order?**
Reply to this email and we'll assist you within 24 hours — no need to contact your bank.

Not satisfied? Our refund policy: {{refund_policy_url}}

We'd love your feedback: {{review_url}}

Thanks for shopping with us!

{{business_name}}
{{business_address}}
ABN: {{business_abn}}

To unsubscribe, reply STOP. Privacy: {{privacy_url}}`,
        isActive: true,
        delayMinutes: 60, // 1 hour after delivery
        category: "post_delivery",
      },
      {
        _id: "template_pre_dispute_alert",
        name: "Pre-Dispute Resolution",
        trigger: "pre_dispute_alert",
        channel: "email",
        subject: "Query about your order #{{order_number}} — let us help! 🤝",
        body: `Hi {{customer_name}},

We noticed a query about your recent order #{{order_number}}.

**Before contacting your bank, let us help resolve this directly!**

📦 Order Details:
- Order Date: {{order_date}}
- Items: {{order_items}}
- Total: {{order_total}}

📍 Delivery Confirmation:
- Delivered: {{delivery_date}}
- Tracking: {{tracking_number}}
{{#if signature}}- Signed by: {{signature}}{{/if}}
{{#if delivery_photo}}- Delivery photo: {{delivery_photo_url}}{{/if}}

**How can we help?**
- Wrong item? We'll send the correct one free of charge
- Damaged? We'll replace it or refund you
- Didn't receive? Let us investigate with the carrier

Reply to this email or call us at {{business_phone}} — we resolve 95% of issues within 24 hours.

{{business_name}}
{{business_address}}
ABN: {{business_abn}}

To unsubscribe, reply STOP. Privacy: {{privacy_url}}`,
        isActive: true,
        delayMinutes: 0, // Immediate
        category: "pre_dispute",
      },
      {
        _id: "template_sms_delivery",
        name: "SMS Delivery Notification",
        trigger: "order_delivered",
        channel: "sms",
        subject: "",
        body: `{{business_name}}: Your order #{{order_number}} was delivered! Questions? Reply here or email {{business_email}} - no need to call your bank. Reply STOP to opt out.`,
        isActive: true,
        delayMinutes: 30,
        category: "post_delivery",
      },
      {
        _id: "template_sms_pre_dispute",
        name: "SMS Pre-Dispute Alert",
        trigger: "pre_dispute_alert",
        channel: "sms",
        subject: "",
        body: `{{business_name}}: We noticed a query on order #{{order_number}}. Let us help! Reply YES and we'll call you, or email {{business_email}}. Reply STOP to opt out.`,
        isActive: true,
        delayMinutes: 0,
        category: "pre_dispute",
      },
      {
        _id: "template_whatsapp_delivery",
        name: "WhatsApp Delivery Confirmation",
        trigger: "order_delivered",
        channel: "whatsapp",
        subject: "",
        body: `🎉 *Order Delivered!*

Hi {{customer_name}}, your order #{{order_number}} has been delivered!

📍 *Delivery Details:*
• Address: {{delivery_address}}
• Date: {{delivery_date}}
• Tracking: {{tracking_number}}

Need help? Just reply to this message — we're here for you! No need to contact your bank.

_{{business_name}}_
_To opt out, reply STOP_`,
        isActive: false, // WhatsApp requires opt-in
        delayMinutes: 30,
        category: "post_delivery",
      },
    ];

    if (!args.businessId) {
      return defaultTemplates;
    }

    // Try to get business-specific templates
    const customTemplates = await ctx.db
      .query("messageTemplates")
      .filter((q) => q.eq(q.field("businessId"), args.businessId))
      .collect();

    return customTemplates.length > 0 ? customTemplates : defaultTemplates;
  },
});

/**
 * Create or update a message template
 */
export const saveMessageTemplate = mutation({
  args: {
    templateId: v.optional(v.string()),
    businessId: v.string(),
    name: v.string(),
    trigger: v.string(),
    channel: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
    isActive: v.boolean(),
    delayMinutes: v.number(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.templateId && !args.templateId.startsWith("template_")) {
      // Update existing custom template
      const existingId = args.templateId as any;
      await ctx.db.patch(existingId, {
        name: args.name,
        trigger: args.trigger,
        channel: args.channel,
        subject: args.subject,
        body: args.body,
        isActive: args.isActive,
        delayMinutes: args.delayMinutes,
        category: args.category,
        updatedAt: now,
      });
      return existingId;
    } else {
      // Create new template
      const id = await ctx.db.insert("messageTemplates", {
        businessId: args.businessId,
        name: args.name,
        trigger: args.trigger,
        channel: args.channel,
        subject: args.subject || "",
        body: args.body,
        isActive: args.isActive,
        delayMinutes: args.delayMinutes,
        category: args.category,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});

/**
 * Delete a message template
 */
export const deleteMessageTemplate = mutation({
  args: { templateId: v.id("messageTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.templateId);
    return { success: true };
  },
});

// ----------------------------------------------------------------------------
// MESSAGE SENDING
// ----------------------------------------------------------------------------

/**
 * Send a message via the specified channel
 * This is the main action that handles all channels (Email, SMS, WhatsApp)
 */
export const sendMessage = action({
  args: {
    businessId: v.string(),
    customerId: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    channel: v.string(), // 'email' | 'sms' | 'whatsapp'
    templateId: v.string(),
    variables: v.object({
      customer_name: v.optional(v.string()),
      order_number: v.optional(v.string()),
      order_date: v.optional(v.string()),
      order_items: v.optional(v.string()),
      order_total: v.optional(v.string()),
      tracking_number: v.optional(v.string()),
      tracking_url: v.optional(v.string()),
      carrier_name: v.optional(v.string()),
      estimated_delivery: v.optional(v.string()),
      delivery_date: v.optional(v.string()),
      delivery_address: v.optional(v.string()),
      signature: v.optional(v.string()),
      delivery_photo_url: v.optional(v.string()),
      business_name: v.optional(v.string()),
      business_email: v.optional(v.string()),
      business_phone: v.optional(v.string()),
      business_address: v.optional(v.string()),
      business_abn: v.optional(v.string()),
      refund_policy_url: v.optional(v.string()),
      privacy_url: v.optional(v.string()),
      review_url: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { channel, customerEmail, customerPhone, variables } = args;

    // Validate required contact info for channel
    if (channel === "email" && !customerEmail) {
      return { success: false, error: "Customer email required for email channel" };
    }
    if ((channel === "sms" || channel === "whatsapp") && !customerPhone) {
      return { success: false, error: "Customer phone required for SMS/WhatsApp channel" };
    }

    // Get the template
    const templates = await ctx.runQuery(
      "communications:getMessageTemplates" as any,
      { businessId: args.businessId }
    );
    const template = templates.find((t: any) => t._id === args.templateId);

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    // Replace variables in template
    let body = template.body;
    let subject = template.subject || "";

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      body = body.replace(regex, value || "");
      subject = subject.replace(regex, value || "");
    });

    // Clean up any remaining placeholders
    body = body.replace(/{{[^}]+}}/g, "");
    subject = subject.replace(/{{[^}]+}}/g, "");

    // Send based on channel
    let result: { success: boolean; messageId?: string; error?: string };

    try {
      switch (channel) {
        case "email":
          result = await sendEmailViaSendGrid({
            to: customerEmail!,
            subject,
            body,
            from: variables.business_email || "noreply@chargebackshield.com.au",
            fromName: variables.business_name || "Chargeback Shield",
          });
          break;

        case "sms":
          result = await sendSMSViaTwilio({
            to: customerPhone!,
            body,
            from: variables.business_phone,
          });
          break;

        case "whatsapp":
          result = await sendWhatsAppViaTwilio({
            to: customerPhone!,
            body,
          });
          break;

        default:
          result = { success: false, error: `Unknown channel: ${channel}` };
      }
    } catch (error: any) {
      result = { success: false, error: error.message || "Failed to send message" };
    }

    // Log the message attempt
    await ctx.runMutation("communications:logMessage" as any, {
      businessId: args.businessId,
      customerId: args.customerId,
      channel,
      templateId: args.templateId,
      recipient: channel === "email" ? customerEmail : customerPhone,
      subject,
      body,
      status: result.success ? "sent" : "failed",
      externalMessageId: result.messageId,
      errorMessage: result.error,
    });

    return result;
  },
});

/**
 * Send email via SendGrid
 */
async function sendEmailViaSendGrid(params: {
  to: string;
  subject: string;
  body: string;
  from: string;
  fromName: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // SendGrid API integration
  // In production, use actual SendGrid API key from environment/config
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

  if (!SENDGRID_API_KEY) {
    // Demo mode - simulate success
    console.log("[SendGrid Demo] Would send email:", params);
    return {
      success: true,
      messageId: `demo_email_${Date.now()}`,
    };
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: params.from, name: params.fromName },
        subject: params.subject,
        content: [
          { type: "text/plain", value: params.body },
          {
            type: "text/html",
            value: params.body.replace(/\n/g, "<br>"),
          },
        ],
      }),
    });

    if (response.ok || response.status === 202) {
      const messageId = response.headers.get("X-Message-Id") || `sg_${Date.now()}`;
      return { success: true, messageId };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send SMS via Twilio
 */
async function sendSMSViaTwilio(params: {
  to: string;
  body: string;
  from?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    // Demo mode
    console.log("[Twilio Demo] Would send SMS:", params);
    return {
      success: true,
      messageId: `demo_sms_${Date.now()}`,
    };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: params.to,
          From: params.from || TWILIO_PHONE_NUMBER || "",
          Body: params.body,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, messageId: data.sid };
    } else {
      return { success: false, error: data.message || "Failed to send SMS" };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendWhatsAppViaTwilio(params: {
  to: string;
  body: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    // Demo mode
    console.log("[Twilio WhatsApp Demo] Would send:", params);
    return {
      success: true,
      messageId: `demo_whatsapp_${Date.now()}`,
    };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: `whatsapp:${params.to}`,
          From: `whatsapp:${TWILIO_WHATSAPP_NUMBER || ""}`,
          Body: params.body,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, messageId: data.sid };
    } else {
      return { success: false, error: data.message || "Failed to send WhatsApp" };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------------------------------
// MESSAGE LOGGING
// ----------------------------------------------------------------------------

/**
 * Log a sent message for audit and tracking
 */
export const logMessage = mutation({
  args: {
    businessId: v.string(),
    customerId: v.string(),
    channel: v.string(),
    templateId: v.string(),
    recipient: v.optional(v.string()),
    subject: v.optional(v.string()),
    body: v.string(),
    status: v.string(),
    externalMessageId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("messageLog", {
      businessId: args.businessId,
      customerId: args.customerId,
      channel: args.channel,
      templateId: args.templateId,
      recipient: args.recipient || "",
      subject: args.subject || "",
      body: args.body,
      status: args.status,
      externalMessageId: args.externalMessageId,
      errorMessage: args.errorMessage,
      sentAt: Date.now(),
    });
    return id;
  },
});

/**
 * Get message history for a customer or business
 */
export const getMessageHistory = query({
  args: {
    businessId: v.optional(v.string()),
    customerId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("messageLog");

    if (args.businessId) {
      query = query.filter((q) => q.eq(q.field("businessId"), args.businessId));
    }

    if (args.customerId) {
      query = query.filter((q) => q.eq(q.field("customerId"), args.customerId));
    }

    const messages = await query.order("desc").take(args.limit || 50);
    return messages;
  },
});

// ----------------------------------------------------------------------------
// AUTOMATION TRIGGERS
// ----------------------------------------------------------------------------

/**
 * Trigger automated messages based on events
 * Called by webhooks or other parts of the system
 */
export const triggerAutomation = action({
  args: {
    businessId: v.string(),
    event: v.string(), // 'order_created' | 'order_shipped' | 'order_delivered' | 'pre_dispute_alert'
    customerId: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    orderData: v.object({
      orderNumber: v.optional(v.string()),
      orderDate: v.optional(v.string()),
      orderItems: v.optional(v.string()),
      orderTotal: v.optional(v.string()),
      trackingNumber: v.optional(v.string()),
      trackingUrl: v.optional(v.string()),
      carrierName: v.optional(v.string()),
      estimatedDelivery: v.optional(v.string()),
      deliveryDate: v.optional(v.string()),
      deliveryAddress: v.optional(v.string()),
      signature: v.optional(v.string()),
      deliveryPhotoUrl: v.optional(v.string()),
    }),
    businessData: v.object({
      businessName: v.optional(v.string()),
      businessEmail: v.optional(v.string()),
      businessPhone: v.optional(v.string()),
      businessAddress: v.optional(v.string()),
      businessAbn: v.optional(v.string()),
      refundPolicyUrl: v.optional(v.string()),
      privacyUrl: v.optional(v.string()),
      reviewUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { event, businessId, customerId, customerEmail, customerPhone, orderData, businessData } = args;

    // Get templates for this trigger
    const templates = await ctx.runQuery(
      "communications:getMessageTemplates" as any,
      { businessId }
    );

    const matchingTemplates = templates.filter(
      (t: any) => t.trigger === event && t.isActive
    );

    if (matchingTemplates.length === 0) {
      return { success: true, messagesSent: 0, message: "No active templates for this event" };
    }

    // Prepare variables
    const variables = {
      customer_name: "Valued Customer", // Would come from customer lookup
      order_number: orderData.orderNumber,
      order_date: orderData.orderDate,
      order_items: orderData.orderItems,
      order_total: orderData.orderTotal,
      tracking_number: orderData.trackingNumber,
      tracking_url: orderData.trackingUrl,
      carrier_name: orderData.carrierName,
      estimated_delivery: orderData.estimatedDelivery,
      delivery_date: orderData.deliveryDate,
      delivery_address: orderData.deliveryAddress,
      signature: orderData.signature,
      delivery_photo_url: orderData.deliveryPhotoUrl,
      business_name: businessData.businessName,
      business_email: businessData.businessEmail,
      business_phone: businessData.businessPhone,
      business_address: businessData.businessAddress,
      business_abn: businessData.businessAbn,
      refund_policy_url: businessData.refundPolicyUrl,
      privacy_url: businessData.privacyUrl,
      review_url: businessData.reviewUrl,
    };

    // Send messages for each matching template
    const results: any[] = [];

    for (const template of matchingTemplates) {
      // Check if we have the required contact info for this channel
      if (template.channel === "email" && !customerEmail) continue;
      if ((template.channel === "sms" || template.channel === "whatsapp") && !customerPhone) continue;

      // Apply delay if configured
      if (template.delayMinutes > 0) {
        // In production, you'd schedule this for later
        // For now, we'll send immediately and log the intended delay
        console.log(`[Automation] Would delay ${template.delayMinutes} minutes for template: ${template.name}`);
      }

      const result = await ctx.runAction("communications:sendMessage" as any, {
        businessId,
        customerId,
        customerEmail,
        customerPhone,
        channel: template.channel,
        templateId: template._id,
        variables,
      });

      results.push({
        template: template.name,
        channel: template.channel,
        ...result,
      });
    }

    return {
      success: true,
      messagesSent: results.filter((r) => r.success).length,
      results,
    };
  },
});

// ----------------------------------------------------------------------------
// OPT-OUT HANDLING (ACMA COMPLIANCE)
// ----------------------------------------------------------------------------

/**
 * Handle customer opt-out requests
 * ACMA requires honoring STOP requests within 5 business days
 */
export const handleOptOut = mutation({
  args: {
    businessId: v.string(),
    customerId: v.optional(v.string()),
    contactValue: v.string(), // email or phone
    channel: v.string(), // 'email' | 'sms' | 'whatsapp' | 'all'
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Record the opt-out
    const id = await ctx.db.insert("communicationOptOuts", {
      businessId: args.businessId,
      customerId: args.customerId,
      contactValue: args.contactValue,
      channel: args.channel,
      reason: args.reason || "Customer requested opt-out",
      optOutAt: now,
      // ACMA compliance: must action within 5 business days
      complianceDeadline: now + 5 * 24 * 60 * 60 * 1000,
    });

    return { success: true, optOutId: id };
  },
});

/**
 * Check if a customer has opted out
 */
export const checkOptOut = query({
  args: {
    businessId: v.string(),
    contactValue: v.string(),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    const optOut = await ctx.db
      .query("communicationOptOuts")
      .filter((q) =>
        q.and(
          q.eq(q.field("businessId"), args.businessId),
          q.eq(q.field("contactValue"), args.contactValue),
          q.or(
            q.eq(q.field("channel"), args.channel),
            q.eq(q.field("channel"), "all")
          )
        )
      )
      .first();

    return { optedOut: !!optOut, optOutDetails: optOut };
  },
});

// ----------------------------------------------------------------------------
// ANALYTICS
// ----------------------------------------------------------------------------

/**
 * Get communication analytics for a business
 */
export const getCommunicationAnalytics = query({
  args: { businessId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messageLog")
      .filter((q) => q.eq(q.field("businessId"), args.businessId))
      .collect();

    const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentMessages = messages.filter((m) => m.sentAt > last30Days);

    // Calculate stats
    const totalSent = recentMessages.length;
    const successful = recentMessages.filter((m) => m.status === "sent").length;
    const failed = recentMessages.filter((m) => m.status === "failed").length;

    const byChannel = {
      email: recentMessages.filter((m) => m.channel === "email").length,
      sms: recentMessages.filter((m) => m.channel === "sms").length,
      whatsapp: recentMessages.filter((m) => m.channel === "whatsapp").length,
    };

    const byTrigger = {
      order_created: recentMessages.filter((m) => m.templateId?.includes("pre_shipment")).length,
      order_shipped: recentMessages.filter((m) => m.templateId?.includes("shipped")).length,
      order_delivered: recentMessages.filter((m) => m.templateId?.includes("delivery")).length,
      pre_dispute: recentMessages.filter((m) => m.templateId?.includes("dispute")).length,
    };

    return {
      period: "last_30_days",
      totalSent,
      successful,
      failed,
      successRate: totalSent > 0 ? Math.round((successful / totalSent) * 100) : 0,
      byChannel,
      byTrigger,
      // Estimated impact
      estimatedChargebacksPrevented: Math.round(byTrigger.pre_dispute * 0.7), // 70% prevention rate
    };
  },
});