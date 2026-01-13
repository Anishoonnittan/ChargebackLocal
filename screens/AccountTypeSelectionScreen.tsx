import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { colors, typography, spacing, borderRadius, shadows } from "../lib/theme";

type AccountType = "personal" | "business" | "charity" | "community";

interface AccountTypeOption {
  type: AccountType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  features: string[];
  pricing: string;
}

const accountTypeOptions: AccountTypeOption[] = [
  {
    type: "personal",
    icon: "person",
    label: "Personal",
    description: "Protect yourself & family",
    features: [
      "Investment scams",
      "Romance scams",
      "Call screening",
      "Family protection",
    ],
    pricing: "Free • $4.99/month premium",
  },
  {
    type: "business",
    icon: "briefcase",
    label: "Business",
    description: "Protect your company",
    features: [
      "Chargeback prevention",
      "Email verification",
      "Customer screening",
      "Bulk scanning",
    ],
    pricing: "From $49/month",
  },
  {
    type: "charity",
    icon: "heart",
    label: "Charity",
    description: "Protect vulnerable people",
    features: [
      "Elderly protection",
      "Volunteer screening",
      "Impact reports",
      "Donor verification",
    ],
    pricing: "$49/month (50% off)",
  },
  {
    type: "community",
    icon: "people",
    label: "Community",
    description: "Protect your neighborhood",
    features: [
      "Share scam alerts",
      "Marketplace safety",
      "Contractor vetting",
      "Scam heat map",
    ],
    pricing: "$19/month",
  },
];

interface AccountTypeSelectionScreenProps {
  sessionToken: string;
  onComplete: () => void;
}

export default function AccountTypeSelectionScreen({
  sessionToken,
  onComplete,
}: AccountTypeSelectionScreenProps) {
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateAccountTypeForSession = useMutation(api.users.updateAccountTypeForSession);

  const handleContinue = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    try {
      await updateAccountTypeForSession({ sessionToken, accountType: selectedType });
      onComplete();
    } catch (error: any) {
      console.error("Error updating account type:", error);
      Alert.alert(
        "Couldn't update account type",
        typeof error?.message === "string" ? error.message : "Please try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Ionicons name="shield-checkmark" size={40} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.title}>TrueProfile Pro</Text>
          <Text style={styles.subtitle}>Who are you protecting today?</Text>
          <Text style={styles.tagline}>
            Choose your account type to see relevant features
          </Text>
        </View>

        {/* Account Type Cards */}
        <View style={styles.options}>
          {accountTypeOptions.map((option) => {
            const isSelected = selectedType === option.type;
            return (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedType(option.type)}
                activeOpacity={0.7}
              >
                {/* Icon & Selection Indicator */}
                <View style={styles.optionHeader}>
                  <View
                    style={[
                      styles.optionIcon,
                      isSelected && styles.optionIconSelected,
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={28}
                      color={isSelected ? colors.textOnPrimary : colors.primary}
                    />
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.success}
                      style={styles.checkmark}
                    />
                  )}
                </View>

                {/* Label & Description */}
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>

                {/* Features */}
                <View style={styles.features}>
                  {option.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.success}
                        style={styles.featureIcon}
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Pricing */}
                <Text style={styles.pricing}>{option.pricing}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedType && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedType || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={colors.textOnPrimary}
              />
            </>
          )}
        </TouchableOpacity>

        {/* Can change later note */}
        <Text style={styles.note}>
          Don't worry, you can change this later in Settings
        </Text>
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  options: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconSelected: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    position: "absolute",
    right: 0,
    top: 0,
  },
  optionLabel: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  features: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureIcon: {
    marginRight: spacing.xs,
  },
  featureText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  pricing: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadows.md,
  },
  continueButtonDisabled: {
    backgroundColor: colors.surfaceVariant,
    opacity: 0.5,
  },
  continueButtonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
  },
});