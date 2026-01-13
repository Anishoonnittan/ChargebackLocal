import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";

interface BECProtectionScreenProps {
  onBack: () => void;
}

export default function BECProtectionScreen({ onBack }: BECProtectionScreenProps) {
  const [emailContent, setEmailContent] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    riskScore: number;
    isBEC: boolean;
    warnings: string[];
    recommendation: string;
  } | null>(null);

  const analyzeEmail = async () => {
    if (!emailContent) {
      Alert.alert('Input Required', 'Please paste the email content');
      return;
    }

    setAnalyzing(true);

    // Simulate analysis
    setTimeout(() => {
      const warnings: string[] = [];
      let riskScore = 0;

      // Check for urgency language
      if (
        emailContent.toLowerCase().includes('urgent') ||
        emailContent.toLowerCase().includes('immediate')
      ) {
        warnings.push('Urgency language detected ("urgent", "immediate")');
        riskScore += 25;
      }

      // Check for wire transfer requests
      if (
        emailContent.toLowerCase().includes('wire') ||
        emailContent.toLowerCase().includes('transfer')
      ) {
        warnings.push('Wire transfer request detected');
        riskScore += 30;
      }

      // Check for CEO/Executive impersonation
      if (
        emailContent.toLowerCase().includes('ceo') ||
        emailContent.toLowerCase().includes('executive')
      ) {
        warnings.push('Executive impersonation suspected');
        riskScore += 35;
      }

      // Check sender domain
      if (senderEmail && !senderEmail.includes('@yourcompany.com')) {
        warnings.push('Email from external domain (not @yourcompany.com)');
        riskScore += 20;
      }

      // Check for misspellings in domain
      if (senderEmail && (senderEmail.includes('gmai1') || senderEmail.includes('outl00k'))) {
        warnings.push('Suspicious domain spelling detected');
        riskScore += 40;
      }

      setResult({
        riskScore: Math.min(riskScore, 100),
        isBEC: riskScore > 50,
        warnings,
        recommendation:
          riskScore > 70
            ? 'HIGH RISK BEC: Do NOT send money. Call sender directly to verify.'
            : riskScore > 40
            ? 'MEDIUM RISK: Verify request through another communication channel.'
            : 'LOW RISK: Email appears legitimate but always verify large requests.',
      });

      setAnalyzing(false);
    }, 2000);
  };

  const getRiskColor = (score: number) => {
    if (score > 70) return theme.colors.error;
    if (score > 40) return theme.colors.warning;
    return theme.colors.success;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BEC Protection</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={24} color={theme.colors.error} />
          <Text style={styles.warningText}>
            BEC scams cost businesses $30B+ annually. Always verify wire transfer requests by phone.
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Sender Email</Text>
          <TextInput
            style={styles.input}
            placeholder="sender@email.com"
            value={senderEmail}
            onChangeText={setSenderEmail}
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={[styles.label, styles.labelSpacing]}>Email Content</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Paste the email content here..."
            value={emailContent}
            onChangeText={setEmailContent}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.scanButton, analyzing && styles.scanButtonDisabled]}
            onPress={analyzeEmail}
            disabled={analyzing}
          >
            <Ionicons
              name={analyzing ? 'hourglass' : 'search'}
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.scanButtonText}>
              {analyzing ? 'Analyzing...' : 'Analyze for BEC'}
            </Text>
          </TouchableOpacity>
        </View>

        {result && (
          <View style={styles.resultSection}>
            <View style={[styles.riskCard, { borderLeftColor: getRiskColor(result.riskScore) }]}>
              <View style={styles.riskHeader}>
                <Text style={styles.riskLabel}>BEC Risk Score</Text>
                <Text style={[styles.riskScore, { color: getRiskColor(result.riskScore) }]}>
                  {result.riskScore}/100
                </Text>
              </View>
              {result.isBEC && (
                <View style={styles.becAlert}>
                  <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                  <Text style={styles.becAlertText}>LIKELY BEC SCAM</Text>
                </View>
              )}
              <Text style={styles.recommendation}>{result.recommendation}</Text>
            </View>

            {result.warnings.length > 0 && (
              <View style={styles.warningsSection}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="warning" size={18} color={theme.colors.error} /> Red Flags
                </Text>
                {result.warnings.map((warning, index) => (
                  <View key={index} style={styles.warningItem}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={theme.colors.error}
                      style={styles.warningIcon}
                    />
                    <Text style={styles.warningItemText}>{warning}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>
            <Ionicons name="bulb" size={18} color={theme.colors.warning} /> BEC Warning Signs
          </Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Urgent wire transfer requests</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Email from "CEO" with unusual request</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Slight misspellings in email domain</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Requests to bypass normal procedures</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  warningBanner: {
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  warningText: {
    ...theme.typography.body,
    color: theme.colors.error,
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  inputSection: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  labelSpacing: {
    marginTop: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: 150,
  },
  scanButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: theme.spacing.sm,
  },
  scanButtonText: {
    ...theme.typography.bodyBold,
    color: '#fff',
  },
  resultSection: {
    marginBottom: theme.spacing.xl,
  },
  riskCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    marginBottom: theme.spacing.lg,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  riskLabel: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  },
  riskScore: {
    ...theme.typography.h1,
    fontWeight: 'bold',
  },
  becAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorLight,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  becAlertText: {
    ...theme.typography.bodyBold,
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
  },
  recommendation: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  warningsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  warningIcon: {
    marginRight: theme.spacing.sm,
  },
  warningItemText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  tipsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  tipsTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.xs,
  },
  tipBullet: {
    ...theme.typography.body,
    color: theme.colors.warning,
    marginRight: theme.spacing.sm,
    fontWeight: 'bold',
  },
  tipText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
});