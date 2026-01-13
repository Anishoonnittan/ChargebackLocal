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
  Modal,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme, spacing, borderRadius } from "../lib/theme";

export default function DeveloperDashboardScreen() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [environment, setEnvironment] = useState("development");
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([
    "/api/v1/check-phone",
    "/api/v1/check-link",
    "/api/v1/check-email",
  ]);
  
  const apiKeys = useQuery(api.developerApi.listApiKeys) || [];
  const generateKey = useMutation(api.developerApi.generateApiKey);
  const revokeKey = useMutation(api.developerApi.revokeApiKey);
  const deleteKey = useMutation(api.developerApi.deleteApiKey);

  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<any>(null);

  const availableEndpoints = [
    { value: "/api/v1/check-phone", label: "Check Phone Number" },
    { value: "/api/v1/check-link", label: "Check Link Safety" },
    { value: "/api/v1/check-email", label: "Check Email" },
    { value: "/api/v1/usage", label: "Get Usage Stats" },
  ];

  const handleGenerateKey = async () => {
    if (!keyName.trim()) {
      Alert.alert("Error", "Please enter a key name");
      return;
    }

    setLoading(true);
    try {
      const result = await generateKey({
        keyName: keyName.trim(),
        environment,
        allowedEndpoints: selectedEndpoints,
      });

      setGeneratedKey(result);
      setKeyName("");
      setShowCreateForm(false);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Error", error.message);
    }
  };

  const handleRevokeKey = (apiKeyId: any) => {
    Alert.alert(
      "Revoke API Key?",
      "This will immediately stop all requests using this key.",
      [
        { text: "Cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            try {
              await revokeKey({ apiKeyId });
              Alert.alert("Success", "API key revoked");
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteKey = (apiKeyId: any) => {
    Alert.alert(
      "Delete API Key?",
      "This action cannot be undone. All integrations using this key will stop working.",
      [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteKey({ apiKeyId });
              Alert.alert("Success", "API key deleted");
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const toggleEndpoint = (endpoint: string) => {
    if (selectedEndpoints.includes(endpoint)) {
      setSelectedEndpoints(selectedEndpoints.filter((e) => e !== endpoint));
    } else {
      setSelectedEndpoints([...selectedEndpoints, endpoint]);
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert("Copied!", "API key copied to clipboard");
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="api" size={40} color={theme.colors.primary} />
          <Text style={styles.title}>🔑 Developer API</Text>
          <Text style={styles.subtitle}>
            Integrate ScamVigil into your apps
          </Text>
        </View>

        {/* API Keys Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your API Keys</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateForm(true)}
            >
              <MaterialCommunityIcons name="plus" size={16} color="white" />
              <Text style={styles.createButtonText}>New Key</Text>
            </TouchableOpacity>
          </View>

          {apiKeys.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="key-outline"
                size={40}
                color={theme.colors.outline}
              />
              <Text style={styles.emptyText}>No API keys yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first API key to get started
              </Text>
            </View>
          ) : (
            apiKeys.map((key) => (
              <View key={key._id} style={styles.keyCard}>
                <View style={styles.keyHeader}>
                  <View>
                    <Text style={styles.keyName}>{key.keyName}</Text>
                    <Text style={styles.keyEnv}>{key.environment}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: key.isActive
                          ? "#4caf50"
                          : theme.colors.outline,
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {key.isActive ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>

                <View style={styles.keyDetails}>
                  <Text style={styles.keyLabel}>API Key:</Text>
                  <Text style={styles.keyValue}>{key.apiKey}</Text>
                </View>

                <View style={styles.keyStats}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{key.requestsToday}</Text>
                    <Text style={styles.statLabel}>Today</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{key.requestsThisMonth}</Text>
                    <Text style={styles.statLabel}>This Month</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{key.dailyQuota}</Text>
                    <Text style={styles.statLabel}>Daily Limit</Text>
                  </View>
                </View>

                <View style={styles.keyActions}>
                  {key.isActive ? (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleRevokeKey(key._id)}
                    >
                      <MaterialCommunityIcons
                        name="cancel"
                        size={16}
                        color={theme.colors.error}
                      />
                      <Text style={[styles.actionText, { color: theme.colors.error }]}>
                        Revoke
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteKey(key._id)}
                  >
                    <MaterialCommunityIcons
                      name="delete"
                      size={16}
                      color={theme.colors.error}
                    />
                    <Text style={[styles.actionText, { color: theme.colors.error }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* API Documentation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 API Documentation</Text>

          <View style={styles.docCard}>
            <Text style={styles.docEndpoint}>POST /api/v1/check-phone</Text>
            <Text style={styles.docDescription}>
              Check if a phone number is reported as a scam
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.code}>
                {`curl -X POST https://api.scamvigil.com/v1/check-phone \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "+61412345678"}'`}
              </Text>
            </View>
          </View>

          <View style={styles.docCard}>
            <Text style={styles.docEndpoint}>POST /api/v1/check-link</Text>
            <Text style={styles.docDescription}>
              Analyze a URL for phishing and scam indicators
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.code}>
                {`curl -X POST https://api.scamvigil.com/v1/check-link \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}
              </Text>
            </View>
          </View>

          <View style={styles.docCard}>
            <Text style={styles.docEndpoint}>POST /api/v1/check-email</Text>
            <Text style={styles.docDescription}>
              Verify email legitimacy and check for scam patterns
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.code}>
                {`curl -X POST https://api.scamvigil.com/v1/check-email \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com"}'`}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.docsButton}>
            <Text style={styles.docsButtonText}>View Full Documentation →</Text>
          </TouchableOpacity>
        </View>

        {/* Pricing Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Pricing</Text>

          <View style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>Free Tier</Text>
            <Text style={styles.pricingValue}>1,000 requests/day</Text>
            <Text style={styles.pricingDesc}>60 requests/minute</Text>
          </View>

          <View style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>Pro Tier</Text>
            <Text style={styles.pricingValue}>10,000 requests/day</Text>
            <Text style={styles.pricingDesc}>100 requests/minute</Text>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade to Pro →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Create API Key Modal */}
      <Modal
        visible={showCreateForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New API Key</Text>

            <Text style={styles.label}>Key Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Production API"
              value={keyName}
              onChangeText={setKeyName}
            />

            <Text style={styles.label}>Environment</Text>
            <View style={styles.environmentPicker}>
              {["development", "sandbox", "production"].map((env) => (
                <TouchableOpacity
                  key={env}
                  style={[
                    styles.envOption,
                    environment === env && styles.envOptionSelected,
                  ]}
                  onPress={() => setEnvironment(env)}
                >
                  <Text
                    style={[
                      styles.envOptionText,
                      environment === env && styles.envOptionTextSelected,
                    ]}
                  >
                    {env}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Allowed Endpoints</Text>
            {availableEndpoints.map((endpoint) => (
              <TouchableOpacity
                key={endpoint.value}
                style={styles.checkboxRow}
                onPress={() => toggleEndpoint(endpoint.value)}
              >
                <MaterialCommunityIcons
                  name={
                    selectedEndpoints.includes(endpoint.value)
                      ? "checkbox-marked"
                      : "checkbox-blank-outline"
                  }
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.checkboxLabel}>{endpoint.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowCreateForm(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleGenerateKey}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Generate Key</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generated Key Modal */}
      <Modal
        visible={!!generatedKey}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setGeneratedKey(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons
              name="check-circle"
              size={50}
              color="#4caf50"
              style={{ alignSelf: "center" }}
            />
            <Text style={styles.modalTitle}>API Key Generated!</Text>

            <Text style={styles.warningText}>
              ⚠️ Save these credentials securely - you won't see them again!
            </Text>

            <View style={styles.credentialBox}>
              <Text style={styles.credentialLabel}>API Key:</Text>
              <Text style={styles.credentialValue}>{generatedKey?.apiKey}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(generatedKey?.apiKey)}
              >
                <MaterialCommunityIcons name="content-copy" size={16} color={theme.colors.primary} />
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.credentialBox}>
              <Text style={styles.credentialLabel}>API Secret:</Text>
              <Text style={styles.credentialValue}>{generatedKey?.apiSecret}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(generatedKey?.apiSecret)}
              >
                <MaterialCommunityIcons name="content-copy" size={16} color={theme.colors.primary} />
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, { width: "100%" }]}
              onPress={() => setGeneratedKey(null)}
            >
              <Text style={styles.modalButtonTextPrimary}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    padding: spacing.large,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.onBackground,
    marginTop: spacing.medium,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.outline,
    marginTop: spacing.small,
  },
  section: {
    padding: spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.onBackground,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.small,
  },
  createButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: spacing.small,
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xlarge,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.onBackground,
    marginTop: spacing.medium,
  },
  emptySubtext: {
    fontSize: 12,
    color: theme.colors.outline,
    marginTop: spacing.small,
  },
  keyCard: {
    backgroundColor: theme.colors.surface,
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  keyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.medium,
  },
  keyName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.onBackground,
  },
  keyEnv: {
    fontSize: 12,
    color: theme.colors.outline,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  keyDetails: {
    marginBottom: spacing.medium,
  },
  keyLabel: {
    fontSize: 12,
    color: theme.colors.outline,
    marginBottom: 4,
  },
  keyValue: {
    fontSize: 11,
    fontFamily: "Courier New",
    color: theme.colors.onBackground,
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.small,
    borderRadius: borderRadius.small,
  },
  keyStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.medium,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.outline,
    marginBottom: spacing.medium,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.outline,
    marginTop: 2,
  },
  keyActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.medium,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  docCard: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
  },
  docEndpoint: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
    fontFamily: "Courier New",
  },
  docDescription: {
    fontSize: 12,
    color: theme.colors.onBackground,
    marginTop: spacing.small,
    marginBottom: spacing.small,
  },
  codeBlock: {
    backgroundColor: "#1e1e1e",
    padding: spacing.small,
    borderRadius: borderRadius.small,
  },
  code: {
    fontSize: 10,
    color: "#d4d4d4",
    fontFamily: "Courier New",
  },
  docsButton: {
    backgroundColor: theme.colors.primary,
    padding: spacing.medium,
    borderRadius: borderRadius.small,
    alignItems: "center",
  },
  docsButtonText: {
    color: "white",
    fontWeight: "600",
  },
  pricingCard: {
    backgroundColor: theme.colors.surface,
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.onBackground,
  },
  pricingValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginTop: spacing.small,
  },
  pricingDesc: {
    fontSize: 12,
    color: theme.colors.outline,
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: theme.colors.primary,
    padding: spacing.small,
    borderRadius: borderRadius.small,
    alignItems: "center",
    marginTop: spacing.medium,
  },
  upgradeButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: spacing.large,
    borderRadius: borderRadius.large,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.onBackground,
    marginBottom: spacing.large,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.onBackground,
    marginBottom: spacing.small,
    marginTop: spacing.medium,
  },
  input: {
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: borderRadius.small,
    padding: spacing.medium,
    fontSize: 14,
  },
  environmentPicker: {
    flexDirection: "row",
    gap: spacing.small,
  },
  envOption: {
    flex: 1,
    padding: spacing.small,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
  },
  envOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  envOptionText: {
    fontSize: 12,
    color: theme.colors.onBackground,
  },
  envOptionTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.small,
    gap: spacing.small,
  },
  checkboxLabel: {
    fontSize: 14,
    color: theme.colors.onBackground,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.medium,
    marginTop: spacing.large,
  },
  modalButton: {
    flex: 1,
    padding: spacing.medium,
    borderRadius: borderRadius.small,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  modalButtonTextPrimary: {
    color: "white",
    fontWeight: "600",
  },
  modalButtonTextSecondary: {
    color: theme.colors.onBackground,
    fontWeight: "600",
  },
  warningText: {
    fontSize: 12,
    color: theme.colors.error,
    backgroundColor: "#ffebee",
    padding: spacing.small,
    borderRadius: borderRadius.small,
    marginVertical: spacing.medium,
    textAlign: "center",
  },
  credentialBox: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.medium,
    borderRadius: borderRadius.small,
    marginBottom: spacing.medium,
  },
  credentialLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.outline,
    marginBottom: 4,
  },
  credentialValue: {
    fontSize: 11,
    fontFamily: "Courier New",
    color: theme.colors.onBackground,
    marginBottom: spacing.small,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: "500",
  },
});