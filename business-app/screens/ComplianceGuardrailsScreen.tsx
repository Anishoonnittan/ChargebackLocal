import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { colors, typography, spacing } from "../../lib/theme";

interface ComplianceCheck {
  id: string;
  title: string;
  description: string;
  status: "✅" | "❌" | "⚠️";
  statusText: string;
  severity: "critical" | "high" | "medium" | "low";
  actionText?: string;
  impact: string;
}

interface ComplianceStatus {
  overallScore: number;
  isCompliant: boolean;
  checks: ComplianceCheck[];
}

const BUSINESS_COLORS = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#3B82F6",
  accent: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  surface: "#FFFFFF",
  background: "#F8FAFC",
  cardBg: "#FFFFFF",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return BUSINESS_COLORS.danger;
    case "high":
      return BUSINESS_COLORS.warning;
    case "medium":
      return "#8B5CF6";
    case "low":
      return BUSINESS_COLORS.accent;
    default:
      return BUSINESS_COLORS.textSecondary;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "✅":
      return "checkmark-circle";
    case "❌":
      return "close-circle";
    case "⚠️":
      return "warning";
    default:
      return "help-circle";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "✅":
      return BUSINESS_COLORS.success;
    case "❌":
      return BUSINESS_COLORS.danger;
    case "⚠️":
      return BUSINESS_COLORS.warning;
    default:
      return BUSINESS_COLORS.textSecondary;
  }
};

interface ComplianceGuardrailsScreenProps {
  sessionToken: string;
}

