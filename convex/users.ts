import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * TrueProfile Pro - User Management Functions
 */

// Get the current authenticated user with all profile data
export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      // _creationTime is a Convex system field; we don't need it client-side.
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
      userPurpose: v.optional(v.string()),
      businessName: v.optional(v.string()),
      onboardingCompleted: v.optional(v.boolean()),
      isCharity: v.optional(v.boolean()),
      accountType: v.optional(v.string()), // "personal" | "business" | "charity" | "community"
      totalScans: v.optional(v.number()),
      realProfiles: v.optional(v.number()),
      suspiciousProfiles: v.optional(v.number()),
      estimatedSavings: v.optional(v.number()),
      role: v.string(), // "user", "admin", or "superadmin"
    }),
    v.null()
  ),
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      userPurpose: user.userPurpose,
      businessName: user.businessName,
      onboardingCompleted: user.onboardingCompleted,
      isCharity: user.isCharity,
      accountType: user.accountType,
      totalScans: user.totalScans,
      realProfiles: user.realProfiles,
      suspiciousProfiles: user.suspiciousProfiles,
      estimatedSavings: user.estimatedSavings,
      role: user.role ?? "user", // Default to "user" if not set
    };
  },
});

// Complete user onboarding
export const completeOnboarding = mutation({
  args: {
    userPurpose: v.string(),
    businessName: v.optional(v.string()),
    isCharity: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    await ctx.db.patch(userId, {
      userPurpose: args.userPurpose,
      businessName: args.businessName,
      isCharity: args.isCharity ?? false,
      onboardingCompleted: true,
      totalScans: 0,
      realProfiles: 0,
      suspiciousProfiles: 0,
      estimatedSavings: 0,
    });
    
    return null;
  },
});

// Session-token variant used by the custom mobile auth flow.
// This avoids relying on ctx.auth (OIDC), which is not configured for this project.
export const completeOnboardingForSession = mutation({
  args: {
    sessionToken: v.string(),
    userPurpose: v.string(),
    businessName: v.optional(v.string()),
    isCharity: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (
    ctx: any,
    args: {
      sessionToken: string;
      userPurpose: string;
      businessName?: string;
      isCharity?: boolean;
    }
  ) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.sessionToken))
      .first();

    if (!session) {
      throw new Error("Not authenticated");
    }

    if (session.expiresAt < Date.now()) {
      await ctx.db.delete(session._id);
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(session.userId, {
      userPurpose: args.userPurpose,
      businessName: args.businessName,
      isCharity: args.isCharity ?? false,
      onboardingCompleted: true,
      totalScans: 0,
      realProfiles: 0,
      suspiciousProfiles: 0,
      estimatedSavings: 0,
    });

    return null;
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    businessName: v.optional(v.string()),
    isCharity: v.optional(v.boolean()),
    accountType: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(userId, args);
    return null;
  },
});

// Session-token variant used by the custom mobile auth flow.
// This avoids relying on ctx.auth (OIDC), which is not configured for this project.
export const updateProfileForSession = mutation({
  args: {
    sessionToken: v.string(),
    name: v.optional(v.string()),
    businessName: v.optional(v.string()),
    isCharity: v.optional(v.boolean()),
    accountType: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx: any, args: { sessionToken: string; name?: string; businessName?: string; isCharity?: boolean; accountType?: string }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.sessionToken))
      .first();

    if (!session) {
      throw new Error("Not authenticated");
    }

    if (session.expiresAt < Date.now()) {
      await ctx.db.delete(session._id);
      throw new Error("Not authenticated");
    }

    const { sessionToken, ...updateData } = args;
    await ctx.db.patch(session.userId, updateData);
    return null;
  },
});

// Generate a signed URL for profile picture upload
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    return await ctx.storage.generateUploadUrl();
  },
});

// Update user profile with uploaded image storage ID
export const updateProfileImage = mutation({
  args: { 
    storageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(userId, { 
      image: args.storageId,
    });
    return null;
  },
});

// Get profile image URL
export const getProfileImageUrl = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user?.image) {
      return null;
    }

    return await ctx.storage.getUrl(user.image as any);
  },
});

// Update account type (personal, business, charity, community)
export const updateAccountType = mutation({
  args: {
    accountType: v.string(), // "personal" | "business" | "charity" | "community"
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Keep the newer `userMode` field aligned with accountType.
    // `business` can map to either B2C or B2B; default to B2C for the consumer app.
    const derivedUserMode =
      args.accountType === "business" ? "business_b2c" : args.accountType;
    
    await ctx.db.patch(userId, {
      accountType: args.accountType,
      userMode: derivedUserMode,
    });
    
    return null;
  },
});

