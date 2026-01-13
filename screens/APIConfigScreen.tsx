import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { theme } from "../lib/theme";

type ApiField = {
  key: string;
  label: string;
  placeholder: string;
  secure?: boolean;
  helperText?: string;
  multiline?: boolean;
};

interface ApiService {
  id: string;
  name: string;
  description: string;
  freeTier: string;
  paidTier: string;
  signupUrl: string;
  fields: ApiField[];
  storageFormat: "single" | "json";
}

const apiServices: ApiService[] = [
  {
    id: "ipqs",
    name: "IPQualityScore (IPQS)",
    description: "Fraud score (0–100), VoIP/burner detection, recent abuse — best Layer 2 phone verification",
    freeTier: "5,000/month free",
    paidTier: "$49/mo — 30,000 lookups",
    signupUrl: "https://www.ipqualityscore.com/phone-number-validation-api",
    storageFormat: "single",
    fields: [
      {
        key: "apiKey",
        label: "IPQS API Key",
        placeholder: "e.g. 123abc...",
        secure: true,
      },
    ],
  },
  {
    id: "truecaller",
    name: "Truecaller Business API",
    description: "Caller ID + spam reputation signal (great cross-check for international spam)",
    freeTier: "Varies (approval required)",
    paidTier: "Paid plans available",
    signupUrl: "https://www.truecaller.com/business/api",
    storageFormat: "single",
    fields: [
      {
        key: "apiKey",
        label: "Truecaller API Key",
        placeholder: "Bearer token",
        secure: true,
      },
    ],
  },
  {
    id: "twilio",
    name: "Twilio Lookup",
    description: "Carrier + line-type intelligence (mobile/landline/voip) and caller_name where available",
    freeTier: "$15 credit",
    paidTier: "$0.005+ per lookup",
    signupUrl: "https://www.twilio.com/docs/lookup",
    storageFormat: "json",
    fields: [
      {
        key: "accountSid",
        label: "Account SID",
        placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        secure: true,
      },
      {
        key: "authToken",
        label: "Auth Token",
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        secure: true,
      },
    ],
  },
  {
    id: "google_safe_browsing",
    name: "Google Safe Browsing",
    description: "Phishing/malware URL detection for the Link Scanner + Message Scanner",
    freeTier: "10,000/day free",
    paidTier: "Typically free for most apps",
    signupUrl: "https://developers.google.com/safe-browsing/v4/get-started",
    storageFormat: "single",
    fields: [
      {
        key: "apiKey",
        label: "Safe Browsing API Key",
        placeholder: "AIza...",
        secure: true,
      },
    ],
  },
  {
    id: "abstract_phone",
    name: "Abstract Phone Validation",
    description: "Phone number format + country + carrier (lighter alternative to Twilio/IPQS)",
    freeTier: "250/month free",
    paidTier: "$9/mo — 5,000 requests",
    signupUrl: "https://www.abstractapi.com/api/phone-validation-api",
    storageFormat: "single",
    fields: [
      {
        key: "apiKey",
        label: "Abstract Phone API Key",
        placeholder: "e.g. 123abc...",
        secure: true,
      },
    ],
  },
  {
    id: "abstract_email",
    name: "Abstract Email Validation",
    description: "Disposable email detection + email deliverability checks",
    freeTier: "250/month free",
    paidTier: "$9/mo — 5,000 requests",
    signupUrl: "https://www.abstractapi.com/api/email-verification-validation-api",
    storageFormat: "single",
    fields: [
      {
        key: "apiKey",
        label: "Abstract Email API Key",
        placeholder: "e.g. 123abc...",
        secure: true,
      },
    ],
  },
  {
    id: "google_vision",
    name: "Google Cloud Vision",
    description: "Image + OCR analysis (useful for screenshots, profile images, document scans)",
    freeTier: "$300 credit",
    paidTier: "Pay-as-you-go",
    signupUrl: "https://cloud.google.com/vision/docs/setup",
    storageFormat: "single",
    fields: [
      {
        key: "apiKey",
        label: "Vision API Key",
        placeholder: "AIza...",
        secure: true,
      },
    ],
  },
  {
    id: "meta_graph",
    name: "Meta Graph API (Facebook/Instagram)",
    description:
      "Enables deeper profile verification signals (Page/Account metadata) for supported use cases.",
    freeTier: "Free (subject to Meta review/permissions)",
    paidTier: "Free",
    signupUrl: "https://developers.facebook.com/docs/apis-and-sdks",
    storageFormat: "json",
    fields: [
      {
        key: "appId",
        label: "Meta App ID",
        placeholder: "e.g. 123456789012345",
        secure: true,
      },
      {
        key: "appSecret",
        label: "Meta App Secret",
        placeholder: "e.g. 0123abc...",
        secure: true,
      },
    ],
  },
  {
    id: "google_document_ai",
    name: "Google Cloud Document AI",
    description:
      "Document parsing/OCR for IDs, invoices, screenshots. Uses a Service Account (JSON) + Processor resource name.",
    freeTier: "$300 credit",
    paidTier: "Pay-as-you-go",
    signupUrl: "https://cloud.google.com/document-ai/docs/setup",
    storageFormat: "json",
    fields: [
      {
        key: "serviceAccountJson",
        label: "Service Account JSON",
        placeholder: "Paste the full JSON from Google Cloud → IAM → Service Accounts → Keys",
        secure: true,
        multiline: true,
        helperText:
          "We store this server-side only. This is required because Document AI typically uses OAuth (not a simple API key).",
      },
      {
        key: "processorResourceName",
        label: "Processor Resource Name",
        placeholder: "projects/<project>/locations/<location>/processors/<processor>",
        helperText:
          "You'll need this later when you enable document scanning. For now, we also use it to sanity-check your setup.",
      },
    ],
  },
  {
    id: "abn_lookup",
    name: "ABN Lookup (ABR Web Services)",
    description:
      "Australian Business Register (ABN) validation — verify business identity claims inside scams.",
    freeTier: "Free (requires GUID)",
    paidTier: "Free",
    signupUrl: "https://abr.business.gov.au/Tools/WebServices",
    storageFormat: "single",
    fields: [
      {
        key: "apiKey",
        label: "Authentication GUID",
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        secure: true,
        helperText:
          "ABR issues an Authentication GUID after registration. We use it to query ABN details.",
      },
    ],
  },
  {
    id: "ipapi",
    name: "IP Geolocation (ipapi.co)",
    description: "Detect geolocation mismatches for chargeback fraud detection — compare customer IP with card country",
    freeTier: "30,000/month free",
    paidTier: "$10/mo — 50,000 requests",
    signupUrl: "https://ipapi.co/",
    storageFormat: "single",
    fields: [
      {
        key: "apiKey",
        label: "ipapi.co API Key (Optional for free tier)",
        placeholder: "Leave blank for free tier or paste key for higher limits",
        secure: true,
        helperText: "Free tier works without a key (30k/mo). Add key to unlock 50k+ requests.",
      },
    ],
  },
  {
    id: "pdfmonkey",
    name: "PDF Generation (PDFMonkey)",
    description: "Auto-generate dispute evidence PDFs for fighting chargebacks — includes transaction details, tracking, and proof",
    freeTier: "300 docs/month free",
    paidTier: "$29/mo — 2,000 documents",
    signupUrl: "https://www.pdfmonkey.io/",
    storageFormat: "json",
    fields: [
      {
        key: "apiKey",
        label: "PDFMonkey API Key",
        placeholder: "pm_xxx...",
        secure: true,
      },
      {
        key: "templateId",
        label: "Template ID",
        placeholder: "TEMPLATE_ID",
        helperText: "Create a template in PDFMonkey dashboard, then paste the ID here",
      },
    ],
  },
  {
    id: "stripe",
    name: "Stripe (Payment Processing)",
    description: "Connect Stripe to auto-analyze transactions for chargeback risk — detect disputes early and auto-refund when needed",
    freeTier: "Free (transaction fees apply)",
    paidTier: "2.9% + 30¢ per charge",
    signupUrl: "https://dashboard.stripe.com/register",
    storageFormat: "json",
    fields: [
      {
        key: "secretKey",
        label: "Stripe Secret Key",
        placeholder: "sk_live_xxx... or sk_test_xxx...",
        secure: true,
        helperText: "Find this in Stripe Dashboard → Developers → API keys",
      },
      {
        key: "webhookSecret",
        label: "Webhook Signing Secret (Optional)",
        placeholder: "whsec_xxx...",
        secure: true,
        helperText: "For real-time chargeback alerts. Create endpoint at: /webhooks/stripe",
      },
    ],
  },
  {
    id: "shopify",
    name: "Shopify (Ecommerce Platform)",
    description: "Connect Shopify to auto-scan orders for fraud + block fulfillment for high-risk transactions",
    freeTier: "Free (Shopify plan required)",
    paidTier: "$29+/mo (Shopify subscription)",
    signupUrl: "https://partners.shopify.com/",
    storageFormat: "json",
    fields: [
      {
        key: "accessToken",
        label: "Shopify Access Token",
        placeholder: "shpat_xxx...",
        secure: true,
        helperText: "Generate via Shopify Admin → Apps → Develop apps → API credentials",
      },
      {
        key: "shopDomain",
        label: "Shop Domain",
        placeholder: "your-store.myshopify.com",
        helperText: "Your Shopify store URL",
      },
    ],
  },
  {
    id: "ethoca_verifi",
    name: "Ethoca/Verifi (Pre-Dispute Alerts)",
    description: "Get notified BEFORE chargebacks happen — auto-refund to prevent disputes (saves 70% of chargebacks)",
    freeTier: "Contact for pricing",
    paidTier: "$0.30-$0.50 per alert",
    signupUrl: "https://www.verifi.com/solutions/order-insight/",
    storageFormat: "json",
    fields: [
      {
        key: "apiKey",
        label: "Ethoca/Verifi API Key",
        placeholder: "xxx...",
        secure: true,
      },
      {
        key: "merchantId",
        label: "Merchant ID",
        placeholder: "Your merchant identifier",
        helperText: "Provided by Ethoca/Verifi after account setup",
      },
    ],
  },
];

