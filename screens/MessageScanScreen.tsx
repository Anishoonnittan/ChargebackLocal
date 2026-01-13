import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { theme } from "../lib/theme";
import SmsAutoScanSettingsScreen from "./SmsAutoScanSettingsScreen";

/**
 * Message Scan Screen
 * Analyzes WhatsApp/SMS messages for scam patterns
 * Features: Real-time analysis, pattern detection, link checking, auto-scan
 */

export default function MessageScanScreen({ onBack, initialMessage }: { onBack: () => void; initialMessage?: string }) {
  const [messageText, setMessageText] = useState(initialMessage || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPasteTip, setShowPasteTip] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const scanMessage = useMutation(api.messageScans.scanMessage);
  const messageScans = useQuery(api.messageScans.getMessageScans, { limit: 10 });
  const stats = useQuery(api.messageScans.getMessageStats);
  const reportToAuthorities = useMutation(api.messageScans.reportToAuthorities);

  const handleScan = async () => {
    if (!messageText.trim()) {
      Alert.alert("Empty Message", "Please paste a message to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      const scanResult = await scanMessage({
        messageText: messageText.trim(),
        source: "manual",
      });
      setResult(scanResult);
    } catch (error) {
      Alert.alert("Error", "Failed to scan message. Please try again.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReport = async () => {
    if (!result?.scanId) return;

    Alert.alert(
      "Report to ACCC Scamwatch?",
      "This will mark the message as reported. You'll need to visit Scamwatch separately to file an official report.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark as Reported",
          onPress: async () => {
            try {
              await reportToAuthorities({ scanId: result.scanId });
              Alert.alert("Reported", "Message marked as reported to authorities");
              // Open Scamwatch
              Linking.openURL("https://www.scamwatch.gov.au/report-a-scam");
            } catch (error) {
              Alert.alert("Error", "Failed to mark as reported");
            }
          },
        },
      ]
    );
  };

  const handlePasteAndScan = () => {
    // Focus the input field
    textInputRef.current?.focus();
    
    // Show helpful tip
    setShowPasteTip(true);
    
    // Hide tip after 3 seconds
    setTimeout(() => {
      setShowPasteTip(false);
    }, 3000);
    
    // Haptic feedback
    Alert.alert(
      "Paste Your Message",
      "Long-press inside the text box and tap 'Paste' to add your message, then tap 'Analyze Message'",
      [{ text: "Got it", style: "default" }]
    );
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "scam":
        return "#DC2626";
      case "high_risk":
        return "#EA580C";
      case "suspicious":
        return "#D97706";
      case "safe":
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case "scam":
        return "SCAM DETECTED";
      case "high_risk":
        return "High Risk";
      case "suspicious":
        return "Suspicious";
      case "safe":
        return "Safe";
      default:
        return "Unknown";
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case "report_to_authorities":
        return "⚠️ Report to ACCC Scamwatch immediately";
      case "block_sender":
        return "🚫 Block sender and do not respond";
      case "do_not_respond":
        return "🛑 Do not respond to this message";
      case "verify_manually":
        return "🔍 Verify sender identity before proceeding";
      case "safe_to_proceed":
        return "✅ Message appears safe";
      default:
        return "";
    }
  };

  // Show settings screen if requested
  if (showSettings) {
    return <SmsAutoScanSettingsScreen onBack={() => setShowSettings(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message Scanner</Text>
        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="shield-checkmark" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Scan WhatsApp/SMS Messages</Text>
          <Text style={styles.heroSubtitle}>
            Paste suspicious messages to check for scam patterns, phishing links, and fraud indicators
          </Text>
        </View>

        {/* Auto-Scan CTA */}
        <TouchableOpacity style={styles.autoScanCta} onPress={() => setShowSettings(true)}>
          <View style={styles.autoScanCtaIcon}>
            <Ionicons name="scan" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.autoScanCtaText}>
            <Text style={styles.autoScanCtaTitle}>Enable Auto-Scan</Text>
            <Text style={styles.autoScanCtaSubtitle}>
              Automatically scan incoming SMS for scams
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Stats Card */}
        {stats && stats.totalScans > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Protection Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalScans}</Text>
                <Text style={styles.statLabel}>Messages Scanned</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.error }]}>
                  {stats.scamCount + stats.highRiskCount}
                </Text>
                <Text style={styles.statLabel}>Scams Blocked</Text>
              </View>
            </View>
          </View>
        )}

        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Paste Message Below</Text>
            <TouchableOpacity 
              style={styles.pasteButton}
              onPress={handlePasteAndScan}
            >
              <Ionicons name="clipboard-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.pasteButtonText}>Paste & Scan</Text>
            </TouchableOpacity>
          </View>
          
          {showPasteTip && (
            <View style={styles.pasteTip}>
              <Ionicons name="information-circle" size={16} color={theme.colors.primary} />
              <Text style={styles.pasteTipText}>
                Long-press in the box below and tap "Paste"
              </Text>
            </View>
          )}
          
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            placeholder="Paste WhatsApp or SMS message here...&#10;&#10;Example:&#10;'URGENT: Your account has been suspended. Click here to verify: http://suspicious-link.com'"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={8}
            value={messageText}
            onChangeText={setMessageText}
            textAlignVertical="top"
          />
          <Text style={styles.inputHint}>
            💡 Tip: Copy suspicious messages from WhatsApp, SMS, or email
          </Text>
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={[
            styles.scanButton,
            (!messageText.trim() || isAnalyzing) && styles.scanButtonDisabled,
          ]}
          onPress={handleScan}
          disabled={!messageText.trim() || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <ActivityIndicator color="#FFF" size="small" />
              <Text style={styles.scanButtonText}>Analyzing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="search" size={20} color="#FFF" />
              <Text style={styles.scanButtonText}>Analyze Message</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Results Section */}
        {result && (
          <View style={styles.resultsSection}>
            {/* Risk Score Card */}
            <View style={[styles.riskCard, { borderColor: getRiskColor(result.riskLevel) }]}>
              <View style={styles.riskHeader}>
                <Ionicons
                  name={result.riskLevel === "safe" ? "shield-checkmark" : "warning"}
                  size={32}
                  color={getRiskColor(result.riskLevel)}
                />
                <View style={styles.riskInfo}>
                  <Text style={[styles.riskLabel, { color: getRiskColor(result.riskLevel) }]}>
                    {getRiskLabel(result.riskLevel)}
                  </Text>
                  <Text style={styles.riskScore}>Risk Score: {result.riskScore}/100</Text>
                </View>
              </View>

              <View style={styles.riskBar}>
                <View
                  style={[
                    styles.riskBarFill,
                    {
                      width: `${result.riskScore}%`,
                      backgroundColor: getRiskColor(result.riskLevel),
                    },
                  ]}
                />
              </View>

              <Text style={styles.recommendation}>{getRecommendationText(result.recommendation)}</Text>
            </View>

            {/* Detected Patterns */}
            {result.detectedPatterns && result.detectedPatterns.length > 0 && (
              <View style={styles.patternsCard}>
                <Text style={styles.patternsTitle}>
                  <Ionicons name="warning-outline" size={18} color={theme.colors.error} /> Detected Red
                  Flags
                </Text>
                {result.detectedPatterns.map((pattern: any, index: number) => (
                  <View key={index} style={styles.patternItem}>
                    <View
                      style={[
                        styles.patternBadge,
                        {
                          backgroundColor:
                            pattern.severity === "high"
                              ? "#FEE2E2"
                              : pattern.severity === "medium"
                              ? "#FEF3C7"
                              : "#F3F4F6",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.patternSeverity,
                          {
                            color:
                              pattern.severity === "high"
                                ? "#DC2626"
                                : pattern.severity === "medium"
                                ? "#D97706"
                                : "#6B7280",
                          },
                        ]}
                      >
                        {pattern.severity.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.patternDescription}>{pattern.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Extracted Links */}
            {result.extractedLinks && result.extractedLinks.length > 0 && (
              <View style={styles.linksCard}>
                <Text style={styles.linksTitle}>
                  <Ionicons name="link-outline" size={18} color={theme.colors.primary} /> Extracted Links
                </Text>
                <Text style={styles.linksWarning}>
                  ⚠️ DO NOT click these links unless you're certain they're safe
                </Text>
                {result.extractedLinks.map((link: string, index: number) => (
                  <View key={index} style={styles.linkItem}>
                    <Ionicons name="globe-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.linkText} numberOfLines={1}>
                      {link}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Extracted Phone Numbers */}
            {result.extractedPhones && result.extractedPhones.length > 0 && (
              <View style={styles.phonesCard}>
                <Text style={styles.phonesTitle}>
                  <Ionicons name="call-outline" size={18} color={theme.colors.primary} /> Phone Numbers
                  Found
                </Text>
                {result.extractedPhones.map((phone: string, index: number) => (
                  <View key={index} style={styles.phoneItem}>
                    <Ionicons name="phone-portrait-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.phoneText}>{phone}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {result.riskLevel === "scam" || result.riskLevel === "high_risk" ? (
                <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
                  <Ionicons name="flag" size={20} color="#FFF" />
                  <Text style={styles.reportButtonText}>Report to ACCC</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.newScanButton}
                onPress={() => {
                  setMessageText("");
                  setResult(null);
                }}
              >
                <Ionicons name="refresh" size={20} color={theme.colors.primary} />
                <Text style={styles.newScanButtonText}>Scan Another Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Scans */}
        {messageScans && messageScans.length > 0 && !result && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Scans</Text>
            {messageScans.slice(0, 5).map((scan: any) => (
              <TouchableOpacity key={scan._id} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Ionicons
                    name={scan.riskLevel === "safe" ? "shield-checkmark" : "warning"}
                    size={20}
                    color={getRiskColor(scan.riskLevel)}
                  />
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyText} numberOfLines={2}>
                    {scan.messageText}
                  </Text>
                  <Text style={styles.historyTime}>
                    {new Date(scan.scannedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.historyBadge, { backgroundColor: getRiskColor(scan.riskLevel) }]}>
                  <Text style={styles.historyBadgeText}>{scan.riskScore}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Educational Section */}
        <View style={styles.eduSection}>
          <Text style={styles.eduTitle}>Common Scam Indicators</Text>
          <View style={styles.eduList}>
            <View style={styles.eduItem}>
              <Text style={styles.eduIcon}>🚨</Text>
              <Text style={styles.eduText}>Urgent language ("act now", "expires today")</Text>
            </View>
            <View style={styles.eduItem}>
              <Text style={styles.eduIcon}>🏛️</Text>
              <Text style={styles.eduText}>
                Claims to be from government/bank (ATO, Centrelink, banks)
              </Text>
            </View>
            <View style={styles.eduItem}>
              <Text style={styles.eduIcon}>🔗</Text>
              <Text style={styles.eduText}>Suspicious links asking for personal information</Text>
            </View>
            <View style={styles.eduItem}>
              <Text style={styles.eduIcon}>💸</Text>
              <Text style={styles.eduText}>Requests for money, gift cards, or cryptocurrency</Text>
            </View>
            <View style={styles.eduItem}>
              <Text style={styles.eduIcon}>📝</Text>
              <Text style={styles.eduText}>Poor grammar or non-native English phrases</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  autoScanCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    ...theme.shadows.md,
  },
  autoScanCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  autoScanCtaText: {
    flex: 1,
  },
  autoScanCtaTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  autoScanCtaSubtitle: {
    fontSize: 13,
    color: "#FFF",
    marginTop: 4,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    ...theme.shadows.sm,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  inputSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  pasteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: 8,
  },
  pasteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  pasteTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  pasteTipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.text,
    lineHeight: 18,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    minHeight: 160,
    lineHeight: 22,
  },
  inputHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    ...theme.shadows.md,
  },
  scanButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  resultsSection: {
    paddingHorizontal: 16,
  },
  riskCard: {
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  riskHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  riskInfo: {
    flex: 1,
  },
  riskLabel: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  riskScore: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  riskBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  riskBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  recommendation: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    lineHeight: 20,
  },
  patternsCard: {
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  patternsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 16,
  },
  patternItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  patternBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  patternSeverity: {
    fontSize: 10,
    fontWeight: "800",
  },
  patternDescription: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  linksCard: {
    padding: 20,
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F59E0B",
    marginBottom: 16,
  },
  linksTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 8,
  },
  linksWarning: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D97706",
    marginBottom: 12,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginBottom: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    fontFamily: "monospace",
  },
  phonesCard: {
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  phonesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 12,
  },
  phoneItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: 8,
    marginBottom: 8,
  },
  phoneText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    fontFamily: "monospace",
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
  },
  reportButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
  newScanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  newScanButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  historySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    ...theme.shadows.sm,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  historyContent: {
    flex: 1,
  },
  historyText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  historyBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  historyBadgeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
  },
  eduSection: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: 16,
    marginBottom: 24,
  },
  eduTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 16,
  },
  eduList: {
    gap: 12,
  },
  eduItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  eduIcon: {
    fontSize: 20,
  },
  eduText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
});