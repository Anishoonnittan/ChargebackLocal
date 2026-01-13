import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography, shadows } from "../lib/theme";

/**
 * TrueProfile Pro - Privacy Policy Screen
 * Australian Privacy Principles (APP) compliant privacy disclosure
 * Last updated: January 2025
 */

export default function PrivacyPolicyScreen({ onClose }: { onClose?: () => void }) {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View>{children}</View>
    </View>
  );

  const Subsection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.subsection}>
      <Text style={styles.subsectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const Paragraph = ({ children, style }: { children: string; style?: any }) => (
    <Text style={[styles.paragraph, style]}>{children}</Text>
  );

  const BulletPoint = ({ children }: { children: string }) => (
    <View style={styles.bulletContainer}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success} />
          <Text style={styles.badgeText}>Australian Privacy Principles Compliant</Text>
        </View>

        <Section title="1. Introduction">
          <Paragraph>
            TrueProfile Pro ("we", "our", "us", or "Company") operates the TrueProfile Pro mobile application ("App"). This Privacy Policy explains how we collect, use, disclose, and otherwise handle your information when you use our App.
          </Paragraph>
          <Paragraph>
            We are committed to protecting your privacy in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs). This Privacy Policy outlines our privacy practices and your rights.
          </Paragraph>
        </Section>

        <Section title="2. What Personal Information We Collect">
          <Subsection title="2.1 Information You Provide Directly">
            <BulletPoint>Name and email address (during account creation)</BulletPoint>
            <BulletPoint>Business name or organization (if applicable)</BulletPoint>
            <BulletPoint>Purpose of use (immigration consulting, real estate, education, etc.)</BulletPoint>
            <BulletPoint>Charity/non-profit status declaration</BulletPoint>
            <BulletPoint>Contact preferences and notification settings</BulletPoint>
          </Subsection>

          <Subsection title="2.2 Information Collected During App Usage">
            <BulletPoint>Profile URLs you scan (Facebook, Instagram, LinkedIn, Twitter)</BulletPoint>
            <BulletPoint>Scan results and security findings</BulletPoint>
            <BulletPoint>CSV files you upload (Meta Ads lists, prospect lists)</BulletPoint>
            <BulletPoint>API calls and test results</BulletPoint>
            <BulletPoint>Device information (OS, app version, crash reports)</BulletPoint>
            <BulletPoint>Usage analytics (features used, frequency, duration)</BulletPoint>
            <BulletPoint>IP address and location (at state level, not precise)</BulletPoint>
            <BulletPoint>Phone numbers you enter for scam checks (e.g., Call Protection lookup)</BulletPoint>
            <BulletPoint>Optional notes you provide about suspicious calls (what the caller said)</BulletPoint>
          </Subsection>

          <Subsection title="2.5 Call Protection & Phone Numbers (Important)">
            <Paragraph>
              ScamVigil includes Call Protection features designed to help you identify and report scam callers.
              We do not record your phone calls.
            </Paragraph>
            <Paragraph>
              Depending on which features you enable and your device platform:
            </Paragraph>
            <BulletPoint>
              We may process phone numbers you manually enter or paste into the App (for lookup and scam analysis).
            </BulletPoint>
            <BulletPoint>
              If you choose to report a scam number, we store the reported number and report details in our community database.
              We use this to protect other users.
            </BulletPoint>
            <BulletPoint>
              On Android, some advanced real-time protection features may require additional permissions (such as phone state or call log access).
              If requested, these permissions are optional and can be disabled at any time in your device settings.
            </BulletPoint>
            <BulletPoint>
              On iOS, system-level caller identification (where available) requires you to enable Apple Call Blocking & Identification settings.
            </BulletPoint>
            <Paragraph style={{ marginTop: spacing.sm }}>
              We minimise data collection: we only collect what we need to provide scam detection and community safety.
              We do not sell phone number data to third parties.
            </Paragraph>
          </Subsection>

          <Subsection title="2.3 Information from Third Parties">
            <BulletPoint>Abstract API - phone and email validation data</BulletPoint>
            <BulletPoint>Google Safe Browsing - malicious link detection</BulletPoint>
            <BulletPoint>Google Cloud Vision - image analysis results</BulletPoint>
            <BulletPoint>ACCC Scamwatch - reported scam patterns</BulletPoint>
          </Subsection>

          <Subsection title="2.4 Automated Information">
            <BulletPoint>Cookies and local storage (authentication, preferences)</BulletPoint>
            <BulletPoint>Pixel tracking (app analytics, engagement)</BulletPoint>
            <BulletPoint>Error and crash reports (if you consent)</BulletPoint>
          </Subsection>
        </Section>

        <Section title="3. How We Use Your Information">
          <BulletPoint>To provide, maintain, and improve the App and our services</BulletPoint>
          <BulletPoint>To create and manage your account</BulletPoint>
          <BulletPoint>To process scanning requests and security analysis</BulletPoint>
          <BulletPoint>To send you product updates, newsletters, and marketing (with consent)</BulletPoint>
          <BulletPoint>To monitor App performance and detect fraud</BulletPoint>
          <BulletPoint>To comply with legal obligations (e.g., reporting to ACMA, eSafety Commissioner)</BulletPoint>
          <BulletPoint>To respond to your inquiries and provide customer support</BulletPoint>
          <BulletPoint>To generate anonymized analytics and research</BulletPoint>
        </Section>

        <Section title="4. Data Retention Policy">
          <Subsection title="4.1 Scan History">
            <Paragraph>
              Your individual scan records are retained for 7 days to help you track scam detection trends and patterns.
              After 7 days, detailed scan data is automatically deleted from our systems.
            </Paragraph>
          </Subsection>

          <Subsection title="4.2 Account Information">
            <Paragraph>
              Your account profile (name, email, business info) is retained for as long as your account is active.
              If you delete your account, your personal information is purged within 30 days.
            </Paragraph>
          </Subsection>

          <Subsection title="4.3 Analytics & Aggregated Data">
            <Paragraph>
              We retain anonymized, aggregated analytics data (trends, patterns, non-identifiable insights) indefinitely
              to improve our service and research scam patterns in Australia.
            </Paragraph>
          </Subsection>

          <Subsection title="4.4 Legal Obligations">
            <Paragraph>
              We may retain certain data longer if required by Australian law or to respond to regulatory requests
              from ACMA, eSafety Commissioner, or law enforcement.
            </Paragraph>
          </Subsection>
        </Section>

        <Section title="5. Information Sharing & Disclosure">
          <Subsection title="5.1 Third-Party Service Providers">
            <Paragraph>
              We share necessary data with third-party providers to deliver our service:
            </Paragraph>
            <BulletPoint>Abstract API - for phone and email validation</BulletPoint>
            <BulletPoint>Google - for Safe Browsing and Cloud Vision</BulletPoint>
            <BulletPoint>Convex - for secure database storage</BulletPoint>
            <BulletPoint>Analytics providers - for app performance tracking</BulletPoint>
            <Paragraph style={{ marginTop: spacing.sm }}>
              All providers are required to maintain strict confidentiality and data protection.
            </Paragraph>
          </Subsection>

          <Subsection title="5.2 Legal Requests">
            <Paragraph>
              We may disclose information if required by Australian law, court order, or government request from ACMA,
              AFP, eSafety Commissioner, or state police.
            </Paragraph>
          </Subsection>

          <Subsection title="5.3 Business Transfers">
            <Paragraph>
              If we merge, acquire, or sell assets, your information may be transferred as part of that transaction.
              We will provide notice of any change in ownership or control of your personal information.
            </Paragraph>
          </Subsection>

          <Subsection title="5.4 What We Don't Share">
            <Paragraph>
              We do NOT sell, rent, or trade your personal information to third parties for marketing purposes.
              We do NOT share API keys or authentication credentials.
            </Paragraph>
          </Subsection>
        </Section>

        <Section title="6. User Consent for Scanning">
          <Paragraph>
            By using TrueProfile Pro to scan profiles, you represent that:
          </Paragraph>
          <BulletPoint>You have the right to scan the profiles you submit</BulletPoint>
          <BulletPoint>You consent to our collection and analysis of profile data</BulletPoint>
          <BulletPoint>You acknowledge that scans may retrieve public information</BulletPoint>
          <BulletPoint>You will not use TrueProfile Pro for illegal purposes (phishing, stalking, harassment)</BulletPoint>
          <BulletPoint>You understand scan results are pattern-based and not 100% accurate</BulletPoint>
          <Paragraph>
            For bulk CSV uploads (Meta Ads lists), you confirm that you have obtained necessary consent from individuals
            whose data is included in the upload.
          </Paragraph>
        </Section>

        <Section title="7. Cookies & Tracking">
          <Subsection title="7.1 Local Storage">
            <Paragraph>
              We use local device storage to remember:
            </Paragraph>
            <BulletPoint>Your authentication token (securely)</BulletPoint>
            <BulletPoint>Your app preferences (notifications, theme)</BulletPoint>
            <BulletPoint>Cached scan history (for offline access)</BulletPoint>
          </Subsection>

          <Subsection title="7.2 Analytics Tracking">
            <Paragraph>
              We use anonymized analytics to track:
            </Paragraph>
            <BulletPoint>Features used and frequency</BulletPoint>
            <BulletPoint>Crash reports and errors</BulletPoint>
            <BulletPoint>App performance metrics</BulletPoint>
            <Paragraph style={{ marginTop: spacing.sm }}>
              This data is collected in an anonymized, non-personally identifiable manner to improve the App experience.
            </Paragraph>
          </Subsection>

          <Subsection title="7.3 Third-Party Analytics">
            <Paragraph>
              We may use third-party analytics (e.g., Google Analytics, PostHog) to understand how users interact with
              our App. These services have their own privacy policies.
            </Paragraph>
          </Subsection>

          <Subsection title="7.4 Opting Out">
            <Paragraph>
              You can disable analytics tracking in Settings → Data & Privacy → Tracking Preferences.
              Note: Disabling tracking may affect our ability to provide support and fix issues.
            </Paragraph>
          </Subsection>
        </Section>

        <Section title="8. Security & Data Protection">
          <Paragraph>
            We implement industry-standard security measures to protect your information:
          </Paragraph>
          <BulletPoint>TLS/SSL encryption for all data in transit</BulletPoint>
          <BulletPoint>Encrypted storage of sensitive data (API keys, passwords)</BulletPoint>
          <BulletPoint>Regular security audits and vulnerability testing</BulletPoint>
          <BulletPoint>Multi-factor authentication (MFA) available</BulletPoint>
          <BulletPoint>Secure database hosting on Convex (AWS-backed, SOC 2 compliant)</BulletPoint>
          <BulletPoint>Strict access controls and employee training</BulletPoint>
          <Paragraph style={{ marginTop: spacing.sm }}>
            While we implement strong security, no system is 100% secure. If you believe your data has been compromised,
            please contact us immediately at privacy@trueprofilepro.com.au.
          </Paragraph>
        </Section>

        <Section title="9. Your Privacy Rights (APPs)">
          <Subsection title="9.1 Right to Access">
            <Paragraph>
              You have the right to request a copy of personal information we hold about you. Submit requests via:
              Settings → Data & Privacy → Export My Data or email privacy@trueprofilepro.com.au.
            </Paragraph>
          </Subsection>

          <Subsection title="9.2 Right to Correct">
            <Paragraph>
              You can update your profile information in Settings → Account at any time. If you need help correcting
              inaccurate data, contact us at privacy@trueprofilepro.com.au.
            </Paragraph>
          </Subsection>

          <Subsection title="9.3 Right to Delete">
            <Paragraph>
              You can request deletion of your account and all personal information. Go to Settings → Data & Privacy →
              Delete Account. Upon deletion, all data is permanently removed within 30 days.
            </Paragraph>
          </Subsection>

          <Subsection title="9.4 Right to Opt-Out">
            <Paragraph>
              You can opt out of marketing emails and push notifications in Settings → Notifications at any time.
            </Paragraph>
          </Subsection>

          <Subsection title="9.5 Right to Complain">
            <Paragraph>
              If you believe we've violated your privacy rights, you can lodge a complaint with the Office of the
              Australian Information Commissioner (OAIC) at www.oaic.gov.au or call 1300 363 992.
            </Paragraph>
          </Subsection>
        </Section>

        <Section title="10. Children's Privacy">
          <Paragraph>
            TrueProfile Pro is not intended for users under 13 years old. We do not knowingly collect personal
            information from children under 13. If we discover we have collected such information, we will delete it
            immediately.
          </Paragraph>
          <Paragraph>
            Parents who believe their child has provided information to us should contact us at privacy@trueprofilepro.com.au.
          </Paragraph>
        </Section>

        <Section title="11. International Data Transfers">
          <Paragraph>
            Your data is primarily stored in Australian data centers. However, some third-party services (Google, Abstract API)
            may process data internationally. These transfers comply with APP 1 and our contracts require equivalent privacy protections.
          </Paragraph>
        </Section>

        <Section title="12. Changes to This Policy">
          <Paragraph>
            We may update this Privacy Policy from time to time. Changes will be posted in the App and on our website.
            Your continued use of the App constitutes acceptance of updated terms.
          </Paragraph>
        </Section>

        <Section title="13. Contact Us">
          <Paragraph>
            If you have questions about this Privacy Policy or our privacy practices:
          </Paragraph>
          <BulletPoint>Email: privacy@trueprofilepro.com.au</BulletPoint>
          <BulletPoint>Phone: 1800 TrueProfile (1800 878 377)</BulletPoint>
          <BulletPoint>Mail: Privacy Officer, TrueProfile Pro, 123 Innovation St, Sydney NSW 2000, Australia</BulletPoint>
          <Paragraph style={{ marginTop: spacing.sm }}>
            We will respond to privacy inquiries within 30 days.
          </Paragraph>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last Updated: January 2025
          </Text>
          <Text style={styles.footerText}>
            Effective Date: January 2025
          </Text>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxxl,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "15",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  badgeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: "600",
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    fontWeight: "700",
  },
  subsection: {
    marginBottom: spacing.lg,
  },
  subsectionTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  bulletContainer: {
    flexDirection: "row",
    marginBottom: spacing.sm,
    marginLeft: spacing.md,
  },
  bullet: {
    ...typography.body,
    color: colors.primary,
    marginRight: spacing.md,
    lineHeight: 22,
  },
  bulletText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
  footer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.xxl,
    alignItems: "center",
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginVertical: 2,
  },
});