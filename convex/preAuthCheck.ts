/**
 * Pre-Authorization Check System
 * Fast, lightweight risk scoring BEFORE payment capture
 * Acts as a security gate before full post-auth analysis
 */

import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

type PreAuthRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * Run pre-authorization check (fast, lightweight)
 * This runs BEFORE payment capture to block obvious fraud
 */
export const runPreAuthCheck = action({
  args: {
    sessionToken: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    orderAmount: v.number(),
    orderId: v.string(),
    billingAddress: v.optional(v.string()),
    shippingAddress: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    deviceFingerprint: v.optional(v.string()),
    cardBin: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await ctx.runQuery(api.auth.getCurrentUser, {
      sessionToken: args.sessionToken,
    });

    if (!viewer) {
      throw new Error("Not authenticated");
    }

    // Get user's pre-auth configuration
    const config = await ctx.runQuery(api.preAuthCheck.getPreAuthConfig, {
      sessionToken: args.sessionToken,
    });

    const checks: Array<{
      checkName: string;
      passed: boolean;
      score: number;
      details: string;
    }> = [];

    let totalScore = 100; // Start at 100, subtract points for risk

    // ========================================
    // CHECK 1: Velocity (fast, critical)
    // ========================================
    const velocityResult = await ctx.runQuery(api.preAuthCheck.checkVelocity, {
      sessionToken: args.sessionToken,
      customerEmail: args.customerEmail,
      deviceFingerprint: args.deviceFingerprint,
    });

    if (!velocityResult.passed) {
      totalScore -= 40;
      checks.push({
        checkName: "velocity",
        passed: false,
        score: 40,
        details: velocityResult.reason,
      });
    } else {
      checks.push({
        checkName: "velocity",
        passed: true,
        score: 0,
        details: "Velocity check passed",
      });
    }

    // ========================================
    // CHECK 2: Email Validation
    // ========================================
    const disposableDomains = [
      "tempmail.com",
      "guerrillamail.com",
      "10minutemail.com",
      "throwaway.email",
      "temp-mail.org",
      "mailinator.com",
      "maildrop.cc",
      "trashmail.com",
    ];
    const emailDomain = args.customerEmail.split("@")[1]?.toLowerCase();
    const isDisposableEmail = disposableDomains.includes(emailDomain);

    if (isDisposableEmail && config.blockDisposableEmails) {
      totalScore -= 30;
      checks.push({
        checkName: "email_validation",
        passed: false,
        score: 30,
        details: "Disposable email detected",
      });
    } else {
      checks.push({
        checkName: "email_validation",
        passed: true,
        score: 0,
        details: "Email validation passed",
      });
    }

    // ========================================
    // CHECK 3: Geographic Risk
    // ========================================
    if (args.ipAddress && config.blockHighRiskCountries) {
      try {
        const ipResponse = await fetchFromGlobal(
          `https://ipapi.co/${args.ipAddress}/json/`
        );
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          const ipCountry = ipData.country_code;

          if (config.highRiskCountryCodes.includes(ipCountry)) {
            totalScore -= 25;
            checks.push({
              checkName: "geo_check",
              passed: false,
              score: 25,
              details: `Order from high-risk country: ${ipCountry}`,
            });
          } else {
            checks.push({
              checkName: "geo_check",
              passed: true,
              score: 0,
              details: "Geographic check passed",
            });
          }
        }
      } catch (error) {
        console.error("Geo check error:", error);
      }
    }

    // ========================================
    // CHECK 4: Order Amount Threshold
    // ========================================
    const isFirstTimeCustomer = await ctx.runQuery(
      api.preAuthCheck.isFirstTimeCustomer,
      {
        sessionToken: args.sessionToken,
        customerEmail: args.customerEmail,
      }
    );

    if (
      isFirstTimeCustomer &&
      config.firstTimeCustomerMaxAmount &&
      args.orderAmount > config.firstTimeCustomerMaxAmount
    ) {
      totalScore -= 20;
      checks.push({
        checkName: "amount_threshold",
        passed: false,
        score: 20,
        details: `First-time customer with high order amount ($${args.orderAmount})`,
      });
    } else if (
      config.requireReviewAboveAmount &&
      args.orderAmount > config.requireReviewAboveAmount
    ) {
      totalScore -= 15;
      checks.push({
        checkName: "amount_threshold",
        passed: false,
        score: 15,
        details: `Order amount ($${args.orderAmount}) exceeds review threshold`,
      });
    } else {
      checks.push({
        checkName: "amount_threshold",
        passed: true,
        score: 0,
        details: "Amount threshold passed",
      });
    }

    // ========================================
    // Determine risk level and decision
    // ========================================
    const preAuthScore = Math.max(0, totalScore);
    let preAuthRiskLevel: PreAuthRiskLevel;
    let autoDecision: "APPROVED" | "DECLINED" | "REQUIRES_REVIEW";
    let reason = "";

    if (preAuthScore >= config.autoApproveThreshold) {
      preAuthRiskLevel = "LOW";
      autoDecision = "APPROVED";
      reason = `Low risk (score: ${preAuthScore}). Auto-approved for fulfillment.`;
    } else if (preAuthScore <= config.autoDeclineThreshold) {
      preAuthRiskLevel = "CRITICAL";
      autoDecision = "DECLINED";
      reason = `Critical risk (score: ${preAuthScore}). Auto-declined to prevent fraud.`;
    } else {
      preAuthRiskLevel = preAuthScore < 60 ? "HIGH" : "MEDIUM";
      autoDecision = "REQUIRES_REVIEW";
      reason = `Medium risk (score: ${preAuthScore}). Manual review required before fulfillment.`;
    }

    // ========================================
    // Create pre-auth order record
    // ========================================
    const preAuthOrderId = await ctx.runMutation(api.preAuthCheck.createPreAuthOrder, {
      sessionToken: args.sessionToken,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      orderAmount: args.orderAmount,
      orderId: args.orderId,
      billingAddress: args.billingAddress,
      shippingAddress: args.shippingAddress,
      ipAddress: args.ipAddress,
      deviceFingerprint: args.deviceFingerprint,
      cardBin: args.cardBin,
      preAuthScore,
      preAuthRiskLevel,
      preAuthChecks: checks,
      autoDecision: {
        decision: autoDecision,
        reason,
        appliedRule: `threshold_${autoDecision}`,
        decidedAt: Date.now(),
      },
      status:
        autoDecision === "APPROVED"
          ? "AUTO_APPROVED"
          : autoDecision === "DECLINED"
            ? "AUTO_DECLINED"
            : "PENDING_REVIEW",
    });

    return {
      preAuthOrderId,
      preAuthScore,
      preAuthRiskLevel,
      autoDecision,
      reason,
      checks,
      shouldProceed: autoDecision === "APPROVED",
      requiresManualReview: autoDecision === "REQUIRES_REVIEW",
      shouldDecline: autoDecision === "DECLINED",
    };
  },
});

