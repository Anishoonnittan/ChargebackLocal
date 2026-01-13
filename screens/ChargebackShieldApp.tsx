import React, { useMemo, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { skip, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { colors, spacing, borderRadius, shadows } from "../lib/theme";
import { ChargebackShieldHomeScreen } from "./ChargebackShieldHomeScreen";
import { ChargebackShieldScanScreen } from "./ChargebackShieldScanScreen";
import { ChargebackShieldMonitorScreen } from "./ChargebackShieldMonitorScreen";
import { ChargebackShieldAlertsScreen } from "./ChargebackShieldAlertsScreen";
import PreAuthDashboardScreen from "./PreAuthDashboardScreen";

type TabName = "overview" | "scan" | "monitor" | "alerts" | "insights";

type Props = {
  showTitle?: boolean;
  sessionToken?: string;
};

function formatCurrencyUSD(amount: number) {
  return `$${Math.round(amount).toLocaleString()}`;
}

function computeRiskTier(score: number): "low" | "medium" | "high" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export const ChargebackShieldApp: React.FC<Props> = ({ showTitle = true, sessionToken }) => {
  const [activeTab, setActiveTab] = useState<TabName>(sessionToken ? "scan" : "overview");

  // Centralized data load (reduces duplicate queries and repeated error spam).
  // NOTE: `getPostAuthOrders` requires a sessionToken. When we don't have one (logged out),
  // we skip the query entirely and render demo-friendly empty states.
  const shouldLoadOrders = Boolean(sessionToken);
  const ordersQuery = useQuery(
    api.preAuthCheck.getPostAuthOrders,
    shouldLoadOrders ? { sessionToken: sessionToken! } : skip
  );

  const orders = useMemo(() => {
    return Array.isArray(ordersQuery) ? ordersQuery : [];
  }, [ordersQuery]);

  const derived = useMemo(() => {
    const monitoringCount = orders.filter((o: any) => o.status === "monitoring").length;

    // Some demo data uses `status === "risk"`; other UIs use a riskScore threshold.
    // We treat either as an alert.
    const alertsCount = orders.filter((o: any) => o.status === "risk" || o.riskScore >= 70).length;

    const blockedCount = orders.filter((o: any) => o.status === "blocked").length;

    // Conservative estimate: assume avg $850 saved per blocked order.
    const revenueProtected = blockedCount * 850;

    return {
      monitoringCount,
      alertsCount,
      blockedCount,
      revenueProtected,
    };
  }, [orders]);

  const renderScreen = () => {
    switch (activeTab) {
      case "overview":
        return (
          <ChargebackShieldHomeScreen
            orders={orders}
            monitoringCount={derived.monitoringCount}
            alertsCount={derived.alertsCount}
            blockedCount={derived.blockedCount}
            revenueProtected={derived.revenueProtected}
            onNavigateToScan={() => setActiveTab("scan")}
            onNavigateToMonitor={() => setActiveTab("monitor")}
            onNavigateToAlerts={() => setActiveTab("alerts")}
            onNavigateToInsights={() => setActiveTab("insights")}
          />
        );
      case "scan":
        return sessionToken ? (
          <PreAuthDashboardScreen sessionToken={sessionToken} />
        ) : (
          <ChargebackShieldScanScreen />
        );
      case "monitor":
        return <ChargebackShieldMonitorScreen orders={orders} />;
      case "alerts":
        return <ChargebackShieldAlertsScreen orders={orders} />;
      case "insights":
        return (
          <InsightsView
            totalOrders={orders.length}
            monitoringCount={derived.monitoringCount}
            alertsCount={derived.alertsCount}
            blockedCount={derived.blockedCount}
            revenueProtected={derived.revenueProtected}
          />
        );
      default:
        return (
          <ChargebackShieldHomeScreen
            orders={orders}
            monitoringCount={derived.monitoringCount}
            alertsCount={derived.alertsCount}
            blockedCount={derived.blockedCount}
            revenueProtected={derived.revenueProtected}
            onNavigateToScan={() => setActiveTab("scan")}
            onNavigateToMonitor={() => setActiveTab("monitor")}
            onNavigateToAlerts={() => setActiveTab("alerts")}
            onNavigateToInsights={() => setActiveTab("insights")}
          />
        );
    }
  };

  const isLoading = shouldLoadOrders && ordersQuery === undefined;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {showTitle ? (
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <Ionicons name="shield-checkmark" size={20} color={colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>ChargebackShield</Text>
              <Text style={styles.subtitle}>Pre-auth scans + 120-day monitoring</Text>
            </View>
          </View>
        ) : null}

        <SegmentedTabs
          activeTab={activeTab}
          alertsCount={derived.alertsCount}
          monitoringCount={derived.monitoringCount}
          onChangeTab={setActiveTab}
        />

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.info} />
            <Text style={styles.loadingText}>Loading orders…</Text>
          </View>
        ) : (
          <View style={styles.content}>{renderScreen()}</View>
        )}
      </View>
    </SafeAreaView>
  );
};

