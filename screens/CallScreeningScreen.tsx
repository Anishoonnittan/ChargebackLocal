import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
// expo-clipboard not available in a0 runtime - clipboard feature disabled
import { Ionicons } from "@expo/vector-icons";
import { theme, spacing, borderRadius, typography, shadows } from "../lib/theme";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

interface CallScreeningScreenProps {
  onBack: () => void;
}

export default function CallScreeningScreen({ onBack }: CallScreeningScreenProps) {
  const [activeTab, setActiveTab] = useState<"analyze" | "history">("analyze");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callerName, setCallerName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [lookupResults, setLookupResults] = useState<any>(null);

  const screenCall = useAction(api.callScreening.screenCall);
  const lookupPhone = useAction(api.callScreening.lookupPhoneNumber);
  const reportPhoneNumberAsScam = useMutation(api.callScreening.reportPhoneNumberAsScam);
  const history = useQuery(api.callScreening.getCallScreeningHistory) || [];

  const extractLikelyPhoneNumber = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "");
    if (digits.length < 8) {
      return null;
    }
    return digits;
  };

  const checkClipboardForNumber = async () => {
    // Clipboard not available in a0 runtime
    Alert.alert(
      "Feature Not Available",
      "Clipboard reading is not available in this version. Please manually enter the phone number."
    );
  };

  const openDeviceSettings = async () => {
    try {
      if (Platform.OS === "ios") {
        await Linking.openURL("app-settings:");
        return;
      }

      await Linking.openSettings();
    } catch {
      Alert.alert(
        "Settings unavailable",
        "Please open your phone Settings app and locate ScamVigil to adjust permissions."
      );
    }
  };

  const lookupPhoneNumberWithOverride = async (overridePhoneNumber?: string) => {
    const numberToLookup = overridePhoneNumber ?? phoneNumber;
    if (!numberToLookup) {
      Alert.alert("Missing Phone Number", "Please enter a phone number to look up.");
      return;
    }

    setIsLookingUp(true);
    setLookupResults(null);
    try {
      const result = await lookupPhone({ phoneNumber: numberToLookup });
      setLookupResults(result);
    } catch (error) {
      Alert.alert("Error", "Failed to lookup phone number. Please try again.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const lookupPhoneNumber = async () => {
    await lookupPhoneNumberWithOverride(undefined);
  };

  const reportThisNumber = async () => {
    if (!lookupResults?.phoneNumber) {
      Alert.alert("Nothing to report", "Look up a number first, then report it.");
      return;
    }

    // iOS supports max 3 buttons; keep it simple.
    Alert.alert(
      "Report this number",
      "Choose the closest match. This helps protect everyone.",
      [
        {
          text: "Impersonation",
          onPress: () => void submitReport("impersonation"),
        },
        {
          text: "Banking / Payment",
          onPress: () => void submitReport("banking"),
        },
        {
          text: "Tech Support",
          onPress: () => void submitReport("tech_support"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const submitReport = async (scamType: string) => {
    try {
      await reportPhoneNumberAsScam({
        phoneNumber: lookupResults.phoneNumber,
        scamType,
        description: transcript ? `User notes: ${transcript.slice(0, 280)}` : undefined,
      });
      Alert.alert("Thank you", "Report submitted. The community is safer because of you.");

      // Re-run lookup so report counts update immediately in UI.
      await lookupPhoneNumberWithOverride(lookupResults.phoneNumber);
    } catch {
      Alert.alert("Report failed", "Couldn't submit your report. Please try again.");
    }
  };

  const analyzeCall = async () => {
    if (!phoneNumber && !transcript) {
      Alert.alert("Missing Info", "Please enter at least a phone number or transcript.");
      return;
    }

    setIsAnalyzing(true);
    setResults(null);
    try {
      const result = await screenCall({
        phoneNumber: phoneNumber || "Unknown",
        callerName: callerName || "Unknown Caller",
        transcript: transcript || "No transcript provided",
      });
      setResults(result);
    } catch (error) {
      Alert.alert("Error", "Failed to analyze call. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 70) return theme.colors.error;
    if (riskScore >= 40) return theme.colors.warning;
    return theme.colors.success;
  };

  const getRiskLevel = (riskScore: number) => {
    if (riskScore >= 70) return "🚨 SCAM";
    if (riskScore >= 40) return "⚠️ SUSPICIOUS";
    return "✅ SAFE";
  };

  const renderAnalyzeTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      {/* System-level protection explainer (3-tier strategy) */}
      <View style={styles.systemProtectionCard}>
        <View style={styles.systemProtectionHeader}>
          <Ionicons name="shield" size={22} color={theme.colors.primary} />
          <Text style={styles.systemProtectionTitle}>Call Protection (3‑Tier)</Text>
        </View>
        <Text style={styles.systemProtectionBody}>
          Tier 1: On‑device blocklist (instant). Tier 2: Frequent updates (near real‑time). Tier 3: Manual lookup (works today).
        </Text>
        <Text style={styles.systemProtectionNote}>
          {Platform.OS === "ios"
            ? "iOS requires a Call Directory Extension for Tier 1 & 2. This build supports Tier 3 (manual lookup) inside the app."
            : "Android real‑time incoming call interception requires native CallScreeningService / PhoneStateReceiver. This build supports Tier 3 (manual lookup) inside the app."}
        </Text>
        <TouchableOpacity style={styles.systemProtectionButton} onPress={openDeviceSettings}>
          <Ionicons name="settings-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.systemProtectionButtonText}>Open device settings</Text>
        </TouchableOpacity>
      </View>

      {/* Phone Number Lookup Section */}
      <View style={styles.lookupSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="search" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Phone Number Lookup</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Check if a number has been reported as a scam by the community
        </Text>

        <View style={styles.lookupInputContainer}>
          <TextInput
            style={styles.lookupInput}
            placeholder="+61 4XX XXX XXX"
            placeholderTextColor={theme.colors.textMuted}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={[
              styles.lookupButton,
              { backgroundColor: isLookingUp ? theme.colors.surfaceVariant : theme.colors.primary },
            ]}
            onPress={lookupPhoneNumber}
            disabled={isLookingUp}
          >
            {isLookingUp ? (
              <ActivityIndicator color={theme.colors.textOnPrimary} size="small" />
            ) : (
              <Ionicons name="search" size={20} color={theme.colors.textOnPrimary} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.secondaryActionButton} onPress={checkClipboardForNumber}>
          <Ionicons name="clipboard-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.secondaryActionButtonText}>Check copied number</Text>
        </TouchableOpacity>

        {lookupResults && (
          <View style={styles.lookupResultsCard}>
            <View style={[styles.lookupRiskBadge, { backgroundColor: getRiskColor(lookupResults.scamLikelihood) }]}>
              <Text style={styles.lookupRiskText}>
                {lookupResults.reportCount === 0
                  ? "✅ No Reports"
                  : lookupResults.riskLevel === "scam"
                    ? "🚨 KNOWN SCAM"
                    : lookupResults.riskLevel === "high_risk"
                      ? "⚠️ HIGH RISK"
                      : "⚠️ SUSPICIOUS"}
              </Text>
            </View>

            <View style={styles.lookupStats}>
              <View style={styles.lookupStat}>
                <Text style={styles.lookupStatValue}>{lookupResults.reportCount}</Text>
                <Text style={styles.lookupStatLabel}>Reports</Text>
              </View>
              <View style={styles.lookupStat}>
                <Text style={styles.lookupStatValue}>{lookupResults.scamLikelihood}%</Text>
                <Text style={styles.lookupStatLabel}>Scam Likelihood</Text>
              </View>
            </View>

            {lookupResults.scamTypes.length > 0 && (
              <View style={styles.scamTypesContainer}>
                <Text style={styles.scamTypesTitle}>Reported Scam Types:</Text>
                {lookupResults.scamTypes.map((type: string, index: number) => (
                  <View key={index} style={styles.scamTypeChip}>
                    <Text style={styles.scamTypeText}>{type}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.lookupRecommendation}>{lookupResults.recommendation}</Text>

            <View style={styles.lookupActionsRow}>
              <TouchableOpacity style={styles.reportButton} onPress={reportThisNumber}>
                <Ionicons name="flag-outline" size={18} color={theme.colors.error} />
                <Text style={styles.reportButtonText}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* Call Analysis Section */}
      <View style={styles.analysisSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="analytics" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Analyze Call Transcript</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Enter what the caller said to check for scam patterns
        </Text>

        <Text style={styles.label}>Caller Name (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder='e.g., "ATO", "Bank of Australia"'
          placeholderTextColor={theme.colors.textMuted}
          value={callerName}
          onChangeText={setCallerName}
        />

        <Text style={styles.label}>What did the caller say?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Type or paste what the caller said during the call..."
          placeholderTextColor={theme.colors.textMuted}
          value={transcript}
          onChangeText={setTranscript}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            { backgroundColor: isAnalyzing ? theme.colors.surfaceVariant : theme.colors.primary },
          ]}
          onPress={analyzeCall}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <ActivityIndicator color={theme.colors.textOnPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.analyzeButtonText}>Analyzing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color={theme.colors.textOnPrimary} />
              <Text style={styles.analyzeButtonText}>Analyze Call</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {results && (
        <View style={styles.resultsSection}>
          <View style={[styles.riskCard, { borderColor: getRiskColor(results.riskScore) }]}>
            <View style={styles.riskHeader}>
              <Text style={styles.riskLabel}>Risk Score</Text>
              <Text style={[styles.riskScore, { color: getRiskColor(results.riskScore) }]}>
                {results.riskScore}/100
              </Text>
            </View>
            <Text style={[styles.riskLevel, { color: getRiskColor(results.riskScore) }]}>
              {getRiskLevel(results.riskScore)}
            </Text>
          </View>

          {results.patterns && results.patterns.length > 0 && (
            <View style={styles.patternsCard}>
              <Text style={styles.cardTitle}>Detected Scam Patterns</Text>
              {results.patterns.map((pattern: any, index: number) => (
                <View key={index} style={styles.patternItem}>
                  <View
                    style={[
                      styles.severityDot,
                      { backgroundColor: pattern.severity === "high" ? theme.colors.error : theme.colors.warning },
                    ]}
                  />
                  <View style={styles.patternDetails}>
                    <Text style={styles.patternType}>{pattern.type}</Text>
                    <Text style={styles.patternDescription}>{pattern.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
              <Text style={styles.recommendationTitle}>Recommendation</Text>
            </View>
            <Text style={styles.recommendationText}>{results.recommendation}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>No Call Analysis History</Text>
          <Text style={styles.emptySubtitle}>
            Analyzed calls will appear here for future reference
          </Text>
        </View>
      ) : (
        history.map((item: any) => (
          <View key={item._id} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyPhone}>{item.phoneNumber}</Text>
              <Text style={[styles.historyRisk, { color: getRiskColor(item.riskScore) }]}>
                {item.riskScore}/100
              </Text>
            </View>
            <Text style={styles.historyName}>{item.callerName}</Text>
            <Text style={styles.historyDate}>
              {new Date(item._creationTime).toLocaleDateString("en-AU")}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Call Screening</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.container}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "analyze" && styles.tabActive]}
            onPress={() => setActiveTab("analyze")}
          >
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={activeTab === "analyze" ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "analyze" && styles.tabTextActive,
              ]}
            >
              Analyze
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "history" && styles.tabActive]}
            onPress={() => setActiveTab("history")}
          >
            <Ionicons
              name="time"
              size={20}
              color={activeTab === "history" ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "history" && styles.tabTextActive,
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "analyze" && renderAnalyzeTab()}
        {activeTab === "history" && renderHistoryTab()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    ...typography.body,
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  tabContent: {
    flex: 1,
  },
  tabContentContainer: {
    padding: spacing.lg,
  },
  lookupSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
  },
  sectionDescription: {
    ...typography.body,
    color: theme.colors.textSecondary,
    marginBottom: spacing.md,
  },
  lookupInputContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  lookupInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: theme.colors.onSurface,
  },
  lookupButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  lookupResultsCard: {
    backgroundColor: theme.colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  lookupRiskBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  lookupRiskText: {
    ...typography.bodyBold,
    color: theme.colors.textOnPrimary,
  },
  lookupStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  lookupStat: {
    alignItems: "center",
  },
  lookupStatValue: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  lookupStatLabel: {
    ...typography.caption,
    color: theme.colors.textSecondary,
  },
  scamTypesContainer: {
    marginBottom: spacing.md,
  },
  scamTypesTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  scamTypeChip: {
    backgroundColor: theme.colors.errorLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: "flex-start",
    marginBottom: spacing.xs,
  },
  scamTypeText: {
    ...typography.caption,
    color: theme.colors.error,
    fontWeight: "600",
  },
  lookupRecommendation: {
    ...typography.body,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: spacing.xl,
  },
  analysisSection: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.bodyBold,
    marginBottom: spacing.xs,
    color: theme.colors.textPrimary,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  analyzeButtonText: {
    ...typography.buttonLarge,
    color: theme.colors.textOnPrimary,
  },
  resultsSection: {
    marginTop: spacing.lg,
  },
  riskCard: {
    backgroundColor: theme.colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  riskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  riskLabel: {
    ...typography.body,
    color: theme.colors.textSecondary,
  },
  riskScore: {
    ...typography.h1,
    fontWeight: "700",
  },
  riskLevel: {
    ...typography.h3,
    fontWeight: "700",
  },
  patternsCard: {
    backgroundColor: theme.colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  patternItem: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  patternDetails: {
    flex: 1,
  },
  patternType: {
    ...typography.bodyBold,
    marginBottom: spacing.xs,
  },
  patternDescription: {
    ...typography.body,
    color: theme.colors.textSecondary,
  },
  recommendationCard: {
    backgroundColor: theme.colors.primaryLight,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  recommendationTitle: {
    ...typography.h4,
  },
  recommendationText: {
    ...typography.body,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  historyItem: {
    backgroundColor: theme.colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  historyPhone: {
    ...typography.bodyBold,
  },
  historyRisk: {
    ...typography.bodyBold,
  },
  historyName: {
    ...typography.body,
    color: theme.colors.textSecondary,
    marginBottom: spacing.xs,
  },
  historyDate: {
    ...typography.caption,
    color: theme.colors.textMuted,
  },
  systemProtectionCard: {
    backgroundColor: theme.colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...shadows.sm,
  },
  systemProtectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  systemProtectionTitle: {
    ...typography.h4,
  },
  systemProtectionBody: {
    ...typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  systemProtectionNote: {
    ...typography.caption,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  systemProtectionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: theme.colors.primaryLight,
  },
  systemProtectionButtonText: {
    ...typography.button,
    color: theme.colors.primary,
  },
  secondaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.background,
    marginBottom: spacing.md,
  },
  secondaryActionButtonText: {
    ...typography.button,
    color: theme.colors.primary,
  },
  lookupActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.md,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: theme.colors.errorLight,
  },
  reportButtonText: {
    ...typography.button,
    color: theme.colors.error,
  },
});