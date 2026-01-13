import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * COMPREHENSIVE NUMBER VERIFICATION SERVICE
 * Combines multiple intelligence layers for world-class scam detection
 * 
 * LAYERS:
 * 1. Community Reports (our own database)
 * 2. External APIs (Truecaller, Twilio, IPQS, etc.)
 * 3. Behavioral Analysis (patterns, frequency, timing)
 * 4. Known Scam Databases (ACCC, international)
 */

// Main verification function - checks a number across ALL layers
export const verifyNumber = action({
  args: { 
    phoneNumber: v.string(),
    contactName: v.optional(v.string()),
    forceApiCheck: v.optional(v.boolean()), // Force fresh API check (vs cached)
  },
  handler: async (ctx, { phoneNumber, contactName, forceApiCheck = false }) => {
    const normalizedNumber = normalizePhoneNumber(phoneNumber);
    
    // LAYER 1: Check our community intelligence (fastest)
    const communityIntel = await ctx.runQuery(api.communityReports.getNumberIntelligence, {
      phoneNumber: normalizedNumber,
    });
    
    // LAYER 2: Check external APIs (if needed)
    let apiIntel = null;
    const needsApiCheck = forceApiCheck || 
      !communityIntel.lastApiCheckAt || 
      (Date.now() - communityIntel.lastApiCheckAt) > 7 * 24 * 60 * 60 * 1000; // 7 days

    if (needsApiCheck) {
      apiIntel = await checkExternalAPIs(ctx, normalizedNumber);
    }
    
    // LAYER 3: Get recent community reports for context
    const recentReports = await ctx.runQuery(api.communityReports.getNumberReports, {
      phoneNumber: normalizedNumber,
      limit: 5,
    });
    
    // LAYER 4: Calculate final risk score
    const riskAssessment = calculateComprehensiveRisk({
      phoneNumber: normalizedNumber,
      contactName,
      communityIntel,
      apiIntel,
      recentReports,
    });
    
    return riskAssessment;
  },
});

// Check multiple external APIs in parallel
async function checkExternalAPIs(ctx: any, phoneNumber: string) {
  const results: any = {
    truecaller: null,
    twilio: null,
    ipqs: null,
    numverify: null,
  };
  
  // Note: In production, you'd make real API calls here
  // For now, this is a structure showing how to integrate them
  
  // Example: Truecaller API check
  // try {
  //   const truecallerKey = await getAPIKey(ctx, "truecaller");
  //   if (truecallerKey) {
  //     const response = await fetch(
  //       `https://api.truecaller.com/v1/search?phone=${phoneNumber}`,
  //       { headers: { "Authorization": `Bearer ${truecallerKey}` } }
  //     );
  //     results.truecaller = await response.json();
  //   }
  // } catch (error) {
  //   console.log("Truecaller API error:", error);
  // }
  
  return results;
}

