import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, shadows } from "../lib/theme";

interface HomeScreenProps {
  orders: any[];
  monitoringCount: number;
  alertsCount: number;
  blockedCount: number;
  revenueProtected: number;
  onNavigateToScan: () => void;
  onNavigateToMonitor: () => void;
  onNavigateToAlerts: () => void;
  onNavigateToInsights: () => void;
}

function formatCurrencyUSD(amount: number) {
  return `$${Math.round(amount).toLocaleString()}`;
}

export const ChargebackShieldHomeScreen: React.FC<HomeScreenProps> = ({
  monitoringCount,
  alertsCount,
  blockedCount,
  revenueProtected,
  onNavigateToScan,
  onNavigateToMonitor,
  onNavigateToAlerts,
  onNavigateToInsights,
}) => {
  // Calculate savings percentage (mock calculation for demo)
  const potentialLoss = revenueProtected + (blockedCount * 150); // Avg $150 per chargeback
  const savingsPercent = potentialLoss > 0 ? Math.round((revenueProtected / potentialLoss) * 100) : 0;

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Status Banner */}
      <View style={styles.statusBanner}>
        <View style={styles.statusIndicator}>
          <View style={styles.pulseDot} />
          <View style={[styles.pulseDot, styles.pulseRing]} />
        </View>
        <Text style={styles.statusText}>
          Protection Active • Monitoring {monitoringCount} orders
        </Text>
      </View>

      {/* Revenue Protected - Hero Stats */}
      <View style={styles.heroStatsCard}>
        <View style={styles.heroStatsHeader}>
          <Text style={styles.heroStatsLabel}>Revenue Protected</Text>
          <View style={styles.trendBadge}>
            <Ionicons name="trending-up" size={12} color={colors.success} />
            <Text style={styles.trendText}>+{savingsPercent}%</Text>
          </View>
        </View>
        <Text style={styles.heroStatsValue}>{formatCurrencyUSD(revenueProtected)}</Text>
        <View style={styles.heroStatsSubrow}>
          <View style={styles.miniStat}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.miniStatText}>Safe Orders: {monitoringCount - blockedCount}</Text>
          </View>
          <View style={styles.miniStat}>
            <Ionicons name="shield-checkmark" size={16} color={colors.error} />
            <Text style={styles.miniStatText}>Blocked: {blockedCount}</Text>
          </View>
        </View>
      </View>

      {/* Primary Action - Scan */}
      <TouchableOpacity style={styles.primaryAction} onPress={onNavigateToScan} activeOpacity={0.92}>
        <View style={styles.primaryActionContent}>
          <View style={styles.primaryActionLeft}>
            <View style={styles.primaryActionIconContainer}>
              <Ionicons name="scan" size={24} color={colors.textOnPrimary} />
            </View>
            <View style={styles.primaryActionText}>
              <Text style={styles.primaryActionTitle}>Scan New Order</Text>
              <Text style={styles.primaryActionSubtitle}>Get instant fraud risk assessment</Text>
            </View>
          </View>
          <View style={styles.primaryActionArrow}>
            <Ionicons name="arrow-forward-circle" size={32} color="rgba(255,255,255,0.95)" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Alert Banner (conditional) */}
      {alertsCount > 0 && (
        <TouchableOpacity style={styles.alertBanner} onPress={onNavigateToAlerts} activeOpacity={0.9}>
          <View style={styles.alertBannerIcon}>
            <Ionicons name="warning" size={20} color={colors.error} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertBannerTitle}>
              {alertsCount} High-Risk {alertsCount === 1 ? "Order" : "Orders"}
            </Text>
            <Text style={styles.alertBannerSubtitle}>Requires immediate review</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.error} />
        </TouchableOpacity>
      )}

      {/* Quick Actions Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionCard
            title="Monitor"
            value={monitoringCount.toString()}
            subtitle="Active orders"
            icon="pulse"
            color={colors.info}
            onPress={onNavigateToMonitor}
          />
          <QuickActionCard
            title="Insights"
            value="View"
            subtitle="Performance"
            icon="analytics"
            color="#8B5CF6"
            onPress={onNavigateToInsights}
          />
        </View>
      </View>

      {/* Protection Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Protection Breakdown</Text>
        <View style={styles.breakdownCard}>
          <BreakdownRow
            icon="shield-checkmark"
            label="Orders Scanned"
            value={(monitoringCount + blockedCount).toString()}
            color={colors.info}
          />
          <View style={styles.breakdownDivider} />
          <BreakdownRow
            icon="checkmark-circle"
            label="Approved & Monitoring"
            value={monitoringCount.toString()}
            color={colors.success}
          />
          <View style={styles.breakdownDivider} />
          <BreakdownRow
            icon="ban"
            label="Blocked (High Risk)"
            value={blockedCount.toString()}
            color={colors.error}
          />
          {alertsCount > 0 && (
            <>
              <View style={styles.breakdownDivider} />
              <BreakdownRow
                icon="warning"
                label="Pending Review"
                value={alertsCount.toString()}
                color={colors.warning}
              />
            </>
          )}
        </View>
      </View>

      {/* How It Works - Collapsed */}
      <View style={styles.section}>
        <View style={styles.howItWorksHeader}>
          <Ionicons name="help-circle" size={20} color={colors.textMuted} />
          <Text style={styles.howItWorksTitle}>How ChargebackShield Works</Text>
        </View>
        <View style={styles.howItWorksContent}>
          <ProcessStep number={1} label="Scan orders before shipping" />
          <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
          <ProcessStep number={2} label="AI assesses fraud risk" />
          <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
          <ProcessStep number={3} label="Monitor for 120 days" />
        </View>
      </View>

      {/* Info Footer */}
      <View style={styles.infoFooter}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
        <Text style={styles.infoFooterText}>
          Average chargeback rate reduced by 87% with active monitoring
        </Text>
      </View>

      <View style={styles.footerSpacing} />
    </ScrollView>
  );
};

