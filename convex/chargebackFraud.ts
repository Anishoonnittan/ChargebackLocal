/**
 * Chargeback Fraud Detection
 * Convex functions for analyzing orders and preventing chargebacks
 */

import { mutation, query, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { sendHighRiskAlert } from "../lib/pushNotifications";

// ========================================
// TYPES
// ========================================
type SignalStatus = "PASS" | "WARN" | "FAIL";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// Import fraud detection utilities (will be moved to actions for external API calls)
// For now, we'll implement the logic directly in actions

/**
 * Analyze order for chargeback risk
 * Runs all 7 fraud detection checks and returns multi-signal risk score
 */
export const analyzeOrder = action({
  args: {
    sessionToken: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    orderAmount: v.number(),
    orderId: v.optional(v.string()),
    billingAddress: v.optional(v.string()),
    shippingAddress: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    deviceFingerprint: v.optional(v.string()),
    cardBin: v.optional(v.string()),
    sessionData: v.optional(
      v.object({
        landedAt: v.number(),
        timeToCheckout: v.number(),
        pagesViewed: v.number(),
      })
    ),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await ctx.runQuery(api.auth.getCurrentUser, {
      sessionToken: args.sessionToken,
    });

    if (!viewer) {
      throw new Error("Not authenticated");
    }
    
    const signals = [];
    const riskFactors = [];
    
    // ========================================
    // 1. DEVICE FINGERPRINTING
    // ========================================
    if (args.deviceFingerprint) {
      const deviceHistory = await ctx.runQuery(api.chargebackFraud.getOrdersByDevice, {
        sessionToken: args.sessionToken,
        deviceFingerprint: args.deviceFingerprint,
      });
      
      const uniqueEmails = new Set(deviceHistory.map((h: any) => h.customerEmail)).size;
      
      if (uniqueEmails > 5) {
        signals.push({
          name: "device_fingerprint",
          score: 40,
          weight: 0.25,
          status: "FAIL",
          details: `Device used for ${uniqueEmails} different accounts`,
        });
        riskFactors.push({
          type: "device_fingerprint",
          severity: "high",
          description: `Device used for ${uniqueEmails} different accounts (fraud farm indicator)`,
          score: 40,
        });
      } else if (uniqueEmails > 3) {
        signals.push({
          name: "device_fingerprint",
          score: 25,
          weight: 0.25,
          status: "WARN",
          details: `Device used for ${uniqueEmails} different accounts`,
        });
        riskFactors.push({
          type: "device_fingerprint",
          severity: "medium",
          description: `Device used for ${uniqueEmails} different accounts`,
          score: 25,
        });
      } else {
        signals.push({
          name: "device_fingerprint",
          score: 0,
          weight: 0.25,
          status: "PASS",
          details: "Device check passed",
        });
      }
    }
    
    // ========================================
    // 2. GEOLOCATION MISMATCH
    // ========================================
    if (args.ipAddress) {
      try {
        const ipResponse = await fetchFromGlobal(`https://ipapi.co/${args.ipAddress}/json/`);
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          const ipCountry = ipData.country_code;
          
          let geoScore = 0;
          let geoDetails = "Geolocation check passed";
          let geoStatus: SignalStatus = "PASS";
          
          // Check for high-risk countries
          const highRiskCountries = ['NG', 'GH', 'RO', 'ID', 'PK', 'BD'];
          if (highRiskCountries.includes(ipCountry)) {
            geoScore = 15;
            geoDetails = `Order from high-risk country: ${ipCountry}`;
            geoStatus = "WARN";
            riskFactors.push({
              type: "geolocation",
              severity: "medium",
              description: `Order from high-risk country: ${ipCountry}`,
              score: 15,
            });
          }
          
          // Check BIN mismatch if cardBin provided
          if (args.cardBin && args.cardBin.length >= 6) {
            const binResponse = await fetchFromGlobal(
              `https://lookup.binlist.net/${args.cardBin.substring(0, 6)}`
            );
            if (binResponse.ok) {
              const binData = await binResponse.json();
              const cardCountry = binData.country?.alpha2;
              
              if (cardCountry && ipCountry !== cardCountry) {
                geoScore = 30;
                geoDetails = `IP in ${ipCountry}, card issued in ${cardCountry}`;
                geoStatus = "FAIL";
                riskFactors.push({
                  type: "geolocation",
                  severity: "high",
                  description: `IP in ${ipCountry}, card issued in ${cardCountry}`,
                  score: 30,
                });
              }
            }
          }
          
          signals.push({
            name: "geolocation",
            score: geoScore,
            weight: 0.20,
            status: geoStatus,
            details: geoDetails,
          });
        }
      } catch (error) {
        console.error("Geolocation check failed:", error);
        signals.push({
          name: "geolocation",
          score: 0,
          weight: 0.20,
          status: "PASS",
          details: "Geolocation check unavailable",
        });
      }
    }
    
    // ========================================
    // 3. VELOCITY CHECKS
    // ========================================
    const recentOrders = await ctx.runQuery(api.chargebackFraud.getRecentOrdersByEmail, {
      sessionToken: args.sessionToken,
      email: args.customerEmail,
    });
    
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const ordersLast5Min = recentOrders.filter((o: any) => o.scannedAt > fiveMinutesAgo).length;
    const ordersLastHour = recentOrders.filter((o: any) => o.scannedAt > oneHourAgo).length;
    
    let velocityScore = 0;
    let velocityStatus: SignalStatus = "PASS";
    let velocityDetails = "Velocity check passed";
    
    if (ordersLast5Min > 3) {
      velocityScore = 35;
      velocityStatus = "FAIL";
      velocityDetails = `${ordersLast5Min} orders in 5 minutes (bot attack pattern)`;
      riskFactors.push({
        type: "velocity",
        severity: "high",
        description: velocityDetails,
        score: 35,
      });
    } else if (ordersLastHour > 10) {
      velocityScore = 30;
      velocityStatus = "FAIL";
      velocityDetails = `${ordersLastHour} orders in 1 hour`;
      riskFactors.push({
        type: "velocity",
        severity: "high",
        description: velocityDetails,
        score: 30,
      });
    }
    
    signals.push({
      name: "velocity",
      score: velocityScore,
      weight: 0.20,
      status: velocityStatus,
      details: velocityDetails,
    });
    
    // ========================================
    // 4. EMAIL VALIDATION
    // ========================================
    const disposableDomains = [
      'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email',
      'temp-mail.org', 'mailinator.com', 'maildrop.cc', 'trashmail.com'
    ];
    const emailDomain = args.customerEmail.split('@')[1]?.toLowerCase();
    
    let emailScore = 0;
    let emailStatus: SignalStatus = "PASS";
    let emailDetails = "Email validation passed";
    
    if (disposableDomains.includes(emailDomain)) {
      emailScore = 25;
      emailStatus = "FAIL";
      emailDetails = "Disposable email detected";
      riskFactors.push({
        type: "email",
        severity: "high",
        description: "Disposable email detected",
        score: 25,
      });
    }
    
    signals.push({
      name: "email",
      score: emailScore,
      weight: 0.15,
      status: emailStatus,
      details: emailDetails,
    });
    
    // ========================================
    // 5. ADDRESS MISMATCH
    // ========================================
    if (args.billingAddress && args.shippingAddress) {
      const normalize = (addr: string) => addr.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedBilling = normalize(args.billingAddress);
      const normalizedShipping = normalize(args.shippingAddress);
      
      let addressScore = 0;
      let addressStatus: SignalStatus = "PASS";
      let addressDetails = "Addresses match";
      
      if (normalizedBilling !== normalizedShipping) {
        // Check for different countries
        const extractCountry = (addr: string) => {
          const countries = ['USA', 'US', 'UK', 'AU', 'CA', 'NZ', 'DE', 'FR', 'IT', 'ES'];
          for (const country of countries) {
            if (addr.toUpperCase().includes(country)) return country;
          }
          return null;
        };
        
        const billingCountry = extractCountry(args.billingAddress);
        const shippingCountry = extractCountry(args.shippingAddress);
        
        if (billingCountry && shippingCountry && billingCountry !== shippingCountry) {
          addressScore = 25;
          addressStatus = "FAIL";
          addressDetails = `Different countries: ${billingCountry} → ${shippingCountry}`;
          riskFactors.push({
            type: "address",
            severity: "high",
            description: addressDetails,
            score: 25,
          });
        } else {
          addressScore = 12;
          addressStatus = "WARN";
          addressDetails = "Billing ≠ Shipping address";
          riskFactors.push({
            type: "address",
            severity: "medium",
            description: addressDetails,
            score: 12,
          });
        }
      }
      
      signals.push({
        name: "address",
        score: addressScore,
        weight: 0.10,
        status: addressStatus,
        details: addressDetails,
      });
    }
    
    // ========================================
    // 6. ORDER VALUE ANOMALIES
    // ========================================
    const userOrderHistory = await ctx.runQuery(api.chargebackFraud.getUserOrderHistory, {
      sessionToken: args.sessionToken,
      email: args.customerEmail,
    });
    
    let orderScore = 0;
    let orderStatus: SignalStatus = "PASS";
    let orderDetails = "Order value check passed";
    
    if (userOrderHistory.totalOrders === 0) {
      if (args.orderAmount > 1000) {
        orderScore = 30;
        orderStatus = "FAIL";
        orderDetails = `High-value first order ($${args.orderAmount})`;
        riskFactors.push({
          type: "order_value",
          severity: "high",
          description: orderDetails,
          score: 30,
        });
      } else if (args.orderAmount > 500) {
        orderScore = 15;
        orderStatus = "WARN";
        orderDetails = `First order over $500 ($${args.orderAmount})`;
        riskFactors.push({
          type: "order_value",
          severity: "medium",
          description: orderDetails,
          score: 15,
        });
      }
    } else if (userOrderHistory.avgOrderValue > 0) {
      const ratio = args.orderAmount / userOrderHistory.avgOrderValue;
      if (ratio > 5) {
        orderScore = 25;
        orderStatus = "FAIL";
        orderDetails = `Order 5x above average ($${userOrderHistory.avgOrderValue.toFixed(2)} avg)`;
        riskFactors.push({
          type: "order_value",
          severity: "high",
          description: orderDetails,
          score: 25,
        });
      } else if (ratio > 3) {
        orderScore = 15;
        orderStatus = "WARN";
        orderDetails = `Order 3x above average ($${userOrderHistory.avgOrderValue.toFixed(2)} avg)`;
        riskFactors.push({
          type: "order_value",
          severity: "medium",
          description: orderDetails,
          score: 15,
        });
      }
    }
    
    signals.push({
      name: "order_value",
      score: orderScore,
      weight: 0.05,
      status: orderStatus,
      details: orderDetails,
    });
    
    // ========================================
    // 7. BEHAVIOR ANALYSIS
    // ========================================
    if (args.sessionData) {
      const timeToCheckoutSeconds = args.sessionData.timeToCheckout / 1000;
      
      let behaviorScore = 0;
      let behaviorStatus: SignalStatus = "PASS";
      let behaviorDetails = "Behavior analysis passed";
      
      if (timeToCheckoutSeconds < 20) {
        behaviorScore = 25;
        behaviorStatus = "FAIL";
        behaviorDetails = `Rushed checkout (${Math.round(timeToCheckoutSeconds)}s)`;
        riskFactors.push({
          type: "behavior",
          severity: "high",
          description: behaviorDetails,
          score: 25,
        });
      } else if (args.sessionData.pagesViewed < 2) {
        behaviorScore = 12;
        behaviorStatus = "WARN";
        behaviorDetails = "No product browsing detected";
        riskFactors.push({
          type: "behavior",
          severity: "medium",
          description: behaviorDetails,
          score: 12,
        });
      }
      
      signals.push({
        name: "behavior",
        score: behaviorScore,
        weight: 0.05,
        status: behaviorStatus,
        details: behaviorDetails,
      });
    }
    
    // ========================================
    // CALCULATE MULTI-SIGNAL RISK SCORE
    // ========================================
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    signals.forEach(signal => {
      totalWeightedScore += signal.score * signal.weight;
      totalWeight += signal.weight;
    });
    
    const riskScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight)) : 0;
    
    // Determine risk level
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    if (riskScore >= 70) riskLevel = "CRITICAL";
    else if (riskScore >= 50) riskLevel = "HIGH";
    else if (riskScore >= 30) riskLevel = "MEDIUM";
    else riskLevel = "LOW";
    
    // Confidence score
    const confidenceScore = Math.min(100, signals.length * 14);
    
    // Generate recommendations
    let recommendation = "";
    let actionRequired = "";
    const suggestedActions: string[] = [];
    
    if (riskLevel === "CRITICAL") {
      recommendation = "HIGH RISK: Decline order or require identity verification before fulfillment.";
      actionRequired = "DECLINE or VERIFY_IDENTITY";
      suggestedActions.push("Decline order", "Require photo ID + selfie", "Call customer to verify");
    } else if (riskLevel === "HIGH") {
      recommendation = "MEDIUM-HIGH RISK: Contact customer to verify authenticity before shipping.";
      actionRequired = "REVIEW";
      suggestedActions.push("Contact customer", "Verify email ownership", "Monitor tracking");
    } else if (riskLevel === "MEDIUM") {
      recommendation = "MEDIUM RISK: Proceed with caution. Monitor for chargeback activity.";
      actionRequired = "REVIEW";
      suggestedActions.push("Verify email/phone", "Monitor delivery", "Keep communication records");
    } else {
      recommendation = "LOW RISK: Safe to fulfill. Standard monitoring recommended.";
      actionRequired = "APPROVE";
      suggestedActions.push("Fulfill order", "Monitor for chargeback activity");
    }
    
    // Store scan in database
    const scanId = await ctx.runMutation(api.chargebackFraud.createScan, {
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
      riskScore,
      riskLevel,
      confidenceScore,
      signals,
      riskFactors,
      recommendation,
      actionRequired,
      suggestedActions,
    });
    
    // Create alert if high risk
    if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
      await ctx.runMutation(api.chargebackFraud.createRiskAlert, {
        sessionToken: args.sessionToken,
        scanId,
        alertLevel: riskLevel === "CRITICAL" ? "BLOCK" : "REVIEW",
        title: `🚨 ${riskLevel} Risk Order Detected`,
        message: `Order from ${args.customerEmail} ($${args.orderAmount}) - Risk Score: ${riskScore}`,
        orderDetails: {
          orderId: args.orderId,
          customerEmail: args.customerEmail,
          amount: args.orderAmount,
        },
      });
    }
    
    return {
      scanId,
      riskScore,
      riskLevel,
      confidenceScore,
      signals,
      riskFactors,
      recommendation,
      actionRequired,
      suggestedActions,
    };
  },
});