/**
 * DEMO VERSION: Run pre-auth check with simplified parameters for testing
 * This is used by the UI to demonstrate risk scoring without auth
 */
export const runPreAuthDemoCheck = action({
  args: {
    orderId: v.string(),
    cardNumber: v.string(),
    amount: v.number(),
    email: v.string(),
    ipAddress: v.string(),
    avsCode: v.string(),
    cvvCode: v.string(),
    behavioralData: v.optional(v.any()),
  },
  handler: async (ctx: any, args: any) => {
    let riskScore = 90; // Start at 90 (low risk)
    const fraudSignals: any[] = [];

    // ========================================
    // SIGNAL 1: Card BIN Analysis
    // ========================================
    const cardBin = args.cardNumber.substring(0, 6);
    const isPrepaid = ['411111', '411811', '622222'].includes(cardBin);
    const cardCountry = args.ipAddress.startsWith('203') ? 'AU' : 
                       args.ipAddress.startsWith('75') ? 'VN' :
                       args.ipAddress.startsWith('91') ? 'IN' : 'US';
    
    fraudSignals.push({
      signal: 'Card BIN Analysis',
      triggered: isPrepaid,
      impact: isPrepaid ? 15 : 0,
      reason: isPrepaid ? 'Prepaid card detected' : 'Standard card detected',
    });
    
    if (isPrepaid) riskScore -= 15;

    // ========================================
    // SIGNAL 2: AVS/CVV Mismatch
    // ========================================
    const avsMatched = args.avsCode === 'Y';
    const cvvMatched = args.cvvCode === 'M';
    const avsMismatch = !avsMatched;
    const cvvMismatch = !cvvMatched;

    fraudSignals.push({
      signal: 'AVS Mismatch',
      triggered: avsMismatch,
      impact: avsMismatch ? 15 : 0,
      reason: avsMismatch ? `AVS code: ${args.avsCode} (no match)` : 'AVS matched',
    });
    
    fraudSignals.push({
      signal: 'CVV Mismatch',
      triggered: cvvMismatch,
      impact: cvvMismatch ? 10 : 0,
      reason: cvvMismatch ? `CVV code: ${args.cvvCode} (no match)` : 'CVV matched',
    });

    if (avsMismatch) riskScore -= 15;
    if (cvvMismatch) riskScore -= 10;

    // ========================================
    // SIGNAL 3: Geolocation Mismatch
    // ========================================
    const ipCountry = args.ipAddress.startsWith('203') ? 'AU' : 
                     args.ipAddress.startsWith('75') ? 'VN' :
                     args.ipAddress.startsWith('91') ? 'IN' : 'US';
    
    const geoMismatch = cardCountry !== ipCountry && cardCountry === 'AU' && ipCountry !== 'AU';
    
    fraudSignals.push({
      signal: 'Geolocation Mismatch',
      triggered: geoMismatch,
      impact: geoMismatch ? 25 : 0,
      reason: geoMismatch ? `Card issued in ${cardCountry}, but IP in ${ipCountry}` : 'Geolocation matched',
    });

    if (geoMismatch) riskScore -= 25;

    // ========================================
    // SIGNAL 4: High-Risk IP Region
    // ========================================
    const highRiskRegions = ['VN', 'NG', 'GH', 'RO', 'ID', 'PK', 'BD'];
    const isHighRiskIP = highRiskRegions.includes(ipCountry);

    fraudSignals.push({
      signal: 'High-Risk IP Region',
      triggered: isHighRiskIP,
      impact: isHighRiskIP ? 20 : 0,
      reason: isHighRiskIP ? `IP from high-fraud region: ${ipCountry}` : 'IP from low-risk region',
    });

    if (isHighRiskIP) riskScore -= 20;

    // ========================================
    // SIGNAL 5: Behavioral Biometrics
    // ========================================
    const biometrics = args.behavioralData || {};
    const isSuspiciousBehavior = 
      biometrics.interactionPattern === 'suspicious' || 
      biometrics.copyPasteDetected || 
      biometrics.hesitationEvents > 5 || 
      biometrics.typingSpeed > 15;

    fraudSignals.push({
      signal: 'Behavioral Biometrics',
      triggered: isSuspiciousBehavior,
      impact: isSuspiciousBehavior ? 12 : 0,
      reason: isSuspiciousBehavior ? 
        `${biometrics.copyPasteDetected ? 'Copy/paste detected' : 'Suspicious pattern'}` : 
        'Normal behavior detected',
    });

    if (isSuspiciousBehavior) riskScore -= 12;

    // ========================================
    // SIGNAL 6: Email Validation
    // ========================================
    const disposableEmails = [
      'tempmail', 'guerrillamail', '10minutemail', 'throwaway', 
      'temp-mail', 'mailinator', 'maildrop', 'trashmail'
    ];
    const emailDomain = args.email.split('@')[1]?.toLowerCase() || '';
    const isDisposableEmail = disposableEmails.some(d => emailDomain.includes(d));

    fraudSignals.push({
      signal: 'Email Validation',
      triggered: isDisposableEmail,
      impact: isDisposableEmail ? 20 : 0,
      reason: isDisposableEmail ? 'Disposable email detected' : 'Legitimate email',
    });

    if (isDisposableEmail) riskScore -= 20;

    // ========================================
    // SIGNAL 7: High-Value Order
    // ========================================
    const isHighValue = args.amount > 1000;

    fraudSignals.push({
      signal: 'High-Value Order',
      triggered: isHighValue,
      impact: isHighValue ? 10 : 0,
      reason: isHighValue ? `High transaction amount: $${args.amount}` : `Standard amount: $${args.amount}`,
    });

    if (isHighValue) riskScore -= 10;

    // ========================================
    // SIGNAL 8: AFP (AU Fraud Prevention Network)
    // ========================================
    // Simulate AFP check result based on multiple fraud signals
    const triggeredSignalsCount = fraudSignals.filter(s => s.triggered).length;
    const afpAlert = triggeredSignalsCount >= 3;

    fraudSignals.push({
      signal: 'AFP Network Alert',
      triggered: afpAlert,
      impact: afpAlert ? 30 : 0,
      reason: afpAlert ? `${triggeredSignalsCount} fraud signals triggered. Similar orders have 89% chargeback rate.` : 'No AFP alerts',
    });

    if (afpAlert) riskScore -= 30;

    // ========================================
    // Calculate Final Score and Recommendation
    // ========================================
    const finalScore = Math.max(0, Math.min(100, riskScore));
    
    let riskLevel: string;
    let recommendedAction: string;
    let explanation: string;
    let chargebackLikelihood: number;

    if (finalScore >= 80) {
      riskLevel = 'LOW RISK';
      recommendedAction = 'approve';
      explanation = 'Transaction appears legitimate. Low chargeback risk. Safe to process.';
      chargebackLikelihood = Math.max(0, 100 - finalScore);
    } else if (finalScore >= 60) {
      riskLevel = 'MEDIUM RISK';
      recommendedAction = 'review';
      explanation = 'Some risk indicators present. Recommend manual review before processing.';
      chargebackLikelihood = 100 - finalScore;
    } else if (finalScore >= 40) {
      riskLevel = 'HIGH RISK';
      recommendedAction = 'review';
      explanation = 'Multiple fraud signals detected. Identity verification recommended before capture.';
      chargebackLikelihood = 100 - finalScore;
    } else {
      riskLevel = 'CRITICAL RISK';
      recommendedAction = 'block';
      explanation = `Critical risk detected: ${fraudSignals.filter(s => s.triggered).map(s => s.signal).join(', ')}. Recommend declining this transaction.`;
      chargebackLikelihood = Math.min(100, 100 - finalScore);
    }

    return {
      riskScore: finalScore,
      riskLevel,
      recommendedAction,
      explanation,
      chargebackLikelihood: Math.round(chargebackLikelihood),
      fraudSignals,
      orderId: args.orderId,
      cardBin: cardBin,
      cardCountry,
      ipCountry,
      amount: args.amount,
      timestamp: Date.now(),
    };
  },
});

