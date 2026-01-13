import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * API Configuration Management
 * Handles API key storage, testing, and validation for external services
 */

// Session-based API config functions (mobile-compatible)
export const getAllApiKeysForSession = query({
  args: { sessionToken: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("apiKeys"),
      service: v.string(),
      keyName: v.string(),
      maskedKey: v.string(),
      isActive: v.boolean(),
      testStatus: v.optional(v.string()),
      lastTestedAt: v.optional(v.number()),
      quotaLimit: v.optional(v.number()),
      quotaPeriod: v.optional(v.string()),
      usageCount: v.optional(v.number()),
      lastResetAt: v.optional(v.number()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx: any, args: any) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      throw new Error("Forbidden: Admin access required");
    }

    const keys = await ctx.db.query("apiKeys").collect();

    return keys.map((key: any) => ({
      _id: key._id,
      service: key.service,
      keyName: key.keyName,
      maskedKey: maskApiKey(key.apiKey),
      isActive: key.isActive,
      testStatus: key.testStatus,
      lastTestedAt: key.lastTestedAt,
      quotaLimit: key.quotaLimit,
      quotaPeriod: key.quotaPeriod,
      usageCount: key.usageCount,
      lastResetAt: key.lastResetAt,
      createdAt: key.createdAt,
    }));
  },
});

export const saveApiKeyForSession = mutation({
  args: {
    sessionToken: v.string(),
    service: v.string(),
    apiKey: v.string(),
    keyName: v.string(),
    quotaLimit: v.optional(v.number()),
    quotaPeriod: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.id("apiKeys"),
  handler: async (ctx: any, args: any) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      throw new Error("Forbidden: Admin access required");
    }

    const existingKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_service", (q: any) => q.eq("service", args.service))
      .first();

    if (existingKey) {
      await ctx.db.patch(existingKey._id, {
        apiKey: args.apiKey,
        keyName: args.keyName,
        quotaLimit: args.quotaLimit,
        quotaPeriod: args.quotaPeriod,
        isActive: args.isActive ?? true,
        testStatus: "untested",
      });
      return existingKey._id;
    }

    const keyId = await ctx.db.insert("apiKeys", {
      service: args.service,
      apiKey: args.apiKey,
      keyName: args.keyName,
      isActive: args.isActive ?? true,
      testStatus: "untested",
      quotaLimit: args.quotaLimit,
      quotaPeriod: args.quotaPeriod,
      usageCount: 0,
      lastResetAt: Date.now(),
      createdAt: Date.now(),
    });

    return keyId;
  },
});

export const deleteApiKeyForSession = mutation({
  args: { sessionToken: v.string(), service: v.string() },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx: any, args: any) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      throw new Error("Forbidden: Admin access required");
    }

    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_service", (q: any) => q.eq("service", args.service))
      .first();

    if (!key) {
      return { success: false, error: "Key not found" };
    }

    await ctx.db.delete(key._id);
    return { success: true };
  },
});

