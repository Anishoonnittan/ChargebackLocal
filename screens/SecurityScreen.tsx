import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, skip } from "convex/react";
import { api } from "../convex/_generated/api";
import { colors, spacing, borderRadius, shadows } from "../lib/theme";
import FeatureTooltip from "../components/FeatureTooltip";

type AccountType = "personal" | "business" | "charity" | "community";

interface SecurityScreenProps {
  viewer?: any;
  sessionToken?: string;
  onNavigate?: (screen: string) => void;
  onNavigateToFeature?: (featureId: string) => void;
}

interface FeatureConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  segments: AccountType[];
  badge?: string;
}

// Quick Actions - Most common immediate needs
const QUICK_ACTIONS: FeatureConfig[] = [
  {
    id: "InvestmentScan",
    title: "Scan Investment",
    description: "Check crypto, stocks & platforms",
    icon: "trending-up",
    color: colors.warning,
    segments: ["personal", "business", "charity", "community"],
  },
  {
    id: "RomanceScam",
    title: "Check Profile",
    description: "Verify dating profiles",
    icon: "heart",
    color: colors.error,
    segments: ["personal", "charity"],
    badge: "NEW",
  },
  {
    id: "MarketplaceSafety",
    title: "Check Seller",
    description: "Verify before buying",
    icon: "storefront",
    color: colors.secondary,
    segments: ["personal", "community"],
  },
  {
    id: "BECProtection",
    title: "Verify Email",
    description: "Check before wire transfer",
    icon: "mail",
    color: colors.info,
    segments: ["personal", "business", "charity"],
  },
];

// Before You Trust - Pre-transaction verification
const BEFORE_TRUST: FeatureConfig[] = [
  {
    id: "TenantScreening",
    title: "Screen Tenant",
    description: "Vet renters before leasing",
    icon: "person-add",
    color: colors.primary,
    segments: ["personal", "business"],
  },
  {
    id: "RentalSafety",
    title: "Check Landlord",
    description: "Verify properties & owners",
    icon: "home",
    color: colors.success,
    segments: ["personal", "community"],
  },
  {
    id: "ContractorVetting",
    title: "Vet Contractor",
    description: "Screen before hiring",
    icon: "hammer",
    color: colors.warning,
    segments: ["personal", "business", "community"],
  },
  {
    id: "CandidateVerification",
    title: "Screen Candidate",
    description: "Verify job applicants",
    icon: "briefcase",
    color: colors.primary,
    segments: ["business"],
  },
  {
    id: "VolunteerScreening",
    title: "Screen Volunteer",
    description: "Vet before they start",
    icon: "hand-left",
    color: colors.warning,
    segments: ["charity"],
  },
  {
    id: "DonorVerification",
    title: "Verify Donor",
    description: "Check donations",
    icon: "gift",
    color: colors.secondary,
    segments: ["charity"],
  },
];

// Ongoing Protection - Active monitoring
const ONGOING_PROTECTION: FeatureConfig[] = [
  {
    id: "ChargebackShield",
    title: "Chargeback Shield",
    description: "Real-time fraud detection",
    icon: "card",
    color: colors.primary,
    segments: ["business"],
    badge: "NEW",
  },
  {
    id: "CallScreening",
    title: "Call Screening",
    description: "Record suspicious calls",
    icon: "call",
    color: colors.info,
    segments: ["personal", "business", "charity"],
  },
  {
    id: "DeepfakeDetection",
    title: "Deepfake Detection",
    description: "Verify voice authenticity",
    icon: "mic",
    color: colors.error,
    segments: ["personal", "business", "charity"],
  },
  {
    id: "FamilyProtection",
    title: "Family Protection",
    description: "Protect elderly from scams",
    icon: "shield-checkmark",
    color: colors.primary,
    segments: ["personal", "charity"],
  },
];

// Respond & Report - Post-incident tools
const RESPOND_REPORT: FeatureConfig[] = [
  {
    id: "CommunityAlerts",
    title: "Community Alerts",
    description: "Share scam alerts",
    icon: "megaphone",
    color: colors.error,
    segments: ["community"],
    badge: "NEW",
  },
  {
    id: "BulkComparison",
    title: "Bulk Scan",
    description: "Scan 100+ profiles",
    icon: "file-tray-full",
    color: colors.secondary,
    segments: ["business", "charity"],
  },
  {
    id: "ImpactReports",
    title: "Impact Reports",
    description: "Generate stakeholder reports",
    icon: "document-text",
    color: colors.info,
    segments: ["business", "charity", "community"],
  },
];

