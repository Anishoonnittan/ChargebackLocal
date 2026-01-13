import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius, shadows } from "../lib/theme";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { UserMode } from "../types/userMode";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type MainTabKey = "Dashboard" | "Scan" | "Security" | "Settings";

interface DashboardScreenProps {
  viewer?: any;
  onGoToTab?: (tab: MainTabKey) => void;
  onNavigateToFeature?: (feature: string) => void;
  mode?: UserMode;
}

/**
 * Redesigned User Dashboard - Chargeback App
 * Modern, engaging, and actionable fraud prevention dashboard
 * Focus: Clear hierarchy, impactful metrics, obvious next actions
 */
export default function DashboardScreen({ viewer, onGoToTab, onNavigateToFeature, mode }: DashboardScreenProps) {
  const user = viewer;
  const profileImageUrl = useQuery(api.users.getProfileImageUrl);
  const stats = useQuery(api.users.getUserStats);
  const trustMetrics = useQuery(api.community.getTrustMetrics);
  const recentScans = useQuery(api.scans.getUserScans, { limit: 5 });

  const [refreshing, setRefreshing] = React.useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Business Metrics (mock data - would come from API)
  const businessMetrics = {
    revenueProtected: 24350,
    transactionsToday: 1847,
    fraudBlocked: 43,
    chargebacksStopped: 17,
    riskScore: 23,
    protectionRate: 98.7,
    savedThisMonth: 67840,
    trendPercentage: 18,
    highRiskOrders: 12,
  };

  // Pulse animation for live status
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => pulse.stop();
  }, [pulseAnim, fadeAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const isEnterprise = mode === "b2b";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Compact Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>{greeting()}</Text>
            <Text style={styles.headerCompany}>{user?.companyName || user?.name || "Business"}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => onGoToTab?.("Settings")}>
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons name={isEnterprise ? "briefcase" : "storefront"} size={20} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Live Protection Status Banner */}
        <Animated.View style={[styles.statusBanner, { opacity: fadeAnim }]}>
          <View style={styles.statusLeft}>
            <Animated.View style={[styles.statusPulse, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>Protection Active</Text>
              <Text style={styles.statusSubtitle}>Monitoring {businessMetrics.transactionsToday} orders</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Ionicons name="shield-checkmark" size={16} color={colors.success} />
            <Text style={styles.statusBadgeText}>Live</Text>
          </View>
        </Animated.View>

        {/* Hero Stats Card - Revenue Protected */}
        <Animated.View style={[styles.heroCard, { opacity: fadeAnim }]}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLabel}>Revenue Protected Today</Text>
              <View style={styles.heroValueRow}>
                <Text style={styles.heroValue}>${(businessMetrics.revenueProtected / 1000).toFixed(1)}K</Text>
                <View style={styles.trendBadge}>
                  <Ionicons name="trending-up" size={12} color={colors.success} />
                  <Text style={styles.trendText}>+{businessMetrics.trendPercentage}%</Text>
                </View>
              </View>
            </View>
            <View style={styles.heroIconContainer}>
              <Ionicons name="shield-checkmark" size={32} color={colors.success} />
            </View>
          </View>
          
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{businessMetrics.transactionsToday}</Text>
              <Text style={styles.heroStatLabel}>Safe Orders</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{businessMetrics.fraudBlocked}</Text>
              <Text style={styles.heroStatLabel}>Blocked</Text>
            </View>
          </View>
        </Animated.View>

        {/* Primary Action - Scan New Order */}
        <TouchableOpacity 
          style={styles.primaryAction}
          onPress={() => onNavigateToFeature?.("ChargebackShield")}
          activeOpacity={0.85}
        >
          <View style={styles.primaryActionIcon}>
            <Ionicons name="scan" size={28} color={colors.textOnPrimary} />
          </View>
          <View style={styles.primaryActionContent}>
            <Text style={styles.primaryActionTitle}>Scan New Order</Text>
            <Text style={styles.primaryActionSubtitle}>Check for fraud before shipping</Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>

        {/* Alert Banner (Conditional) */}
        {businessMetrics.highRiskOrders > 0 && (
          <TouchableOpacity 
            style={styles.alertBanner}
            onPress={() => onNavigateToFeature?.("ChargebackShield")}
          >
            <View style={styles.alertIconContainer}>
              <Ionicons name="warning" size={20} color={colors.error} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{businessMetrics.highRiskOrders} High-Risk Orders</Text>
              <Text style={styles.alertSubtitle}>Review before fulfillment</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.error} />
          </TouchableOpacity>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => onNavigateToFeature?.("ChargebackShield")}
            >
              <View style={styles.quickActionHeader}>
                <View style={[styles.quickActionIcon, { backgroundColor: colors.info + "18" }]}>
                  <Ionicons name="eye" size={24} color={colors.info} />
                </View>
              </View>
              <Text style={styles.quickActionValue}>{businessMetrics.transactionsToday}</Text>
              <Text style={styles.quickActionLabel}>Monitor Orders</Text>
              <View style={styles.quickActionFooter}>
                <Ionicons name="arrow-forward" size={16} color={colors.info} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => onNavigateToFeature?.("AnalyticsDashboard")}
            >
              <View style={styles.quickActionHeader}>
                <View style={[styles.quickActionIcon, { backgroundColor: colors.warning + "18" }]}>
                  <Ionicons name="analytics" size={24} color={colors.warning} />
                </View>
              </View>
              <Text style={styles.quickActionValue}>{businessMetrics.protectionRate}%</Text>
              <Text style={styles.quickActionLabel}>View Insights</Text>
              <View style={styles.quickActionFooter}>
                <Ionicons name="arrow-forward" size={16} color={colors.warning} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Protection Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Protection Breakdown</Text>
          
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownIcon, { backgroundColor: colors.info + "18" }]}>
                  <Ionicons name="scan" size={20} color={colors.info} />
                </View>
                <View>
                  <Text style={styles.breakdownLabel}>Orders Scanned</Text>
                  <Text style={styles.breakdownValue}>{businessMetrics.transactionsToday}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownIcon, { backgroundColor: colors.success + "18" }]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                </View>
                <View>
                  <Text style={styles.breakdownLabel}>Approved</Text>
                  <Text style={styles.breakdownValue}>{businessMetrics.transactionsToday - businessMetrics.fraudBlocked - businessMetrics.highRiskOrders}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownIcon, { backgroundColor: colors.error + "18" }]}>
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </View>
                <View>
                  <Text style={styles.breakdownLabel}>Blocked</Text>
                  <Text style={styles.breakdownValue}>{businessMetrics.fraudBlocked}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownIcon, { backgroundColor: colors.warning + "18" }]}>
                  <Ionicons name="time" size={20} color={colors.warning} />
                </View>
                <View>
                  <Text style={styles.breakdownLabel}>Pending Review</Text>
                  <Text style={styles.breakdownValue}>{businessMetrics.highRiskOrders}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.howItWorksContainer}>
            <View style={styles.howItWorksStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepLabel}>Scan order details</Text>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.howItWorksStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepLabel}>AI analyzes risk</Text>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.howItWorksStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepLabel}>Get instant verdict</Text>
            </View>
          </View>
        </View>

        {/* Info Footer */}
        <View style={styles.infoFooter}>
          <Ionicons name="information-circle" size={16} color={colors.textMuted} />
          <Text style={styles.infoFooterText}>
            87% chargeback rate reduction on average
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxxl + spacing.xl,
  },

  // Compact Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerLeft: {
    flex: 1,
  },
  headerGreeting: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
  headerCompany: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "700",
    marginTop: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profilePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary + "20",
  },

  // Live Protection Status Banner
  statusBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.success + "10",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.success + "20",
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    marginRight: spacing.md,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    ...typography.body,
    color: colors.success,
    fontWeight: "700",
  },
  statusSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success + "15",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  statusBadgeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: "700",
    fontSize: 11,
  },

  // Hero Stats Card
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.success + "20",
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  heroLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  heroValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroValue: {
    ...typography.h1,
    color: colors.success,
    fontWeight: "800",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success + "15",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatsRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
  },
  heroStatValue: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  heroStatLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  // Primary Action
  primaryAction: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.md,
  },
  primaryActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  primaryActionContent: {
    flex: 1,
  },
  primaryActionTitle: {
    ...typography.h4,
    color: colors.textOnPrimary,
    fontWeight: "700",
  },
  primaryActionSubtitle: {
    ...typography.caption,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },

  // Alert Banner
  alertBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.error + "10",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.error + "30",
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...typography.body,
    color: colors.error,
    fontWeight: "700",
  },
  alertSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: spacing.md,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickActionHeader: {
    marginBottom: spacing.md,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionValue: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  quickActionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  quickActionFooter: {
    marginTop: spacing.sm,
  },

  // Protection Breakdown
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breakdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  breakdownLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  breakdownValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    marginTop: 2,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },

  // How It Works
  howItWorksContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  howItWorksStep: {
    flex: 1,
    alignItems: "center",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textOnPrimary,
  },
  stepLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    fontWeight: "600",
  },
  stepConnector: {
    width: 24,
    height: 2,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.xs,
  },

  // Info Footer
  infoFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  infoFooterText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});