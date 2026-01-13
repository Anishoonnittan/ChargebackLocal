import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  ScrollView,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { skip, useQuery } from "convex/react";

import { api } from "../convex/_generated/api";
import { isAdminUser } from "../lib/adminConfig";

import BusinessAuthScreen from "./screens/BusinessAuthScreen";
import BusinessDashboard from "./screens/BusinessDashboard";
import DisputeManagementScreen from "./screens/DisputeManagementScreen";
import BusinessSettingsScreen from "./screens/BusinessSettingsScreen";
import IntegrationHubScreen from "./screens/IntegrationHubScreen";
import IntegrationStatusScreen from "./screens/IntegrationStatusScreen";
import AnalyticsScreen from "./screens/AnalyticsScreen";
import TeamManagementScreen from "./screens/TeamManagementScreen";
import OnboardingWizardScreen from "./screens/OnboardingWizardScreen";
import BillingScreen from "./screens/BillingScreen";
import ComplianceGuardrailsScreen from "./screens/ComplianceGuardrailsScreen";
import CustomerCommunicationScreen from "./screens/CustomerCommunicationScreen";
import DarkWebMonitoringScreen from "./screens/DarkWebMonitoringScreen";
import type { BusinessUser } from "./types";

import { ChargebackShieldApp } from "../screens/ChargebackShieldApp";
import PostAuthDashboardScreen from "../screens/PostAuthDashboardScreen";

// NOTE:
// This is a web-first wrapper around the existing ChargebackShield mobile screens.
// It gives us a desktop-friendly shell (sidebar + top bar) without rebuilding the
// underlying business logic.

const BUSINESS_SESSION_TOKEN_KEY = "businessSessionToken";

const WEB_FONT_STACK =
  Platform.OS === "web"
    ? 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"'
    : undefined;

const WEB_MAX_CONTENT_WIDTH = 1240;

// On desktop we don't have the mobile "More" tab, so we expose key admin areas here.
// Keep this list small and high-signal.
type WebRouteKey =
  | "overview"
  | "scan"
  | "protect"
  | "darkweb"
  | "disputes"
  | "analytics"
  | "integrations"
  | "integrationStatus"
  | "team"
  | "onboarding"
  | "billing"
  | "compliance"
  | "communications"
  | "settings";

type RouteConfig = {
  key: WebRouteKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

async function getStoredToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(BUSINESS_SESSION_TOKEN_KEY);
    if (token) {
      return token;
    }
  } catch {
    // ignore
  }

  // Web fallback
  try {
    if (typeof window !== "undefined" && (window as any).localStorage) {
      return (window as any).localStorage.getItem(BUSINESS_SESSION_TOKEN_KEY);
    }
  } catch {
    // ignore
  }

  return null;
}

async function setStoredToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(BUSINESS_SESSION_TOKEN_KEY, token);
  } catch {
    // ignore
  }

  try {
    if (typeof window !== "undefined" && (window as any).localStorage) {
      (window as any).localStorage.setItem(BUSINESS_SESSION_TOKEN_KEY, token);
    }
  } catch {
    // ignore
  }
}

