import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing } from "../../lib/theme";
import type { BusinessUser } from "../types";

// Mock analytics data
const MOCK_ANALYTICS = {
  totalOrdersScanned: 2847,
  chargebacksBlocked: 156,
  chargebacksFiled: 23,
  chargebackRate: 0.81,
  totalSavings: 45230,
  disputesWon: 18,
  disputesLost: 5,
  averageRecoveryTime: 14,
};

const MOCK_TIMELINE = [
  {
    date: "Today",
    orders: 45,
    blocked: 3,
    saved: 1250,
  },
  {
    date: "Yesterday",
    orders: 52,
    blocked: 2,
    saved: 890,
  },
  {
    date: "2 days ago",
    orders: 38,
    blocked: 4,
    saved: 2100,
  },
  {
    date: "3 days ago",
    orders: 41,
    blocked: 2,
    saved: 1560,
  },
];

export default function AnalyticsScreen({
  viewer,
  sessionToken,
}: {
  viewer: BusinessUser;
  sessionToken: string;
}) {
  const [timeRange, setTimeRange] = useState("week");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="bar-chart" size={32} color={colors.primary} />
          <Text style={styles.title}>ROI Analytics</Text>
          <Text style={styles.subtitle}>Track your savings & performance</Text>
        </View>

        {/* Time Range Filter */}
        <View style={styles.timeRangeContainer}>
          {["day", "week", "month", "year"].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Savings Card */}
        <View style={styles.savingsCard}>
          <View style={styles.savingsIconContainer}>
            <Ionicons name="cash" size={40} color={colors.success} />
          </View>
          <Text style={styles.savingsLabel}>Total Saved</Text>
          <Text style={styles.savingsAmount}>
            ${MOCK_ANALYTICS.totalSavings.toLocaleString()}
          </Text>
          <Text style={styles.savingsDetails}>
            From {MOCK_ANALYTICS.disputesWon} disputed chargebacks won
          </Text>
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
            </View>
            <Text style={styles.metricValue}>
              {MOCK_ANALYTICS.totalOrdersScanned}
            </Text>
            <Text style={styles.metricLabel}>Orders Scanned</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="checkmark-circle" size={28} color={colors.success} />
            </View>
            <Text style={styles.metricValue}>
              {MOCK_ANALYTICS.chargebacksBlocked}
            </Text>
            <Text style={styles.metricLabel}>Blocked</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="alert-circle" size={28} color={colors.error} />
            </View>
            <Text style={styles.metricValue}>
              {MOCK_ANALYTICS.chargebackRate}%
            </Text>
            <Text style={styles.metricLabel}>Chargeback Rate</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="timer" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.metricValue}>
              {MOCK_ANALYTICS.averageRecoveryTime}d
            </Text>
            <Text style={styles.metricLabel}>Avg Recovery</Text>
          </View>
        </View>

        {/* Dispute Performance */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Dispute Performance</Text>
          <View style={styles.performanceCard}>
            <View style={styles.performanceRow}>
              <View style={styles.performanceLabel}>
                <Ionicons name="checkmark" size={20} color={colors.success} />
                <Text style={styles.performanceText}>Disputes Won</Text>
              </View>
              <Text style={styles.performanceValue}>
                {MOCK_ANALYTICS.disputesWon}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(MOCK_ANALYTICS.disputesWon / (MOCK_ANALYTICS.disputesWon + MOCK_ANALYTICS.disputesLost)) * 100}%`,
                    backgroundColor: colors.success,
                  },
                ]}
              />
            </View>

            <View style={styles.performanceRow}>
              <View style={styles.performanceLabel}>
                <Ionicons name="close" size={20} color={colors.error} />
                <Text style={styles.performanceText}>Disputes Lost</Text>
              </View>
              <Text style={styles.performanceValue}>
                {MOCK_ANALYTICS.disputesLost}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(MOCK_ANALYTICS.disputesLost / (MOCK_ANALYTICS.disputesWon + MOCK_ANALYTICS.disputesLost)) * 100}%`,
                    backgroundColor: colors.error,
                  },
                ]}
              />
            </View>

            <View style={styles.winRateContainer}>
              <Text style={styles.winRateLabel}>Win Rate</Text>
              <Text style={styles.winRate}>
                {(
                  (MOCK_ANALYTICS.disputesWon /
                    (MOCK_ANALYTICS.disputesWon +
                      MOCK_ANALYTICS.disputesLost)) *
                  100
                ).toFixed(0)}
                %
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Timeline */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <FlatList
            data={MOCK_TIMELINE}
            keyExtractor={(item: (typeof MOCK_TIMELINE)[number], index: number) => index.toString()}
            renderItem={({ item }: { item: (typeof MOCK_TIMELINE)[number] }) => (
              <View style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <Text style={styles.timelineDate}>{item.date}</Text>
                  <Text style={styles.timelineStats}>
                    {item.orders} orders, {item.blocked} blocked
                  </Text>
                </View>
                <View style={styles.timelineRight}>
                  <Text style={styles.timelineSavings}>+${item.saved}</Text>
                </View>
              </View>
            )}
          />
        </View>

        {/* Upgrade Prompt */}
        {viewer.tier === "free" && (
          <View style={styles.upgradeCard}>
            <Ionicons name="star" size={40} color="#F59E0B" />
            <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
            <Text style={styles.upgradeText}>
              Get advanced analytics, API access, and dedicated support
            </Text>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        )}
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
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  timeRangeContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  timeRangeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeRangeText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  timeRangeTextActive: {
    color: "white",
  },
  savingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: "center",
  },
  savingsIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  savingsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  savingsAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.success,
    marginBottom: spacing.xs,
  },
  savingsDetails: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: "center",
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  performanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  performanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  performanceLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  performanceText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  performanceValue: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  winRateContainer: {
    alignItems: "center",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  winRateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  winRate: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
  },
  timelineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  timelineLeft: {
    flex: 1,
  },
  timelineDate: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  timelineStats: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  timelineRight: {
    alignItems: "flex-end",
  },
  timelineSavings: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.success,
  },
  upgradeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: "#F59E0B",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  upgradeTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  upgradeText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  upgradeButton: {
    backgroundColor: "#F59E0B",
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  upgradeButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});