/**
 * Check velocity limits
 */
export const checkVelocity = query({
  args: {
    sessionToken: v.string(),
    customerEmail: v.string(),
    deviceFingerprint: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    const config = await ctx.db
      .query("preAuthConfig")
      .withIndex("by_user", (q: any) => q.eq("userId", viewer._id))
      .first();

    const effectiveConfig =
      config ??
      ({
        maxOrdersPerEmailPerHour: 3,
        maxOrdersPerDevicePerHour: 5,
      } as const);

    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    // Check email velocity
    const recentEmailOrders = await ctx.db
      .query("preAuthOrders")
      .withIndex("by_user", (q: any) => q.eq("userId", viewer._id))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("customerEmail"), args.customerEmail),
          q.gte(q.field("createdAt"), oneHourAgo)
        )
      )
      .collect();

    if (recentEmailOrders.length >= effectiveConfig.maxOrdersPerEmailPerHour) {
      return {
        passed: false,
        reason: `${recentEmailOrders.length} orders from this email in the last hour (limit: ${effectiveConfig.maxOrdersPerEmailPerHour})`,
      };
    }

    // Check device velocity
    if (args.deviceFingerprint) {
      const recentDeviceOrders = await ctx.db
        .query("preAuthOrders")
        .withIndex("by_user", (q: any) => q.eq("userId", viewer._id))
        .filter((q: any) =>
          q.and(
            q.eq(q.field("deviceFingerprint"), args.deviceFingerprint),
            q.gte(q.field("createdAt"), oneHourAgo)
          )
        )
        .collect();

      if (recentDeviceOrders.length >= effectiveConfig.maxOrdersPerDevicePerHour) {
        return {
          passed: false,
          reason: `${recentDeviceOrders.length} orders from this device in the last hour (limit: ${effectiveConfig.maxOrdersPerDevicePerHour})`,
        };
      }
    }

    return { passed: true, reason: "" };
  },
});

