import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

type BillingCycle = "monthly" | "annual";

interface PricingTier {
  id: string;
  name: string;
  price: number;
  annualPrice: number;
  scans: number;
  features: string[];
  popular?: boolean;
  color: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    annualPrice: 0,
    scans: 5,
    features: [
      "5 scans per month",
      "Basic trust score",
      "Scam phrase detection",
      "Community reports",
    ],
    color: theme.colors.secondary,
  },
  {
    id: "basic",
    name: "Basic",
    price: 9.99,
    annualPrice: 99,
    scans: 50,
    features: [
      "50 scans per month",
      "Full trust score analysis",
      "Email & SMS scanning",
      "Export to CSV",
      "Priority support",
    ],
    color: theme.colors.primary,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29.99,
    annualPrice: 299,
    scans: 300,
    popular: true,
    features: [
      "300 scans per month",
      "All Basic features",
      "Bulk CSV upload",
      "Document verification",
      "Image scanning",
      "API access",
      "White-label reports",
    ],
    color: theme.colors.success,
  },
  {
    id: "business",
    name: "Business",
    price: 99.99,
    annualPrice: 999,
    scans: 2000,
    features: [
      "2,000 scans per month",
      "All Pro features",
      "Team collaboration",
      "Advanced analytics",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    color: theme.colors.warning,
  },
];

