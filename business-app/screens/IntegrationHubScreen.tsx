import React, { useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BusinessUser, Integration } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Business color theme
const COLORS = {
  primary: "#2563EB",
  accent: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  surface: "#FFFFFF",
  background: "#F8FAFC",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  shopify: "#96BF48",
  stripe: "#635BFF",
  paypal: "#003087",
  woocommerce: "#96588A",
  square: "#3E4348",
};

interface Props {
  viewer: BusinessUser;
  sessionToken: string;
  onNavigate?: (screen: string) => void;
}

// Integration platforms
const PLATFORMS = [
  {
    id: "shopify",
    name: "Shopify",
    description: "Sync orders and customers from your Shopify store",
    icon: "cart",
    color: COLORS.shopify,
    features: ["Order sync", "Customer import", "Webhook alerts", "Risk scoring"],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Connect your Stripe account for payment data",
    icon: "card",
    color: COLORS.stripe,
    features: ["Payment data", "Dispute alerts", "Refund tracking", "Fraud signals"],
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Link PayPal for comprehensive payment coverage",
    icon: "logo-paypal",
    color: COLORS.paypal,
    features: ["Transaction data", "Buyer protection", "Dispute management", "Risk API"],
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: "Connect your WordPress WooCommerce store",
    icon: "storefront",
    color: COLORS.woocommerce,
    features: ["Order sync", "Customer data", "Product info", "Inventory"],
  },
  {
    id: "square",
    name: "Square",
    description: "Integrate with Square POS and online store",
    icon: "square",
    color: COLORS.square,
    features: ["POS data", "Online orders", "Payment tracking", "Customer profiles"],
  },
  {
    id: "bigcommerce",
    name: "BigCommerce",
    description: "Connect your BigCommerce store for order sync",
    icon: "cart-outline",
    color: "#1F69FF",
    features: ["Order sync", "Multi-store support", "Product catalog", "Customer data"],
  },
  {
    id: "magento",
    name: "Magento",
    description: "Integrate with Magento/Adobe Commerce platform",
    icon: "cube",
    color: "#EE672F",
    features: ["Order sync", "Multi-channel", "Customer profiles", "Inventory tracking"],
  },
];

// Credit Bureau & Identity Verification platforms
const CREDIT_BUREAU_PLATFORMS = [
  {
    id: "equifax",
    name: "Equifax",
    description: "Credit reports, identity verification, synthetic fraud detection",
    icon: "shield-checkmark",
    color: "#EF4444",
    features: ["Soft credit inquiries", "Identity verification", "Synthetic fraud detection", "Payment history analysis"],
    cost: "$1.00 per check",
  },
  {
    id: "experian",
    name: "Experian",
    description: "Credit scoring, fraud prevention, and identity verification",
    icon: "shield-checkmark",
    color: "#8B5CF6",
    features: ["FICO scores", "Credit utilization", "Derogatory marks check", "Address history"],
    cost: "$1.00 per check",
  },
  {
    id: "transunion",
    name: "TransUnion",
    description: "Credit monitoring and risk assessment services",
    icon: "shield-checkmark",
    color: "#3B82F6",
    features: ["Credit monitoring", "Velocity checks", "Phone/address verification", "Account history"],
    cost: "$1.00 per check",
  },
];

// Mock connected integrations
const MOCK_INTEGRATIONS: Integration[] = [
  {
    _id: "int1",
    platform: "shopify",
    status: "connected",
    accountId: "store_abc123",
    accountName: "My Awesome Store",
    connectedAt: Date.now() - 86400000 * 30,
    lastSync: Date.now() - 300000,
    ordersImported: 4823,
    webhookActive: true,
    permissions: ["read_orders", "read_customers", "write_orders"],
  },
  {
    _id: "int2",
    platform: "stripe",
    status: "connected",
    accountId: "acct_1234567890",
    accountName: "Stripe Business",
    connectedAt: Date.now() - 86400000 * 45,
    lastSync: Date.now() - 60000,
    ordersImported: 8923,
    webhookActive: true,
    permissions: ["read_payments", "read_disputes", "write_refunds"],
  },
  {
    _id: "int3",
    platform: "paypal",
    status: "error",
    accountId: "merchant_xyz",
    accountName: "PayPal Merchant",
    connectedAt: Date.now() - 86400000 * 60,
    lastSync: Date.now() - 86400000 * 2,
    ordersImported: 1245,
    webhookActive: false,
    permissions: ["read_transactions"],
    errorMessage: "API credentials expired. Please reconnect.",
  },
];

