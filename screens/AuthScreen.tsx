import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, spacing, borderRadius, typography } from "../lib/theme";

// Helper function to validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate password requirements
const validatePasswordRequirements = (password: string) => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};:'"\\|,.<>\/?]/.test(password),
  };
};

// Helper function that returns array of password requirements with met status
const validatePassword = (password: string) => {
  const reqs = validatePasswordRequirements(password);
  return [
    { label: "At least 8 characters", met: reqs.minLength },
    { label: "One uppercase letter", met: reqs.hasUppercase },
    { label: "One lowercase letter", met: reqs.hasLowercase },
    { label: "One number", met: reqs.hasDigit },
    { label: "One special character", met: reqs.hasSpecial },
  ];
};

// Check if all password requirements are met
const isPasswordValid = (password: string) => {
  const reqs = validatePasswordRequirements(password);
  return Object.values(reqs).every(Boolean);
};

export default function AuthScreen({
  onSignedIn,
  onBack,
}: {
  onSignedIn?: (sessionToken: string) => void;
  onBack?: () => void;
}) {
  const signUpAction = useAction(api.auth.signUp);
  const signInAction = useAction(api.auth.signIn);
  
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordReqs = validatePasswordRequirements(password);
  const isPasswordOk = isPasswordValid(password);
  const isSignUp = mode === "signUp";

  const handleAuth = async () => {
    // Clear previous errors
    setError("");

    // Validate inputs
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    if (mode === "signUp" && !name.trim()) {
      setError("Please enter your name");
      return;
    }

    // Password requirements for sign up
    if (mode === "signUp") {
      const requirements = validatePassword(password);
      if (!requirements.every(r => r.met)) {
        setError("Password doesn't meet all requirements");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signUp") {
        // Sign up
        const result = await signUpAction({ 
          email: email.trim().toLowerCase(), 
          password, 
          name: name.trim() 
        });
        // Store session token
        await AsyncStorage.setItem("sessionToken", result.sessionToken);
        onSignedIn?.(result.sessionToken);
      } else {
        // Sign in
        const result = await signInAction({ 
          email: email.trim().toLowerCase(), 
          password 
        });
        // Store session token
        await AsyncStorage.setItem("sessionToken", result.sessionToken);
        onSignedIn?.(result.sessionToken);
      }
      // Success - user will be redirected by auth state change
    } catch (err: any) {
      console.error("Auth error:", err);
      
      // Handle specific errors
      const errorMessage = err?.message || String(err);

      if (errorMessage.includes("Account already exists")) {
        setError("An account with this email already exists. Try signing in instead.");
        setMode("signIn");
      } else if (errorMessage.includes("Password not set")) {
        setError("This email already exists, but needs a password. Tap Get Protected to set one.");
        setMode("signUp");
      } else if (errorMessage.includes("Invalid email or password")) {
        if (mode === "signIn") {
          setError("Invalid email or password. Please try again.");
        } else {
          setError("Unable to create account. Please try a different email.");
        }
      } else if (errorMessage.includes("network") || errorMessage.includes("Network")) {
        setError("Network error. Please check your internet connection.");
      } else {
        // Generic error
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* Back Button */}
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.surface} />
          <Text style={styles.backButtonText}>Change Sector</Text>
        </TouchableOpacity>
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroIcon}>🛡️</Text>
            <Text style={styles.heroTitle}>ScamVigil</Text>
            <Text style={styles.heroTagline}>Spot Scams. Stop Losses. Stay Safe.</Text>
            <Text style={styles.heroDescription}>
              Australia's #1 trusted scam protection platform. We keep watch so you don't have to.
            </Text>

            {/* Trust Signals - Enhanced */}
            <View style={styles.trustSignals}>
              <View style={styles.trustItem}>
                <Text style={styles.trustNumber}>12K+</Text>
                <Text style={styles.trustLabel}>Australians Protected</Text>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustItem}>
                <Text style={styles.trustNumber}>$8.9M</Text>
                <Text style={styles.trustLabel}>Losses Prevented</Text>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustItem}>
                <Text style={styles.trustNumber}>99%</Text>
                <Text style={styles.trustLabel}>Accuracy Rate</Text>
              </View>
            </View>
          </View>

          {/* Protection Categories - Redesigned */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>⚡ Instant Threat Detection</Text>
            <View style={styles.categoriesGrid}>
              <View style={[styles.categoryBadge, styles.categoryBadgeRomance]}>
                <Text style={styles.categoryEmoji}>💔</Text>
                <View>
                  <Text style={styles.categoryTextBold}>Romance</Text>
                  <Text style={styles.categorySubtext}>Fake profiles</Text>
                </View>
              </View>
              <View style={[styles.categoryBadge, styles.categoryBadgeInvestment]}>
                <Text style={styles.categoryEmoji}>💰</Text>
                <View>
                  <Text style={styles.categoryTextBold}>Investment</Text>
                  <Text style={styles.categorySubtext}>Fake opportunities</Text>
                </View>
              </View>
              <View style={[styles.categoryBadge, styles.categoryBadgeEmail]}>
                <Text style={styles.categoryEmoji}>📧</Text>
                <View>
                  <Text style={styles.categoryTextBold}>Phishing</Text>
                  <Text style={styles.categorySubtext}>Fraudulent emails</Text>
                </View>
              </View>
              <View style={[styles.categoryBadge, styles.categoryBadgePhone]}>
                <Text style={styles.categoryEmoji}>☎️</Text>
                <View>
                  <Text style={styles.categoryTextBold}>Phone Scams</Text>
                  <Text style={styles.categorySubtext}>Impersonation</Text>
                </View>
              </View>
              <View style={[styles.categoryBadge, styles.categoryBadgeRental]}>
                <Text style={styles.categoryEmoji}>🏠</Text>
                <View>
                  <Text style={styles.categoryTextBold}>Rental Fraud</Text>
                  <Text style={styles.categorySubtext}>Fake listings</Text>
                </View>
              </View>
              <View style={[styles.categoryBadge, styles.categoryBadgeMarketplace]}>
                <Text style={styles.categoryEmoji}>🛒</Text>
                <View>
                  <Text style={styles.categoryTextBold}>Marketplace</Text>
                  <Text style={styles.categorySubtext}>Dodgy sellers</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Social Proof - Enhanced */}
          <View style={styles.socialProofSection}>
            <View style={styles.testimonial}>
              <View style={styles.testimonialHeader}>
                <Text style={styles.testimonialStar}>⭐⭐⭐⭐⭐</Text>
              </View>
              <Text style={styles.testimonialText}>
                "Saved me $45,000! Caught a fake investment scheme before I lost everything."
              </Text>
              <Text style={styles.testimonialAuthor}>— Sarah M., Sydney NSW</Text>
            </View>
            <View style={styles.testimonial}>
              <View style={styles.testimonialHeader}>
                <Text style={styles.testimonialStar}>⭐⭐⭐⭐⭐</Text>
              </View>
              <Text style={styles.testimonialText}>
                "This stopped me from sending my rent bond to a fake landlord. Incredible app."
              </Text>
              <Text style={styles.testimonialAuthor}>— James T., Melbourne VIC</Text>
            </View>
          </View>

          {/* Auth Form */}
          <View style={styles.authCard}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, !isSignUp && styles.tabActive]}
                onPress={() => {
                  setMode('signIn');
                  setError(null);
                }}
              >
                <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, isSignUp && styles.tabActive]}
                onPress={() => {
                  setMode('signUp');
                  setError(null);
                }}
              >
                <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>
                  Get Protected
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {isSignUp && (
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setError(null);
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              )}
              
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {isSignUp && password.length > 0 && (
                <View style={styles.passwordHints}>
                  <Text style={styles.passwordHintTitle}>Password must contain:</Text>
                  <Text style={[styles.passwordHint, passwordReqs.minLength && styles.passwordHintValid]}>
                    {passwordReqs.minLength ? '✓' : '○'} At least 8 characters
                  </Text>
                  <Text style={[styles.passwordHint, passwordReqs.hasUppercase && styles.passwordHintValid]}>
                    {passwordReqs.hasUppercase ? '✓' : '○'} One uppercase letter
                  </Text>
                  <Text style={[styles.passwordHint, passwordReqs.hasLowercase && styles.passwordHintValid]}>
                    {passwordReqs.hasLowercase ? '✓' : '○'} One lowercase letter
                  </Text>
                  <Text style={[styles.passwordHint, passwordReqs.hasDigit && styles.passwordHintValid]}>
                    {passwordReqs.hasDigit ? '✓' : '○'} One number
                  </Text>
                  <Text style={[styles.passwordHint, passwordReqs.hasSpecial && styles.passwordHintValid]}>
                    {passwordReqs.hasSpecial ? '✓' : '○'} One special character (!@#$%^&*)
                  </Text>
                </View>
              )}

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.buttonText}>
                    {isSignUp ? 'Start Protection' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              {isSignUp && (
                <Text style={styles.disclaimer}>
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </Text>
              )}
            </View>
          </View>

          {/* Final CTA */}
          <View style={styles.finalCTA}>
            <Text style={styles.ctaText}>
              🔒 Join thousands of Australians who stopped getting scammed
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.surface,
    marginBottom: spacing.xs,
    fontWeight: '800',
  },
  heroTagline: {
    ...typography.h3,
    color: colors.surface,
    opacity: 0.95,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  heroDescription: {
    ...typography.body,
    color: colors.surface,
    opacity: 0.85,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  trustSignals: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
  },
  trustNumber: {
    ...typography.h2,
    color: colors.surface,
    fontWeight: '800',
  },
  trustLabel: {
    ...typography.caption,
    color: colors.surface,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  trustDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoriesSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.surface,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  categoryBadgeRomance: {
    borderColor: colors.success,
    borderWidth: 1,
  },
  categoryBadgeInvestment: {
    borderColor: colors.warning,
    borderWidth: 1,
  },
  categoryBadgeEmail: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  categoryBadgePhone: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  categoryBadgeRental: {
    borderColor: colors.secondary,
    borderWidth: 1,
  },
  categoryBadgeMarketplace: {
    borderColor: colors.success,
    borderWidth: 1,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '600',
  },
  categoryTextBold: {
    fontWeight: '700',
  },
  categorySubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    opacity: 0.8,
  },
  socialProofSection: {
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  testimonial: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  testimonialStar: {
    fontSize: 14,
    color: colors.success,
    marginRight: spacing.sm,
  },
  testimonialText: {
    ...typography.body,
    color: colors.surface,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  testimonialAuthor: {
    ...typography.caption,
    color: colors.surface,
    opacity: 0.7,
  },
  authCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: spacing.xl,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.surface,
  },
  form: {
    gap: spacing.md,
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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    ...typography.body,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    paddingRight: 50,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  passwordHints: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  passwordHintTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  passwordHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  passwordHintValid: {
    color: colors.success,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight || 'rgba(239, 68, 68, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '700',
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  finalCTA: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  ctaText: {
    ...typography.body,
    color: colors.surface,
    textAlign: 'center',
    opacity: 0.9,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  backButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});