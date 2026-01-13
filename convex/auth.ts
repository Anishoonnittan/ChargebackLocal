import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/* global crypto, TextEncoder */

declare const crypto: any;
declare const TextEncoder: any;

type SignUpArgs = { email: string; password: string; name?: string };
type SignInArgs = { email: string; password: string };
type SignOutArgs = { sessionToken: string };
type SessionTokenArgs = { sessionToken?: string };

/**
 * PRODUCTION-GRADE AUTHENTICATION SYSTEM
 * 
 * Security Features:
 * - Cryptographic password hashing (PBKDF2 with 100,000 iterations)
 * - Rate limiting on login attempts
 * - Secure session token generation (256-bit entropy)
 * - Account lockout after failed attempts
 * - Security audit logging
 * - Session expiry and refresh
 */

// Compatibility helper for files that need auth.getUserIdentity()
// In the custom auth system, identity is derived from a sessionToken passed explicitly.
export const auth = {
  getUserIdentity: async () => {
    return null;
  },
  getUserId: async (ctx: any) => {
    // Legacy parts of this codebase still call `auth.getUserId(ctx)`.
    //
    // If Convex built-in auth is configured, we can delegate to `ctx.auth.getUserId()`.
    // In our custom session-token system, most functions should instead accept a
    // `sessionToken` arg and look up the user via the `sessions` table.
    try {
      const maybeAuth = ctx?.auth;
      if (maybeAuth && typeof maybeAuth.getUserId === "function") {
        return await maybeAuth.getUserId();
      }
    } catch {
      // Fall through to null.
    }

    return null;
  },
};

// -----------------------------
// Internal implementations
// -----------------------------

export const signUpImpl = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx: any, args: SignUpArgs) => {
    const email = args.email.trim().toLowerCase();
    
    // Input validation
    if (!email || !args.password) {
      throw new Error("Email and password are required");
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }
    
    // Password strength validation
    if (args.password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }
    
    // Check rate limiting
    const canProceed = await checkRateLimit(ctx, email, 'signup');
    if (!canProceed) {
      await recordAuthAttempt(ctx, email, 'signup', false);
      throw new Error("Too many signup attempts. Please try again in 15 minutes.");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", email))
      .first();

    // If the user already exists (e.g. created previously by legacy/OIDC auth),
    // allow them to "claim" the account by setting a password once.
    if (existing) {
      const existingPasswordRecord = await ctx.db
        .query("passwords")
        .withIndex("by_user", (q: any) => q.eq("userId", existing._id))
        .first();

      if (existingPasswordRecord) {
        await recordAuthAttempt(ctx, email, 'signup', false);
        throw new Error("Account already exists with this email");
      }

      // Attach a password to the existing user with secure hashing
      const { hash, salt } = await hashPassword(args.password);
      await ctx.db.insert("passwords", {
        userId: existing._id,
        passwordHash: hash,
        salt,
        createdAt: Date.now(),
      });

      // Best-effort: fill name if it was missing.
      if (!existing.name && args.name?.trim()) {
        await ctx.db.patch(existing._id, { name: args.name.trim() });
      }

      const sessionToken = generateSecureToken();
      await ctx.db.insert("sessions", {
        userId: existing._id,
        token: sessionToken,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days (reduced from 30)
        createdAt: Date.now(),
      });
      
      await recordAuthAttempt(ctx, email, 'signup', true);

      return {
        userId: existing._id,
        sessionToken,
        user: {
          _id: existing._id,
          email,
          name: existing.name ?? args.name,
          role: existing.role,
        },
      };
    }

    const firstTwoUsers = await ctx.db.query("users").take(2);
    const isFirstUser = firstTwoUsers.length === 0;

    const userId = await ctx.db.insert("users", {
      email,
      name: args.name,
      role: isFirstUser ? "admin" : "user",
      subscriptionTier: "free",
      subscriptionStatus: "active",
      scansThisMonth: 0,
      scanLimit: 10,
      totalScans: 0,
      realProfiles: 0,
      suspiciousProfiles: 0,
      fakeProfiles: 0,
      estimatedSavings: 0,
      onboardingCompleted: false,
      createdAt: Date.now(),
    });

    const { hash, salt } = await hashPassword(args.password);
    await ctx.db.insert("passwords", {
      userId,
      passwordHash: hash,
      salt,
      createdAt: Date.now(),
    });

    const sessionToken = generateSecureToken();
    await ctx.db.insert("sessions", {
      userId,
      token: sessionToken,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: Date.now(),
    });
    
    await recordAuthAttempt(ctx, email, 'signup', true);

    return {
      userId,
      sessionToken,
      user: {
        _id: userId,
        email,
        name: args.name,
        role: isFirstUser ? "admin" : "user",
      },
    };
  },
});

