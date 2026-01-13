import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { colors, typography, spacing, borderRadius, shadows } from "../../lib/theme";

interface BusinessAuthScreenProps {
  onSignedIn: (sessionToken: string) => void;
  onSwitchApp?: () => Promise<void>;
}

export default function BusinessAuthScreen({ onSignedIn, onSwitchApp }: BusinessAuthScreenProps) {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showForgotPanel, setShowForgotPanel] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCodeSent, setResetCodeSent] = useState<string | null>(null);
  const [resetCodeInput, setResetCodeInput] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  const signUpAction = useAction(api.auth.signUp);
  const signInAction = useAction(api.auth.signIn);
  const requestPasswordResetAction = useAction(api.auth.requestPasswordReset);
  const resetPasswordWithCodeAction = useAction(api.auth.resetPasswordWithCode);
  const updateUserModeAction = useAction(api.users.updateUserMode);

  useEffect(() => {
    // Web-only hardening:
    // Browsers can retain old/corrupted Convex/OIDC auth tokens (from prior builds/domains).
    // When present, Convex may reject requests before our password-based auth runs.
    // We only clear obviously-related keys and we DO NOT clear our own app session token.
    if (Platform.OS !== "web") {
      return;
    }

    try {
      const safeKeys = new Set(["businessSessionToken", "selectedApp"]);
      const suspiciousFragments = ["convex", "oidc", "auth"]; // Keep tight to avoid deleting unrelated app storage.

      const localStorage = (globalThis as any)?.localStorage;
      const sessionStorage = (globalThis as any)?.sessionStorage;

      const clearMatchingKeys = (storage: any) => {
        if (!storage || typeof storage.length !== "number") return;

        const keys: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (typeof key === "string") {
            keys.push(key);
          }
        }

        for (const key of keys) {
          if (safeKeys.has(key)) continue;

          const lower = key.toLowerCase();
          const isSuspicious = suspiciousFragments.some((fragment) => lower.includes(fragment));
          if (isSuspicious) {
            storage.removeItem(key);
          }
        }
      };

      clearMatchingKeys(localStorage);
      clearMatchingKeys(sessionStorage);
    } catch (e) {
      // Never block login UI because of storage access.
      console.warn("Auth token cleanup failed:", e);
    }
  }, []);

  const handleSwitchApp = () => {
    if (Platform.OS === 'web') {
      const globalAny = globalThis as any;
      const shouldSwitch =
        typeof globalAny?.confirm === 'function'
          ? globalAny.confirm('Go back to app selection?')
          : true;

      if (!shouldSwitch) {
        return;
      }

      void (async () => {
        if (onSwitchApp) {
          await onSwitchApp();
          return;
        }

        // Fallback
        try {
          await AsyncStorage.removeItem('selectedApp');
          await AsyncStorage.removeItem('businessSessionToken');
        } catch (error) {
          console.error('Failed to switch app:', error);
        }
      })();

      return;
    }

    Alert.alert(
      "Switch App",
      "Go back to app selection?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch",
          style: "destructive",
          onPress: async () => {
            if (onSwitchApp) {
              await onSwitchApp();
            } else {
              // Fallback
              try {
                await AsyncStorage.removeItem('selectedApp');
                await AsyncStorage.removeItem('businessSessionToken');
              } catch (error) {
                console.error('Failed to switch app:', error);
              }
            }
          },
        },
      ]
    );
  };

  const handleAuth = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (authMode === "signup" && !businessName.trim()) {
      setError("Please enter your business name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (authMode === "signup") {
        const result = await signUpAction({
          email: normalizedEmail,
          password,
          name: businessName.trim(),
        });

        if (!result?.sessionToken) {
          setError("Sign up failed. Please try again.");
          return;
        }

        // Important: Do not block successful signup on follow-up profile mutations.
        // Some environments (or older deployments) may fail this secondary action.
        onSignedIn(result.sessionToken);

        void updateUserModeAction({ sessionToken: result.sessionToken, mode: "b2b" }).catch((e: any) => {
          console.warn("Failed to set user mode to b2b after signup:", e);
        });

        return;
      }

      const result = await signInAction({
        email: normalizedEmail,
        password,
      });

      if (!result?.sessionToken) {
        setError("Sign in failed. Please try again.");
        return;
      }

      // Same hardening as signup: don't block the primary sign-in flow.
      onSignedIn(result.sessionToken);

      void updateUserModeAction({ sessionToken: result.sessionToken, mode: "b2b" }).catch((e: any) => {
        console.warn("Failed to set user mode to b2b after signin:", e);
      });
    } catch (err: any) {
      const errorMessage = err?.message || String(err);

      if (errorMessage.includes("Account already exists")) {
        setError("An account with this email already exists. Try signing in instead.");
        setAuthMode("signin");
      } else if (errorMessage.includes("Password not set")) {
        setError("This email exists but has no password yet. Use Sign Up to set one.");
        setAuthMode("signup");
      } else if (errorMessage.includes("Invalid email or password")) {
        setError("Invalid email or password. Please try again.");
      } else if (errorMessage.includes("Too many") || errorMessage.includes("try again in")) {
        setError(errorMessage);
      } else {
        // On web (especially Vercel), surfacing the underlying message is the fastest way to debug.
        // Keep it short so the UI stays clean.
        if (Platform.OS === "web" && errorMessage) {
          const condensed = errorMessage.replace(/\s+/g, " ").trim().slice(0, 180);
          setError(`Authentication failed: ${condensed}`);
        } else {
          setError("Authentication failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    const normalizedEmail = email.trim().toLowerCase();
    setShowForgotPanel(true);
    setResetEmail(normalizedEmail);
    setResetCodeSent(null);
    setResetCodeInput("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetMessage(null);
    setResetError(null);
  };

  const requestResetCode = async () => {
    const normalizedEmail = resetEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setResetError("Please enter your email.");
      return;
    }

    setResetLoading(true);
    setResetError(null);
    setResetMessage(null);

    try {
      const result = await requestPasswordResetAction({ email: normalizedEmail });
      setResetMessage(
        result?.message || "If an account exists for that email, a reset code has been generated."
      );

      // Demo-only: backend returns a code for testing.
      if (result?.demoResetCode) {
        setResetCodeSent(String(result.demoResetCode));
      }
    } catch (e: any) {
      setResetError(e?.message ?? "Failed to request reset code.");
    } finally {
      setResetLoading(false);
    }
  };

  const submitPasswordReset = async () => {
    const normalizedEmail = resetEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setResetError("Please enter your email.");
      return;
    }

    if (!resetCodeInput.trim()) {
      setResetError("Please enter the reset code.");
      return;
    }

    if (!resetNewPassword || resetNewPassword.length < 8) {
      setResetError("New password must be at least 8 characters.");
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError("New password and confirmation do not match.");
      return;
    }

    setResetLoading(true);
    setResetError(null);
    setResetMessage(null);

    try {
      await resetPasswordWithCodeAction({
        email: normalizedEmail,
        code: resetCodeInput.trim(),
        newPassword: resetNewPassword,
      });

      Alert.alert(
        "Password Reset",
        "Your password has been reset. Please sign in with your new password."
      );

      setShowForgotPanel(false);
      setAuthMode("signin");
      setEmail(normalizedEmail);
      setPassword("");
    } catch (e: any) {
      setResetError(e?.message ?? "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  const contactSupportForUsername = async () => {
    try {
      await Linking.openURL(
        "mailto:support@chargebackshield.com?subject=" +
          encodeURIComponent("Forgot username") +
          "&body=" +
          encodeURIComponent(
            "Hi ChargebackShield Support,\n\nI forgot the email/username for my business account. Please help me recover access.\n\nBusiness name: \nPhone number (optional): \n\nThanks!"
          )
      );
    } catch {
      Alert.alert("Unavailable", "Couldn't open your email app.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Branding */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark" size={64} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>ChargebackShield</Text>
            <Text style={styles.subtitle}>Stop Chargebacks. Save Revenue.</Text>
            <Text style={styles.tagline}>
              Protect your e-commerce business from fraudulent chargebacks
            </Text>
          </View>

          {/* Auth Form */}
          <View style={styles.formContainer}>
            {/* Toggle Auth Mode */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  authMode === "signin" && styles.toggleButtonActive,
                ]}
                onPress={() => setAuthMode("signin")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    authMode === "signin" && styles.toggleTextActive,
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  authMode === "signup" && styles.toggleButtonActive,
                ]}
                onPress={() => setAuthMode("signup")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    authMode === "signup" && styles.toggleTextActive,
                  ]}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Business Name (Sign Up Only) */}
            {authMode === "signup" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="business" size={20} color={colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your Business Name"
                    placeholderTextColor={colors.textMuted}
                    value={businessName}
                    onChangeText={setBusinessName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="you@company.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {authMode === "signin" ? "Sign In" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password / Username (Sign In Only) */}
            {authMode === "signin" ? (
              <View style={{ marginTop: spacing.sm }}>
                <TouchableOpacity onPress={openForgotPassword} style={styles.forgotLink}>
                  <Text style={styles.forgotLinkText}>Forgot password or username?</Text>
                </TouchableOpacity>

                {showForgotPanel ? (
                  <View style={styles.forgotPanel}>
                    <Text style={styles.forgotTitle}>Recover access</Text>
                    <Text style={styles.forgotSubtitle}>
                      For security, we'll generate a short-lived reset code. (Demo: code is shown here.)
                    </Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="mail" size={20} color={colors.textMuted} />
                        <TextInput
                          style={styles.input}
                          placeholder="you@company.com"
                          placeholderTextColor={colors.textMuted}
                          value={resetEmail}
                          onChangeText={setResetEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.secondaryButton, resetLoading && styles.submitButtonDisabled]}
                      onPress={requestResetCode}
                      disabled={resetLoading}
                    >
                      {resetLoading ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : (
                        <Text style={styles.secondaryButtonText}>Generate reset code</Text>
                      )}
                    </TouchableOpacity>

                    {resetCodeSent ? (
                      <View style={styles.demoCodeBox}>
                        <Text style={styles.demoCodeLabel}>Reset code (demo)</Text>
                        <Text style={styles.demoCodeValue}>{resetCodeSent}</Text>
                      </View>
                    ) : null}

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Reset Code</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="key" size={20} color={colors.textMuted} />
                        <TextInput
                          style={styles.input}
                          placeholder="123456"
                          placeholderTextColor={colors.textMuted}
                          value={resetCodeInput}
                          onChangeText={setResetCodeInput}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>New Password</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
                        <TextInput
                          style={styles.input}
                          placeholder="At least 8 characters"
                          placeholderTextColor={colors.textMuted}
                          value={resetNewPassword}
                          onChangeText={setResetNewPassword}
                          secureTextEntry={!showResetNewPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <TouchableOpacity
                          onPress={() => setShowResetNewPassword(!showResetNewPassword)}
                          style={styles.eyeButton}
                        >
                          <Ionicons
                            name={showResetNewPassword ? "eye-off" : "eye"}
                            size={20}
                            color={colors.textMuted}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Confirm New Password</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
                        <TextInput
                          style={styles.input}
                          placeholder="Re-enter new password"
                          placeholderTextColor={colors.textMuted}
                          value={resetConfirmPassword}
                          onChangeText={setResetConfirmPassword}
                          secureTextEntry={!showResetConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <TouchableOpacity
                          onPress={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                          style={styles.eyeButton}
                        >
                          <Ionicons
                            name={showResetConfirmPassword ? "eye-off" : "eye"}
                            size={20}
                            color={colors.textMuted}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {resetError ? (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={20} color={colors.error} />
                        <Text style={styles.errorText}>{resetError}</Text>
                      </View>
                    ) : null}

                    {resetMessage ? (
                      <Text style={styles.resetMessageText}>{resetMessage}</Text>
                    ) : null}

                    <TouchableOpacity
                      style={[styles.submitButton, resetLoading && styles.submitButtonDisabled]}
                      onPress={submitPasswordReset}
                      disabled={resetLoading}
                    >
                      {resetLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.submitButtonText}>Reset Password</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={contactSupportForUsername} style={styles.usernameHelpLink}>
                      <Text style={styles.usernameHelpText}>
                        Forgot your email/username? Contact support
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setShowForgotPanel(false)}
                      style={styles.cancelForgotLink}
                    >
                      <Text style={styles.cancelForgotText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Features List (Sign Up Only) */}
            {authMode === "signup" && (
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>What you'll get:</Text>
                {[
                  "Real-time chargeback risk detection",
                  "Automated dispute evidence generation",
                  "Shopify & Stripe integrations",
                  "ROI tracking & analytics",
                  "24/7 fraud monitoring",
                ].map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Switch App Link */}
            <TouchableOpacity onPress={handleSwitchApp} style={styles.switchAppLink}>
              <Ionicons name="swap-horizontal" size={16} color={colors.textMuted} />
              <Text style={styles.switchAppText}>Switch to Consumer App</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'web' ? spacing.xl * 2 : spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl * 1.5,
  },
  logoContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    ...Platform.select({
      web: {
        boxShadow: '0 0 60px rgba(59, 130, 246, 0.4), 0 20px 40px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 12,
      },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#3B82F6",
    marginTop: 16,
    textAlign: "center",
  },
  titleWeb: {
    fontSize: 36,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    ...Platform.select({
      web: {
        maxWidth: 480,
        alignSelf: 'center',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
      },
      default: {
        ...shadows.lg,
      },
    }),
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: borderRadius.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  toggleButtonActive: {
    backgroundColor: colors.surface,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
      },
      default: {
        ...shadows.sm,
      },
    }),
  },
  toggleText: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: "600",
  },
  toggleTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'web' ? spacing.md : spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.sm,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      },
    }),
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: Platform.OS === 'web' ? 4 : 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.error}15`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    flex: 1,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: spacing.md + 4,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
      },
      default: {
        ...shadows.md,
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      },
    }),
  },
  submitButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  featuresContainer: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  featureText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  switchAppLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'opacity 0.2s ease',
      },
    }),
  },
  switchAppText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  forgotLink: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'opacity 0.2s ease',
      },
    }),
  },
  forgotLinkText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "700",
  },
  forgotPanel: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.borderLight,
    gap: spacing.md,
  },
  forgotTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  forgotSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    backgroundColor: "transparent",
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  secondaryButtonText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "700",
  },
  demoCodeBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: "center",
  },
  demoCodeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  demoCodeValue: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 4,
    color: '#10B981',
  },
  resetMessageText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  usernameHelpLink: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  usernameHelpText: {
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  cancelForgotLink: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  cancelForgotText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "700",
  },
  eyeButton: {
    padding: spacing.xs,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
});