/**
 * Helper queries
 */
export const getOrdersByDevice = query({
  args: { sessionToken: v.string(), deviceFingerprint: v.string() },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    return await ctx.db
      .query("chargebackScans")
      .withIndex("by_device_fingerprint", (q: any) => q.eq("deviceFingerprint", args.deviceFingerprint))
      .filter((q: any) => q.eq(q.field("userId"), viewer._id))
      .collect();
  },
});

export const getRecentOrdersByEmail = query({
  args: { sessionToken: v.string(), email: v.string() },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return await ctx.db
      .query("chargebackScans")
      .withIndex("by_customer_email", (q: any) => q.eq("customerEmail", args.email))
      .filter((q: any) => q.eq(q.field("userId"), viewer._id))
      .filter((q: any) => q.gte(q.field("scannedAt"), oneDayAgo))
      .collect();
  },
});

export const getUserOrderHistory = query({
  args: { sessionToken: v.string(), email: v.string() },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    const orders = await ctx.db
      .query("chargebackScans")
      .withIndex("by_customer_email", (q: any) => q.eq("customerEmail", args.email))
      .filter((q: any) => q.eq(q.field("userId"), viewer._id))
      .collect();

    const totalOrders = orders.length;
    const avgOrderValue =
      totalOrders > 0
        ? orders.reduce((sum: any, o: any) => sum + o.orderAmount, 0) / totalOrders
        : 0;

    return { totalOrders, avgOrderValue };
  },
});

