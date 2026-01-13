import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";

/* global fetch */
declare const fetch: any;

// ----------------------------
// Deepfake Detection (MVP)
// ----------------------------
// Reality check:
// - True acoustic deepfake detection requires audio signal analysis (native/ML).
// - In this Expo environment, we ship a high-value MVP that:
//   1) uses transcript + context to estimate deepfake risk,
//   2) uses stored "Trusted Voice" helpers (callback number + verification phrase),
//   3) stores history + red flags + recommended verification steps.
//
// This keeps the UX strong today while leaving a clean migration path to a real
// audio-based model later.

const clamp0to100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

type DeepfakeRiskLevel = "authentic" | "suspicious" | "likely_fake" | "confirmed_deepfake";

function riskLevelFromScore(score: number): DeepfakeRiskLevel {
  if (score >= 85) return "confirmed_deepfake";
  if (score >= 65) return "likely_fake";
  if (score >= 40) return "suspicious";
  return "authentic";
}

function suggestedVerificationDefault(args: {
  claimedIdentity?: string;
  requestedAction?: string;
  voiceProfileSafeCallbackNumber?: string | null;
  voiceProfileVerificationPhrase?: string | null;
}): string {
  if (args.voiceProfileSafeCallbackNumber) {
    return `Call back on the saved trusted number: ${args.voiceProfileSafeCallbackNumber}`;
  }
  if (args.voiceProfileVerificationPhrase) {
    return `Ask your agreed verification question/codeword: "${args.voiceProfileVerificationPhrase}"`;
  }

  // Good default advice even without a profile.
  if (args.requestedAction?.toLowerCase().includes("money")) {
    return "Do not send money. Hang up and call the person/organization back using a number you already know.";
  }

  return "Hang up and call back on a known number. Ask a personal verification question only the real person would know.";
}