// Session-token variant used by the custom mobile auth flow.
// This avoids relying on ctx.auth (OIDC), which is not configured for this project.
export const updateAccountTypeForSession = mutation({
  args: {
    sessionToken: v.string(),
    accountType: v.string(), // "personal" | "business" | "charity" | "community"
  },
  returns: v.null(),
  handler: async (ctx: any, args: { sessionToken: string; accountType: string }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.sessionToken))
      .first();

    if (!session) {
      throw new Error("Not authenticated");
    }

    if (session.expiresAt < Date.now()) {
      await ctx.db.delete(session._id);
      throw new Error("Not authenticated");
    }

    const derivedUserMode =
      args.accountType === "business" ? "business_b2c" : args.accountType;

    await ctx.db.patch(session.userId, {
      accountType: args.accountType,
      userMode: derivedUserMode,
      onboardingCompleted: true,
    });

    return null;
  },
});

// Session-token variant used by the custom mobile auth flow.
// This powers the new "Mode selection" UI, while keeping `accountType` aligned
// for existing feature gating logic.
export const updateUserModeForSession = mutation({
  args: {
    sessionToken: v.string(),
    userMode: v.union(
      v.literal("personal"),
      v.literal("business_b2c"),
      v.literal("charity"),
      v.literal("community"),
      v.literal("b2b")
    ),
  },
  returns: v.null(),
  handler: async (
    ctx: any,
    args: {
      sessionToken: string;
      userMode: "personal" | "business_b2c" | "charity" | "community" | "b2b";
    }
  ) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.sessionToken))
      .first();

    if (!session) {
      throw new Error("Not authenticated");
    }

    if (session.expiresAt < Date.now()) {
      await ctx.db.delete(session._id);
      throw new Error("Not authenticated");
    }

    const derivedAccountType =
      args.userMode === "business_b2c" || args.userMode === "b2b"
        ? "business"
        : args.userMode;

    await ctx.db.patch(session.userId, {
      userMode: args.userMode,
      accountType: derivedAccountType,
      onboardingCompleted: true, // Mark onboarding as complete
    });

    return null;
  },
});

// Action wrapper for updateUserModeForSession (for mobile app)
export const updateUserMode = action({
  args: {
    sessionToken: v.string(),
    mode: v.union(
      v.literal("personal"),
      v.literal("business_b2c"),
      v.literal("charity"),
      v.literal("community"),
      v.literal("b2b")
    ),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    return await ctx.runMutation(api.users.updateUserModeForSession, {
      sessionToken: args.sessionToken,
      userMode: args.mode,
    });
  },
});

// Get user stats for dashboard
export const getUserStats = query({
  args: {},
  returns: v.object({
    totalScans: v.number(),
    realProfiles: v.number(),
    suspiciousProfiles: v.number(),
    estimatedSavings: v.number(),
    recentScans: v.number(),
  }),
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return {
        totalScans: 0,
        realProfiles: 0,
        suspiciousProfiles: 0,
        estimatedSavings: 0,
        recentScans: 0,
      };
    }
    
    const user = await ctx.db.get(userId);
    
    // Count recent scans (last 7 days)
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentScans = await ctx.db
      .query("scans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    
    const recentCount = recentScans.filter((s: any) => s.scannedAt > oneWeekAgo).length;
    
    return {
      totalScans: user?.totalScans ?? 0,
      realProfiles: user?.realProfiles ?? 0,
      suspiciousProfiles: user?.suspiciousProfiles ?? 0,
      estimatedSavings: user?.estimatedSavings ?? 0,
      recentScans: recentCount,
    };
  },
});

// Get user subscription status and limits
export const getSubscriptionStatus = query({
  args: {},
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const tier = user.subscriptionTier || "free";
    const scansThisMonth = user.scansThisMonth || 0;
    
    // Define tier limits
    const tierLimits: Record<string, number> = {
      free: 5,
      basic: 50,
      pro: 300,
      business: 2000,
      enterprise: 999999,
    };
    
    const scanLimit = tierLimits[tier] || 5;
    const scansRemaining = Math.max(0, scanLimit - scansThisMonth);
    const percentUsed = (scansThisMonth / scanLimit) * 100;
    
    return {
      tier,
      status: user.subscriptionStatus || "active",
      scansThisMonth,
      scanLimit,
      scansRemaining,
      percentUsed,
      needsUpgrade: scansRemaining === 0,
    };
  },
});

