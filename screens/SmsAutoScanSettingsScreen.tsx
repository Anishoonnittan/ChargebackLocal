import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  SafeAreaView,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { theme } from "../lib/theme";
import {
  requestSmsPermissions,
  checkSmsPermissions,
  requestNotificationPermissions,
  startSmsMonitoring,
  stopSmsMonitoring,
} from "../lib/smsMonitor";

/**
 * SMS Auto-Scan Settings Screen
 * Manage automatic SMS scanning permissions and privacy controls
 * Features: Permission requests, whitelist, time windows, alert settings
 */

export default function SmsAutoScanSettingsScreen({ onBack }: { onBack: () => void }) {
  const [smsPermissionGranted, setSmsPermissionGranted] = useState(false);
  const [notifPermissionGranted, setNotifPermissionGranted] = useState(false);
  const [addContactInput, setAddContactInput] = useState("");

  // Convex hooks
  const settings = useQuery(api.smsAutoScan.getSmsAutoScanSettings);
  const stats = useQuery(api.smsAutoScan.getSmsAutoScanStats);
  const requestPermission = useMutation(api.smsAutoScan.requestSmsPermission);
  const grantPermission = useMutation(api.smsAutoScan.grantSmsPermission);
  const revokePermission = useMutation(api.smsAutoScan.revokeSmsPermission);
  const toggleAutoScan = useMutation(api.smsAutoScan.toggleSmsAutoScan);
  const updateSettings = useMutation(api.smsAutoScan.updateSmsAutoScanSettings);
  const addWhitelist = useMutation(api.smsAutoScan.addWhitelistContact);
  const removeWhitelist = useMutation(api.smsAutoScan.removeWhitelistContact);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const smsGranted = await checkSmsPermissions();
    setSmsPermissionGranted(smsGranted);

    // Check notification permissions
    try {
      const Notifications = await import("expo-notifications");
      const { status } = await Notifications.getPermissionsAsync();
      setNotifPermissionGranted(status === "granted");
    } catch (error) {
      console.error("Failed to check notification permissions:", error);
    }
  };

  const handleRequestPermission = async () => {
    if (Platform.OS !== "android") {
      Alert.alert(
        "iOS Not Supported",
        "Automatic SMS scanning is only available on Android devices due to iOS privacy restrictions.\n\nYou can still use manual message scanning!",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Enable Auto-Scan?",
      "TrueProfile Pro will automatically scan incoming SMS messages for scams.\n\n✅ Protects you in real-time\n✅ Alerts you instantly\n✅ Your data stays private\n\nYou can disable this anytime.",
      [
        { text: "Not Now", style: "cancel" },
        {
          text: "Enable",
          onPress: async () => {
            try {
              // Request SMS permissions
              const smsGranted = await requestSmsPermissions();
              if (!smsGranted) {
                Alert.alert(
                  "Permission Denied",
                  "SMS permissions are required for auto-scanning. You can enable them later in Settings."
                );
                return;
              }

              // Request notification permissions
              const notifGranted = await requestNotificationPermissions();
              if (!notifGranted) {
                Alert.alert(
                  "Notification Permission",
                  "Notifications are recommended so we can alert you about scams."
                );
              }

              // Update Convex
              await requestPermission();
              await grantPermission();

              // Start monitoring
              startSmsMonitoring();

              setSmsPermissionGranted(true);
              setNotifPermissionGranted(notifGranted);

              Alert.alert(
                "✅ Auto-Scan Enabled!",
                "TrueProfile Pro is now protecting you from SMS scams in real-time."
              );
            } catch (error) {
              Alert.alert("Error", "Failed to enable auto-scan. Please try again.");
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const handleToggle = async (enabled: boolean) => {
    try {
      if (enabled && !smsPermissionGranted) {
        // Need to request permission first
        handleRequestPermission();
        return;
      }

      await toggleAutoScan({ isEnabled: enabled });

      if (enabled) {
        startSmsMonitoring();
      } else {
        stopSmsMonitoring();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to toggle auto-scan");
      console.error(error);
    }
  };

  const handleRevoke = async () => {
    Alert.alert(
      "Disable Auto-Scan?",
      "This will stop automatic SMS scanning. You can re-enable it anytime.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            try {
              await revokePermission();
              stopSmsMonitoring();
              Alert.alert("Disabled", "Auto-scan has been turned off");
            } catch (error) {
              Alert.alert("Error", "Failed to disable auto-scan");
            }
          },
        },
      ]
    );
  };

  const handleAddWhitelist = async () => {
    if (!addContactInput.trim()) {
      Alert.alert("Empty Input", "Please enter a phone number");
      return;
    }

    try {
      await addWhitelist({ phoneNumber: addContactInput.trim() });
      setAddContactInput("");
      Alert.alert("Added", "Contact added to whitelist");
    } catch (error) {
      Alert.alert("Error", "Failed to add contact");
    }
  };

  const handleRemoveWhitelist = async (phoneNumber: string) => {
    Alert.alert(
      "Remove Contact?",
      `Remove ${phoneNumber} from whitelist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeWhitelist({ phoneNumber });
            } catch (error) {
              Alert.alert("Error", "Failed to remove contact");
            }
          },
        },
      ]
    );
  };

  const handleUpdateAlertThreshold = async (threshold: string) => {
    try {
      await updateSettings({ alertThreshold: threshold });
    } catch (error) {
      Alert.alert("Error", "Failed to update alert threshold");
    }
  };

  const handleUpdateStoreMessages = async (store: boolean) => {
    try {
      await updateSettings({ storeScannedMessages: store });
    } catch (error) {
      Alert.alert("Error", "Failed to update storage setting");
    }
  };

  const isEnabled = settings?.isEnabled ?? false;
  const permissionGranted = settings?.permissionGranted ?? false;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Auto-Scan Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={isEnabled ? "shield-checkmark" : "shield-outline"}
              size={48}
              color={isEnabled ? theme.colors.success : theme.colors.textSecondary}
            />
          </View>
          <Text style={styles.heroTitle}>
            {isEnabled ? "Auto-Scan Active" : "Auto-Scan Inactive"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isEnabled
              ? "Protecting you from SMS scams in real-time"
              : "Enable automatic scanning to stay protected"}
          </Text>
        </View>

        {/* Stats Card */}
        {stats && isEnabled && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Protection Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalMessagesScanned}</Text>
                <Text style={styles.statLabel}>Messages Scanned</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.error }]}>
                  {stats.totalScamsDetected}
                </Text>
                <Text style={styles.statLabel}>Scams Blocked</Text>
              </View>
            </View>
          </View>
        )}

        {/* Main Toggle */}
        {permissionGranted ? (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardLeft}>
                <Ionicons name="scan" size={24} color={theme.colors.primary} />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>Auto-Scan Enabled</Text>
                  <Text style={styles.cardSubtitle}>Scan incoming SMS automatically</Text>
                </View>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={handleToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.enableButton} onPress={handleRequestPermission}>
            <Ionicons name="shield-checkmark" size={24} color="#FFF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.enableButtonTitle}>Enable Auto-Scan</Text>
              <Text style={styles.enableButtonSubtitle}>
                {Platform.OS === "android"
                  ? "Get real-time protection from SMS scams"
                  : "Only available on Android"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Android-only notice */}
        {Platform.OS === "ios" && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Automatic SMS scanning is only available on Android due to iOS privacy restrictions. You
              can still manually scan messages!
            </Text>
          </View>
        )}

        {/* Settings (only show if permission granted) */}
        {permissionGranted && (
          <>
            {/* Alert Settings */}
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications" size={20} color={theme.colors.text} />
              <Text style={styles.sectionTitle}>Alert Settings</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardLeft}>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>Send Alerts</Text>
                    <Text style={styles.cardSubtitle}>Push notifications for scams</Text>
                  </View>
                </View>
                <Switch
                  value={settings?.sendAlerts ?? true}
                  onValueChange={(value) => updateSettings({ sendAlerts: value })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Alert When</Text>
              <Text style={styles.cardSubtitle}>Choose which scams trigger alerts</Text>

              <View style={styles.radioGroup}>
                {["suspicious", "high_risk", "scam"].map((threshold) => (
                  <TouchableOpacity
                    key={threshold}
                    style={styles.radioItem}
                    onPress={() => handleUpdateAlertThreshold(threshold)}
                  >
                    <Ionicons
                      name={
                        settings?.alertThreshold === threshold
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={24}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.radioText}>
                      {threshold === "suspicious"
                        ? "Suspicious & above"
                        : threshold === "high_risk"
                        ? "High Risk & above"
                        : "Scams only"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Whitelist */}
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color={theme.colors.text} />
              <Text style={styles.sectionTitle}>Trusted Contacts</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Whitelist</Text>
              <Text style={styles.cardSubtitle}>
                Never scan messages from these contacts
              </Text>

              <View style={styles.addContactRow}>
                <TextInput
                  style={styles.addContactInput}
                  placeholder="+61 412 345 678"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={addContactInput}
                  onChangeText={setAddContactInput}
                  keyboardType="phone-pad"
                />
                <TouchableOpacity style={styles.addContactButton} onPress={handleAddWhitelist}>
                  <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              {settings?.whitelistedContacts && settings.whitelistedContacts.length > 0 ? (
                <View style={styles.whitelistContainer}>
                  {settings.whitelistedContacts.map((contact) => (
                    <View key={contact} style={styles.whitelistItem}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <Text style={styles.whitelistText}>{contact}</Text>
                      <TouchableOpacity onPress={() => handleRemoveWhitelist(contact)}>
                        <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No trusted contacts yet</Text>
              )}
            </View>

            {/* Privacy */}
            <View style={styles.sectionHeader}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.text} />
              <Text style={styles.sectionTitle}>Privacy</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardLeft}>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>Store Message History</Text>
                    <Text style={styles.cardSubtitle}>
                      Keep scanned messages for review (only risk scores stored if disabled)
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings?.storeScannedMessages ?? false}
                  onValueChange={handleUpdateStoreMessages}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            </View>

            {/* Danger Zone */}
            <View style={styles.dangerCard}>
              <Text style={styles.dangerTitle}>Danger Zone</Text>
              <TouchableOpacity style={styles.dangerButton} onPress={handleRevoke}>
                <Ionicons name="warning" size={20} color={theme.colors.error} />
                <Text style={styles.dangerButtonText}>Disable Auto-Scan</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>How It Works</Text>
          <Text style={styles.infoSectionText}>
            • TrueProfile Pro scans incoming SMS in real-time{"\n"}
            • Suspicious messages trigger instant alerts{"\n"}
            • Your data is processed locally on your device{"\n"}
            • Whitelist trusted contacts to skip scanning{"\n"}
            • Disable anytime in Settings
          </Text>
        </View>

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
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primarySurface,
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
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    ...theme.shadows.sm,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    ...theme.shadows.sm,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  enableButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    ...theme.shadows.md,
  },
  enableButtonTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 4,
  },
  enableButtonSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 19,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  radioGroup: {
    marginTop: 16,
    gap: 12,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radioText: {
    fontSize: 15,
    color: theme.colors.text,
  },
  addContactRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  addContactInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  addContactButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  whitelistContainer: {
    marginTop: 16,
    gap: 8,
  },
  whitelistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  whitelistText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },
  dangerCard: {
    marginHorizontal: 16,
    marginTop: 32,
    marginBottom: 24,
    padding: 20,
    backgroundColor: "#FEE2E2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.error,
    marginBottom: 12,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
  infoSection: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: 16,
    marginBottom: 24,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 12,
  },
  infoSectionText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 22,
  },
});