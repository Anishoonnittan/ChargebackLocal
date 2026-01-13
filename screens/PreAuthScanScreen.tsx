import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius, shadows } from "../lib/theme";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useBehavioralBiometrics } from "../hooks/useBehavioralBiometrics";
import { useDeviceFingerprint } from "../hooks/useDeviceFingerprint";

export default function PreAuthScanScreen({
  onBack,
  sessionToken,
}: {
  onBack: () => void;
  sessionToken: string;
}) {
  // Form state
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderAmount, setOrderAmount] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [cardBin, setCardBin] = useState("");
  
  // New: AVS/CVV simulation
  const [avsResult, setAvsResult] = useState("Y"); // Default: Full match
  const [cvvResult, setCvvResult] = useState("M"); // Default: Match
  
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Hooks
  const biometrics = useBehavioralBiometrics();
  const { fingerprint } = useDeviceFingerprint();
  const runPreAuthCheck = useAction(api.preAuthCheck.runPreAuthCheck);

  const handleAnalyze = async () => {
    if (!customerEmail || !orderAmount) {
      Alert.alert("Missing Information", "Please enter customer email and order amount");
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const preAuthResult = await runPreAuthCheck({
        sessionToken,
        customerEmail,
        customerPhone: customerPhone || undefined,
        orderAmount: parseFloat(orderAmount),
        orderId: `ORD-${Date.now()}`,
        billingAddress: billingAddress || undefined,
        shippingAddress: shippingAddress || undefined,
        ipAddress: undefined, // In production: Get real IP
        deviceFingerprint: fingerprint ? JSON.stringify(fingerprint) : undefined,
        cardBin: cardBin || undefined,
      });

      setResult(preAuthResult);

      Alert.alert(
        `Risk: ${preAuthResult.preAuthRiskLevel}`,
        preAuthResult.reason,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Pre-auth check error:", error);
      Alert.alert("Error", "Failed to analyze order. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCustomerEmail("");
    setCustomerPhone("");
    setOrderAmount("");
    setBillingAddress("");
    setShippingAddress("");
    setCardBin("");
    setAvsResult("Y");
    setCvvResult("M");
    setResult(null);
    biometrics.reset();
  };

  const handleTextChange = (fieldName: string, setter: (value: string) => void) => {
    return (text: string) => {
      setter(text);
      biometrics.trackInput(fieldName, text);
    };
  };

  const handleFocus = (fieldName: string) => {
    return () => {
      biometrics.trackFocus(fieldName);
    };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
            <Text style={styles.headerTitle}>Pre-Auth Risk Scan</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Real-Time Transaction Risk Scoring (Before Capture)
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={styles.infoTitle}>Enhanced Pre-Authorization Checks</Text>
          </View>
          <Text style={styles.infoText}>
            Scan orders BEFORE payment capture with 8 advanced fraud signals
          </Text>
          <View style={styles.checksGrid}>
            <CheckItem label="Card BIN Analysis" icon="card" />
            <CheckItem label="AVS/CVV Match" icon="checkmark-circle" />
            <CheckItem label="Behavioral Biometrics" icon="analytics" />
            <CheckItem label="AU Fraud Intel (AFP)" icon="shield" />
            <CheckItem label="Device Fingerprinting" icon="finger-print" />
            <CheckItem label="Geolocation Mismatch" icon="location" />
            <CheckItem label="Velocity Checks" icon="speedometer" />
            <CheckItem label="Email Validation" icon="mail" />
          </View>
        </View>

        {/* Order Form */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Order Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="customer@example.com"
              value={customerEmail}
              onChangeText={handleTextChange("customerEmail", setCustomerEmail)}
              onFocus={handleFocus("customerEmail")}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Order Amount *</Text>
            <TextInput
              style={styles.input}
              placeholder="1200.00"
              value={orderAmount}
              onChangeText={handleTextChange("orderAmount", setOrderAmount)}
              onFocus={handleFocus("orderAmount")}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card BIN (First 6 digits)</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              value={cardBin}
              onChangeText={handleTextChange("cardBin", setCardBin)}
              onFocus={handleFocus("cardBin")}
              keyboardType="number-pad"
              maxLength={6}
            />
            <Text style={styles.hint}>
              Used to verify card country, issuer, and prepaid status
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="+1234567890"
              value={customerPhone}
              onChangeText={handleTextChange("customerPhone", setCustomerPhone)}
              onFocus={handleFocus("customerPhone")}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Billing Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="123 Main St, Sydney, NSW, 2000, AU"
              value={billingAddress}
              onChangeText={handleTextChange("billingAddress", setBillingAddress)}
              onFocus={handleFocus("billingAddress")}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shipping Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="123 Main St, Sydney, NSW, 2000, AU"
              value={shippingAddress}
              onChangeText={handleTextChange("shippingAddress", setShippingAddress)}
              onFocus={handleFocus("shippingAddress")}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* AVS/CVV Simulation */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>AVS/CVV Results (Simulated)</Text>
          <Text style={[styles.hint, { marginBottom: spacing.md }]}>
            These aren't used by the current Pre-Auth engine yet (coming soon).
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>AVS Result Code</Text>
            <View style={styles.pickerRow}>
              {["Y", "A", "Z", "N", "U"].map((code) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.pickerButton,
                    avsResult === code && styles.pickerButtonActive,
                  ]}
                  onPress={() => setAvsResult(code)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      avsResult === code && styles.pickerButtonTextActive,
                    ]}
                  >
                    {code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hint}>
              Y=Full match, A=Address only, Z=ZIP only, N=No match, U=Unavailable
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CVV Result Code</Text>
            <View style={styles.pickerRow}>
              {["M", "N", "P", "U"].map((code) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.pickerButton,
                    cvvResult === code && styles.pickerButtonActive,
                  ]}
                  onPress={() => setCvvResult(code)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      cvvResult === code && styles.pickerButtonTextActive,
                    ]}
                  >
                    {code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hint}>
              M=Match, N=No match, P=Not processed, U=Unavailable
            </Text>
          </View>
        </View>

        {/* Behavioral Metrics Display */}
        <View style={styles.metricsCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="analytics" size={24} color={colors.primary} />
            <Text style={styles.infoTitle}>Behavioral Metrics</Text>
          </View>
          <View style={styles.metricsGrid}>
            <MetricItem
              label="Typing Speed"
              value={`${biometrics.typingSpeed.toFixed(1)} chars/sec`}
              icon="speedometer"
            />
            <MetricItem
              label="Form Time"
              value={`${Math.round(biometrics.formFillTime)}s`}
              icon="time"
            />
            <MetricItem
              label="Interactions"
              value={`${biometrics.fieldInteractions}`}
              icon="finger-print"
            />
            <MetricItem
              label="Hesitations"
              value={`${biometrics.hesitationEvents}`}
              icon="pause"
            />
          </View>
          {biometrics.copyPasteDetected && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text style={styles.warningText}>Copy/paste detected</Text>
            </View>
          )}
        </View>

        {/* Analyze Button */}
        <TouchableOpacity
          style={[styles.analyzeButton, analyzing && styles.analyzeButtonDisabled]}
          onPress={handleAnalyze}
          disabled={analyzing}
        >
          {analyzing ? (
            <>
              <ActivityIndicator color={colors.textOnPrimary} />
              <Text style={styles.analyzeButtonText}>Analyzing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color={colors.textOnPrimary} />
              <Text style={styles.analyzeButtonText}>Run Pre-Auth Risk Scan</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Results */}
        {result && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Risk Analysis Results</Text>

            {/* Risk Score Gauge */}
            <View style={styles.riskScoreCard}>
              <Text style={styles.riskScoreLabel}>Risk Score</Text>
              <View style={styles.riskScoreDisplay}>
                <Text style={[styles.riskScoreValue, getRiskScoreColor(result.preAuthScore)]}>
                  {result.preAuthScore}
                </Text>
                <Text style={styles.riskScoreMax}>/100</Text>
              </View>
              <View style={styles.riskScoreBar}>
                <View
                  style={[
                    styles.riskScoreBarFill,
                    { width: `${result.preAuthScore}%` },
                    getRiskScoreBarColor(result.preAuthScore),
                  ]}
                />
              </View>
              <View
                style={[
                  styles.riskLevelBadge,
                  getRiskLevelBadgeColor(result.preAuthRiskLevel),
                ]}
              >
                <Text style={styles.riskLevelText}>{result.preAuthRiskLevel} RISK</Text>
              </View>
            </View>

            {/* Decision + Reason */}
            <View style={[styles.actionCard, getActionCardColor(result.autoDecision)]}>
              <View style={styles.actionHeader}>
                <Ionicons
                  name={getActionIcon(result.autoDecision)}
                  size={32}
                  color="#fff"
                />
                <Text style={styles.actionTitle}>{result.autoDecision}</Text>
              </View>
              <Text style={styles.actionRecommendation}>{result.reason}</Text>
            </View>

            {/* Checks Breakdown */}
            <View style={styles.signalsCard}>
              <Text style={styles.sectionTitle}>Checks Breakdown</Text>
              {Array.isArray(result.checks) &&
                result.checks.map((check: any, index: number) => (
                  <SignalItem key={index} signal={check} />
                ))}
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Scan Another Order</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Helper Components
function CheckItem({ label, icon }: { label: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.checkItem}>
      <Ionicons name={icon} size={16} color={colors.success} />
      <Text style={styles.checkText}>{label}</Text>
    </View>
  );
}

function MetricItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.metricItem}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function SignalItem({ signal }: { signal: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PASS":
        return colors.success;
      case "WARN":
        return colors.warning;
      case "FAIL":
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? "checkmark-circle" : "close-circle";
  };

  return (
    <View style={styles.signalItem}>
      <View style={styles.signalHeader}>
        <Ionicons
          name={getStatusIcon(signal.passed)}
          size={20}
          color={getStatusColor(signal.passed ? "PASS" : "FAIL")}
        />
        <Text style={styles.signalName}>{signal.checkName.replace(/_/g, " ").toUpperCase()}</Text>
        {signal.score > 0 && (
          <View style={styles.signalScoreBadge}>
            <Text style={styles.signalScoreText}>-{signal.score}pts</Text>
          </View>
        )}
      </View>
      <Text style={styles.signalDetails}>{signal.details}</Text>
    </View>
  );
}

// Helper Functions
function getRiskScoreColor(score: number) {
  if (score >= 80) return { color: colors.success };
  if (score >= 60) return { color: colors.warning };
  if (score >= 40) return { color: colors.error };
  return { color: "#D32F2F" };
}

function getRiskScoreBarColor(score: number) {
  if (score >= 80) return { backgroundColor: colors.success };
  if (score >= 60) return { backgroundColor: colors.warning };
  if (score >= 40) return { backgroundColor: colors.error };
  return { backgroundColor: "#D32F2F" };
}

function getRiskLevelBadgeColor(level: string) {
  switch (level) {
    case "LOW":
      return { backgroundColor: colors.successLight };
    case "MEDIUM":
      return { backgroundColor: colors.warningLight };
    case "HIGH":
      return { backgroundColor: colors.errorLight };
    case "CRITICAL":
      return { backgroundColor: "#FFCDD2" };
    default:
      return { backgroundColor: colors.surfaceVariant };
  }
}

function getActionCardColor(decision: string) {
  switch (decision) {
    case "APPROVED":
      return { backgroundColor: colors.success };
    case "DECLINED":
      return { backgroundColor: colors.error };
    case "REQUIRES_REVIEW":
      return { backgroundColor: colors.warning };
    default:
      return { backgroundColor: colors.textSecondary };
  }
}

function getActionIcon(decision: string): keyof typeof Ionicons.glyphMap {
  switch (decision) {
    case "APPROVED":
      return "checkmark-circle";
    case "DECLINED":
      return "close-circle";
    case "REQUIRES_REVIEW":
      return "alert-circle";
    default:
      return "help-circle";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: 4,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  checksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    width: "48%",
  },
  checkText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontWeight: "500",
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  pickerRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: "center",
  },
  pickerButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pickerButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  pickerButtonTextActive: {
    color: colors.textOnPrimary,
  },
  metricsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricItem: {
    width: "48%",
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  metricValue: {
    ...typography.h4,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  warningText: {
    ...typography.body,
    color: colors.warning,
    fontWeight: "600",
  },
  analyzeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  resultsSection: {
    marginBottom: spacing.xl,
  },
  riskScoreCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
    ...shadows.md,
  },
  riskScoreLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  riskScoreDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: spacing.md,
  },
  riskScoreValue: {
    fontSize: 64,
    fontWeight: "700",
  },
  riskScoreMax: {
    fontSize: 32,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  riskScoreBar: {
    width: "100%",
    height: 12,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  riskScoreBarFill: {
    height: "100%",
    borderRadius: borderRadius.full,
  },
  riskLevelBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  riskLevelText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  actionCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionTitle: {
    ...typography.h3,
    color: "#fff",
    fontWeight: "700",
  },
  actionRecommendation: {
    ...typography.body,
    color: "#fff",
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  actionExplanation: {
    ...typography.body,
    color: "rgba(255, 255, 255, 0.9)",
  },
  signalsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  signalItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  signalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  signalName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  signalScoreBadge: {
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  signalScoreText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: "700",
  },
  signalDetails: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: 28,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.h3,
    color: colors.error,
    fontWeight: "700",
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  declineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  actionButtonText: {
    ...typography.body,
    fontWeight: "600",
  },
  resetButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  resetButtonText: {
    ...typography.button,
    color: colors.textPrimary,
  },
});