export const testApiKeyForSession = action({
  args: {
    sessionToken: v.string(),
    service: v.string(),
  },
  returns: v.object({
    valid: v.boolean(),
    message: v.optional(v.string()),
    error: v.optional(v.string()),
    quotaRemaining: v.optional(v.union(v.string(), v.null())),
  }),
  handler: async (ctx: any, args: any) => {
    // Validate session
    const session = await ctx.runQuery(internal.apiConfig.validateSession, {
      sessionToken: args.sessionToken,
    });

    if (!session) {
      return { valid: false, error: "Not authenticated" };
    }

    const apiKey: string | null = await ctx.runQuery(internal.apiConfig.getApiKeyInternal, {
      service: args.service,
    });

    if (!apiKey) {
      return { valid: false, error: "API key not configured" };
    }

    const fetchFn: typeof fetch = (globalThis as any).fetch;

    try {
      let testResult:
        | { valid: boolean; message?: string; error?: string; quotaRemaining?: string | null }
        | undefined;

      switch (args.service) {
        case "abstract_phone":
          testResult = await testAbstractPhoneApi(apiKey);
          break;
        case "abstract_email":
          testResult = await testAbstractEmailApi(apiKey);
          break;
        case "google_safe_browsing":
          testResult = await testGoogleSafeBrowsingApi(apiKey);
          break;
        case "google_vision":
          testResult = await testGoogleVisionApi(apiKey);
          break;
        case "ipqs":
          testResult = await testIPQSApi(apiKey);
          break;
        case "truecaller":
          testResult = await testTruecallerApi(apiKey);
          break;
        case "twilio":
          testResult = await testTwilioApi(apiKey);
          break;
        case "meta_graph":
          testResult = await testMetaGraphApi(apiKey);
          break;
        case "google_document_ai":
          testResult = await testGoogleDocumentAi(apiKey);
          break;
        case "abn_lookup":
          testResult = await testAbnLookupApi(apiKey);
          break;
        default:
          testResult = {
            valid: false,
            error: `Unknown service: ${args.service}`,
          };
      }

      await ctx.runMutation(internal.apiConfig.updateTestStatus, {
        service: args.service,
        testStatus: testResult.valid ? "valid" : "invalid",
        error: testResult.error,
      });

      return testResult;
    } catch (error: any) {
      await ctx.runMutation(internal.apiConfig.updateTestStatus, {
        service: args.service,
        testStatus: "invalid",
        error: error?.message,
      });

      return {
        valid: false,
        error: error?.message || "Test failed",
      };
    }
  },
});

// Internal helper to validate session
export const validateSession = internalQuery({
  args: { sessionToken: v.string() },
  returns: v.union(
    v.object({
      userId: v.id("users"),
      role: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx: any, args: any) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return null;
    }

    return {
      userId: user._id,
      role: user.role,
    };
  },
});

// Get all configured API keys (with masked keys for security)
export const getAllApiKeys = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("apiKeys"),
      service: v.string(),
      keyName: v.string(),
      maskedKey: v.string(),
      isActive: v.boolean(),
      testStatus: v.optional(v.string()),
      lastTestedAt: v.optional(v.number()),
      quotaLimit: v.optional(v.number()),
      quotaPeriod: v.optional(v.string()),
      usageCount: v.optional(v.number()),
      lastResetAt: v.optional(v.number()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx: any) => {
    await assertIsAdmin(ctx);

    const keys = await ctx.db.query("apiKeys").collect();

    return keys.map((key: any) => ({
      _id: key._id,
      service: key.service,
      keyName: key.keyName,
      maskedKey: maskApiKey(key.apiKey),
      isActive: key.isActive,
      testStatus: key.testStatus,
      lastTestedAt: key.lastTestedAt,
      quotaLimit: key.quotaLimit,
      quotaPeriod: key.quotaPeriod,
      usageCount: key.usageCount,
      lastResetAt: key.lastResetAt,
      createdAt: key.createdAt,
    }));
  },
});

// Add or update an API key
export const saveApiKey = mutation({
  args: {
    service: v.string(),
    apiKey: v.string(),
    keyName: v.string(),
    quotaLimit: v.optional(v.number()),
    quotaPeriod: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.id("apiKeys"),
  handler: async (ctx: any, args: any) => {
    await assertIsAdmin(ctx);

    const existingKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_service", (q: any) => q.eq("service", args.service))
      .first();

    if (existingKey) {
      await ctx.db.patch(existingKey._id, {
        apiKey: args.apiKey,
        keyName: args.keyName,
        quotaLimit: args.quotaLimit,
        quotaPeriod: args.quotaPeriod,
        isActive: args.isActive ?? true,
        testStatus: "untested",
      });
      return existingKey._id;
    }

    const keyId = await ctx.db.insert("apiKeys", {
      service: args.service,
      apiKey: args.apiKey,
      keyName: args.keyName,
      isActive: args.isActive ?? true,
      testStatus: "untested",
      quotaLimit: args.quotaLimit,
      quotaPeriod: args.quotaPeriod,
      usageCount: 0,
      lastResetAt: Date.now(),
      createdAt: Date.now(),
    });

    return keyId;
  },
});

// Delete an API key
export const deleteApiKey = mutation({
  args: { service: v.string() },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx: any, args: any) => {
    await assertIsAdmin(ctx);

    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_service", (q: any) => q.eq("service", args.service))
      .first();

    if (!key) {
      return { success: false, error: "Key not found" };
    }

    await ctx.db.delete(key._id);
    return { success: true };
  },
});

