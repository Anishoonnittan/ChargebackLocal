import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { theme } from "../lib/theme";

type ScanType = "crypto_wallet" | "investment_platform" | "guaranteed_returns";

interface InvestmentScanScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function InvestmentScanScreen({ onNavigate }: InvestmentScanScreenProps) {
  const [scanType, setScanType] = useState<ScanType | null>(null);
  const [input, setInput] = useState("");
  const [platformName, setPlatformName] = useState("");
  const [platformUrl, setPlatformUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const scanInvestment = useMutation(api.investmentScans.scanInvestment);
  const recentScans = useQuery(api.investmentScans.getRecentScans, { limit: 3 });

  const handleScan = async () => {
    if (!scanType) {
      Alert.alert("Error", "Please select a scan type");
      return;
    }

    if (scanType === "crypto_wallet" && !input.trim()) {
      Alert.alert("Error", "Please enter a crypto wallet address");
      return;
    }

    if (scanType === "investment_platform" && !platformUrl.trim()) {
      Alert.alert("Error", "Please enter a platform URL");
      return;
    }

    if (scanType === "guaranteed_returns" && !message.trim()) {
      Alert.alert("Error", "Please paste the investment offer message");
      return;
    }

    setLoading(true);
    try {
      const res = await scanInvestment({
        scanType,
        input: input || platformUrl || message,
        platformName: platformName || undefined,
        platformUrl: platformUrl || undefined,
      });
      setResult(res);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to scan investment");
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setScanType(null);
    setInput("");
    setPlatformName("");
    setPlatformUrl("");
    setMessage("");
    setResult(null);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => onNavigate?.("Security")}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Investment Scam Detector</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.headerSubtitle}>
          🛡️ Protect yourself from investment fraud
        </Text>
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={20} color={theme.colors.warning} />
          <Text style={styles.warningText}>
            Australians lost <Text style={styles.warningBold}>$945M</Text> to
            investment scams in 2024
          </Text>
        </View>
      </View>

      {/* Scan Type Selection */}
      {!scanType && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>What would you like to verify?</Text>

          <TouchableOpacity
            style={styles.scanTypeCard}
            onPress={() => setScanType("crypto_wallet")}
          >
            <View style={styles.scanTypeIcon}>
              <Text style={styles.scanTypeEmoji}>₿</Text>
            </View>
            <View style={styles.scanTypeContent}>
              <Text style={styles.scanTypeTitle}>Crypto Wallet Address</Text>
              <Text style={styles.scanTypeDesc}>
                Check if a Bitcoin/Ethereum wallet is linked to scams
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scanTypeCard}
            onPress={() => setScanType("investment_platform")}
          >
            <View style={styles.scanTypeIcon}>
              <Text style={styles.scanTypeEmoji}>📈</Text>
            </View>
            <View style={styles.scanTypeContent}>
              <Text style={styles.scanTypeTitle}>Investment Platform</Text>
              <Text style={styles.scanTypeDesc}>
                Verify if a broker/trading app is ASIC licensed
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scanTypeCard}
            onPress={() => setScanType("guaranteed_returns")}
          >
            <View style={styles.scanTypeIcon}>
              <Text style={styles.scanTypeEmoji}>💰</Text>
            </View>
            <View style={styles.scanTypeContent}>
              <Text style={styles.scanTypeTitle}>Investment Offer</Text>
              <Text style={styles.scanTypeDesc}>
                Analyze message for "guaranteed returns" scam language
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Recent Scans */}
          {recentScans && recentScans.length > 0 && (
            <View style={styles.recentScans}>
              <Text style={styles.sectionTitle}>Recent Scans</Text>
              {recentScans.map((scan: any) => (
                <View key={scan._id} style={styles.recentScanCard}>
                  <View
                    style={[
                      styles.riskDot,
                      scan.riskLevel === "safe" && styles.riskDotSafe,
                      scan.riskLevel === "suspicious" && styles.riskDotSuspicious,
                      scan.riskLevel === "high_risk" && styles.riskDotHighRisk,
                      scan.riskLevel === "scam" && styles.riskDotScam,
                    ]}
                  />
                  <View style={styles.recentScanContent}>
                    <Text style={styles.recentScanTitle} numberOfLines={1}>
                      {scan.input}
                    </Text>
                    <Text style={styles.recentScanMeta}>
                      {scan.scanType.replace("_", " ")} • {scan.riskScore}/100
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.recentScanBadge,
                      scan.riskLevel === "scam" && styles.recentScanBadgeScam,
                    ]}
                  >
                    {scan.riskLevel === "scam" ? "SCAM" : scan.riskLevel}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Crypto Wallet Scanner */}
      {scanType === "crypto_wallet" && !result && (
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={resetScan}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
            <Text style={styles.backButtonText}>Change scan type</Text>
          </TouchableOpacity>

          <Text style={styles.scanTitle}>₿ Crypto Wallet Scanner</Text>
          <Text style={styles.scanDesc}>
            Paste the wallet address someone asked you to send crypto to
          </Text>

          <TextInput
            style={styles.input}
            placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
            placeholderTextColor={theme.colors.textSecondary}
            value={input}
            onChangeText={setInput}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleScan}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
                <Text style={styles.buttonText}>Scan Wallet</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              We check: Scam reports, transaction history, blacklist databases
            </Text>
          </View>
        </View>
      )}

      {/* Investment Platform Scanner */}
      {scanType === "investment_platform" && !result && (
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={resetScan}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
            <Text style={styles.backButtonText}>Change scan type</Text>
          </TouchableOpacity>

          <Text style={styles.scanTitle}>📈 Platform Verification</Text>
          <Text style={styles.scanDesc}>
            Verify if an investment platform is ASIC licensed and legitimate
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Platform name (optional)"
            placeholderTextColor={theme.colors.textSecondary}
            value={platformName}
            onChangeText={setPlatformName}
          />

          <TextInput
            style={styles.input}
            placeholder="https://platform-website.com"
            placeholderTextColor={theme.colors.textSecondary}
            value={platformUrl}
            onChangeText={setPlatformUrl}
            autoCapitalize="none"
            keyboardType="url"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleScan}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.buttonText}>Verify Platform</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              We check: ASIC license, domain age, SSL certificate, scam reports
            </Text>
          </View>
        </View>
      )}

      {/* Guaranteed Returns Scanner */}
      {scanType === "guaranteed_returns" && !result && (
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={resetScan}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
            <Text style={styles.backButtonText}>Change scan type</Text>
          </TouchableOpacity>

          <Text style={styles.scanTitle}>💰 Investment Offer Analysis</Text>
          <Text style={styles.scanDesc}>
            Paste the message/email offering investment returns
          </Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., 'Guaranteed 20% monthly returns! Limited spots available...'"
            placeholderTextColor={theme.colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleScan}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="analytics" size={20} color="#fff" />
                <Text style={styles.buttonText}>Analyze Offer</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              We detect: "Guaranteed returns", urgency tactics, pressure language
            </Text>
          </View>
        </View>
      )}

      {/* Results */}
      {result && (
        <View style={styles.content}>
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.resultScore}>{result.riskScore}/100</Text>
                <Text style={styles.resultLabel}>Risk Score</Text>
              </View>
              <View
                style={[
                  styles.riskBadge,
                  result.riskLevel === "safe" && styles.riskSafe,
                  result.riskLevel === "suspicious" && styles.riskSuspicious,
                  result.riskLevel === "high_risk" && styles.riskHighRisk,
                  result.riskLevel === "scam" && styles.riskScam,
                ]}
              >
                <Text style={styles.riskBadgeText}>
                  {result.riskLevel === "safe"
                    ? "✅ SAFE"
                    : result.riskLevel === "suspicious"
                    ? "⚠️ SUSPICIOUS"
                    : result.riskLevel === "high_risk"
                    ? "🔴 HIGH RISK"
                    : "🚨 SCAM"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.recommendation}>{result.recommendation}</Text>

            {result.redFlags.length > 0 && (
              <View style={styles.redFlagsSection}>
                <Text style={styles.sectionTitle}>🚩 Red Flags Detected</Text>
                {result.redFlags.map((flag: string, idx: number) => (
                  <View key={idx} style={styles.flagItem}>
                    <Ionicons name="close-circle" size={16} color={theme.colors.error} />
                    <Text style={styles.flagText}>{flag}</Text>
                  </View>
                ))}
              </View>
            )}

            {result.warnings.length > 0 && (
              <View style={styles.warningsSection}>
                <Text style={styles.sectionTitle}>⚠️ Warnings</Text>
                {result.warnings.map((warning: any, idx: number) => (
                  <View key={idx} style={styles.warningItem}>
                    <View style={styles.warningHeader}>
                      <Text style={styles.warningType}>{warning.type}</Text>
                      <View
                        style={[
                          styles.severityBadge,
                          warning.severity === "critical" && styles.severityCritical,
                          warning.severity === "high" && styles.severityHigh,
                          warning.severity === "medium" && styles.severityMedium,
                        ]}
                      >
                        <Text style={styles.severityText}>{warning.severity}</Text>
                      </View>
                    </View>
                    <Text style={styles.warningDesc}>{warning.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {result.estimatedLossRisk && (
              <View style={styles.lossRiskBox}>
                <Text style={styles.lossRiskLabel}>Estimated Loss Risk:</Text>
                <Text
                  style={[
                    styles.lossRiskValue,
                    result.estimatedLossRisk === "total_loss_likely" &&
                      styles.lossRiskCritical,
                  ]}
                >
                  {result.estimatedLossRisk.replace("_", " ").toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.scanAnotherButton} onPress={resetScan}>
                <Text style={styles.scanAnotherText}>Scan Another</Text>
              </TouchableOpacity>
              {result.riskLevel === "scam" || result.riskLevel === "high_risk" ? (
                <TouchableOpacity
                  style={styles.reportButton}
                  onPress={() => {
                    Alert.alert(
                      "Report to ACCC",
                      "Would you like to report this scam to Scamwatch?",
                      [
                        { text: "Not now", style: "cancel" },
                        {
                          text: "Report",
                          onPress: () => {
                            // Open ACCC Scamwatch
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="flag" size={18} color="#fff" />
                  <Text style={styles.reportButtonText}>Report to ACCC</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.warning + "15",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 18,
  },
  warningBold: {
    fontWeight: "700",
    color: theme.colors.error,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 16,
  },
  scanTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  scanTypeIcon: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.primary + "15",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  scanTypeEmoji: {
    fontSize: 24,
  },
  scanTypeContent: {
    flex: 1,
  },
  scanTypeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 4,
  },
  scanTypeDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 6,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.primary,
  },
  scanTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 8,
  },
  scanDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: theme.colors.primary + "10",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 18,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resultScore: {
    fontSize: 36,
    fontWeight: "700",
    color: theme.colors.text,
  },
  resultLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  riskBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  riskSafe: {
    backgroundColor: theme.colors.success + "20",
  },
  riskSuspicious: {
    backgroundColor: theme.colors.warning + "20",
  },
  riskHighRisk: {
    backgroundColor: "#FF6B00" + "20",
  },
  riskScam: {
    backgroundColor: theme.colors.error + "20",
  },
  riskBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 16,
  },
  recommendation: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: 20,
  },
  redFlagsSection: {
    marginBottom: 20,
  },
  flagItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  flagText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  warningsSection: {
    marginBottom: 20,
  },
  warningItem: {
    marginBottom: 12,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  warningType: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: theme.colors.warning + "20",
  },
  severityCritical: {
    backgroundColor: theme.colors.error + "20",
  },
  severityHigh: {
    backgroundColor: "#FF6B00" + "20",
  },
  severityMedium: {
    backgroundColor: theme.colors.warning + "20",
  },
  severityText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  warningDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  lossRiskBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.error + "10",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  lossRiskLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  lossRiskValue: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.error,
  },
  lossRiskCritical: {
    color: theme.colors.error,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  scanAnotherButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  scanAnotherText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  reportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: theme.colors.error,
    gap: 6,
  },
  reportButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  recentScans: {
    marginTop: 24,
  },
  recentScanCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  riskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  riskDotSafe: {
    backgroundColor: theme.colors.success,
  },
  riskDotSuspicious: {
    backgroundColor: theme.colors.warning,
  },
  riskDotHighRisk: {
    backgroundColor: "#FF6B00",
  },
  riskDotScam: {
    backgroundColor: theme.colors.error,
  },
  recentScanContent: {
    flex: 1,
  },
  recentScanTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
    marginBottom: 3,
  },
  recentScanMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  recentScanBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
  },
  recentScanBadgeScam: {
    color: theme.colors.error,
  },
});