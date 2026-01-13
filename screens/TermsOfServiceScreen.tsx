import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "../lib/theme";

/**
 * TrueProfile Pro - Terms of Service Screen
 * Comprehensive legal terms for Australian users
 * Last updated: January 2025
 */

export default function TermsOfServiceScreen({ onClose }: { onClose?: () => void }) {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.badge}>
          <Ionicons name="document-text" size={16} color={colors.primary} />
          <Text style={styles.badgeText}>Australian Consumer Law Compliant</Text>
        </View>

        <Section title="1. Acceptance of Terms">
          <Paragraph>
            By downloading, installing, or using TrueProfile Pro ("App" or "Service"), you agree to be bound by these Terms
            of Service ("Terms"). If you do not agree to any part of these Terms, you must not use the App.
          </Paragraph>
          <Paragraph>
            These Terms are governed by the laws of Australia (in particular, the Australian Consumer Law and ACL 2010). Any
            disputes will be resolved in Australian courts.
          </Paragraph>
        </Section>

        <Section title="2. Eligibility">
          <Paragraph>
            You represent and warrant that:
          </Paragraph>
          <BulletPoint>You are at least 18 years of age (or 13+ with parental consent)</BulletPoint>
          <BulletPoint>You have the legal right to enter into these Terms</BulletPoint>
          <BulletPoint>You are not banned or prohibited from using the Service</BulletPoint>
          <BulletPoint>Your use of the Service is lawful and does not violate any applicable laws</BulletPoint>
        </Section>

        <Section title="3. Use License">
          <Paragraph>
            We grant you a limited, non-exclusive, non-transferable license to use the App for your personal, non-commercial
            purposes in accordance with these Terms. You may not:
          </Paragraph>
          <BulletPoint>Copy, modify, or reverse engineer the App</BulletPoint>
          <BulletPoint>Use the App for any illegal or unauthorized purpose</BulletPoint>
          <BulletPoint>Attempt to gain unauthorized access to the App or its systems</BulletPoint>
          <BulletPoint>Use the App to harm, harass, stalk, or defame any person</BulletPoint>
          <BulletPoint>Use the App for phishing, fraud, or deceptive purposes</BulletPoint>
          <BulletPoint>Resell, sublicense, or distribute the App without written permission</BulletPoint>
          <BulletPoint>Remove or alter any copyright notices or proprietary marks</BulletPoint>
        </Section>

        <Section title="4. Acceptable Use Policy">
          <Paragraph>
            You agree not to use the App for:
          </Paragraph>
          <BulletPoint>Illegal activities (phishing, fraud, identity theft, harassment, blackmail)</BulletPoint>
          <BulletPoint>Violating anyone's privacy, intellectual property, or other legal rights</BulletPoint>
          <BulletPoint>Scanning profiles or uploading information of others without consent</BulletPoint>
          <BulletPoint>Automated scanning or bulk uploading for commercial resale purposes</BulletPoint>
          <BulletPoint>Interfering with App systems, servers, or network infrastructure</BulletPoint>
          <BulletPoint>Distributing malware, viruses, or harmful code</BulletPoint>
          <BulletPoint>Spamming or sending unsolicited communications</BulletPoint>
          <BulletPoint>Exploiting App functionality for unauthorized purposes</BulletPoint>
          <Paragraph>
            We reserve the right to suspend or terminate your account immediately if you violate this policy.
          </Paragraph>
        </Section>

        <Section title="5. Pricing & Billing">
          <Subsection title="5.1 Free Plan">
            <Paragraph>
              The Free plan includes 5 profile scans per calendar month. The free plan may be discontinued or limited at our
              discretion.
            </Paragraph>
          </Subsection>

          <Subsection title="5.2 Paid Plans">
            <Paragraph>
              We offer paid subscription plans (Basic, Pro, Business, Enterprise). By subscribing, you authorize us to charge
              your payment method on the specified billing cycle (monthly or annually).
            </Paragraph>
            <Paragraph>
              Prices are subject to change with 30 days' notice. Price changes will not apply to active subscriptions until
              renewal.
            </Paragraph>
          </Subsection>

          <Subsection title="5.3 Billing Disputes">
            <Paragraph>
              If you dispute a charge, notify us within 7 days. We will investigate and respond within 30 days.
            </Paragraph>
          </Subsection>

          <Subsection title="5.4 Refunds & Cancellation">
            <Paragraph>
              Subscriptions renew automatically. You can cancel anytime in Settings. Refunds are issued within 14 days if you
              cancel before the next billing date. No refunds for partial months.
            </Paragraph>
          </Subsection>
        </Section>

        <Section title="6. Scan Results Disclaimer">
          <Paragraph>
            TrueProfile Pro uses pattern-matching, heuristics, and third-party APIs to assess profile risk. Results are NOT
            100% accurate and should be considered advisory only.
          </Paragraph>
          <Paragraph>
            We do NOT guarantee that:
          </Paragraph>
          <BulletPoint>Profiles marked as "Real" are legitimate (false negatives may occur)</BulletPoint>
          <BulletPoint>Profiles marked as "Suspicious" or "Fake" are actually fraudulent (false positives may occur)</BulletPoint>
          <BulletPoint>Our Trust Score reflects actual trustworthiness</BulletPoint>
          <BulletPoint>Scan results are current or accurate at the time you make a decision</BulletPoint>
          <Paragraph>
            Users are solely responsible for verifying information independently before making any decisions based on scan
            results.
          </Paragraph>
        </Section>

        <Section title="7. User Content & Responsibility">
          <Paragraph>
            By uploading profile URLs or CSV files, you represent and warrant that:
          </Paragraph>
          <BulletPoint>You own or have obtained consent for the data you submit</BulletPoint>
          <BulletPoint>You have the right to scan and analyze the profiles submitted</BulletPoint>
          <BulletPoint>Your use of the Service is lawful and complies with all applicable laws</BulletPoint>
          <BulletPoint>You are not uploading data of children, minors, or vulnerable persons</BulletPoint>
          <Paragraph>
            You remain responsible for any content you upload. We are not liable for any consequences arising from your
            submission of third-party data.
          </Paragraph>
        </Section>

        <Section title="8. Limitation of Liability">
          <Paragraph>
            TO THE MAXIMUM EXTENT PERMITTED BY AUSTRALIAN LAW:
          </Paragraph>
          <Paragraph>
            WE ARE NOT LIABLE FOR:
          </Paragraph>
          <BulletPoint>Indirect, incidental, special, consequential, or punitive damages</BulletPoint>
          <BulletPoint>Loss of profits, revenue, data, reputation, or business opportunities</BulletPoint>
          <BulletPoint>Decisions made by you based on scan results</BulletPoint>
          <BulletPoint>Third-party API failures or inaccuracies</BulletPoint>
          <BulletPoint>Unauthorized access to your account (if you failed to protect your password)</BulletPoint>
          <BulletPoint>Service interruptions or downtime</BulletPoint>
          <Paragraph>
            OUR TOTAL LIABILITY FOR ANY CLAIM SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE PRECEDING 12 MONTHS.
          </Paragraph>
          <Paragraph style={{ marginTop: spacing.sm }}>
            Some jurisdictions do not allow liability limitations. If such a jurisdiction applies to you, the above limitations
            may not apply, but our liability will be limited to the maximum extent permitted by law.
          </Paragraph>
        </Section>

        <Section title="9. Warranty Disclaimer">
          <Paragraph>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND. WE DISCLAIM ALL WARRANTIES,
            EXPRESS OR IMPLIED, INCLUDING:
          </Paragraph>
          <BulletPoint>MERCHANTABILITY</BulletPoint>
          <BulletPoint>FITNESS FOR A PARTICULAR PURPOSE</BulletPoint>
          <BulletPoint>NON-INFRINGEMENT OF INTELLECTUAL PROPERTY RIGHTS</BulletPoint>
          <BulletPoint>ACCURACY, COMPLETENESS, OR TIMELINESS OF RESULTS</BulletPoint>
          <Paragraph>
            We do not warrant that the Service will be uninterrupted, error-free, or free of malware or harmful code.
          </Paragraph>
        </Section>

        <Section title="10. Intellectual Property Rights">
          <Paragraph>
            The App, including all content, code, design, and branding, is owned by TrueProfile Pro or licensed third parties.
            You may not copy, reproduce, modify, or distribute any part of the App without written permission.
          </Paragraph>
          <Paragraph>
            "TrueProfile Pro", the logo, and all associated branding are trademarks of TrueProfile Pro. Unauthorized use is
            prohibited.
          </Paragraph>
        </Section>

        <Section title="11. Suspension & Termination">
          <Paragraph>
            We may suspend or terminate your account immediately if you:
          </Paragraph>
          <BulletPoint>Violate these Terms or any applicable law</BulletPoint>
          <BulletPoint>Engage in fraudulent or deceptive conduct</BulletPoint>
          <BulletPoint>Harass, harm, or defame any person</BulletPoint>
          <BulletPoint>Attempt to hack, breach, or interfere with the App</BulletPoint>
          <BulletPoint>Fail to pay subscription fees</BulletPoint>
          <Paragraph>
            Upon termination, your access to the App will be revoked immediately. No refunds will be issued for partial months.
          </Paragraph>
        </Section>

        <Section title="12. Dispute Resolution & Complaints">
          <Subsection title="12.1 Informal Resolution">
            <Paragraph>
              If you have a complaint, please contact us at support@trueprofilepro.com.au with details. We will respond within
              14 days and attempt to resolve the issue.
            </Paragraph>
          </Subsection>

          <Subsection title="12.2 Dispute Resolution">
            <Paragraph>
              If we cannot resolve your complaint informally, either party may pursue legal action in the Australian courts.
            </Paragraph>
          </Subsection>

          <Subsection title="12.3 Australian Consumer Law">
            <Paragraph>
              Nothing in these Terms excludes, restricts, or modifies any rights granted to you under the Australian Consumer
              Law (ACL). Our liability for goods or services that are not of a kind ordinarily acquired for personal or
              domestic consumption will be limited to the maximum extent permitted by the ACL.
            </Paragraph>
          </Subsection>
        </Section>

        <Section title="13. Third-Party Links & Services">
          <Paragraph>
            The App may contain links to third-party websites and APIs (Google, Abstract, etc.). We are not responsible for:
          </Paragraph>
          <BulletPoint>Content, accuracy, or availability of third-party services</BulletPoint>
          <BulletPoint>Third-party privacy policies or terms of service</BulletPoint>
          <BulletPoint>Any damages or losses arising from third-party services</BulletPoint>
          <Paragraph>
            Your use of third-party services is at your own risk and subject to their terms.
          </Paragraph>
        </Section>

        <Section title="14. Indemnification">
          <Paragraph>
            You agree to indemnify and hold harmless TrueProfile Pro, its owners, employees, and representatives from any
            claims, damages, liabilities, and expenses (including legal fees) arising from:
          </Paragraph>
          <BulletPoint>Your violation of these Terms</BulletPoint>
          <BulletPoint>Your violation of any applicable law</BulletPoint>
          <BulletPoint>Your misuse of the App</BulletPoint>
          <BulletPoint>Content you upload or submit</BulletPoint>
          <BulletPoint>Any claim by a third party related to your use of the App</BulletPoint>
        </Section>

        <Section title="15. Amendments">
          <Paragraph>
            We may update these Terms at any time. Changes will be posted in the App. Your continued use of the App after
            updates constitutes acceptance of the new Terms.
          </Paragraph>
        </Section>

        <Section title="16. Severability">
          <Paragraph>
            If any provision of these Terms is found to be invalid or unenforceable, that provision will be severed, and the
            remaining provisions will remain in effect to the fullest extent possible.
          </Paragraph>
        </Section>

        <Section title="17. Contact Information">
          <Paragraph>
            For questions about these Terms, complaints, or support:
          </Paragraph>
          <BulletPoint>Email: support@trueprofilepro.com.au</BulletPoint>
          <BulletPoint>Phone: 1800 TrueProfile (1800 878 377)</BulletPoint>
          <BulletPoint>Mail: Legal Team, TrueProfile Pro, 123 Innovation St, Sydney NSW 2000, Australia</BulletPoint>
          <Paragraph style={{ marginTop: spacing.sm }}>
            We will respond to inquiries within 14 days.
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
    color: colors.primary,
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