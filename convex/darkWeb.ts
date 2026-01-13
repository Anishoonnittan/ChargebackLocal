import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";

/**
 * Dark Web Monitoring - Check if email/phone has been compromised
 * Uses haveibeenpwned.com API (free tier)
 */

// Check if email is in known breaches
export const checkEmailBreach = action({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    try {
      // haveibeenpwned.com API (free tier available)
      const response = await fetch(
        `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
        {
          headers: {
            "User-Agent": "ScamVigil-App", // Required by API
          }
        }
      );

      if (response.status === 404) {
        return { 
          isBreach: false,
          breachCount: 0,
          breaches: [],
          message: "✅ Good news - not found in known breaches" 
        };
      }

      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a few minutes.");
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const breaches = await response.json();
      
      return {
        isBreach: true,
        breachCount: breaches.length,
        breaches: breaches.map((b: any) => ({
          name: b.Name,
          title: b.Title,
          domain: b.Domain,
          breachDate: b.BreachDate,
          dataClasses: b.DataClasses, // What was stolen (Passwords, Emails, etc.)
          description: b.Description,
          isVerified: b.IsVerified,
          isSensitive: b.IsSensitive,
          logoPath: b.LogoPath,
        })),
        recommendation: "🔐 Change passwords immediately on affected sites",
      };
    } catch (error: any) {
      console.error("Dark web check error:", error);
      throw new Error(error.message || "Failed to check dark web");
    }
  }
});

// Start monitoring an email
export const startMonitoring = mutation({
  args: { 
    email: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, { email, phone }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    // Check if already monitoring this email
    const existing = await ctx.db
      .query("darkWebMonitors")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (existing) {
      return {
        monitorId: existing._id,
        message: "Already monitoring this email",
        existing: true,
      };
    }
    
    // Create monitoring record (breaches will be fetched separately)
    const monitorId = await ctx.db.insert("darkWebMonitors", {
      userId: identity.subject as any,
      email,
      phone: phone || undefined,
      isActive: true,
      breachesFound: [],
      breachCount: 0,
      lastChecked: null,
      nextCheckAt: Date.now() + 24 * 60 * 60 * 1000, // Check again in 24 hours
      createdAt: Date.now(),
    });
    
    return {
      monitorId,
      message: "Monitoring started",
      existing: false,
    };
  }
});

// Update monitoring record with breach data
export const updateMonitorBreaches = mutation({
  args: {
    monitorId: v.id("darkWebMonitors"),
    breaches: v.array(v.object({
      name: v.string(),
      title: v.string(),
      breachDate: v.string(),
      dataClasses: v.array(v.string()),
      description: v.optional(v.string()),
      logoPath: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { monitorId, breaches }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const monitor = await ctx.db.get(monitorId);
    if (!monitor || monitor.userId !== identity.subject) {
      throw new Error("Monitor not found");
    }
    
    await ctx.db.patch(monitorId, {
      breachesFound: breaches,
      breachCount: breaches.length,
      lastChecked: Date.now(),
      nextCheckAt: Date.now() + 24 * 60 * 60 * 1000, // Check again in 24 hours
    });
    
    // Create alerts for new breaches (if any new ones found)
    const existingBreachNames = monitor.breachesFound.map(b => b.name);
    const newBreaches = breaches.filter(b => !existingBreachNames.includes(b.name));
    
    for (const breach of newBreaches) {
      await ctx.db.insert("darkWebAlerts", {
        userId: identity.subject as any,
        monitorId,
        breachName: breach.name,
        breachDate: breach.breachDate,
        dataExposed: breach.dataClasses,
        severity: breach.dataClasses.includes("Passwords") ? "critical" : 
                  breach.dataClasses.includes("Credit cards") ? "high" :
                  breach.dataClasses.includes("Email addresses") ? "medium" : "low",
        recommendation: `Change your password on ${breach.name} immediately and enable 2FA if available.`,
        read: false,
        dismissed: false,
        createdAt: Date.now(),
      });
    }
    
    return {
      breachCount: breaches.length,
      newBreachesCount: newBreaches.length,
    };
  }
});

// Get user's dark web monitoring status
export const getDarkWebStatus = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    const monitor = await ctx.db
      .query("darkWebMonitors")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject as any))
      .order("desc")
      .first();
    
    if (!monitor) return null;
    
    // Get unread alerts
    const unreadAlerts = await ctx.db
      .query("darkWebAlerts")
      .withIndex("by_user_unread", (q) => 
        q.eq("userId", identity.subject as any).eq("read", false)
      )
      .collect();
    
    return {
      monitorId: monitor._id,
      email: monitor.email,
      phone: monitor.phone,
      isActive: monitor.isActive,
      breachesFound: monitor.breachesFound,
      breachCount: monitor.breachCount,
      lastChecked: monitor.lastChecked,
      nextCheckAt: monitor.nextCheckAt,
      unreadAlertsCount: unreadAlerts.length,
      createdAt: monitor.createdAt,
    };
  }
});

// Get all dark web alerts for user
export const getDarkWebAlerts = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    return await ctx.db
      .query("darkWebAlerts")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject as any))
      .order("desc")
      .take(50);
  }
});

// Mark alert as read
export const markAlertRead = mutation({
  args: { alertId: v.id("darkWebAlerts") },
  handler: async (ctx, { alertId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const alert = await ctx.db.get(alertId);
    if (!alert || alert.userId !== identity.subject) {
      throw new Error("Alert not found");
    }
    
    await ctx.db.patch(alertId, { read: true });
  }
});

// Stop monitoring
export const stopMonitoring = mutation({
  args: { monitorId: v.id("darkWebMonitors") },
  handler: async (ctx, { monitorId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const monitor = await ctx.db.get(monitorId);
    if (!monitor || monitor.userId !== identity.subject) {
      throw new Error("Monitor not found");
    }
    
    await ctx.db.patch(monitorId, { isActive: false });
    return { success: true };
  }
});

// Manually trigger a check
export const triggerCheck = action({
  args: { monitorId: v.id("darkWebMonitors") },
  handler: async (ctx, { monitorId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    // Get monitor record
    const monitor = await ctx.runQuery(async (ctx) => {
      return await ctx.db.get(monitorId);
    });
    
    if (!monitor || monitor.userId !== identity.subject) {
      throw new Error("Monitor not found");
    }
    
    // Check email against haveibeenpwned
    const result = await checkEmailBreach(ctx, { email: monitor.email });
    
    // Update monitor record
    await ctx.runMutation(async (ctx) => {
      return await updateMonitorBreaches(ctx, {
        monitorId,
        breaches: result.isBreach ? result.breaches : [],
      });
    });
    
    return result;
  }
});