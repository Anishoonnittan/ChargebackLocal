import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BusinessUser, FraudRule, RiskFactor } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Business color theme
const COLORS = {
  primary: "#2563EB",
  accent: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  surface: "#FFFFFF",
  background: "#F8FAFC",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  critical: "#DC2626",
  high: "#EA580C",
  medium: "#CA8A04",
  low: "#16A34A",
  purple: "#8B5CF6",
};

interface Props {
  viewer: BusinessUser;
  sessionToken: string;
}

// Mock fraud patterns
const MOCK_PATTERNS = [
  {
    id: "1",
    name: "Velocity Attack",
    description: "Multiple orders from same IP in short time",
    detections: 23,
    trend: "+15%",
    severity: "high",
    icon: "speedometer",
  },
  {
    id: "2",
    name: "Card Testing",
    description: "Small amounts followed by large purchases",
    detections: 12,
    trend: "-8%",
    severity: "critical",
    icon: "card",
  },
  {
    id: "3",
    name: "Address Mismatch",
    description: "Billing and shipping in different countries",
    detections: 45,
    trend: "+3%",
    severity: "medium",
    icon: "location",
  },
  {
    id: "4",
    name: "VPN/Proxy Usage",
    description: "Orders placed through anonymous networks",
    detections: 78,
    trend: "+22%",
    severity: "medium",
    icon: "globe",
  },
  {
    id: "5",
    name: "Device Fingerprint",
    description: "Same device used for multiple accounts",
    detections: 8,
    trend: "-12%",
    severity: "high",
    icon: "phone-portrait",
  },
];

// Mock fraud rules
const MOCK_RULES: FraudRule[] = [
  {
    _id: "r1",
    name: "Block High-Risk Countries",
    description: "Auto-block orders from Nigeria, Russia, Ukraine",
    enabled: true,
    priority: 1,
    conditions: [{ field: "country", operator: "in_list", value: ["NG", "RU", "UA"] }],
    action: "block",
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000,
    triggerCount: 234,
    lastTriggered: Date.now() - 3600000,
  },
  {
    _id: "r2",
    name: "Review Large Orders",
    description: "Flag orders over $500 for manual review",
    enabled: true,
    priority: 2,
    conditions: [{ field: "amount", operator: "greater_than", value: 500 }],
    action: "review",
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000 * 7,
    triggerCount: 89,
    lastTriggered: Date.now() - 7200000,
  },
  {
    _id: "r3",
    name: "VPN Detection",
    description: "Block orders from known VPN/proxy IPs",
    enabled: true,
    priority: 3,
    conditions: [{ field: "vpn_detected", operator: "equals", value: "true" }],
    action: "block",
    createdAt: Date.now() - 86400000 * 45,
    updatedAt: Date.now() - 86400000 * 3,
    triggerCount: 156,
    lastTriggered: Date.now() - 1800000,
  },
  {
    _id: "r4",
    name: "Velocity Limit",
    description: "Max 3 orders per IP per hour",
    enabled: false,
    priority: 4,
    conditions: [{ field: "orders_per_hour", operator: "greater_than", value: 3 }],
    action: "block",
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 10,
    triggerCount: 12,
  },
];

// Mock recent detections
const MOCK_DETECTIONS = [
  {
    id: "d1",
    orderId: "ORD-8923",
    riskScore: 92,
    amount: 849.99,
    reason: "VPN + High-risk country + New customer",
    action: "Blocked",
    timestamp: Date.now() - 300000,
  },
  {
    id: "d2",
    orderId: "ORD-8922",
    riskScore: 78,
    amount: 234.50,
    reason: "Multiple failed payment attempts",
    action: "Flagged",
    timestamp: Date.now() - 600000,
  },
  {
    id: "d3",
    orderId: "ORD-8920",
    riskScore: 65,
    amount: 1299.00,
    reason: "Address mismatch + First order",
    action: "Review",
    timestamp: Date.now() - 1200000,
  },
];

