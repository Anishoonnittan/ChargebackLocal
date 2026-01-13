import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { colors, typography, spacing, borderRadius, shadows } from "../../lib/theme";

interface BusinessDashboardProps {
  viewer: any;
  sessionToken: string;
  onSignOut: () => void;
  onNavigate?: (tab: string) => void;
}

// Memoized Alert Card Component
const AlertCard = memo(({ alert, onPress }: { alert: any; onPress: () => void }) => (
  <TouchableOpacity
    style={styles.alertCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.alertIcon, { backgroundColor: alert.iconBg }]}>
      <Ionicons name={alert.icon as any} size={20} color={alert.iconColor} />
    </View>
    <View style={styles.alertContentArea}>
      <Text style={styles.alertTitleText}>{alert.title}</Text>
      <Text style={styles.alertDescription}>{alert.description}</Text>
      <Text style={styles.alertTime}>{alert.time}</Text>
    </View>
    <View style={styles.alertAction}>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </View>
  </TouchableOpacity>
));

// Memoized Integration Card Component
const IntegrationCard = memo(({ integration, onPress }: { integration: any; onPress: () => void }) => (
  <TouchableOpacity
    style={styles.integrationCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.integrationInfo}>
      <View style={styles.integrationLogo}>
        <Text style={styles.integrationLogoText}>{integration.logo}</Text>
      </View>
      <View>
        <Text style={styles.integrationName}>{integration.name}</Text>
        <Text style={styles.integrationStatus}>{integration.status}</Text>
      </View>
    </View>
    <View style={[styles.statusBadgeCircle, { backgroundColor: integration.statusColor }]} />
  </TouchableOpacity>
));