async function clearStoredToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BUSINESS_SESSION_TOKEN_KEY);
  } catch {
    // ignore
  }

  try {
    if (typeof window !== "undefined" && (window as any).localStorage) {
      (window as any).localStorage.removeItem(BUSINESS_SESSION_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

function ShellSidebarItem({
  item,
  isActive,
  onPress,
}: {
  item: RouteConfig;
  isActive: boolean;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      // @ts-ignore - web-only props
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={[
        styles.sidebarItem,
        isActive && styles.sidebarItemActive,
        hovered && !isActive && styles.sidebarItemHovered,
        Platform.OS === "web" && { cursor: "pointer" },
      ]}
    >
      <Ionicons
        name={item.icon}
        size={20}
        color={isActive ? WEB_COLORS.textOnPrimary : hovered ? WEB_COLORS.textPrimary : WEB_COLORS.textSecondary}
      />
      <Text
        style={[
          styles.sidebarItemLabel,
          isActive && styles.sidebarItemLabelActive,
          hovered && !isActive && styles.sidebarItemLabelHovered,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

function WebLoadingScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
      <View style={styles.loadingLogo}>
        <Ionicons name="shield-checkmark" size={32} color={WEB_COLORS.textOnPrimary} />
      </View>
      <Text style={styles.loadingTitle}>ChargebackShield</Text>
      <Text style={styles.loadingSubtitle}>Loading your dashboard…</Text>
      <View style={styles.loadingSpinner}>
        <View style={styles.spinnerDot} />
        <View style={styles.spinnerDot} />
        <View style={styles.spinnerDot} />
      </View>
    </Animated.View>
  );
}

function WebAccountTypeMismatch({ onSignOut }: { onSignOut: () => void }) {
  return (
    <View style={styles.mismatchContainer}>
      <View style={styles.mismatchIcon}>
        <Ionicons name="alert-circle" size={28} color={WEB_COLORS.danger} />
      </View>
      <Text style={styles.mismatchTitle}>Business account required</Text>
      <Text style={styles.mismatchBody}>
        This dashboard is for ChargebackShield business users only.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={onSignOut}>
        <Text style={styles.primaryButtonText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ChargebackShieldWebApp() {
  const [sessionToken, setSessionToken] = useState<string | null | undefined>(undefined);
  const [activeRoute, setActiveRoute] = useState<WebRouteKey>("overview");

  const isFullBleedRoute =
    activeRoute === "overview" || activeRoute === "scan" || activeRoute === "protect";

  const viewer = useQuery(api.auth.getCurrentUser, sessionToken ? { sessionToken } : skip);

  useEffect(() => {
    if (Platform.OS !== "web") {
      // This component is intended for web only.
      return;
    }

    void (async () => {
      const token = await getStoredToken();
      setSessionToken(token);
    })();
  }, []);

  const handleSignedIn = useCallback(async (token: string) => {
    setSessionToken(token);
    await setStoredToken(token);
  }, []);

  const handleSignOut = useCallback(async () => {
    await clearStoredToken();
    setSessionToken(null);
    setActiveRoute("overview");
  }, []);

  const routes: RouteConfig[] = useMemo(
    () => [
      { key: "overview", label: "Overview", icon: "home" },
      { key: "scan", label: "Scan", icon: "scan" },
      { key: "protect", label: "Protect", icon: "shield-checkmark" },
      { key: "darkweb", label: "Dark Web Monitoring", icon: "eye" },
      { key: "disputes", label: "Disputes", icon: "document-text" },
      { key: "analytics", label: "Analytics & Reports", icon: "bar-chart" },
      { key: "integrations", label: "Integration Hub", icon: "git-network" },
      { key: "integrationStatus", label: "Integration Status", icon: "pulse" },
      { key: "team", label: "Team Management", icon: "people" },
      { key: "onboarding", label: "Onboarding Wizard", icon: "rocket" },
      { key: "billing", label: "Billing & Subscription", icon: "pricetag" },
      { key: "compliance", label: "Compliance Guardrails", icon: "shield" },
      { key: "communications", label: "Customer Communication", icon: "chatbubbles" },
      { key: "settings", label: "Settings", icon: "settings" },
    ],
    []
  );

  const renderMain = () => {
    if (!sessionToken) {
      return (
        <BusinessAuthScreen
          onSignedIn={handleSignedIn}
          onSwitchApp={async () => {
            Alert.alert(
              "ScamVigil is the mobile app",
              "You can use ScamVigil from your phone. This is the ChargebackShield web dashboard."
            );
          }}
        />
      );
    }

    // While Convex resolves the user.
    if (viewer === undefined) {
      return <WebLoadingScreen />;
    }

    // If token is invalid / expired, Convex returns null.
    if (viewer === null) {
      // Proactively reset.
      void handleSignOut();
      return <WebLoadingScreen />;
    }

    const isAdmin = isAdminUser(viewer);
    if (viewer.accountType !== "business" && !isAdmin) {
      return <WebAccountTypeMismatch onSignOut={() => void handleSignOut()} />;
    }

    const businessViewer = viewer as BusinessUser;

    switch (activeRoute) {
      case "overview":
        return (
          <BusinessDashboard
            viewer={businessViewer}
            sessionToken={sessionToken}
            onSignOut={() => void handleSignOut()}
            onNavigate={(tab) => {
              // BusinessDashboard expects mobile tab keys. Map the important ones.
              if (tab === "scan") {
                setActiveRoute("scan");
                return;
              }
              if (tab === "protect") {
                setActiveRoute("protect");
                return;
              }
              if (tab === "disputes") {
                setActiveRoute("disputes");
                return;
              }
              setActiveRoute("overview");
            }}
          />
        );

      case "scan":
        return <ChargebackShieldApp sessionToken={sessionToken} />;

      case "protect":
        return <PostAuthDashboardScreen sessionToken={sessionToken} />;

      case "darkweb":
        return <DarkWebMonitoringScreen viewer={businessViewer} sessionToken={sessionToken} />;

      case "disputes":
        return <DisputeManagementScreen viewer={businessViewer} sessionToken={sessionToken} />;

      case "analytics":
        return <AnalyticsScreen viewer={businessViewer} sessionToken={sessionToken} />;

      case "integrations":
        return (
          <IntegrationHubScreen
            viewer={businessViewer}
            sessionToken={sessionToken}
            onNavigate={(screen) => {
              // IntegrationHubScreen currently uses string-based routes (e.g. "webhook-dashboard").
              // On web, we map those to our sidebar routes.
              if (screen === "webhook-dashboard" || screen === "status" || screen === "integration-status") {
                setActiveRoute("integrationStatus");
              }
            }}
          />
        );

      case "integrationStatus": {
        // IntegrationStatusScreen was originally built for a stack navigator.
        // On web we provide a tiny navigation shim.
        const navigation = {
          goBack: () => setActiveRoute("integrations"),
          navigate: (routeName: string) => {
            if (routeName === "IntegrationHub") {
              setActiveRoute("integrations");
              return;
            }
            setActiveRoute("integrations");
          },
        };
        return <IntegrationStatusScreen navigation={navigation} />;
      }

      case "team":
        return <TeamManagementScreen viewer={businessViewer} sessionToken={sessionToken} />;

      case "onboarding":
        return <OnboardingWizardScreen viewer={businessViewer} sessionToken={sessionToken} />;

      case "billing":
        return <BillingScreen viewer={businessViewer} sessionToken={sessionToken} />;

      case "compliance":
        return <ComplianceGuardrailsScreen sessionToken={sessionToken} />;

      case "communications":
        return <CustomerCommunicationScreen onBack={() => setActiveRoute("overview")} />;

      case "settings":
        return (
          <BusinessSettingsScreen
            viewer={businessViewer}
            sessionToken={sessionToken}
            onSignOut={() => void handleSignOut()}
            onSwitchApp={async () => {
              Alert.alert(
                "ScamVigil is mobile-only",
                "ScamVigil stays on your phone. ChargebackShield stays on web."
              );
            }}
            onNavigateToTab={(tab) => {
              if (tab === "scan") {
                setActiveRoute("scan");
                return;
              }
              if (tab === "protect") {
                setActiveRoute("protect");
                return;
              }
            }}
          />
        );

      default:
        return <WebLoadingScreen />;
    }
  };

  // Desktop-first shell.
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.shell}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <View style={styles.brandMark}>
                <Ionicons name="shield-checkmark" size={20} color={WEB_COLORS.textOnPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.brandName}>ChargebackShield</Text>
                <Text style={styles.brandSub}>Business Dashboard</Text>
              </View>
            </View>

            <ScrollView style={styles.sidebarNavScroll} showsVerticalScrollIndicator={true}>
              <View style={styles.sidebarNav}>
                {routes.map((r) => (
                  <React.Fragment key={r.key}>
                    <ShellSidebarItem
                      item={r}
                      isActive={activeRoute === r.key}
                      onPress={() => setActiveRoute(r.key)}
                    />
                  </React.Fragment>
                ))}
              </View>
            </ScrollView>

            {!!sessionToken && (
              <View style={styles.sidebarFooter}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => void handleSignOut()}
                  // @ts-ignore
                  style={[styles.sidebarSignOut, Platform.OS === "web" && { cursor: "pointer" }]}
                >
                  <Ionicons name="log-out-outline" size={18} color={WEB_COLORS.danger} />
                  <Text style={styles.sidebarSignOutText}>Sign out</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.main}>
            <View style={styles.topBar}>
              <View style={styles.topBarLeft}>
                <Text style={styles.topBarTitle}>
                  {routes.find((r) => r.key === activeRoute)?.label ?? "Dashboard"}
                </Text>
              </View>
              <View style={styles.topBarRight}>
                {!!sessionToken && viewer && (
                  <View style={styles.userChip}>
                    <View style={styles.userAvatar}>
                      <Ionicons name="person" size={14} color={WEB_COLORS.textOnPrimary} />
                    </View>
                    <Text style={styles.userChipText} numberOfLines={1}>
                      {(viewer as BusinessUser)?.email?.split("@")[0] || "User"}
                    </Text>
                  </View>
                )}
                <View style={styles.envPill}>
                  <View style={styles.envPillDot} />
                  <Text style={styles.envPillText}>LIVE</Text>
                </View>
              </View>
            </View>

            <View style={styles.content}>
              <View style={[styles.contentInner, isFullBleedRoute && styles.contentInnerFullBleed]}>
                {renderMain()}
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const WEB_COLORS = {
  background: "#0B1220",
  surface: "#0F172A",
  surface2: "#1A2332",
  surface3: "#1F2A44",
  border: "#1E293B",
  borderLight: "#2A3B57",
  primary: "#3B82F6",
  primaryHover: "#2563EB",
  primaryLight: "rgba(59, 130, 246, 0.12)",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textTertiary: "#64748B",
  textOnPrimary: "#FFFFFF",
  danger: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WEB_COLORS.background,
    // @ts-ignore - web-only CSS properties
    ...Platform.select({
      web: {
        fontFamily: WEB_FONT_STACK,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "optimizeLegibility",
      },
    }),
  },
  shell: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: WEB_COLORS.background,
    // @ts-ignore - web-only
    ...Platform.select({
      web: {
        height: "100vh",
      },
    }),
  },
  sidebar: {
    width: 272,
    borderRightWidth: 1,
    borderRightColor: WEB_COLORS.border,
    backgroundColor: WEB_COLORS.surface,
    // @ts-ignore - web shadow
    ...Platform.select({
      web: {
        boxShadow: "4px 0 24px rgba(0, 0, 0, 0.4)",
      },
    }),
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: WEB_COLORS.border,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WEB_COLORS.primary,
    // @ts-ignore
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
      },
    }),
  },
  brandName: {
    fontSize: 15,
    fontWeight: "800",
    color: WEB_COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 12,
    color: WEB_COLORS.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  sidebarNavScroll: {
    flex: 1,
  },
  sidebarNav: {
    padding: 14,
    gap: 6,
    paddingTop: 20,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    // @ts-ignore
    ...Platform.select({
      web: {
        transition: "all 0.2s ease",
      },
    }),
  },
  sidebarItemHovered: {
    backgroundColor: WEB_COLORS.surface2,
    borderColor: WEB_COLORS.borderLight,
  },
  sidebarItemActive: {
    backgroundColor: WEB_COLORS.primary,
    borderColor: WEB_COLORS.primaryHover,
    // @ts-ignore
    ...Platform.select({
      web: {
        boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
      },
    }),
  },
  sidebarItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: WEB_COLORS.textSecondary,
    // @ts-ignore
    ...Platform.select({
      web: {
        transition: "color 0.2s ease",
      },
    }),
  },
  sidebarItemLabelHovered: {
    color: WEB_COLORS.textPrimary,
  },
  sidebarItemLabelActive: {
    color: WEB_COLORS.textOnPrimary,
    fontWeight: "700",
  },
  sidebarFooter: {
    marginTop: "auto",
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: WEB_COLORS.border,
  },
  sidebarSignOut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: WEB_COLORS.surface2,
    borderWidth: 1,
    borderColor: WEB_COLORS.border,
    // @ts-ignore
    ...Platform.select({
      web: {
        transition: "all 0.2s ease",
      },
    }),
  },
  sidebarSignOutText: {
    fontSize: 14,
    fontWeight: "700",
    color: WEB_COLORS.danger,
  },
  main: {
    flex: 1,
    backgroundColor: WEB_COLORS.background,
  },
  topBar: {
    height: 68,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: WEB_COLORS.border,
    backgroundColor: WEB_COLORS.surface,
    // @ts-ignore
    ...Platform.select({
      web: {
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
      },
    }),
  },
  topBarLeft: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: WEB_COLORS.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: WEB_COLORS.surface2,
    borderWidth: 1,
    borderColor: WEB_COLORS.border,
    maxWidth: 160,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WEB_COLORS.primary,
  },
  userChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: WEB_COLORS.textPrimary,
  },
  envPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: WEB_COLORS.surface2,
    borderWidth: 1,
    borderColor: WEB_COLORS.success,
  },
  envPillDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: WEB_COLORS.success,
    // @ts-ignore
    ...Platform.select({
      web: {
        animation: "pulse 2s ease-in-out infinite",
      },
    }),
  },
  envPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: WEB_COLORS.success,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    // @ts-ignore
    ...Platform.select({
      web: {
        overflowY: "auto",
      },
    }),
  },
  contentInner: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: WEB_MAX_CONTENT_WIDTH,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  contentInnerFullBleed: {
    maxWidth: undefined,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WEB_COLORS.background,
    padding: 32,
  },
  loadingLogo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WEB_COLORS.primary,
    marginBottom: 20,
    // @ts-ignore
    ...Platform.select({
      web: {
        boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)",
      },
    }),
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: WEB_COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: WEB_COLORS.textSecondary,
    marginTop: 8,
    fontWeight: "500",
  },
  loadingSpinner: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
  },
  spinnerDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: WEB_COLORS.primary,
    // @ts-ignore
    ...Platform.select({
      web: {
        animation: "pulse 1.5s ease-in-out infinite",
      },
    }),
  },
  mismatchContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  mismatchIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 2,
    borderColor: "rgba(239, 68, 68, 0.2)",
    marginBottom: 20,
  },
  mismatchTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: WEB_COLORS.textPrimary,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  mismatchBody: {
    fontSize: 14,
    color: WEB_COLORS.textSecondary,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 24,
    maxWidth: 480,
    lineHeight: 22,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: WEB_COLORS.primary,
    borderWidth: 1,
    borderColor: WEB_COLORS.primaryHover,
    // @ts-ignore
    ...Platform.select({
      web: {
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
        transition: "all 0.2s ease",
      },
    }),
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: WEB_COLORS.textOnPrimary,
  },
});