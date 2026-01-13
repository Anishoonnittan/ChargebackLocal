import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { BusinessUser, DarkWebScan, DarkWebBreach } from "../types";

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
};

interface Props {
  viewer: BusinessUser;
  sessionToken: string;
}

// Mock data for demonstration
const MOCK_SCANS: DarkWebScan[] = [
  {
    _id: "1",
    businessId: "biz1",
    scanType: "email",
    searchValue: "customer@example.com",
    maskedValue: "cus***@example.com",
    status: "completed",
    breachesFound: 3,
    lastScanned: Date.now() - 86400000,
    breaches: [
      {
        _id: "b1",
        breachName: "LinkedIn 2021",
        breachDate: Date.now() - 86400000 * 365,
        discoveredDate: Date.now() - 86400000 * 300,
        source: "LinkedIn",
        dataTypes: ["email", "password", "name"],
        severity: "high",
        description: "700M+ user records exposed",
        affectedRecords: 700000000,
        verified: true,
      },
      {
        _id: "b2",
        breachName: "Adobe 2019",
        breachDate: Date.now() - 86400000 * 730,
        discoveredDate: Date.now() - 86400000 * 700,
        source: "Adobe",
        dataTypes: ["email", "encrypted_password"],
        severity: "medium",
        description: "153M user accounts compromised",
        affectedRecords: 153000000,
        verified: true,
      },
    ],
  },
  {
    _id: "2",
    businessId: "biz1",
    scanType: "domain",
    searchValue: "mystore.com",
    maskedValue: "mystore.com",
    status: "completed",
    breachesFound: 0,
    lastScanned: Date.now() - 3600000,
    breaches: [],
  },
];

const MOCK_RECENT_BREACHES: DarkWebBreach[] = [
  {
    _id: "rb1",
    breachName: "E-commerce Platform X",
    breachDate: Date.now() - 86400000 * 7,
    discoveredDate: Date.now() - 86400000 * 2,
    source: "Underground Forum",
    dataTypes: ["email", "password", "card_last4", "address"],
    severity: "critical",
    description: "Payment data from major e-commerce platform leaked",
    affectedRecords: 2500000,
    verified: true,
  },
  {
    _id: "rb2",
    breachName: "Payment Processor Y",
    breachDate: Date.now() - 86400000 * 14,
    discoveredDate: Date.now() - 86400000 * 5,
    source: "Dark Web Marketplace",
    dataTypes: ["card_number", "cvv", "expiry"],
    severity: "critical",
    description: "Full card details being sold on dark web",
    affectedRecords: 500000,
    verified: true,
  },
];

