import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";

/**
 * TrueProfile Pro - Browser Extension Screen
 * Shows mockup of Chrome extension and installation guide
 */

interface ProfileMockup {
  name: string;
  handle: string;
  avatar: string;
  trustScore: number;
  riskLevel: "real" | "suspicious" | "fake";
  flags: string[];
}

const MOCK_PROFILES: ProfileMockup[] = [
  {
    name: "Sarah Mitchell",
    handle: "@sarahmitchell_au",
    avatar: "https://api.a0.dev/assets/image?text=professional%20woman%20headshot%20friendly&aspect=1:1&seed=sarah",
    trustScore: 92,
    riskLevel: "real",
    flags: ["✅ 3+ years active", "✅ Consistent posts", "✅ Real connections"],
  },
  {
    name: "John Investment Tips",
    handle: "@crypto_john_2024",
    avatar: "https://api.a0.dev/assets/image?text=ai%20generated%20face%20male&aspect=1:1&seed=john",
    trustScore: 28,
    riskLevel: "fake",
    flags: ["🚩 Account created 2 days ago", "🚩 GAN-generated face detected", "🚩 Scam phrases in bio"],
  },
  {
    name: "Melbourne Rentals",
    handle: "@melb_rentals_fast",
    avatar: "https://api.a0.dev/assets/image?text=rental%20property%20logo&aspect=1:1&seed=rental",
    trustScore: 45,
    riskLevel: "suspicious",
    flags: ["⚠️ No business verification", "⚠️ Asks for deposits via DM", "⚠️ Generic stock photos"],
  },
];

