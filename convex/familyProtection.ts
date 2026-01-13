import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ==========================================
// FAMILY PROTECTION MODE
// ==========================================
// Protect elderly family members from scams
// Adult children act as "guardians" who receive alerts
// ==========================================

// Create or update family protection for a user
export const enableFamilyProtection = mutation({
  args: {
    userId: v.id("users"),
    protectionLevel: v.union(
      v.literal("all_scans"),
      v.literal("high_risk_only"),
      v.literal("custom")
    ),
    autoScanMessages: v.boolean(),
    autoScanCalls: v.boolean(),
    autoScanInvestments: v.boolean(),
    notifyGuardiansOn: v.array(
      v.union(
        v.literal("suspicious"),
        v.literal("high_risk"),
        v.literal("scam")
      )
    ),
  },
  handler: async (ctx, args) => {
    // Check if protection already exists
    const existing = await ctx.db
      .query("familyProtection")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const data = {
      userId: args.userId,
      isEnabled: true,
      protectionLevel: args.protectionLevel,
      autoScanMessages: args.autoScanMessages,
      autoScanCalls: args.autoScanCalls,
      autoScanInvestments: args.autoScanInvestments,
      notifyGuardiansOn: args.notifyGuardiansOn,
      guardianUserIds: existing?.guardianUserIds || [],
      totalScansPerformed: existing?.totalScansPerformed || 0,
      totalThreatsBlocked: existing?.totalThreatsBlocked || 0,
      lastScanAt: existing?.lastScanAt || undefined,
      enabledAt: existing?.enabledAt || Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("familyProtection", data);
    }
  },
});

// Add a guardian to family protection
export const addGuardian = mutation({
  args: {
    protectedUserId: v.id("users"),
    guardianEmail: v.string(),
    guardianPhone: v.optional(v.string()),
    guardianName: v.string(),
    relationshipType: v.union(
      v.literal("child"),
      v.literal("parent"),
      v.literal("sibling"),
      v.literal("spouse"),
      v.literal("friend"),
      v.literal("other")
    ),
    canViewScans: v.boolean(),
    canBlockThreats: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Get family protection record
    const protection = await ctx.db
      .query("familyProtection")
      .withIndex("by_user", (q) => q.eq("userId", args.protectedUserId))
      .first();

    if (!protection) {
      throw new Error("Family protection not enabled for this user");
    }

    // Check if guardian user exists
    const guardianUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.guardianEmail))
      .first();

    const guardianData = {
      protectedUserId: args.protectedUserId,
      guardianUserId: guardianUser?._id,
      guardianEmail: args.guardianEmail,
      guardianPhone: args.guardianPhone,
      guardianName: args.guardianName,
      relationshipType: args.relationshipType,
      invitationStatus: guardianUser ? "accepted" : "pending" as const,
      canViewScans: args.canViewScans,
      canBlockThreats: args.canBlockThreats,
      totalAlertsReceived: 0,
      totalThreatsBlocked: 0,
      invitedAt: Date.now(),
      acceptedAt: guardianUser ? Date.now() : undefined,
      lastAlertAt: undefined,
    };

    const guardianId = await ctx.db.insert("guardianAlerts", guardianData);

    // Update family protection with guardian user ID
    if (guardianUser) {
      await ctx.db.patch(protection._id, {
        guardianUserIds: [...protection.guardianUserIds, guardianUser._id],
      });
    }

    return guardianId;
  },
});

// Remove a guardian
export const removeGuardian = mutation({
  args: {
    guardianId: v.id("guardianAlerts"),
  },
  handler: async (ctx, args) => {
    const guardian = await ctx.db.get(args.guardianId);
    if (!guardian) {
      throw new Error("Guardian not found");
    }

    // Update family protection record
    if (guardian.guardianUserId) {
      const protection = await ctx.db
        .query("familyProtection")
        .withIndex("by_user", (q) => q.eq("userId", guardian.protectedUserId))
        .first();

      if (protection) {
        await ctx.db.patch(protection._id, {
          guardianUserIds: protection.guardianUserIds.filter(
            (id) => id !== guardian.guardianUserId
          ),
        });
      }
    }

    await ctx.db.delete(args.guardianId);
    return { success: true };
  },
});

// Get family protection settings
export const getFamilyProtection = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const protection = await ctx.db
      .query("familyProtection")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!protection) {
      return null;
    }

    // Get all guardians
    const guardians = await ctx.db
      .query("guardianAlerts")
      .withIndex("by_protected_user", (q) =>
        q.eq("protectedUserId", args.userId)
      )
      .collect();

    return {
      ...protection,
      guardians,
    };
  },
});

