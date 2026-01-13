import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

const { width } = Dimensions.get("window");

export default function ChargebackAnalyticsScreen({
  sessionToken,
}: {
  sessionToken: string;
}) {
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod());

  const analytics = useQuery(api.chargebackFraud.getAnalytics, { 
    sessionToken,
    period: selectedPeriod,
  });

  const recentScans = useQuery(api.chargebackFraud.getRecentScans, { 
    sessionToken,
    limit: 10,
  });

  if (!analytics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chargeback Analytics</Text>
        <Text style={styles.subtitle}>
          Protecting your revenue from fraud
        </Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodBtn,
            selectedPeriod === getCurrentPeriod() && styles.periodBtnActive,
          ]}
          onPress={() => setSelectedPeriod(getCurrentPeriod())}
        >
          <Text
            style={[
              styles.periodBtnText,
              selectedPeriod === getCurrentPeriod() &&
                styles.periodBtnTextActive,
            ]}
          >
            This Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodBtn,
            selectedPeriod === getLastPeriod() && styles.periodBtnActive,
          ]}
          onPress={() => setSelectedPeriod(getLastPeriod())}
        >
          <Text
            style={[
              styles.periodBtnText,
              selectedPeriod === getLastPeriod() && styles.periodBtnTextActive,
            ]}
          >
            Last Month
          </Text>
        </TouchableOpacity>
      </View>

      {/* Big Savings Card */}
      <View style={styles.savingsCard}>
        <View style={styles.savingsIcon}>
          <Ionicons name="shield-checkmark" size={40} color="#10b981" />
        </View>
        <Text style={styles.savingsLabel}>Estimated Savings</Text>
        <Text style={styles.savingsAmount}>
          ${analytics.metrics.estimatedSavings.toFixed(2)}
        </Text>
        <Text style={styles.savingsSubtext}>
          from {analytics.metrics.blockedOrders} blocked high-risk orders
        </Text>
        <View style={styles.savingsBadge}>
          <Ionicons name="trending-up" size={16} color="#10b981" />
          <Text style={styles.savingsBadgeText}>
            {analytics.metrics.blockedOrders} chargebacks prevented
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="search"
          label="Total Scans"
          value={analytics.metrics.totalScans.toString()}
          color="#3b82f6"
        />
        <StatCard
          icon="close-circle"
          label="Blocked"
          value={analytics.metrics.blockedOrders.toString()}
          color="#ef4444"
        />
        <StatCard
          icon="checkmark-circle"
          label="Approved"
          value={analytics.metrics.approvedOrders.toString()}
          color="#10b981"
        />
        <StatCard
          icon="analytics"
          label="Avg Risk"
          value={`${analytics.metrics.avgRiskScore.toFixed(0)}/100`}
          color="#f59e0b"
        />
      </View>

      {/* Risk Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk Distribution</Text>
        <View style={styles.riskDistribution}>
          <RiskBar
            label="Low Risk"
            count={analytics.metrics.lowRiskCount}
            total={analytics.metrics.totalScans}
            color="#10b981"
          />
          <RiskBar
            label="Medium Risk"
            count={analytics.metrics.mediumRiskCount}
            total={analytics.metrics.totalScans}
            color="#f59e0b"
          />
          <RiskBar
            label="High Risk"
            count={analytics.metrics.highRiskCount}
            total={analytics.metrics.totalScans}
            color="#f97316"
          />
          <RiskBar
            label="Critical Risk"
            count={analytics.metrics.criticalRiskCount}
            total={analytics.metrics.totalScans}
            color="#ef4444"
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Scans</Text>
        {recentScans && recentScans.length > 0 ? (
          recentScans.map((scan: any, index: number) => (
            <RecentScanCard key={index} scan={scan} />
          ))
        ) : (
          <Text style={styles.emptyText}>No scans yet</Text>
        )}
      </View>

      {/* Key Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Insights</Text>
        <InsightCard
          icon="shield-checkmark"
          title="Protection Rate"
          description={`You're blocking ${(
            (analytics.metrics.blockedOrders / analytics.metrics.totalScans) *
            100
          ).toFixed(1)}% of high-risk orders`}
          color="#10b981"
        />
        <InsightCard
          icon="trending-up"
          title="Monthly Savings"
          description={`On track to save $${(
            analytics.metrics.estimatedSavings * 1.2
          ).toFixed(0)} this month`}
          color="#3b82f6"
        />
        <InsightCard
          icon="alert-circle"
          title="Risk Score Average"
          description={`Average risk score is ${analytics.metrics.avgRiskScore.toFixed(
            0
          )}/100 - ${
            analytics.metrics.avgRiskScore < 30
              ? "Excellent"
              : analytics.metrics.avgRiskScore < 60
              ? "Good"
              : "Needs attention"
          }`}
          color="#f59e0b"
        />
      </View>
    </ScrollView>
  );
}

// Helper Components
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RiskBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <View style={styles.riskBarContainer}>
      <View style={styles.riskBarHeader}>
        <Text style={styles.riskBarLabel}>{label}</Text>
        <Text style={styles.riskBarCount}>
          {count} ({percentage.toFixed(0)}%)
        </Text>
      </View>
      <View style={styles.riskBarTrack}>
        <View
          style={[
            styles.riskBarFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function RecentScanCard({ scan }: { scan: any }) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "#10b981";
      case "MEDIUM":
        return "#f59e0b";
      case "HIGH":
        return "#f97316";
      case "CRITICAL":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <View style={styles.recentScanCard}>
      <View style={styles.recentScanHeader}>
        <View>
          <Text style={styles.recentScanEmail}>{scan.customerEmail}</Text>
          <Text style={styles.recentScanDate}>
            {new Date(scan.scannedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.recentScanBadge}>
          <View
            style={[
              styles.recentScanDot,
              { backgroundColor: getRiskColor(scan.riskLevel) },
            ]}
          />
          <Text
            style={[
              styles.recentScanLevel,
              { color: getRiskColor(scan.riskLevel) },
            ]}
          >
            {scan.riskLevel}
          </Text>
        </View>
      </View>
      <View style={styles.recentScanFooter}>
        <Text style={styles.recentScanAmount}>${scan.orderAmount}</Text>
        <Text style={styles.recentScanScore}>
          Risk Score: {scan.riskScore}/100
        </Text>
      </View>
    </View>
  );
}

function InsightCard({
  icon,
  title,
  description,
  color,
}: {
  icon: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <View style={styles.insightCard}>
      <View style={[styles.insightIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightDescription}>{description}</Text>
      </View>
    </View>
  );
}

// Helper Functions
function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getLastPeriod() {
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return `${year}-${String(lastMonth + 1).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  periodBtnActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  periodBtnTextActive: {
    color: "#fff",
  },
  savingsCard: {
    margin: 20,
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  savingsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  savingsLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  savingsAmount: {
    fontSize: 48,
    fontWeight: "700",
    color: "#10b981",
  },
  savingsSubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  savingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#d1fae5",
    borderRadius: 20,
    gap: 6,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10b981",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  riskDistribution: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  riskBarContainer: {
    marginBottom: 16,
  },
  riskBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  riskBarLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  riskBarCount: {
    fontSize: 14,
    color: "#6b7280",
  },
  riskBarTrack: {
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  riskBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  recentScanCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentScanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  recentScanEmail: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  recentScanDate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  recentScanBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recentScanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recentScanLevel: {
    fontSize: 12,
    fontWeight: "600",
  },
  recentScanFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentScanAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  recentScanScore: {
    fontSize: 12,
    color: "#6b7280",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingVertical: 32,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  insightCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },
});