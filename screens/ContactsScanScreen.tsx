import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { theme, shadows } from "../lib/theme";

// Feature detection: Check if expo-contacts is available
let Contacts: any = null;
try {
  // Dynamic import to avoid crashes when module is not available
  Contacts = require("expo-contacts");
} catch (e) {
  // Module not available, will use manual mode only
  console.log("expo-contacts not available, using manual mode");
}

interface ContactsScanScreenProps {
  onBack: () => void;
}

export default function ContactsScanScreen({ onBack }: ContactsScanScreenProps) {
  const [mode, setMode] = useState<"auto" | "manual">("manual");
  const [rawPhoneList, setRawPhoneList] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalContacts, setTotalContacts] = useState(0);
  
  const scanContacts = useMutation(api.contactScans.scanContactBatch);
  const recentScans = useQuery(api.contactScans.getRecentScans);
  const latestScan = recentScans?.[0];

  // Auto-scan device contacts (if expo-contacts is available)
  const handleAutoScan = async () => {
    if (!Contacts) {
      Alert.alert(
        "Feature Not Available",
        "Automatic contact scanning requires the expo-contacts package. Please use manual mode or install the package."
      );
      return;
    }

    try {
      // Request permission
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "TrueProfile Pro needs access to your contacts to scan for known scam numbers. This helps protect you from fraud."
        );
        return;
      }

      setScanning(true);
      setProgress(5);

      // Get all contacts with phone numbers
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      setProgress(20);

      // Extract phone numbers
      const contacts: Array<{ name: string; number: string }> = [];
      for (const contact of data) {
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          for (const phone of contact.phoneNumbers) {
            contacts.push({
              name: contact.name || "Unknown",
              number: normalizeNumber(phone.number || ""),
            });
          }
        }
      }

      if (contacts.length === 0) {
        Alert.alert("No Contacts", "No phone numbers found in your contacts.");
        setScanning(false);
        return;
      }

      setTotalContacts(contacts.length);
      setProgress(40);

      // Send to backend for scanning
      await scanContacts({ contacts });
      
      setProgress(100);

      Alert.alert(
        "Scan Complete! ✅",
        `Scanned ${contacts.length} contact${contacts.length === 1 ? "" : "s"} from your device.`,
        [{ text: "View Results" }]
      );
    } catch (error) {
      console.error("Auto-scan error:", error);
      Alert.alert("Scan Failed", "Unable to scan contacts. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  // Manual scan (paste numbers)
  const handleManualScan = async () => {
    if (parsedEntries.length === 0) {
      Alert.alert(
        "Add numbers to scan",
        "Paste one phone number per line (optionally: Name, Number), then tap Scan."
      );
      return;
    }

    if (parsedEntries.length > 2000) {
      Alert.alert(
        "Too many numbers",
        "Please paste 2,000 numbers or fewer in one scan."
      );
      return;
    }

    setScanning(true);
    setTotalContacts(parsedEntries.length);
    setProgress(12);

    try {
      setProgress(35);
      await scanContacts({ contacts: parsedEntries });
      setProgress(100);

      Alert.alert(
        "Scan Complete! ✅",
        `Scanned ${parsedEntries.length} phone number${parsedEntries.length === 1 ? "" : "s"}.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Manual scan error:", error);
      Alert.alert("Scan Failed", "Unable to scan numbers. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const normalizeNumber = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return "";

    const cleaned = trimmed.replace(/[\s\-\(\)]/g, "");
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.startsWith("0")) return `+61${cleaned.slice(1)}`;
    if (cleaned.startsWith("61")) return `+${cleaned}`;
    return cleaned;
  };

  const parsedEntries = useMemo(() => {
    const lines = rawPhoneList
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return lines
      .map((line) => {
        // Supported formats:
        // 1) +61400111222
        // 2) John Smith, +61400111222
        const parts = line
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);

        if (parts.length >= 2) {
          return {
            name: parts[0],
            number: normalizeNumber(parts.slice(1).join(", ")),
          };
        }

        return {
          name: "Unknown",
          number: normalizeNumber(parts[0] ?? ""),
        };
      })
      .filter((entry) => entry.number.length > 0);
  }, [rawPhoneList]);

  const latestScanComputed = useMemo(() => {
    if (!latestScan) {
      return null;
    }

    const results = Array.isArray((latestScan as any).results) ? ((latestScan as any).results as any[]) : [];
    const total = typeof (latestScan as any).totalContacts === "number" ? (latestScan as any).totalContacts : results.length;

    const safeCount = results.filter((r) => r.riskLevel === "safe").length;
    const suspiciousCount = results.filter((r) => r.riskLevel === "suspicious").length;
    const riskyCount = results.filter((r) => r.riskLevel === "high_risk" || r.riskLevel === "known_scam").length;

    const riskyContacts = results
      .filter((r) => r.riskLevel !== "safe")
      .map((r) => ({
        name: r.name || "Unknown",
        phoneNumber: r.phoneNumber,
        riskLevel: r.riskLevel,
        riskScore: r.riskScore,
        reasons: r.reasons || [],
        country: r.country,
        reportCount: r.reportCount,
      }));

    const timestamp = (latestScan as any).completedAt ?? (latestScan as any).createdAt ?? Date.now();

    return {
      totalScanned: total,
      safeCount,
      suspiciousCount,
      riskyCount,
      riskyContacts,
      scannedAt: timestamp,
    };
  }, [latestScan]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "known_scam":
      case "high_risk":
        return theme.colors.error;
      case "suspicious":
        return theme.colors.warning;
      default:
        return theme.colors.success;
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "known_scam":
      case "high_risk":
        return "close-circle";
      case "suspicious":
        return "warning";
      default:
        return "checkmark-circle";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phone Number Scanner</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="call" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Scan Phone Numbers</Text>
          <Text style={styles.heroSubtitle}>
            {Contacts 
              ? "Scan your device contacts automatically or paste numbers manually."
              : "Paste phone numbers to check (e.g., WhatsApp senders, missed calls)."}
          </Text>
        </View>

        {/* Mode Toggle (only show if expo-contacts is available) */}
        {Contacts && (
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, mode === "auto" && styles.modeButtonActive]}
              onPress={() => setMode("auto")}
            >
              <Ionicons
                name="phone-portrait"
                size={20}
                color={mode === "auto" ? theme.colors.textOnPrimary : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  mode === "auto" && styles.modeButtonTextActive,
                ]}
              >
                Device Contacts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === "manual" && styles.modeButtonActive]}
              onPress={() => setMode("manual")}
            >
              <Ionicons
                name="clipboard"
                size={20}
                color={mode === "manual" ? theme.colors.textOnPrimary : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  mode === "manual" && styles.modeButtonTextActive,
                ]}
              >
                Manual Entry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Auto Mode: Scan Device Contacts */}
        {mode === "auto" && Contacts && (
          <View style={styles.autoModeCard}>
            <Ionicons name="phone-portrait" size={48} color={theme.colors.primary} />
            <Text style={styles.autoModeTitle}>Scan Your Contacts</Text>
            <Text style={styles.autoModeText}>
              We'll check all phone numbers in your contacts against known scam numbers and suspicious patterns.
            </Text>
            {!scanning && (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleAutoScan}
                accessibilityLabel="Scan device contacts"
              >
                <Ionicons name="scan" size={24} color={theme.colors.textOnPrimary} />
                <Text style={styles.scanButtonText}>Scan My Contacts</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Manual Mode: Paste Numbers */}
        {mode === "manual" && (
          <>
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Ionicons name="clipboard" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.inputTitle}>Numbers to scan</Text>
                <TouchableOpacity
                  style={styles.pasteButton}
                  onPress={() => {
                    Alert.alert(
                      "📋 Paste Phone Numbers",
                      "Long-press inside the text box and tap 'Paste' to add phone numbers you copied from WhatsApp, SMS, or anywhere else.",
                      [{ text: "Got it" }]
                    );
                  }}
                >
                  <Ionicons name="clipboard-outline" size={14} color={theme.colors.primary} />
                  <Text style={styles.pasteButtonText}>Paste & Scan</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                value={rawPhoneList}
                onChangeText={setRawPhoneList}
                placeholder={"One per line\n\nExamples:\n+61400111222\nATO Scam, +61299998888"}
                placeholderTextColor={theme.colors.textMuted}
                multiline
                style={styles.textArea}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>
                Detected: {parsedEntries.length} number{parsedEntries.length === 1 ? "" : "s"}
              </Text>
            </View>

            {!scanning && (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleManualScan}
                accessibilityLabel="Start scanning pasted numbers"
              >
                <Ionicons name="scan" size={24} color={theme.colors.textOnPrimary} />
                <Text style={styles.scanButtonText}>Scan These Numbers</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Scanning Progress */}
        {scanning && (
          <View style={styles.progressCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.progressTitle}>Scanning Numbers...</Text>
            <Text style={styles.progressSubtitle}>
              Analyzing {Math.round(progress)}% of {totalContacts} number{totalContacts === 1 ? "" : "s"}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        {/* Latest Scan Results */}
        {latestScanComputed && !scanning && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Latest Scan Results</Text>
            <Text style={styles.sectionSubtitle}>
              Scanned on {new Date(latestScanComputed.scannedAt).toLocaleDateString()}
            </Text>

            {/* Summary Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{latestScanComputed.totalScanned}</Text>
                <Text style={styles.statLabel}>Numbers Scanned</Text>
              </View>
              <View style={[styles.statCard, { borderColor: theme.colors.success, borderWidth: 2 }]}>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                  {latestScanComputed.safeCount}
                </Text>
                <Text style={styles.statLabel}>Safe Numbers</Text>
              </View>
              <View style={[styles.statCard, { borderColor: theme.colors.warning, borderWidth: 2 }]}>
                <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                  {latestScanComputed.suspiciousCount}
                </Text>
                <Text style={styles.statLabel}>Suspicious</Text>
              </View>
              <View style={[styles.statCard, { borderColor: theme.colors.error, borderWidth: 2 }]}>
                <Text style={[styles.statValue, { color: theme.colors.error }]}>
                  {latestScanComputed.riskyCount}
                </Text>
                <Text style={styles.statLabel}>High Risk</Text>
              </View>
            </View>

            {/* Risky Contacts */}
            {latestScanComputed.riskyContacts.length > 0 && (
              <View style={styles.riskySection}>
                <Text style={styles.riskySectionTitle}>⚠️ Risky Numbers Found</Text>
                {latestScanComputed.riskyContacts.map((contact: any, index: number) => (
                  <View key={index} style={styles.contactCard}>
                    <View style={styles.contactHeader}>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.contactNumber}>{contact.phoneNumber}</Text>
                      </View>
                      <View
                        style={[
                          styles.riskBadge,
                          { backgroundColor: getRiskColor(contact.riskLevel) },
                        ]}
                      >
                        <Ionicons
                          name={getRiskIcon(contact.riskLevel)}
                          size={16}
                          color={theme.colors.textOnPrimary}
                        />
                        <Text style={styles.riskBadgeText}>
                          {contact.riskLevel.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    {contact.reasons && contact.reasons.length > 0 && (
                      <View style={styles.reasonsList}>
                        {contact.reasons.map((reason: string, i: number) => (
                          <View key={i} style={styles.reasonItem}>
                            <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
                            <Text style={styles.reasonText}>{reason}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.blockButton}
                      onPress={() => {
                        Alert.alert(
                          "Tip",
                          "For WhatsApp safety: block the number in WhatsApp and report it to Scamwatch if money was requested."
                        );
                      }}
                    >
                      <Ionicons name="hand-left" size={16} color={theme.colors.error} />
                      <Text style={styles.blockButtonText}>Block & Report Guidance</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Rescan Button */}
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={handleManualScan}
              accessibilityLabel="Rescan pasted numbers"
            >
              <Ionicons name="refresh" size={20} color={theme.colors.primary} />
              <Text style={styles.rescanButtonText}>Rescan These Numbers</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What We Check</Text>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoCardTitle}>Known Scam Numbers</Text>
              <Text style={styles.infoCardText}>
                Cross-reference against reported scam numbers and high-risk patterns.
              </Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="flag" size={24} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoCardTitle}>Country Mismatches</Text>
              <Text style={styles.infoCardText}>
                Numbers claiming to be local authorities but originating from unexpected regions.
              </Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="warning" size={24} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoCardTitle}>Suspicious Patterns</Text>
              <Text style={styles.infoCardText}>
                Reused number formats, premium-rate patterns, and common scam indicators.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.privacyText}>
            We only analyze the numbers you paste here. We don't access your address book in this build.
          </Text>
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    ...theme.typography.h3,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  hero: {
    padding: 24,
    alignItems: "center",
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    ...theme.typography.h2,
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  modeToggle: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
  },
  modeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  modeButtonText: {
    ...theme.typography.button,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  modeButtonTextActive: {
    color: theme.colors.textOnPrimary,
  },
  inputCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  inputTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
  },
  pasteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  pasteButtonText: {
    ...theme.typography.caption,
    color: theme.colors.textOnPrimary,
    fontWeight: "600",
  },
  textArea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    ...theme.typography.body,
    textAlignVertical: "top",
  },
  inputHint: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  scanButtonText: {
    ...theme.typography.button,
    color: theme.colors.textOnPrimary,
    fontSize: 18,
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
    ...shadows.sm,
  },
  progressTitle: {
    ...theme.typography.h3,
    marginTop: 12,
  },
  progressSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 4,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  resultsSection: {
    padding: 24,
  },
  sectionTitle: {
    ...theme.typography.h2,
    marginBottom: 8,
  },
  sectionSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    ...shadows.sm,
  },
  statValue: {
    ...theme.typography.h1,
    color: theme.colors.primary,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  riskySection: {
    marginBottom: 16,
  },
  riskySectionTitle: {
    ...theme.typography.h3,
    marginBottom: 12,
  },
  contactCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
    ...shadows.sm,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...theme.typography.h4,
    marginBottom: 4,
  },
  contactNumber: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  riskBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.textOnPrimary,
    fontWeight: "700",
    fontSize: 10,
  },
  reasonsList: {
    marginBottom: 8,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  reasonText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  blockButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  blockButtonText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    fontWeight: "600",
  },
  rescanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  rescanButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  infoSection: {
    padding: 24,
  },
  infoTitle: {
    ...theme.typography.h3,
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    ...shadows.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoCardTitle: {
    ...theme.typography.h4,
    marginBottom: 8,
  },
  infoCardText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  privacyText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  autoModeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
    ...shadows.md,
  },
  autoModeTitle: {
    ...theme.typography.h3,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  autoModeText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
});