function SegmentedTabs({
  activeTab,
  alertsCount,
  monitoringCount,
  onChangeTab,
}: {
  activeTab: TabName;
  alertsCount: number;
  monitoringCount: number;
  onChangeTab: (tab: TabName) => void;
}) {
  const tabs: Array<{ key: TabName; label: string; icon: keyof typeof Ionicons.glyphMap; badge?: number }> = [
    { key: "overview", label: "Overview", icon: "grid" },
    { key: "scan", label: "Scan", icon: "scan" },
    { key: "monitor", label: "Monitor", icon: "pulse", badge: monitoringCount },
    { key: "alerts", label: "Alerts", icon: "warning", badge: alertsCount },
    { key: "insights", label: "Insights", icon: "stats-chart" },
  ];

  return (
    <View style={styles.tabsContainer}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChangeTab(tab.key)}
            activeOpacity={0.85}
          >
            <View style={styles.tabIconRow}>
              <Ionicons
                name={tab.icon}
                size={16}
                color={isActive ? colors.textOnPrimary : colors.textSecondary}
              />
              {typeof tab.badge === "number" && tab.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge > 99 ? "99+" : tab.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function InsightsView({
  totalOrders,
  monitoringCount,
  alertsCount,
  blockedCount,
  revenueProtected,
}: {
  totalOrders: number;
  monitoringCount: number;
  alertsCount: number;
  blockedCount: number;
  revenueProtected: number;
}) {
  // A lightweight Insights view that works without needing a session token.
  const fraudRate = totalOrders > 0 ? Math.round((blockedCount / totalOrders) * 100) : 0;

  const topMetric = {
    label: "Revenue protected (est.)",
    value: formatCurrencyUSD(revenueProtected),
    helper: "Based on blocked orders in demo data",
  };

  const cards: Array<{ label: string; value: string; icon: keyof typeof Ionicons.glyphMap; tone: "neutral" | "good" | "warn" | "bad" }> = [
    {
      label: "Total orders",
      value: totalOrders.toLocaleString(),
      icon: "layers",
      tone: "neutral",
    },
    {
      label: "Monitoring",
      value: monitoringCount.toLocaleString(),
      icon: "pulse",
      tone: "warn",
    },
    {
      label: "Alerts",
      value: alertsCount.toLocaleString(),
      icon: "warning",
      tone: "bad",
    },
    {
      label: "Fraud blocked",
      value: `${fraudRate}%`,
      icon: "shield-checkmark",
      tone: "good",
    },
  ];

  return (
    <View style={styles.insightsContainer}>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>{topMetric.label}</Text>
        <Text style={styles.heroValue}>{topMetric.value}</Text>
        <Text style={styles.heroHelper}>{topMetric.helper}</Text>
      </View>

      <View style={styles.metricsGrid}>
        {cards.map((card) => {
          const tone = getToneColors(card.tone);
          return (
            <View key={card.label} style={[styles.metricCard, { borderColor: tone.border }]}>
              <View style={[styles.metricIcon, { backgroundColor: tone.bg }]}
              >
                <Ionicons name={card.icon} size={18} color={tone.fg} />
              </View>
              <Text style={styles.metricValue}>{card.value}</Text>
              <Text style={styles.metricLabel}>{card.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.callout}>
        <Ionicons name="information-circle" size={18} color={colors.info} />
        <Text style={styles.calloutText}>
          Tip: Make "Scan" your default habit before shipping. If you scan everything, your chargeback
          rate drops dramatically.
        </Text>
      </View>
    </View>
  );
}

function getToneColors(tone: "neutral" | "good" | "warn" | "bad") {
  switch (tone) {
    case "good":
      return { bg: colors.successLight, fg: colors.success, border: colors.border };
    case "warn":
      return { bg: colors.warningLight, fg: colors.warning, border: colors.border };
    case "bad":
      return { bg: colors.errorLight, fg: colors.error, border: colors.border };
    default:
      return { bg: colors.surfaceVariant, fg: colors.textSecondary, border: colors.border };
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  titleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    padding: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: colors.info,
  },
  tabIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.textOnPrimary,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textOnPrimary,
  },
  content: {
    flex: 1,
    paddingTop: spacing.md,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.textSecondary,
  },
  insightsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.info,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
  },
  heroValue: {
    marginTop: spacing.sm,
    fontSize: 34,
    fontWeight: "900",
    color: colors.textOnPrimary,
  },
  heroHelper: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  metricCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  metricLabel: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  callout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  calloutText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});