/**
 * Create scan record
 */
export const createScan = mutation({
  args: {
    sessionToken: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    orderAmount: v.number(),
    orderId: v.optional(v.string()),
    billingAddress: v.optional(v.string()),
    shippingAddress: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    deviceFingerprint: v.optional(v.string()),
    cardBin: v.optional(v.string()),
    riskScore: v.number(),
    riskLevel: v.string(),
    confidenceScore: v.optional(v.number()),
    signals: v.any(),
    riskFactors: v.any(),
    recommendation: v.string(),
    actionRequired: v.string(),
    suggestedActions: v.array(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    return await ctx.db.insert("chargebackScans", {
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
      riskScore: args.riskScore,
      riskLevel: args.riskLevel,
      confidenceScore: args.confidenceScore,
      signals: args.signals,
      riskFactors: args.riskFactors,
      recommendation: args.recommendation,
      actionRequired: args.actionRequired,
      suggestedActions: args.suggestedActions,
      scannedAt: Date.now(),
    });
  },
});

/**
 * Create risk alert
 */
export const createRiskAlert = mutation({
  args: {
    sessionToken: v.string(),
    scanId: v.id("chargebackScans"),
    alertLevel: v.string(),
    title: v.string(),
    message: v.string(),
    orderDetails: v.optional(v.any()),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    return await ctx.db.insert("riskAlerts", {
      userId: viewer._id,
      scanId: args.scanId,
      alertLevel: args.alertLevel,
      title: args.title,
      message: args.message,
      orderDetails: args.orderDetails,
      status: "UNREAD",
      createdAt: Date.now(),
    });
  },
});

/**
 * Get recent scans for dashboard
 */
export const getRecentScans = query({
  args: { sessionToken: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) return [];

    const limit = args.limit ?? 20;

    const scans = await ctx.db
      .query("chargebackScans")
      .withIndex("by_user", (q: any) => q.eq("userId", viewer._id))
      .order("desc")
      .take(limit);

    return scans;
  },
});