// Normalize phone number to international format
function normalizePhoneNumber(phone: string): string {
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Add + if missing
  if (!cleaned.startsWith('+')) {
    // Handle Australian numbers starting with 0
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '+61' + cleaned.substring(1);
    }
    // Handle Australian numbers starting with 61
    else if (cleaned.startsWith('61') && cleaned.length === 11) {
      cleaned = '+' + cleaned;
    }
    // Default: assume it needs +
    else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

// Calculate comprehensive risk score
function calculateComprehensiveRisk(data: {
  phoneNumber: string,
  contactName?: string,
  communityIntel: any,
  apiIntel: any,
  recentReports: any[],
}): any {
  let riskScore = 0;
  const reasons: string[] = [];
  const isSavedContact = !!data.contactName && data.contactName !== "Unknown";
  
  // COMMUNITY INTELLIGENCE (0-40 points)
  if (data.communityIntel.totalReports >= 3) {
    const communityRisk = Math.min(data.communityIntel.riskScore * 0.4, 40);
    riskScore += communityRisk;
    
    if (data.communityIntel.totalReports >= 10) {
      reasons.push(`Reported ${data.communityIntel.totalReports} times as scam`);
    } else if (data.communityIntel.totalReports >= 3) {
      reasons.push(`Reported ${data.communityIntel.totalReports} times by community`);
    }
    
    if (data.communityIntel.mostCommonScamType) {
      const scamTypeLabels: Record<string, string> = {
        'impersonation': 'Government impersonation',
        'phishing': 'Phishing attempt',
        'lottery': 'Lottery scam',
        'tech_support': 'Fake tech support',
        'tax_scam': 'Tax/ATO scam',
        'banking': 'Banking fraud',
        'romance': 'Romance scam',
      };
      reasons.push(scamTypeLabels[data.communityIntel.mostCommonScamType] || 'Reported scam activity');
    }
    
    if (data.communityIntel.totalFinancialLoss > 0) {
      reasons.push(`Total losses: $${data.communityIntel.totalFinancialLoss.toLocaleString()}`);
    }
  }
  
  // API INTELLIGENCE (0-30 points)
  if (data.apiIntel) {
    // Truecaller spam score (0-10 scale)
    if (data.apiIntel.truecaller && data.apiIntel.truecaller.spamScore > 7) {
      riskScore += 30;
      reasons.push(`High spam score (${data.apiIntel.truecaller.spamScore}/10)`);
    } else if (data.apiIntel.truecaller && data.apiIntel.truecaller.spamScore > 4) {
      riskScore += 15;
      reasons.push(`Moderate spam score (${data.apiIntel.truecaller.spamScore}/10)`);
    }
    
    // IPQS fraud score (0-100 scale)
    if (data.apiIntel.ipqs && data.apiIntel.ipqs.fraudScore > 85) {
      riskScore += 30;
      reasons.push(`High fraud risk (IPQS: ${data.apiIntel.ipqs.fraudScore}%)`);
    } else if (data.apiIntel.ipqs && data.apiIntel.ipqs.fraudScore > 50) {
      riskScore += 15;
      reasons.push(`Elevated fraud risk (IPQS: ${data.apiIntel.ipqs.fraudScore}%)`);
    }
    
    // VoIP/burner phone detection
    if (data.apiIntel.ipqs && data.apiIntel.ipqs.isVoip) {
      riskScore += 10;
      reasons.push('VoIP or temporary number');
    }
    
    // Invalid number
    if (data.apiIntel.twilio && !data.apiIntel.twilio.valid) {
      riskScore += 20;
      reasons.push('Invalid or disconnected number');
    }
  }
  
  // GEOGRAPHIC ANALYSIS (0-30 points)
  const countryCode = data.phoneNumber.substring(0, 4);
  const highRiskRegions: Record<string, string> = {
    '+234': 'Nigeria',
    '+233': 'Ghana',
    '+254': 'Kenya',
    '+91': 'India',
    '+86': 'China',
    '+92': 'Pakistan',
    '+63': 'Philippines',
  };
  
  if (highRiskRegions[countryCode] || highRiskRegions[countryCode.substring(0, 3)]) {
    const region = highRiskRegions[countryCode] || highRiskRegions[countryCode.substring(0, 3)];
    
    if (isSavedContact) {
      // Much lower penalty for saved contacts
      riskScore += 10;
      reasons.push(`International number from ${region} (verify if unexpected calls)`);
    } else {
      // Higher penalty for unknown callers
      riskScore += 35;
      reasons.push(`Unsaved number from high-risk scam region (${region})`);
    }
  }
  
  // BEHAVIORAL PATTERNS (0-20 points)
  if (data.recentReports.length >= 5) {
    riskScore += 20;
    reasons.push('High frequency reporting pattern');
    
    // Check for geographic mismatches (e.g., claims to be ATO but from Nigeria)
    const hasGeoMismatch = data.recentReports.some((r: any) => 
      (r.claimedToBeFrom?.includes('ATO') || r.claimedToBeFrom?.includes('Tax Office')) &&
      !data.phoneNumber.startsWith('+61')
    );
    
    if (hasGeoMismatch) {
      riskScore += 20;
      reasons.push('Impersonating Australian authority from overseas number');
    }
  }
  
  // Calculate final risk level
  const finalScore = Math.min(riskScore, 100);
  let riskLevel: string;
  
  if (finalScore >= 70) {
    riskLevel = 'known_scam';
  } else if (finalScore >= 50) {
    riskLevel = 'high_risk';
  } else if (finalScore >= 30) {
    riskLevel = 'suspicious';
  } else {
    riskLevel = 'safe';
  }
  
  // Build recommendation
  let recommendation: string;
  if (riskLevel === 'known_scam') {
    recommendation = 'Block immediately and report to authorities';
  } else if (riskLevel === 'high_risk') {
    recommendation = 'Do not answer. Block if calls persist.';
  } else if (riskLevel === 'suspicious') {
    recommendation = 'Verify identity before sharing information';
  } else {
    recommendation = isSavedContact ? 'Contact appears safe' : 'No red flags detected';
  }
  
  return {
    phoneNumber: data.phoneNumber,
    contactName: data.contactName,
    riskScore: finalScore,
    riskLevel,
    reasons: reasons.length > 0 ? reasons : ['No known issues'],
    recommendation,
    communityReports: data.communityIntel.totalReports,
    verifiedReports: data.communityIntel.verifiedReports,
    isSavedContact,
    checkedAt: Date.now(),
  };
}

// Helper to get API key from database
async function getAPIKey(ctx: any, service: string): Promise<string | null> {
  const key = await ctx.db
    .query("apiKeys")
    .withIndex("by_service", (q: any) => q.eq("service", service))
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .first();
  
  return key?.apiKey || null;
}