import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
  StatusBar,
  Image,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useConvex, useQuery, useMutation } from "convex/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { colors, spacing, borderRadius, typography, shadows, theme } from "../lib/theme";
import { getUserModeDefinition, inferUserModeFromAccountType } from "../lib/userModes";
// import * as ImagePicker from 'expo-image-picker';
// import * as FileSystem from 'expo-file-system';

/**
 * ScamVigil - Settings Screen
 * User profile, preferences, and account management
 */

interface SettingsScreenProps {
  viewer: any;
  sessionToken: string;
  onSignOut: () => void;
  onSwitchApp?: () => Promise<void>;
  onNavigateExtension: () => void;
  onNavigateHelp: () => void;
  onNavigatePrivacy: () => void;
  onNavigateTerms: () => void;
  onNavigateAdmin: () => void;
  onNavigateSubscription: () => void;
  onNavigateBulkComparison: () => void;
  onNavigateMonitoring: () => void;
  onNavigateMessageScan: () => void;
  onNavigateContactsScan: () => void;
  onNavigateAccountType: () => void;
  onNavigateModeSelection?: () => void;
  onNavigateCallScreening: () => void;
  onNavigateCallProtection: () => void;
  onNavigateDeveloperAPI?: () => void;
  onNavigateDarkWeb?: () => void;
  onNavigateBranding?: () => void;
  onNavigateTutorial?: () => void;
}