export default function ComplianceGuardrailsScreen({
  sessionToken,
}: ComplianceGuardrailsScreenProps) {
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

  // Sample compliance checks data (in real app, this would come from convex backend)
  const complianceData: ComplianceStatus = {
    overallScore: 60,
    isCompliant: false,
    checks: [
      {
        id: "pricing",
        title: "✅ Clear Pricing (Incl. GST & Delivery)",
        description:
          "All prices displayed with GST amount clearly shown and delivery cost transparent at checkout.",
        status: "✅",
        statusText: "Compliant",
        severity: "critical",
        impact: "Missing GST disclosure = automatic chargeback loss (ACL violation)",
      },
      {
        id: "refund-policy",
        title: "❌ Refund Policy Visibility",
        description:
          "Refund policy must be visible and accessible before purchase. Required: 14-day minimum window, full refund option.",
        status: "❌",
        statusText: "Missing",
        severity: "critical",
        actionText: "Add refund policy to footer + checkout",
        impact: "Missing refund policy = automatic chargeback loss + potential ACCC fine ($220k+)",
      },
      {
        id: "business-contact",
        title: "✅ Business Contact Details",
        description: "ABN, physical address, business name, and phone number clearly displayed.",
        status: "✅",
        statusText: "Compliant",
        severity: "critical",
        impact: "Missing contact details = deemed non-compliant, automatic dispute loss",
      },
      {
        id: "delivery-time",
        title: "⚠️ Delivery Time Disclaimer",
        description:
          "Estimated delivery timeframe must be clearly stated. E.g., 'Ships within 3-5 business days'.",
        status: "⚠️",
        statusText: "Partial",
        severity: "high",
        actionText: "Add delivery time estimate to product pages",
        impact: "Missing = chargeback defense weakens (disputes over 'item not received')",
      },
      {
        id: "payment-security",
        title: "✅ Payment Security Statement",
        description: "SSL certificate active, secure payment badge visible, PCI compliance statement.",
        status: "✅",
        statusText: "Compliant",
        severity: "high",
        impact: "Missing = customer distrust, higher dispute rate",
      },
      {
        id: "consumer-guarantee",
        title: "✅ Consumer Guarantee Statement",
        description: "ACL consumer guarantee statement: 'Products come with consumer guarantees...'",
        status: "✅",
        statusText: "Compliant",
        severity: "medium",
        impact: "Strengthens evidence in chargeback disputes",
      },
    ],
  };

  const failedChecks = complianceData.checks.filter(
    (check) => check.status === "❌"
  );
  const warningChecks = complianceData.checks.filter(
    (check) => check.status === "⚠️"
  );
  const passedChecks = complianceData.checks.filter(
    (check) => check.status === "✅"
  );

  const riskSummary =
    failedChecks.length > 0
      ? `🔴 HIGH RISK: ${failedChecks.length} critical violations`
      : warningChecks.length > 0
        ? `🟡 MEDIUM RISK: ${warningChecks.length} warnings`
        : "🟢 COMPLIANT: Your store meets ACL requirements";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Compliance Guardrails</Text>
              <Text style={styles.headerSubtitle}>ACL & Regulatory Check</Text>
            </View>
          </View>
        </View>

        {/* Compliance Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{complianceData.overallScore}%</Text>
            <Text style={styles.scoreLabel}>Compliant</Text>
          </View>
          <View style={styles.scoreDetails}>
            <View style={styles.scoreRow}>
              <View style={[styles.statusDot, { backgroundColor: "#10B981" }]} />
              <Text style={styles.scoreRowText}>
                {passedChecks.length} Passed
              </Text>
            </View>
            <View style={styles.scoreRow}>
              <View
                style={[styles.statusDot, { backgroundColor: BUSINESS_COLORS.warning }]}
              />
              <Text style={styles.scoreRowText}>
                {warningChecks.length} Warnings
              </Text>
            </View>
            <View style={styles.scoreRow}>
              <View
                style={[styles.statusDot, { backgroundColor: BUSINESS_COLORS.danger }]}
              />
              <Text style={styles.scoreRowText}>
                {failedChecks.length} Critical
              </Text>
            </View>
          </View>
        </View>

        {/* Risk Summary Banner */}
        <View
          style={[
            styles.riskBanner,
            {
              backgroundColor:
                failedChecks.length > 0
                  ? "#FEE2E2"
                  : warningChecks.length > 0
                    ? "#FEF3C7"
                    : "#DCFCE7",
              borderLeftColor:
                failedChecks.length > 0
                  ? BUSINESS_COLORS.danger
                  : warningChecks.length > 0
                    ? BUSINESS_COLORS.warning
                    : BUSINESS_COLORS.success,
            },
          ]}
        >
          <Ionicons
            name={
              failedChecks.length > 0
                ? "alert-circle"
                : warningChecks.length > 0
                  ? "warning"
                  : "checkmark-circle"
            }
            size={24}
            color={
              failedChecks.length > 0
                ? BUSINESS_COLORS.danger
                : warningChecks.length > 0
                  ? BUSINESS_COLORS.warning
                  : BUSINESS_COLORS.success
            }
          />
          <Text
            style={[
              styles.riskBannerText,
              {
                color:
                  failedChecks.length > 0
                    ? BUSINESS_COLORS.danger
                    : warningChecks.length > 0
                      ? BUSINESS_COLORS.warning
                      : BUSINESS_COLORS.success,
              },
            ]}
          >
            {riskSummary}
          </Text>
        </View>

        {/* Impact Card */}
        <View style={styles.impactCard}>
          <View style={styles.impactHeader}>
            <Ionicons name="information-circle" size={20} color={BUSINESS_COLORS.primary} />
            <Text style={styles.impactTitle}>Why This Matters</Text>
          </View>
          <Text style={styles.impactText}>
            Missing ACL information = automatic loss in chargebacks + potential ACCC fines up to
            <Text style={styles.impactBold}> $220k+</Text>
          </Text>
          <View style={styles.impactStats}>
            <View style={styles.impactStat}>
              <Text style={styles.impactStatValue}>70%</Text>
              <Text style={styles.impactStatLabel}>Chargebacks Preventable</Text>
            </View>
            <View style={styles.impactStatDivider} />
            <View style={styles.impactStat}>
              <Text style={styles.impactStatValue}>$220k+</Text>
              <Text style={styles.impactStatLabel}>ACCC Fine Risk</Text>
            </View>
          </View>
        </View>

        {/* Compliance Checks */}
        <View style={styles.checksSection}>
          <Text style={styles.sectionTitle}>Required Disclosures</Text>
          <View style={styles.checksList}>
            {complianceData.checks.map((check) => (
              <TouchableOpacity
                key={check.id}
                style={[
                  styles.checkItem,
                  expandedCheck === check.id && styles.checkItemExpanded,
                  check.status === "❌" && styles.checkItemFailed,
                  check.status === "⚠️" && styles.checkItemWarning,
                ]}
                onPress={() =>
                  setExpandedCheck(expandedCheck === check.id ? null : check.id)
                }
                activeOpacity={0.7}
              >
                {/* Check Header */}
                <View style={styles.checkHeader}>
                  <Ionicons
                    name={getStatusIcon(check.status)}
                    size={24}
                    color={getStatusColor(check.status)}
                  />
                  <View style={styles.checkTitleContainer}>
                    <Text style={styles.checkTitle}>{check.title}</Text>
                    <Text style={styles.checkStatus}>{check.statusText}</Text>
                  </View>
                  <Ionicons
                    name={expandedCheck === check.id ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={BUSINESS_COLORS.textSecondary}
                  />
                </View>

                {/* Expanded Content */}
                {expandedCheck === check.id && (
                  <View style={styles.checkContent}>
                    <Text style={styles.checkDescription}>{check.description}</Text>

                    {/* Severity Badge */}
                    <View
                      style={[
                        styles.severityBadge,
                        {
                          backgroundColor: `${getSeverityColor(check.severity)}15`,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.severityDot,
                          { backgroundColor: getSeverityColor(check.severity) },
                        ]}
                      />
                      <Text
                        style={[
                          styles.severityText,
                          { color: getSeverityColor(check.severity) },
                        ]}
                      >
                        {check.severity.toUpperCase()} severity
                      </Text>
                    </View>

                    {/* Impact */}
                    <View style={styles.impactBox}>
                      <Text style={styles.impactBoxTitle}>💰 Chargeback Impact:</Text>
                      <Text style={styles.impactBoxText}>{check.impact}</Text>
                    </View>

                    {/* Action Button */}
                    {check.actionText && (
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="open-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>{check.actionText}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Cards */}
        <View style={styles.actionCardsSection}>
          <TouchableOpacity style={[styles.actionCard, styles.actionCardPrimary]}>
            <View style={styles.actionCardContent}>
              <Ionicons name="document-text" size={24} color={BUSINESS_COLORS.primary} />
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>Generate ACL Evidence</Text>
                <Text style={styles.actionCardSubtitle}>
                  Auto-compile compliance proof for chargebacks
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={BUSINESS_COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, styles.actionCardSecondary]}>
            <View style={styles.actionCardContent}>
              <Ionicons name="settings" size={24} color={BUSINESS_COLORS.accent} />
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>Update Store Details</Text>
                <Text style={styles.actionCardSubtitle}>
                  Fix missing pricing, policies, or contact info
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={BUSINESS_COLORS.accent} />
          </TouchableOpacity>
        </View>

        {/* Bottom Help Card */}
        <View style={styles.helpCard}>
          <Ionicons name="bulb" size={20} color={BUSINESS_COLORS.primary} />
          <View style={styles.helpCardText}>
            <Text style={styles.helpCardTitle}>Quick Tip</Text>
            <Text style={styles.helpCardBody}>
              Run this check before launching your store. Every missing disclosure costs you 70%
              more chargebacks.
            </Text>
          </View>
        </View>

        {/* Spacing */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BUSINESS_COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  // Header
  header: {
    backgroundColor: BUSINESS_COLORS.primary,
    padding: 20,
    paddingTop: 12,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: BUSINESS_COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: `${BUSINESS_COLORS.primaryLight}`,
    marginTop: 2,
  },
  // Score Card
  scoreCard: {
    margin: 16,
    padding: 20,
    backgroundColor: BUSINESS_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${BUSINESS_COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: BUSINESS_COLORS.primary,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "700",
    color: BUSINESS_COLORS.primary,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 2,
  },
  scoreDetails: {
    flex: 1,
    gap: 10,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scoreRowText: {
    fontSize: 14,
    fontWeight: "500",
    color: BUSINESS_COLORS.textPrimary,
  },
  // Risk Banner
  riskBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  riskBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  // Impact Card
  impactCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: `${BUSINESS_COLORS.primary}10`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${BUSINESS_COLORS.primary}30`,
  },
  impactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BUSINESS_COLORS.textPrimary,
  },
  impactText: {
    fontSize: 14,
    color: BUSINESS_COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  impactBold: {
    fontWeight: "700",
    color: BUSINESS_COLORS.danger,
  },
  impactStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  impactStat: {
    flex: 1,
    alignItems: "center",
  },
  impactStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: BUSINESS_COLORS.primary,
  },
  impactStatLabel: {
    fontSize: 12,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  impactStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: BUSINESS_COLORS.border,
  },
  // Checks Section
  checksSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BUSINESS_COLORS.textPrimary,
    marginBottom: 12,
  },
  checksList: {
    gap: 12,
  },
  checkItem: {
    backgroundColor: BUSINESS_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
    overflow: "hidden",
  },
  checkItemExpanded: {
    borderColor: BUSINESS_COLORS.primary,
  },
  checkItemFailed: {
    borderLeftWidth: 4,
    borderLeftColor: BUSINESS_COLORS.danger,
    backgroundColor: "#FEF2F2",
  },
  checkItemWarning: {
    borderLeftWidth: 4,
    borderLeftColor: BUSINESS_COLORS.warning,
    backgroundColor: "#FFFBEB",
  },
  checkHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  checkTitleContainer: {
    flex: 1,
  },
  checkTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: BUSINESS_COLORS.textPrimary,
  },
  checkStatus: {
    fontSize: 12,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 2,
  },
  checkContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: BUSINESS_COLORS.border,
    paddingTop: 12,
  },
  checkDescription: {
    fontSize: 14,
    color: BUSINESS_COLORS.textSecondary,
    lineHeight: 20,
  },
  severityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  impactBox: {
    backgroundColor: BUSINESS_COLORS.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
  },
  impactBoxTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: BUSINESS_COLORS.textPrimary,
    marginBottom: 6,
  },
  impactBoxText: {
    fontSize: 13,
    color: BUSINESS_COLORS.danger,
    lineHeight: 18,
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BUSINESS_COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Action Cards Section
  actionCardsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionCardPrimary: {
    backgroundColor: `${BUSINESS_COLORS.primary}10`,
    borderColor: `${BUSINESS_COLORS.primary}30`,
  },
  actionCardSecondary: {
    backgroundColor: `${BUSINESS_COLORS.accent}10`,
    borderColor: `${BUSINESS_COLORS.accent}30`,
  },
  actionCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: BUSINESS_COLORS.textPrimary,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 2,
  },
  // Help Card
  helpCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: BUSINESS_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
    flexDirection: "row",
    gap: 12,
  },
  helpCardText: {
    flex: 1,
  },
  helpCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: BUSINESS_COLORS.textPrimary,
  },
  helpCardBody: {
    fontSize: 13,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
});