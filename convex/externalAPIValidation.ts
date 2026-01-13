import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * LAYER 2: EXTERNAL API VALIDATION
 * 
 * This layer calls external services (Truecaller, IPQS, Twilio) for validation.
 * Only called when Layer 1 confidence is low or for critical numbers.
 * 
 * COST OPTIMIZATION:
 * - Cache results for 30 days (reduce duplicate lookups)
 * - Only call APIs when needed (confidence-based triggering)
 * - Batch lookups when possible
 */

// ============================================================================
// 1. TRUECALLER API INTEGRATION
// ============================================================================

export const checkWithTruecaller = action({
  args: { phoneNumber: v.string() },
  handler: async (ctx: any, { phoneNumber }: any) => {
    const cached = await ctx.runQuery(internal.externalAPIValidation.getCachedAPIResult, {
      phoneNumber,
      provider: "truecaller",
    });

    if (cached) {
      return cached;
    }

    try {
      const apiKey = await getConfiguredKey(ctx, "truecaller");
      if (!apiKey) {
        return {
          provider: "truecaller",
          available: false,
          error: "API key not configured",
        };
      }

      const fetchFn: typeof fetch = (globalThis as any).fetch;
      const response = await fetchFn(
        `https://api.truecaller.com/v1/search?phone=${encodeURIComponent(phoneNumber)}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return {
          provider: "truecaller",
          available: false,
          error: `HTTP ${response.status}`,
        };
      }

      const data = await response.json();

      const result = {
        provider: "truecaller",
        available: true,
        phoneNumber,
        spamScore: data.spamScore || 0,
        spamType: data.spamType || null,
        callerName: data.name || null,
        numberType: data.numberType || null,
        carrier: data.carrier || null,
        country: data.countryCode || null,
        reportCount: data.reportCount || 0,
        confidence: data.confidence || 70,
        riskScore: Math.min(100, (data.spamScore || 0) * 10),
        timestamp: Date.now(),
      };

      await ctx.runMutation(internal.externalAPIValidation.cacheAPIResult, { result });

      return result;
    } catch (error: any) {
      return {
        provider: "truecaller",
        available: false,
        error: error.message,
      };
    }
  },
});

// ============================================================================
// 2. IPQUALITYSCORE API INTEGRATION
// ============================================================================

export const checkWithIPQS = action({
  args: { phoneNumber: v.string() },
  handler: async (ctx: any, { phoneNumber }: any) => {
    const cached = await ctx.runQuery(internal.externalAPIValidation.getCachedAPIResult, {
      phoneNumber,
      provider: "ipqs",
    });

    if (cached) {
      return cached;
    }

    try {
      const apiKey = await getConfiguredKey(ctx, "ipqs");
      if (!apiKey) {
        return {
          provider: "ipqs",
          available: false,
          error: "API key not configured",
        };
      }

      const fetchFn: typeof fetch = (globalThis as any).fetch;
      const response = await fetchFn(
        `https://ipqualityscore.com/api/json/phone/${apiKey}/${encodeURIComponent(phoneNumber)}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return {
          provider: "ipqs",
          available: false,
          error: `HTTP ${response.status}`,
        };
      }

      const data = await response.json();

      const result = {
        provider: "ipqs",
        available: true,
        phoneNumber,
        fraudScore: data.fraud_score || 0,
        recentAbuse: data.recent_abuse || false,
        isVoip: data.VOIP || false,
        isActive: data.active || null,
        lineType: data.line_type || null,
        carrier: data.carrier || null,
        country: data.country || null,
        riskScore: data.fraud_score || 0,
        confidence: data.fraud_score > 0 ? 85 : 60,
        timestamp: Date.now(),
      };

      await ctx.runMutation(internal.externalAPIValidation.cacheAPIResult, { result });

      return result;
    } catch (error: any) {
      return {
        provider: "ipqs",
        available: false,
        error: error.message,
      };
    }
  },
});

// ============================================================================
// 3. TWILIO LOOKUP API INTEGRATION
// ============================================================================