// Test an API key by making a real API call
export const testApiKey = action({
  args: {
    service: v.string(),
  },
  returns: v.object({
    valid: v.boolean(),
    message: v.optional(v.string()),
    error: v.optional(v.string()),
    quotaRemaining: v.optional(v.union(v.string(), v.null())),
  }),
  handler: async (ctx: any, args: any) => {
    // Admin-only
    try {
      await ctx.runQuery(internal.apiConfig._assertIsAdminInternal, {});
    } catch {
      // Fallback: local check (keeps behavior predictable even if internal helper changes)
      await assertIsAdmin(ctx);
    }

    const apiKey: string | null = await ctx.runQuery(internal.apiConfig.getApiKeyInternal, {
      service: args.service,
    });

    if (!apiKey) {
      return { valid: false, error: "API key not configured" };
    }

    const fetchFn: typeof fetch = (globalThis as any).fetch;
    const BufferAny: any = (globalThis as any).Buffer;

    try {
      let testResult:
        | { valid: boolean; message?: string; error?: string; quotaRemaining?: string | null }
        | undefined;

      switch (args.service) {
        case "abstract_phone":
          testResult = await testAbstractPhoneApi(apiKey);
          break;
        case "abstract_email":
          testResult = await testAbstractEmailApi(apiKey);
          break;
        case "google_safe_browsing":
          testResult = await testGoogleSafeBrowsingApi(apiKey);
          break;
        case "google_vision":
          testResult = await testGoogleVisionApi(apiKey);
          break;
        case "ipqs":
          // Minimal validation: check that we can call the endpoint.
          testResult = await testIPQSApi(apiKey);
          break;
        case "truecaller":
          testResult = await testTruecallerApi(apiKey);
          break;
        case "twilio":
          testResult = await testTwilioApi(apiKey);
          break;
        case "meta_graph":
          testResult = await testMetaGraphApi(apiKey);
          break;
        case "google_document_ai":
          testResult = await testGoogleDocumentAi(apiKey);
          break;
        case "abn_lookup":
          testResult = await testAbnLookupApi(apiKey);
          break;
        default:
          testResult = {
            valid: false,
            error: `Unknown service: ${args.service}`,
          };
      }

      await ctx.runMutation(internal.apiConfig.updateTestStatus, {
        service: args.service,
        testStatus: testResult.valid ? "valid" : "invalid",
        error: testResult.error,
      });

      return testResult;
    } catch (error: any) {
      await ctx.runMutation(internal.apiConfig.updateTestStatus, {
        service: args.service,
        testStatus: "invalid",
        error: error?.message,
      });

      return {
        valid: false,
        error: error?.message || "Test failed",
      };
    }
  },
});

// Update test status (internal only)
export const updateTestStatus = internalMutation({
  args: {
    service: v.string(),
    testStatus: v.string(),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_service", (q: any) => q.eq("service", args.service))
      .first();

    if (!key) {
      return null;
    }

    await ctx.db.patch(key._id, {
      testStatus: args.testStatus,
      lastTestedAt: Date.now(),
    });

    return null;
  },
});

// Get API key for internal use (returns full unmasked key)
export const getApiKeyInternal = internalQuery({
  args: { service: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx: any, args: any) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_service", (q: any) => q.eq("service", args.service))
      .first();

    if (!key?.isActive) {
      return null;
    }

    return key.apiKey;
  },
});