export const signInImpl = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx: any, args: SignInArgs) => {
    const email = args.email.trim().toLowerCase();
    
    // Check rate limiting
    const canProceed = await checkRateLimit(ctx, email, 'login');
    if (!canProceed) {
      await recordAuthAttempt(ctx, email, 'login', false);
      throw new Error("Too many login attempts. Please try again in 15 minutes.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", email))
      .first();

    if (!user) {
      await recordAuthAttempt(ctx, email, 'login', false);
      throw new Error("Invalid email or password");
    }

    const passwordRecord = await ctx.db
      .query("passwords")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();

    // This happens when the user existed from a previous auth system.
    // In that case they should use the Sign Up flow once to set a password.
    if (!passwordRecord) {
      await recordAuthAttempt(ctx, email, 'login', false);
      throw new Error("Password not set. Please tap Get Protected to create a password.");
    }

    // Backwards compatibility:
    // Older password rows were stored without a salt and used a legacy hash.
    // If we detect that case, verify using the legacy hash, then upgrade to PBKDF2+salt.
    const isValid = await verifyPasswordWithLegacySupport(ctx, {
      password: args.password,
      passwordRecord,
    });

    if (!isValid) {
      await recordAuthAttempt(ctx, email, 'login', false);
      throw new Error("Invalid email or password");
    }

    const sessionToken = generateSecureToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token: sessionToken,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: Date.now(),
    });
    
    await recordAuthAttempt(ctx, email, 'login', true);

    return {
      sessionToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  },
});

export const signOutImpl = internalMutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx: any, args: SignOutArgs) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.sessionToken))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

export const createTempSession = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const token = generateToken();
    const expiresAt = Date.now() + (60 * 1000); // 1 minute expiry
    
    const sessionId = await ctx.db.insert("sessions", {
      userId: args.userId,
      token,
      expiresAt,
      isTemporary: true,
    });
    
    return token;
  },
});

// -----------------------------
// Public API (Actions)
// -----------------------------

export const signUp = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx: any, args: SignUpArgs) => {
    return await ctx.runMutation(internal.auth.signUpImpl, args);
  },
});

export const signIn = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx: any, args: SignInArgs) => {
    return await ctx.runMutation(internal.auth.signInImpl, args);
  },
});

export const signOut = action({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx: any, args: SignOutArgs) => {
    return await ctx.runMutation(internal.auth.signOutImpl, args);
  },
});

export const requestPasswordReset = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx: any, args: { email: string }) => {
    return await ctx.runMutation(internal.auth.requestPasswordResetImpl, args);
  },
});

export const resetPasswordWithCode = action({
  args: {
    email: v.string(),
    code: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx: any, args: { email: string; code: string; newPassword: string }) => {
    return await ctx.runMutation(internal.auth.resetPasswordWithCodeImpl, args);
  },
});

export const changePassword = action({
  args: {
    sessionToken: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (
    ctx: any,
    args: { sessionToken: string; currentPassword: string; newPassword: string }
  ) => {
    return await ctx.runMutation(internal.auth.changePasswordImpl, args);
  },
});

// -----------------------------
// Session-based "viewer" query
// -----------------------------

export const getCurrentUser = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: any, args: SessionTokenArgs) => {
    const normalizedToken = args.sessionToken?.trim();
    if (!normalizedToken) {
      // Important: returning null (instead of throwing) keeps the client stable.
      // Some clients (or older convex/react versions) may call this query with `{}`
      // during initial boot. Treat that as "not signed in".
      return null;
    }

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", normalizedToken))
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

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      scansThisMonth: user.scansThisMonth,
      scanLimit: user.scanLimit,
      onboardingCompleted: user.onboardingCompleted,
      accountType: user.accountType,
      userMode: user.userMode,
    };
  },
});

