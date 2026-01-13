import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../lib/theme";

type Props = {
  viewer?: any;
  onGoToTab?: (tab: any) => void;
  onNavigateToFeature?: (feature: any) => void;
};

export default function CharityDashboard({ viewer, onGoToTab, onNavigateToFeature }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Charity Protection</Text>
            <Text style={styles.subtitle}>Safeguarding your mission & donors</Text>
          </View>
          <TouchableOpacity style={styles.notificationBadge}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Safety Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Protection Impact</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { borderLeftColor: colors.info }]}>
            <Ionicons name="people" size={24} color={colors.info} />
            <Text style={styles.metricValue}>284</Text>
            <Text style={styles.metricLabel}>Volunteers Screened</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: colors.success }]}>
            <Ionicons name="cash" size={24} color={colors.success} />
            <Text style={styles.metricValue}>1,847</Text>
            <Text style={styles.metricLabel}>Donors Verified</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: colors.error }]}>
            <Ionicons name="shield-checkmark" size={24} color={colors.error} />
            <Text style={styles.metricValue}>$87.2K</Text>
            <Text style={styles.metricLabel}>Fraud Prevented</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: colors.secondary }]}>
            <Ionicons name="bar-chart" size={24} color={colors.secondary} />
            <Text style={styles.metricValue}>98.6%</Text>
            <Text style={styles.metricLabel}>Trust Score</Text>
          </View>
        </View>
      </View>

      {/* Core Charity Tools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Core Protection Tools</Text>
        <View style={styles.toolsGrid}>
          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => onNavigateToFeature?.("VolunteerScreening")}
          >
            <View style={[styles.toolIcon, { backgroundColor: colors.info + '15' }]}>
              <Ionicons name="people" size={32} color={colors.info} />
            </View>
            <Text style={styles.toolTitle}>Volunteer Screening</Text>
            <Text style={styles.toolDescription}>Safe onboarding</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => onNavigateToFeature?.("DonorVerification")}
          >
            <View style={[styles.toolIcon, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="cash" size={32} color={colors.success} />
            </View>
            <Text style={styles.toolTitle}>Donor Verification</Text>
            <Text style={styles.toolDescription}>Validate donations</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => onNavigateToFeature?.("ImpactReports")}
          >
            <View style={[styles.toolIcon, { backgroundColor: colors.secondary + '15' }]}>
              <Ionicons name="bar-chart" size={32} color={colors.secondary} />
            </View>
            <Text style={styles.toolTitle}>Impact Reports</Text>
            <Text style={styles.toolDescription}>Show outcomes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => onGoToTab?.("Scan")}
          >
            <View style={[styles.toolIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="search" size={32} color={colors.primary} />
            </View>
            <Text style={styles.toolTitle}>Profile Scanner</Text>
            <Text style={styles.toolDescription}>Quick safety check</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => onNavigateToFeature?.("BeneficiaryVerification")}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: colors.warning + '15' }]}>
            <Ionicons name="person-add" size={20} color={colors.warning} />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>Beneficiary Verification</Text>
            <Text style={styles.quickActionSubtitle}>Verify aid recipients</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => onNavigateToFeature?.("DonationFraudProtection")}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: colors.error + '15' }]}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>Donation Fraud Protection</Text>
            <Text style={styles.quickActionSubtitle}>Detect suspicious donations</Text>
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

      {/* Charity Tip */}
      <View style={styles.tipCard}>
        <View style={styles.tipIcon}>
          <Ionicons name="bulb" size={20} color={colors.secondary} />
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Best Practice</Text>
          <Text style={styles.tipText}>
            Use volunteer screening before granting access to donor lists, finances, or admin accounts.
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
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.xs,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
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
    backgroundColor: colors.secondary + "15",
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
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