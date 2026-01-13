import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../convex/_generated/api";
import { theme } from "../lib/theme";
import APIConfigScreen from "./APIConfigScreen";
import SecurityDashboardScreen from "./SecurityDashboardScreen";
import { useSafeConvexQuery } from "../hooks/useSafeConvexQuery";

/**
 * ScamVigil - Admin Panel Screen (Mobile)
 * Quick glance dashboard with link to web admin dashboard
 */

type AdminView = "menu" | "api" | "security";

interface AdminScreenProps {
  sessionToken: string;
}

export function AdminScreen({ sessionToken }: AdminScreenProps) {
  const [activeView, setActiveView] = useState<AdminView>("menu");

  const {
    data: tutorialExperiment,
    error: tutorialExperimentError,
  } = useSafeConvexQuery<any>(api.abTests.getExperimentSummary, {
    app: "scamvigil",
    experimentKey: "sv_tutorial_welcome_v1",
  });

  // Mock data for quick stats
  const quickStats = {
    totalUsers: 12847,
    activeToday: 3421,
    monthlyRevenue: 24500,
    openTickets: 8,
    systemHealth: "Healthy",
  };

  const handleOpenWebDashboard = () => {
    Linking.openURL("https://admin.scamvigil.com").catch(() => {
      Alert.alert(
        "Coming Soon",
        "Web admin dashboard will be available at admin.scamvigil.com"
      );
    });
  };

  const renderMenuView = () => (
    <View style={styles.container}>
      {/* Web Dashboard Button */}
      <TouchableOpacity
        style={styles.webDashboardButton}
        onPress={handleOpenWebDashboard}
      >
        <View style={styles.webDashboardContent}>
          <Ionicons name="globe" size={24} color="#fff" />
          <View style={styles.webDashboardText}>
            <Text style={styles.webDashboardTitle}>Open Web Dashboard</Text>
            <Text style={styles.webDashboardSubtitle}>
              Full admin features on desktop
            </Text>
          </View>
        </View>
        <Ionicons name="open-outline" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Quick Stats */}
      <Text style={styles.sectionTitle}>📊 Quick Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color={theme.colors.primary} />
          <Text style={styles.statValue}>{quickStats.totalUsers.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color={theme.colors.warning} />
          <Text style={styles.statValue}>{quickStats.activeToday.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Active Today</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="wallet" size={24} color={theme.colors.success} />
          <Text style={styles.statValue}>${(quickStats.monthlyRevenue / 1000).toFixed(1)}k</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="chatbubble" size={24} color={theme.colors.secondary} />
          <Text style={styles.statValue}>{quickStats.openTickets}</Text>
          <Text style={styles.statLabel}>Open Tickets</Text>
        </View>
      </View>

      {/* Critical Alerts */}
      <Text style={styles.sectionTitle}>🚨 Critical Alerts</Text>
      <View style={styles.alertsContainer}>
        <View style={styles.alertCard}>
          <View style={[styles.alertIcon, { backgroundColor: `${theme.colors.success}15` }]}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>System Healthy</Text>
            <Text style={styles.alertText}>All systems operational</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setActiveView("api")}
        >
          <Ionicons name="key" size={28} color={theme.colors.warning} />
          <Text style={styles.actionTitle}>API Keys</Text>
          <Text style={styles.actionDesc}>Configure services</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setActiveView("security")}
        >
          <Ionicons name="shield-checkmark" size={28} color={theme.colors.error} />
          <Text style={styles.actionTitle}>Security</Text>
          <Text style={styles.actionDesc}>Threat monitoring</Text>
        </TouchableOpacity>
      </View>

      {/* A/B Analytics Status */}
      {tutorialExperimentError && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color={theme.colors.warning} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Backend Not Deployed</Text>
            <Text style={styles.warningText}>
              Analytics backend isn't deployed yet
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderApiTab = () => (
    <APIConfigScreen sessionToken={sessionToken} app="scamvigil" />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        {activeView !== "menu" && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActiveView("menu")}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="shield-checkmark" size={28} color="#fff" />
          </View>
          <View>
            <Text style={styles.title}>Admin Panel</Text>
            <Text style={styles.subtitle}>
              {activeView === "menu" && "Quick Glance"}
              {activeView === "api" && "API Configuration"}
              {activeView === "security" && "Security Monitoring"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeView === "menu" && renderMenuView()}
        {activeView === "api" && renderApiTab()}
        {activeView === "security" && (
          <SecurityDashboardScreen onBack={() => setActiveView("menu")} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: "700",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  webDashboardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  webDashboardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  webDashboardText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  webDashboardTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: "700",
    color: "#fff",
  },
  webDashboardSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: "800",
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  alertsContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: "700",
    color: theme.colors.text,
  },
  alertText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  actionDesc: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${theme.colors.warning}15`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: `${theme.colors.warning}40`,
  },
  warningContent: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  warningTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: "700",
    color: theme.colors.warning,
  },
  warningText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    marginTop: 2,
  },
});

export default AdminScreen;