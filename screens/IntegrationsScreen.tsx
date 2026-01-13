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
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function IntegrationsScreen() {
  const [stripeKey, setStripeKey] = useState("");
  const [shopifyShop, setShopifyShop] = useState("");
  const [loading, setLoading] = useState<"stripe" | "shopify" | null>(null);

  // In production, query existing integrations
  // const integrations = useQuery(api.integrations.getUserIntegrations);

  const handleConnectStripe = async () => {
    if (!stripeKey.trim()) {
      Alert.alert("Required", "Please enter your Stripe API key");
      return;
    }

    setLoading("stripe");
    try {
      // In production: call Convex mutation to store integration
      // await connectStripe({ apiKey: stripeKey });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert("Success", "Stripe connected successfully!");
      setStripeKey("");
    } catch (error) {
      Alert.alert("Error", "Failed to connect Stripe");
    } finally {
      setLoading(null);
    }
  };

  const handleConnectShopify = async () => {
    if (!shopifyShop.trim()) {
      Alert.alert("Required", "Please enter your Shopify shop name");
      return;
    }

    setLoading("shopify");
    try {
      // In production: redirect to Shopify OAuth
      // const authUrl = await getShopifyAuthUrl({ shop: shopifyShop });
      // Linking.openURL(authUrl);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert("Success", "Shopify connected successfully!");
      setShopifyShop("");
    } catch (error) {
      Alert.alert("Error", "Failed to connect Shopify");
    } finally {
      setLoading(null);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Integrations</Text>
        <Text style={styles.subtitle}>
          Connect your platforms to automatically analyze orders and prevent chargebacks
        </Text>
      </View>

      {/* Benefits */}
      <View style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>🚀 Why Connect?</Text>
        <BenefitItem text="Auto-analyze every order" />
        <BenefitItem text="Block high-risk orders before shipping" />
        <BenefitItem text="Sync chargeback data automatically" />
        <BenefitItem text="Save hours of manual review" />
      </View>

      {/* Stripe Integration */}
      <View style={styles.integrationCard}>
        <View style={styles.integrationHeader}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationName}>Stripe</Text>
            <Text style={styles.integrationDesc}>Payment processing</Text>
          </View>
          <View style={[styles.badge, styles.badgeDisconnected]}>
            <Text style={styles.badgeText}>Not Connected</Text>
          </View>
        </View>

        <View style={styles.integrationBody}>
          <Text style={styles.label}>Stripe Secret Key</Text>
          <TextInput
            style={styles.input}
            placeholder="sk_live_..."
            value={stripeKey}
            onChangeText={setStripeKey}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Text style={styles.helpText}>
            Find your API key in Stripe Dashboard → Developers → API keys
          </Text>

          <TouchableOpacity
            style={[
              styles.connectButton,
              loading === "stripe" && styles.connectButtonDisabled,
            ]}
            onPress={handleConnectStripe}
            disabled={loading === "stripe"}
          >
            {loading === "stripe" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.connectButtonText}>Connect Stripe</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Settings (shown when connected) */}
        {false && (
          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Settings</Text>
            <SettingToggle
              label="Auto-analyze orders"
              description="Scan every new order automatically"
              value={true}
              onValueChange={() => {}}
            />
            <SettingToggle
              label="Auto-block high-risk orders"
              description="Prevent fulfillment for critical risk orders"
              value={false}
              onValueChange={() => {}}
            />
            <SettingToggle
              label="Sync chargebacks"
              description="Import chargeback data from Stripe"
              value={true}
              onValueChange={() => {}}
            />
          </View>
        )}
      </View>

      {/* Shopify Integration */}
      <View style={styles.integrationCard}>
        <View style={styles.integrationHeader}>
          <View style={[styles.logoContainer, { backgroundColor: "#95bf47" }]}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationName}>Shopify</Text>
            <Text style={styles.integrationDesc}>Ecommerce platform</Text>
          </View>
          <View style={[styles.badge, styles.badgeDisconnected]}>
            <Text style={styles.badgeText}>Not Connected</Text>
          </View>
        </View>

        <View style={styles.integrationBody}>
          <Text style={styles.label}>Shopify Store Name</Text>
          <TextInput
            style={styles.input}
            placeholder="yourstore.myshopify.com"
            value={shopifyShop}
            onChangeText={setShopifyShop}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Text style={styles.helpText}>
            You'll be redirected to Shopify to authorize the connection
          </Text>

          <TouchableOpacity
            style={[
              styles.connectButton,
              loading === "shopify" && styles.connectButtonDisabled,
            ]}
            onPress={handleConnectShopify}
            disabled={loading === "shopify"}
          >
            {loading === "shopify" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.connectButtonText}>Connect Shopify</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* PayPal Integration */}
      <View style={styles.integrationCard}>
        <View style={styles.integrationHeader}>
          <View style={[styles.logoContainer, { backgroundColor: "#0070ba" }]}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationName}>PayPal</Text>
            <Text style={styles.integrationDesc}>Payment processing</Text>
          </View>
          <View style={[styles.badge, styles.badgeComingSoon]}>
            <Text style={[styles.badgeText, { color: "#6b7280" }]}>Coming Soon</Text>
          </View>
        </View>
      </View>

      {/* More Integrations Coming Soon */}
      <View style={styles.comingSoonSection}>
        <Text style={styles.comingSoonTitle}>More Integrations Coming Soon</Text>
        <View style={styles.comingSoonGrid}>
          <ComingSoonItem name="WooCommerce" />
          <ComingSoonItem name="BigCommerce" />
          <ComingSoonItem name="Square" />
          <ComingSoonItem name="Authorize.net" />
        </View>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <View style={styles.benefitItem}>
      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

function SettingToggle({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingToggle}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function ComingSoonItem({ name }: { name: string }) {
  return (
    <View style={styles.comingSoonItem}>
      <Text style={styles.comingSoonItemText}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  benefitsCard: {
    backgroundColor: "#ecfdf5",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: "#065f46",
    marginLeft: 8,
  },
  integrationCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  integrationHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#635bff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  integrationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  integrationDesc: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDisconnected: {
    backgroundColor: "#fee2e2",
  },
  badgeConnected: {
    backgroundColor: "#d1fae5",
  },
  badgeComingSoon: {
    backgroundColor: "#f3f4f6",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#dc2626",
  },
  integrationBody: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    marginBottom: 6,
  },
  helpText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  settingsSection: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    padding: 16,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  settingToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  settingDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  comingSoonSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
  },
  comingSoonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  comingSoonItem: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  comingSoonItemText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
  },
  spacer: {
    height: 40,
  },
});