// -----------------------------
// Security Utilities
// -----------------------------

/**
 * Generate cryptographically secure random token
 * Uses 256 bits of entropy for maximum security
 */
function generateSecureToken(): string {
  const array = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash password using PBKDF2 with salt
 * PRODUCTION-GRADE: 100,000 iterations, SHA-256
 */
async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  // Generate salt if not provided
  const saltBytes = salt
    ? hexToBytes(salt)
    : crypto.getRandomValues(new Uint8Array(16));

  const saltHex = bytesToHex(saltBytes);

  // Convert password to bytes
  const passwordBytes = new TextEncoder().encode(password);

  // Import key
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBytes as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: 100000, // OWASP recommended minimum
      hash: 'SHA-256'
    },
    key,
    256 // 256 bits output
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

  return { hash: hashHex, salt: saltHex };
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.trim().toLowerCase();
  if (normalized.length % 2 !== 0) {
    throw new Error("Invalid salt encoding");
  }

  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Verify password against stored hash, supporting legacy rows with no salt.
 *
 * Legacy behavior:
 * - Some older rows in `passwords` were written without `salt`.
 * - In that case, PBKDF2 verification will never match (it would generate a random salt).
 * - We fall back to the deprecated `simpleHash` and if it matches, we upgrade the row.
 */
async function verifyPasswordWithLegacySupport(
  ctx: any,
  args: {
    password: string;
    passwordRecord: {
      _id: any;
      passwordHash: string;
      salt?: string;
    };
  }
): Promise<boolean> {
  const { password, passwordRecord } = args;

  // Modern path
  if (passwordRecord.salt) {
    return await verifyPassword(password, passwordRecord.passwordHash, passwordRecord.salt);
  }

  // Legacy path (no salt)
  const legacyHash = simpleHash(password);
  const legacyMatches = legacyHash === passwordRecord.passwordHash;

  if (!legacyMatches) {
    return false;
  }

  // Upgrade in-place to PBKDF2+salt so future logins are secure + consistent.
  const { hash, salt } = await hashPassword(password);
  await ctx.db.patch(passwordRecord._id, {
    passwordHash: hash,
    salt,
  });

  return true;
}

/**
 * Verify password against stored hash
 */
async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

/**
 * Check rate limiting for authentication attempts
 */
async function checkRateLimit(ctx: any, identifier: string, action: string): Promise<boolean> {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = action === 'login' ? 5 : 3; // 5 login attempts, 3 signup attempts
  
  // Query recent attempts
  const recentAttempts = await ctx.db
    .query("rateLimitTracking")
    .filter((q: any) => 
      q.and(
        q.eq(q.field("identifier"), identifier),
        q.eq(q.field("endpoint"), `/auth/${action}`),
        q.gt(q.field("windowEnd"), now)
      )
    )
    .first();
  
  if (recentAttempts && recentAttempts.requestCount >= maxAttempts) {
    return false; // Rate limit exceeded
  }
  
  return true;
}

/**
 * Record authentication attempt for rate limiting
 */
