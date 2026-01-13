import { Id } from "../convex/_generated/dataModel";

/**
 * TrueProfile Pro Type Definitions
 */

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
  ScanResult: { scanId: Id<"scans"> };
  ReportScam: { profileUrl?: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Scan: undefined;
  Community: undefined;
  Settings: undefined;
};

// Enhanced role-specific user purpose options for Australian businesses
export type UserPurpose = 
  | "immigration_consultant"
  | "real_estate_agent"
  | "education_provider"
  | "community_admin"
  | "small_business"
  | "charity_npo"
  | "personal_use";

export const USER_PURPOSE_OPTIONS = [
  {
    value: "immigration_consultant" as UserPurpose,
    label: "Immigration Consultant",
    icon: "airplane-outline",
    description: "MARA-registered agents fighting visa scams",
    industry: "migration",
  },
  {
    value: "real_estate_agent" as UserPurpose,
    label: "Real Estate Agent",
    icon: "home-outline",
    description: "Property pros dodging rental scammers",
    industry: "real_estate",
  },
  {
    value: "education_provider" as UserPurpose,
    label: "Education Provider",
    icon: "school-outline",
    description: "Unis & colleges protecting student communities",
    industry: "education",
  },
  {
    value: "community_admin" as UserPurpose,
    label: "Community Admin",
    icon: "people-outline",
    description: "Facebook/group admins keeping members safe",
    industry: "community",
  },
  {
    value: "small_business" as UserPurpose,
    label: "Small Business",
    icon: "storefront-outline",
    description: "Local Aussie businesses running Meta Ads",
    industry: "retail",
  },
  {
    value: "charity_npo" as UserPurpose,
    label: "Charity / NPO",
    icon: "heart-outline",
    description: "Non-profits get our free tier — no worries!",
    industry: "nonprofit",
  },
  {
    value: "personal_use" as UserPurpose,
    label: "Personal Use",
    icon: "person-outline",
    description: "Just checking if that profile's legit",
    industry: "personal",
  },
];

// Platform types
export type Platform = "facebook" | "instagram" | "twitter" | "linkedin";

export const PLATFORMS: { value: Platform; label: string; icon: string; color: string }[] = [
  { value: "facebook", label: "Facebook", icon: "logo-facebook", color: "#1877F2" },
  { value: "instagram", label: "Instagram", icon: "logo-instagram", color: "#E4405F" },
  { value: "twitter", label: "Twitter/X", icon: "logo-twitter", color: "#000000" },
  { value: "linkedin", label: "LinkedIn", icon: "logo-linkedin", color: "#0A66C2" },
];

// Scam report types
export type ScamType = "fake_profile" | "phishing" | "impersonation" | "fraud";

export const SCAM_TYPES: { value: ScamType; label: string; icon: string }[] = [
  { value: "fake_profile", label: "Fake Profile", icon: "person-remove" },
  { value: "phishing", label: "Phishing", icon: "fish" },
  { value: "impersonation", label: "Impersonation", icon: "people" },
  { value: "fraud", label: "Fraud", icon: "warning" },
];

// Australian states for reporting
export const AU_STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "WA", label: "Western Australia" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NT", label: "Northern Territory" },
];

// Insight type for scan results
export interface ScanInsight {
  type: "warning" | "info" | "positive";
  icon: string;
  message: string;
}

// Trust Score rating
export interface TrustRating {
  score: number;
  label: "Real" | "Suspicious" | "Fake";
  color: string;
  emoji: string;
}

export function getTrustRating(score: number): TrustRating {
  if (score >= 70) {
    return { score, label: "Real", color: "#22C55E", emoji: "🟢" };
  }
  if (score >= 40) {
    return { score, label: "Suspicious", color: "#F59E0B", emoji: "🟡" };
  }
  return { score, label: "Fake", color: "#EF4444", emoji: "🔴" };
}

// Enhanced scan result with PDF report support
export interface ScanResult {
  scanId: string;
  profileUrl: string;
  platform: string;
  trustScore: number;
  riskLevel: "real" | "suspicious" | "fake";
  insights: Array<{
    type: "warning" | "positive" | "info";
    text: string;
    category?: string;
  }>;
  scamPhrases: string[];
  reasoning?: string;
  timestamp: number;
  estimatedSavings?: number;
}

// Bulk scan summary for reports
export interface BulkScanSummary {
  totalProfiles: number;
  realCount: number;
  suspiciousCount: number;
  fakeCount: number;
  estimatedSavings: number;
  topScamTypes: Array<{ type: string; count: number }>;
  scanDate: string;
  context?: string;
}

// PDF Report configuration
export interface ReportConfig {
  title: string;
  businessName?: string;
  logoUrl?: string;
  includeInsights: boolean;
  includeRecommendations: boolean;
  format: "summary" | "detailed";
}

// White-label partner configuration
export interface WhiteLabelConfig {
  partnerId: string;
  brandName: string;
  primaryColor: string;
  logoUrl?: string;
  supportEmail: string;
  customDomain?: string;
}