import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../lib/theme";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import PreAuthScanScreen from "./PreAuthScanScreen";
import BulkScanScreen from "./BulkScanScreen";
import StoreConnectionScreen from "./StoreConnectionScreen";
import ConfigurationScreen from "./ConfigurationScreen";

type PreAuthTab = "pending" | "all" | "config";

export default function PreAuthDashboardScreen({
  onBack,
  sessionToken,
}: {
  onBack?: () => void;
  sessionToken: string;
}) {
  const [activeTab, setActiveTab] = useState<PreAuthTab>("pending");
  const [activeView, setActiveView] = useState<"dashboard" | "manualScan" | "bulkScan">("dashboard");
  const [configView, setConfigView] = useState<"dashboard" | "storeConnection" | "configSettings">("dashboard");

  if (activeView === "manualScan") {
    return (
      <PreAuthScanScreen
        sessionToken={sessionToken}
        onBack={() => setActiveView("dashboard")}
      />
    );
  }

  if (activeView === "bulkScan") {
    return (
      <BulkScanScreen
        sessionToken={sessionToken}
        onBack={() => setActiveView("dashboard")}
        onOrdersScanned={() => setActiveView("dashboard")}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Ionicons name="shield-half" size={28} color={colors.primary} />
            <Text style={styles.headerTitle}>Pre-Authorization v2.0</Text>
          </View>
          <Text style={styles.headerSubtitle}>Review orders before fulfillment</Text>

          {/* Visible debug marker so we can confirm updates are reflected in Expo */}
          <Text style={styles.debugMarker}>✅ BULK + MANUAL SCAN ENABLED</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setActiveView("bulkScan")}
            style={styles.bulkScanPill}
            activeOpacity={0.85}
          >
            <Ionicons name="albums" size={16} color={colors.textOnPrimary} />
            <Text style={styles.bulkScanPillText}>Bulk</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveView("manualScan")}
            style={styles.manualScanPill}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={16} color={colors.textOnPrimary} />
            <Text style={styles.manualScanPillText}>Manual</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TabButton
          label="Pending Review"
          badge={true}
          active={activeTab === "pending"}
          onPress={() => setActiveTab("pending")}
        />
        <TabButton
          label="All Orders"
          active={activeTab === "all"}
          onPress={() => setActiveTab("all")}
        />
        <TabButton
          label="Configuration"
          active={activeTab === "config"}
          onPress={() => setActiveTab("config")}
        />
      </View>

      {/* Content */}
      {activeTab === "pending" && (
        <PendingOrdersTab
          sessionToken={sessionToken}
          onManualScan={() => setActiveView("manualScan")}
        />
      )}
      {activeTab === "all" && <AllOrdersTab sessionToken={sessionToken} />}
      {activeTab === "config" && (
        <ConfigurationTab sessionToken={sessionToken} />
      )}
    </SafeAreaView>
  );
}

function TabButton({
  label,
  badge,
  active,
  onPress,
}: {
  label: string;
  badge?: boolean;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      <Text
        style={[styles.tabButtonText, active && styles.tabButtonTextActive]}
      >
        {label}
      </Text>
      {badge && <View style={styles.badge} />}
    </TouchableOpacity>
  );
}