// Helper: Mask API key (show only first 8 characters)
function maskApiKey(key: string): string {
  // If we stored JSON credentials, mask the important fields nicely.
  if (key.trim().startsWith("{") && key.trim().endsWith("}")) {
    try {
      const parsed = JSON.parse(key);
      const parts: string[] = [];

      if (typeof parsed?.accountSid === "string") {
        parts.push(`accountSid=${parsed.accountSid.substring(0, 6)}••••••`);
      }
      if (typeof parsed?.authToken === "string") {
        parts.push(`authToken=${parsed.authToken.substring(0, 4)}••••••`);
      }
      if (typeof parsed?.appId === "string") {
        parts.push(`appId=${parsed.appId.substring(0, 6)}••••••`);
      }
      if (typeof parsed?.appSecret === "string") {
        parts.push(`appSecret=${parsed.appSecret.substring(0, 4)}••••••`);
      }
      if (typeof parsed?.serviceAccountJson === "string") {
        // This is itself JSON; we only surface a tiny bit of non-sensitive identity.
        try {
          const sa = JSON.parse(parsed.serviceAccountJson);
          if (typeof sa?.client_email === "string") {
            const email: string = sa.client_email;
            parts.push(`serviceAccount=${email.split("@")[0].substring(0, 6)}•••@${email.split("@")[1] || ""}`);
          }
          if (typeof sa?.project_id === "string") {
            parts.push(`project=${sa.project_id.substring(0, 6)}••••••`);
          }
        } catch {
          parts.push("serviceAccountJson=•••");
        }
      }
      if (typeof parsed?.processorResourceName === "string") {
        const prn: string = parsed.processorResourceName;
        parts.push(`processor=${prn.substring(0, 22)}•••`);
      }

      if (parts.length > 0) {
        return parts.join(" · ");
      }
    } catch {
      // Fall through to generic masking.
    }
  }

  // ABR GUIDs look like UUIDs; mask without losing recognizability.
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(key.trim())) {
    const k = key.trim();
    return `${k.substring(0, 8)}-••••-••••-••••-${k.substring(k.length - 6)}`;
  }

  if (key.length <= 8) return "••••••••";
  return key.substring(0, 8) + "••••••••••••••••";
}

// API Testing Functions

async function assertIsAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const user = await ctx.db.get(userId);
  const role = user?.role;
  if (role !== "admin" && role !== "superadmin") {
    throw new Error("Forbidden: Admin access required");
  }

  return { userId, role };
}

async function testAbstractPhoneApi(apiKey: string) {
  try {
    const fetchFn: typeof fetch = (globalThis as any).fetch;
    const response = await fetchFn(
      `https://phonevalidation.abstractapi.com/v1/?api_key=${apiKey}&phone=14152007986`
    );
    const data = await response.json();

    if (data.error) {
      return {
        valid: false,
        error: data.error.message || "Invalid API key",
      };
    }

    return {
      valid: true,
      message: "API key is valid",
      quotaRemaining: response.headers.get("x-ratelimit-remaining"),
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Connection failed",
    };
  }
}

async function testAbstractEmailApi(apiKey: string) {
  try {
    const fetchFn: typeof fetch = (globalThis as any).fetch;
    const response = await fetchFn(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=test@example.com`
    );
    const data = await response.json();

    if (data.error) {
      return {
        valid: false,
        error: data.error.message || "Invalid API key",
      };
    }

    return {
      valid: true,
      message: "API key is valid",
      quotaRemaining: response.headers.get("x-ratelimit-remaining"),
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Connection failed",
    };
  }
}

async function testGoogleSafeBrowsingApi(apiKey: string) {
  try {
    const fetchFn: typeof fetch = (globalThis as any).fetch;
    const response = await fetchFn(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: {
            clientId: "trueprofilepro",
            clientVersion: "1.0.0",
          },
          threatInfo: {
            threatTypes: ["MALWARE"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: "http://malware.testing.google.test/" }],
          },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return {
        valid: false,
        error: data.error.message || "Invalid API key",
      };
    }

    return {
      valid: true,
      message: "API key is valid",
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Connection failed",
    };
  }
}

async function testGoogleVisionApi(apiKey: string) {
  try {
    const fetchFn: typeof fetch = (globalThis as any).fetch;
    const response = await fetchFn(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: {
                source: {
                  imageUri: "https://via.placeholder.com/150",
                },
              },
              features: [{ type: "WEB_DETECTION", maxResults: 1 }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return {
        valid: false,
        error: data.error.message || "Invalid API key",
      };
    }

    return {
      valid: true,
      message: "API key is valid",
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Connection failed",
    };
  }
}

async function testIPQSApi(apiKey: string) {
  try {
    const fetchFn: typeof fetch = (globalThis as any).fetch;
    const response = await fetchFn(
      `https://ipqualityscore.com/api/json/phone/${apiKey}/+14152007986`
    );
    const data = await response.json();

    if (data?.success === false && data?.message) {
      return { valid: false, error: data.message };
    }

    if (typeof data?.fraud_score !== "number") {
      return { valid: false, error: "Unexpected response from IPQS" };
    }

    return { valid: true, message: "API key is valid" };
  } catch (error: any) {
    return { valid: false, error: error?.message || "Connection failed" };
  }
}