export default function SubscriptionScreen({ onBack }: { onBack: () => void }) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  
  const subscription = useQuery(api.users.getSubscriptionStatus);
  const upgradeTier = useMutation(api.users.upgradeTier);
  
  const currentTier = subscription?.tier || "free";
  const loading = subscription === undefined;

  const handleUpgrade = async (tierId: string) => {
    if (tierId === "free") {
      Alert.alert("Already on Free Plan", "You're currently on the free plan.");
      return;
    }

    setSelectedTier(tierId);
    
    try {
      const result = await upgradeTier({
        tier: tierId,
        billingCycle,
      });
      
      Alert.alert(
        "Upgrade Successful! 🎉",
        result.message,
        [{ text: "Got it, mate!", onPress: onBack }]
      );
    } catch (error: any) {
      Alert.alert("Upgrade Failed", error.message || "Something went wrong. Please try again.");
      setSelectedTier(null);
    }
  };

  const getPrice = (tier: PricingTier) => {
    if (tier.id === "free") return "Free";
    
    const price = billingCycle === "annual" ? tier.annualPrice : tier.price;
    const period = billingCycle === "annual" ? "/year" : "/month";
    
    return `$${price}${period}`;
  };

  const getSavings = (tier: PricingTier) => {
    if (tier.id === "free" || billingCycle === "monthly") return null;
    
    const monthlyTotal = tier.price * 12;
    const savings = monthlyTotal - tier.annualPrice;
    const percentSaved = Math.round((savings / monthlyTotal) * 100);
    
    return `Save ${percentSaved}% ($${savings}/year)`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading pricing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Stop Wasting Money on Fakes 💸
          </Text>
          <Text style={styles.heroSubtitle}>
            Join 500+ Australian businesses protecting their reputation
          </Text>
        </View>

        {/* Current Plan Banner */}
        <View style={styles.currentPlanBanner}>
          <View style={styles.currentPlanContent}>
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
            <View style={styles.currentPlanText}>
              <Text style={styles.currentPlanLabel}>Current Plan</Text>
              <Text style={styles.currentPlanValue}>
                {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan
              </Text>
            </View>
          </View>
          {subscription && (
            <View style={styles.usageRow}>
              <Text style={styles.usageText}>
                {subscription.scansThisMonth} / {subscription.scanLimit} scans used
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min(subscription.percentUsed, 100)}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        {/* Billing Cycle Toggle */}
        <View style={styles.billingToggleContainer}>
          <TouchableOpacity
            style={[
              styles.billingOption,
              billingCycle === "monthly" && styles.billingOptionActive,
            ]}
            onPress={() => setBillingCycle("monthly")}
          >
            <Text
              style={[
                styles.billingOptionText,
                billingCycle === "monthly" && styles.billingOptionTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.billingOption,
              billingCycle === "annual" && styles.billingOptionActive,
            ]}
            onPress={() => setBillingCycle("annual")}
          >
            <Text
              style={[
                styles.billingOptionText,
                billingCycle === "annual" && styles.billingOptionTextActive,
              ]}
            >
              Annual
            </Text>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>Save 17%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Pricing Cards */}
        <View style={styles.pricingGrid}>
          {PRICING_TIERS.map((tier) => (
            <View
              key={tier.id}
              style={[
                styles.pricingCard,
                tier.popular && styles.pricingCardPopular,
                currentTier === tier.id && styles.pricingCardCurrent,
              ]}
            >
              {tier.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}
              
              {currentTier === tier.id && (
                <View style={[styles.popularBadge, { backgroundColor: theme.colors.success }]}>
                  <Text style={styles.popularBadgeText}>CURRENT PLAN</Text>
                </View>
              )}

              <View style={styles.pricingCardHeader}>
                <View style={[styles.tierIcon, { backgroundColor: tier.color + "20" }]}>
                  <Ionicons 
                    name={
                      tier.id === "free" ? "gift" :
                      tier.id === "basic" ? "rocket" :
                      tier.id === "pro" ? "flash" :
                      "business"
                    } 
                    size={32} 
                    color={tier.color} 
                  />
                </View>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={styles.tierPrice}>{getPrice(tier)}</Text>
                {getSavings(tier) && (
                  <Text style={styles.tierSavings}>{getSavings(tier)}</Text>
                )}
                <Text style={styles.tierScans}>{tier.scans} scans/month</Text>
              </View>

              <View style={styles.featureList}>
                {tier.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={tier.color}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.upgradeButton,
                  { backgroundColor: tier.color },
                  currentTier === tier.id && styles.upgradeButtonDisabled,
                  selectedTier === tier.id && styles.upgradeButtonLoading,
                ]}
                onPress={() => handleUpgrade(tier.id)}
                disabled={currentTier === tier.id || selectedTier !== null}
              >
                {selectedTier === tier.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.upgradeButtonText}>
                    {currentTier === tier.id
                      ? "Current Plan"
                      : tier.id === "free"
                      ? "Downgrade"
                      : "Upgrade Now"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Trust Signals */}
        <View style={styles.trustSignals}>
          <View style={styles.trustSignal}>
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.success} />
            <Text style={styles.trustSignalText}>14-day money-back guarantee</Text>
          </View>
          <View style={styles.trustSignal}>
            <Ionicons name="lock-closed" size={24} color={theme.colors.success} />
            <Text style={styles.trustSignalText}>Secure payment (Stripe)</Text>
          </View>
          <View style={styles.trustSignal}>
            <Ionicons name="flag" size={24} color={theme.colors.success} />
            <Text style={styles.trustSignalText}>Australian Privacy Principles</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  currentPlanBanner: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  currentPlanContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  currentPlanText: {
    marginLeft: 12,
  },
  currentPlanLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  currentPlanValue: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  usageRow: {
    marginTop: 8,
  },
  usageText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
  billingToggleContainer: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    position: "relative",
  },
  billingOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  billingOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  billingOptionTextActive: {
    color: "#fff",
  },
  savingsBadge: {
    position: "absolute",
    top: -8,
    right: 8,
    backgroundColor: theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savingsBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  pricingGrid: {
    paddingHorizontal: 24,
    gap: 16,
  },
  pricingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: theme.colors.border,
    position: "relative",
  },
  pricingCardPopular: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  pricingCardCurrent: {
    borderColor: theme.colors.success,
    borderWidth: 3,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    left: 24,
    right: 24,
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  pricingCardHeader: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  tierIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  tierName: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 8,
  },
  tierPrice: {
    fontSize: 36,
    fontWeight: "800",
    color: theme.colors.text,
  },
  tierSavings: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.success,
    marginTop: 4,
  },
  tierScans: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  featureList: {
    marginBottom: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
  },
  upgradeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  upgradeButtonDisabled: {
    opacity: 0.5,
  },
  upgradeButtonLoading: {
    opacity: 0.7,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  trustSignals: {
    marginTop: 32,
    marginHorizontal: 24,
    padding: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    gap: 16,
  },
  trustSignal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trustSignalText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
  },
});