// Check if user can perform a scan (has quota remaining)
export const canPerformScan = query({
  args: {},
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return { canScan: false, reason: "Not authenticated" };

    const user = await ctx.db.get(userId);
    if (!user) return { canScan: false, reason: "User not found" };

    const tier = user.subscriptionTier || "free";
    const scansThisMonth = user.scansThisMonth || 0;
    
    const tierLimits: Record<string, number> = {
      free: 5,
      basic: 50,
      pro: 300,
      business: 2000,
      enterprise: 999999,
    };
    
    const scanLimit = tierLimits[tier] || 5;
    const canScan = scansThisMonth < scanLimit;
    
    return {
      canScan,
      reason: canScan ? "OK" : `Scan limit reached (${scanLimit}/month on ${tier} plan)`,
      scansRemaining: Math.max(0, scanLimit - scansThisMonth),
      tier,
    };
  },
});

// Increment scan count (call this after each scan)
export const incrementScanCount = mutation({
  args: {},
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const scansThisMonth = (user.scansThisMonth || 0) + 1;
    
    await ctx.db.patch(userId, {
      scansThisMonth,
    });
    
    return { scansThisMonth };
  },
});

// Upgrade subscription tier (mock for now, integrate Stripe later)
export const upgradeTier = mutation({
  args: {
    tier: v.string(), // "basic" | "pro" | "business"
    billingCycle: v.string(), // "monthly" | "annual"
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const tierLimits: Record<string, number> = {
      free: 5,
      basic: 50,
      pro: 300,
      business: 2000,
      enterprise: 999999,
    };
    
    const scanLimit = tierLimits[args.tier] || 5;
    const now = Date.now();
    const endsAt = args.billingCycle === "annual" 
      ? now + (365 * 24 * 60 * 60 * 1000) 
      : now + (30 * 24 * 60 * 60 * 1000);

    await ctx.db.patch(userId, {
      subscriptionTier: args.tier,
      subscriptionStatus: "active",
      scanLimit,
      scansThisMonth: 0, // Reset on upgrade
      subscriptionStartedAt: now,
      subscriptionEndsAt: endsAt,
    });

    return {
      success: true,
      tier: args.tier,
      scanLimit,
      message: `Upgraded to ${args.tier} plan! You now have ${scanLimit} scans per month.`,
    };
  },
});

/**
 * Check if the current user is an admin
 * Used to gate access to the Admin Panel
 */
export const isCurrentUserAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx: any): Promise<boolean> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return false;

    const user = await ctx.db.get(userId);
    if (!user) return false;

    return user.role === "admin" || user.role === "superadmin";
  },
});

/**
 * Make a user an admin (only admins can call this in practice)
 * Accessible only to admins for security
 */
export const makeUserAdmin = mutation({
  args: { userId: v.id("users") },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx: any, args: any) => {
    const currentUserId = await auth.getUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "superadmin")) {
      throw new Error("Unauthorized: Only admins can grant admin role");
    }

    await ctx.db.patch(args.userId, { role: "admin" });
    return { success: true };
  },
});

/**
 * Internal: Initialize first user as admin
 * Called automatically on first signup
 */
export const initializeFirstUserAsAdmin = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx: any, args: any) => {
    const totalUsers = await ctx.db.query("users").collect();
    if (totalUsers.length === 1) {
      // This is the first user; make them admin
      await ctx.db.patch(args.userId, { role: "admin" });
    }
  },
});

// Allow recovering admin access if the system has no admin (safe bootstrap for Model A)
export const bootstrapAdminIfNeeded = mutation({
  args: {},
  returns: v.object({ becameAdmin: v.boolean() }),
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const me = await ctx.db.get(userId);
    if (!me) throw new Error("User profile not found");

    const myRole = me.role ?? "user";
    if (myRole === "admin" || myRole === "superadmin") {
      return { becameAdmin: false };
    }

    // Is there already an admin? If yes, do nothing.
    const existingAdmins = await ctx.db
      .query("users")
      .filter((q: any) =>
        q.or(
          q.eq(q.field("role"), "admin"),
          q.eq(q.field("role"), "superadmin")
        )
      )
      .take(1);

    if (existingAdmins.length > 0) {
      return { becameAdmin: false };
    }

    // No admins exist; allow this user to become admin (owner recovery).
    await ctx.db.patch(userId, { role: "admin" });
    return { becameAdmin: true };
  },
});

/**
 * Grant admin access to a user by email
 * Use this to manually promote users to admin role
 */