export const checkWithTwilio = action({
  args: { phoneNumber: v.string() },
  handler: async (ctx: any, { phoneNumber }: any) => {
    const cached = await ctx.runQuery(internal.externalAPIValidation.getCachedAPIResult, {
      phoneNumber,
      provider: "twilio",
    });

    if (cached) {
      return cached;
    }

    try {
      const rawCreds = await getConfiguredKey(ctx, "twilio");
      if (!rawCreds) {
        return {
          provider: "twilio",
          available: false,
          error: "API credentials not configured",
        };
      }

      const parsed = JSON.parse(rawCreds);
      const accountSid = parsed?.accountSid;
      const authToken = parsed?.authToken;

      if (typeof accountSid !== "string" || typeof authToken !== "string") {
        return {
          provider: "twilio",
          available: false,
          error: "Twilio credentials invalid (expected JSON with accountSid + authToken)",
        };
      }

      const auth = encodeBasicAuth(accountSid, authToken);

      const fetchFn: typeof fetch = (globalThis as any).fetch;
      const response = await fetchFn(
        `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(phoneNumber)}?Fields=caller_name,line_type_intelligence`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return {
          provider: "twilio",
          available: false,
          error: `HTTP ${response.status}`,
        };
      }

      const data = await response.json();

      let riskScore = 0;
      if (!data.valid) riskScore += 50;
      if (data.lineTypeIntelligence?.type === "voip") riskScore += 20;

      const result = {
        provider: "twilio",
        available: true,
        phoneNumber,
        valid: data.valid || false,
        callerName: data.callerName?.caller_name || null,
        lineType: data.lineTypeIntelligence?.type || null,
        carrier: data.lineTypeIntelligence?.carrier_name || null,
        country: data.countryCode || null,
        isVoip: data.lineTypeIntelligence?.type === "voip",
        riskScore,
        confidence: data.valid ? 75 : 50,
        timestamp: Date.now(),
      };

      await ctx.runMutation(internal.externalAPIValidation.cacheAPIResult, { result });

      return result;
    } catch (error: any) {
      return {
        provider: "twilio",
        available: false,
        error: error.message,
      };
    }
  },
});

// ============================================================================
// 4. SMART API SELECTION (Choose Best API for the Number)
// ============================================================================

export const validateWithBestAPI = action({
  args: {
    phoneNumber: v.string(),
    preferredProvider: v.optional(v.union(v.literal("truecaller"), v.literal("ipqs"), v.literal("twilio"))),
  },
  handler: async (ctx: any, { phoneNumber, preferredProvider }: any) => {
    const providers = preferredProvider
      ? [preferredProvider, "truecaller", "ipqs", "twilio"].filter((p, i, a) => a.indexOf(p) === i)
      : ["ipqs", "truecaller", "twilio"];

    for (const provider of providers) {
      let result;

      if (provider === "truecaller") {
        result = await ctx.runAction(api.externalAPIValidation.checkWithTruecaller, { phoneNumber });
      } else if (provider === "ipqs") {
        result = await ctx.runAction(api.externalAPIValidation.checkWithIPQS, { phoneNumber });
      } else if (provider === "twilio") {
        result = await ctx.runAction(api.externalAPIValidation.checkWithTwilio, { phoneNumber });
      }

      if (result && result.available) {
        return result;
      }
    }

    return {
      provider: "none",
      available: false,
      error: "All API providers unavailable",
    };
  },
});

// ============================================================================
// 5. CACHING SYSTEM (Reduce API Costs)
// ============================================================================

export const getCachedAPIResult = internalQuery({
  args: {
    phoneNumber: v.string(),
    provider: v.union(v.literal("truecaller"), v.literal("ipqs"), v.literal("twilio")),
  },
  handler: async (ctx: any, { phoneNumber, provider }: any) => {
    // Find cached result
    const cached = await ctx.db
      .query("apiCache")
      .withIndex("by_phone_provider", (q: any) => q.eq("phoneNumber", phoneNumber).eq("provider", provider))
      .first();

    if (!cached) return null;

    // Check if cache is still valid (30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    if (cached.timestamp < thirtyDaysAgo) {
      return null; // Cache expired
    }

    return cached.result;
  }
});

export const cacheAPIResult = internalMutation({
  args: {
    result: v.any(),
  },
  handler: async (ctx: any, { result }: any) => {
    const existing = await ctx.db
      .query("apiCache")
      .withIndex("by_phone_provider", (q: any) => q.eq("phoneNumber", result.phoneNumber).eq("provider", result.provider))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        result,
        timestamp: Date.now(),
      });
      return;
    }

    await ctx.db.insert("apiCache", {
      phoneNumber: result.phoneNumber,
      provider: result.provider,
      result,
      timestamp: Date.now(),
    });
  },
});

function encodeBasicAuth(accountSid: string, authToken: string): string {
  const raw = `${accountSid}:${authToken}`;

  const btoaFn = (globalThis as any).btoa as ((input: string) => string) | undefined;
  if (typeof btoaFn === "function") {
    return btoaFn(raw);
  }

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

async function getConfiguredKey(
  ctx: any,
  service: "truecaller" | "ipqs" | "twilio"
): Promise<string | null> {
  const fromDb: string | null = await ctx.runQuery(internal.apiConfig.getApiKeyInternal, { service });
  return fromDb;
}