// Memoized Platform Card Component
const PlatformCard = memo(({ platform, isConnected, onConnect }: { 
  platform: any; 
  isConnected?: boolean; 
  onConnect: (platformId: string) => void;
}) => (
  <View key={platform.id} style={styles.availableCard}>
    <View style={styles.availableHeader}>
      <View style={[styles.platformIcon, { backgroundColor: platform.color + "15" }]}>
        <Ionicons name={platform.icon as any} size={24} color={platform.color} />
      </View>
      <View style={styles.availableInfo}>
        <Text style={styles.availableName}>{platform.name}</Text>
        <Text style={styles.availableDescription}>{platform.description}</Text>
      </View>
    </View>
    <View style={styles.featuresRow}>
      {platform.features.slice(0, 3).map((feature, idx) => (
        <View key={idx} style={styles.featureBadge}>
          <Text style={styles.featureText}>{feature}</Text>
        </View>
      ))}
    </View>
    <TouchableOpacity 
      style={[styles.connectButton, { backgroundColor: platform.color }]}
      onPress={() => onConnect(platform.id)}
    >
      <Ionicons name="add-circle" size={18} color="#FFFFFF" />
      <Text style={styles.connectButtonText}>Connect {platform.name}</Text>
    </TouchableOpacity>
  </View>
));

// Memoized Connected Integration Card
const ConnectedCard = memo(({ integration, platform, onSyncPress, onSettingsPress, onReconnectPress }: any) => (
  <View style={styles.integrationCard}>
    <View style={styles.integrationHeader}>
      <View style={[styles.platformIcon, { backgroundColor: platform.color + "15" }]}>
        <Ionicons name={platform.icon as any} size={24} color={platform.color} />
      </View>
      <View style={styles.integrationInfo}>
        <Text style={styles.integrationName}>{platform.name}</Text>
        <Text style={styles.integrationAccount}>{integration.accountName}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(integration.status) + "15" }]}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(integration.status) }]} />
        <Text style={[styles.statusText, { color: getStatusColor(integration.status) }]}>
          {integration.status === "connected" ? "Active" : 
           integration.status === "error" ? "Error" : "Pending"}
        </Text>
      </View>
    </View>

    {integration.status === "error" && integration.errorMessage && (
      <View style={styles.errorBanner}>
        <Ionicons name="warning" size={16} color={COLORS.danger} />
        <Text style={styles.errorText}>{integration.errorMessage}</Text>
      </View>
    )}

    <View style={styles.integrationStats}>
      <View style={styles.integrationStat}>
        <Ionicons name="document" size={14} color={COLORS.textSecondary} />
        <Text style={styles.integrationStatText}>
          {integration.ordersImported.toLocaleString()} orders
        </Text>
      </View>
      <View style={styles.integrationStat}>
        <Ionicons name="time" size={14} color={COLORS.textSecondary} />
        <Text style={styles.integrationStatText}>
          Synced {formatTime(integration.lastSync || 0)}
        </Text>
      </View>
      <View style={styles.integrationStat}>
        <Ionicons 
          name={integration.webhookActive ? "radio" : "radio-outline"} 
          size={14} 
          color={integration.webhookActive ? COLORS.accent : COLORS.textSecondary} 
        />
        <Text style={[
          styles.integrationStatText,
          integration.webhookActive && { color: COLORS.accent }
        ]}>
          Webhooks {integration.webhookActive ? "Active" : "Inactive"}
        </Text>
      </View>
    </View>

    <View style={styles.actionRow}>
      <TouchableOpacity style={styles.syncButton} onPress={() => onSyncPress(integration)}>
        <Ionicons name="sync" size={16} color={COLORS.primary} />
        <Text style={styles.syncButtonText}>Sync Now</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.settingsButton} onPress={() => onSettingsPress(integration)}>
        <Ionicons name="settings-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.settingsButtonText}>Settings</Text>
      </TouchableOpacity>
      {integration.status === "error" && (
        <TouchableOpacity style={styles.reconnectButton} onPress={() => onReconnectPress(integration)}>
          <Ionicons name="refresh" size={16} color={COLORS.danger} />
          <Text style={styles.reconnectButtonText}>Reconnect</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
));

