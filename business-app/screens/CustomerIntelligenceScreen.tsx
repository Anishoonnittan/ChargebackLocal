import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BusinessUser, CustomerProfile, ListEntry } from "../types";

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
  purple: "#8B5CF6",
  trusted: "#10B981",
  blocked: "#EF4444",
};

interface Props {
  viewer: BusinessUser;
  sessionToken: string;
}

// Mock customer data
const MOCK_CUSTOMERS: CustomerProfile[] = [
  {
    _id: "c1",
    customerId: "cust_001",
    email: "john.doe@email.com",
    name: "John Doe",
    phone: "+1 555-123-4567",
    riskScore: 15,
    riskLevel: "trusted",
    trustScore: 95,
    totalOrders: 47,
    totalSpent: 4820.50,
    averageOrderValue: 102.56,
    firstOrderDate: Date.now() - 86400000 * 365,
    lastOrderDate: Date.now() - 86400000 * 2,
    chargebackCount: 0,
    chargebackRate: 0,
    disputesWon: 0,
    disputesLost: 0,
    isBlacklisted: false,
    isWhitelisted: true,
    isVIP: true,
    tags: ["vip", "repeat_buyer", "high_value"],
    emailVerified: true,
    phoneVerified: true,
    identityVerified: true,
    darkWebExposure: 0,
    breachCount: 0,
  },
  {
    _id: "c2",
    customerId: "cust_002",
    email: "jane.smith@email.com",
    name: "Jane Smith",
    riskScore: 35,
    riskLevel: "low",
    trustScore: 78,
    totalOrders: 12,
    totalSpent: 1456.00,
    averageOrderValue: 121.33,
    firstOrderDate: Date.now() - 86400000 * 180,
    lastOrderDate: Date.now() - 86400000 * 14,
    chargebackCount: 0,
    chargebackRate: 0,
    disputesWon: 0,
    disputesLost: 0,
    isBlacklisted: false,
    isWhitelisted: false,
    isVIP: false,
    tags: ["repeat_buyer"],
    emailVerified: true,
    phoneVerified: false,
    identityVerified: false,
    darkWebExposure: 15,
    breachCount: 1,
  },
  {
    _id: "c3",
    customerId: "cust_003",
    email: "suspicious@tempmail.com",
    name: "Mike Johnson",
    riskScore: 78,
    riskLevel: "high",
    trustScore: 25,
    totalOrders: 3,
    totalSpent: 2899.99,
    averageOrderValue: 966.66,
    firstOrderDate: Date.now() - 86400000 * 7,
    lastOrderDate: Date.now() - 86400000,
    chargebackCount: 1,
    chargebackRate: 33.33,
    disputesWon: 0,
    disputesLost: 1,
    isBlacklisted: false,
    isWhitelisted: false,
    isVIP: false,
    tags: ["high_risk", "chargeback_history"],
    emailVerified: false,
    phoneVerified: false,
    identityVerified: false,
    darkWebExposure: 65,
    breachCount: 4,
  },
  {
    _id: "c4",
    customerId: "cust_004",
    email: "blocked@scammer.com",
    name: "Blocked User",
    riskScore: 100,
    riskLevel: "blocked",
    trustScore: 0,
    totalOrders: 2,
    totalSpent: 1500.00,
    averageOrderValue: 750.00,
    firstOrderDate: Date.now() - 86400000 * 30,
    lastOrderDate: Date.now() - 86400000 * 28,
    chargebackCount: 2,
    chargebackRate: 100,
    disputesWon: 0,
    disputesLost: 2,
    isBlacklisted: true,
    isWhitelisted: false,
    isVIP: false,
    tags: ["blocked", "fraudster", "multiple_chargebacks"],
    emailVerified: false,
    phoneVerified: false,
    identityVerified: false,
    darkWebExposure: 90,
    breachCount: 8,
  },
];