// Get guardians for a protected user
export const getGuardians = query({
  args: {
    protectedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guardianAlerts")
      .withIndex("by_protected_user", (q) =>
        q.eq("protectedUserId", args.protectedUserId)
      )
      .collect();
  },
});

// Send alert to guardians
export const sendGuardianAlert = mutation({
  args: {
    protectedUserId: v.id("users"),
    threatType: v.union(
      v.literal("message"),
      v.literal("call"),
      v.literal("investment"),
      v.literal("payment"),
      v.literal("link")
    ),
    riskLevel: v.union(
      v.literal("suspicious"),
      v.literal("high_risk"),
      v.literal("scam")
    ),
    threatContent: v.string(),
    riskScore: v.number(),
    redFlags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Get family protection settings
    const protection = await ctx.db
      .query("familyProtection")
      .withIndex("by_user", (q) => q.eq("userId", args.protectedUserId))
      .first();

    if (!protection || !protection.isEnabled) {
      return { sent: false, reason: "Protection not enabled" };
    }

    // Check if this risk level should trigger alerts
    if (!protection.notifyGuardiansOn.includes(args.riskLevel)) {
      return { sent: false, reason: "Risk level below threshold" };
    }

    // Get all guardians
    const guardians = await ctx.db
      .query("guardianAlerts")
      .withIndex("by_protected_user", (q) =>
        q.eq("protectedUserId", args.protectedUserId)
      )
      .collect();

    if (guardians.length === 0) {
      return { sent: false, reason: "No guardians configured" };
    }

    // Update each guardian with alert count
    for (const guardian of guardians) {
      await ctx.db.patch(guardian._id, {
        totalAlertsReceived: guardian.totalAlertsReceived + 1,
        lastAlertAt: Date.now(),
      });
    }

    // Update family protection stats
    await ctx.db.patch(protection._id, {
      totalScansPerformed: protection.totalScansPerformed + 1,
      totalThreatsBlocked:
        args.riskLevel === "scam" || args.riskLevel === "high_risk"
          ? protection.totalThreatsBlocked + 1
          : protection.totalThreatsBlocked,
      lastScanAt: Date.now(),
    });

    // In a real app, send push notifications or emails here
    // For now, we log the alert
    console.log(`🚨 Guardian alert sent for ${args.threatType} scam`);

    return {
      sent: true,
      guardiansNotified: guardians.length,
      message: `Alert sent to ${guardians.length} guardian(s)`,
    };
  },
});

// Get guardian alerts for a guardian user
export const getMyProtectedUsers = query({
  args: {
    guardianUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const guardianRecords = await ctx.db
      .query("guardianAlerts")
      .withIndex("by_guardian_user", (q) =>
        q.eq("guardianUserId", args.guardianUserId)
      )
      .collect();

    // Get details for each protected user
    const protectedUsers = await Promise.all(
      guardianRecords.map(async (record) => {
        const user = await ctx.db.get(record.protectedUserId);
        const protection = await ctx.db
          .query("familyProtection")
          .withIndex("by_user", (q) => q.eq("userId", record.protectedUserId))
          .first();

        return {
          ...record,
          protectedUserName: user?.name || "Unknown",
          protectedUserEmail: user?.email || "",
          protectionEnabled: protection?.isEnabled || false,
          totalThreatsBlocked: protection?.totalThreatsBlocked || 0,
          lastScanAt: protection?.lastScanAt,
        };
      })
    );

    return protectedUsers;
  },
});

// Disable family protection
export const disableFamilyProtection = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const protection = await ctx.db
      .query("familyProtection")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!protection) {
      throw new Error("Family protection not found");
    }

    await ctx.db.patch(protection._id, {
      isEnabled: false,
      disabledAt: Date.now(),
    });

    return { success: true };
  },
});

// Get family protection stats
export const getFamilyProtectionStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const protection = await ctx.db
      .query("familyProtection")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!protection) {
      return null;
    }

    const guardians = await ctx.db
      .query("guardianAlerts")
      .withIndex("by_protected_user", (q) =>
        q.eq("protectedUserId", args.userId)
      )
      .collect();

    return {
      isEnabled: protection.isEnabled,
      totalScansPerformed: protection.totalScansPerformed,
      totalThreatsBlocked: protection.totalThreatsBlocked,
      totalGuardians: guardians.length,
      activeGuardians: guardians.filter((g) => g.invitationStatus === "accepted")
        .length,
      lastScanAt: protection.lastScanAt,
      enabledAt: protection.enabledAt,
    };
  },
});