/**
 * Check if customer is first-time buyer
 */
export const isFirstTimeCustomer = query({
  args: { sessionToken: v.string(), customerEmail: v.string() },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    const previousOrders = await ctx.db
      .query("preAuthOrders")
      .withIndex("by_user", (q: any) => q.eq("userId", viewer._id))
      .filter((q: any) => q.eq(q.field("customerEmail"), args.customerEmail))
      .collect();

    return previousOrders.length === 0;
  },
});

/**
 * Create pre-auth order record
 */
export const createPreAuthOrder = mutation({
  args: {
    sessionToken: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    orderAmount: v.number(),
    orderId: v.string(),
    billingAddress: v.optional(v.string()),
    shippingAddress: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    deviceFingerprint: v.optional(v.string()),
    cardBin: v.optional(v.string()),
    preAuthScore: v.number(),
    preAuthRiskLevel: v.string(),
    preAuthChecks: v.any(),
    autoDecision: v.any(),
    status: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    const config = await ctx.db
      .query("preAuthConfig")
      .withIndex("by_user", (q: any) => q.eq("userId", viewer._id))
      .first();

    const reviewTimeoutHours = config?.reviewTimeoutHours || 24;

    return await ctx.db.insert("preAuthOrders", {
      userId: viewer._id,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      orderAmount: args.orderAmount,
      orderId: args.orderId,
      billingAddress: args.billingAddress,
      shippingAddress: args.shippingAddress,
      ipAddress: args.ipAddress,
      deviceFingerprint: args.deviceFingerprint,
      cardBin: args.cardBin,
      preAuthScore: args.preAuthScore,
      preAuthRiskLevel: args.preAuthRiskLevel,
      preAuthChecks: args.preAuthChecks,
      status: args.status,
      autoDecision: args.autoDecision,
      createdAt: Date.now(),
      expiresAt: Date.now() + reviewTimeoutHours * 60 * 60 * 1000,
    });
  },
});