// Mock blacklist/whitelist entries
const MOCK_LIST_ENTRIES: ListEntry[] = [
  {
    _id: "l1",
    type: "email",
    value: "blocked@scammer.com",
    maskedValue: "blo***@scammer.com",
    listType: "blacklist",
    reason: "Multiple chargebacks",
    addedBy: "System",
    addedAt: Date.now() - 86400000 * 28,
    hitCount: 5,
    lastHit: Date.now() - 86400000,
  },
  {
    _id: "l2",
    type: "ip",
    value: "192.168.1.100",
    maskedValue: "192.168.1.***",
    listType: "blacklist",
    reason: "Velocity attack detected",
    addedBy: "Auto-rule",
    addedAt: Date.now() - 86400000 * 14,
    hitCount: 12,
    lastHit: Date.now() - 3600000,
  },
  {
    _id: "l3",
    type: "email",
    value: "john.doe@email.com",
    maskedValue: "joh***@email.com",
    listType: "whitelist",
    reason: "VIP customer",
    addedBy: "Manual",
    addedAt: Date.now() - 86400000 * 180,
    hitCount: 47,
    lastHit: Date.now() - 86400000 * 2,
  },
  {
    _id: "l4",
    type: "device",
    value: "fp_abc123xyz",
    maskedValue: "fp_abc***",
    listType: "watchlist",
    reason: "Suspicious activity",
    addedBy: "System",
    addedAt: Date.now() - 86400000 * 5,
    hitCount: 3,
    lastHit: Date.now() - 7200000,
  },
];