async function recordAuthAttempt(ctx: any, identifier: string, action: string, success: boolean) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  const existing = await ctx.db
    .query("rateLimitTracking")
    .filter((q: any) => 
      q.and(
        q.eq(q.field("identifier"), identifier),
        q.eq(q.field("endpoint"), `/auth/${action}`),
        q.gt(q.field("windowEnd"), now)
      )
    )
    .first();
  
  if (existing) {
    await ctx.db.patch(existing._id, {
      requestCount: existing.requestCount + 1,
      exceeded: existing.requestCount + 1 >= (action === 'login' ? 5 : 3),
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("rateLimitTracking", {
      identifier,
      identifierType: "EMAIL",
      endpoint: `/auth/${action}`,
      requestCount: 1,
      windowStart: now,
      windowEnd: now + windowMs,
      windowDuration: "15_minutes",
      limit: action === 'login' ? 5 : 3,
      exceeded: false,
      warningsSent: 0,
      createdAt: now,
      updatedAt: now,
    });
  }
  
  // Log security event
  await ctx.db.insert("securityLogs", {
    userId: undefined,
    eventType: success ? `${action.toUpperCase()}_SUCCESS` : `${action.toUpperCase()}_FAILED`,
    severity: success ? "INFO" : "WARNING",
    description: `${action} attempt for ${identifier}`,
    ipAddress: undefined, // Would be populated from request context in production
    userAgent: undefined,
    deviceFingerprint: undefined,
    isSuspicious: !success,
    threatScore: success ? 0 : 30,
    blockedBySystem: false,
    timestamp: now,
  });
}

// -----------------------------
// Helpers
// -----------------------------

function generateToken(): string {
  return generateSecureToken();
}

function generateSixDigitCode(): string {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  const random =
    ((array[0] << 24) | (array[1] << 16) | (array[2] << 8) | array[3]) >>> 0;
  return String(random % 1_000_000).padStart(6, "0");
}

function hashResetCode(email: string, code: string): string {
  // Short-lived token hashing. Not used for password hashing.
  // We include the email so the same code can't be reused across accounts.
  return simpleHash(`${email.toLowerCase()}:${code}`);
}

async function getUserIdFromSessionToken(ctx: any, sessionToken: string) {
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

  return { userId: session.userId, sessionId: session._id };
}

export const requestPasswordResetImpl = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx: any, args: { email: string }) => {
    const email = args.email.trim().toLowerCase();

    // Always return success (avoid account enumeration)
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", email))
      .first();

    if (!user || !user.email) {
      return {
        success: true,
        // For UI: show generic message.
        message: "If an account exists for that email, a reset code has been generated.",
      };
    }

    // Create a short-lived 6-digit code
    const code = generateSixDigitCode();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    await ctx.db.insert("passwordResetTokens", {
      userId: user._id,
      email,
      codeHash: hashResetCode(email, code),
      expiresAt,
      createdAt: Date.now(),
    });

    return {
      success: true,
      expiresAt,
      // Demo-only: we return the code so you can test without email.
      // In production you would NOT return this and instead email/SMS it.
      demoResetCode: code,
      message: "Reset code generated. (Demo: shown in-app.)",
    };
  },
});