export default function FraudIntelligenceScreen({ viewer, sessionToken }: Props) {
  const [activeTab, setActiveTab] = useState<"patterns" | "rules" | "detections">("patterns");
  const [rules, setRules] = useState(MOCK_RULES);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return COLORS.critical;
      case "high": return COLORS.high;
      case "medium": return COLORS.medium;
      case "low": return COLORS.low;
      default: return COLORS.textSecondary;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "blocked": return COLORS.danger;
      case "flagged": return COLORS.warning;
      case "review": return COLORS.primary;
      default: return COLORS.textSecondary;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return COLORS.danger;
    if (score >= 60) return COLORS.warning;
    if (score >= 40) return COLORS.medium;
    return COLORS.accent;
  };

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(r => 
      r._id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* AI Score Card */}
      <View style={styles.aiScoreCard}>
        <View style={styles.aiScoreHeader}>
          <View style={styles.aiIconContainer}>
            <Ionicons name="analytics" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.aiScoreInfo}>
            <Text style={styles.aiScoreTitle}>AI Fraud Shield</Text>
            <Text style={styles.aiScoreSubtitle}>Real-time ML-powered protection</Text>
          </View>
          <View style={styles.aiStatusBadge}>
            <View style={styles.aiStatusDot} />
            <Text style={styles.aiStatusText}>Active</Text>
          </View>
        </View>
        <View style={styles.aiStatsRow}>
          <View style={styles.aiStat}>
            <Text style={styles.aiStatValue}>99.2%</Text>
            <Text style={styles.aiStatLabel}>Accuracy</Text>
          </View>
          <View style={styles.aiStatDivider} />
          <View style={styles.aiStat}>
            <Text style={styles.aiStatValue}>156</Text>
            <Text style={styles.aiStatLabel}>Blocked Today</Text>
          </View>
          <View style={styles.aiStatDivider} />
          <View style={styles.aiStat}>
            <Text style={styles.aiStatValue}>$48K</Text>
            <Text style={styles.aiStatLabel}>Saved Today</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabRow}>
        {(["patterns", "rules", "detections"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={
                tab === "patterns" ? "trending-up" :
                tab === "rules" ? "options" : "alert-circle"
              }
              size={18}
              color={activeTab === tab ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Patterns Tab */}
      {activeTab === "patterns" && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fraud Patterns Detected</Text>
            <Text style={styles.sectionSubtitle}>Last 30 days</Text>
          </View>

          {MOCK_PATTERNS.map((pattern) => (
            <View key={pattern.id} style={styles.patternCard}>
              <View style={styles.patternHeader}>
                <View style={[styles.patternIcon, { backgroundColor: getSeverityColor(pattern.severity) + "15" }]}>
                  <Ionicons name={pattern.icon as any} size={20} color={getSeverityColor(pattern.severity)} />
                </View>
                <View style={styles.patternInfo}>
                  <Text style={styles.patternName}>{pattern.name}</Text>
                  <Text style={styles.patternDescription}>{pattern.description}</Text>
                </View>
              </View>
              <View style={styles.patternStats}>
                <View style={styles.patternStat}>
                  <Text style={styles.patternStatValue}>{pattern.detections}</Text>
                  <Text style={styles.patternStatLabel}>Detections</Text>
                </View>
                <View style={[
                  styles.trendBadge,
                  { backgroundColor: pattern.trend.startsWith("+") ? COLORS.danger + "15" : COLORS.accent + "15" }
                ]}>
                  <Ionicons
                    name={pattern.trend.startsWith("+") ? "trending-up" : "trending-down"}
                    size={14}
                    color={pattern.trend.startsWith("+") ? COLORS.danger : COLORS.accent}
                  />
                  <Text style={[
                    styles.trendText,
                    { color: pattern.trend.startsWith("+") ? COLORS.danger : COLORS.accent }
                  ]}>
                    {pattern.trend}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fraud Rules</Text>
            <TouchableOpacity style={styles.addRuleButton}>
              <Ionicons name="add" size={18} color={COLORS.primary} />
              <Text style={styles.addRuleText}>Add Rule</Text>
            </TouchableOpacity>
          </View>

          {rules.map((rule) => (
            <View key={rule._id} style={[styles.ruleCard, !rule.enabled && styles.ruleCardDisabled]}>
              <View style={styles.ruleHeader}>
                <View style={styles.ruleInfo}>
                  <Text style={[styles.ruleName, !rule.enabled && styles.ruleNameDisabled]}>
                    {rule.name}
                  </Text>
                  <Text style={styles.ruleDescription}>{rule.description}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.ruleToggle, rule.enabled && styles.ruleToggleEnabled]}
                  onPress={() => toggleRule(rule._id)}
                >
                  <View style={[styles.ruleToggleThumb, rule.enabled && styles.ruleToggleThumbEnabled]} />
                </TouchableOpacity>
              </View>
              <View style={styles.ruleFooter}>
                <View style={[
                  styles.actionBadge,
                  { backgroundColor: 
                    rule.action === "block" ? COLORS.danger + "15" :
                    rule.action === "review" ? COLORS.primary + "15" : COLORS.warning + "15"
                  }
                ]}>
                  <Ionicons
                    name={rule.action === "block" ? "ban" : rule.action === "review" ? "eye" : "flag"}
                    size={12}
                    color={
                      rule.action === "block" ? COLORS.danger :
                      rule.action === "review" ? COLORS.primary : COLORS.warning
                    }
                  />
                  <Text style={[styles.actionBadgeText, {
                    color: rule.action === "block" ? COLORS.danger :
                           rule.action === "review" ? COLORS.primary : COLORS.warning
                  }]}>
                    {rule.action.charAt(0).toUpperCase() + rule.action.slice(1)}
                  </Text>
                </View>
                <Text style={styles.ruleStats}>
                  {rule.triggerCount} triggers • Priority {rule.priority}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Detections Tab */}
      {activeTab === "detections" && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Detections</Text>
            <Text style={styles.sectionSubtitle}>Live feed</Text>
          </View>

          {MOCK_DETECTIONS.map((detection) => (
            <View key={detection.id} style={styles.detectionCard}>
              <View style={styles.detectionHeader}>
                <View style={styles.detectionOrderInfo}>
                  <Text style={styles.detectionOrderId}>{detection.orderId}</Text>
                  <Text style={styles.detectionTime}>{formatTime(detection.timestamp)}</Text>
                </View>
                <View style={[
                  styles.riskScoreBadge,
                  { backgroundColor: getRiskColor(detection.riskScore) + "15" }
                ]}>
                  <Text style={[styles.riskScoreText, { color: getRiskColor(detection.riskScore) }]}>
                    {detection.riskScore}
                  </Text>
                </View>
              </View>
              <Text style={styles.detectionReason}>{detection.reason}</Text>
              <View style={styles.detectionFooter}>
                <Text style={styles.detectionAmount}>${detection.amount.toFixed(2)}</Text>
                <View style={[
                  styles.detectionActionBadge,
                  { backgroundColor: getActionColor(detection.action) + "15" }
                ]}>
                  <Text style={[styles.detectionActionText, { color: getActionColor(detection.action) }]}>
                    {detection.action}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.loadMoreButton}>
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // AI Score Card
  aiScoreCard: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
  },
  aiScoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  aiIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  aiScoreInfo: {
    flex: 1,
  },
  aiScoreTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  aiScoreSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  aiStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  aiStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  aiStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  aiStatsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
  },
  aiStat: {
    flex: 1,
    alignItems: "center",
  },
  aiStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  aiStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  aiStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 8,
  },
  // Tab Navigation
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primary + "15",
    borderColor: COLORS.primary + "30",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  // Section
  section: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  // Pattern Card
  patternCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  patternHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  patternIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  patternInfo: {
    flex: 1,
  },
  patternName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  patternDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  patternStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  patternStat: {},
  patternStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  patternStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Rule Card
  ruleCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  ruleCardDisabled: {
    opacity: 0.6,
  },
  ruleHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  ruleInfo: {
    flex: 1,
    marginRight: 12,
  },
  ruleName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  ruleNameDisabled: {
    color: COLORS.textSecondary,
  },
  ruleDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ruleToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    padding: 2,
  },
  ruleToggleEnabled: {
    backgroundColor: COLORS.accent,
  },
  ruleToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  ruleToggleThumbEnabled: {
    marginLeft: 20,
  },
  ruleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  ruleStats: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  addRuleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addRuleText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
  // Detection Card
  detectionCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  detectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detectionOrderInfo: {},
  detectionOrderId: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  detectionTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  riskScoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  riskScoreText: {
    fontSize: 16,
    fontWeight: "700",
  },
  detectionReason: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  detectionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detectionAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  detectionActionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detectionActionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  loadMoreButton: {
    alignItems: "center",
    padding: 12,
    marginTop: 4,
  },
  loadMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
});