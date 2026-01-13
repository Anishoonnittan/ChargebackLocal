import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView, Animated } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, typography, spacing } from "../lib/theme";
import { isAdminUser } from "../lib/adminConfig";
import FeatureTooltip from "../components/FeatureTooltip";

// Business app screens
import BusinessAuthScreen from "./screens/BusinessAuthScreen";
import BusinessDashboard from "./screens/BusinessDashboard";
import AnalyticsScreen from "./screens/AnalyticsScreen";
import DisputeManagementScreen from "./screens/DisputeManagementScreen";
import BusinessSettingsScreen from "./screens/BusinessSettingsScreen";
import DarkWebMonitoringScreen from "./screens/DarkWebMonitoringScreen";
import FraudIntelligenceScreen from "./screens/FraudIntelligenceScreen";
import CustomerIntelligenceScreen from "./screens/CustomerIntelligenceScreen";
import IntegrationHubScreen from "./screens/IntegrationHubScreen";
import DisputeEvidenceScreen from "./screens/DisputeEvidenceScreen";
import ChargebackAnalyticsScreen from "./screens/ChargebackAnalyticsScreen";
// Phase 4 screens - Team, Onboarding, Billing
import TeamManagementScreen from "./screens/TeamManagementScreen";
import OnboardingWizardScreen from "./screens/OnboardingWizardScreen";
import BillingScreen from "./screens/BillingScreen";
import CustomerCommunicationScreen from "./screens/CustomerCommunicationScreen";
import type { BusinessUser } from "./types";
import { ChargebackShieldApp } from "../screens/ChargebackShieldApp";
import PostAuthDashboardScreen from "../screens/PostAuthDashboardScreen";
import ComplianceGuardrailsScreen from "./screens/ComplianceGuardrailsScreen";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Business app color theme - Professional blue
const BUSINESS_COLORS = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#3B82F6",
  accent: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  surface: "#FFFFFF",
  background: "#F8FAFC",
  cardBg: "#FFFFFF",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
};

// Tab navigation component with expanded tabs
function TabNavigation({
  activeTab,
  onTabChange,
  viewer,
  sessionToken,
  onSignOut,
  onSwitchApp,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  viewer: BusinessUser;
  sessionToken: string;
  onSignOut: () => void;
  onSwitchApp?: () => Promise<void>;
}) {
  const tabs = [
    { id: "dashboard", label: "Home", icon: "home" },
    { id: "scan", label: "Scan", icon: "scan-circle" },
    { id: "protect", label: "Protect", icon: "shield-checkmark" },
    { id: "disputes", label: "Disputes", icon: "document-text" },
    { id: "more", label: "More", icon: "ellipsis-horizontal" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <BusinessDashboard
            viewer={viewer}
            sessionToken={sessionToken}
            onSignOut={onSignOut}
            onNavigate={onTabChange}
          />
        );
      case "scan":
        return <ChargebackShieldApp sessionToken={sessionToken} />;
      case "protect":
        return <PostAuthDashboardScreen sessionToken={sessionToken} />;
      case "disputes":
        return <DisputeManagementScreen viewer={viewer} sessionToken={sessionToken} />;
      case "more":
        return (
          <MoreScreen
            viewer={viewer}
            sessionToken={sessionToken}
            onSignOut={onSignOut}
            onSwitchApp={onSwitchApp}
            onNavigateToTab={onTabChange}
          />
        );
      default:
        return (
          <BusinessDashboard
            viewer={viewer}
            sessionToken={sessionToken}
            onSignOut={onSignOut}
            onNavigate={onTabChange}
          />
        );
    }
  };

  return (
    <View style={styles.tabContainer}>
      <View style={styles.contentArea}>{renderContent()}</View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconContainer, isActive && styles.tabIconContainerActive]}>
                <Ionicons
                  name={tab.icon as any}
                  size={22}
                  color={isActive ? BUSINESS_COLORS.primary : BUSINESS_COLORS.textSecondary}
                />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Protect screen - combines dark web monitoring and fraud intelligence
