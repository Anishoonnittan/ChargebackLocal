import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { colors, spacing, borderRadius, shadows } from "../lib/theme";

export const ChargebackShieldScanScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    orderId: "",
    amount: "",
    email: "",
    ipAddress: "",
    avsCode: "",
    cvvCode: "",
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runPreAuthCheck = useAction(api.preAuthCheck.runPreAuthDemoCheck);
  const moveToPostAuth = useAction(api.preAuthCheck.moveToPostAuthDemo);

  const handleScan = async () => {
    if (!formData.orderId || !formData.amount || !formData.email) {
      Alert.alert("Missing Fields", "Please fill in Order ID, Amount, and Email");
      return;
    }

    setLoading(true);
    try {
      const response = await runPreAuthCheck({
        orderId: formData.orderId,
        cardNumber: "4111111111111111",
        amount: parseFloat(formData.amount),
        email: formData.email,
        ipAddress: formData.ipAddress || "192.168.1.1",
        avsCode: formData.avsCode || "N",
        cvvCode: formData.cvvCode || "M",
      });

      // Normalize the demo response into the UI shape this screen expects.
      const normalized = {
        riskScore: response.riskScore,
        recommendation: String(response.recommendedAction || "review").toUpperCase(),
        fraudSignals: Array.isArray(response.fraudSignals)
          ? response.fraudSignals.map((s: any) => ({
              active: Boolean(s.triggered),
              name: String(s.signal || "Signal"),
              value: String(s.reason || ""),
            }))
          : [],
        cardBin: String(response.cardBin || "411111"),
      };

      setResult(normalized);
    } catch (error) {
      Alert.alert("Error", "Failed to run fraud check");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToPostAuth = async () => {
    if (!result) return;

    try {
      await moveToPostAuth({
        orderId: formData.orderId,
        amount: parseFloat(formData.amount),
        email: formData.email,
        cardBin: result.cardBin || "411111",
        ipAddress: formData.ipAddress || "192.168.1.1",
        riskScore: result.riskScore,
        fraudSignals: result.fraudSignals,
      });
      Alert.alert("Monitoring started", "This order will be tracked for 120 days.");
      setFormData({ orderId: "", amount: "", email: "", ipAddress: "", avsCode: "", cvvCode: "" });
      setResult(null);
    } catch (error) {
      Alert.alert("Error", "Failed to move order");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.title}>Scan an order</Text>
          <Text style={styles.subtitle}>Run a pre-auth fraud check before you fulfill.</Text>
        </View>

        {result ? (
          <View style={styles.resultContainer}>
            <ResultGauge score={result.riskScore} />
            <RecommendationBadge recommendation={result.recommendation} />
            <FraudSignalsView signals={result.fraudSignals} />

            {result.recommendation !== "BLOCK" ? (
              <TouchableOpacity style={styles.primaryButton} onPress={handleMoveToPostAuth} activeOpacity={0.9}>
                <Ionicons name="pulse" size={18} color={colors.textOnPrimary} />
                <Text style={styles.primaryButtonText}>Move to monitoring</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setResult(null)}
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryButtonText}>Scan another order</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <InputField
              label="Order ID"
              placeholder="ORD-1234"
              value={formData.orderId}
              onChangeText={(text: string) => setFormData({ ...formData, orderId: text })}
            />
            <InputField
              label="Amount"
              placeholder="1250.00"
              keyboardType="decimal-pad"
              value={formData.amount}
              onChangeText={(text: string) => setFormData({ ...formData, amount: text })}
            />
            <InputField
              label="Email"
              placeholder="customer@example.com"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(text: string) => setFormData({ ...formData, email: text })}
              autoCapitalize="none"
            />
            <InputField
              label="IP Address (optional)"
              placeholder="192.168.1.1"
              value={formData.ipAddress}
              onChangeText={(text: string) => setFormData({ ...formData, ipAddress: text })}
            />

            <View style={styles.row}>
              <InputField
                label="AVS"
                placeholder="N"
                value={formData.avsCode}
                onChangeText={(text: string) => setFormData({ ...formData, avsCode: text })}
                containerStyle={{ flex: 1 }}
              />
              <View style={{ width: spacing.md }} />
              <InputField
                label="CVV"
                placeholder="M"
                value={formData.cvvCode}
                onChangeText={(text: string) => setFormData({ ...formData, cvvCode: text })}
                containerStyle={{ flex: 1 }}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleScan}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Ionicons name="scan" size={18} color={colors.textOnPrimary} />
              <Text style={styles.primaryButtonText}>{loading ? "Checking…" : "Run scan"}</Text>
            </TouchableOpacity>

            <View style={styles.tipRow}>
              <Ionicons name="information-circle" size={16} color={colors.info} />
              <Text style={styles.tipText}>
                Tip: If the recommendation is REVIEW, contact the customer before shipping.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

function InputField({
  label,
  containerStyle,
  ...props
}: {
  label: string;
  containerStyle?: any;
  [key: string]: any;
}) {
  return (
    <View style={[{ marginBottom: spacing.lg }, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
    </View>
  );
}

function ResultGauge({ score }: { score: number }) {
  const bg = score >= 70 ? colors.error : score >= 40 ? colors.warning : colors.success;

  return (
    <View style={styles.gaugeContainer}>
      <View style={[styles.gaugeCircle, { backgroundColor: bg }]}>
        <Text style={styles.gaugeScore}>{score}</Text>
        <Text style={styles.gaugeOver}>/100</Text>
      </View>
      <Text style={styles.gaugeLabel}>Risk score</Text>
    </View>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    APPROVE: { bg: colors.success, text: colors.textOnPrimary },
    REVIEW: { bg: colors.warning, text: colors.textOnPrimary },
    BLOCK: { bg: colors.error, text: colors.textOnPrimary },
  };

  const color = map[recommendation] ?? map.REVIEW;

  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.badgeText, { color: color.text }]}>{recommendation}</Text>
    </View>
  );
}

function FraudSignalsView({ signals }: { signals: any[] }) {
  return (
    <View style={styles.signalsContainer}>
      <Text style={styles.signalsTitle}>Fraud signals</Text>
      {signals.map((signal, idx) => (
        <View key={idx} style={styles.signalItem}>
          <Ionicons
            name={signal.active ? "alert-circle" : "checkmark-circle"}
            size={18}
            color={signal.active ? colors.error : colors.success}
          />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.signalName}>{signal.name}</Text>
            <Text style={styles.signalValue}>{signal.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 24,
    paddingTop: spacing.lg,
  },
  pageHeader: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.info,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    ...shadows.md,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.textOnPrimary,
  },
  secondaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  tipRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  // Result styles
  resultContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  gaugeContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  gaugeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  gaugeScore: {
    fontSize: 40,
    fontWeight: "900",
    color: colors.textOnPrimary,
  },
  gaugeOver: {
    marginTop: -2,
    fontSize: 12,
    fontWeight: "900",
    color: "rgba(255,255,255,0.9)",
  },
  gaugeLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontWeight: "700",
  },
  badge: {
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "900",
  },
  signalsContainer: {
    marginBottom: spacing.lg,
  },
  signalsTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  signalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  signalName: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  signalValue: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});