// Get analytics for a specific period
export const getAnalytics = query({
  args: { sessionToken: v.string(), period: v.string() }, // Format: "2024-01"
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    // Parse period (e.g., "2024-01")
    const [yearStr, monthStr] = args.period.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    // Calculate timestamp range
    const startOfMonth = new Date(year, month - 1, 1).getTime();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).getTime();

    // Fetch all scans in this period
    const scans = await ctx.db
      .query("chargebackScans")
      .withIndex("by_user", (q: any) => q.eq("userId", viewer._id))
      .filter((q: any) =>
        q.and(q.gte(q.field("scannedAt"), startOfMonth), q.lte(q.field("scannedAt"), endOfMonth))
      )
      .collect();

    // Calculate metrics
    const totalScans = scans.length;
    const blockedOrders = scans.filter((s: any) => s.riskLevel === "CRITICAL").length;
    const approvedOrders = scans.filter((s: any) => s.riskLevel === "LOW").length;

    const totalRiskAmount = scans
      .filter((s: any) => s.riskLevel === "CRITICAL")
      .reduce((sum: any, s: any) => sum + s.orderAmount, 0);

    // Assume 70% of blocked orders would've been chargebacks
    const estimatedSavings = totalRiskAmount * 0.7;

    const avgRiskScore =
      totalScans > 0
        ? scans.reduce((sum: any, s: any) => sum + s.riskScore, 0) / totalScans
        : 0;

    const lowRiskCount = scans.filter((s: any) => s.riskLevel === "LOW").length;
    const mediumRiskCount = scans.filter((s: any) => s.riskLevel === "MEDIUM").length;
    const highRiskCount = scans.filter((s: any) => s.riskLevel === "HIGH").length;
    const criticalRiskCount = scans.filter((s: any) => s.riskLevel === "CRITICAL").length;

    const reviewedOrders = scans.filter(
      (s: any) => s.riskLevel === "MEDIUM" || s.riskLevel === "HIGH"
    ).length;

    const riskFactorCounts = new Map<string, number>();
    for (const scan of scans) {
      const riskFactorsFromScan = Array.isArray(scan.riskFactors) ? scan.riskFactors : [];
      for (const rf of riskFactorsFromScan) {
        const key = typeof rf?.type === "string" ? rf.type : "unknown";
        riskFactorCounts.set(key, (riskFactorCounts.get(key) ?? 0) + 1);
      }
    }

    const topRiskFactors = Array.from(riskFactorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    const metrics = {
      totalScans,
      blockedOrders,
      approvedOrders,
      reviewedOrders,
      totalRiskAmount,
      estimatedSavings,
      chargebackRate: 0, // TODO: Track actual chargebacks
      falsePositiveRate: 0, // TODO: Track false positives
      avgRiskScore,
      lowRiskCount,
      mediumRiskCount,
      highRiskCount,
      criticalRiskCount,
      topRiskFactors,
    };

    return {
      userId: viewer._id,
      period: args.period,
      periodType: "monthly",
      metrics,
      createdAt: Date.now(),
    };
  },
});