export default function SettingsScreen({ 
  viewer,
  sessionToken,
  onSignOut,
  onSwitchApp,
  onNavigateExtension,
  onNavigateHelp,
  onNavigatePrivacy,
  onNavigateTerms,
  onNavigateAdmin,
  onNavigateSubscription,
  onNavigateBulkComparison,
  onNavigateMonitoring,
  onNavigateMessageScan,
  onNavigateContactsScan,
  onNavigateAccountType,
  onNavigateModeSelection,
  onNavigateCallScreening,
  onNavigateCallProtection,
  onNavigateDeveloperAPI,
  onNavigateDarkWeb,
  onNavigateBranding,
  onNavigateTutorial,
}: SettingsScreenProps) {
  const convex = useConvex();
  const effectiveUser = viewer;
  const profileImageUrl = useQuery(api.users.getProfileImageUrl);
  const isAdmin = effectiveUser?.role === "admin" || effectiveUser?.role === "superadmin";
  const updateProfileForSession = useMutation(api.users.updateProfileForSession);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const updateProfileImage = useMutation(api.users.updateProfileImage);
  const bootstrapAdminIfNeeded = useMutation(api.users.bootstrapAdminIfNeeded);
  const deleteAccountMutation = useMutation(api.users.deleteAccount);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailReports, setEmailReports] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isBootstrappingAdmin, setIsBootstrappingAdmin] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Profile Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const safeSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    try {
      setIsSigningOut(true);
      // Delegate to App.tsx, which clears AsyncStorage and invalidates the session server-side.
      onSignOut();
    } catch (error: any) {
      console.error("Sign out failed:", error);

      const message =
        typeof error?.message === "string"
          ? error.message
          : "We couldn't sign you out. Please try again.";

      // On web, Alert buttons are limited; fall back to a simple browser alert.
      if (Platform.OS === "web") {
        const globalAny = globalThis as any;
        if (typeof globalAny?.alert === "function") {
          globalAny.alert(message);
        }
      } else {
        Alert.alert("Sign out failed", message);
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignOut = () => {
    // React Native Web doesn't reliably support Alert button callbacks.
    if (Platform.OS === "web") {
      const globalAny = globalThis as any;
      const shouldSignOut =
        typeof globalAny?.confirm === "function"
          ? globalAny.confirm("Are you sure you want to sign out?")
          : true;

      if (shouldSignOut) {
        void safeSignOut();
      }
      return;
    }

    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => void safeSignOut() },
    ]);
  };

  const handleCharityToggle = async (value: boolean) => {
    try {
      await updateProfileForSession({ sessionToken, isCharity: value });
    } catch (error) {
      console.error("Failed to update charity status:", error);
    }
  };

  const getPurposeLabel = (purpose?: string) => {
    switch (purpose) {
      case "immigration_consultant": return "🧳 Immigration Consultant";
      case "real_estate_agent": return "🏡 Real Estate Agent";
      case "education_provider": return "📚 Education Provider";
      case "community_admin": return "👥 Community Admin";
      case "small_business": return "🛒 Small Business";
      case "charity_npo": return "❤️ Charity / NPO";
      case "personal_use": return "👤 Personal Use";
      case "ads_waste": return "I run ads and waste budget on fakes";
      case "scammed": return "I've been scammed online";
      case "community_manager": return "I manage a community page";
      default: return "Not specified";
    }
  };

  const SettingItem = ({
    icon,
    label,
    value,
    onPress,
    showChevron = true,
    danger = false,
  }: {
    icon: any;
    label: string;
    value?: string;
    onPress: () => void;
    showChevron?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={danger ? colors.error : colors.primary} />
        <Text style={[styles.settingLabel, danger && { color: colors.error }]}>{label}</Text>
      </View>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {showChevron && (
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        )}
      </View>
    </TouchableOpacity>
  );

  const handlePickImage = async () => {
    // Profile picture upload temporarily disabled (expo-image-picker not installed)
    Alert.alert('Coming Soon', 'Profile picture upload will be available in the next update!');
  };

  const handleEditProfile = () => {
    setEditName(effectiveUser?.name || "");
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateProfileForSession({ sessionToken, name: editName.trim() });
      setShowEditModal(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      const exportUserData = await convex.query(api.users.exportUserDataForSession, {
        sessionToken,
      });
      
      // Convert data to JSON
      const jsonData = JSON.stringify(exportUserData, null, 2);
      const fileName = `scamvigil-data-${Date.now()}.json`;

      if (Platform.OS === 'web') {
        // Web: Download as file (temporarily disabled - expo-file-system not installed)
        Alert.alert("Coming Soon", "Data export will be available in the next update!");
      } else {
        // Mobile: temporarily disabled - expo-file-system not installed
        Alert.alert("Coming Soon", "Data export will be available in the next update!");
      }
    } catch (error) {
      console.error("Failed to export data:", error);
      Alert.alert("Error", "Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmation("");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmation !== "DELETE") {
      Alert.alert("Error", 'Please type "DELETE" to confirm');
      return;
    }

    try {
      setIsDeleting(true);
      const result = await deleteAccountMutation({ confirmationText: deleteConfirmation });
      
      if (result.success) {
        setShowDeleteModal(false);
        Alert.alert("Account Deleted", result.message, [
          { text: "OK", onPress: () => void safeSignOut() }
        ]);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      Alert.alert("Error", "Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBrowserExtension = () => {
    const extensionUrl = "https://chromewebstore.google.com/detail/scamvigil";
    Linking.openURL(extensionUrl).catch((err) => {
      console.error("Failed to open extension URL:", err);
      Alert.alert("Coming Soon", "ScamVigil browser extension will be available soon!");
    });
  };

  const getModeLabel = () => {
    // Scam Vigil supports consumer modes only.
    const inferred = inferUserModeFromAccountType(effectiveUser?.accountType);
    const raw = effectiveUser?.userMode;

    const effectiveMode =
      raw === "personal" || raw === "charity" || raw === "community" ? raw : inferred;

    const definition = getUserModeDefinition(effectiveMode);
    switch (definition.key) {
      case "charity":
        return "❤️ Charity";
      case "community":
        return "👥 Community";
      case "personal":
      default:
        return "👤 Personal";
    }
  };

  const handleSwitchApp = () => {
    if (Platform.OS === "web") {
      const globalAny = globalThis as any;
      const shouldSwitch =
        typeof globalAny?.confirm === "function"
          ? globalAny.confirm("Switch to a different app? You'll be returned to the app selector.")
          : true;

      if (shouldSwitch) {
        void performSwitchApp();
      }
      return;
    }

    Alert.alert(
      "Switch App",
      "Switch to a different app? You'll be returned to the app selector.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Switch", style: "default", onPress: () => void performSwitchApp() },
      ]
    );
  };

  const performSwitchApp = async () => {
    try {
      if (onSwitchApp) {
        await onSwitchApp();
        return;
      }

      // Fallback: clear the selectedApp from AsyncStorage and sign out.
      await AsyncStorage.removeItem("selectedApp");
      await safeSignOut();
    } catch (error: any) {
      console.error("Failed to switch app:", error);
      Alert.alert("Error", "Failed to switch app. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.profilePictureContainer}
            onPress={handlePickImage}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <View style={styles.profilePicturePlaceholder}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            ) : profileImageUrl ? (
              <Image 
                source={{ uri: profileImageUrl }} 
                style={styles.profilePicture}
              />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Ionicons name="person" size={48} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={16} color={colors.textOnPrimary} />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{effectiveUser?.name || "Unknown User"}</Text>
          <Text style={styles.profileEmail}>{effectiveUser?.email || ""}</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          
          <SettingItem
            icon="person-outline"
            label="Profile"
            value={effectiveUser?.name || "Unknown"}
            onPress={handleEditProfile}
          />

          <SettingItem
            icon="sparkles-outline"
            label="Dashboard setup"
            value={getModeLabel()}
            onPress={() => {
              if (onNavigateModeSelection) {
                onNavigateModeSelection();
                return;
              }

              Alert.alert(
                "Dashboard setup",
                "Setup switching is not available right now."
              );
            }}
          />

          <SettingItem
            icon="call-outline"
            label="Call Protection"
            value={Platform.OS === "ios" ? "iOS setup" : "Android setup"}
            onPress={() => {
              if (onNavigateCallProtection) {
                onNavigateCallProtection();
                return;
              }
              Alert.alert("Call Protection", "Call Protection setup is not available right now.");
            }}
          />

          <SettingItem
            icon="color-palette-outline"
            label="Branding"
            value="Customize your app"
            onPress={() => {
              if (onNavigateBranding) {
                onNavigateBranding();
                return;
              }
              Alert.alert("Branding", "Branding customization is not available right now.");
            }}
          />

          <SettingItem
            icon="card-outline"
            label="Pricing & Plans"
            onPress={() => {
              if (onNavigateSubscription) {
                onNavigateSubscription();
                return;
              }
              Alert.alert("Pricing & Plans", "Pricing details are coming soon.");
            }}
          />

          <SettingItem
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => onNavigatePrivacy?.()}
          />

          <SettingItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => onNavigateTerms?.()}
          />

          <SettingItem
            icon="download-outline"
            label="Export My Data"
            onPress={handleExportData}
            showChevron={!isExporting}
          />

          <SettingItem
            icon="trash-outline"
            label="Delete Account"
            onPress={handleDeleteAccount}
            danger
          />
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>

          <SettingItem
            icon="play-circle-outline"
            label="View Tutorial"
            value="Walkthrough"
            onPress={() => {
              if (onNavigateTutorial) {
                onNavigateTutorial();
                return;
              }
              Alert.alert("Tutorial", "Tutorial is not available right now.");
            }}
          />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => onNavigateHelp?.()}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name="help-circle-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.settingLabel}>Help Center</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() =>
              Linking.openURL("mailto:support@scamvigil.com.au")
            }
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name="mail-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.settingLabel}>Email Support</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => onNavigateDeveloperAPI?.()}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name="code-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.settingLabel}>Developer API</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => onNavigateDarkWeb?.()}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name="shield-half-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.settingLabel}>Dark Web Monitor</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Admin Panel Section (Only visible to admins) */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ADMIN</Text>
            
            <TouchableOpacity
              style={styles.adminPanelCard}
              onPress={() => onNavigateAdmin?.()}
              activeOpacity={0.7}
            >
              <View style={styles.adminPanelIcon}>
                <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
              </View>
              <View style={styles.adminPanelContent}>
                <Text style={styles.adminPanelTitle}>Admin Panel</Text>
                <Text style={styles.adminPanelSubtitle}>
                  Manage platform, API keys, analytics & branding
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Browser Extension Card */}
        <View style={styles.extensionCard}>
          <View style={styles.extensionIcon}>
            <Ionicons name="extension-puzzle" size={32} color={colors.primary} />
          </View>
          <View style={styles.extensionContent}>
            <Text style={styles.extensionTitle}>Browser Extension</Text>
            <Text style={styles.extensionSubtitle}>
              Scan profiles while browsing Facebook & Instagram
            </Text>
          </View>
          <TouchableOpacity style={styles.extensionButton} onPress={handleBrowserExtension}>
            <Text style={styles.extensionButtonText}>Get</Text>
          </TouchableOpacity>
        </View>

        {/* Switch App Button */}
        <TouchableOpacity
          style={styles.switchAppButton}
          onPress={handleSwitchApp}
        >
          <Ionicons name="swap-horizontal" size={22} color={colors.primary} />
          <Text style={styles.switchAppText}>Switch App</Text>
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.signOutButton, isSigningOut && { opacity: 0.7 }]}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
          )}
          <Text style={styles.signOutText}>{isSigningOut ? "Signing out…" : "Sign Out"}</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>ScamVigil v2.0.0</Text>
          <Text style={styles.versionSubtext}>Made with 💚 in Australia</Text>
        </View>

        {/* Australian Compliance Footer */}
        <View style={styles.complianceFooter}>
          <View style={styles.complianceBadges}>
            <View style={styles.complianceBadge}>
              <Text style={styles.flagEmoji}>🇦🇺</Text>
              <Text style={styles.complianceBadgeText}>APP Compliant</Text>
            </View>
            <View style={styles.complianceBadge}>
              <Ionicons name="server" size={14} color={colors.primary} />
              <Text style={styles.complianceBadgeText}>AU Data Storage</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <ActivityIndicator color={colors.textOnPrimary} size="small" />
                ) : (
                  <Text style={styles.modalButtonTextSave}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={48} color={colors.error} style={{ alignSelf: 'center', marginBottom: spacing.md }} />
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalDescription}>
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
            <Text style={styles.modalDescription}>
              Type <Text style={{ fontWeight: 'bold' }}>DELETE</Text> to confirm:
            </Text>
            <TextInput
              style={styles.modalInput}
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              placeholder="Type DELETE"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleConfirmDelete}
                disabled={isDeleting || deleteConfirmation !== "DELETE"}
              >
                {isDeleting ? (
                  <ActivityIndicator color={colors.textOnPrimary} size="small" />
                ) : (
                  <Text style={styles.modalButtonTextDelete}>Delete</Text>
                )}
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
  header: {
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  profilePictureContainer: {
    position: "relative",
    marginBottom: spacing.md,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  profileName: {
    ...typography.h4,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  profileEmail: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  settingValue: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  adminPanelCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  adminPanelIcon: {
    marginRight: spacing.lg,
  },
  adminPanelContent: {
    flex: 1,
  },
  adminPanelTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  adminPanelSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  extensionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  extensionIcon: {
    marginRight: spacing.lg,
  },
  extensionContent: {
    flex: 1,
  },
  extensionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  extensionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  extensionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  extensionButtonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  switchAppButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    height: 52,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  switchAppText: {
    ...typography.button,
    color: colors.textPrimary,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    height: 52,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.error + "30",
    gap: spacing.sm,
  },
  signOutText: {
    ...typography.button,
    color: colors.error,
  },
  versionContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  versionText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  versionSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  complianceFooter: {
    alignItems: "center",
  },
  complianceBadges: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  complianceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    ...shadows.sm,
  },
  flagEmoji: {
    fontSize: 14,
  },
  complianceBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  recoveryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.warning + "30",
  },
  recoveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  recoveryTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  recoveryBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  recoveryButton: {
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  recoveryButtonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
    ...shadows.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalInput: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalButtonSave: {
    backgroundColor: colors.primary,
  },
  modalButtonDelete: {
    backgroundColor: colors.error,
  },
  modalButtonTextCancel: {
    ...typography.button,
    color: colors.textPrimary,
  },
  modalButtonTextSave: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  modalButtonTextDelete: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
});