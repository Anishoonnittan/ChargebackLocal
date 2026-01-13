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
import { colors, typography, spacing } from "../../lib/theme";
import SecurityDashboardScreen from "../../screens/SecurityDashboardScreen";
import APIConfigScreen from "../../screens/APIConfigScreen";
import AdminSupportDashboardScreen from "../../screens/AdminSupportDashboardScreen";
import AdminTicketDetailScreen from "../../screens/AdminTicketDetailScreen";
import CannedResponsesScreen from "../../screens/CannedResponsesScreen";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * ChargebackShield - Admin Panel Screen (Mobile)
 * Quick glance dashboard with link to web admin dashboard
 */

type AdminView = "menu" | "security" | "apikeys" | "support" | "ticketDetail" | "canned";

interface BusinessAdminScreenProps {
  sessionToken: string;
  onBack: () => void;
}

export function BusinessAdminScreen({ sessionToken, onBack }: BusinessAdminScreenProps) {
  const [activeView, setActiveView] = useState<AdminView>("menu");
  const [selectedTicketId, setSelectedTicketId] = useState<Id<"supportTickets"> | null>(null);

  // Mock data for quick stats
  const quickStats = {
    totalMerchants: 3421,
    activeToday: 892,
    monthlyRevenue: 156000,
    openDisputes: 24,
    systemHealth: "Healthy",
  };

  const handleOpenWebDashboard = () => {
    Linking.openURL("https://admin.chargebackshield.com").catch(() => {
      Alert.alert(
        "Coming Soon",
        "Web admin dashboard will be available at admin.chargebackshield.com"
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
          <Ionicons name="storefront" size={24} color={colors.primary} />
          <Text style={styles.statValue}>{quickStats.totalMerchants.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Merchants</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color={colors.warning} />
          <Text style={styles.statValue}>{quickStats.activeToday.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Active Today</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="wallet" size={24} color={colors.success} />
          <Text style={styles.statValue}>${(quickStats.monthlyRevenue / 1000).toFixed(0)}k</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="alert-circle" size={24} color={colors.secondary} />
          <Text style={styles.statValue}>{quickStats.openDisputes}</Text>
          <Text style={styles.statLabel}>Open Disputes</Text>
        </View>
      </View>

      {/* Critical Alerts */}
      <Text style={styles.sectionTitle}>🚨 Critical Alerts</Text>
      <View style={styles.alertsContainer}>
        <View style={styles.alertCard}>
          <View style={[styles.alertIcon, { backgroundColor: `${colors.success}15` }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
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
          onPress={() => setActiveView("support")}
        >
          <Ionicons name="ticket" size={28} color={colors.primary} />
          <Text style={styles.actionTitle}>Support</Text>
          <Text style={styles.actionDesc}>Tickets & replies</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setActiveView("apikeys")}
        >
          <Ionicons name="key" size={28} color={colors.warning} />
          <Text style={styles.actionTitle}>API Keys</Text>
          <Text style={styles.actionDesc}>Configure services</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setActiveView("security")}
        >
          <Ionicons name="shield-checkmark" size={28} color="#EF4444" />
          <Text style={styles.actionTitle}>Security</Text>
          <Text style={styles.actionDesc}>Threat monitoring</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderApiKeysTab = () => (
    <APIConfigScreen sessionToken={sessionToken} app="chargeback" />
  );

  const renderSupportView = () => {
    const supportNavigation = {
      navigate: (screen: string, params?: any) => {
        if (screen === "CannedResponses") {
          setActiveView("canned");
          return;
        }

        if (screen === "AdminTicketDetail") {
          const ticketId = params?.ticketId as Id<"supportTickets"> | undefined;
          if (ticketId) {
            setSelectedTicketId(ticketId);
            setActiveView("ticketDetail");
          }
          return;
        }
      },
      goBack: () => {
        setActiveView("menu");
      },
    };

    return <AdminSupportDashboardScreen navigation={supportNavigation} sessionToken={sessionToken} />;
  };

  const renderTicketDetailView = () => {
    if (!selectedTicketId) {
      return (
        <View style={{ padding: spacing.lg }}>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>
            No ticket selected.
          </Text>
        </View>
      );
    }

    const ticketNavigation = {
      goBack: () => setActiveView("support"),
    };

    return (
      <AdminTicketDetailScreen
        navigation={ticketNavigation}
        route={{ params: { ticketId: selectedTicketId } }}
        sessionToken={sessionToken}
      />
    );
  };

  const renderCannedResponsesView = () => {
    const cannedNav = {
      goBack: () => setActiveView("support"),
    };

    return <CannedResponsesScreen navigation={cannedNav} />;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (activeView === "menu") {
              onBack();
              return;
            }

            if (activeView === "ticketDetail") {
              setActiveView("support");
              return;
            }

            if (activeView === "canned") {
              setActiveView("support");
              return;
            }

            setActiveView("menu");
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="shield-checkmark" size={28} color="#fff" />
          </View>
          <View>
            <Text style={styles.title}>Admin Panel</Text>
            <Text style={styles.subtitle}>
              {activeView === "menu" && "Quick Glance"}
              {activeView === "support" && "Support Dashboard"}
              {activeView === "ticketDetail" && "Ticket Detail"}
              {activeView === "canned" && "Canned Responses"}
              {activeView === "security" && "Security Monitoring"}
              {activeView === "apikeys" && "API Configuration"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeView === "menu" && renderMenuView()}
        {activeView === "support" && renderSupportView()}
        {activeView === "ticketDetail" && renderTicketDetailView()}
        {activeView === "canned" && renderCannedResponsesView()}
        {activeView === "security" && (
          <SecurityDashboardScreen onBack={() => setActiveView("menu")} />
        )}
        {activeView === "apikeys" && renderApiKeysTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
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
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  webDashboardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  webDashboardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  webDashboardText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  webDashboardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: "700",
    color: "#fff",
  },
  webDashboardSubtitle: {
    fontSize: typography.sizes.xs,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.outline,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  alertsContainer: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.sizes.base,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  alertText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.outline,
  },
  actionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  actionDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default BusinessAdminScreen;