/**
 * Get pending orders (requiring manual review)
 */
export const getPendingOrders = query({
  args: { sessionToken: v.string() },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) return [];

    return await ctx.db
      .query("preAuthOrders")
      .withIndex("by_user_status", (q: any) =>
        q.eq("userId", viewer._id).eq("status", "PENDING_REVIEW")
      )
      .order("desc")
      .collect();
  },
});

/**
 * Get all pre-auth orders (for dashboard)
 */
export const getAllPreAuthOrders = query({
  args: { sessionToken: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) return [];

    const limit = args.limit || 50;

    return await ctx.db
      .query("preAuthOrders")
      .withIndex("by_user", (q: any) => q.eq("userId", viewer._id))
      .order("desc")
      .take(limit);
  },
});

/**
 * Manual approve order
 */
export const approveOrder = mutation({
  args: {
    sessionToken: v.string(),
    preAuthOrderId: v.id("preAuthOrders"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.preAuthOrderId);
    if (!order) throw new Error("Order not found");
    if (order.userId !== viewer._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.preAuthOrderId, {
      status: "MANUAL_APPROVED",
      reviewedBy: viewer._id,
      reviewedAt: Date.now(),
      reviewDecision: "APPROVED",
      reviewNotes: args.notes,
    });

    return { success: true };
  },
});

/**
 * Manual decline order
 */
export const declineOrder = mutation({
  args: {
    sessionToken: v.string(),
    preAuthOrderId: v.id("preAuthOrders"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.preAuthOrderId);
    if (!order) throw new Error("Order not found");
    if (order.userId !== viewer._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.preAuthOrderId, {
      status: "MANUAL_DECLINED",
      reviewedBy: viewer._id,
      reviewedAt: Date.now(),
      reviewDecision: "DECLINED",
      reviewNotes: args.notes,
    });

    return { success: true };
  },
});

/**
 * Move order to post-auth (full analysis)
 */
export const moveToPostAuth = mutation({
  args: {
    sessionToken: v.string(),
    preAuthOrderId: v.id("preAuthOrders"),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.preAuthOrderId);
    if (!order) throw new Error("Order not found");
    if (order.userId !== viewer._id) throw new Error("Unauthorized");

    // Run full post-auth analysis (already built in chargebackFraud.ts)
    // This would be called from an action that triggers analyzeOrder
    
    await ctx.db.patch(args.preAuthOrderId, {
      status: "MOVED_TO_POST_AUTH",
      movedToPostAuthAt: Date.now(),
    });

    return { success: true, orderId: order.orderId };
  },
});

/**
 * Move order to post-auth with full fraud analysis
 * This combines pre-auth data with deep post-auth scanning
 */
export const moveToPostAuthWithAnalysis = action({
  args: {
    sessionToken: v.string(),
    preAuthOrderId: v.id("preAuthOrders"),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await ctx.runQuery(api.auth.getCurrentUser, {
      sessionToken: args.sessionToken,
    });

    if (!viewer) {
      throw new Error("Not authenticated");
    }

    // Get pre-auth order
    const preAuthOrder = await ctx.runQuery(api.preAuthCheck.getPreAuthOrderById, {
      sessionToken: args.sessionToken,
      preAuthOrderId: args.preAuthOrderId,
    });

    if (!preAuthOrder) {
      throw new Error("Pre-auth order not found");
    }

    // Run full post-auth analysis
    const postAuthResult = await ctx.runAction(api.chargebackFraud.analyzeOrder, {
      sessionToken: args.sessionToken,
      customerEmail: preAuthOrder.customerEmail,
      customerPhone: preAuthOrder.customerPhone,
      orderAmount: preAuthOrder.orderAmount,
      orderId: preAuthOrder.orderId,
      billingAddress: preAuthOrder.billingAddress,
      shippingAddress: preAuthOrder.shippingAddress,
      ipAddress: preAuthOrder.ipAddress,
      deviceFingerprint: preAuthOrder.deviceFingerprint,
      cardBin: preAuthOrder.cardBin,
    });

    // Link pre-auth order to post-auth scan
    await ctx.runMutation(api.preAuthCheck.linkToPostAuth, {
      sessionToken: args.sessionToken,
      preAuthOrderId: args.preAuthOrderId,
      postAuthScanId: postAuthResult.scanId,
    });

    // ALSO create a Post-Auth monitoring record (this is what the Protect tab lists).
    // Without this, the order is "moved" but will never appear in the Post-Auth dashboard.
    const postAuthOrderId = await ctx.runMutation(api.preAuthCheck.createPostAuthOrder, {
      sessionToken: args.sessionToken,
      orderId: preAuthOrder.orderId,
      amount: preAuthOrder.orderAmount,
      email: preAuthOrder.customerEmail,
      cardBin: preAuthOrder.cardBin ?? "000000",
      ipAddress: preAuthOrder.ipAddress ?? "0.0.0.0",
      preAuthScore: preAuthOrder.preAuthScore,
      // For post-auth, `riskScore` is a risk measure (0-100). Higher = riskier.
      // Our Post-Auth dashboard expects `chargebackRisk` as a %.
      chargebackRisk: Math.max(0, Math.min(100, Number(postAuthResult.riskScore) || 0)),
      // Reuse the deep scan signals so the dashboard can later show evidence/reasons.
      fraudSignals: postAuthResult.signals ?? postAuthResult.riskFactors ?? [],
      status: "UNDER_MONITORING",
    });

    return {
      success: true,
      preAuthScore: preAuthOrder.preAuthScore,
      postAuthScore: postAuthResult.riskScore,
      postAuthScanId: postAuthResult.scanId,
      postAuthOrderId,
      recommendation: postAuthResult.recommendation,
    };
  },
});

