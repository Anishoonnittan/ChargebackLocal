import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

/**
 * Bulk Profile Comparison Screen
 * Upload CSV or paste URLs to scan multiple profiles at once
 * Shows ranked comparison table with export options
 */

type BulkComparisonScreenProps = {
  onBack: () => void;
};

export default function BulkComparisonScreen({ onBack }: BulkComparisonScreenProps) {
  const [textInput, setTextInput] = useState("");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"trustScore" | "riskLevel">("trustScore");
  const [filterRisk, setFilterRisk] = useState<string | null>(null);

  const createBulkScan = useMutation(api.bulkScans.createBulkScan);
  const bulkScanHistory = useQuery(api.bulkScans.getUserBulkScans);
  const bulkScanStatus = useQuery(
    api.bulkScans.getBulkScanStatus,
    currentJobId ? { jobId: currentJobId } : "skip"
  );
  const bulkScanResults = useQuery(
    api.bulkScans.getBulkScanResults,
    currentJobId ? { jobId: currentJobId, sortBy, filterRisk: filterRisk || undefined } : "skip"
  );

  const handleStartScan = async () => {
    const urls = textInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (urls.length === 0) {
      Alert.alert("No URLs", "Please enter at least one profile URL");
      return;
    }

    if (urls.length > 500) {
      Alert.alert("Too Many URLs", "Maximum 500 profiles per bulk scan");
      return;
    }

    try {
      const result = await createBulkScan({
        profileUrls: urls,
        fileName: "Manual Paste",
        source: "manual_paste",
      });

      setCurrentJobId(result.jobId);
      setTextInput("");
      Alert.alert("Scan Started", `Scanning ${urls.length} profiles...`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to start bulk scan");
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "real":
        return theme.colors.success;
      case "suspicious":
        return theme.colors.warning;
      case "fake":
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bulk Comparison</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="layers-outline" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Scan Multiple Profiles</Text>
          <Text style={styles.heroSubtitle}>
            Upload a CSV or paste URLs to compare 50-500 profiles at once
          </Text>
        </View>

        {/* Input Section */}
        {!currentJobId && (
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Paste Profile URLs (one per line):</Text>
            <TextInput
              style={styles.textArea}
              placeholder="https://facebook.com/profile1&#10;https://instagram.com/profile2&#10;https://twitter.com/profile3"
              placeholderTextColor={theme.colors.textSecondary}
              value={textInput}
              onChangeText={setTextInput}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            <Text style={styles.formatHint}>
              Supported: Facebook, Instagram, Twitter, LinkedIn
            </Text>

            <TouchableOpacity
              style={[
                styles.scanButton,
                textInput.trim().length === 0 && styles.scanButtonDisabled,
              ]}
              onPress={handleStartScan}
              disabled={textInput.trim().length === 0}
            >
              <Ionicons name="scan-outline" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>Start Bulk Scan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress Section */}
        {currentJobId && bulkScanStatus && bulkScanStatus.status !== "completed" && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Scanning Profiles...</Text>
              <Text style={styles.progressPercentage}>{bulkScanStatus.progress}%</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${bulkScanStatus.progress}%` },
                ]}
              />
            </View>

            <View style={styles.progressStats}>
              <View style={styles.progressStatItem}>
                <Text style={styles.progressStatValue}>
                  {bulkScanStatus.processedCount}/{bulkScanStatus.totalProfiles}
                </Text>
                <Text style={styles.progressStatLabel}>Processed</Text>
              </View>
              <View style={styles.progressStatItem}>
                <Text style={[styles.progressStatValue, { color: theme.colors.success }]}>
                  {bulkScanStatus.successCount}
                </Text>
                <Text style={styles.progressStatLabel}>Success</Text>
              </View>
              <View style={styles.progressStatItem}>
                <Text style={[styles.progressStatValue, { color: theme.colors.error }]}>
                  {bulkScanStatus.failureCount}
                </Text>
                <Text style={styles.progressStatLabel}>Failed</Text>
              </View>
            </View>

            {bulkScanStatus.estimatedTimeRemaining > 0 && (
              <Text style={styles.estimatedTime}>
                ⏱️ Estimated time: ~{Math.ceil(bulkScanStatus.estimatedTimeRemaining / 60)} min
              </Text>
            )}

            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
              style={{ marginTop: 16 }}
            />
          </View>
        )}

        {/* Results Section */}
        {currentJobId && bulkScanResults && bulkScanResults.status === "completed" && (
          <>
            {/* Aggregate Stats */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: theme.colors.success }]}>
                <Text style={styles.statValue}>{bulkScanResults.stats.real}</Text>
                <Text style={styles.statLabel}>Real Profiles</Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: "#fff", borderWidth: 2, borderColor: theme.colors.warning },
                ]}
              >
                <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                  {bulkScanResults.stats.suspicious}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Suspicious</Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: "#fff", borderWidth: 2, borderColor: theme.colors.error },
                ]}
              >
                <Text style={[styles.statValue, { color: theme.colors.error }]}>
                  {bulkScanResults.stats.fake}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Fake/Bot</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.statValue}>{bulkScanResults.stats.averageTrustScore}%</Text>
                <Text style={styles.statLabel}>Avg Trust Score</Text>
              </View>
            </View>

            {/* Filter & Sort Controls */}
            <View style={styles.controls}>
              <Text style={styles.controlsTitle}>Filter & Sort:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.filterChip, !filterRisk && styles.filterChipActive]}
                  onPress={() => setFilterRisk(null)}
                >
                  <Text
                    style={[styles.filterChipText, !filterRisk && styles.filterChipTextActive]}
                  >
                    All ({bulkScanResults.stats.total})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, filterRisk === "fake" && styles.filterChipActive]}
                  onPress={() => setFilterRisk("fake")}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filterRisk === "fake" && styles.filterChipTextActive,
                    ]}
                  >
                    🚨 Fake ({bulkScanResults.stats.fake})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    filterRisk === "suspicious" && styles.filterChipActive,
                  ]}
                  onPress={() => setFilterRisk("suspicious")}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filterRisk === "suspicious" && styles.filterChipTextActive,
                    ]}
                  >
                    ⚠️ Suspicious ({bulkScanResults.stats.suspicious})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, filterRisk === "real" && styles.filterChipActive]}
                  onPress={() => setFilterRisk("real")}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filterRisk === "real" && styles.filterChipTextActive,
                    ]}
                  >
                    ✅ Real ({bulkScanResults.stats.real})
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Results Table */}
            <View style={styles.resultsCard}>
              <Text style={styles.resultsTitle}>
                Scan Results ({bulkScanResults.results.length})
              </Text>

              {bulkScanResults.results.slice(0, 50).map((result, index) => (
                <View key={index} style={styles.resultRow}>
                  <View style={styles.resultLeft}>
                    <View
                      style={[
                        styles.riskDot,
                        { backgroundColor: getRiskColor(result.riskLevel) },
                      ]}
                    />
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName} numberOfLines={1}>
                        {result.profileName || "Unknown"}
                      </Text>
                      <Text style={styles.resultUrl} numberOfLines={1}>
                        {result.profileUrl}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.resultRight}>
                    <Text style={styles.resultScore}>{result.trustScore}%</Text>
                    <View
                      style={[
                        styles.resultBadge,
                        { backgroundColor: getRiskColor(result.riskLevel) },
                      ]}
                    >
                      <Text style={styles.resultBadgeText}>
                        {result.riskLevel.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {bulkScanResults.results.length > 50 && (
                <Text style={styles.moreResultsText}>
                  + {bulkScanResults.results.length - 50} more results
                </Text>
              )}
            </View>

            {/* Export Button */}
            <TouchableOpacity style={styles.exportButton}>
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.exportButtonText}>Export to CSV</Text>
            </TouchableOpacity>

            {/* New Scan Button */}
            <TouchableOpacity
              style={styles.newScanButton}
              onPress={() => setCurrentJobId(null)}
            >
              <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.newScanButtonText}>Start New Bulk Scan</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Recent Scans History */}
        {!currentJobId && bulkScanHistory && bulkScanHistory.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Recent Bulk Scans</Text>
            {bulkScanHistory.slice(0, 5).map((scan) => (
              <TouchableOpacity
                key={scan.jobId}
                style={styles.historyRow}
                onPress={() => setCurrentJobId(scan.jobId)}
              >
                <View style={styles.historyLeft}>
                  <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyFileName}>{scan.fileName || "Bulk Scan"}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyCount}>{scan.totalProfiles} profiles</Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    alignItems: "center",
    ...theme.shadows.md,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  inputCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    ...theme.shadows.sm,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
    height: 160,
    fontFamily: "monospace",
  },
  formatHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  scanButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
    ...theme.shadows.md,
  },
  scanButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    ...theme.shadows.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  progressStatItem: {
    alignItems: "center",
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  progressStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  estimatedTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    ...theme.shadows.sm,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#fff",
    marginTop: 4,
    opacity: 0.9,
  },
  controls: {
    marginTop: 20,
  },
  controlsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  resultsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    ...theme.shadows.sm,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  resultUrl: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  resultRight: {
    alignItems: "flex-end",
  },
  resultScore: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  resultBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  moreResultsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  exportButton: {
    backgroundColor: theme.colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
    ...theme.shadows.md,
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  newScanButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  newScanButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    ...theme.shadows.sm,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  historyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  historyFileName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  historyDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  historyRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyCount: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});