import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../lib/theme";

type Props = {
  viewer?: any;
  onGoToTab?: (tab: any) => void;
  onNavigateToFeature?: (feature: any) => void;
};

export default function BusinessB2CDashboard({ viewer, onGoToTab, onNavigateToFeature }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Business Dashboard</Text>
            <Text style={styles.subtitle}>Customer protection & fraud prevention</Text>
          </View>
          <TouchableOpacity style={styles.notificationBadge}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>7</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Business Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Performance</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { borderLeftColor: colors.success }]}>
            <Ionicons name="shield-checkmark" size={24} color={colors.success} />
            <Text style={styles.metricValue}>$18.4K</Text>
            <Text style={styles.metricLabel}>Fraud Prevented</Text>
            <Text style={styles.metricChange}>+24% vs yesterday</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: colors.info }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.info} />
            <Text style={styles.metricValue}>1,247</Text>
            <Text style={styles.metricLabel}>Orders Protected</Text>
            <Text style={styles.metricChange}>98.2% safe rate</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: colors.warning }]}>
            <Ionicons name="alert-circle" size={24} color={colors.warning} />
            <Text style={styles.metricValue}>38</Text>
            <Text style={styles.metricLabel}>High-Risk Blocked</Text>
            <Text style={styles.metricChange}>Saved $8.7K</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: colors.error }]}>
            <Ionicons name="ban" size={24} color={colors.error} />
            <Text style={styles.metricValue}>12</Text>
            <Text style={styles.metricLabel}>Chargebacks Stopped</Text>
            <Text style={styles.metricChange}>-58% this month</Text>
          </View>
        </View>
      </View>

      {/* Core Business Tools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Core Business Tools</Text>
        <View style={styles.toolsGrid}>
          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => onNavigateToFeature?.("CustomerScreening")}
          >
            <View style={[styles.toolIcon, { backgroundColor: colors.info + '15' }]}>
              <Ionicons name="person-search" size={32} color={colors.info} />
            </View>
            <Text style={styles.toolTitle}>Customer Screening</Text>
            <Text style={styles.toolDescription}>Verify buyers instantly</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => onNavigateToFeature?.("ChargebackShield")}
          >
            <View style={[styles.toolIcon, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="shield" size={32} color={colors.error} />
            </View>
            <Text style={styles.toolTitle}>Chargeback Shield</Text>
            <Text style={styles.toolDescription}>Pre-shipment checks</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => onNavigateToFeature?.("BulkComparison")}
          >
            <View style={[styles.toolIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="layers" size={32} color={colors.primary} />
            </View>
            <Text style={styles.toolTitle}>Bulk Verification</Text>
            <Text style={styles.toolDescription}>Screen multiple orders</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => onNavigateToFeature?.("AnalyticsDashboard")}
          >
            <View style={[styles.toolIcon, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="analytics" size={32} color={colors.success} />
            </View>
            <Text style={styles.toolTitle}>Fraud Analytics</Text>
            <Text style={styles.toolDescription}>Insights & ROI tracking</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Monthly ROI */}
      <View style={styles.roiCard}>
        <View style={styles.roiHeader}>
          <View style={styles.roiIcon}>
            <Ionicons name="trending-up" size={24} color={colors.success} />
          </View>
          <View style={styles.roiContent}>
            <Text style={styles.roiLabel}>Protected This Month</Text>
            <Text style={styles.roiValue}>$47.8K AUD</Text>
          </View>
        </View>
        <View style={styles.roiStats}>
          <View style={styles.roiStat}>
            <Text style={styles.roiStatValue}>48</Text>
            <Text style={styles.roiStatLabel}>Frauds Blocked</Text>
          </View>
          <View style={styles.roiStat}>
            <Text style={styles.roiStatValue}>724%</Text>
            <Text style={styles.roiStatLabel}>ROI</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => onNavigateToFeature?.("BECProtection")}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary + '15' }]}>
            <Ionicons name="mail-unread" size={20} color={colors.secondary} />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>BEC Protection</Text>
            <Text style={styles.quickActionSubtitle}>Stop invoice redirection</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => onNavigateToFeature?.("APIIntegration")}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="code-slash" size={20} color={colors.primary} />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>API Integration</Text>
            <Text style={styles.quickActionSubtitle}>Connect your platform</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => onGoToTab?.("Security")}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: colors.warning + '15' }]}>
            <Ionicons name="shield" size={20} color={colors.warning} />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>More Protection Tools</Text>
            <Text style={styles.quickActionSubtitle}>Activate additional features</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Business Tip */}
      <View style={styles.tipCard}>
        <View style={styles.tipIcon}>
          <Ionicons name="bulb" size={20} color={colors.info} />
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Business Tip</Text>
          <Text style={styles.tipText}>
            Make screening part of your checkout flow—catch fraud before support tickets and refunds.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  notificationBadge: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#fff",
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.xs,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metricChange: {
    fontSize: 12,
    color: colors.success,
    marginTop: 4,
    fontWeight: "600",
  },
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  toolCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#fff",
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  toolIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
    textAlign: "center",
  },
  toolDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  roiCard: {
    backgroundColor: colors.success + "15",
    padding: spacing.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    marginBottom: spacing.xl,
  },
  roiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  roiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  roiContent: {
    flex: 1,
  },
  roiLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  roiValue: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
  },
  roiStats: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  roiStat: {
    flex: 1,
  },
  roiStatValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  roiStatLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: colors.info + "15",
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  tipIcon: {
    marginRight: spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});