export default function BusinessDashboard({
  viewer,
  sessionToken,
  onSignOut,
  onNavigate,
}: BusinessDashboardProps) {
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Business Metrics (cached with useMemo)
  const stats = useMemo(() => ({
    totalScans: 342,
    blockedOrders: 28,
    estimatedSavings: 14250,
    chargebackRate: 0.8,
    revenueProtected: 24350,
    trendPercentage: 18,
    highRiskOrders: 5,
    safeOrders: 309,
  }), []);

  // Mock alerts (memoized to prevent recreating on every render)
  const mockAlerts = useMemo(() => [
    {
      id: "1",
      type: "high_risk",
      title: "High Risk Order Detected",
      description: "Order #12345 • Risk Score: 89/100",
      time: "2 minutes ago",
      icon: "alert-circle",
      iconBg: "#FEF2F2",
      iconColor: "#EF4444",
      orderId: "#12345",
      riskScore: 89,
      amount: "$450.00",
      customer: "john.doe@example.com",
      reasons: [
        "High-risk geographic location",
        "VPN/Proxy detected",
        "First-time customer with large order",
        "Billing and shipping address mismatch"
      ]
    },
    {
      id: "2",
      type: "warning",
      title: "Unusual Activity",
      description: "Multiple orders from same IP",
      time: "1 hour ago",
      icon: "warning",
      iconBg: "#FFF7ED",
      iconColor: "#F59E0B",
      orderId: "#12346-12348",
      riskScore: 72,
      amount: "$1,230.00",
      customer: "Multiple accounts",
      reasons: [
        "3 orders from same IP address",
        "Different email addresses used",
        "Orders placed within 5 minutes",
        "Similar order amounts"
      ]
    },
    {
      id: "3",
      type: "success",
      title: "Dispute Won",
      description: "Order #12300 • $450 recovered",
      time: "3 hours ago",
      icon: "checkmark-circle",
      iconBg: "#F0FDF4",
      iconColor: "#10B981",
      orderId: "#12300",
      amount: "$450.00",
      customer: "recovered@example.com",
      reasons: [
        "Provided tracking information",
        "Customer signature confirmed",
        "Evidence accepted by card issuer",
        "Funds returned to merchant"
      ]
    },
  ], []);

  // Memoized integrations list
  const integrations = useMemo(() => [
    { logo: "S", name: "Shopify", status: "Connected", statusColor: "#10B981" },
    { logo: "$", name: "Stripe", status: "Not connected", statusColor: colors.textMuted },
  ], []);

  // Initialize animations
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => pulse.stop();
  }, [pulseAnim, fadeAnim]);

  // Memoized navigation callbacks
  const handleNavigate = useCallback((screen: string) => {
    onNavigate?.(screen);
  }, [onNavigate]);

  const handleSelectAlert = useCallback((alert: any) => {
    setSelectedAlert(alert);
  }, []);

  const handleCloseAlert = useCallback(() => {
    setSelectedAlert(null);
  }, []);

  const handleToggleProfileMenu = useCallback(() => {
    setShowProfileMenu(!showProfileMenu);
  }, [showProfileMenu]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Compact Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.businessName}>{viewer.businessName || viewer.name}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleToggleProfileMenu}>
            <Ionicons name="person-circle" size={40} color="#2563EB" />
          </TouchableOpacity>
        </Animated.View>

        {/* Live Protection Status Banner */}
        <Animated.View style={[styles.statusBanner, { opacity: fadeAnim }]}>
          <View style={styles.statusLeft}>
            <Animated.View style={[styles.statusPulse, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>Protection Active</Text>
              <Text style={styles.statusSubtitle}>Monitoring {stats.totalScans} orders</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.statusBadgeText}>Live</Text>
          </View>
        </Animated.View>

        {/* Hero Stats Card - Revenue Protected */}
        <Animated.View style={[styles.heroCard, { opacity: fadeAnim }]}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLabel}>Revenue Protected (30 Days)</Text>
              <View style={styles.heroValueRow}>
                <Text style={styles.heroValue}>${(stats.revenueProtected / 1000).toFixed(1)}K</Text>
                <View style={styles.trendBadge}>
                  <Ionicons name="trending-up" size={12} color="#10B981" />
                  <Text style={styles.trendText}>+{stats.trendPercentage}%</Text>
                </View>
              </View>
            </View>
            <View style={styles.heroIconContainer}>
              <Ionicons name="shield-checkmark" size={32} color="#10B981" />
            </View>
          </View>
          
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{stats.safeOrders}</Text>
              <Text style={styles.heroStatLabel}>Safe Orders</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{stats.blockedOrders}</Text>
              <Text style={styles.heroStatLabel}>Blocked</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{stats.chargebackRate}%</Text>
              <Text style={styles.heroStatLabel}>CB Rate</Text>
            </View>
          </View>
        </Animated.View>

        {/* Primary Action - Scan New Order */}
        <TouchableOpacity 
          style={styles.primaryAction}
          onPress={() => handleNavigate("scan")}
          activeOpacity={0.85}
        >
          <View style={styles.primaryActionIcon}>
            <Ionicons name="scan" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.primaryActionContent}>
            <Text style={styles.primaryActionTitle}>Scan New Order</Text>
            <Text style={styles.primaryActionSubtitle}>Check for fraud before shipping</Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Alert Banner (Conditional) */}
        {stats.highRiskOrders > 0 && (
          <TouchableOpacity 
            style={styles.alertBanner}
            onPress={() => handleNavigate("protect")}
          >
            <View style={styles.alertIconContainer}>
              <Ionicons name="warning" size={20} color="#EF4444" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{stats.highRiskOrders} High-Risk Orders</Text>
              <Text style={styles.alertSubtitle}>Review before fulfillment</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleNavigate("protect")}
            >
              <View style={styles.quickActionHeader}>
                <View style={[styles.quickActionIcon, { backgroundColor: "#3B82F615" }]}>
                  <Ionicons name="eye" size={24} color="#3B82F6" />
                </View>
              </View>
              <Text style={styles.quickActionValue}>{stats.totalScans}</Text>
              <Text style={styles.quickActionLabel}>Monitor Orders</Text>
              <View style={styles.quickActionFooter}>
                <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleNavigate("disputes")}
            >
              <View style={styles.quickActionHeader}>
                <View style={[styles.quickActionIcon, { backgroundColor: "#8B5CF615" }]}>
                  <Ionicons name="document-text" size={24} color="#8B5CF6" />
                </View>
              </View>
              <Text style={styles.quickActionValue}>12</Text>
              <Text style={styles.quickActionLabel}>Disputes</Text>
              <View style={styles.quickActionFooter}>
                <Ionicons name="arrow-forward" size={16} color="#8B5CF6" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            <TouchableOpacity onPress={() => handleNavigate("protect")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.alertsList}>
            {mockAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onPress={() => handleSelectAlert(alert)}
              />
            ))}
          </View>
        </View>

        {/* Integrations Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Integrations</Text>
          <View style={styles.integrationsContainer}>
            {integrations.map((integration, idx) => (
              <IntegrationCard
                key={idx}
                integration={integration}
                onPress={() => handleNavigate("more")}
              />
            ))}
          </View>
        </View>

        {/* Info Footer */}
        <View style={styles.infoFooter}>
          <Ionicons name="information-circle" size={16} color={colors.textMuted} />
          <Text style={styles.infoFooterText}>
            87% chargeback rate reduction on average
          </Text>
        </View>

      </ScrollView>

      {/* Alert Detail Modal */}
      <Modal
        visible={selectedAlert !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseAlert}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alert Details</Text>
              <TouchableOpacity onPress={handleCloseAlert}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedAlert && (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={[styles.modalAlertIcon, { backgroundColor: selectedAlert.iconBg }]}>
                  <Ionicons name={selectedAlert.icon} size={32} color={selectedAlert.iconColor} />
                </View>

                <Text style={styles.modalAlertTitle}>{selectedAlert.title}</Text>
                <Text style={styles.modalAlertTime}>{selectedAlert.time}</Text>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>Order ID</Text>
                  <Text style={styles.modalSectionValue}>{selectedAlert.orderId}</Text>
                </View>

                {selectedAlert.riskScore && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionLabel}>Risk Score</Text>
                    <View style={styles.riskScoreContainer}>
                      <Text style={[
                        styles.riskScoreValue,
                        { color: selectedAlert.riskScore >= 80 ? "#EF4444" : 
                                 selectedAlert.riskScore >= 60 ? "#F59E0B" : "#10B981" }
                      ]}>
                        {selectedAlert.riskScore}/100
                      </Text>
                      <View style={styles.riskScoreBar}>
                        <View 
                          style={[
                            styles.riskScoreFill,
                            { 
                              width: `${selectedAlert.riskScore}%`,
                              backgroundColor: selectedAlert.riskScore >= 80 ? "#EF4444" : 
                                             selectedAlert.riskScore >= 60 ? "#F59E0B" : "#10B981"
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>Amount</Text>
                  <Text style={styles.modalSectionValue}>{selectedAlert.amount}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>Customer</Text>
                  <Text style={styles.modalSectionValue}>{selectedAlert.customer}</Text>
                </View>

                {selectedAlert.reasons && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionLabel}>
                      {selectedAlert.type === "success" ? "Details" : "Risk Factors"}
                    </Text>
                    <View style={styles.reasonsList}>
                      {selectedAlert.reasons.map((reason: string, index: number) => (
                        <View key={index} style={styles.reasonItem}>
                          <View style={[
                            styles.reasonBullet,
                            { backgroundColor: selectedAlert.iconColor }
                          ]} />
                          <Text style={styles.reasonText}>{reason}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.modalActions}>
                  {selectedAlert.type === "high_risk" && (
                    <>
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.modalButtonDanger]}
                        onPress={() => {
                          handleCloseAlert();
                          handleNavigate("protect");
                        }}
                      >
                        <Text style={styles.modalButtonTextWhite}>Block Order</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.modalButtonOutline]}
                        onPress={() => {
                          handleCloseAlert();
                          handleNavigate("scan");
                        }}
                      >
                        <Text style={styles.modalButtonTextPrimary}>Review Details</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {selectedAlert.type === "warning" && (
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalButtonPrimary]}
                      onPress={() => {
                        handleCloseAlert();
                        handleNavigate("protect");
                      }}
                    >
                      <Text style={styles.modalButtonTextWhite}>Investigate</Text>
                    </TouchableOpacity>
                  )}
                  {selectedAlert.type === "success" && (
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalButtonPrimary]}
                      onPress={() => {
                        handleCloseAlert();
                        handleNavigate("disputes");
                      }}
                    >
                      <Text style={styles.modalButtonTextWhite}>View Dispute</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Profile Menu Modal */}
      <Modal
        visible={showProfileMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowProfileMenu(false)}
          />
          <View style={styles.profileMenuContent}>
            <View style={styles.profileMenuHeader}>
              <View style={styles.profileMenuAvatar}>
                <Text style={styles.profileMenuAvatarText}>
                  {(viewer.businessName?.[0] || viewer.name?.[0] || "B").toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileMenuInfo}>
                <Text style={styles.profileMenuName}>{viewer.businessName || viewer.name}</Text>
                <Text style={styles.profileMenuEmail}>{viewer.email}</Text>
              </View>
              <TouchableOpacity 
                style={styles.profileMenuClose}
                onPress={() => setShowProfileMenu(false)}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileMenuDivider} />

            <View style={styles.profileMenuOptions}>
              <TouchableOpacity 
                style={styles.profileMenuOption}
                onPress={() => {
                  setShowProfileMenu(false);
                  handleNavigate("more");
                }}
              >
                <Ionicons name="person" size={22} color="#3B82F6" />
                <Text style={styles.profileMenuOptionText}>View Profile</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.profileMenuOption}
                onPress={() => {
                  setShowProfileMenu(false);
                  handleNavigate("more");
                }}
              >
                <Ionicons name="settings" size={22} color="#3B82F6" />
                <Text style={styles.profileMenuOptionText}>Settings</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={styles.profileMenuDivider} />

              <TouchableOpacity 
                style={[styles.profileMenuOption, styles.profileMenuOptionDanger]}
                onPress={() => {
                  setShowProfileMenu(false);
                  onSignOut();
                }}
              >
                <Ionicons name="log-out" size={22} color="#EF4444" />
                <Text style={[styles.profileMenuOptionText, styles.profileMenuOptionTextDanger]}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxxl + spacing.xl,
  },

  // Compact Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
  businessName: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "700",
    marginTop: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  // Live Protection Status Banner
  statusBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: "#10B98110",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#10B98120",
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    marginRight: spacing.md,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    ...typography.body,
    color: "#10B981",
    fontWeight: "700",
  },
  statusSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98115",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  statusBadgeText: {
    ...typography.caption,
    color: "#10B981",
    fontWeight: "700",
    fontSize: 11,
  },

  // Hero Stats Card
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: "#10B98120",
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  heroLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  heroValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroValue: {
    ...typography.h1,
    color: "#10B981",
    fontWeight: "800",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98115",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#10B98115",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatsRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
  },
  heroStatValue: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  heroStatLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  // Primary Action
  primaryAction: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: "#2563EB",
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.md,
  },
  primaryActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  primaryActionContent: {
    flex: 1,
  },
  primaryActionTitle: {
    ...typography.h4,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  primaryActionSubtitle: {
    ...typography.caption,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },

  // Alert Banner
  alertBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: "#EF444410",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF444430",
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EF444420",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...typography.body,
    color: "#EF4444",
    fontWeight: "700",
  },
  alertSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  viewAllText: {
    ...typography.caption,
    color: "#3B82F6",
    fontWeight: "600",
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickActionHeader: {
    marginBottom: spacing.md,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionValue: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  quickActionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  quickActionFooter: {
    marginTop: spacing.sm,
  },

  // Recent Alerts
  alertsList: {
    gap: spacing.md,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  alertContentArea: {
    flex: 1,
  },
  alertTitleText: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: 4,
  },
  alertDescription: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  alertTime: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  alertAction: {
    padding: spacing.xs,
  },

  // Integrations
  integrationsContainer: {
    gap: spacing.md,
  },
  integrationCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  integrationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  integrationLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#95BF47",
    alignItems: "center",
    justifyContent: "center",
  },
  integrationLogoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  integrationName: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  integrationStatus: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statusBadgeCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // Info Footer
  infoFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  infoFooterText: {
    ...typography.caption,
    color: colors.textMuted,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    fontSize: 20,
  },
  modalScroll: {
    padding: spacing.lg,
  },
  modalAlertIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  modalAlertTitle: {
    ...typography.h3,
    fontSize: 22,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  modalAlertTime: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalSectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalSectionValue: {
    ...typography.body,
    fontSize: 16,
    fontWeight: "500",
  },
  riskScoreContainer: {
    marginTop: spacing.xs,
  },
  riskScoreValue: {
    ...typography.h2,
    fontSize: 32,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  riskScoreBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  riskScoreFill: {
    height: "100%",
    borderRadius: 4,
  },
  reasonsList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  reasonBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  reasonText: {
    ...typography.body,
    flex: 1,
    lineHeight: 20,
  },
  modalActions: {
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  modalButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: "#3B82F6",
  },
  modalButtonDanger: {
    backgroundColor: "#EF4444",
  },
  modalButtonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  modalButtonTextWhite: {
    ...typography.body,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalButtonTextPrimary: {
    ...typography.body,
    color: "#3B82F6",
    fontWeight: "600",
  },

  // Profile Menu Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  profileMenuContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
  },
  profileMenuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  profileMenuAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#10B98115",
    alignItems: "center",
    justifyContent: "center",
  },
  profileMenuAvatarText: {
    ...typography.h3,
    color: "#10B981",
    fontWeight: "700",
  },
  profileMenuInfo: {
    flex: 1,
  },
  profileMenuName: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: 2,
  },
  profileMenuEmail: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "500",
  },
  profileMenuClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileMenuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  profileMenuOptions: {
    gap: spacing.md,
  },
  profileMenuOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  profileMenuOptionText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  profileMenuOptionDanger: {
    backgroundColor: "#EF444415",
    borderColor: "#EF444420",
  },
  profileMenuOptionTextDanger: {
    color: "#EF4444",
  },
});