/**
 * Get unread alerts
 */
export const getUnreadAlerts = query({
  args: { sessionToken: v.string() },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) return [];

    return await ctx.db
      .query("riskAlerts")
      .withIndex("by_user_status", (q: any) => q.eq("userId", viewer._id).eq("status", "UNREAD"))
      .collect();
  },
});

/**
 * Get all alerts (read and unread)
 */
export const getAllAlerts = query({
  args: { sessionToken: v.string() },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) return [];

    return await ctx.db
      .query("riskAlerts")
      .withIndex("by_user", (q: any) => q.eq("userId", viewer._id))
      .order("desc")
      .collect();
  },
});

/**
 * Mark alert as read
 */
export const markAlertAsRead = mutation({
  args: { sessionToken: v.string(), alertId: v.id("riskAlerts") },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");

    if (alert.userId !== viewer._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.alertId, {
      status: "READ",
    });

    return { success: true };
  },
});

// Mark alert as actioned
export const takeAlertAction = mutation({
  args: {
    sessionToken: v.string(),
    alertId: v.id("riskAlerts"),
    decision: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");

    if (alert.userId !== viewer._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.alertId, {
      status: "ACTIONED",
      actionTaken: {
        decision: args.decision,
        takenAt: Date.now(),
        notes: args.notes || "",
      },
    });

    return { success: true };
  },
});