function QuickActionCard({
  title,
  value,
  subtitle,
  icon,
  color,
  onPress,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionValue}>{value}</Text>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      <View style={styles.quickActionArrow}>
        <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function BreakdownRow({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.breakdownRow}>
      <View style={[styles.breakdownIcon, { backgroundColor: `${color}12` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownValue}>{value}</Text>
    </View>
  );
}

function ProcessStep({ number, label }: { number: number; label: string }) {
  return (
    <View style={styles.processStep}>
      <View style={styles.processStepNumber}>
        <Text style={styles.processStepNumberText}>{number}</Text>
      </View>
      <Text style={styles.processStepLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.success}30`,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    position: "absolute",
  },
  pulseRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.success,
    opacity: 0.4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  heroStatsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  heroStatsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  heroStatsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
  },
  heroStatsValue: {
    fontSize: 36,
    fontWeight: "900",
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -1,
  },
  heroStatsSubrow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  miniStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniStatText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  primaryAction: {
    backgroundColor: colors.info,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: "hidden",
    ...shadows.lg,
  },
  primaryActionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.xl,
  },
  primaryActionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  primaryActionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.textOnPrimary,
    marginBottom: 4,
  },
  primaryActionSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  primaryActionArrow: {
    marginLeft: spacing.md,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  alertBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  alertBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.error,
    marginBottom: 2,
  },
  alertBannerSubtitle: {
    fontSize: 12,
    color: colors.error,
    opacity: 0.85,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  quickActionValue: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  quickActionArrow: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  breakdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
  howItWorksHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  howItWorksTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  howItWorksContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  processStep: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
  },
  processStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.info,
  },
  processStepNumberText: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.info,
  },
  processStepLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  infoFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  infoFooterText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  footerSpacing: {
    height: spacing.lg,
  },
});