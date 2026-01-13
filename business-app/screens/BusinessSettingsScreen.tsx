import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing } from "../../lib/theme";
import type { BusinessUser } from "../types";
import { isAdminUser } from "../../lib/adminConfig";
import BusinessAdminScreen from "./BusinessAdminScreen";
import ChargebackShieldTutorialScreen from "./ChargebackShieldTutorialScreen";
import { HelpCenterScreen } from "../../screens/HelpCenterScreen";
import CreateTicketScreen from "../../screens/CreateTicketScreen";
import TicketListScreen from "../../screens/TicketListScreen";
import TicketDetailScreen from "../../screens/TicketDetailScreen";
import ChangePasswordScreen from "./ChangePasswordScreen";
import type { Id } from "../../convex/_generated/dataModel";

export default function BusinessSettingsScreen({
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [autoBlockEnabled, setAutoBlockEnabled] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [supportRoute, setSupportRoute] = useState<
    | null
    | { name: "help" }
    | { name: "create" }
    | { name: "list" }
    | { name: "detail"; ticketId: Id<"supportTickets"> }
  >(null);

  // Some older/partial user records may not have tier populated yet.
  // Default to "free" so Settings never crashes.
  const effectiveTier = viewer.tier ?? "free";

  // Check if user is admin
  const isAdmin = isAdminUser(viewer);

  // If admin panel is open, show it
  if (showAdminPanel) {
    return <BusinessAdminScreen sessionToken={sessionToken} onBack={() => setShowAdminPanel(false)} />;
  }

  if (showTutorial) {
    return (
      <ChargebackShieldTutorialScreen
        sessionToken={sessionToken}
        onClose={() => setShowTutorial(false)}
        onNavigateToTab={(tabKey) => onNavigateToTab?.(tabKey)}
      />
    );
  }

  if (showChangePassword) {
    return (
      <ChangePasswordScreen
        sessionToken={sessionToken}
        onBack={() => setShowChangePassword(false)}
      />
    );
  }

  if (supportRoute) {
    const navigation = {
      navigate: (screen: string, params?: any) => {
        if (screen === "CreateTicket") {
          setSupportRoute({ name: "create" });
          return;
        }

        if (screen === "TicketList") {
          setSupportRoute({ name: "list" });
          return;
        }

        if (screen === "TicketDetail") {
          const ticketId = params?.ticketId as Id<"supportTickets"> | undefined;
          if (ticketId) {
            setSupportRoute({ name: "detail", ticketId });
          }
          return;
        }

        if (screen === "HelpCenter") {
          setSupportRoute({ name: "help" });
        }
      },
      replace: (screen: string, params?: any) => {
        navigation.navigate(screen, params);
      },
      goBack: () => {
        if (supportRoute.name === "detail") {
          setSupportRoute({ name: "list" });
          return;
        }

        if (supportRoute.name === "create" || supportRoute.name === "list") {
          setSupportRoute({ name: "help" });
          return;
        }

        setSupportRoute(null);
      },
    };

    if (supportRoute.name === "help") {
      return (
        <HelpCenterScreen
          onBack={() => setSupportRoute(null)}
          onOpenCreateTicket={() => setSupportRoute({ name: "create" })}
          onOpenTicketList={() => setSupportRoute({ name: "list" })}
          supportEmail="support@chargebackshield.com"
        />
      );
    }

    if (supportRoute.name === "create") {
      return (
        <CreateTicketScreen
          navigation={navigation}
          sessionToken={sessionToken}
          route={{ params: { app: "chargeback" } }}
        />
      );
    }

    if (supportRoute.name === "list") {
      return (
        <TicketListScreen
          navigation={navigation}
          sessionToken={sessionToken}
          route={{ params: { app: "chargeback" } }}
        />
      );
    }

    if (supportRoute.name === "detail") {
      return (
        <TicketDetailScreen
          navigation={navigation}
          sessionToken={sessionToken}
          route={{ params: { app: "chargeback", ticketId: supportRoute.ticketId } }}
        />
      );
    }
  }

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        onPress: onSignOut,
        style: "destructive",
      },
    ]);
  };

  const handleSwitchApp = () => {
    if (Platform.OS === 'web') {
      const globalAny = globalThis as any;
      const shouldSwitch =
        typeof globalAny?.confirm === 'function'
          ? globalAny.confirm('Go back to app selection screen?')
          : true;

      if (!shouldSwitch) {
        return;
      }

      void (async () => {
        try {
          if (onSwitchApp) {
            await onSwitchApp();
            return;
          }

          await AsyncStorage.removeItem('selectedApp');
          onSignOut();
        } catch (error) {
          console.error('Failed to switch app:', error);
          const globalAlert = (globalThis as any)?.alert;
          if (typeof globalAlert === 'function') {
            globalAlert('Failed to switch app. Please try again.');
          }
        }
      })();

      return;
    }

    Alert.alert(
      "Switch App",
      "Go back to app selection screen?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch",
          onPress: async () => {
            try {
              if (onSwitchApp) {
                await onSwitchApp();
                return;
              }

              // Fallback: clear selection + sign out.
              await AsyncStorage.removeItem("selectedApp");
              onSignOut();
            } catch (error) {
              console.error("Failed to switch app:", error);
              Alert.alert("Error", "Failed to switch app. Please try again.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const openUrlSafely = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Unavailable", "This link can't be opened on your device.");
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unavailable", "This link can't be opened right now.");
    }
  };

  const openEmailSafely = async (email: string, subject?: string) => {
    const url = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
    await openUrlSafely(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="settings" size={32} color={colors.primary} />
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account & preferences</Text>
        </View>

        {/* Business Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileInitial}>
                <Text style={styles.profileInitialText}>
                  {viewer.businessName?.[0]?.toUpperCase() || "B"}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{viewer.businessName}</Text>
                <Text style={styles.profileEmail}>{viewer.email}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil" size={18} color={colors.primary} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications" size={28} color={colors.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingValue}>Instant alerts for high-risk orders</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.outline, true: colors.primary + "40" }}
              thumbColor={notificationsEnabled ? colors.primary : colors.textSecondary}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingIcon}>
              <Ionicons name="mail" size={28} color={colors.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Alerts</Text>
              <Text style={styles.settingValue}>Daily summary & important updates</Text>
            </View>
            <Switch
              value={emailAlertsEnabled}
              onValueChange={setEmailAlertsEnabled}
              trackColor={{ false: colors.outline, true: colors.primary + "40" }}
              thumbColor={emailAlertsEnabled ? colors.primary : colors.textSecondary}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingIcon}>
              <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-Block High Risk</Text>
              <Text style={styles.settingValue}>Automatically block flagged orders</Text>
            </View>
            <Switch
              value={autoBlockEnabled}
              onValueChange={setAutoBlockEnabled}
              trackColor={{ false: colors.outline, true: colors.primary + "40" }}
              thumbColor={autoBlockEnabled ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <TouchableOpacity style={styles.linkCard} onPress={() => setShowChangePassword(true)}>
            <View style={styles.linkContent}>
              <Ionicons name="lock-closed" size={24} color={colors.primary} />
              <View style={{ gap: 2 }}>
                <Text style={styles.linkText}>Change Password</Text>
                <Text style={styles.settingValue}>Update your sign-in password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Billing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing & Plan</Text>

          <View style={styles.planCard}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{effectiveTier.toUpperCase()}</Text>
            </View>
            <Text style={styles.planName}>
              {effectiveTier === "free"
                ? "Free Plan"
                : effectiveTier === "pro"
                ? "Pro Plan - $99/month"
                : "Enterprise Plan - Custom"}
            </Text>
            <Text style={styles.planFeatures}>
              {effectiveTier === "free"
                ? "Up to 500 orders/month"
                : effectiveTier === "pro"
                ? "Up to 2,000 orders/month + API"
                : "Unlimited orders + Dedicated support"}
            </Text>
            {effectiveTier === "free" && (
              <TouchableOpacity style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin</Text>

            <TouchableOpacity 
              style={styles.adminCard}
              onPress={() => setShowAdminPanel(true)}
            >
              <View style={styles.adminIcon}>
                <Ionicons name="shield-checkmark" size={28} color="#10B981" />
              </View>
              <View style={styles.adminInfo}>
                <Text style={styles.adminLabel}>Admin Panel</Text>
                <Text style={styles.adminValue}>Security, API Keys & Analytics</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>

          {/* This is the primary entry to the ticket system */}
          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => setSupportRoute({ name: "help" })}
          >
            <View style={styles.linkContent}>
              <Ionicons name="help-circle" size={24} color={colors.primary} />
              <Text style={styles.linkText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkCard} onPress={() => setShowTutorial(true)}>
            <View style={styles.linkContent}>
              <Ionicons name="play-circle" size={24} color={colors.primary} />
              <Text style={styles.linkText}>View Tutorial</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => openUrlSafely("https://chargebackshield.com/help")}
          >
            <View style={styles.linkContent}>
              <Ionicons name="help-circle" size={24} color={colors.primary} />
              <Text style={styles.linkText}>Help & Documentation</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => openEmailSafely("support@chargebackshield.com", "ChargebackShield Support Request")}
          >
            <View style={styles.linkContent}>
              <Ionicons name="mail" size={24} color={colors.primary} />
              <Text style={styles.linkText}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => openEmailSafely("support@chargebackshield.com", "ChargebackShield Bug Report")}
          >
            <View style={styles.linkContent}>
              <Ionicons name="bug" size={24} color={colors.primary} />
              <Text style={styles.linkText}>Report a Bug</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => openUrlSafely("https://chargebackshield.com/privacy")}
          >
            <View style={styles.linkContent}>
              <Ionicons name="document-text" size={24} color={colors.primary} />
              <Text style={styles.linkText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => openUrlSafely("https://chargebackshield.com/terms")}
          >
            <View style={styles.linkContent}>
              <Ionicons name="shield" size={24} color={colors.primary} />
              <Text style={styles.linkText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Switch App Button */}
        <TouchableOpacity style={styles.switchAppButton} onPress={handleSwitchApp}>
          <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
          <Text style={styles.switchAppText}>Switch App</Text>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out" size={20} color={colors.error} />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>ChargebackShield v1.0.0</Text>
        </View>
      </ScrollView>
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
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  profileInitial: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  profileInitialText: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  editButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  settingValue: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  planBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  planBadgeText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  planName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  planFeatures: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  upgradeButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  linkContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  linkText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  switchAppButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary + "15",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  switchAppText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.error + "15",
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  signOutButtonText: {
    color: colors.error,
    fontWeight: "700",
    fontSize: 14,
  },
  footerContainer: {
    alignItems: "center",
    paddingBottom: spacing.xl,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  adminCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  adminIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10B98115",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  adminInfo: {
    flex: 1,
  },
  adminLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  adminValue: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  optionIcon: {
    fontSize: 20,
    color: colors.primary,
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  optionArrow: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});