async function testTruecallerApi(apiKey: string) {
  try {
    const fetchFn: typeof fetch = (globalThis as any).fetch;
    const response = await fetchFn(
      `https://api.truecaller.com/v1/search?phone=${encodeURIComponent("+14152007986")}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return { valid: false, error: `HTTP ${response.status}` };
    }

    await response.json().catch(() => null);

    return { valid: true, message: "API key is valid" };
  } catch (error: any) {
    return { valid: false, error: error?.message || "Connection failed" };
  }
}

async function testTwilioApi(rawApiKey: string) {
  try {
    const fetchFn: typeof fetch = (globalThis as any).fetch;

    const parsed = JSON.parse(rawApiKey);
    const accountSid = parsed?.accountSid;
    const authToken = parsed?.authToken;

    if (typeof accountSid !== "string" || typeof authToken !== "string") {
      return {
        valid: false,
        error: "Twilio key must be JSON: {\"accountSid\":\"...\",\"authToken\":\"...\"}",
      };
    }

    const auth = encodeBasicAuth(accountSid, authToken);

    const response = await fetchFn(
      `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(
        "+14152007986"
      )}?Fields=line_type_intelligence`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return { valid: false, error: `HTTP ${response.status}` };
    }

    await response.json().catch(() => null);

    return { valid: true, message: "API credentials are valid" };
  } catch (error: any) {
    return { valid: false, error: error?.message || "Connection failed" };
  }
}

async function testMetaGraphApi(rawApiKey: string) {
  try {
    const fetchFn: typeof fetch = (globalThis as any).fetch;

    const parsed = JSON.parse(rawApiKey);
    const appId = parsed?.appId;
    const appSecret = parsed?.appSecret;

    if (typeof appId !== "string" || typeof appSecret !== "string") {
      return {
        valid: false,
        error: "Meta Graph key must be JSON: {\"appId\":\"...\",\"appSecret\":\"...\"}",
      };
    }

    // App access token via client credentials.
    const tokenRes = await fetchFn(
      `https://graph.facebook.com/oauth/access_token?client_id=${encodeURIComponent(
        appId
      )}&client_secret=${encodeURIComponent(appSecret)}&grant_type=client_credentials`
    );

    const tokenData: any = await tokenRes.json().catch(() => null);
    if (!tokenRes.ok || !tokenData?.access_token) {
      return {
        valid: false,
        error:
          tokenData?.error?.message ||
          `Failed to get app access token (HTTP ${tokenRes.status})`,
      };
    }

    // Quick follow-up call for sanity.
    const appRes = await fetchFn(
      `https://graph.facebook.com/app?access_token=${encodeURIComponent(tokenData.access_token)}`
    );
    const appData: any = await appRes.json().catch(() => null);
    if (!appRes.ok) {
      return {
        valid: false,
        error: appData?.error?.message || `Graph API error (HTTP ${appRes.status})`,
      };
    }

    return {
      valid: true,
      message: `Connected. App: ${appData?.name || "(unknown)"}`,
    };
  } catch (error: any) {
    return { valid: false, error: error?.message || "Connection failed" };
  }
}