// ========================================
// PENDING ORDERS TAB
// ========================================
function PendingOrdersTab({
  sessionToken,
  onManualScan,
}: {
  sessionToken: string;
  onManualScan: () => void;
}) {
  const config = useQuery(api.preAuthCheck.getPreAuthConfig, { sessionToken });

  // Use a single list so we can show:
  // - Pending review orders (PENDING_REVIEW)
  // - Approved orders waiting to move to post-auth (AUTO_APPROVED / MANUAL_APPROVED)
  // - Orders already moved (MOVED_TO_POST_AUTH)
  const allOrders = useQuery(api.preAuthCheck.getAllPreAuthOrders, {
    sessionToken,
    limit: 50,
  });

  const approveOrder = useMutation(api.preAuthCheck.approveOrder);
  const declineOrder = useMutation(api.preAuthCheck.declineOrder);
  const moveToPostAuthWithAnalysis = useAction(api.preAuthCheck.moveToPostAuthWithAnalysis);

  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [movingToPostAuth, setMovingToPostAuth] = useState(false);

  const pendingOrders = (Array.isArray(allOrders) ? allOrders : []).filter(
    (o: any) => o.status === "PENDING_REVIEW"
  );
  const approvedOrders = (Array.isArray(allOrders) ? allOrders : []).filter(
    (o: any) => o.status === "AUTO_APPROVED" || o.status === "MANUAL_APPROVED"
  );
  const movedToPostAuthOrders = (Array.isArray(allOrders) ? allOrders : []).filter(
    (o: any) => o.status === "MOVED_TO_POST_AUTH"
  );

  const handleApprove = async (orderId: any) => {
    try {
      await approveOrder({
        sessionToken,
        preAuthOrderId: orderId,
        notes: notes || undefined,
      });

      // If configured, immediately move the approved order to post-auth (deep scan + monitoring).
      // This matches the "approve → automatically progresses" workflow.
      if (config?.autoMoveManualApprovedToPostAuth) {
        await handleMoveToPostAuth(orderId);
      } else {
        Alert.alert("✅ Approved", "Order approved for fulfillment");
        setReviewingOrderId(null);
        setNotes("");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDecline = async (orderId: any) => {
    Alert.alert(
      "Decline Order",
      "Are you sure you want to decline this order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              await declineOrder({
                sessionToken,
                preAuthOrderId: orderId,
                notes: notes || undefined,
              });
              Alert.alert("❌ Declined", "Order declined");
              setReviewingOrderId(null);
              setNotes("");
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const handleMoveToPostAuth = async (orderId: any) => {
    setMovingToPostAuth(true);
    try {
      const result = await moveToPostAuthWithAnalysis({
        sessionToken,
        preAuthOrderId: orderId,
      });
      
      Alert.alert(
        "✅ Full Analysis Complete",
        `Pre-Auth Score: ${result.preAuthScore}/100\nPost-Auth Score: ${result.postAuthScore}/100\n\n${result.recommendation}`,
        [{ text: "OK" }]
      );
      setReviewingOrderId(null);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setMovingToPostAuth(false);
    }
  };

  if (allOrders === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if ((pendingOrders?.length ?? 0) === 0 && (approvedOrders?.length ?? 0) === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="checkmark-circle" size={64} color={colors.success} />
        <Text style={styles.emptyStateTitle}>All Clear!</Text>
        <Text style={styles.emptyStateText}>
          No orders pending review. All orders are either auto-approved or
          auto-declined.
        </Text>

        <TouchableOpacity
          style={styles.emptyPrimaryButton}
          onPress={onManualScan}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={20} color={colors.textOnPrimary} />
          <Text style={styles.emptyPrimaryButtonText}>Manual Scan New Order</Text>
        </TouchableOpacity>

        <Text style={styles.emptyHintText}>
          Tip: Use Manual Scan for one-off checks, or connect a store for automatic scanning.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      {/* Quick access even when there are orders */}
      <TouchableOpacity
        style={styles.inlineManualScanButton}
        onPress={onManualScan}
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle" size={18} color={colors.primary} />
        <Text style={styles.inlineManualScanButtonText}>Manual Scan New Order</Text>
      </TouchableOpacity>

      {approvedOrders.length > 0 ? (
        <View style={{ marginBottom: spacing.md }}>
          <Text style={styles.sectionHeaderTitle}>✅ Ready for Post-Auth</Text>
          <Text style={styles.sectionHeaderSubtitle}>
            Approved orders (auto or manual). Move them to deep scan monitoring.
          </Text>
        </View>
      ) : null}

      {approvedOrders.map((order: any) => (
        <View key={order._id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <Text style={styles.orderId}>Order {order.orderId}</Text>
              <Text style={styles.orderEmail}>{order.customerEmail}</Text>
            </View>
            <View style={styles.orderHeaderRight}>
              <View style={[styles.statusBadge, { backgroundColor: colors.successLight }]}>
                <Text style={styles.statusBadgeText}>{order.status.replace("_", " ")}</Text>
              </View>
            </View>
          </View>

          <View style={styles.orderDetails}>
            <DetailRow icon="cash" label="Amount" value={`$${order.orderAmount.toFixed(2)}`} />
            <DetailRow icon="speedometer" label="Risk Score" value={`${order.preAuthScore}/100`} />
            <DetailRow icon="calendar" label="Created" value={new Date(order.createdAt).toLocaleString()} />
          </View>

          <TouchableOpacity
            style={styles.postAuthButton}
            onPress={() => handleMoveToPostAuth(order._id)}
            disabled={movingToPostAuth}
          >
            <Ionicons name="analytics" size={18} color={colors.primary} />
            <Text style={styles.postAuthButtonText}>Move to Post-Auth Monitoring</Text>
          </TouchableOpacity>
        </View>
      ))}

      {pendingOrders.length > 0 ? (
        <View style={{ marginBottom: spacing.md }}>
          <Text style={styles.sectionHeaderTitle}>⚠️ Pending Review</Text>
          <Text style={styles.sectionHeaderSubtitle}>
            Orders needing a decision before fulfillment.
          </Text>
        </View>
      ) : null}

      {pendingOrders.map((order: any) => (
        <View key={order._id} style={styles.orderCard}>
          {/* Order Header */}
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <Text style={styles.orderId}>Order {order.orderId}</Text>
              <Text style={styles.orderEmail}>{order.customerEmail}</Text>
            </View>
            <View style={styles.orderHeaderRight}>
              <View
                style={[
                  styles.riskBadge,
                  {
                    backgroundColor:
                      order.preAuthRiskLevel === "HIGH"
                        ? colors.errorLight
                        : colors.warningLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.riskBadgeText,
                    {
                      color:
                        order.preAuthRiskLevel === "HIGH"
                          ? colors.error
                          : colors.warning,
                    },
                  ]}
                >
                  {order.preAuthRiskLevel} RISK
                </Text>
              </View>
            </View>
          </View>

          {/* Order Details */}
          <View style={styles.orderDetails}>
            <DetailRow
              icon="cash"
              label="Amount"
              value={`$${order.orderAmount.toFixed(2)}`}
            />
            <DetailRow
              icon="calendar"
              label="Created"
              value={new Date(order.createdAt).toLocaleString()}
            />
            <DetailRow
              icon="speedometer"
              label="Risk Score"
              value={`${order.preAuthScore}/100`}
            />
          </View>

          {/* Failed Checks */}
          <View style={styles.failedChecks}>
            <Text style={styles.sectionLabel}>Failed Checks:</Text>
            {order.preAuthChecks
              .filter((check: any) => !check.passed)
              .map((check: any, index: number) => (
                <View key={index} style={styles.checkItem}>
                  <Ionicons
                    name="alert-circle"
                    size={16}
                    color={colors.error}
                  />
                  <Text style={styles.checkText}>{check.details}</Text>
                </View>
              ))}
          </View>

          {/* Review Actions */}
          {reviewingOrderId === order._id ? (
            <View style={styles.reviewSection}>
              <TextInput
                style={styles.notesInput}
                placeholder="Add review notes (optional)"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleApprove(order._id)}
                >
                  <Ionicons name="checkmark" size={20} color={colors.success} />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => handleDecline(order._id)}
                >
                  <Ionicons name="close" size={20} color={colors.error} />
                  <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.postAuthButton}
                onPress={() => handleMoveToPostAuth(order._id)}
                disabled={movingToPostAuth}
              >
                <Ionicons name="analytics" size={18} color={colors.primary} />
                <Text style={styles.postAuthButtonText}>
                  Run Full Post-Auth Analysis
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setReviewingOrderId(null)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.reviewSection}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.declineButtonSolid}
                  onPress={() => handleDecline(order._id)}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.declineButtonSolidText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.approveButtonSolid}
                  onPress={() => handleApprove(order._id)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.approveButtonSolidText}>Approve</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setReviewingOrderId(order._id)}
                style={styles.expandButton}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.expandButtonText}>Add Notes / Full Analysis</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      {movedToPostAuthOrders.length > 0 ? (
        <View style={{ marginTop: spacing.xl }}>
          <Text style={styles.sectionHeaderTitle}>🛡️ In Post-Auth</Text>
          <Text style={styles.sectionHeaderSubtitle}>
            These orders are already in deep scan monitoring.
          </Text>
        </View>
      ) : null}

      {movedToPostAuthOrders.slice(0, 3).map((order: any) => (
        <View key={order._id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <Text style={styles.orderId}>Order {order.orderId}</Text>
              <Text style={styles.orderEmail}>{order.customerEmail}</Text>
            </View>
            <View style={styles.orderHeaderRight}>
              <View style={[styles.statusBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.statusBadgeText}>Monitoring</Text>
              </View>
            </View>
          </View>
          <View style={styles.orderDetails}>
            <DetailRow icon="cash" label="Amount" value={`$${order.orderAmount.toFixed(2)}`} />
            <DetailRow icon="speedometer" label="Risk Score" value={`${order.preAuthScore}/100`} />
            <DetailRow icon="calendar" label="Moved" value={new Date(order.movedToPostAuthAt).toLocaleString()} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ========================================
// ALL ORDERS TAB
// ========================================
function AllOrdersTab({ sessionToken }: { sessionToken: string }) {
  const allOrders = useQuery(api.preAuthCheck.getAllPreAuthOrders, {
    sessionToken,
    limit: 50,
  });

  if (allOrders === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      {allOrders.map((order: any) => (
        <View key={order._id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <Text style={styles.orderId}>Order {order.orderId}</Text>
              <Text style={styles.orderEmail}>{order.customerEmail}</Text>
            </View>
            <View style={styles.orderHeaderRight}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(order.status),
                  },
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {order.status.replace("_", " ")}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.orderDetails}>
            <DetailRow
              icon="cash"
              label="Amount"
              value={`$${order.orderAmount.toFixed(2)}`}
            />
            <DetailRow
              icon="speedometer"
              label="Score"
              value={`${order.preAuthScore}/100`}
            />
            <DetailRow
              icon="calendar"
              label="Created"
              value={new Date(order.createdAt).toLocaleDateString()}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ========================================
// CONFIGURATION TAB
// ========================================
function ConfigurationTab({ sessionToken }: { sessionToken: string }) {
  const config = useQuery(api.preAuthCheck.getPreAuthConfig, { sessionToken });
  const updateConfig = useMutation(api.preAuthCheck.updatePreAuthConfig);
  const [configView, setConfigView] = useState<"dashboard" | "storeConnection" | "configSettings" | "monitoringSettings">("dashboard");

  // If viewing Store Connection or Config Settings, render those screens instead
  if (configView === "storeConnection") {
    return (
      <StoreConnectionScreen onBack={() => setConfigView("dashboard")} />
    );
  }

  if (configView === "configSettings") {
    return (
      <ConfigurationScreen
        sessionToken={sessionToken}
        onBack={() => setConfigView("dashboard")}
        onConnectStore={() => setConfigView("storeConnection")}
        initialSection="rules"
      />
    );
  }

  if (configView === "monitoringSettings") {
    return (
      <ConfigurationScreen
        sessionToken={sessionToken}
        onBack={() => setConfigView("dashboard")}
        onConnectStore={() => setConfigView("storeConnection")}
        initialSection="monitoring"
      />
    );
  }

  // Main Configuration Dashboard
  return (
    <ScrollView style={styles.scrollView}>
      {/* Navigation Buttons */}
      <View style={styles.configSection}>
        <Text style={styles.configTitle}>Automatic Scanning Setup</Text>
        <Text style={styles.configDescription}>
          Connect your store and configure automatic order scanning
        </Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setConfigView("storeConnection")}
          activeOpacity={0.85}
        >
          <Ionicons name="git-network" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navButtonTitle}>Store Connection</Text>
            <Text style={styles.navButtonSubtitle}>Connect Shopify, WooCommerce, or API</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setConfigView("configSettings")}
          activeOpacity={0.85}
        >
          <Ionicons name="settings" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navButtonTitle}>Auto-Decision Rules</Text>
            <Text style={styles.navButtonSubtitle}>Configure automatic approvals and blocks</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setConfigView("monitoringSettings")}
          activeOpacity={0.85}
        >
          <Ionicons name="time" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navButtonTitle}>Monitoring Settings</Text>
            <Text style={styles.navButtonSubtitle}>Choose when daily 120-day checks run</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ========================================
// HELPER COMPONENTS
// ========================================
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function RuleItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.ruleItem}>
      <View style={styles.ruleLeft}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
        <Text style={styles.ruleLabel}>{label}</Text>
      </View>
      <Text style={styles.ruleValue}>{value}</Text>
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "AUTO_APPROVED":
    case "MANUAL_APPROVED":
      return colors.successLight;
    case "AUTO_DECLINED":
    case "MANUAL_DECLINED":
      return colors.errorLight;
    case "PENDING_REVIEW":
      return colors.warningLight;
    case "MOVED_TO_POST_AUTH":
      return colors.primaryLight;
    default:
      return colors.surfaceVariant;
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
  backButtonPlaceholder: {
    width: 24,
    height: 24,
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
  debugMarker: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  bulkScanPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  bulkScanPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textOnPrimary,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    position: "absolute",
    top: 8,
    right: 8,
  },
  manualScanPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    marginLeft: spacing.sm,
  },
  manualScanPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textOnPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderHeaderRight: {},
  orderId: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  orderEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  riskBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  riskBadgeText: {
    ...typography.caption,
    fontWeight: "600",
  },
  orderDetails: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  failedChecks: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
  },
  sectionLabel: {
    ...typography.body,
    color: colors.error,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  checkText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
  reviewSection: {
    marginTop: spacing.md,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    minHeight: 60,
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  approveButtonText: {
    ...typography.body,
    color: colors.success,
    fontWeight: "600",
  },
  declineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  declineButtonText: {
    ...typography.body,
    color: colors.error,
    fontWeight: "600",
  },
  postAuthButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  postAuthButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    padding: spacing.xs,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  reviewButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  reviewButtonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  configSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  configTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  configDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  thresholdVisual: {
    marginBottom: spacing.md,
  },
  thresholdBar: {
    flexDirection: "row",
    height: 40,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  thresholdZone: {
    flex: 1,
  },
  declineZone: {
    backgroundColor: colors.errorLight,
  },
  reviewZone: {
    backgroundColor: colors.warningLight,
  },
  approveZone: {
    backgroundColor: colors.successLight,
  },
  thresholdLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  thresholdLabel: {
    ...typography.caption,
    fontWeight: "600",
  },
  thresholdDesc: {
    ...typography.caption,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 4,
  },
  inputHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
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
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  ruleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  ruleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  ruleLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  ruleValue: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  sectionHeaderTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  sectionHeaderSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  toggleTitle: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  toggleSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  declineButtonSolid: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  declineButtonSolidText: {
    ...typography.body,
    color: "#fff",
    fontWeight: "600",
  },
  approveButtonSolid: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  approveButtonSolidText: {
    ...typography.body,
    color: "#fff",
    fontWeight: "600",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  expandButtonText: {
    ...typography.body,
    color: colors.textOnPrimary,
    fontWeight: "600",
  },
  emptyPrimaryButton: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  emptyPrimaryButtonText: {
    ...typography.button,
    color: colors.textOnPrimary,
    fontWeight: "800",
  },
  emptyHintText: {
    marginTop: spacing.md,
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  inlineManualScanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  inlineManualScanButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "800",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  navButtonTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  navButtonSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});