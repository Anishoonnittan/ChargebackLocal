import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "../lib/theme";

type UserMode = "personal" | "business_b2c" | "b2b" | "charity" | "community";

interface OnboardingScreenProps {
  sector: UserMode;
  onComplete: (data: OnboardingData) => void;
  onSkip?: () => void;
}

export interface OnboardingData {
  businessName?: string;
  location: string;
  companySize?: "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";
  industry?: string;
  organizationName?: string;
  fullName?: string;
}

export default function OnboardingScreen({
  sector,
  onComplete,
  onSkip,
}: OnboardingScreenProps) {
  const [businessName, setBusinessName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [companySize, setCompanySize] = useState<string>("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);

  const isBusinessOrEnterprise = sector === "business_b2c" || sector === "b2b";
  const isCharity = sector === "charity";
  const isCommunity = sector === "community";
  const isPersonal = sector === "personal";

  const handleComplete = async () => {
    setLoading(true);

    const data: OnboardingData = {
      location,
      ...(isBusinessOrEnterprise && {
        businessName,
        companySize: companySize as OnboardingData["companySize"],
        industry,
      }),
      ...(isCharity && { organizationName }),
      ...((isCommunity || isPersonal) && { fullName }),
    };

    // Simulate API call
    setTimeout(() => {
      onComplete(data);
      setLoading(false);
    }, 500);
  };

  const canSubmit =
    location.trim() !== "" &&
    (isBusinessOrEnterprise
      ? businessName.trim() !== "" && companySize !== "" && industry.trim() !== ""
      : isCharity
      ? organizationName.trim() !== ""
      : fullName.trim() !== "");

  const getSectorTitle = () => {
    switch (sector) {
      case "personal":
        return "Tell us about yourself";
      case "business_b2c":
        return "Tell us about your business";
      case "b2b":
        return "Tell us about your company";
      case "charity":
        return "Tell us about your organization";
      case "community":
        return "Tell us about you";
      default:
        return "Complete your profile";
    }
  };

  const getSectorDescription = () => {
    switch (sector) {
      case "personal":
        return "Help us personalize your protection experience";
      case "business_b2c":
        return "We'll customize your fraud prevention dashboard";
      case "b2b":
        return "We'll tailor your enterprise protection suite";
      case "charity":
        return "We'll customize your donor & volunteer screening";
      case "community":
        return "We'll personalize your community safety features";
      default:
        return "";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.title}>{getSectorTitle()}</Text>
          <Text style={styles.description}>{getSectorDescription()}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Personal / Community - Full Name */}
          {(isPersonal || isCommunity) && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textSecondary}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Business / Enterprise - Business Name */}
          {isBusinessOrEnterprise && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                {sector === "b2b" ? "Company Name" : "Business Name"} *
              </Text>
              <TextInput
                style={styles.input}
                placeholder={`Enter your ${sector === "b2b" ? "company" : "business"} name`}
                placeholderTextColor={colors.textSecondary}
                value={businessName}
                onChangeText={setBusinessName}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Charity - Organization Name */}
          {isCharity && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Organization Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your organization name"
                placeholderTextColor={colors.textSecondary}
                value={organizationName}
                onChangeText={setOrganizationName}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Location - All sectors */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Sydney, NSW"
              placeholderTextColor={colors.textSecondary}
              value={location}
              onChangeText={setLocation}
              autoCapitalize="words"
            />
          </View>

          {/* Business / Enterprise - Company Size */}
          {isBusinessOrEnterprise && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Company Size *</Text>
              <View style={styles.optionsGrid}>
                {["1-10", "11-50", "51-200", "201-1000", "1000+"].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.optionButton,
                      companySize === size && styles.optionButtonActive,
                    ]}
                    onPress={() => setCompanySize(size)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        companySize === size && styles.optionTextActive,
                      ]}
                    >
                      {size} {size === "1-10" ? "employees" : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Business / Enterprise - Industry */}
          {isBusinessOrEnterprise && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Industry *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., E-commerce, Retail, SaaS"
                placeholderTextColor={colors.textSecondary}
                value={industry}
                onChangeText={setIndustry}
                autoCapitalize="words"
              />
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Your information is encrypted and used only to personalize your experience
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleComplete}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitButtonText}>Continue</Text>
            )}
          </TouchableOpacity>

          {onSkip && (
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "50%",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  fieldContainer: {
    gap: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "600",
  },
  optionTextActive: {
    color: colors.surface,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  actions: {
    gap: spacing.md,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: "700",
  },
  skipButton: {
    padding: spacing.md,
    alignItems: "center",
  },
  skipButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});