/**
 * Get pre-auth order by ID
 */
export const getPreAuthOrderById = query({
  args: {
    sessionToken: v.string(),
    preAuthOrderId: v.id("preAuthOrders"),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.preAuthOrderId);
    if (!order) return null;
    if (order.userId !== viewer._id) throw new Error("Unauthorized");

    return order;
  },
});

/**
 * Link pre-auth order to post-auth scan
 */
export const linkToPostAuth = mutation({
  args: {
    sessionToken: v.string(),
    preAuthOrderId: v.id("preAuthOrders"),
    postAuthScanId: v.id("chargebackScans"),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    await ctx.db.patch(args.preAuthOrderId, {
      status: "MOVED_TO_POST_AUTH",
      postAuthScanId: args.postAuthScanId,
      movedToPostAuthAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get pre-auth configuration
 */
export const getPreAuthConfig = query({
  args: { sessionToken: v.string() },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    const now = Date.now();

    const buildDefaultPreAuthConfig = () => ({
      userId: viewer._id,
      autoApproveThreshold: 80,
      autoDeclineThreshold: 40,
      requireReviewAboveAmount: 1000,
      firstTimeCustomerRequiresReview: true,
      firstTimeCustomerMaxAmount: 500,
      maxOrdersPerEmailPerHour: 3,
      maxOrdersPerDevicePerHour: 5,
      blockHighRiskCountries: true,
      highRiskCountryCodes: ["NG", "GH", "RO", "ID", "PK", "BD"],
      blockDisposableEmails: true,
      requirePhoneValidation: false,
      reviewTimeoutHours: 24,
      notifyOnHighRisk: true,
      notifyOnPendingReview: true,
      createdAt: now,
      updatedAt: now,
    });

    // IMPORTANT: Convex queries are read-only. Do NOT attempt ctx.db.insert/patch here.
    // If the config record doesn't exist yet, we simply return defaults.
    const config = await ctx.db
      .query("preAuthConfig")
      .withIndex("by_user", (q: any) => q.eq("userId", viewer._id))
      .first();

    return config ?? buildDefaultPreAuthConfig();
  },
});

/**
 * Update pre-auth configuration
 */
export const updatePreAuthConfig = mutation({
  args: {
    sessionToken: v.string(),
    autoApproveThreshold: v.optional(v.number()),
    autoDeclineThreshold: v.optional(v.number()),
    requireReviewAboveAmount: v.optional(v.number()),
    firstTimeCustomerRequiresReview: v.optional(v.boolean()),
    firstTimeCustomerMaxAmount: v.optional(v.number()),
    maxOrdersPerEmailPerHour: v.optional(v.number()),
    maxOrdersPerDevicePerHour: v.optional(v.number()),
    blockHighRiskCountries: v.optional(v.boolean()),
    highRiskCountryCodes: v.optional(v.array(v.string())),
    blockDisposableEmails: v.optional(v.boolean()),
    requirePhoneValidation: v.optional(v.boolean()),
    reviewTimeoutHours: v.optional(v.number()),
    notifyOnHighRisk: v.optional(v.boolean()),
    notifyOnPendingReview: v.optional(v.boolean()),
    
    // Post-auth monitoring schedule (minutes from local midnight)
    postAuthDailyCheckTimeMinutes: v.optional(v.number()),
    postAuthTimezoneOffsetMinutes: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    const now = Date.now();

    const buildDefaultPreAuthConfig = () => ({
      userId: viewer._id,
      autoApproveThreshold: 80,
      autoDeclineThreshold: 40,
      requireReviewAboveAmount: 1000,
      firstTimeCustomerRequiresReview: true,
      firstTimeCustomerMaxAmount: 500,
      maxOrdersPerEmailPerHour: 3,
      maxOrdersPerDevicePerHour: 5,
      blockHighRiskCountries: true,
      highRiskCountryCodes: ["NG", "GH", "RO", "ID", "PK", "BD"],
      blockDisposableEmails: true,
      requirePhoneValidation: false,
      reviewTimeoutHours: 24,
      notifyOnHighRisk: true,
      notifyOnPendingReview: true,
      createdAt: now,
      updatedAt: now,
    });

    const updates: any = { updatedAt: now };

    if (args.autoApproveThreshold !== undefined)
      updates.autoApproveThreshold = args.autoApproveThreshold;
    if (args.autoDeclineThreshold !== undefined)
      updates.autoDeclineThreshold = args.autoDeclineThreshold;
    if (args.requireReviewAboveAmount !== undefined)
      updates.requireReviewAboveAmount = args.requireReviewAboveAmount;
    if (args.firstTimeCustomerRequiresReview !== undefined)
      updates.firstTimeCustomerRequiresReview = args.firstTimeCustomerRequiresReview;
    if (args.firstTimeCustomerMaxAmount !== undefined)
      updates.firstTimeCustomerMaxAmount = args.firstTimeCustomerMaxAmount;
    if (args.maxOrdersPerEmailPerHour !== undefined)
      updates.maxOrdersPerEmailPerHour = args.maxOrdersPerEmailPerHour;
    if (args.maxOrdersPerDevicePerHour !== undefined)
      updates.maxOrdersPerDevicePerHour = args.maxOrdersPerDevicePerHour;
    if (args.blockHighRiskCountries !== undefined)
      updates.blockHighRiskCountries = args.blockHighRiskCountries;
    if (args.highRiskCountryCodes !== undefined)
      updates.highRiskCountryCodes = args.highRiskCountryCodes;
    if (args.blockDisposableEmails !== undefined)
      updates.blockDisposableEmails = args.blockDisposableEmails;
    if (args.requirePhoneValidation !== undefined)
      updates.requirePhoneValidation = args.requirePhoneValidation;
    if (args.reviewTimeoutHours !== undefined)
      updates.reviewTimeoutHours = args.reviewTimeoutHours;
    if (args.notifyOnHighRisk !== undefined)
      updates.notifyOnHighRisk = args.notifyOnHighRisk;
    if (args.notifyOnPendingReview !== undefined)
      updates.notifyOnPendingReview = args.notifyOnPendingReview;

    if (args.postAuthDailyCheckTimeMinutes !== undefined)
      updates.postAuthDailyCheckTimeMinutes = args.postAuthDailyCheckTimeMinutes;
    if (args.postAuthTimezoneOffsetMinutes !== undefined)
      updates.postAuthTimezoneOffsetMinutes = args.postAuthTimezoneOffsetMinutes;

    const existingConfig = await ctx.db
      .query("preAuthConfig")
      .withIndex("by_user", (q: any) => q.eq("userId", viewer._id))
      .first();

    if (!existingConfig) {
      // First write creates a row (upsert behavior).
      const configToInsert = { ...buildDefaultPreAuthConfig(), ...updates };
      const newId = await ctx.db.insert("preAuthConfig", configToInsert);
      return { success: true, created: true, configId: newId };
    }

    await ctx.db.patch(existingConfig._id, updates);
    return { success: true, created: false };
  },
});

/**
 * DEMO VERSION: Move order from pre-auth to post-auth monitoring
 * Tracks chargeback risk during the 30-120 day vulnerable window
 */
export const moveToPostAuthDemo = action({
  args: {
    orderId: v.string(),
    amount: v.number(),
    email: v.string(),
    cardBin: v.string(),
    ipAddress: v.string(),
    riskScore: v.number(),
    fraudSignals: v.any(),
  },
  handler: async (ctx: any, args: any) => {
    // Calculate initial chargeback risk based on pre-auth score
    // Higher pre-auth risk = higher post-auth monitoring needed
    const chargebackRisk = Math.max(0, 100 - args.riskScore);
    
    // Simulate chargeback risk calculation
    // In production, this would be based on historical data
    const baseRisk = chargebackRisk;
    const behavioralMultiplier = args.fraudSignals.filter((s: any) => s.triggered).length > 3 ? 1.5 : 1;
    const finalChargebackRisk = Math.min(100, baseRisk * behavioralMultiplier);

    // Create post-auth order record
    const postAuthOrderId = await ctx.runMutation(
      api.preAuthCheck.createPostAuthOrder,
      {
        sessionToken: args.sessionToken,
        orderId: args.orderId,
        amount: args.amount,
        email: args.email,
        cardBin: args.cardBin,
        ipAddress: args.ipAddress,
        preAuthScore: args.riskScore,
        chargebackRisk: finalChargebackRisk,
        fraudSignals: args.fraudSignals,
        status: 'UNDER_MONITORING',
      }
    );

    return {
      success: true,
      postAuthOrderId,
      chargebackRisk: finalChargebackRisk,
      monitoringDays: 120,
      message: `Order moved to post-auth monitoring. Will track for 120 days.`,
    };
  },
});

/**
 * Create post-auth order record
 */
export const createPostAuthOrder = mutation({
  args: {
    sessionToken: v.string(),
    orderId: v.string(),
    amount: v.number(),
    email: v.string(),
    cardBin: v.string(),
    ipAddress: v.string(),
    preAuthScore: v.number(),
    chargebackRisk: v.number(),
    fraudSignals: v.any(),
    status: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    return await ctx.db.insert('postAuthOrders', {
      userId: viewer._id,
      orderId: args.orderId,
      amount: args.amount,
      email: args.email,
      cardBin: args.cardBin,
      ipAddress: args.ipAddress,
      preAuthScore: args.preAuthScore,
      chargebackRisk: args.chargebackRisk,
      fraudSignals: args.fraudSignals,
      status: args.status,
      createdAt: Date.now(),
      evidence: [],
      notes: [],
    });
  },
});

/**
 * Get all post-auth orders (for analytics dashboard)
 */
export const getPostAuthOrders = query({
  args: { sessionToken: v.string() },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) return [];

    const all = await ctx.db.query('postAuthOrders').collect();

    const orders = all.filter((order: any) => {
      // Legacy docs created before we stored userId. In a single-merchant environment,
      // we treat them as belonging to the current user.
      if (!order.userId) return true;
      return order.userId === viewer._id;
    });

    return orders.map((order: any) => {
      const daysInMonitoring = Math.floor((Date.now() - order.createdAt) / (24 * 60 * 60 * 1000));
      return {
        ...order,
        daysInMonitoring,
      };
    });
  },
});

/**
 * Update post-auth order with evidence
 */
export const addPostAuthEvidence = mutation({
  args: {
    postAuthOrderId: v.id('postAuthOrders'),
    evidence: v.object({
      type: v.string(), // 'invoice', 'shipping', 'delivery_confirmation', 'customer_communication'
      description: v.string(),
      timestamp: v.number(),
    }),
  },
  handler: async (ctx: any, args: any) => {
    const order = await ctx.db.get(args.postAuthOrderId);
    if (!order) throw new Error('Order not found');

    const updatedEvidence = [...(order.evidence || []), args.evidence];

    await ctx.db.patch(args.postAuthOrderId, {
      evidence: updatedEvidence,
      updatedAt: Date.now(),
    });

    return { success: true, evidenceCount: updatedEvidence.length };
  },
});

/**
 * Mark order as chargeback filed
 */
export const markChargebackFiled = mutation({
  args: {
    postAuthOrderId: v.id('postAuthOrders'),
    chargebackReason: v.string(),
    chargebackAmount: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    const order = await ctx.db.get(args.postAuthOrderId);
    if (!order) throw new Error('Order not found');

    await ctx.db.patch(args.postAuthOrderId, {
      status: 'CHARGEBACKS_FILED',
      chargebackFiledAt: Date.now(),
      chargebackReason: args.chargebackReason,
      chargebackAmount: args.chargebackAmount,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Mark order as cleared (past chargeback window)
 */
export const markOrderCleared = mutation({
  args: {
    postAuthOrderId: v.id('postAuthOrders'),
  },
  handler: async (ctx: any, args: any) => {
    const order = await ctx.db.get(args.postAuthOrderId);
    if (!order) throw new Error('Order not found');

    await ctx.db.patch(args.postAuthOrderId, {
      status: 'CLEARED',
      clearedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Helper function
const fetchFromGlobal: any = (globalThis as any).fetch;

async function apiAuth(ctx: any, sessionToken: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", sessionToken))
    .first();

  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    await ctx.db.delete(session._id);
    return null;
  }

  const user = await ctx.db.get(session.userId);
  if (!user) {
    return null;
  }

  return user;
}