function ProtectScreen({ viewer, sessionToken }: { viewer: BusinessUser; sessionToken: string }) {
  const [selectedTool, setSelectedTool] = useState<"darkweb" | "fraud" | "customers" | null>(null);

  // If a tool is selected, show that screen
  if (selectedTool === "darkweb") {
    return (
      <View style={styles.flex1}>
        <TouchableOpacity style={styles.toolBackButton} onPress={() => setSelectedTool(null)}>
          <Ionicons name="arrow-back" size={24} color={BUSINESS_COLORS.textPrimary} />
          <Text style={styles.toolBackButtonText}>Protection Center</Text>
        </TouchableOpacity>
        <DarkWebMonitoringScreen viewer={viewer} sessionToken={sessionToken} />
      </View>
    );
  }

  if (selectedTool === "fraud") {
    return (
      <View style={styles.flex1}>
        <TouchableOpacity style={styles.toolBackButton} onPress={() => setSelectedTool(null)}>
          <Ionicons name="arrow-back" size={24} color={BUSINESS_COLORS.textPrimary} />
          <Text style={styles.toolBackButtonText}>Protection Center</Text>
        </TouchableOpacity>
        <FraudIntelligenceScreen viewer={viewer} sessionToken={sessionToken} />
      </View>
    );
  }

  if (selectedTool === "customers") {
    return (
      <View style={styles.flex1}>
        <TouchableOpacity style={styles.toolBackButton} onPress={() => setSelectedTool(null)}>
          <Ionicons name="arrow-back" size={24} color={BUSINESS_COLORS.textPrimary} />
          <Text style={styles.toolBackButtonText}>Protection Center</Text>
        </TouchableOpacity>
        <CustomerIntelligenceScreen viewer={viewer} sessionToken={sessionToken} />
      </View>
    );
  }

  // Quick action cards at the top
  const quickActions = [
    {
      id: "darkweb",
      title: "Dark Web",
      subtitle: "Monitor breaches",
      icon: "globe",
      iconColor: "#EF4444",
      bgColor: "#FEE2E2",
    },
    {
      id: "fraud",
      title: "Fraud Intel",
      subtitle: "Pattern analysis",
      icon: "analytics",
      iconColor: "#F59E0B",
      bgColor: "#FEF3C7",
    },
    {
      id: "customers",
      title: "Customers",
      subtitle: "Risk profiles",
      icon: "people",
      iconColor: "#8B5CF6",
      bgColor: "#EDE9FE",
    },
  ];

  // Protection tools organized by workflow
  const protectionWorkflows = [
    {
      title: "⚡️ Real-Time Monitoring",
      subtitle: "Active threat detection",
      tools: [
        {
          id: "darkweb",
          icon: "globe",
          iconColor: "#EF4444",
          title: "Dark Web Monitor",
          description: "Track data breaches and credential leaks",
        },
        {
          id: "fraud",
          icon: "analytics",
          iconColor: "#F59E0B",
          title: "Fraud Pattern Detection",
          description: "AI-powered fraud pattern analysis",
        },
      ],
    },
    {
      title: "🛡️ Customer Protection",
      subtitle: "Verify and monitor customers",
      tools: [
        {
          id: "customers",
          icon: "people",
          iconColor: "#8B5CF6",
          title: "Customer Intelligence",
          description: "Risk scoring and behavioral insights",
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.protectMainContainer} edges={["top"]}>
      <ScrollView style={styles.protectScrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.protectHeader}>
          <Text style={styles.protectTitle}>Protection Center</Text>
          <Text style={styles.protectSubtitle}>Monitor threats and protect your business</Text>
        </View>

        {/* Quick Actions - Horizontal Scroll */}
        <View style={styles.quickActionsSection}>
          <FeatureTooltip
            featureId="cb_quick_actions"
            title="Fastest entry"
            message="Use these Quick Actions to jump into Dark Web, Fraud Intel, or Customers in 1 tap."
          >
            <Text style={styles.sectionLabel}>⚡️ Quick Actions</Text>
          </FeatureTooltip>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionCard, { backgroundColor: action.bgColor }]}
                onPress={() => setSelectedTool(action.id as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: BUSINESS_COLORS.surface }]}>
                  <Ionicons name={action.icon as any} size={28} color={action.iconColor} />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Protection Workflows */}
        {protectionWorkflows.map((workflow, index) => (
          <View key={index} style={styles.workflowSection}>
            <View style={styles.workflowHeader}>
              <Text style={styles.workflowTitle}>{workflow.title}</Text>
              <Text style={styles.workflowSubtitle}>{workflow.subtitle}</Text>
            </View>

            <View style={styles.toolsList}>
              {workflow.tools.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={styles.toolRow}
                  onPress={() => setSelectedTool(tool.id as any)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.toolIcon,
                      { backgroundColor: `${tool.iconColor}15` },
                    ]}
                  >
                    <Ionicons name={tool.icon as any} size={24} color={tool.iconColor} />
                  </View>
                  <View style={styles.toolContent}>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                    <Text style={styles.toolDescription}>{tool.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={BUSINESS_COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Help Tip */}
        <View style={styles.helpTip}>
          <Ionicons name="information-circle" size={18} color={BUSINESS_COLORS.primary} />
          <Text style={styles.helpTipText}>
            Tap any tool to start monitoring and protecting your business
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// More screen - analytics, integrations, settings
function MoreScreen({
  viewer,
  sessionToken,
  onSignOut,
  onSwitchApp,
  onNavigateToTab,
}: {
  viewer: BusinessUser;
  sessionToken: string;
  onSignOut: () => void;
  onSwitchApp?: () => Promise<void>;
  onNavigateToTab?: (tab: string) => void;
}) {
  const [activeSubScreen, setActiveSubScreen] = useState<"menu" | "analytics" | "integrations" | "settings" | "team" | "onboarding" | "billing" | "compliance" | "customer-communication">("menu");

  if (activeSubScreen === "analytics") {
    return (
      <View style={styles.flex1}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveSubScreen("menu")}>
          <Ionicons name="arrow-back" size={24} color={BUSINESS_COLORS.textPrimary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <AnalyticsScreen viewer={viewer} sessionToken={sessionToken} />
      </View>
    );
  }

  if (activeSubScreen === "integrations") {
    return (
      <View style={styles.flex1}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveSubScreen("menu")}>
          <Ionicons name="arrow-back" size={24} color={BUSINESS_COLORS.textPrimary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <IntegrationHubScreen viewer={viewer} sessionToken={sessionToken} onNavigate={(screen) => {
          if (screen === 'webhook-dashboard') console.log('Navigate to webhook dashboard');
        }} />
      </View>
    );
  }

  if (activeSubScreen === "settings") {
    return (
      <View style={styles.flex1}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveSubScreen("menu")}>
          <Ionicons name="arrow-back" size={24} color={BUSINESS_COLORS.textPrimary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <BusinessSettingsScreen
          viewer={viewer}
          sessionToken={sessionToken}
          onSignOut={onSignOut}
          onSwitchApp={onSwitchApp}
          onNavigateToTab={onNavigateToTab}
        />
      </View>
    );
  }

  if (activeSubScreen === "team") {
    return (
      <View style={styles.flex1}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveSubScreen("menu")}>
          <Ionicons name="arrow-back" size={24} color={BUSINESS_COLORS.textPrimary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TeamManagementScreen viewer={viewer} sessionToken={sessionToken} />
      </View>
    );
  }

  if (activeSubScreen === "onboarding") {
    return (
      <View style={styles.flex1}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveSubScreen("menu")}>
          <Ionicons name="arrow-back" size={24} color={BUSINESS_COLORS.textPrimary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <OnboardingWizardScreen viewer={viewer} sessionToken={sessionToken} />
      </View>
    );
  }

  if (activeSubScreen === "billing") {
    return (
      <View style={styles.flex1}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveSubScreen("menu")}>
          <Ionicons name="arrow-back" size={24} color={BUSINESS_COLORS.textPrimary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <BillingScreen viewer={viewer} sessionToken={sessionToken} />
      </View>
    );
  }

  if (activeSubScreen === "compliance") {
    return (
      <View style={styles.flex1}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveSubScreen("menu")}>
          <Ionicons name="arrow-back" size={24} color={BUSINESS_COLORS.textPrimary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <ComplianceGuardrailsScreen sessionToken={sessionToken} />
      </View>
    );
  }

  if (activeSubScreen === "customer-communication") {
    return <CustomerCommunicationScreen onBack={() => setActiveSubScreen("menu")} />;
  }

  // Menu screen
  const menuItems = [
    { 
      id: "analytics", 
      title: "Analytics & Reports", 
      subtitle: "ROI tracking, charts, and insights",
      icon: "bar-chart",
      color: BUSINESS_COLORS.primary,
    },
    { 
      id: "integrations", 
      title: "Integration Hub", 
      subtitle: "Connect Shopify, Stripe, PayPal",
      icon: "git-network",
      color: BUSINESS_COLORS.accent,
    },
    { 
      id: "team", 
      title: "Team Management", 
      subtitle: "Invite members, manage roles",
      icon: "people",
      color: "#8B5CF6",
    },
    { 
      id: "onboarding", 
      title: "Onboarding Wizard", 
      subtitle: "5-step guided setup",
      icon: "school",
      color: BUSINESS_COLORS.accent,
    },
    { 
      id: "billing", 
      title: "Billing & Subscription", 
      subtitle: "Plans, payment methods, invoices",
      icon: "card",
      color: BUSINESS_COLORS.warning,
    },
    { 
      id: "settings", 
      title: "Settings", 
      subtitle: "Account, notifications, billing",
      icon: "settings",
      color: BUSINESS_COLORS.textSecondary,
    },
    { 
      id: "compliance", 
      title: "Compliance Guardrails", 
      subtitle: "ACL & regulatory compliance check",
      icon: "shield-checkmark",
      color: "#8B5CF6",
    },
    {
      id: "customer-communication",
      title: "Customer Communication",
      subtitle: "Auto de-escalation messaging",
      icon: "chatbubbles-outline",
      color: "#06B6D4",
    },
  ];

  return (
    <SafeAreaView style={styles.moreContainer} edges={["top"]}>
      <View style={styles.moreHeader}>
        <Text style={styles.moreTitle}>More</Text>
        <Text style={styles.moreSubtitle}>Analytics, integrations & settings</Text>
      </View>

      <View style={styles.menuList}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => setActiveSubScreen(item.id as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={BUSINESS_COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Stats Card */}
      <View style={styles.quickStatsCard}>
        <Text style={styles.quickStatsTitle}>This Month</Text>
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>$45,230</Text>
            <Text style={styles.quickStatLabel}>Saved</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>73%</Text>
            <Text style={styles.quickStatLabel}>Win Rate</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>0.81%</Text>
            <Text style={styles.quickStatLabel}>CB Rate</Text>
          </View>
        </View>
      </View>

      {/* Tier Badge */}
      <View style={styles.tierBadge}>
        <View style={styles.tierBadgeContent}>
          <Ionicons 
            name={viewer.tier === "enterprise" ? "diamond" : viewer.tier === "pro" ? "star" : "flash"} 
            size={20} 
            color={viewer.tier === "enterprise" ? "#8B5CF6" : viewer.tier === "pro" ? "#F59E0B" : BUSINESS_COLORS.primary} 
          />
          <Text style={styles.tierBadgeText}>
            {viewer.tier === "enterprise" ? "Enterprise Plan" : viewer.tier === "pro" ? "Pro Plan" : "Free Plan"}
          </Text>
        </View>
        {viewer.tier === "free" && (
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Admin Badge - Show if user is an admin */}
      {isAdminUser(viewer) && (
        <View style={styles.adminBadge}>
          <View style={styles.adminBadgeContent}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <View style={styles.adminBadgeTextContainer}>
              <Text style={styles.adminBadgeTitle}>Admin Access</Text>
              <Text style={styles.adminBadgeSubtitle}>
                You have full access to both Scam Vigil and ChargebackShield
              </Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Loading screen with ChargebackShield branding
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.logoContainer}>
        <Ionicons name="shield-checkmark" size={60} color="#FFFFFF" />
      </View>
      <Text style={styles.loadingTitle}>ChargebackShield</Text>
      <Text style={styles.loadingSubtitle}>Stop Chargebacks. Save Revenue.</Text>
      <ActivityIndicator size="large" color={BUSINESS_COLORS.primary} style={styles.loader} />
    </View>
  );
}

// Authenticated content wrapper
function AuthenticatedContent({
  sessionToken,
  onSignOut,
  onSwitchApp,
}: {
  sessionToken: string;
  onSignOut: () => void;
  onSwitchApp?: () => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [hasTriggeredSignOutForExpiredSession, setHasTriggeredSignOutForExpiredSession] =
    useState(false);
  const user = useQuery(api.auth.getCurrentUser, { sessionToken });

  useEffect(() => {
    // Avoid state updates during render (can cause React internal errors/freezes).
    if (user === null && !hasTriggeredSignOutForExpiredSession) {
      setHasTriggeredSignOutForExpiredSession(true);
      onSignOut();
    }
  }, [user, hasTriggeredSignOutForExpiredSession, onSignOut]);

  // Still loading user data
  if (user === undefined) {
    return <LoadingScreen />;
  }

  // Session expired or invalid
  if (user === null) {
    return <LoadingScreen />;
  }

  // Ensure user is a business user (or admin)
  const isAdmin = isAdminUser(user);
  if (user.accountType !== "business" && !isAdmin) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle" size={48} color={BUSINESS_COLORS.danger} />
        </View>
        <Text style={styles.errorTitle}>Account Type Mismatch</Text>
        <Text style={styles.errorMessage}>
          This app is for business users only. Please sign in with a business account or download Scam Vigil for personal use.
        </Text>
        <TouchableOpacity style={styles.errorButton} onPress={onSignOut}>
          <Text style={styles.errorButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show business app with tab navigation
  return (
    <TabNavigation
      activeTab={activeTab}
      onTabChange={setActiveTab}
      viewer={user}
      sessionToken={sessionToken}
      onSignOut={onSignOut}
      onSwitchApp={onSwitchApp}
    />
  );
}

export default function App({ onSwitchApp }: { onSwitchApp?: () => Promise<void> }) {
  const [sessionToken, setSessionToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    // Load session token from storage
    AsyncStorage.getItem("businessSessionToken")
      .then((token: string | null) => {
        setSessionToken(token);
      })
      .catch((error: any) => {
        console.error("Failed to load business session token:", error);
        setSessionToken(null);
      });
  }, []);

  const handleSignedIn = async (token: string) => {
    setSessionToken(token);
    await AsyncStorage.setItem("businessSessionToken", token);
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem("businessSessionToken");
    setSessionToken(null);
  };

  // Loading session token
  if (sessionToken === undefined) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <LoadingScreen />
        </View>
      </SafeAreaProvider>
    );
  }

  // Not authenticated - show business auth
  if (!sessionToken) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <BusinessAuthScreen onSignedIn={handleSignedIn} onSwitchApp={onSwitchApp} />
        </View>
      </SafeAreaProvider>
    );
  }

  // Authenticated - show business app with tabs
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <AuthenticatedContent
          sessionToken={sessionToken}
          onSignOut={handleSignOut}
          onSwitchApp={onSwitchApp}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BUSINESS_COLORS.background,
  },
  flex1: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
    backgroundColor: BUSINESS_COLORS.background,
  },
  contentArea: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    height: 70,
    backgroundColor: BUSINESS_COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: BUSINESS_COLORS.border,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  tabItemActive: {},
  tabIconContainer: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  tabIconContainerActive: {
    backgroundColor: `${BUSINESS_COLORS.primary}15`,
  },
  tabLabel: {
    fontSize: 11,
    color: BUSINESS_COLORS.textSecondary,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: BUSINESS_COLORS.primary,
    fontWeight: "600",
  },
  // Protect screen styles
  protectContainer: {
    flex: 1,
    backgroundColor: BUSINESS_COLORS.background,
  },
  subTabContainer: {
    flexDirection: "row",
    backgroundColor: BUSINESS_COLORS.surface,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BUSINESS_COLORS.border,
    gap: 8,
  },
  subTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: BUSINESS_COLORS.background,
    gap: 6,
  },
  subTabActive: {
    backgroundColor: `${BUSINESS_COLORS.primary}15`,
  },
  subTabLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: BUSINESS_COLORS.textSecondary,
  },
  subTabLabelActive: {
    color: BUSINESS_COLORS.primary,
    fontWeight: "600",
  },
  // More screen styles
  moreContainer: {
    flex: 1,
    backgroundColor: BUSINESS_COLORS.background,
  },
  moreHeader: {
    padding: 20,
    paddingTop: 12,
  },
  moreTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: BUSINESS_COLORS.textPrimary,
  },
  moreSubtitle: {
    fontSize: 14,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 4,
  },
  menuList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BUSINESS_COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BUSINESS_COLORS.textPrimary,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 2,
  },
  // Quick stats card
  quickStatsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: BUSINESS_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
  },
  quickStatsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: BUSINESS_COLORS.textSecondary,
    marginBottom: 12,
  },
  quickStatsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  quickStat: {
    flex: 1,
    alignItems: "center",
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: BUSINESS_COLORS.textPrimary,
  },
  quickStatLabel: {
    fontSize: 12,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: BUSINESS_COLORS.border,
  },
  // Tier badge
  tierBadge: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: BUSINESS_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tierBadgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tierBadgeText: {
    fontSize: 15,
    fontWeight: "600",
    color: BUSINESS_COLORS.textPrimary,
  },
  upgradeButton: {
    backgroundColor: BUSINESS_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Admin badge
  adminBadge: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: BUSINESS_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adminBadgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  adminBadgeTextContainer: {
    flex: 1,
  },
  adminBadgeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: BUSINESS_COLORS.textPrimary,
  },
  adminBadgeSubtitle: {
    fontSize: 13,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 2,
  },
  // Back button
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
    backgroundColor: BUSINESS_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: BUSINESS_COLORS.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: BUSINESS_COLORS.textPrimary,
  },
  // Loading screen
  loadingContainer: {
    flex: 1,
    backgroundColor: BUSINESS_COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: BUSINESS_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: BUSINESS_COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: BUSINESS_COLORS.textPrimary,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: BUSINESS_COLORS.textSecondary,
    marginBottom: 32,
  },
  loader: {
    marginTop: 16,
  },
  // Error screen
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: BUSINESS_COLORS.background,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${BUSINESS_COLORS.danger}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: BUSINESS_COLORS.textPrimary,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 15,
    color: BUSINESS_COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: BUSINESS_COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  placeholderScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: BUSINESS_COLORS.textPrimary,
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: BUSINESS_COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  placeholderNote: {
    fontSize: 14,
    color: BUSINESS_COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  // Protect screen - Main container
  protectMainContainer: {
    flex: 1,
    backgroundColor: BUSINESS_COLORS.background,
  },
  // Protect screen - ScrollView
  protectScrollView: {
    flex: 1,
  },
  // Protect screen - Header
  protectHeader: {
    padding: 20,
    paddingTop: 12,
  },
  protectTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: BUSINESS_COLORS.textPrimary,
  },
  protectSubtitle: {
    fontSize: 14,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 4,
  },
  // Protect screen - Quick Actions
  quickActionsSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: BUSINESS_COLORS.textPrimary,
    marginBottom: 12,
  },
  quickActionsContainer: {
    position: "relative",
  },
  quickActionsScroll: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 16,
  },
  quickActionCard: {
    width: 110,
    backgroundColor: BUSINESS_COLORS.surface,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: BUSINESS_COLORS.textPrimary,
    textAlign: "center",
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  scrollArrow: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: [{ translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BUSINESS_COLORS.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
  },
  // Protect screen - Workflows
  workflowSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  workflowHeader: {
    marginBottom: 12,
  },
  workflowTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BUSINESS_COLORS.textPrimary,
  },
  workflowSubtitle: {
    fontSize: 13,
    color: BUSINESS_COLORS.textSecondary,
  },
  toolsList: {
    gap: 12,
  },
  toolRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BUSINESS_COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  toolContent: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BUSINESS_COLORS.textPrimary,
  },
  toolDescription: {
    fontSize: 13,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 2,
  },
  // Protect screen - Help Tip
  helpTip: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: BUSINESS_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
  },
  helpTipText: {
    fontSize: 14,
    color: BUSINESS_COLORS.textSecondary,
    marginLeft: 12,
  },
  // Protect screen - Tool Back Button
  toolBackButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
    backgroundColor: BUSINESS_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: BUSINESS_COLORS.border,
  },
  toolBackButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: BUSINESS_COLORS.textPrimary,
  },
});