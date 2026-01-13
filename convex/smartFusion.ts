import { v } from "convex/values";
import { query, action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * SMART FUSION ENGINE
 * 
 * This is the brain that combines Layer 1 (your algorithm) and Layer 2 (external APIs)
 * to produce the most accurate risk assessment.
 * 
 * STRATEGY:
 * 1. Always run Layer 1 (instant, free)
 * 2. Decide if Layer 2 is needed (cost optimization)
 * 3. If both available, intelligently merge results
 * 4. Learn from discrepancies to improve Layer 1
 */

// ============================================================================
// 1. MAIN VERIFICATION FUNCTION (Entry Point)
// ============================================================================

export const verifyPhoneNumber = action({
  args: {
    phoneNumber: v.string(),
    contactName: v.optional(v.string()),
    forceAPIValidation: v.optional(v.boolean())
  },
  handler: async (ctx, { phoneNumber, contactName, forceAPIValidation = false }) => {
    // ========================================================================
    // STEP 1: Run Layer 1 (Your Internal Algorithm) - ALWAYS
    // ========================================================================
    
    const layer1Result = await ctx.runQuery(api.internalScamDetection.calculateInternalRiskScore, {
      phoneNumber,
      contactName
    });

    // ========================================================================
    // STEP 2: Decide if Layer 2 (External API) is Needed
    // ========================================================================
    
    let needsAPIValidation = forceAPIValidation;

    if (!needsAPIValidation) {
      // Call API if:
      // - Low confidence (< 70%) - Need external validation
      // - Medium risk (30-70%) - Ambiguous, need second opinion
      // - High risk but low report count - Verify before showing to user
      needsAPIValidation = 
        layer1Result.confidence < 70 ||
        (layer1Result.riskScore >= 30 && layer1Result.riskScore <= 70) ||
        (layer1Result.riskScore >= 70 && layer1Result.layers.community.totalReports < 5);
    }

    // For saved contacts with low risk, skip API (save costs)
    if (contactName && layer1Result.riskScore < 30) {
      needsAPIValidation = false;
    }

    let layer2Result: any = null;

    // ========================================================================
    // STEP 3: Run Layer 2 (External API) if Needed
    // ========================================================================
    
    if (needsAPIValidation) {
      layer2Result = await ctx.runAction(api.externalAPIValidation.validateWithBestAPI, {
        phoneNumber,
        preferredProvider: "ipqs" // Start with cheapest
      });
    }

    // ========================================================================
    // STEP 4: Merge Results (Smart Fusion Logic)
    // ========================================================================
    
    if (!layer2Result || !layer2Result.available) {
      // Only Layer 1 available - use it
      return {
        verdict: {
          riskScore: layer1Result.riskScore,
          riskLevel: layer1Result.riskLevel,
          confidence: layer1Result.confidence,
          reasons: layer1Result.reasons
        },
        layers: {
          layer1: layer1Result,
          layer2: null
        },
        source: "internal_only",
        timestamp: Date.now()
      };
    }

    // Both layers available - SMART MERGE
    const merged = mergeLayerResults(layer1Result, layer2Result, contactName);

    // ========================================================================
    // STEP 5: Learn from Discrepancies (Improve Layer 1 Over Time)
    // ========================================================================
    
    const discrepancy = Math.abs(layer1Result.riskScore - layer2Result.riskScore);
    if (discrepancy > 30) {
      // Significant disagreement - log for learning
      await ctx.runMutation(api.smartFusion.logDiscrepancy, {
        phoneNumber,
        layer1Score: layer1Result.riskScore,
        layer2Score: layer2Result.riskScore,
        layer2Provider: layer2Result.provider,
        discrepancy
      });
    }

    return {
      verdict: merged,
      layers: {
        layer1: layer1Result,
        layer2: layer2Result
      },
      source: "dual_layer",
      timestamp: Date.now()
    };
  }
});

// ============================================================================
// 2. SMART MERGE LOGIC
// ============================================================================

function mergeLayerResults(layer1: any, layer2: any, contactName?: string): any {
  // CONFLICT RESOLUTION STRATEGY:
  
  // Rule 1: If both agree (within 20 points), average them with higher weight to higher confidence
  const scoreDiff = Math.abs(layer1.riskScore - layer2.riskScore);
  
  if (scoreDiff <= 20) {
    // Agreement - weighted average
    const weight1 = layer1.confidence / 100;
    const weight2 = layer2.confidence / 100;
    const totalWeight = weight1 + weight2;
    
    const finalScore = Math.round(
      (layer1.riskScore * weight1 + layer2.riskScore * weight2) / totalWeight
    );
    
    const finalConfidence = Math.min(95, Math.round((layer1.confidence + layer2.confidence) / 2) + 10);
    
    return {
      riskScore: finalScore,
      riskLevel: getRiskLevel(finalScore),
      confidence: finalConfidence,
      reasons: [...new Set([...layer1.reasons, ...getLayer2Reasons(layer2)])],
      agreementLevel: "strong"
    };
  }
  
  // Rule 2: If Layer 2 says VERY high risk (> 80), trust it (external data is authoritative)
  if (layer2.riskScore >= 80 && layer2.confidence >= 70) {
    return {
      riskScore: layer2.riskScore,
      riskLevel: getRiskLevel(layer2.riskScore),
      confidence: Math.min(95, layer2.confidence + 5),
      reasons: [
        `Confirmed by ${layer2.provider}`,
        ...getLayer2Reasons(layer2),
        ...layer1.reasons
      ],
      agreementLevel: "external_override"
    };
  }
  
  // Rule 3: If Layer 1 has high confidence (> 80) and many reports (> 20), trust it
  if (layer1.confidence >= 80 && layer1.layers.community.totalReports > 20) {
    return {
      riskScore: layer1.riskScore,
      riskLevel: layer1.riskLevel,
      confidence: Math.min(95, layer1.confidence),
      reasons: [
        `${layer1.layers.community.uniqueReporters} community members confirmed`,
        ...layer1.reasons
      ],
      agreementLevel: "community_override"
    };
  }
  
  // Rule 4: For saved contacts, favor Layer 1 (knows context)
  if (contactName) {
    const avgScore = Math.round((layer1.riskScore * 0.7 + layer2.riskScore * 0.3));
    return {
      riskScore: avgScore,
      riskLevel: getRiskLevel(avgScore),
      confidence: Math.round((layer1.confidence + layer2.confidence) / 2),
      reasons: [
        "Saved contact (adjusted risk)",
        ...layer1.reasons.slice(0, 2),
        ...getLayer2Reasons(layer2).slice(0, 1)
      ],
      agreementLevel: "context_adjusted"
    };
  }
  
  // Rule 5: Default - Conservative approach (take higher risk score for safety)
  const finalScore = Math.max(layer1.riskScore, layer2.riskScore);
  const avgConfidence = Math.round((layer1.confidence + layer2.confidence) / 2);
  
  return {
    riskScore: finalScore,
    riskLevel: getRiskLevel(finalScore),
    confidence: avgConfidence,
    reasons: [
      "Multiple sources analyzed (discrepancy detected)",
      ...layer1.reasons.slice(0, 2),
      ...getLayer2Reasons(layer2).slice(0, 2)
    ],
    agreementLevel: "conservative"
  };
}

// Helper: Extract reasons from Layer 2 result
function getLayer2Reasons(layer2: any): string[] {
  const reasons: string[] = [];
  
  if (layer2.provider === "truecaller") {
    if (layer2.spamScore > 7) reasons.push(`Truecaller: High spam score (${layer2.spamScore}/10)`);
    if (layer2.reportCount > 50) reasons.push(`Reported ${layer2.reportCount}+ times on Truecaller`);
    if (layer2.spamType) reasons.push(`Classified as: ${layer2.spamType}`);
  }
  
  if (layer2.provider === "ipqs") {
    if (layer2.fraudScore > 75) reasons.push(`High fraud score (${layer2.fraudScore}/100)`);
    if (layer2.recentAbuse) reasons.push("Recent abuse detected");
    if (layer2.isVoip) reasons.push("VoIP/burner phone detected");
  }
  
  if (layer2.provider === "twilio") {
    if (!layer2.valid) reasons.push("Invalid phone number");
    if (layer2.isVoip) reasons.push("VoIP number");
  }
  
  return reasons;
}

// Helper: Determine risk level from score
function getRiskLevel(score: number): "safe" | "suspicious" | "high_risk" | "known_scam" {
  if (score >= 70) return "known_scam";
  if (score >= 50) return "high_risk";
  if (score >= 30) return "suspicious";
  return "safe";
}

// ============================================================================
// 3. LEARNING SYSTEM (Improve Layer 1 Over Time)
// ============================================================================

export const logDiscrepancy = internalMutation({
  args: {
    phoneNumber: v.string(),
    layer1Score: v.number(),
    layer2Score: v.number(),
    layer2Provider: v.string(),
    discrepancy: v.number()
  },
  handler: async (ctx, args) => {
    // Log significant discrepancies for analysis
    await ctx.db.insert("verificationDiscrepancies", {
      phoneNumber: args.phoneNumber,
      layer1Score: args.layer1Score,
      layer2Score: args.layer2Score,
      layer2Provider: args.layer2Provider,
      discrepancy: args.discrepancy,
      timestamp: Date.now()
    });
    
    // TODO: Use this data to retrain/adjust Layer 1 algorithm weights
    // For now, just logging for manual review
  }
});

// Query discrepancies for analysis
export const getDiscrepancies = query({
  args: {
    minDiscrepancy: v.optional(v.number())
  },
  handler: async (ctx, { minDiscrepancy = 30 }) => {
    const discrepancies = await ctx.db
      .query("verificationDiscrepancies")
      .filter((q) => q.gte(q.field("discrepancy"), minDiscrepancy))
      .order("desc")
      .take(100);
    
    return discrepancies;
  }
});

// ============================================================================
// 4. ANALYTICS & INSIGHTS
// ============================================================================

export const getVerificationStats = query({
  handler: async (ctx) => {
    // Get sample of recent verifications for analytics
    const recent = await ctx.db
      .query("verificationDiscrepancies")
      .order("desc")
      .take(1000);
    
    const totalChecks = recent.length;
    const avgDiscrepancy = recent.reduce((sum, r) => sum + r.discrepancy, 0) / totalChecks;
    
    const layer1Higher = recent.filter(r => r.layer1Score > r.layer2Score).length;
    const layer2Higher = recent.filter(r => r.layer2Score > r.layer1Score).length;
    
    return {
      totalChecks,
      avgDiscrepancy: Math.round(avgDiscrepancy),
      layer1HigherCount: layer1Higher,
      layer2HigherCount: layer2Higher,
      agreementRate: Math.round((1 - (recent.length / totalChecks)) * 100)
    };
  }
});

import { internalMutation } from "./_generated/server";