async function testAbnLookupApi(apiKey: string) {
  try {
    const fetchFn: typeof fetch = (globalThis as any).fetch;

    // Known ABN used only for testing connectivity.
    const testAbn = "51824753556";
    const url =
      `https://abr.business.gov.au/abrxmlsearch/ABRXMLSearch.asmx/SearchByABN` +
      `?searchString=${encodeURIComponent(testAbn)}` +
      `&includeHistoricalDetails=N` +
      `&authenticationGuid=${encodeURIComponent(apiKey)}`;

    const res = await fetchFn(url);
    const text = await res.text();

    if (!res.ok) {
      return { valid: false, error: `HTTP ${res.status}` };
    }

    // The ABR service returns XML; errors often include "Exception".
    if (text.toLowerCase().includes("exception") || text.toLowerCase().includes("authentication")) {
      return { valid: false, error: "ABN Lookup returned an authentication error. Check your GUID." };
    }

    if (!text.includes("ABRPayloadSearchResults") && !text.includes("SearchResults")) {
      return { valid: false, error: "Unexpected ABN Lookup response" };
    }

    return { valid: true, message: "Connected to ABN Lookup successfully" };
  } catch (error: any) {
    return { valid: false, error: error?.message || "Connection failed" };
  }
}

async function testGoogleDocumentAi(rawApiKey: string) {
  try {
    const fetchFn: typeof fetch = (globalThis as any).fetch;
    const parsed = JSON.parse(rawApiKey);
    const serviceAccountJson = parsed?.serviceAccountJson;

    if (typeof serviceAccountJson !== "string") {
      return {
        valid: false,
        error:
          "Document AI config must be JSON containing serviceAccountJson (string) and optionally processorResourceName",
      };
    }

    let sa: any;
    try {
      sa = JSON.parse(serviceAccountJson);
    } catch {
      return { valid: false, error: "Service Account JSON is not valid JSON" };
    }

    const clientEmail = sa?.client_email;
    const privateKeyPem = sa?.private_key;

    if (typeof clientEmail !== "string" || typeof privateKeyPem !== "string") {
      return {
        valid: false,
        error: "Service Account JSON must include client_email and private_key",
      };
    }

    // Generate an OAuth token using JWT assertion. This is the minimum proof that the credentials work.
    const cryptoAny: any = (globalThis as any).crypto;
    if (!cryptoAny?.subtle) {
      return {
        valid: false,
        error:
          "Server crypto not available for JWT signing in this environment. Credentials are stored, but automated test can't run.",
      };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const jwtHeader = { alg: "RS256", typ: "JWT" };
    const jwtClaimSet = {
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: nowSec,
      exp: nowSec + 60 * 10,
    };

    const headerB64 = base64UrlEncodeUtf8(JSON.stringify(jwtHeader));
    const claimB64 = base64UrlEncodeUtf8(JSON.stringify(jwtClaimSet));
    const signingInput = `${headerB64}.${claimB64}`;

    const key = await importGoogleServiceAccountPrivateKey(privateKeyPem);
    const signature = await cryptoAny.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      key,
      utf8ToArrayBuffer(signingInput)
    );
    const sigB64 = base64UrlEncodeBytes(new Uint8Array(signature));
    const jwt = `${signingInput}.${sigB64}`;

    const tokenRes = await fetchFn("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=${encodeURIComponent(
        "urn:ietf:params:oauth:grant-type:jwt-bearer"
      )}&assertion=${encodeURIComponent(jwt)}`,
    });

    const tokenData: any = await tokenRes.json().catch(() => null);
    if (!tokenRes.ok || !tokenData?.access_token) {
      return {
        valid: false,
        error:
          tokenData?.error_description ||
          tokenData?.error ||
          `Failed to fetch OAuth token (HTTP ${tokenRes.status})`,
      };
    }

    // Optional sanity: list locations endpoint (cheap). If this fails, token likely not authorized.
    const probeRes = await fetchFn(
      "https://documentai.googleapis.com/v1/projects/-/locations",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!probeRes.ok) {
      return {
        valid: false,
        error: `OAuth works but Document AI probe failed (HTTP ${probeRes.status}). Check that Document AI API is enabled in Google Cloud and IAM permissions are correct.`,
      };
    }

    return {
      valid: true,
      message: `Connected. Service account: ${clientEmail}`,
    };
  } catch (error: any) {
    return { valid: false, error: error?.message || "Connection failed" };
  }
}

async function importGoogleServiceAccountPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
  const cryptoAny: any = (globalThis as any).crypto;

  // Convert PEM to ArrayBuffer (PKCS#8)
  const pemBody = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");

  const binaryDer = base64ToBytes(pemBody);

  return cryptoAny.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
}

function utf8ToArrayBuffer(input: string): ArrayBuffer {
  const TextEncoderAny: any = (globalThis as any).TextEncoder;
  if (typeof TextEncoderAny === "function") {
    const encoder = new TextEncoderAny();
    return encoder.encode(input).buffer;
  }

  // Fallback: ASCII-only (safe here because our JWT signing input is ASCII).
  const out = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    out[i] = input.charCodeAt(i) & 0xff;
  }
  return out.buffer;
}

function base64UrlEncodeUtf8(input: string): string {
  const TextEncoderAny: any = (globalThis as any).TextEncoder;
  if (typeof TextEncoderAny === "function") {
    const encoder = new TextEncoderAny();
    return base64UrlEncodeBytes(encoder.encode(input));
  }

  // Fallback: ASCII-only.
  const out = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    out[i] = input.charCodeAt(i) & 0xff;
  }
  return base64UrlEncodeBytes(out);
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  const b64 = bytesToBase64(bytes);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function bytesToBase64(bytes: Uint8Array): string {
  const btoaFn = (globalThis as any).btoa as ((input: string) => string) | undefined;
  if (typeof btoaFn === "function") {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoaFn(binary);
  }

  // Fallback: convert to ASCII string and reuse existing helper.
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64FromAsciiString(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const atobFn = (globalThis as any).atob as ((input: string) => string) | undefined;
  let binary: string;

  if (typeof atobFn === "function") {
    binary = atobFn(base64);
  } else {
    binary = asciiStringFromBase64(base64);
  }

  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function asciiStringFromBase64(base64: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = base64.replace(/=+$/g, "");

  let bits = 0;
  let buffer = 0;
  let output = "";

  for (const ch of clean) {
    const val = alphabet.indexOf(ch);
    if (val === -1) continue;

    buffer = (buffer << 6) | val;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      const byte = (buffer >> bits) & 0xff;
      output += String.fromCharCode(byte);
    }
  }

  return output;
}

function encodeBasicAuth(accountSid: string, authToken: string): string {
  const raw = `${accountSid}:${authToken}`;

  const btoaFn = (globalThis as any).btoa as ((input: string) => string) | undefined;
  if (typeof btoaFn === "function") {
    return btoaFn(raw);
  }

  // Fallback: credentials are ASCII; base64 encode without TextEncoder.
  return base64FromAsciiString(raw);
}

function base64FromAsciiString(input: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";

  let i = 0;
  while (i < input.length) {
    const byte1 = input.charCodeAt(i++) & 0xff;
    const byte2 = i < input.length ? input.charCodeAt(i++) & 0xff : NaN;
    const byte3 = i < input.length ? input.charCodeAt(i++) & 0xff : NaN;

    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 0x03) << 4) | ((byte2 as number) >> 4);
    const enc3 = (((byte2 as number) & 0x0f) << 2) | ((byte3 as number) >> 6);
    const enc4 = (byte3 as number) & 0x3f;

    output += alphabet[enc1];
    output += alphabet[enc2];
    output += Number.isNaN(byte2) ? "=" : alphabet[enc3];
    output += Number.isNaN(byte3) ? "=" : alphabet[enc4];
  }

  return output;
}

export const _assertIsAdminInternal = internalQuery({
  args: {},
  returns: v.null(),
  handler: async (ctx: any) => {
    await assertIsAdmin(ctx);
    return null;
  },
});