// =======================================================
// ACTION: Analyze transcript + context via a0 LLM
// =======================================================
export const analyzeDeepfake = action({
  args: {
    scanType: v.string(), // "voice_call" | "video_call" | "audio_file" | etc.
    sourceType: v.string(), // "live_call" | "whatsapp_call" | "recorded_audio" | "uploaded_file"
    transcript: v.string(),
    claimedIdentity: v.optional(v.string()),
    requestedAction: v.optional(v.string()),
    emotionalManipulation: v.optional(v.boolean()),
    voiceProfileId: v.optional(v.id("voiceProfiles")),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const voiceProfileDoc = args.voiceProfileId
      ? await ctx.runQuery(api.deepfakeScans.getVoiceProfileById, {
          voiceProfileId: args.voiceProfileId,
        })
      : null;

    const safeCallbackNumber = (voiceProfileDoc as any)?.safeCallbackNumber ?? null;
    const verificationPhrase = (voiceProfileDoc as any)?.verificationPhrase ?? null;

    // LLM prompt: we ask for structured output, and we explicitly instruct it
    // to base its judgement on text + context limitations.
    let llmResult:
      | {
          riskScore: number;
          confidence: number;
          isAIGenerated: boolean;
          deepfakeType: string;
          redFlags: string[];
          recommendation: string;
          suggestedVerification: string;
        }
      | null = null;

    try {
      const response = await globalThis.fetch("https://api.a0.dev/ai/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a safety analyst for an Australian anti-scam app. Your job is to estimate the likelihood that a call/voice note is an AI voice clone (deepfake) using only the provided transcript and context. Be conservative: you cannot hear the audio, so you must not claim certainty unless the content strongly indicates a scam. Always recommend verification steps (call back on known number, ask codeword/security question).",
            },
            {
              role: "user",
              content: JSON.stringify(
                {
                  scanType: args.scanType,
                  sourceType: args.sourceType,
                  claimedIdentity: args.claimedIdentity || null,
                  requestedAction: args.requestedAction || null,
                  emotionalManipulation: !!args.emotionalManipulation,
                  hasTrustedCallbackNumber: !!safeCallbackNumber,
                  hasVerificationPhrase: !!verificationPhrase,
                  transcript: args.transcript,
                },
                null,
                2
              ),
            },
          ],
          schema: {
            type: "object",
            properties: {
              riskScore: { type: "number" },
              confidence: { type: "number" },
              isAIGenerated: { type: "boolean" },
              deepfakeType: { type: "string" },
              redFlags: { type: "array", items: { type: "string" } },
              recommendation: { type: "string" },
              suggestedVerification: { type: "string" },
            },
            required: [
              "riskScore",
              "confidence",
              "isAIGenerated",
              "deepfakeType",
              "redFlags",
              "recommendation",
              "suggestedVerification",
            ],
          },
        }),
      });

      const responseData = await response.json();
      const data = responseData.is_structured
        ? responseData.schema_data
        : JSON.parse(responseData.completion);

      llmResult = {
        riskScore: clamp0to100(Number(data.riskScore ?? 50)),
        confidence: clamp0to100(Number(data.confidence ?? 55)),
        isAIGenerated: Boolean(data.isAIGenerated ?? false),
        deepfakeType: String(data.deepfakeType ?? "voice_clone"),
        redFlags: Array.isArray(data.redFlags) ? data.redFlags.slice(0, 12) : [],
        recommendation: String(data.recommendation ?? "Verify the caller before taking action."),
        suggestedVerification: String(
          data.suggestedVerification ??
            suggestedVerificationDefault({
              claimedIdentity: args.claimedIdentity,
              requestedAction: args.requestedAction,
              voiceProfileSafeCallbackNumber: safeCallbackNumber,
              voiceProfileVerificationPhrase: verificationPhrase,
            })
        ),
      };
    } catch (error) {
      // Safe fallback: purely heuristic scoring
      const lower = args.transcript.toLowerCase();
      const flags: string[] = [];
      let score = 30;

      const bump = (condition: boolean, points: number, label: string) => {
        if (condition) {
          score += points;
          flags.push(label);
        }
      };

      bump(/urgent|immediately|right now|hurry/.test(lower), 15, "Urgency / pressure language");
      bump(/don\'t tell|keep this secret/.test(lower), 15, "Secrecy request");
      bump(/gift card|crypto|bitcoin|transfer|wire|pay/.test(lower), 20, "Unusual payment request");
      bump(/verification code|one-time|otp|password|pin/.test(lower), 20, "Credential / OTP request");
      bump(!!args.emotionalManipulation, 10, "Emotional manipulation flagged");

      const finalScore = clamp0to100(score);

      llmResult = {
        riskScore: finalScore,
        confidence: 45,
        isAIGenerated: finalScore >= 70,
        deepfakeType: "voice_clone",
        redFlags: flags.length ? flags : ["Insufficient data - verify independently"],
        recommendation:
          finalScore >= 70
            ? "🚨 High risk. Treat as potential voice-clone scam. Hang up and verify using trusted channels."
            : finalScore >= 40
              ? "⚠️ Suspicious. Verify identity before acting."
              : "✅ No strong indicators from transcript alone. Still verify if money or codes are involved.",
        suggestedVerification: suggestedVerificationDefault({
          claimedIdentity: args.claimedIdentity,
          requestedAction: args.requestedAction,
          voiceProfileSafeCallbackNumber: safeCallbackNumber,
          voiceProfileVerificationPhrase: verificationPhrase,
        }),
      };
    }

    const riskLevel = riskLevelFromScore(llmResult.riskScore);

    const saveResult = await ctx.runMutation(api.deepfakeScans.saveDeepfakeScan, {
      scanType: args.scanType,
      sourceType: args.sourceType,
      isAIGenerated: llmResult.isAIGenerated,
      confidence: llmResult.confidence,
      deepfakeType: llmResult.deepfakeType,
      knownVoiceProfileId: args.voiceProfileId ? String(args.voiceProfileId) : undefined,
      voiceMatchScore: undefined,
      voiceProfileMatches: undefined,
      riskScore: llmResult.riskScore,
      riskLevel,
      redFlags: llmResult.redFlags,
      claimedIdentity: args.claimedIdentity,
      requestedAction: args.requestedAction,
      emotionalManipulation: args.emotionalManipulation,
      recommendation: llmResult.recommendation,
      suggestedVerification: llmResult.suggestedVerification,
    });

    if (args.voiceProfileId) {
      await ctx.runMutation(api.deepfakeScans.incrementVoiceProfileVerification, {
        voiceProfileId: args.voiceProfileId,
      });
    }

    return {
      deepfakeScanId: saveResult.deepfakeScanId,
      riskScore: llmResult.riskScore,
      riskLevel,
      confidence: llmResult.confidence,
      isAIGenerated: llmResult.isAIGenerated,
      deepfakeType: llmResult.deepfakeType,
      redFlags: llmResult.redFlags,
      recommendation: llmResult.recommendation,
      suggestedVerification: llmResult.suggestedVerification,
    };
  },
});