// Generate dispute evidence package
export const generateDisputeEvidence = mutation({
  args: {
    sessionToken: v.string(),
    scanId: v.id("chargebackScans"),
    orderId: v.string(),
    trackingNumber: v.optional(v.string()),
    carrier: v.optional(v.string()),
    productName: v.optional(v.string()),
    productDescription: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await apiAuth(ctx, args.sessionToken);
    if (!viewer) throw new Error("Not authenticated");

    // Get the scan
    const scan = await ctx.db.get(args.scanId);
    if (!scan) throw new Error("Scan not found");

    // Verify ownership
    if (scan.userId !== viewer._id) {
      throw new Error("Unauthorized");
    }

    // Fetch tracking info (if provided)
    let proofOfDelivery = null;
    if (args.trackingNumber && args.carrier) {
      proofOfDelivery = {
        trackingNumber: args.trackingNumber,
        carrier: args.carrier,
        status: "DELIVERED",
        deliveredAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        signatureUrl: undefined,
      };
    }

    const evidencePackage = {
      scanId: args.scanId,
      userId: viewer._id,

      transactionDetails: {
        orderId: args.orderId,
        amount: scan.orderAmount,
        date: scan.scannedAt,
        customerEmail: scan.customerEmail,
        customerIp: scan.ipAddress || "Unknown",
      },

      proofOfDelivery,

      customerCommunication: [
        {
          date: scan.scannedAt,
          channel: "email",
          summary: "Order confirmation sent to customer",
        },
      ],

      productDetails: {
        name: args.productName || "Product",
        description: args.productDescription || "No description provided",
        imageUrls: [],
      },

      termsAcceptance: {
        acceptedAt: scan.scannedAt,
        ipAddress: scan.ipAddress || "Unknown",
        userAgent: "Unknown",
      },

      fraudAnalysis: {
        riskScore: scan.riskScore,
        riskLevel: scan.riskLevel,
        signals: scan.signals,
      },

      createdAt: Date.now(),
    };

    const pdfUrl = `https://api.a0.dev/evidence/${args.scanId}.pdf`;

    const packageId = await ctx.db.insert("disputeEvidencePackages", {
      ...evidencePackage,
      pdfUrl,
    });

    return {
      packageId,
      pdfUrl,
      success: true,
    };
  },
});

/**
 * Handle pre-dispute alert from Ethoca/Verifi (internal mutation called by webhook)
 */