export default function IntegrationHubScreen({ viewer, sessionToken, onNavigate }: Props) {
  const [integrations] = useState<Integration[]>(MOCK_INTEGRATIONS);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Memoized available platforms (filter out connected ones)
  const availablePlatforms = useMemo(() => {
    return PLATFORMS.filter(p => !integrations.some(i => i.platform === p.id));
  }, [integrations]);

  // Memoized connected integrations  
  const connectedIntegrations = useMemo(() => {
    return integrations.filter(i => i.status === "connected" || i.status === "error" || i.status === "pending");
  }, [integrations]);

  // Memoized stats calculations
  const stats = useMemo(() => ({
    connectedCount: integrations.filter(i => i.status === "connected").length,
    totalOrders: integrations.reduce((sum, i) => sum + (i.ordersImported || 0), 0),
    errorCount: integrations.filter(i => i.status === "error").length,
  }), [integrations]);

  // Helper function - extract outside useMemo for reusability
  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return COLORS.accent;
      case "error": return COLORS.danger;
      case "pending": return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  // Callback handlers - memoized to prevent unnecessary re-renders
  const handleConnect = useCallback((platformId: string) => {
    setSelectedPlatform(platformId);
    setShowConnectModal(true);
  }, []);

  const handleConfirmConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsConnecting(false);
      setShowConnectModal(false);
      setApiKey("");
      setSelectedPlatform(null);
    } catch (error) {
      setIsConnecting(false);
    }
  }, []);

  const handleSync = useCallback((integration: Integration) => {
    // Trigger sync for this integration
  }, []);

  const handleSettings = useCallback((integration: Integration) => {
    // Open settings modal
  }, []);

  const handleReconnect = useCallback((integration: Integration) => {
    handleConnect(integration.platform);
  }, [handleConnect]);

  const getPlatformInfo = useCallback((platformId: string) => {
    return PLATFORMS.find(p => p.id === platformId);
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.accent} />
          <Text style={styles.statValue}>{stats.connectedCount}</Text>
          <Text style={styles.statLabel}>Connected</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="sync" size={24} color={COLORS.primary} />
          <Text style={styles.statValue}>{(stats.totalOrders / 1000).toFixed(1)}K</Text>
          <Text style={styles.statLabel}>Orders Synced</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="alert-circle" size={24} color={COLORS.danger} />
          <Text style={styles.statValue}>{stats.errorCount}</Text>
          <Text style={styles.statLabel}>Needs Attention</Text>
        </View>
      </View>

      {/* Connected Integrations Section */}
      {connectedIntegrations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Platforms</Text>
          {connectedIntegrations.map((integration) => {
            const platform = getPlatformInfo(integration.platform);
            return platform ? (
              <ConnectedCard
                key={integration._id}
                integration={integration}
                platform={platform}
                onSyncPress={handleSync}
                onSettingsPress={handleSettings}
                onReconnectPress={handleReconnect}
              />
            ) : null;
          })}
        </View>
      )}

      {/* Available Integrations Section */}
      {availablePlatforms.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Integrations</Text>
          {availablePlatforms.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              onConnect={handleConnect}
            />
          ))}
        </View>
      )}

      {/* Credit Bureau & Identity Verification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credit Bureau & Identity Verification</Text>
        <Text style={styles.sectionSubtitle}>
          Soft credit inquiries for enhanced fraud detection. No impact on customer credit scores.
        </Text>
        
        {CREDIT_BUREAU_PLATFORMS.map((bureau) => (
          <View key={bureau.id} style={styles.availableCard}>
            <View style={styles.availableHeader}>
              <View style={[styles.platformIcon, { backgroundColor: bureau.color + "15" }]}>
                <Ionicons name={bureau.icon as any} size={24} color={bureau.color} />
              </View>
              <View style={styles.availableInfo}>
                <Text style={styles.availableName}>{bureau.name}</Text>
                <Text style={styles.availableDescription}>{bureau.description}</Text>
              </View>
            </View>
            <View style={styles.featuresRow}>
              {bureau.features.slice(0, 3).map((feature, idx) => (
                <View key={idx} style={styles.featureBadge}>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <View style={styles.costBadge}>
              <Ionicons name="pricetag" size={14} color={COLORS.warning} />
              <Text style={styles.costText}>{bureau.cost}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.connectButton, { backgroundColor: bureau.color }]}
              onPress={() => handleConnect(bureau.id)}
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.connectButtonText}>Connect {bureau.name}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* API Keys Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Access</Text>
        <View style={styles.apiCard}>
          <View style={styles.apiHeader}>
            <Ionicons name="key" size={24} color={COLORS.primary} />
            <View style={styles.apiInfo}>
              <Text style={styles.apiTitle}>Your API Key</Text>
              <Text style={styles.apiSubtitle}>Use this for custom integrations</Text>
            </View>
          </View>
          <View style={styles.apiKeyContainer}>
            <Text style={styles.apiKeyText}>cs_live_••••••••••••••••</Text>
            <TouchableOpacity style={styles.copyButton}>
              <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.apiStats}>
            <Text style={styles.apiStatText}>1,234 API calls this month</Text>
            <Text style={styles.apiStatText}>•</Text>
            <Text style={styles.apiStatText}>Rate limit: 1000/min</Text>
          </View>
          <TouchableOpacity style={styles.docsButton}>
            <Ionicons name="document-text" size={16} color={COLORS.primary} />
            <Text style={styles.docsButtonText}>View API Documentation</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Webhook Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Webhook Configuration</Text>
        <View style={styles.webhookCard}>
          <View style={styles.webhookHeader}>
            <Ionicons name="git-network" size={24} color={COLORS.accent} />
            <View style={styles.webhookInfo}>
              <Text style={styles.webhookTitle}>Webhook Endpoint</Text>
              <Text style={styles.webhookUrl}>https://api.chargebackshield.com/webhook/{viewer._id}</Text>
            </View>
          </View>
          <View style={styles.webhookEvents}>
            <Text style={styles.webhookEventsTitle}>Listening for:</Text>
            <View style={styles.eventTags}>
              <View style={styles.eventTag}><Text style={styles.eventTagText}>order.created</Text></View>
              <View style={styles.eventTag}><Text style={styles.eventTagText}>dispute.filed</Text></View>
              <View style={styles.eventTag}><Text style={styles.eventTagText}>refund.issued</Text></View>
              <View style={styles.eventTag}><Text style={styles.eventTagText}>+3 more</Text></View>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => onNavigate?.('webhook-dashboard')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="git-network" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionTitle}>Webhook Dashboard</Text>
            <Text style={styles.quickActionSubtitle}>Monitor & test webhooks</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => onNavigate?.('test-integration')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.accent + '15' }]}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.quickActionTitle}>Test Integration</Text>
            <Text style={styles.quickActionSubtitle}>Send test webhooks</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => onNavigate?.('api-docs')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name="document-text" size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.quickActionTitle}>API Documentation</Text>
            <Text style={styles.quickActionSubtitle}>View integration guides</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => onNavigate?.('support')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.danger + '15' }]}>
              <Ionicons name="help-circle" size={24} color={COLORS.danger} />
            </View>
            <Text style={styles.quickActionTitle}>Get Support</Text>
            <Text style={styles.quickActionSubtitle}>Contact support team</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 24 }} />

      {/* Connect Modal */}
      <Modal
        visible={showConnectModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowConnectModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowConnectModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Connect {selectedPlatform ? getPlatformInfo(selectedPlatform)?.name : ""}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedPlatform && getPlatformInfo(selectedPlatform) && (
              <>
                <View style={styles.modalPlatformHeader}>
                  <View style={[
                    styles.largePlatformIcon, 
                    { backgroundColor: getPlatformInfo(selectedPlatform)!.color + "15" }
                  ]}>
                    <Ionicons 
                      name={getPlatformInfo(selectedPlatform)!.icon as any} 
                      size={40} 
                      color={getPlatformInfo(selectedPlatform)!.color} 
                    />
                  </View>
                  <Text style={styles.modalPlatformName}>
                    {getPlatformInfo(selectedPlatform)!.name}
                  </Text>
                  <Text style={styles.modalPlatformDescription}>
                    {getPlatformInfo(selectedPlatform)!.description}
                  </Text>
                </View>

                <View style={styles.modalFeatures}>
                  <Text style={styles.modalFeaturesTitle}>Features included:</Text>
                  {getPlatformInfo(selectedPlatform)!.features.map((feature, idx) => (
                    <View key={idx} style={styles.modalFeatureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
                      <Text style={styles.modalFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.modalInputSection}>
                  <Text style={styles.modalInputLabel}>API Key / Store URL</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={`Enter your ${getPlatformInfo(selectedPlatform)!.name} API key...`}
                    value={apiKey}
                    onChangeText={setApiKey}
                    placeholderTextColor={COLORS.textSecondary}
                    autoCapitalize="none"
                    secureTextEntry
                  />
                  <Text style={styles.modalInputHint}>
                    You can find this in your {getPlatformInfo(selectedPlatform)!.name} dashboard under Settings → API
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.modalConnectButton,
                    { backgroundColor: getPlatformInfo(selectedPlatform)!.color },
                    !apiKey.trim() && styles.modalConnectButtonDisabled
                  ]}
                  onPress={handleConfirmConnect}
                  disabled={!apiKey.trim() || isConnecting}
                >
                  {isConnecting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="link" size={20} color="#FFFFFF" />
                      <Text style={styles.modalConnectButtonText}>
                        Connect {getPlatformInfo(selectedPlatform)!.name}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.modalSecurityNote}>
                  🔒 Your credentials are encrypted and securely stored. We never share your data.
                </Text>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Header Stats
  headerStats: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Section
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  // Integration Card
  integrationCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  integrationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  integrationAccount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.danger + "10",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.danger,
  },
  integrationStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  integrationStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  integrationStatText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  syncButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "500",
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  settingsButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  reconnectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.danger + "10",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  reconnectButtonText: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: "500",
  },
  // Available Card
  availableCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  availableHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  availableInfo: {
    flex: 1,
  },
  availableName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  availableDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  featuresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  featureBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featureText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  costBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: COLORS.warning + "10",
    gap: 6,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  costText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: "600",
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // API Card
  apiCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  apiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  apiInfo: {},
  apiTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  apiSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  apiKeyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  apiKeyText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "monospace",
    color: COLORS.textPrimary,
  },
  copyButton: {
    padding: 4,
  },
  apiStats: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  apiStatText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  docsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary + "10",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  docsButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "500",
  },
  // Webhook Card
  webhookCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  webhookHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 12,
  },
  webhookInfo: {
    flex: 1,
  },
  webhookTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  webhookUrl: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontFamily: "monospace",
  },
  webhookEvents: {},
  webhookEventsTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  eventTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  eventTag: {
    backgroundColor: COLORS.accent + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  eventTagText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: "500",
  },
  // Quick Actions
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    gap: 12,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalPlatformHeader: {
    alignItems: "center",
    marginBottom: 28,
  },
  largePlatformIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalPlatformName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  modalPlatformDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  modalFeatures: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  modalFeaturesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  modalFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  modalFeatureText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  modalInputSection: {
    marginBottom: 24,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  modalInputHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  modalConnectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
  },
  modalConnectButtonDisabled: {
    opacity: 0.5,
  },
  modalConnectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalSecurityNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});