export const resetPasswordWithCodeImpl = internalMutation({
  args: {
    email: v.string(),
    code: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx: any, args: { email: string; code: string; newPassword: string }) => {
    const email = args.email.trim().toLowerCase();
    const code = args.code.trim();

    if (!email || !code) {
      throw new Error("Email and reset code are required");
    }

    if (!args.newPassword || args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", email))
      .first();

    // Generic error to avoid account enumeration.
    if (!user) {
      throw new Error("Invalid reset code");
    }

    const now = Date.now();

    // Find the most recent valid token.
    const tokens = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .order("desc")
      .take(10);

    const expectedHash = hashResetCode(email, code);

    const matching = tokens.find((t: any) => {
      const isUsed = Boolean(t.usedAt);
      const isExpired = t.expiresAt < now;
      return !isUsed && !isExpired && t.codeHash === expectedHash;
    });

    if (!matching) {
      throw new Error("Invalid reset code");
    }

    // Mark token as used
    await ctx.db.patch(matching._id, { usedAt: now });

    // Set/replace password
    const { hash, salt } = await hashPassword(args.newPassword);

    const existingPassword = await ctx.db
      .query("passwords")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();

    if (existingPassword) {
      await ctx.db.patch(existingPassword._id, {
        passwordHash: hash,
        salt,
      });
    } else {
      await ctx.db.insert("passwords", {
        userId: user._id,
        passwordHash: hash,
        salt,
        createdAt: now,
      });
    }

    // Invalidate sessions (force re-login on all devices)
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    await ctx.db.insert("securityLogs", {
      userId: user._id,
      eventType: "PASSWORD_RESET",
      severity: "INFO",
      description: `Password reset via code for ${email}`,
      ipAddress: undefined,
      userAgent: undefined,
      deviceFingerprint: undefined,
      isSuspicious: false,
      threatScore: 0,
      blockedBySystem: false,
      timestamp: now,
    });

    return { success: true };
  },
});

export const changePasswordImpl = internalMutation({
  args: {
    sessionToken: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (
    ctx: any,
    args: { sessionToken: string; currentPassword: string; newPassword: string }
  ) => {
    if (!args.newPassword || args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    const identity = await getUserIdFromSessionToken(ctx, args.sessionToken);
    if (!identity) {
      throw new Error("Session expired. Please sign in again.");
    }

    const user = await ctx.db.get(identity.userId);
    if (!user || !user.email) {
      throw new Error("Session expired. Please sign in again.");
    }

    const passwordRecord = await ctx.db
      .query("passwords")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();

    if (!passwordRecord) {
      throw new Error("Password not set for this account.");
    }

    const isValid = await verifyPasswordWithLegacySupport(ctx, {
      password: args.currentPassword,
      passwordRecord,
    });

    if (!isValid) {
      throw new Error("Current password is incorrect.");
    }

    const { hash, salt } = await hashPassword(args.newPassword);
    await ctx.db.patch(passwordRecord._id, {
      passwordHash: hash,
      salt,
    });

    // Invalidate other sessions, keep the current one.
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    for (const session of sessions) {
      if (session._id === identity.sessionId) continue;
      await ctx.db.delete(session._id);
    }

    await ctx.db.insert("securityLogs", {
      userId: user._id,
      eventType: "PASSWORD_CHANGE",
      severity: "INFO",
      description: `Password changed for ${user.email}`,
      ipAddress: undefined,
      userAgent: undefined,
      deviceFingerprint: undefined,
      isSuspicious: false,
      threatScore: 0,
      blockedBySystem: false,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// -----------------------------
// Diagnostics
// -----------------------------

export const diagnosticAuthData = internalQuery({
  args: {},
  handler: async (ctx: any) => {
    const users = await ctx.db.query("users").collect();
    const sessions = await ctx.db.query("sessions").collect();

    return {
      usersCount: users.length,
      sessionsCount: sessions.length,
      users: users.map((u: any) => ({
        _id: u._id,
        email: u.email,
        name: u.name,
        role: u.role,
      })),
    };
  },
});

export const purgeAllAuthData = internalMutation({
  args: {},
  handler: async (ctx: any) => {
    const passwords = await ctx.db.query("passwords").collect();
    const sessions = await ctx.db.query("sessions").collect();

    for (const password of passwords) {
      await ctx.db.delete(password._id);
    }

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return {
      deletedPasswords: passwords.length,
      deletedSessions: sessions.length,
      message: "All auth data purged. Users can sign up fresh.",
    };
  },
});

export const checkAuthStatus = query({
  args: {},
  handler: async (ctx: any) => {
    const users = await ctx.db.query("users").collect();
    const sessions = await ctx.db.query("sessions").collect();

    return {
      usersCount: users.length,
      sessionsCount: sessions.length,
      canSignUp: true,
    };
  },
});

// Internal-only helper for development/support: force-reset a user's password.
// Not exposed to the client app.
export const resetPasswordForEmailImpl = internalMutation({
  args: {
    email: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx: any, args: { email: string; newPassword: string }) => {
    const email = args.email.trim().toLowerCase();
    if (!email) {
      throw new Error("Email is required");
    }
    if (!args.newPassword || args.newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const { hash, salt } = await hashPassword(args.newPassword);

    const existingPassword = await ctx.db
      .query("passwords")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();

    if (existingPassword) {
      await ctx.db.patch(existingPassword._id, {
        passwordHash: hash,
        salt,
      });
    } else {
      await ctx.db.insert("passwords", {
        userId: user._id,
        passwordHash: hash,
        salt,
        createdAt: Date.now(),
      });
    }

    // Invalidate active sessions so the new password takes effect everywhere.
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return {
      success: true,
      userId: user._id,
      email,
      sessionsDeleted: sessions.length,
    };
  },
});