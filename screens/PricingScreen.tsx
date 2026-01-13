import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { StatusBar } from "react-native";
import { colors, spacing, borderRadius, typography, shadows } from "../lib/theme";

type AccountType = "personal" | "business" | "charity" | "community";

interface PricingScreenProps {
  onBack: () => void;
  onNavigateAccountType: () => void;
}

export default function PricingScreen({ onBack, onNavigateAccountType }: PricingScreenProps) {
  const user = useQuery(api.users.getCurrentUser);
  const accountType = (user?.accountType || "personal") as AccountType;
  const [isAnnual, setIsAnnual] = useState(false);

  const pricingPlans = {
    personal: {
      free: {
        name: "Free",
        price: { monthly: 0, annual: 0 },
        features: [
          "All 9 Basic Scanners",
          "Profile Scanner (Social Media)",
          "Link Verification",
          "Email Scanner",
          "Phone Number Lookup",
          "SMS Scanner",
          "Document Scanner",
          "Image Scanner (Reverse Search)",
          "Message Scanner",
          "Contacts Scanner",
        ],
        limitations: ["Limited to 10 scans/day", "No advanced protection features"],
      },
      premium: {
        name: "Premium",
        price: { monthly: 9.99, annual: 99.99 },
        popular: true,
        features: [
          "Everything in Free (Unlimited)",
          "💰 Investment Scam Detector",
          "💔 Romance Scam Protection",
          "🏠 Rental Safety Scanner",
          "🛒 Marketplace Safety Tools",
          "🔨 Contractor Vetting",
          "Priority Support",
        ],
      },
      family: {
        name: "Family Protection",
        price: { monthly: 19.99, annual: 199.99 },
        features: [
          "Everything in Premium",
          "👨‍👩‍👧‍👦 Family Protection Mode (5 members)",
          "☎️ Call Screening & Recording",
          "🎙️ Deepfake Detection",
          "🚨 Real-time Scam Alerts",
          "Elder Protection Monitoring",
          "Family Activity Reports",
        ],
      },
    },
    business: {
      starter: {
        name: "Starter",
        price: { monthly: 99, annual: 990 },
        features: [
          "5 user seats included",
          "All basic scanners (unlimited)",
          "Choose 1 add-on feature FREE:",
          "  • Chargeback Shield ($49/mo value)",
          "  • BEC Protection ($29/mo value)",
          "  • Customer Screening ($39/mo value)",
          "Additional users: $10/user/month",
          "Email support",
        ],
      },
      professional: {
        name: "Professional",
        price: { monthly: 249, annual: 2490 },
        popular: true,
        features: [
          "15 user seats included",
          "All basic scanners (unlimited)",
          "Choose 3 add-on features FREE:",
          "  • Chargeback Shield ($49/mo)",
          "  • BEC Protection ($29/mo)",
          "  • Customer Screening ($39/mo)",
          "  • Tenant Screening ($39/mo)",
          "  • Candidate Verification ($39/mo)",
          "  • Analytics Dashboard ($29/mo)",
          "Additional users: $10/user/month",
          "Priority support",
        ],
      },
      enterprise: {
        name: "Enterprise",
        price: { monthly: 499, annual: 4990 },
        features: [
          "Unlimited user seats",
          "All features included:",
          "  • Chargeback Shield",
          "  • BEC Protection",
          "  • Customer Screening",
          "  • Tenant Screening",
          "  • Candidate Verification",
          "  • Analytics Dashboard",
          "  • API Access ($99/mo value)",
          "Dedicated account manager",
          "Custom training & onboarding",
          "24/7 priority support",
          "SLA guarantee",
        ],
      },
    },
    charity: {
      nonprofit: {
        name: "Nonprofit Plan",
        price: { monthly: 0, annual: 0 },
        popular: true,
        badge: "AFFORDABLE",
        customPricing: true,
        priceDescription: "$1 per user/month",
        minPrice: "$10/month minimum (10 users)",
        features: [
          "All charity features included:",
          "👨‍👩‍👧‍👦 Elderly Protection Suite",
          "✅ Volunteer Screening (Unlimited)",
          "💰 Donor Verification",
          "📊 Impact Reports",
          "📈 Bulk Screening (500+ profiles)",
          "👥 Family Protection Mode",
          "☎️ Call Screening Tools",
          "All basic scanners",
          "Priority support",
          "Proof of nonprofit status required",
        ],
      },
    },
    community: {
      group: {
        name: "Community Group",
        price: { monthly: 0, annual: 0 },
        popular: true,
        customPricing: true,
        priceDescription: "$1 per member/month",
        minPrice: "$19/month minimum (19 members)",
        features: [
          "All community features included:",
          "🚨 Community Alert System",
          "🛒 Marketplace Safety Tools",
          "🔨 Contractor Vetting Database",
          "📊 Shared Scam Reports",
          "🗺️ Neighborhood Scam Heat Map",
          "👥 Member Management",
          "All basic scanners",
          "Group admin dashboard",
          "Email support",
        ],
      },
    },
  };

  const businessAddOns = [
    { name: "Chargeback Shield", price: 49, description: "Prevent e-commerce fraud", roi: "Saves $5K+/month on average" },
    { name: "BEC Protection", price: 29, description: "Stop wire transfer fraud", roi: "One prevented fraud = 10x ROI" },
    { name: "Customer Screening", price: 39, description: "Vet customers before transactions", roi: "Reduce fraud by 85%" },
    { name: "Tenant Screening", price: 39, description: "Screen renters before lease", roi: "Prevent bad tenants" },
    { name: "Candidate Verification", price: 39, description: "Verify job applicants", roi: "Avoid fraudulent hires" },
    { name: "Analytics Dashboard", price: 29, description: "Real-time fraud insights", roi: "Data-driven decisions" },
    { name: "API Access", price: 99, description: "Integrate with your systems", roi: "Automate protection" },
  ];

  const currentPlans = pricingPlans[accountType];

  const PricingCard = ({
    plan,
    name,
  }: {
    plan: any;
    name: string;
  }) => {
    let price = isAnnual ? plan.price.annual : plan.price.monthly;
    let monthlyPrice = isAnnual && price > 0 ? (plan.price.annual / 12).toFixed(2) : price;

    // Handle custom pricing
    if (plan.customPricing) {
      return (
        <View
          style={[
            styles.pricingCard,
            plan.popular && styles.popularCard,
          ]}
        >
          {plan.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>MOST AFFORDABLE</Text>
            </View>
          )}
          {plan.badge && (
            <View style={[styles.popularBadge, styles.discountBadge]}>
              <Text style={styles.popularText}>{plan.badge}</Text>
            </View>
          )}

          <View style={styles.cardHeader}>
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.customPriceContainer}>
              <Text style={styles.customPriceText}>{plan.priceDescription}</Text>
              <Text style={styles.customMinPrice}>{plan.minPrice}</Text>
            </View>
          </View>

          <View style={styles.featuresContainer}>
            {plan.features.map((feature: string, index: number) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.success}
                  style={styles.checkIcon}
                />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.selectButton,
              plan.popular && styles.popularButton,
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                plan.popular && styles.popularButtonText,
              ]}
            >
              Get Started
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.pricingCard,
          plan.popular && styles.popularCard,
        ]}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>$</Text>
            <Text style={styles.price}>
              {price === 0 ? "0" : monthlyPrice}
            </Text>
            <Text style={styles.period}>/mo</Text>
          </View>
          {isAnnual && price > 0 && (
            <Text style={styles.annualNote}>
              Billed ${plan.price.annual}/year (Save 17%)
            </Text>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature: string, index: number) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.success}
                style={styles.checkIcon}
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}

          {plan.limitations &&
            plan.limitations.map((limitation: string, index: number) => (
              <View key={`limit-${index}`} style={styles.featureRow}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.error}
                  style={styles.checkIcon}
                />
                <Text style={[styles.featureText, styles.limitationText]}>
                  {limitation}
                </Text>
              </View>
            ))}
        </View>

        <TouchableOpacity
          style={[
            styles.selectButton,
            plan.popular && styles.popularButton,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              plan.popular && styles.popularButtonText,
            ]}
          >
            {price === 0 ? "Current Plan" : "Select Plan"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const accountTypeInfo = {
    personal: {
      emoji: "👤",
      title: "Personal Plans",
      subtitle: "Basic scanners free forever. Upgrade for advanced protection.",
    },
    business: {
      emoji: "🏢",
      title: "Business Plans",
      subtitle: "Modular pricing. Pay only for features you need.",
    },
    charity: {
      emoji: "🏥",
      title: "Nonprofit Pricing",
      subtitle: "Affordable per-user pricing for registered nonprofits",
    },
    community: {
      emoji: "👥",
      title: "Community Pricing",
      subtitle: "Simple per-member pricing for neighborhood groups",
    },
  };

  const info = accountTypeInfo[accountType];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>{info.emoji}</Text>
          <Text style={styles.headerTitle}>{info.title}</Text>
          <Text style={styles.headerSubtitle}>{info.subtitle}</Text>
        </View>
      </View>

      {/* Annual/Monthly Toggle */}
      {accountType !== "charity" && accountType !== "community" && (
        <View style={styles.toggleContainer}>
          <Text
            style={[
              styles.toggleLabel,
              !isAnnual && styles.toggleLabelActive,
            ]}
          >
            Monthly
          </Text>
          <Switch
            value={isAnnual}
            onValueChange={setIsAnnual}
            trackColor={{ false: colors.border, true: colors.success }}
            thumbColor={colors.surface}
          />
          <Text
            style={[
              styles.toggleLabel,
              isAnnual && styles.toggleLabelActive,
            ]}
          >
            Annual
          </Text>
          {isAnnual && (
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>Save 17%</Text>
            </View>
          )}
        </View>
      )}

      {/* Pricing Cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(currentPlans).map(([key, plan]) => (
          <PricingCard key={key} plan={plan} name={key} />
        ))}

        {/* Business Add-Ons */}
        {accountType === "business" && (
          <View style={styles.addOnsContainer}>
            <Text style={styles.addOnsTitle}>📦 À La Carte Add-Ons</Text>
            <Text style={styles.addOnsSubtitle}>
              Add individual features to any plan
            </Text>
            {businessAddOns.map((addon, index) => (
              <View key={index} style={styles.addonCard}>
                <View style={styles.addonHeader}>
                  <Text style={styles.addonName}>{addon.name}</Text>
                  <Text style={styles.addonPrice}>+${addon.price}/mo</Text>
                </View>
                <Text style={styles.addonDescription}>{addon.description}</Text>
                <Text style={styles.addonRoi}>💡 {addon.roi}</Text>
              </View>
            ))}
            <Text style={styles.addOnsFooter}>
              💰 Additional users: $10/user/month
            </Text>
          </View>
        )}

        {/* Value Proposition */}
        {accountType === "personal" && (
          <View style={styles.valueContainer}>
            <Text style={styles.valueTitle}>🛡️ Why Upgrade?</Text>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Investment Scams</Text>
              <Text style={styles.valueText}>Australians lost $945M in 2023</Text>
            </View>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Romance Scams</Text>
              <Text style={styles.valueText}>Average victim loses $50K+</Text>
            </View>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Your Protection</Text>
              <Text style={styles.valueText}>$9.99/month could save you $50,000+</Text>
            </View>
          </View>
        )}

        {/* Change Account Type */}
        <View style={styles.changeTypeContainer}>
          <Text style={styles.changeTypeText}>
            Not {accountType}? Change your account type
          </Text>
          <TouchableOpacity
            style={styles.changeTypeButton}
            onPress={onNavigateAccountType}
          >
            <Text style={styles.changeTypeButtonText}>
              Change Account Type
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.faqContainer}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I change plans later?</Text>
            <Text style={styles.faqAnswer}>
              Yes! Upgrade or downgrade anytime. Changes take effect immediately.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Do you offer refunds?</Text>
            <Text style={styles.faqAnswer}>
              Yes, 30-day money-back guarantee on all paid plans.
            </Text>
          </View>

          {accountType === "business" && (
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>How do add-ons work?</Text>
              <Text style={styles.faqAnswer}>
                Add individual features to any plan. Cancel anytime. No long-term contracts.
              </Text>
            </View>
          )}

          {(accountType === "charity" || accountType === "community") && (
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>How is billing calculated?</Text>
              <Text style={styles.faqAnswer}>
                $1 per user/member per month. Billed monthly based on your total user count.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryDark,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerContent: {
    alignItems: "center",
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h1,
    fontSize: 26,
    color: colors.textOnPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.primarySurface,
    textAlign: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  toggleLabelActive: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  saveBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.md,
  },
  saveText: {
    ...typography.label,
    color: colors.textOnPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  pricingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  popularCard: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primarySurface,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    left: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  discountBadge: {
    backgroundColor: colors.success,
  },
  popularText: {
    ...typography.label,
    color: colors.textOnPrimary,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  planName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  currency: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: 10,
  },
  price: {
    fontSize: 52,
    fontWeight: "800",
    color: colors.textPrimary,
    lineHeight: 56,
  },
  period: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 12,
  },
  annualNote: {
    ...typography.caption,
    color: colors.success,
    marginTop: spacing.xs,
    fontWeight: "600",
  },
  customPriceContainer: {
    alignItems: "center",
  },
  customPriceText: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  customMinPrice: {
    ...typography.body,
    color: colors.textSecondary,
  },
  featuresContainer: {
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  checkIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  featureText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 24,
  },
  limitationText: {
    color: colors.textMuted,
  },
  selectButton: {
    backgroundColor: colors.surfaceVariant,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  popularButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    ...typography.button,
    color: colors.textPrimary,
  },
  popularButtonText: {
    color: colors.textOnPrimary,
  },
  addOnsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addOnsTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  addOnsSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  addonCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  addonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  addonName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  addonPrice: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  addonDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  addonRoi: {
    ...typography.caption,
    color: colors.success,
    fontWeight: "600",
  },
  addOnsFooter: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.md,
    fontWeight: "600",
  },
  valueContainer: {
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  valueTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  valueItem: {
    marginBottom: spacing.sm,
  },
  valueLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  valueText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  changeTypeContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeTypeText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  changeTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySurface,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  changeTypeButtonText: {
    ...typography.bodyBold,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  faqContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  faqItem: {
    marginBottom: spacing.md,
  },
  faqQuestion: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  faqAnswer: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});