type APIConfigScreenProps = {
  sessionToken: string;
  onBack?: () => void;
  app?: "scamvigil" | "chargeback";
};

export default function APIConfigScreen({ sessionToken, onBack, app = "scamvigil" }: APIConfigScreenProps) {
  const apiKeys = useQuery(api.apiConfig.getAllApiKeysForSession, { sessionToken });
  const saveApiKey = useMutation(api.apiConfig.saveApiKeyForSession);
  const deleteApiKey = useMutation(api.apiConfig.deleteApiKeyForSession);
  const testApiKey = useAction(api.apiConfig.testApiKeyForSession);

  const [editingService, setEditingService] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});

  // Filter API services based on app type
  const filteredApiServices = useMemo(() => {
    if (app === "scamvigil") {
      // ScamVigil: Consumer protection APIs
      return apiServices.filter(s => [
        "ipqs",
        "truecaller",
        "twilio",
        "google_safe_browsing",
        "abstract_phone",
        "abstract_email",
        "google_vision",
        "meta_graph",
        "google_document_ai",
        "abn_lookup",
        "ipapi",
      ].includes(s.id));
    } else {
      // ChargebackShield: E-commerce/payment APIs
      return apiServices.filter(s => [
        "ipqs",
        "google_safe_browsing",
        "ipapi",
        "pdfmonkey",
        "stripe",
        "shopify",
        "ethoca_verifi",
        "abstract_email",
        "twilio",
      ].includes(s.id));
    }
  }, [app]);

  const getKeyForService = (serviceId: string) => {
    return apiKeys?.find((k: any) => k.service === serviceId);
  };

  const currentEditingService = useMemo(
    () => filteredApiServices.find((s) => s.id === editingService) ?? null,
    [editingService]
  );

  const setFieldValue = (serviceId: string, fieldKey: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || {}),
        [fieldKey]: value,
      },
    }));
  };

  const buildApiKeyPayload = (service: ApiService): string => {
    const valuesForService = fieldValues[service.id] || {};

    if (service.storageFormat === "single") {
      return (valuesForService.apiKey || "").trim();
    }

    const payload: Record<string, string> = {};
    for (const field of service.fields) {
      const value = (valuesForService[field.key] || "").trim();
      payload[field.key] = value;
    }

    return JSON.stringify(payload);
  };

  const validateFields = (service: ApiService): string | null => {
    const valuesForService = fieldValues[service.id] || {};

    for (const field of service.fields) {
      const value = (valuesForService[field.key] || "").trim();
      if (!value) {
        return `Please enter ${field.label}`;
      }
    }

    return null;
  };

  const handleSaveKey = async (service: ApiService) => {
    const validationError = validateFields(service);
    if (validationError) {
      Alert.alert("Missing information", validationError);
      return;
    }

    const payload = buildApiKeyPayload(service);

    setSaving(true);
    try {
      await saveApiKey({
        sessionToken,
        service: service.id,
        apiKey: payload,
        keyName: service.name,
        quotaLimit: service.freeTier.includes("250") ? 250 : service.freeTier.includes("5,000") ? 5000 : service.freeTier.includes("10,000") ? 10000 : undefined,
        quotaPeriod: "monthly",
      });

      Alert.alert("Saved", `${service.name} credentials saved successfully.`);
      setEditingService(null);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save API key");
    } finally {
      setSaving(false);
    }
  };

  const handleTestKey = async (service: ApiService) => {
    const keyData = getKeyForService(service.id);
    if (!keyData) {
      Alert.alert("Error", "No API key configured for this service");
      return;
    }

    setTesting(service.id);
    try {
      const result = await testApiKey({
        sessionToken,
        service: service.id,
      });

      if (result.valid) {
        Alert.alert(
          "✅ Connection OK",
          `${service.name} is working.\n\n${result.message || ""}${
            result.quotaRemaining ? `\nQuota remaining: ${result.quotaRemaining}` : ""
          }`
        );
      } else {
        Alert.alert(
          "❌ Connection Failed",
          `${service.name} test failed:\n\n${result.error || "Unknown error"}`
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Test failed");
    } finally {
      setTesting(null);
    }
  };

  const handleDeleteKey = (service: ApiService) => {
    Alert.alert(
      "Delete API Key",
      `Are you sure you want to delete the ${service.name} credentials?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteApiKey({ sessionToken, service: service.id });
              Alert.alert("Deleted", "Credentials removed successfully");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete API key");
            }
          },
        },
      ]
    );
  };

  const handleOpenUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Can't open link", url);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Can't open link", url);
    }
  };

  if (apiKeys === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading API configuration...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {onBack ? (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
          <View style={styles.headerCenter}>
            <Ionicons name="key" size={34} color={theme.colors.primary} />
            <Text style={styles.title}>API Configuration</Text>
            <Text style={styles.subtitle}>
              Add your provider keys once — all scanners will start using them.
            </Text>
          </View>
          <View style={styles.backButtonPlaceholder} />
        </View>
      </View>

      {/* API Services */}
      {filteredApiServices.map((service) => {
        const keyData = getKeyForService(service.id);
        const isEditing = editingService === service.id;
        const isConfigured = !!keyData;
        const isTesting = testing === service.id;

        const valuesForService = fieldValues[service.id] || {};

        return (
          <View key={service.id} style={styles.serviceCard}>
            {/* Service Header */}
            <View style={styles.serviceHeader}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
              </View>
              {isConfigured && (
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(keyData.testStatus) }]}>
                  <Text style={styles.statusText}>{getStatusText(keyData.testStatus)}</Text>
                </View>
              )}
            </View>

            {/* Pricing Info */}
            <View style={styles.pricingRow}>
              <View style={styles.pricingItem}>
                <Ionicons name="gift-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.pricingText}>{service.freeTier}</Text>
              </View>
              <View style={styles.pricingItem}>
                <Ionicons name="card-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.pricingText}>{service.paidTier}</Text>
              </View>
            </View>

            {/* Key Display */}
            {isConfigured && !isEditing && (
              <View style={styles.keyDisplay}>
                <Text style={styles.keyLabel}>Stored:</Text>
                <Text style={styles.keyValue}>{keyData.maskedKey}</Text>
              </View>
            )}

            {/* Edit Inputs */}
            {isEditing && (
              <View style={styles.keyInput}>
                {service.fields.map((field) => (
                  <View key={field.key} style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <TextInput
                      style={[styles.input, field.multiline && styles.inputMultiline]}
                      placeholder={field.placeholder}
                      value={valuesForService[field.key] || ""}
                      onChangeText={(text) => setFieldValue(service.id, field.key, text)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry={field.secure}
                      multiline={field.multiline}
                    />
                    {!!field.helperText && (
                      <Text style={styles.fieldHelper}>{field.helperText}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {!isConfigured && !isEditing && (
                <>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => {
                      setEditingService(service.id);
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#FFF" />
                    <Text style={styles.primaryButtonText}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleOpenUrl(service.signupUrl)}
                  >
                    <Ionicons name="open-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.secondaryButtonText}>Get Key</Text>
                  </TouchableOpacity>
                </>
              )}

              {isConfigured && !isEditing && (
                <>
                  <TouchableOpacity
                    style={[styles.primaryButton, isTesting && styles.buttonDisabled]}
                    onPress={() => handleTestKey(service)}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                    )}
                    <Text style={styles.primaryButtonText}>
                      {isTesting ? "Testing..." : "Test"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => {
                      setEditingService(service.id);
                      // Prefill nothing (we never read secrets back to the client)
                      setFieldValues((prev) => ({ ...prev, [service.id]: {} }));
                    }}
                  >
                    <Ionicons name="pencil-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.secondaryButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dangerButton}
                    onPress={() => handleDeleteKey(service)}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </>
              )}

              {isEditing && (
                <>
                  <TouchableOpacity
                    style={[styles.primaryButton, saving && styles.buttonDisabled]}
                    onPress={() => handleSaveKey(service)}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Ionicons name="save-outline" size={20} color="#FFF" />
                    )}
                    <Text style={styles.primaryButtonText}>
                      {saving ? "Saving..." : "Save"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => {
                      setEditingService(null);
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        );
      })}

      {/* Help Section */}
      <View style={styles.helpCard}>
        <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.helpTitle}>Tip for testing</Text>
        <Text style={styles.helpText}>
          <Text style={{ fontWeight: '600' }}>For Profile Scanning:</Text>{'\n'}
          Start with IPQS (Phone), Google Safe Browsing (Links) and Abstract Email. Those three unlock most "real-time" checks.
          {'\n\n'}
          <Text style={{ fontWeight: '600' }}>For Chargeback Shield:</Text>{'\n'}
          Add Abstract Email, Twilio (SMS), IP Geolocation, and Stripe to enable full fraud detection. Optionally add PDFMonkey for evidence generation.
        </Text>
        <Text style={styles.helpNote}>
          🔒 Keys are stored server-side (Convex) and never shown back in full.
        </Text>
      </View>
    </ScrollView>
  );
}

function getStatusColor(status?: string): string {
  switch (status) {
    case "valid":
      return theme.colors.success;
    case "invalid":
    case "expired":
      return theme.colors.error;
    case "untested":
    default:
      return theme.colors.textSecondary;
  }
}

function getStatusText(status?: string): string {
  switch (status) {
    case "valid":
      return "✓ Active";
    case "invalid":
      return "✗ Invalid";
    case "expired":
      return "⚠ Expired";
    case "untested":
    default:
      return "⋯ Untested";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  serviceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  serviceInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  serviceName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  serviceDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
  },
  pricingRow: {
    flexDirection: "row",
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  pricingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    flex: 1,
  },
  pricingText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  keyDisplay: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  keyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  keyValue: {
    fontFamily: "monospace",
    fontSize: 14,
    color: theme.colors.text,
  },
  keyInput: {
    marginBottom: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  fieldGroup: {
    marginBottom: theme.spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  fieldHelper: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: theme.spacing.xs,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  dangerButton: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  helpCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    ...theme.shadows.sm,
  },
  helpTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  helpText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  helpNote: {
    fontSize: 12,
    color: theme.colors.success,
    fontStyle: "italic",
  },
});