export default function SecurityScreen({
  viewer,
  sessionToken,
  onNavigate,
  onNavigateToFeature,
}: SecurityScreenProps) {
  const [showScrollArrow, setShowScrollArrow] = React.useState(true);
  const scrollArrowOpacity = React.useRef(new Animated.Value(1)).current;

  const viewerFromSession = useQuery(
    api.auth.getCurrentUser,
    sessionToken ? { sessionToken } : skip
  );

  const effectiveUser = viewer ?? viewerFromSession;
  const accountType = ((effectiveUser as any)?.accountType || "personal") as AccountType;

  const navigateTo = (screen: string) => {
    onNavigateToFeature?.(screen);
    onNavigate?.(screen);
  };

  // Filter features by account segment
  const filterBySegment = (features: FeatureConfig[]) =>
    features.filter((f) => f.segments.includes(accountType));

  const quickActions = filterBySegment(QUICK_ACTIONS);
  const beforeTrust = filterBySegment(BEFORE_TRUST);
  const ongoingProtection = filterBySegment(ONGOING_PROTECTION);
  const respondReport = filterBySegment(RESPOND_REPORT);

  const handleQuickActionsScroll = (event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const isNearEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 20;
    
    if (isNearEnd && showScrollArrow) {
      Animated.timing(scrollArrowOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowScrollArrow(false));
    } else if (!isNearEnd && !showScrollArrow) {
      setShowScrollArrow(true);
      Animated.timing(scrollArrowOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const renderQuickAction = (feature: FeatureConfig) => (
    <TouchableOpacity
      key={feature.id}
      style={styles.quickActionCard}
      onPress={() => navigateTo(feature.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: feature.color }]}>
        <Ionicons name={feature.icon as any} size={28} color="#fff" />
      </View>
      <Text style={styles.quickActionTitle} numberOfLines={2}>
        {feature.title}
      </Text>
      <Text style={styles.quickActionDesc} numberOfLines={1}>
        {feature.description}
      </Text>
      {feature.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{feature.badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFeatureRow = (feature: FeatureConfig) => (
    <TouchableOpacity
      key={feature.id}
      style={styles.featureRow}
      onPress={() => navigateTo(feature.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.featureIcon, { backgroundColor: feature.color + "15" }]}>
        <Ionicons name={feature.icon as any} size={24} color={feature.color} />
      </View>
      <View style={styles.featureContent}>
        <View style={styles.featureTitleRow}>
          <Text style={styles.featureTitle}>{feature.title}</Text>
          {feature.badge && (
            <View style={[styles.badge, styles.badgeInline]}>
              <Text style={styles.badgeText}>{feature.badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.featureDesc}>{feature.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  const renderWorkflowSection = (
    title: string,
    subtitle: string,
    icon: string,
    features: FeatureConfig[]
  ) => {
    if (features.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name={icon as any} size={24} color={colors.primary} />
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          </View>
        </View>
        {features.map(renderFeatureRow)}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Protection Center</Text>
          <Text style={styles.headerSubtitle}>
            Verify people & transactions before you trust
          </Text>
        </View>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <View style={styles.quickActionsSection}>
            <FeatureTooltip
              featureId="sv_quick_actions"
              title="Start here"
              message="Quick Actions are the fastest way to pick the right protection tool. Swipe to see more."
            >
              <Text style={styles.quickActionsTitle}>⚡️ Quick Actions</Text>
            </FeatureTooltip>
            <View style={styles.quickActionsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickActionsScroll}
                onScroll={handleQuickActionsScroll}
                scrollEventThrottle={16}
              >
                {quickActions.map(renderQuickAction)}
              </ScrollView>
              {showScrollArrow && (
                <Animated.View 
                  style={[
                    styles.scrollArrow,
                    { opacity: scrollArrowOpacity }
                  ]}
                >
                  <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                </Animated.View>
              )}
            </View>
          </View>
        )}

        {/* Workflow Sections */}
        {renderWorkflowSection(
          "Before You Trust",
          "Verify people before engaging",
          "search",
          beforeTrust
        )}
        {renderWorkflowSection(
          "Ongoing Protection",
          "Active monitoring & alerts",
          "shield-checkmark",
          ongoingProtection
        )}
        {renderWorkflowSection(
          "Respond & Report",
          "Post-incident tools",
          "megaphone",
          respondReport
        )}

        {/* Help Tip */}
        <View style={styles.helpTip}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
          <Text style={styles.helpText}>Tap any tool to start protecting yourself</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Quick Actions
  quickActionsSection: {
    marginVertical: spacing.lg,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  quickActionsContainer: {
    position: "relative",
  },
  quickActionsScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  quickActionCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.md,
    position: "relative",
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
    minHeight: 36,
  },
  quickActionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  scrollArrow: {
    position: "absolute",
    right: spacing.lg,
    top: "50%",
    transform: [{ translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Workflow Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Feature Rows
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    minHeight: 72,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Badge
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeInline: {
    position: "relative",
    top: 0,
    right: 0,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },

  // Help Tip
  helpTip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  helpText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});