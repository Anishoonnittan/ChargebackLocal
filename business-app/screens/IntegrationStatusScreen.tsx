import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// =============================================================================
// INTEGRATION STATUS DASHBOARD
// Shows all connected integrations, their status, sync times, and health
// =============================================================================

interface IntegrationStatusScreenProps {
  navigation: any;
}

// Integration type definition
interface Integration {
  _id: string;
  platform: string;
  platformName: string;
  category: string;
  status: "connected" | "disconnected" | "error" | "syncing";
  lastSyncAt: number | null;
  totalItemsSynced: number;
  errorMessage: string | null;
  healthScore: number; // 0-100
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

// Mock data for demo (replace with real Convex query)
const MOCK_INTEGRATIONS: Integration[] = [
  // Payment Gateways
  {
    _id: "1",
    platform: "stripe",
    platformName: "Stripe",
    category: "Payment Gateway",
    status: "connected",
    lastSyncAt: Date.now() - 1000 * 60 * 5, // 5 mins ago
    totalItemsSynced: 1247,
    errorMessage: null,
    healthScore: 98,
    icon: "card",
    color: "#635BFF",
  },
  {
    _id: "2",
    platform: "pin_payments",
    platformName: "Pin Payments",
    category: "Payment Gateway",
    status: "connected",
    lastSyncAt: Date.now() - 1000 * 60 * 12, // 12 mins ago
    totalItemsSynced: 856,
    errorMessage: null,
    healthScore: 100,
    icon: "card-outline",
    color: "#00A86B",
  },
  {
    _id: "3",
    platform: "tyro",
    platformName: "Tyro",
    category: "Payment Gateway",
    status: "error",
    lastSyncAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    totalItemsSynced: 234,
    errorMessage: "API key expired. Please reconnect.",
    healthScore: 0,
    icon: "terminal",
    color: "#FF6B35",
  },
  // E-commerce
  {
    _id: "4",
    platform: "shopify",
    platformName: "Shopify",
    category: "E-commerce",
    status: "connected",
    lastSyncAt: Date.now() - 1000 * 60 * 3, // 3 mins ago
    totalItemsSynced: 3421,
    errorMessage: null,
    healthScore: 95,
    icon: "bag",
    color: "#96BF48",
  },
  {
    _id: "5",
    platform: "woocommerce",
    platformName: "WooCommerce",
    category: "E-commerce",
    status: "syncing",
    lastSyncAt: Date.now() - 1000 * 60 * 30, // 30 mins ago
    totalItemsSynced: 1892,
    errorMessage: null,
    healthScore: 85,
    icon: "storefront",
    color: "#7B5FC7",
  },
  // Accounting
  {
    _id: "6",
    platform: "xero",
    platformName: "Xero",
    category: "Accounting",
    status: "connected",
    lastSyncAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
    totalItemsSynced: 456,
    errorMessage: null,
    healthScore: 92,
    icon: "calculator",
    color: "#13B5EA",
  },
  {
    _id: "7",
    platform: "myob",
    platformName: "MYOB",
    category: "Accounting",
    status: "disconnected",
    lastSyncAt: null,
    totalItemsSynced: 0,
    errorMessage: null,
    healthScore: 0,
    icon: "document-text",
    color: "#8B4513",
  },
  // Shipping
  {
    _id: "8",
    platform: "australia_post",
    platformName: "Australia Post",
    category: "Shipping",
    status: "connected",
    lastSyncAt: Date.now() - 1000 * 60 * 8, // 8 mins ago
    totalItemsSynced: 2156,
    errorMessage: null,
    healthScore: 100,
    icon: "mail",
    color: "#FF0000",
  },
  {
    _id: "9",
    platform: "sendle",
    platformName: "Sendle",
    category: "Shipping",
    status: "connected",
    lastSyncAt: Date.now() - 1000 * 60 * 15, // 15 mins ago
    totalItemsSynced: 987,
    errorMessage: null,
    healthScore: 97,
    icon: "cube",
    color: "#FF6B00",
  },
  // Customer Service
  {
    _id: "10",
    platform: "zendesk",
    platformName: "Zendesk",
    category: "Customer Service",
    status: "connected",
    lastSyncAt: Date.now() - 1000 * 60 * 20, // 20 mins ago
    totalItemsSynced: 543,
    errorMessage: null,
    healthScore: 88,
    icon: "chatbubbles",
    color: "#03363D",
  },
  {
    _id: "11",
    platform: "gorgias",
    platformName: "Gorgias",
    category: "Customer Service",
    status: "disconnected",
    lastSyncAt: null,
    totalItemsSynced: 0,
    errorMessage: null,
    healthScore: 0,
    icon: "headset",
    color: "#4F46E5",
  },
];

export default function IntegrationStatusScreen({
  navigation,
}: IntegrationStatusScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  // TODO: Replace with real Convex queries
  // const integrations = useQuery(api.integrations.listAllIntegrations);
  const integrations = MOCK_INTEGRATIONS;

  // Calculate summary stats
  const connectedCount = integrations.filter(
    (i) => i.status === "connected" || i.status === "syncing"
  ).length;
  const errorCount = integrations.filter((i) => i.status === "error").length;
  const avgHealthScore = Math.round(
    integrations.filter((i) => i.status === "connected").reduce((sum, i) => sum + i.healthScore, 0) /
      (connectedCount || 1)
  );
  const totalItemsSynced = integrations.reduce((sum, i) => sum + i.totalItemsSynced, 0);

  // Get unique categories
  const categories = [...new Set(integrations.map((i) => i.category))];

  // Filter integrations by category
  const filteredIntegrations = selectedCategory
    ? integrations.filter((i) => i.category === selectedCategory)
    : integrations;

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Trigger refresh of all integrations
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  // Handle manual sync for a single integration
  const handleSync = async (integrationId: string) => {
    setSyncing(integrationId);
    // TODO: Call Convex mutation to sync
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSyncing(null);
  };

  // Format relative time
  const formatRelativeTime = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "#22C55E";
      case "syncing":
        return "#3B82F6";
      case "error":
        return "#EF4444";
      case "disconnected":
        return "#6B7280";
      default:
        return "#6B7280";
    }
  };

  // Get health color
  const getHealthColor = (score: number) => {
    if (score >= 90) return "#22C55E";
    if (score >= 70) return "#F59E0B";
    if (score > 0) return "#EF4444";
    return "#6B7280";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Integration Status</Text>
          <Text style={styles.headerSubtitle}>Monitor all connections</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate("IntegrationHub")}
        >
          <Ionicons name="settings-outline" size={22} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: "#1E3A2F" }]}>
            <View style={styles.summaryIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            </View>
            <Text style={[styles.summaryValue, { color: "#22C55E" }]}>
              {connectedCount}
            </Text>
            <Text style={styles.summaryLabel}>Connected</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: "#3B1F1F" }]}>
            <View style={styles.summaryIcon}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
            </View>
            <Text style={[styles.summaryValue, { color: "#EF4444" }]}>
              {errorCount}
            </Text>
            <Text style={styles.summaryLabel}>Errors</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: "#1E293B" }]}>
            <View style={styles.summaryIcon}>
              <Ionicons name="pulse" size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.summaryValue, { color: "#3B82F6" }]}>
              {avgHealthScore}%
            </Text>
            <Text style={styles.summaryLabel}>Health</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: "#2D2235" }]}>
            <View style={styles.summaryIcon}>
              <Ionicons name="sync" size={20} color="#A855F7" />
            </View>
            <Text style={[styles.summaryValue, { color: "#A855F7" }]}>
              {totalItemsSynced.toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Synced</Text>
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
          contentContainerStyle={styles.categoryContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Integration Cards */}
        <View style={styles.integrationList}>
          {filteredIntegrations.map((integration) => (
            <View key={integration._id} style={styles.integrationCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.integrationIcon,
                    { backgroundColor: `${integration.color}20` },
                  ]}
                >
                  <Ionicons
                    name={integration.icon}
                    size={24}
                    color={integration.color}
                  />
                </View>
                <View style={styles.integrationInfo}>
                  <Text style={styles.integrationName}>
                    {integration.platformName}
                  </Text>
                  <Text style={styles.integrationCategory}>
                    {integration.category}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(integration.status)}20` },
                  ]}
                >
                  {integration.status === "syncing" ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(integration.status) },
                      ]}
                    />
                  )}
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(integration.status) },
                    ]}
                  >
                    {integration.status.charAt(0).toUpperCase() +
                      integration.status.slice(1)}
                  </Text>
                </View>
              </View>

              {/* Error Message */}
              {integration.errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="warning" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{integration.errorMessage}</Text>
                </View>
              )}

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Last Sync</Text>
                  <Text style={styles.statValue}>
                    {formatRelativeTime(integration.lastSyncAt)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Items Synced</Text>
                  <Text style={styles.statValue}>
                    {integration.totalItemsSynced.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Health</Text>
                  <View style={styles.healthContainer}>
                    <View style={styles.healthBarBg}>
                      <View
                        style={[
                          styles.healthBarFill,
                          {
                            width: `${integration.healthScore}%`,
                            backgroundColor: getHealthColor(integration.healthScore),
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.healthValue,
                        { color: getHealthColor(integration.healthScore) },
                      ]}
                    >
                      {integration.healthScore}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                {integration.status === "connected" ||
                integration.status === "syncing" ? (
                  <>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSync(integration._id)}
                      disabled={syncing === integration._id}
                    >
                      {syncing === integration._id ? (
                        <ActivityIndicator size="small" color="#3B82F6" />
                      ) : (
                        <Ionicons name="sync" size={18} color="#3B82F6" />
                      )}
                      <Text style={styles.actionButtonText}>
                        {syncing === integration._id ? "Syncing..." : "Sync Now"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="time-outline" size={18} color="#94A3B8" />
                      <Text style={[styles.actionButtonText, { color: "#94A3B8" }]}>
                        View Logs
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="settings-outline" size={18} color="#94A3B8" />
                      <Text style={[styles.actionButtonText, { color: "#94A3B8" }]}>
                        Settings
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : integration.status === "error" ? (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.reconnectButton]}
                    >
                      <Ionicons name="refresh" size={18} color="#EF4444" />
                      <Text style={[styles.actionButtonText, { color: "#EF4444" }]}>
                        Reconnect
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="help-circle-outline" size={18} color="#94A3B8" />
                      <Text style={[styles.actionButtonText, { color: "#94A3B8" }]}>
                        Help
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.connectButton]}
                    onPress={() => navigation.navigate("IntegrationHub")}
                  >
                    <Ionicons name="add-circle" size={18} color="#22C55E" />
                    <Text style={[styles.actionButtonText, { color: "#22C55E" }]}>
                      Connect
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="sync" size={24} color="#3B82F6" />
              <Text style={styles.quickActionText}>Sync All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate("IntegrationHub")}
            >
              <Ionicons name="add-circle-outline" size={24} color="#22C55E" />
              <Text style={styles.quickActionText}>Add New</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="document-text-outline" size={24} color="#A855F7" />
              <Text style={styles.quickActionText}>View Logs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="help-circle-outline" size={24} color="#F59E0B" />
              <Text style={styles.quickActionText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Webhook Status */}
        <View style={styles.webhookCard}>
          <View style={styles.webhookHeader}>
            <Ionicons name="git-network-outline" size={24} color="#3B82F6" />
            <View style={styles.webhookInfo}>
              <Text style={styles.webhookTitle}>Webhook Endpoint</Text>
              <Text style={styles.webhookSubtitle}>Active and receiving events</Text>
            </View>
            <View style={styles.webhookStatusBadge}>
              <View style={styles.webhookStatusDot} />
              <Text style={styles.webhookStatusText}>Live</Text>
            </View>
          </View>
          <View style={styles.webhookUrlContainer}>
            <Text style={styles.webhookUrl} numberOfLines={1}>
              https://api.yourapp.com/webhooks/v1/events
            </Text>
            <TouchableOpacity style={styles.copyButton}>
              <Ionicons name="copy-outline" size={18} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <View style={styles.webhookStats}>
            <View style={styles.webhookStat}>
              <Text style={styles.webhookStatValue}>2,456</Text>
              <Text style={styles.webhookStatLabel}>Events today</Text>
            </View>
            <View style={styles.webhookStat}>
              <Text style={styles.webhookStatValue}>99.8%</Text>
              <Text style={styles.webhookStatLabel}>Success rate</Text>
            </View>
            <View style={styles.webhookStat}>
              <Text style={styles.webhookStatValue}>45ms</Text>
              <Text style={styles.webhookStatLabel}>Avg response</Text>
            </View>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  // Summary Cards
  summaryContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  summaryIcon: {
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  // Category Filters
  categoryContainer: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#3B82F6",
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  // Integration Cards
  integrationList: {
    gap: 16,
  },
  integrationCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  integrationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  integrationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  integrationCategory: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Error Banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B1F1F",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: "#FCA5A5",
  },
  // Stats Row
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#2D3748",
    paddingTop: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F1F5F9",
  },
  healthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  healthBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "#0F172A",
    borderRadius: 3,
    maxWidth: 60,
  },
  healthBarFill: {
    height: 6,
    borderRadius: 3,
  },
  healthValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Actions Row
  actionsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#2D3748",
    paddingTop: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#3B82F6",
  },
  reconnectButton: {},
  connectButton: {},
  // Quick Actions
  quickActionsCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAction: {
    alignItems: "center",
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  // Webhook Card
  webhookCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  webhookHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  webhookInfo: {
    flex: 1,
    marginLeft: 12,
  },
  webhookTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F1F5F9",
  },
  webhookSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  webhookStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E3A2F",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  webhookStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  webhookStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22C55E",
  },
  webhookUrlContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  webhookUrl: {
    flex: 1,
    fontSize: 12,
    fontFamily: "monospace",
    color: "#94A3B8",
  },
  copyButton: {
    padding: 4,
  },
  webhookStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#2D3748",
    paddingTop: 12,
  },
  webhookStat: {
    flex: 1,
    alignItems: "center",
  },
  webhookStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  webhookStatLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
});