export const grantAdminByEmail = mutation({
  args: { email: v.string() },
  returns: v.object({ 
    success: v.boolean(), 
    message: v.string() 
  }),
  handler: async (ctx: any, args: any) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", normalizedEmail))
      .first();
    
    if (!user) {
      return { 
        success: false, 
        message: `No user found with email: ${normalizedEmail}` 
      };
    }
    
    // Update role to admin
    await ctx.db.patch(user._id, { role: "admin" });
    
    return { 
      success: true, 
      message: `Admin access granted to ${normalizedEmail}` 
    };
  },
});

/**
 * Export all user data (GDPR compliance)
 * Returns all data associated with the user for download
 */
export const exportUserData = query({
  args: {},
  returns: v.object({
    user: v.any(),
    scans: v.array(v.any()),
    watchlist: v.array(v.any()),
    exportedAt: v.string(),
  }),
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Get all user scans
    const scans = await ctx.db
      .query("scans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    // Get all watchlist entries
    const watchlist = await ctx.db
      .query("watchlist")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const { _creationTime: _userCreationTime, ...userWithoutSystemFields } = user as any;

    return {
      user: {
        ...userWithoutSystemFields,
        // Don't export sensitive fields
        emailVerificationToken: undefined,
        passwordHash: undefined,
      },
      scans: scans.map((scan: any) => {
        const { _creationTime: _scanCreationTime, ...scanWithoutSystemFields } = scan;
        return {
          ...scanWithoutSystemFields,
          userId: undefined, // Remove user ID for privacy
        };
      }),
      watchlist: watchlist.map((item: any) => {
        const { _creationTime: _itemCreationTime, ...itemWithoutSystemFields } = item;
        return {
          ...itemWithoutSystemFields,
          userId: undefined,
        };
      }),
      exportedAt: new Date().toISOString(),
    };
  },
});

// Session-token variant used by the custom mobile auth flow.
// This avoids relying on ctx.auth (OIDC), which is not configured for this project.
export const exportUserDataForSession = query({
  args: {
    sessionToken: v.string(),
  },
  returns: v.object({
    user: v.any(),
    scans: v.array(v.any()),
    watchlist: v.array(v.any()),
    exportedAt: v.string(),
  }),
  handler: async (ctx: any, args: { sessionToken: string }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.sessionToken))
      .first();

    if (!session) {
      throw new Error("Not authenticated");
    }

    if (session.expiresAt < Date.now()) {
      await ctx.db.delete(session._id);
      throw new Error("Not authenticated");
    }

    const userId = session.userId;
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Get all user scans
    const scans = await ctx.db
      .query("scans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    // Get all watchlist entries
    const watchlist = await ctx.db
      .query("watchlist")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const { _creationTime: _userCreationTime, ...userWithoutSystemFields } = user as any;

    return {
      user: {
        ...userWithoutSystemFields,
        // Don't export sensitive fields
        emailVerificationToken: undefined,
        passwordHash: undefined,
      },
      scans: scans.map((scan: any) => {
        const { _creationTime: _scanCreationTime, ...scanWithoutSystemFields } = scan;
        return {
          ...scanWithoutSystemFields,
          userId: undefined, // Remove user ID for privacy
        };
      }),
      watchlist: watchlist.map((item: any) => {
        const { _creationTime: _itemCreationTime, ...itemWithoutSystemFields } = item;
        return {
          ...itemWithoutSystemFields,
          userId: undefined,
        };
      }),
      exportedAt: new Date().toISOString(),
    };
  },
});

/**
 * Delete user account (soft delete)
 * Marks account as deleted and anonymizes data
 */
export const deleteAccount = mutation({
  args: {
    confirmationText: v.string(), // User must type "DELETE" to confirm
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify confirmation
    if (args.confirmationText !== "DELETE") {
      return {
        success: false,
        message: 'Please type "DELETE" to confirm account deletion',
      };
    }

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Soft delete: anonymize user data instead of hard delete
    await ctx.db.patch(userId, {
      name: "[Deleted User]",
      email: `deleted_${Date.now()}@scamshield.pro`,
      image: undefined,
      businessName: undefined,
      userPurpose: undefined,
      isCharity: false,
      accountType: "personal",
      userMode: "personal",
      role: "user",
      subscriptionStatus: "cancelled",
      deletedAt: Date.now(),
    });

    // Note: In production, you'd also:
    // 1. Cancel active subscriptions
    // 2. Delete uploaded files from storage
    // 3. Anonymize scan history
    // 4. Remove from watchlists
    // This is a simplified version for MVP

    return {
      success: true,
      message: "Account successfully deleted",
    };
  },
});

/**
 * Get user by email (internal only - for webhook processing)
 */
export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    return user;
  },
});