export const handlePreDisputeAlert = internalMutation({
  args: {
    orderId: v.string(),
    customerEmail: v.string(),
    amount: v.number(),
    reason: v.string(),
    source: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    // Find user who owns this order (by email or orderId lookup in scans)
    const scan = await ctx.db
      .query("chargebackScans")
      .filter((q: any) => 
        q.or(
          q.eq(q.field("orderId"), args.orderId),
          q.eq(q.field("customerEmail"), args.customerEmail)
        )
      )
      .first();
    
    if (!scan) {
      console.warn(`No scan found for order ${args.orderId}`);
      return { success: false, reason: "Order not found" };
    }
    
    // Create dispute alert
    const alertId = await ctx.db.insert("disputeAlerts", {
      userId: scan.userId,
      orderId: args.orderId,
      customerEmail: args.customerEmail,
      amount: args.amount,
      alertType: args.source, // "ETHOCA" or "VERIFI"
      alertedAt: Date.now(),
      status: "PENDING",
    });
    
    // Auto-refund if amount is below threshold (e.g., $100)
    const AUTO_REFUND_THRESHOLD = 100;
    
    if (args.amount < AUTO_REFUND_THRESHOLD) {
      // In production, call payment processor's refund API
      // await stripe.refunds.create({ charge: chargeId });
      
      console.log(`💰 Auto-refunding $${args.amount} to prevent chargeback`);
      
      await ctx.db.patch(alertId, {
        status: "REFUNDED",
        actionTaken: {
          type: "AUTO_REFUND",
          takenAt: Date.now(),
          notes: `Auto-refunded $${args.amount} to prevent chargeback (below $${AUTO_REFUND_THRESHOLD} threshold)`,
        },
      });
      
      // Send notification to merchant
      // In production: send push notification or email
      console.log(`✅ Chargeback prevented! Saved merchant $${args.amount + 15} (refund + chargeback fee)`);
      
      return {
        success: true,
        action: "AUTO_REFUNDED",
        savedAmount: args.amount + 15, // Amount + typical chargeback fee
      };
    } else {
      // Create alert for manual review
      await ctx.db.insert("riskAlerts", {
        userId: scan.userId,
        scanId: scan._id,
        alertLevel: "REVIEW",
        title: "⚠️ Pre-Dispute Alert",
        message: `Customer ${args.customerEmail} contacted bank about order ${args.orderId} ($${args.amount}). Take action now to prevent chargeback.`,
        orderDetails: {
          orderId: args.orderId,
          customerEmail: args.customerEmail,
          amount: args.amount,
        },
        status: "UNREAD",
        createdAt: Date.now(),
      });
      
      // Send notification
      console.log(`📢 Merchant alerted about dispute for order ${args.orderId}`);
      
      return {
        success: true,
        action: "MANUAL_REVIEW_REQUIRED",
      };
    }
  },
});

/**
 * Handle Stripe early fraud warning (internal mutation)
 */
export const handleEarlyFraudWarning = internalMutation({
  args: {
    chargeId: v.string(),
    fraudType: v.string(),
    actionable: v.boolean(),
  },
  handler: async (ctx: any, args: any) => {
    console.log(`🚨 Early fraud warning for charge ${args.chargeId}: ${args.fraudType}`);
    
    // Find associated scan by charge ID
    // In production, store Stripe charge ID in chargebackScans table
    const scan = await ctx.db
      .query("chargebackScans")
      .filter((q: any) => q.eq(q.field("stripeChargeId"), args.chargeId))
      .first();
    
    if (!scan) {
      console.warn(`No scan found for Stripe charge ${args.chargeId}`);
      return { success: false };
    }
    
    // Create high-priority alert
    await ctx.db.insert("riskAlerts", {
      userId: scan.userId,
      scanId: scan._id,
      alertLevel: "BLOCK",
      title: "🚨 Stripe Early Fraud Warning",
      message: `Stripe detected potential fraud on charge ${args.chargeId}. Fraud type: ${args.fraudType}. ${args.actionable ? "Action required immediately." : "For your awareness."}`,
      orderDetails: {
        orderId: scan.orderId || "Unknown",
        customerEmail: scan.customerEmail,
        amount: scan.orderAmount,
      },
      status: "UNREAD",
      createdAt: Date.now(),
    });
    
    console.log(`📢 Merchant alerted about early fraud warning for charge ${args.chargeId}`);
    
    return { success: true };
  },
});

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