export default function DarkWebMonitoringScreen({ viewer, sessionToken }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"email" | "phone" | "domain" | "card">("email");
  const [isScanning, setIsScanning] = useState(false);
  const [scans] = useState<DarkWebScan[]>(MOCK_SCANS);
  const [selectedBreach, setSelectedBreach] = useState<DarkWebBreach | null>(null);

  const handleScan = async () => {
    if (!searchQuery.trim()) return;
    setIsScanning(true);
    // Simulate scan delay
    setTimeout(() => {
      setIsScanning(false);
      // In real app, would add new scan to list
    }, 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return COLORS.critical;
      case "high": return COLORS.high;
      case "medium": return COLORS.medium;
      case "low": return COLORS.low;
      default: return COLORS.textSecondary;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: COLORS.danger + "15" }]}>
          <View style={[styles.statIconContainer, { backgroundColor: COLORS.danger + "20" }]}>
            <Ionicons name="warning" size={20} color={COLORS.danger} />
          </View>
          <Text style={[styles.statValue, { color: COLORS.danger }]}>12</Text>
          <Text style={styles.statLabel}>Breaches Found</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.warning + "15" }]}>
          <View style={[styles.statIconContainer, { backgroundColor: COLORS.warning + "20" }]}>
            <Ionicons name="people" size={20} color={COLORS.warning} />
          </View>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>847</Text>
          <Text style={styles.statLabel}>Customers at Risk</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.accent + "15" }]}>
          <View style={[styles.statIconContainer, { backgroundColor: COLORS.accent + "20" }]}>
            <Ionicons name="scan" size={20} color={COLORS.accent} />
          </View>
          <Text style={[styles.statValue, { color: COLORS.accent }]}>2,456</Text>
          <Text style={styles.statLabel}>Scans Completed</Text>
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>Dark Web Search</Text>
        <Text style={styles.sectionSubtitle}>
          Check if customer data appears in known breaches
        </Text>

        {/* Search Type Selector */}
        <View style={styles.searchTypeRow}>
          {(["email", "phone", "domain", "card"] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.searchTypeButton, searchType === type && styles.searchTypeButtonActive]}
              onPress={() => setSearchType(type)}
            >
              <Ionicons
                name={
                  type === "email" ? "mail" :
                  type === "phone" ? "call" :
                  type === "domain" ? "globe" : "card"
                }
                size={16}
                color={searchType === type ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.searchTypeText, searchType === type && styles.searchTypeTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Input */}
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={
              searchType === "email" ? "Enter email address..." :
              searchType === "phone" ? "Enter phone number..." :
              searchType === "domain" ? "Enter domain..." : "Enter last 4 digits..."
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            keyboardType={searchType === "phone" || searchType === "card" ? "number-pad" : "default"}
            autoCapitalize="none"
            placeholderTextColor={COLORS.textSecondary}
          />
          <TouchableOpacity
            style={[styles.searchButton, !searchQuery.trim() && styles.searchButtonDisabled]}
            onPress={handleScan}
            disabled={!searchQuery.trim() || isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="search" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Threat Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🚨 Recent Threat Alerts</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {MOCK_RECENT_BREACHES.map((breach) => (
          <TouchableOpacity
            key={breach._id}
            style={styles.threatCard}
            onPress={() => setSelectedBreach(breach)}
          >
            <View style={styles.threatHeader}>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(breach.severity) + "20" }]}>
                <Text style={[styles.severityText, { color: getSeverityColor(breach.severity) }]}>
                  {breach.severity.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.threatDate}>{formatDate(breach.discoveredDate)}</Text>
            </View>
            <Text style={styles.threatTitle}>{breach.breachName}</Text>
            <Text style={styles.threatDescription} numberOfLines={2}>
              {breach.description}
            </Text>
            <View style={styles.threatMeta}>
              <View style={styles.threatMetaItem}>
                <Ionicons name="document-text" size={14} color={COLORS.textSecondary} />
                <Text style={styles.threatMetaText}>{formatNumber(breach.affectedRecords)} records</Text>
              </View>
              <View style={styles.threatMetaItem}>
                <Ionicons name="pricetag" size={14} color={COLORS.textSecondary} />
                <Text style={styles.threatMetaText}>{breach.dataTypes.join(", ")}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Your Scans */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Monitoring</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={18} color={COLORS.primary} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {scans.map((scan) => (
          <View key={scan._id} style={styles.scanCard}>
            <View style={styles.scanHeader}>
              <View style={styles.scanTypeContainer}>
                <Ionicons
                  name={
                    scan.scanType === "email" ? "mail" :
                    scan.scanType === "phone" ? "call" :
                    scan.scanType === "domain" ? "globe" : "card"
                  }
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.scanValue}>{scan.maskedValue}</Text>
              </View>
              {scan.breachesFound > 0 ? (
                <View style={[styles.breachBadge, { backgroundColor: COLORS.danger + "15" }]}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                  <Text style={[styles.breachCount, { color: COLORS.danger }]}>
                    {scan.breachesFound} breaches
                  </Text>
                </View>
              ) : (
                <View style={[styles.breachBadge, { backgroundColor: COLORS.accent + "15" }]}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.accent} />
                  <Text style={[styles.breachCount, { color: COLORS.accent }]}>Clear</Text>
                </View>
              )}
            </View>
            <Text style={styles.scanDate}>
              Last checked: {formatDate(scan.lastScanned)}
            </Text>
            
            {/* Show breaches if any */}
            {scan.breaches.length > 0 && (
              <View style={styles.breachList}>
                {scan.breaches.slice(0, 2).map((breach) => (
                  <View key={breach._id} style={styles.breachItem}>
                    <View style={[styles.breachDot, { backgroundColor: getSeverityColor(breach.severity) }]} />
                    <Text style={styles.breachName}>{breach.breachName}</Text>
                    <Text style={styles.breachTypes}>{breach.dataTypes.length} types exposed</Text>
                  </View>
                ))}
                {scan.breaches.length > 2 && (
                  <Text style={styles.moreBreaches}>+{scan.breaches.length - 2} more</Text>
                )}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Pro Features Upsell */}
      {viewer.tier === "free" && (
        <View style={styles.upsellCard}>
          <View style={styles.upsellIcon}>
            <Ionicons name="diamond" size={28} color="#8B5CF6" />
          </View>
          <Text style={styles.upsellTitle}>Upgrade to Pro</Text>
          <Text style={styles.upsellDescription}>
            Get unlimited dark web scans, real-time alerts, and automatic customer risk scoring.
          </Text>
          <TouchableOpacity style={styles.upsellButton}>
            <Text style={styles.upsellButtonText}>Upgrade Now</Text>
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
  // Stats Row
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
  // Search Section
  searchSection: {
    backgroundColor: COLORS.surface,
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  searchTypeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  searchTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    gap: 4,
  },
  searchTypeButtonActive: {
    backgroundColor: COLORS.primary + "15",
  },
  searchTypeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  searchTypeTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  // Section
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
  // Threat Card
  threatCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  threatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: "700",
  },
  threatDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  threatTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  threatDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  threatMeta: {
    flexDirection: "row",
    gap: 16,
  },
  threatMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  threatMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Scan Card
  scanCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  scanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  scanTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scanValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  breachBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  breachCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  scanDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  breachList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    gap: 6,
  },
  breachItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  breachDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breachName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  breachTypes: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  moreBreaches: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
    marginTop: 4,
  },
  // Upsell Card
  upsellCard: {
    margin: 16,
    padding: 20,
    backgroundColor: "#8B5CF6" + "10",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#8B5CF6" + "30",
    alignItems: "center",
  },
  upsellIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#8B5CF6" + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  upsellTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#8B5CF6",
    marginBottom: 8,
  },
  upsellDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  upsellButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upsellButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});