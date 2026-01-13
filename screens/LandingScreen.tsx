import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { UserMode } from '../types/userMode';

interface LandingScreenProps {
  // Preferred (matches App.tsx)
  onSignedIn: (sessionToken: string, sector: UserMode) => void;
  onSectorSelect?: (sector: UserMode) => void;
  onSwitchApp?: () => Promise<void>;

  // Backward compatibility (older callers)
  onAuthSuccess?: (sessionToken: string, sector: UserMode) => void;
}

const { width } = Dimensions.get('window');

// Helper function to validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function LandingScreen({
  onSignedIn,
  onSectorSelect,
  onAuthSuccess,
  onSwitchApp,
}: LandingScreenProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAuthForm, setShowAuthForm] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const signUpAction = useAction(api.auth.signUp);
  const signInAction = useAction(api.auth.signIn);

  const handleAuthSuccess =
    typeof onSignedIn === "function"
      ? onSignedIn
      : typeof onAuthSuccess === "function"
      ? onAuthSuccess
      : undefined;

  const features = [
    {
      icon: 'shield-checkmark-outline',
      title: 'Real-Time Protection',
      description: 'Instant scam detection',
      color: '#3B82F6',
    },
    {
      icon: 'search-outline',
      title: 'Background Checks',
      description: 'Verify people first',
      color: '#8B5CF6',
    },
    {
      icon: 'warning-outline',
      title: 'Dark Web Monitoring',
      description: 'Breach alerts',
      color: '#EF4444',
    },
    {
      icon: 'analytics-outline',
      title: 'Fraud Patterns',
      description: 'AI-powered analysis',
      color: '#10B981',
    },
  ];

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

        // Fallback for backward compatibility
        try {
          await AsyncStorage.removeItem('selectedApp');
          await AsyncStorage.removeItem('sessionToken');
          await AsyncStorage.removeItem('selectedSector');
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
              // Fallback for backward compatibility
              try {
                await AsyncStorage.removeItem('selectedApp');
                await AsyncStorage.removeItem('sessionToken');
                await AsyncStorage.removeItem('selectedSector');
              } catch (error) {
                console.error('Failed to switch app:', error);
              }
            }
          },
        },
      ]
    );
  };

  const handleGetStarted = () => {
    setShowAuthForm(true);
    setAuthMode('signup');
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 400, animated: true });
    }, 100);
  };

  const handleSignIn = () => {
    setShowAuthForm(true);
    setAuthMode('signin');
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 400, animated: true });
    }, 100);
  };

  const handleAuth = async () => {
    if (!handleAuthSuccess) {
      console.error("LandingScreen: missing onSignedIn/onAuthSuccess callback");
      setError("Something went wrong. Please update the app and try again.");
      return;
    }

    setError('');

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
    if (authMode === "signup" && !name.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);

    try {
      if (authMode === "signup") {
        const result = await signUpAction({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
        });
        // Default to personal mode, user can change in onboarding
        handleAuthSuccess(result.sessionToken, 'personal' as UserMode);
      } else {
        const result = await signInAction({
          email: email.trim().toLowerCase(),
          password,
        });
        handleAuthSuccess(result.sessionToken, 'personal' as UserMode);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      const errorMessage = err?.message || String(err);

      if (errorMessage.includes("Account already exists")) {
        setError("Account exists. Try signing in instead.");
        setAuthMode("signin");
      } else if (errorMessage.includes("Password not set")) {
        setError("This email exists but needs a password. Create one to continue.");
        setAuthMode("signup");
        setShowAuthForm(true);
      } else if (errorMessage.includes("Invalid email or password")) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Decorative background blobs */}
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />
          <View style={styles.heroBlob3} />

          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={50} color="#FFFFFF" />
          </View>

          <Text style={styles.appName}>Scam Vigil</Text>
          <Text style={styles.tagline}>Spot Scams Before They Spot You</Text>
          <Text style={styles.subtitle}>
            Stop romance scams, investment fraud, and identity theft with AI-powered protection.
          </Text>

          <View style={styles.socialProofCard}>
            <View style={styles.proofItem}>
              <Text style={styles.socialProofValue}>12K+</Text>
              <Text style={styles.socialProofLabel}>Protected Users</Text>
            </View>
            <View style={styles.proofDivider} />
            <View style={styles.proofItem}>
              <Text style={styles.socialProofValue}>$8.9M+</Text>
              <Text style={styles.socialProofLabel}>Losses Prevented</Text>
            </View>
            <View style={styles.proofDivider} />
            <View style={styles.proofItem}>
              <Text style={styles.socialProofValue}>4.8★</Text>
              <Text style={styles.socialProofLabel}>User Rating</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleGetStarted}
          >
            <Text style={styles.ctaButtonText}>Get Started Free</Text>
            <Ionicons name="arrow-forward" size={20} color="#1E40AF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSignIn}>
            <Text style={styles.signInLink}>
              Already have an account? <Text style={styles.signInLinkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>

          {/* Switch App Link */}
          <TouchableOpacity onPress={handleSwitchApp} style={styles.switchAppLink}>
            <Ionicons name="swap-horizontal" size={16} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.switchAppText}>Switch to Business App</Text>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Protection You Can Trust</Text>

          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={[styles.featureIconContainer, { backgroundColor: feature.color }]}>
                  <Ionicons name={feature.icon as any} size={20} color="#FFFFFF" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Trust Badges */}
        <View style={styles.trustSection}>
          <View style={styles.trustBadge}>
            <Ionicons name="lock-closed" size={20} color={colors.success} />
            <Text style={styles.trustBadgeText}>Bank-Grade Encryption</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="shield" size={20} color={colors.success} />
            <Text style={styles.trustBadgeText}>Australian Privacy Compliant</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="people" size={20} color={colors.success} />
            <Text style={styles.trustBadgeText}>Trusted by 12K+ Australians</Text>
          </View>
        </View>

        {/* Auth Form */}
        {showAuthForm && (
          <View style={styles.authContainer}>
            <Text style={styles.authTitle}>
              {authMode === "signup" ? "Create Your Free Account" : "Welcome Back"}
            </Text>

            {/* Toggle Sign In / Sign Up */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  authMode === "signup" && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  setAuthMode("signup");
                  setError('');
                }}
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
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  authMode === "signin" && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  setAuthMode("signin");
                  setError('');
                }}
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
            </View>

            {/* Form */}
            <View style={styles.authForm}>
              {authMode === "signup" && (
                <View>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.authButton}
                onPress={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <>
                    <Text style={styles.authButtonText}>
                      {authMode === "signup" ? "Create Account" : "Sign In"}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              {authMode === "signup" && (
                <Text style={styles.disclaimer}>
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => setShowAuthForm(false)}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.backButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerItem}>
              <Ionicons name="location" size={16} color={colors.textSecondary} />
              <Text style={styles.footerText}>🇦🇺 Proudly Australian</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="lock" size={16} color={colors.textSecondary} />
              <Text style={styles.footerText}>🔒 Bank-Grade Security</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="shield" size={16} color={colors.textSecondary} />
              <Text style={styles.footerText}>🛡️ Privacy First</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1e3a8a',
  },
  heroBlob1: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 60,
  },
  heroBlob2: {
    position: 'absolute',
    top: -20,
    right: -40,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderRadius: 75,
  },
  heroBlob3: {
    position: 'absolute',
    bottom: -50,
    left: '30%',
    width: 180,
    height: 180,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderRadius: 90,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoShield: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 15,
    color: '#93C5FD',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  socialProofCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  proofItem: {
    flex: 1,
    alignItems: 'center',
  },
  proofDivider: {
    width: 1,
    height: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  socialProofValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  socialProofLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  ctaSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaButtonText: {
    color: '#1E40AF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  signInLink: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  signInLinkBold: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  contentSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    width: '48%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 3,
  },
  featureDescription: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 14,
  },
  trustSection: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  trustBadgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  authContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.surface,
    fontWeight: '700',
  },
  authForm: {
    gap: spacing.lg,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingRight: 50,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1.5,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    flex: 1,
  },
  authButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  backLink: {
    fontSize: 13,
    color: '#3B82F6',
    textAlign: 'center',
    marginTop: 12,
  },
  backButtonText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  footerText: {
    fontSize: 11,
    color: '#6B7280',
  },
  switchAppLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  switchAppText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
});