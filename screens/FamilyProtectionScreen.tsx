import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export default function FamilyProtectionScreen({ navigation }: any) {
  const user = useQuery(api.users.getCurrentUser);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<"protected" | "guardian">("protected");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch family protection data
  const protectionData = useQuery(
    api.familyProtection.getFamilyProtection,
    user?.id ? { userId: user.id as Id<"users"> } : "skip"
  );
  
  const stats = useQuery(
    api.familyProtection.getFamilyProtectionStats,
    user?.id ? { userId: user.id as Id<"users"> } : "skip"
  );

  // Mutations
  const enableProtection = useMutation(api.familyProtection.enableFamilyProtection);
  const addGuardianMutation = useMutation(api.familyProtection.addGuardian);
  const removeGuardianMutation = useMutation(api.familyProtection.removeGuardian);
  const disableProtection = useMutation(api.familyProtection.disableFamilyProtection);

  // State
  const [showAddGuardian, setShowAddGuardian] = useState(false);
  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [relationship, setRelationship] = useState<
    "child" | "parent" | "sibling" | "spouse" | "friend" | "other"
  >("child");

  // Protection settings
  const [autoScanMessages, setAutoScanMessages] = useState(true);
  const [autoScanCalls, setAutoScanCalls] = useState(true);
  const [autoScanInvestments, setAutoScanInvestments] = useState(true);

  const handleEnableProtection = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      await enableProtection({
        userId: user.id as Id<"users">,
        protectionLevel: "high_risk_only",
        autoScanMessages,
        autoScanCalls,
        autoScanInvestments,
        notifyGuardiansOn: ["high_risk", "scam"],
      });

      Alert.alert(
        "✅ Family Protection Enabled",
        "Your account is now protected. Add guardians to receive alerts when threats are detected."
      );
    } catch (error) {
      console.error("Enable protection error:", error);
      Alert.alert("Error", "Failed to enable family protection");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGuardian = async () => {
    if (!user?.id || !guardianName || !guardianEmail) {
      Alert.alert("Error", "Please enter guardian name and email");
      return;
    }

    // Basic email validation
    if (!guardianEmail.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      await addGuardianMutation({
        protectedUserId: user.id as Id<"users">,
        guardianEmail: guardianEmail.toLowerCase().trim(),
        guardianPhone,
        guardianName: guardianName.trim(),
        relationshipType: relationship,
        canViewScans: true,
        canBlockThreats: true,
      });

      Alert.alert(
        "✅ Guardian Added",
        `${guardianName} has been added as your guardian. They will receive alerts when threats are detected.`
      );

      // Reset form
      setGuardianName("");
      setGuardianEmail("");
      setGuardianPhone("");
      setShowAddGuardian(false);
    } catch (error) {
      console.error("Add guardian error:", error);
      Alert.alert("Error", "Failed to add guardian");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveGuardian = (guardianId: Id<"guardianAlerts">, name: string) => {
    Alert.alert(
      "Remove Guardian",
      `Remove ${name} as your guardian? They will no longer receive alerts.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeGuardianMutation({ guardianId });
              Alert.alert("✅ Guardian Removed", `${name} has been removed`);
            } catch (error) {
              Alert.alert("Error", "Failed to remove guardian");
            }
          },
        },
      ]
    );
  };

  const handleDisableProtection = () => {
    Alert.alert(
      "Disable Family Protection",
      "Are you sure you want to disable family protection? Guardians will no longer receive alerts.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            if (!user?.id) return;
            try {
              await disableProtection({ userId: user.id as Id<"users"> });
              Alert.alert("✅ Protection Disabled", "Family protection has been disabled");
            } catch (error) {
              Alert.alert("Error", "Failed to disable protection");
            }
          },
        },
      ]
    );
  };

  const isEnabled = protectionData?.isEnabled || false;
  const guardians = protectionData?.guardians || [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Family Protection</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Ionicons name="family-restroom" size={64} color="#2196F3" />
          <Text style={styles.heroTitle}>Protect Your Loved Ones</Text>
          <Text style={styles.heroSubtitle}>
            Add trusted guardians who will receive alerts when suspicious activity is detected
          </Text>
        </View>

        {!isEnabled ? (
          // Enable Protection CTA
          <View style={styles.enableSection}>
            <Text style={styles.sectionTitle}>How It Works</Text>

            <View style={styles.featureCard}>
              <Ionicons name="security" size={32} color="#4CAF50" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>1. Automatic Scanning</Text>
                <Text style={styles.featureSubtitle}>
                  We scan messages, calls, and investments for threats
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="notifications-active" size={32} color="#FF9800" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>2. Guardian Alerts</Text>
                <Text style={styles.featureSubtitle}>
                  Your guardians receive instant notifications about threats
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="block" size={32} color="#F44336" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>3. Block Threats</Text>
                <Text style={styles.featureSubtitle}>
                  Guardians can block scammers and protect you remotely
                </Text>
              </View>
            </View>

            {/* Protection Settings */}
            <View style={styles.settingsCard}>
              <Text style={styles.sectionTitle}>Protection Settings</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingText}>
                  <Ionicons name="message" size={24} color="#666" />
                  <Text style={styles.settingLabel}>Scan Messages</Text>
                </View>
                <Switch
                  value={autoScanMessages}
                  onValueChange={setAutoScanMessages}
                  trackColor={{ false: "#ddd", true: "#4CAF50" }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingText}>
                  <Ionicons name="phone" size={24} color="#666" />
                  <Text style={styles.settingLabel}>Scan Calls</Text>
                </View>
                <Switch
                  value={autoScanCalls}
                  onValueChange={setAutoScanCalls}
                  trackColor={{ false: "#ddd", true: "#4CAF50" }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingText}>
                  <Ionicons name="trending-up" size={24} color="#666" />
                  <Text style={styles.settingLabel}>Scan Investments</Text>
                </View>
                <Switch
                  value={autoScanInvestments}
                  onValueChange={setAutoScanInvestments}
                  trackColor={{ false: "#ddd", true: "#4CAF50" }}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.enableButton}
              onPress={handleEnableProtection}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="shield" size={24} color="#fff" />
                  <Text style={styles.enableButtonText}>Enable Protection</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // Protection Enabled - Show Stats & Guardians
          <>
            {/* Stats Dashboard */}
            {stats && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Protection Stats</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Ionicons name="security" size={32} color="#4CAF50" />
                    <Text style={styles.statValue}>{stats.totalScansPerformed}</Text>
                    <Text style={styles.statLabel}>Scans</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="block" size={32} color="#F44336" />
                    <Text style={styles.statValue}>{stats.totalThreatsBlocked}</Text>
                    <Text style={styles.statLabel}>Threats Blocked</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="people" size={32} color="#2196F3" />
                    <Text style={styles.statValue}>{stats.totalGuardians}</Text>
                    <Text style={styles.statLabel}>Guardians</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Guardians List */}
            <View style={styles.guardiansSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Guardians</Text>
                <TouchableOpacity onPress={() => setShowAddGuardian(true)}>
                  <Ionicons name="add-circle" size={28} color="#2196F3" />
                </TouchableOpacity>
              </View>

              {guardians.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="person-add" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No guardians added yet</Text>
                  <Text style={styles.emptySubtext}>
                    Add a trusted family member to receive alerts
                  </Text>
                  <TouchableOpacity
                    style={styles.addFirstButton}
                    onPress={() => setShowAddGuardian(true)}
                  >
                    <Text style={styles.addFirstButtonText}>Add Guardian</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                guardians.map((guardian: any) => (
                  <View key={guardian._id} style={styles.guardianCard}>
                    <View style={styles.guardianInfo}>
                      <View style={styles.guardianAvatar}>
                        <Text style={styles.guardianInitial}>
                          {guardian.guardianName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.guardianDetails}>
                        <Text style={styles.guardianName}>{guardian.guardianName}</Text>
                        <Text style={styles.guardianEmail}>{guardian.guardianEmail}</Text>
                        <View style={styles.guardianMeta}>
                          <Ionicons name="people" size={14} color="#666" />
                          <Text style={styles.guardianMetaText}>
                            {guardian.relationshipType}
                          </Text>
                          {guardian.invitationStatus === "pending" && (
                            <>
                              <Text style={styles.dot}>•</Text>
                              <Text style={styles.pendingText}>Pending invite</Text>
                            </>
                          )}
                          {guardian.invitationStatus === "accepted" && (
                            <>
                              <Text style={styles.dot}>•</Text>
                              <Text style={styles.activeText}>Active</Text>
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        handleRemoveGuardian(
                          guardian._id as Id<"guardianAlerts">,
                          guardian.guardianName
                        )
                      }
                    >
                      <Ionicons name="close" size={24} color="#999" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Add Guardian Form */}
            {showAddGuardian && (
              <View style={styles.addGuardianForm}>
                <Text style={styles.formTitle}>Add Guardian</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Guardian Name"
                  value={guardianName}
                  onChangeText={setGuardianName}
                  autoCapitalize="words"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  value={guardianEmail}
                  onChangeText={setGuardianEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Phone (Optional)"
                  value={guardianPhone}
                  onChangeText={setGuardianPhone}
                  keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>Relationship</Text>
                <View style={styles.relationshipButtons}>
                  {(["child", "parent", "sibling", "spouse", "friend", "other"] as const).map(
                    (rel) => (
                      <TouchableOpacity
                        key={rel}
                        style={[
                          styles.relationshipButton,
                          relationship === rel && styles.relationshipButtonActive,
                        ]}
                        onPress={() => setRelationship(rel)}
                      >
                        <Text
                          style={[
                            styles.relationshipButtonText,
                            relationship === rel && styles.relationshipButtonTextActive,
                          ]}
                        >
                          {rel.charAt(0).toUpperCase() + rel.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowAddGuardian(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAddGuardian}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Add Guardian</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Disable Protection */}
            <TouchableOpacity
              style={styles.disableButton}
              onPress={handleDisableProtection}
            >
              <Text style={styles.disableButtonText}>Disable Family Protection</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 24,
  },
  enableSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureText: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  settingsCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  enableButton: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 12,
    gap: 8,
  },
  enableButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  statsSection: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  guardiansSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  addFirstButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  addFirstButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  guardianCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guardianInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  guardianAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
  },
  guardianInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  guardianDetails: {
    flex: 1,
    marginLeft: 12,
  },
  guardianName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  guardianEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  guardianMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  guardianMetaText: {
    fontSize: 12,
    color: "#666",
    textTransform: "capitalize",
  },
  dot: {
    color: "#ccc",
    marginHorizontal: 4,
  },
  pendingText: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "500",
  },
  activeText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  addGuardianForm: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 8,
    marginBottom: 8,
  },
  relationshipButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  relationshipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  relationshipButtonActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  relationshipButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  relationshipButtonTextActive: {
    color: "#fff",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#2196F3",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  disableButton: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F44336",
    alignItems: "center",
  },
  disableButtonText: {
    fontSize: 16,
    color: "#F44336",
    fontWeight: "600",
  },
});