// =======================================================
// MUTATION: Save scan (public, used by UI too)
// =======================================================
export const saveDeepfakeScan = mutation({
  args: {
    scanType: v.string(),
    sourceType: v.string(),
    isAIGenerated: v.boolean(),
    confidence: v.number(),
    deepfakeType: v.optional(v.string()),
    knownVoiceProfileId: v.optional(v.string()),
    voiceMatchScore: v.optional(v.number()),
    voiceProfileMatches: v.optional(v.boolean()),
    riskScore: v.number(),
    riskLevel: v.string(),
    redFlags: v.array(v.string()),
    claimedIdentity: v.optional(v.string()),
    requestedAction: v.optional(v.string()),
    emotionalManipulation: v.optional(v.boolean()),
    recommendation: v.string(),
    suggestedVerification: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const deepfakeScanId = await ctx.db.insert("deepfakeScans", {
      userId,
      scanType: args.scanType,
      sourceType: args.sourceType,
      isAIGenerated: args.isAIGenerated,
      confidence: clamp0to100(args.confidence),
      deepfakeType: args.deepfakeType,
      knownVoiceProfileId: args.knownVoiceProfileId,
      voiceMatchScore: args.voiceMatchScore,
      voiceProfileMatches: args.voiceProfileMatches,
      riskScore: clamp0to100(args.riskScore),
      riskLevel: args.riskLevel,
      redFlags: args.redFlags,
      claimedIdentity: args.claimedIdentity,
      requestedAction: args.requestedAction,
      emotionalManipulation: args.emotionalManipulation,
      recommendation: args.recommendation,
      suggestedVerification: args.suggestedVerification,
      scannedAt: Date.now(),
    });

    return { deepfakeScanId };
  },
});

// =======================================================
// QUERIES: History
// =======================================================
export const getDeepfakeHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("deepfakeScans")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 30);
  },
});

// =======================================================
// Voice Profiles CRUD
// =======================================================
export const listVoiceProfiles = query({
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("voiceProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const createVoiceProfile = mutation({
  args: {
    profileName: v.string(),
    relationshipType: v.string(),
    safeCallbackNumber: v.optional(v.string()),
    verificationPhrase: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const normalizedPhrase = args.verificationPhrase?.trim().toLowerCase();

    // This is NOT a biometric. It's a lightweight helper so we can later migrate to
    // real fingerprints without changing the client.
    const pseudoFingerprint = normalizedPhrase
      ? `phrase:${normalizedPhrase}|name:${args.profileName.trim().toLowerCase()}`
      : undefined;

    const voiceProfileId = await ctx.db.insert("voiceProfiles", {
      userId,
      profileName: args.profileName.trim(),
      relationshipType: args.relationshipType,
      safeCallbackNumber: args.safeCallbackNumber?.trim(),
      verificationPhrase: args.verificationPhrase?.trim(),
      notes: args.notes?.trim(),
      voiceFingerprint: pseudoFingerprint,
      recordingCount: 0,
      lastRecordingAt: undefined,
      totalVerifications: 0,
      successfulMatches: 0,
      failedMatches: 0,
      falsePositiveRate: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { voiceProfileId };
  },
});

export const deleteVoiceProfile = mutation({
  args: { voiceProfileId: v.id("voiceProfiles") },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const profile = await ctx.db.get(args.voiceProfileId);
    if (!profile) throw new Error("Voice profile not found");
    if ((profile as any).userId !== userId) throw new Error("Unauthorized");

    await ctx.db.delete(args.voiceProfileId);
    return { success: true };
  },
});

export const getVoiceProfileById = query({
  args: { voiceProfileId: v.id("voiceProfiles") },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db.get(args.voiceProfileId);
    if (!profile) return null;
    if ((profile as any).userId !== userId) return null;

    return profile;
  },
});

export const incrementVoiceProfileVerification = mutation({
  args: { voiceProfileId: v.id("voiceProfiles") },
  handler: async (ctx: any, args: any) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const profile = await ctx.db.get(args.voiceProfileId);
    if (!profile) throw new Error("Voice profile not found");
    if ((profile as any).userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.voiceProfileId, {
      totalVerifications: (profile as any).totalVerifications + 1,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});