export function ExtensionScreen() {
  const [selectedProfile, setSelectedProfile] = useState<ProfileMockup | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const getTrustColor = (score: number) => {
    if (score >= 70) return theme.colors.success;
    if (score >= 40) return theme.colors.warning;
    return theme.colors.error;
  };

  const getRiskEmoji = (riskLevel: string) => {
    if (riskLevel === "real") return "🟢";
    if (riskLevel === "suspicious") return "🟡";
    return "🔴";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.extensionIcon}>
            <Ionicons name="extension-puzzle" size={32} color="#fff" />
          </View>
          <Text style={styles.title}>Browser Extension</Text>
          <Text style={styles.subtitle}>
            See Trust Scores while you browse — no extra clicks
          </Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => setShowInstallGuide(true)}
        >
          <Ionicons name="logo-chrome" size={24} color="#fff" />
          <Text style={styles.ctaButtonText}>Add to Chrome — Free</Text>
        </TouchableOpacity>

        <Text style={styles.ctaSubtext}>
          Also available for Firefox & Edge • Works on FB, IG, LinkedIn
        </Text>

        {/* Live Demo Section */}
        <View style={styles.demoSection}>
          <Text style={styles.sectionTitle}>🎯 See it in action</Text>
          <Text style={styles.sectionSubtitle}>
            Tap a profile to see what the extension shows
          </Text>

          {/* Mock Facebook Feed */}
          <View style={styles.mockBrowser}>
            <View style={styles.browserBar}>
              <View style={styles.browserDots}>
                <View style={[styles.browserDot, { backgroundColor: "#FF5F57" }]} />
                <View style={[styles.browserDot, { backgroundColor: "#FEBC2E" }]} />
                <View style={[styles.browserDot, { backgroundColor: "#28C840" }]} />
              </View>
              <View style={styles.browserUrlBar}>
                <Ionicons name="lock-closed" size={12} color={theme.colors.success} />
                <Text style={styles.browserUrl}>facebook.com</Text>
              </View>
              <View style={styles.extensionBadge}>
                <Ionicons name="shield-checkmark" size={14} color={theme.colors.primary} />
              </View>
            </View>

            {/* Mock Profiles */}
            <View style={styles.mockFeed}>
              {MOCK_PROFILES.map((profile, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.mockProfile,
                    selectedProfile?.handle === profile.handle && styles.mockProfileSelected,
                  ]}
                  onPress={() => setSelectedProfile(profile)}
                >
                  <View style={styles.mockProfileRow}>
                    <Image
                      source={{ uri: profile.avatar }}
                      style={styles.mockAvatar}
                    />
                    <View style={styles.mockProfileInfo}>
                      <Text style={styles.mockProfileName}>{profile.name}</Text>
                      <Text style={styles.mockProfileHandle}>{profile.handle}</Text>
                    </View>
                    {/* Trust Badge Overlay */}
                    <View style={[
                      styles.trustBadge,
                      { backgroundColor: getTrustColor(profile.trustScore) }
                    ]}>
                      <Text style={styles.trustBadgeText}>
                        {getRiskEmoji(profile.riskLevel)} {profile.trustScore}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Selected Profile Detail */}
          {selectedProfile && (
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Image
                  source={{ uri: selectedProfile.avatar }}
                  style={styles.detailAvatar}
                />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailName}>{selectedProfile.name}</Text>
                  <Text style={styles.detailHandle}>{selectedProfile.handle}</Text>
                </View>
                <View style={[
                  styles.detailScore,
                  { backgroundColor: getTrustColor(selectedProfile.trustScore) }
                ]}>
                  <Text style={styles.detailScoreText}>{selectedProfile.trustScore}</Text>
                  <Text style={styles.detailScoreLabel}>
                    {selectedProfile.riskLevel === "real" ? "REAL" :
                     selectedProfile.riskLevel === "suspicious" ? "SUS" : "FAKE"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailFlags}>
                {selectedProfile.flags.map((flag, index) => (
                  <Text key={index} style={styles.detailFlag}>{flag}</Text>
                ))}
              </View>

              <View style={styles.detailActions}>
                <TouchableOpacity style={styles.detailAction}>
                  <Ionicons name="flag-outline" size={16} color={theme.colors.error} />
                  <Text style={styles.detailActionText}>Report to Scamwatch</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailAction}>
                  <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.detailActionText, { color: theme.colors.primary }]}>Full Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>✨ Extension Features</Text>
          
          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Ionicons name="flash" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.featureTitle}>Instant Badges</Text>
              <Text style={styles.featureDesc}>Trust scores appear on every profile you view</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.success}15` }]}>
                <Ionicons name="lock-closed" size={24} color={theme.colors.success} />
              </View>
              <Text style={styles.featureTitle}>Privacy First</Text>
              <Text style={styles.featureDesc}>Free tier keeps all data in your browser</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.warning}15` }]}>
                <Ionicons name="notifications" size={24} color={theme.colors.warning} />
              </View>
              <Text style={styles.featureTitle}>Scam Alerts</Text>
              <Text style={styles.featureDesc}>Get warned before engaging with fakes</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.secondary}15` }]}>
                <Ionicons name="cloud-offline" size={24} color={theme.colors.secondary} />
              </View>
              <Text style={styles.featureTitle}>Works Offline</Text>
              <Text style={styles.featureDesc}>AI runs locally with TensorFlow.js</Text>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>🛠️ How It Works</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Install Extension</Text>
              <Text style={styles.stepDesc}>One click from Chrome Web Store</Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Browse Normally</Text>
              <Text style={styles.stepDesc}>Visit Facebook, Instagram, or LinkedIn</Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>See Trust Badges</Text>
              <Text style={styles.stepDesc}>Hover any profile for instant Trust Score</Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Stay Safe</Text>
              <Text style={styles.stepDesc}>Skip the fakes, connect with real people</Text>
            </View>
          </View>
        </View>

        {/* Technical Specs */}
        <View style={styles.techSection}>
          <Text style={styles.sectionTitle}>🔒 Technical Specs</Text>
          
          <View style={styles.techCard}>
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>Manifest</Text>
              <Text style={styles.techValue}>V3 (Latest)</Text>
            </View>
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>AI Model</Text>
              <Text style={styles.techValue}>TensorFlow.js (Local)</Text>
            </View>
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>Permissions</Text>
              <Text style={styles.techValue}>Active tab only</Text>
            </View>
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>Data Storage</Text>
              <Text style={styles.techValue}>Free: None • Pro: Encrypted AU</Text>
            </View>
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>Platforms</Text>
              <Text style={styles.techValue}>FB, IG, LinkedIn</Text>
            </View>
          </View>
        </View>

        {/* APP Compliance */}
        <View style={styles.complianceSection}>
          <View style={styles.complianceBadge}>
            <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
            <Text style={styles.complianceText}>
              Australian Privacy Principles compliant • No facial recognition
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Install Guide Modal */}
      {showInstallGuide && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Install Extension</Text>
              <TouchableOpacity onPress={() => setShowInstallGuide(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.installStep}>
              <View style={styles.installStepIcon}>
                <Ionicons name="desktop-outline" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.installStepTitle}>Open on Desktop</Text>
              <Text style={styles.installStepDesc}>
                The browser extension requires a desktop browser. Visit{" "}
                <Text style={styles.installLink}>trueprofile.pro</Text> on your computer.
              </Text>
            </View>

            <View style={styles.installStep}>
              <View style={styles.installStepIcon}>
                <Ionicons name="logo-chrome" size={32} color="#4285F4" />
              </View>
              <Text style={styles.installStepTitle}>Chrome Web Store</Text>
              <Text style={styles.installStepDesc}>
                Click "Add to Chrome" and confirm the installation.
              </Text>
            </View>

            <View style={styles.installStep}>
              <View style={styles.installStepIcon}>
                <Ionicons name="checkmark-circle" size={32} color={theme.colors.success} />
              </View>
              <Text style={styles.installStepTitle}>You're Set!</Text>
              <Text style={styles.installStepDesc}>
                Browse social media and see Trust Scores instantly.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowInstallGuide(false)}
            >
              <Text style={styles.modalButtonText}>Got it, mate!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  extensionIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  ctaButton: {
    flexDirection: "row",
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: theme.typography.sizes.lg,
    fontWeight: "700",
  },
  ctaSubtext: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  demoSection: {
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  mockBrowser: {
    backgroundColor: "#fff",
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  browserBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  browserDots: {
    flexDirection: "row",
    gap: 6,
    marginRight: theme.spacing.md,
  },
  browserDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  browserUrlBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  browserUrl: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text,
  },
  extensionBadge: {
    marginLeft: theme.spacing.sm,
    padding: 4,
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 4,
  },
  mockFeed: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  mockProfile: {
    backgroundColor: "#F9FAFB",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  mockProfileSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}08`,
  },
  mockProfileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mockAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.md,
  },
  mockProfileInfo: {
    flex: 1,
  },
  mockProfileName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: "600",
    color: theme.colors.text,
  },
  mockProfileHandle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  trustBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
  },
  trustBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: "700",
    color: "#fff",
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  detailAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: theme.spacing.md,
  },
  detailInfo: {
    flex: 1,
  },
  detailName: {
    fontSize: theme.typography.sizes.base,
    fontWeight: "700",
    color: theme.colors.text,
  },
  detailHandle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  detailScore: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  detailScoreText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: "800",
    color: "#fff",
  },
  detailScoreLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  detailFlags: {
    marginBottom: theme.spacing.md,
  },
  detailFlag: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    marginBottom: 4,
  },
  detailActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  detailAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailActionText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.error,
    fontWeight: "600",
  },
  featuresSection: {
    marginBottom: theme.spacing.xxl,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  featureCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  featureTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  howItWorksSection: {
    marginBottom: theme.spacing.xxl,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  stepNumberText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: "700",
    color: "#fff",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: "600",
    color: theme.colors.text,
  },
  stepDesc: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: theme.colors.border,
    marginLeft: 15,
  },
  techSection: {
    marginBottom: theme.spacing.xxl,
  },
  techCard: {
    backgroundColor: "#fff",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  techRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  techLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  techValue: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: "600",
    color: theme.colors.text,
  },
  complianceSection: {
    marginBottom: theme.spacing.xl,
  },
  complianceBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.lg,
  },
  complianceText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: "700",
    color: theme.colors.text,
  },
  installStep: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  installStepIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${theme.colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  installStepTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  installStepDesc: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  installLink: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  modalButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: theme.typography.sizes.base,
    fontWeight: "700",
  },
});

export default ExtensionScreen;