export default function CustomerIntelligenceScreen({ viewer, sessionToken }: Props) {
  const [activeTab, setActiveTab] = useState<"profiles" | "lists">("profiles");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [listFilter, setListFilter] = useState<"all" | "blacklist" | "whitelist" | "watchlist">("all");

  const getRiskColor = (level: string) => {
    switch (level) {
      case "trusted": return COLORS.trusted;
      case "low": return COLORS.accent;
      case "medium": return COLORS.warning;
      case "high": return COLORS.danger;
      case "blocked": return COLORS.blocked;
      default: return COLORS.textSecondary;
    }
  };

  const getListColor = (type: string) => {
    switch (type) {
      case "blacklist": return COLORS.danger;
      case "whitelist": return COLORS.accent;
      case "watchlist": return COLORS.warning;
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

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`;
  };

  const filteredCustomers = MOCK_CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredListEntries = MOCK_LIST_ENTRIES.filter(e =>
    listFilter === "all" || e.listType === listFilter
  );

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "profiles" && styles.tabActive]}
          onPress={() => setActiveTab("profiles")}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === "profiles" ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "profiles" && styles.tabTextActive]}>
            Customer Profiles
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "lists" && styles.tabActive]}
          onPress={() => setActiveTab("lists")}
        >
          <Ionicons
            name="list"
            size={18}
            color={activeTab === "lists" ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "lists" && styles.tabTextActive]}>
            Black/Whitelists
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Customer Profiles Tab */}
        {activeTab === "profiles" && (
          <>
            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search customers by name or email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={COLORS.textSecondary}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: COLORS.trusted }]}>1,247</Text>
                <Text style={styles.statLabel}>Trusted</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: COLORS.warning }]}>89</Text>
                <Text style={styles.statLabel}>At Risk</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: COLORS.blocked }]}>23</Text>
                <Text style={styles.statLabel}>Blocked</Text>
              </View>
            </View>

            {/* Customer List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Customers</Text>
              {filteredCustomers.map((customer) => (
                <TouchableOpacity
                  key={customer._id}
                  style={styles.customerCard}
                  onPress={() => setSelectedCustomer(customer)}
                >
                  <View style={styles.customerHeader}>
                    <View style={styles.customerAvatar}>
                      <Text style={styles.customerInitial}>
                        {customer.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.customerInfo}>
                      <View style={styles.customerNameRow}>
                        <Text style={styles.customerName}>{customer.name}</Text>
                        {customer.isVIP && (
                          <View style={styles.vipBadge}>
                            <Ionicons name="star" size={10} color="#F59E0B" />
                            <Text style={styles.vipText}>VIP</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.customerEmail}>{customer.email}</Text>
                    </View>
                    <View style={[styles.riskBadge, { backgroundColor: getRiskColor(customer.riskLevel) + "15" }]}>
                      <Text style={[styles.riskScore, { color: getRiskColor(customer.riskLevel) }]}>
                        {customer.riskScore}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.customerStats}>
                    <View style={styles.customerStat}>
                      <Ionicons name="cart" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.customerStatText}>{customer.totalOrders} orders</Text>
                    </View>
                    <View style={styles.customerStat}>
                      <Ionicons name="cash" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.customerStatText}>{formatCurrency(customer.totalSpent)}</Text>
                    </View>
                    {customer.chargebackCount > 0 && (
                      <View style={styles.customerStat}>
                        <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                        <Text style={[styles.customerStatText, { color: COLORS.danger }]}>
                          {customer.chargebackCount} CB
                        </Text>
                      </View>
                    )}
                  </View>
                  {customer.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {customer.tags.slice(0, 3).map((tag, idx) => (
                        <View key={idx} style={styles.tag}>
                          <Text style={styles.tagText}>{tag.replace("_", " ")}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Lists Tab */}
        {activeTab === "lists" && (
          <>
            {/* Filter Buttons */}
            <View style={styles.filterRow}>
              {(["all", "blacklist", "whitelist", "watchlist"] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterButton, listFilter === filter && styles.filterButtonActive]}
                  onPress={() => setListFilter(filter)}
                >
                  <Text style={[styles.filterText, listFilter === filter && styles.filterTextActive]}>
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Add Entry Button */}
            <TouchableOpacity style={styles.addEntryButton}>
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addEntryText}>Add Entry</Text>
            </TouchableOpacity>

            {/* List Entries */}
            <View style={styles.section}>
              {filteredListEntries.map((entry) => (
                <View key={entry._id} style={styles.listEntryCard}>
                  <View style={styles.listEntryHeader}>
                    <View style={[styles.listTypeBadge, { backgroundColor: getListColor(entry.listType) + "15" }]}>
                      <Ionicons
                        name={
                          entry.listType === "blacklist" ? "ban" :
                          entry.listType === "whitelist" ? "checkmark-circle" : "eye"
                        }
                        size={14}
                        color={getListColor(entry.listType)}
                      />
                      <Text style={[styles.listTypeText, { color: getListColor(entry.listType) }]}>
                        {entry.listType}
                      </Text>
                    </View>
                    <View style={styles.entryTypeBadge}>
                      <Ionicons
                        name={
                          entry.type === "email" ? "mail" :
                          entry.type === "ip" ? "globe" :
                          entry.type === "phone" ? "call" :
                          entry.type === "device" ? "phone-portrait" : "card"
                        }
                        size={12}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.entryTypeText}>{entry.type}</Text>
                    </View>
                  </View>
                  <Text style={styles.entryValue}>{entry.maskedValue}</Text>
                  <Text style={styles.entryReason}>{entry.reason}</Text>
                  <View style={styles.entryFooter}>
                    <Text style={styles.entryMeta}>
                      Added by {entry.addedBy} • {entry.hitCount} hits
                    </Text>
                    <TouchableOpacity style={styles.removeButton}>
                      <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Customer Detail Modal */}
      <Modal
        visible={selectedCustomer !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedCustomer(null)}
      >
        {selectedCustomer && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Customer Profile</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                <View style={styles.largeAvatar}>
                  <Text style={styles.largeInitial}>
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.profileName}>{selectedCustomer.name}</Text>
                <Text style={styles.profileEmail}>{selectedCustomer.email}</Text>
                <View style={[styles.profileRiskBadge, { backgroundColor: getRiskColor(selectedCustomer.riskLevel) + "15" }]}>
                  <Text style={[styles.profileRiskText, { color: getRiskColor(selectedCustomer.riskLevel) }]}>
                    Risk Score: {selectedCustomer.riskScore} • {selectedCustomer.riskLevel.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.danger + "15" }]}>
                  <Ionicons name="ban" size={18} color={COLORS.danger} />
                  <Text style={[styles.actionButtonText, { color: COLORS.danger }]}>Block</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.accent + "15" }]}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
                  <Text style={[styles.actionButtonText, { color: COLORS.accent }]}>Whitelist</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.warning + "15" }]}>
                  <Ionicons name="eye" size={18} color={COLORS.warning} />
                  <Text style={[styles.actionButtonText, { color: COLORS.warning }]}>Watch</Text>
                </TouchableOpacity>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statGridItem}>
                  <Text style={styles.statGridValue}>{selectedCustomer.totalOrders}</Text>
                  <Text style={styles.statGridLabel}>Orders</Text>
                </View>
                <View style={styles.statGridItem}>
                  <Text style={styles.statGridValue}>{formatCurrency(selectedCustomer.totalSpent)}</Text>
                  <Text style={styles.statGridLabel}>Total Spent</Text>
                </View>
                <View style={styles.statGridItem}>
                  <Text style={styles.statGridValue}>{selectedCustomer.trustScore}%</Text>
                  <Text style={styles.statGridLabel}>Trust Score</Text>
                </View>
                <View style={styles.statGridItem}>
                  <Text style={[styles.statGridValue, selectedCustomer.chargebackCount > 0 && { color: COLORS.danger }]}>
                    {selectedCustomer.chargebackCount}
                  </Text>
                  <Text style={styles.statGridLabel}>Chargebacks</Text>
                </View>
              </View>

              {/* Verification Status */}
              <View style={styles.verificationSection}>
                <Text style={styles.sectionTitle}>Verification Status</Text>
                <View style={styles.verificationRow}>
                  <View style={styles.verificationItem}>
                    <Ionicons
                      name={selectedCustomer.emailVerified ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={selectedCustomer.emailVerified ? COLORS.accent : COLORS.danger}
                    />
                    <Text style={styles.verificationText}>Email</Text>
                  </View>
                  <View style={styles.verificationItem}>
                    <Ionicons
                      name={selectedCustomer.phoneVerified ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={selectedCustomer.phoneVerified ? COLORS.accent : COLORS.danger}
                    />
                    <Text style={styles.verificationText}>Phone</Text>
                  </View>
                  <View style={styles.verificationItem}>
                    <Ionicons
                      name={selectedCustomer.identityVerified ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={selectedCustomer.identityVerified ? COLORS.accent : COLORS.danger}
                    />
                    <Text style={styles.verificationText}>Identity</Text>
                  </View>
                </View>
              </View>

              {/* Dark Web Exposure */}
              <View style={styles.darkWebSection}>
                <Text style={styles.sectionTitle}>Dark Web Exposure</Text>
                <View style={styles.darkWebCard}>
                  <View style={styles.darkWebScore}>
                    <Text style={[styles.darkWebScoreValue, { color: selectedCustomer.darkWebExposure > 50 ? COLORS.danger : COLORS.accent }]}>
                      {selectedCustomer.darkWebExposure}%
                    </Text>
                    <Text style={styles.darkWebScoreLabel}>Exposure Score</Text>
                  </View>
                  <Text style={styles.darkWebBreaches}>
                    {selectedCustomer.breachCount} breaches detected
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  // Tab Navigation
  tabRow: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
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
  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  // Stats
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Section
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  // Customer Card
  customerCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  customerInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  vipBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B" + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  vipText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#F59E0B",
  },
  customerEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  riskBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  riskScore: {
    fontSize: 14,
    fontWeight: "700",
  },
  customerStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  customerStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  customerStatText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
  },
  tag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: "capitalize",
  },
  // Filter
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary + "15",
    borderColor: COLORS.primary + "30",
  },
  filterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  filterTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  // Add Entry Button
  addEntryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addEntryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // List Entry Card
  listEntryCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  listEntryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  listTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  listTypeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  entryTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  entryTypeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: "capitalize",
  },
  entryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  entryReason: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  entryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  removeButton: {
    padding: 4,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  // Profile Header
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  largeInitial: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.primary,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  profileRiskBadge: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  profileRiskText: {
    fontSize: 13,
    fontWeight: "600",
  },
  // Quick Actions
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  statGridItem: {
    width: (SCREEN_WIDTH - 58) / 2,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statGridValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  statGridLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // Verification Section
  verificationSection: {
    marginBottom: 24,
  },
  verificationRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  verificationItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  verificationText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  // Dark Web Section
  darkWebSection: {
    marginBottom: 24,
  },
  darkWebCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  darkWebScore: {
    alignItems: "center",
    marginBottom: 8,
  },
  darkWebScoreValue: {
    fontSize: 36,
    fontWeight: "700",
  },
  darkWebScoreLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  darkWebBreaches: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});