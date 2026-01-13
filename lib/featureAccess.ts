// Feature Access Control
// Centralized feature gating based on account type and subscription tier

export type AccountType = "personal" | "business" | "charity" | "community";
export type SubscriptionTier = "free" | "starter" | "premium" | "professional" | "enterprise" | "family" | "nonprofit" | "group";

export interface FeatureAccessConfig {
  id: string;
  name: string;
  accountTypes: AccountType[];
  minTier?: Partial<Record<AccountType, SubscriptionTier>>;
  isB2B?: boolean;
  isExclusive?: boolean;
}

// Feature configuration with access control
export const FEATURE_ACCESS: Record<string, FeatureAccessConfig> = {
  // === PERSONAL FEATURES ===
  romanceScam: {
    id: "RomanceScam",
    name: "Romance Scam Protection",
    accountTypes: ["personal", "charity"],
    minTier: { personal: "premium", charity: "nonprofit" },
  },
  rentalSafety: {
    id: "RentalSafety",
    name: "Rental Safety",
    accountTypes: ["personal", "community"],
  },
  familyProtection: {
    id: "FamilyProtection",
    name: "Family Protection Mode",
    accountTypes: ["personal", "charity"],
    minTier: { personal: "family", charity: "nonprofit" },
  },
  investmentScan: {
    id: "InvestmentScan",
    name: "Investment Scam Detector",
    accountTypes: ["personal", "business", "charity", "community"],
    minTier: { personal: "premium" },
  },

  // === BUSINESS FEATURES (B2B) ===
  chargebackShield: {
    id: "ChargebackShield",
    name: "Chargeback Shield",
    accountTypes: ["business"],
    minTier: { business: "starter" },
    isB2B: true,
    isExclusive: true, // Business-only
  },
  becProtection: {
    id: "BECProtection",
    name: "BEC Protection",
    accountTypes: ["business", "personal", "charity"],
    minTier: { business: "starter", personal: "premium", charity: "nonprofit" },
    isB2B: true,
  },
  customerScreening: {
    id: "CustomerScreening",
    name: "Customer Screening",
    accountTypes: ["business"],
    minTier: { business: "starter" },
    isB2B: true,
  },
  tenantScreening: {
    id: "TenantScreening",
    name: "Tenant Screening",
    accountTypes: ["business", "personal"],
    minTier: { business: "starter", personal: "premium" },
  },
  candidateVerification: {
    id: "CandidateVerification",
    name: "Candidate Verification",
    accountTypes: ["business"],
    minTier: { business: "professional" },
    isB2B: true,
  },
  bulkComparison: {
    id: "BulkComparison",
    name: "Bulk Comparison",
    accountTypes: ["business", "charity"],
    minTier: { business: "starter", charity: "nonprofit" },
    isB2B: true,
  },
  analyticsDashboard: {
    id: "AnalyticsDashboard",
    name: "Analytics Dashboard",
    accountTypes: ["business", "charity", "community"],
    minTier: { business: "professional", charity: "nonprofit", community: "group" },
    isB2B: true,
  },
  apiAccess: {
    id: "APIAccess",
    name: "API Access",
    accountTypes: ["business"],
    minTier: { business: "enterprise" },
    isB2B: true,
    isExclusive: true, // Enterprise-only
  },

  // === CHARITY FEATURES ===
  volunteerScreening: {
    id: "VolunteerScreening",
    name: "Volunteer Screening",
    accountTypes: ["charity"],
    minTier: { charity: "nonprofit" },
  },
  donorVerification: {
    id: "DonorVerification",
    name: "Donor Verification",
    accountTypes: ["charity"],
    minTier: { charity: "nonprofit" },
  },
  impactReports: {
    id: "ImpactReports",
    name: "Impact Reports",
    accountTypes: ["charity", "business", "community"],
    minTier: { charity: "nonprofit", business: "professional", community: "group" },
  },

  // === COMMUNITY FEATURES ===
  communityAlerts: {
    id: "CommunityAlerts",
    name: "Community Alerts",
    accountTypes: ["community"],
    minTier: { community: "group" },
  },
  contractorVetting: {
    id: "ContractorVetting",
    name: "Contractor Vetting",
    accountTypes: ["community", "business", "personal"],
  },
  marketplaceSafety: {
    id: "MarketplaceSafety",
    name: "Marketplace Safety",
    accountTypes: ["community", "personal"],
  },

  // === SHARED ADVANCED FEATURES ===
  callScreening: {
    id: "CallScreening",
    name: "Call Screening",
    accountTypes: ["personal", "business", "charity"],
    minTier: { personal: "family", business: "professional", charity: "nonprofit" },
  },
  deepfakeDetection: {
    id: "DeepfakeDetection",
    name: "Deepfake Detection",
    accountTypes: ["personal", "business", "charity"],
    minTier: { personal: "family", business: "professional", charity: "nonprofit" },
  },
};

// Check if user has access to a feature
export function hasFeatureAccess(
  featureId: string,
  userAccountType: AccountType,
  userTier?: SubscriptionTier
): { hasAccess: boolean; reason?: string } {
  const feature = FEATURE_ACCESS[featureId];

  if (!feature) {
    return { hasAccess: true }; // Unknown features are allowed (backward compatibility)
  }

  // Check account type
  if (!feature.accountTypes.includes(userAccountType)) {
    return {
      hasAccess: false,
      reason: feature.isB2B
        ? "This is a business-only feature"
        : `This feature is not available for ${userAccountType} accounts`,
    };
  }

  // Check subscription tier (if required)
  if (feature.minTier && userTier) {
    const requiredTier = feature.minTier[userAccountType];
    if (requiredTier && !meetsMinimumTier(userTier, requiredTier)) {
      return {
        hasAccess: false,
        reason: `Requires ${requiredTier} tier or higher`,
      };
    }
  }

  return { hasAccess: true };
}

// Tier hierarchy for comparison
const TIER_HIERARCHY: Record<AccountType, SubscriptionTier[]> = {
  personal: ["free", "premium", "family"],
  business: ["free", "starter", "professional", "enterprise"],
  charity: ["nonprofit"],
  community: ["group"],
};

function meetsMinimumTier(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  // Find which account type this tier belongs to
  for (const [accountType, tiers] of Object.entries(TIER_HIERARCHY)) {
    if (tiers.includes(userTier) && tiers.includes(requiredTier)) {
      const userIndex = tiers.indexOf(userTier);
      const requiredIndex = tiers.indexOf(requiredTier);
      return userIndex >= requiredIndex;
    }
  }
  return false;
}

// Get all features available to a user
export function getAvailableFeatures(
  userAccountType: AccountType,
  userTier?: SubscriptionTier
): FeatureAccessConfig[] {
  return Object.values(FEATURE_ACCESS).filter((feature) => {
    const { hasAccess } = hasFeatureAccess(feature.id, userAccountType, userTier);
    return hasAccess;
  });
}

// Get B2B-only features
export function getB2BFeatures(): FeatureAccessConfig[] {
  return Object.values(FEATURE_ACCESS).filter((f) => f.isB2B);
}

// Get exclusive features (single account type only)
export function getExclusiveFeatures(accountType: AccountType): FeatureAccessConfig[] {
  return Object.values(FEATURE_ACCESS).filter(
    (f) => f.isExclusive && f.accountTypes.includes(accountType)
  );
}