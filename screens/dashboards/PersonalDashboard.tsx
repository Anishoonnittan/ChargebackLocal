import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../lib/theme";

type Props = {
  viewer?: any;
  onGoToTab?: (tab: any) => void;
  onNavigateToFeature?: (feature: any) => void;
};

export default function PersonalDashboard({ viewer, onGoToTab, onNavigateToFeature }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back{viewer?.name ? `, ${viewer.name}` : ''}!</Text>
            <Text style={styles.subtitle}>Personal Safety Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.notificationBadge}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Safety Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Protection</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { borderLeftColor: colors.primary }]}>
            <Ionicons name="search" size={24} color={colors.primary} />
            <Text style={styles.metricValue}>12</Text>
            <Text style={styles.metricLabel}>Scans Today</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: colors.success }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.metricValue}>8</Text>
            <Text style={styles.metricLabel}>Safe Profiles</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: colors.error }]}>
            <Ionicons name="warning" size={24} color={colors.error} />
            <Text style={styles.metricValue}>3</Text>
            <Text style={styles.metricLabel}>Threats Blocked</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: colors.warning }]}>
            <Ionicons name="shield-checkmark" size={24} color={colors.warning} />
            <Text style={styles.metricValue}>47</Text>
            <Text style={styles.metricLabel}>Total Protected</Text>
          </View>
        </View>
      </View>

      {/* Core Safety Tools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Core Safety Tools</Text>
        <View style={styles.toolsGrid}>
          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => onGoToTab?.("Scan")}
          >
            <View style={[styles.toolIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="search" size={32} color={colors.primary} />
            </View>
            <Text style={styles.toolTitle}>Profile Scanner</Text>
            <Text style={styles.toolDescription}>Check social profiles</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => onGoToTab?.("Scan")}
          >
            <View style={[styles.toolIcon, { backgroundColor: colors.info + '15' }]}>
              <Ionicons name="link" size={32} color={colors.info} />
            </View>
            <Text style={styles.toolTitle}>Link Checker</Text>
            <Text style={styles.toolDescription}>Verify URLs & emails</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => onNavigateToFeature?.("RomanceScam")}
          >
            <View style={[styles.toolIcon, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="heart" size={32} color={colors.error} />
            </View>
            <Text style={styles.toolTitle}>Romance Guard</Text>
            <Text style={styles.toolDescription}>Spot dating scams</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => onGoToTab?.("Scan")}
          >
            <View style={[styles.toolIcon, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="chatbubbles" size={32} color={colors.success} />
            </View>
            <Text style={styles.toolTitle}>SMS Scanner</Text>
            <Text style={styles.toolDescription}>Check text messages</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => onNavigateToFeature?.("RentalSafety")}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: colors.info + '15' }]}>
            <Ionicons name="home" size={20} color={colors.info} />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>Rental Safety Check</Text>
            <Text style={styles.quickActionSubtitle}>Avoid fake listings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => onNavigateToFeature?.("FamilyProtection")}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="people" size={20} color={colors.success} />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>Family Protection</Text>
            <Text style={styles.quickActionSubtitle}>Protect loved ones</Text>
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

      {/* Safety Tip */}
      <View style={styles.tipCard}>
        <View style={styles.tipIcon}>
          <Ionicons name="bulb" size={20} color={colors.warning} />
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Safety Tip</Text>
          <Text style={styles.tipText}>
            If someone pressures you to pay quickly, scan first — urgency is a top scam signal.
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
    backgroundColor: colors.warning + "15",
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
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