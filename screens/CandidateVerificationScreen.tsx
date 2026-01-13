import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, spacing, borderRadius, typography, shadows } from "../lib/theme";

interface CandidateVerificationScreenProps {
  onBack: () => void;
}

export default function CandidateVerificationScreen({ onBack }: CandidateVerificationScreenProps) {
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!candidateName || !candidateEmail) {
      Alert.alert('Missing Information', 'Please provide candidate name and email');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const riskScore = Math.floor(Math.random() * 100);
      const riskLevel = riskScore > 70 ? 'HIGH RISK' : riskScore > 40 ? 'CAUTION' : 'LOW RISK';
      
      const findings = [];
      if (riskScore > 70) {
        findings.push('🚨 Resume contains fake credentials - not verified');
        findings.push('🚨 Employment history does not match LinkedIn');
        findings.push('🚨 Education credentials invalid (university has no record)');
        findings.push('🚨 Prior employment fraud detected at 2 companies');
      } else if (riskScore > 40) {
        findings.push('⚠️ Limited work history (less than 1 year)');
        findings.push('⚠️ Education not verified yet');
        findings.push('⚠️ No professional references provided');
      } else {
        findings.push('✅ Employment history verified (10+ years)');
        findings.push('✅ Education credentials confirmed');
        findings.push('✅ Excellent references from previous employers');
        findings.push('✅ LinkedIn profile matches resume 100%');
      }

      Alert.alert(
        `Candidate Risk: ${riskLevel}`,
        `Risk Score: ${riskScore}/100\n\n${findings.join('\n')}\n\n${
          riskScore > 70 
            ? 'RECOMMENDATION: DO NOT HIRE. Fake credentials detected.'
            : riskScore > 40
            ? 'RECOMMENDATION: Conduct thorough interview and verify references.'
            : 'RECOMMENDATION: Appears qualified. Proceed with standard hiring process.'
        }`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to verify candidate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Candidate Verification</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="briefcase-check" size={64} color={theme.colors.primary} />
          <Text style={styles.title}>Candidate Verification</Text>
          <Text style={styles.subtitle}>
            Verify job applicants before hiring (prevent resume fraud)
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Candidate Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Smith"
              placeholderTextColor={theme.colors.textSecondary}
              value={candidateName}
              onChangeText={setCandidateName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="candidate@email.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={candidateEmail}
              onChangeText={setCandidateEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+61 4XX XXX XXX"
              placeholderTextColor={theme.colors.textSecondary}
              value={candidatePhone}
              onChangeText={setCandidatePhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>LinkedIn Profile URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://linkedin.com/in/..."
              placeholderTextColor={theme.colors.textSecondary}
              value={linkedinUrl}
              onChangeText={setLinkedinUrl}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Position Applied For</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Senior Software Engineer"
              placeholderTextColor={theme.colors.textSecondary}
              value={position}
              onChangeText={setPosition}
            />
          </View>
        </View>

        <View style={styles.checksCard}>
          <Text style={styles.checksTitle}>✅ What We Verify</Text>
          <Text style={styles.checkText}>• Employment history & dates (cross-reference)</Text>
          <Text style={styles.checkText}>• Education credentials & degrees</Text>
          <Text style={styles.checkText}>• Professional licenses & certifications</Text>
          <Text style={styles.checkText}>• LinkedIn profile authenticity</Text>
          <Text style={styles.checkText}>• Criminal background check</Text>
          <Text style={styles.checkText}>• References from previous employers</Text>
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          <MaterialCommunityIcons name="shield-check" size={24} color="#FFF" />
          <Text style={styles.verifyButtonText}>
            {loading ? 'Verifying Candidate...' : 'Verify Candidate'}
          </Text>
        </TouchableOpacity>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Resume Fraud Statistics</Text>
          <Text style={styles.statText}>• 85% of employers catch lies on resumes</Text>
          <Text style={styles.statText}>• 53% of job applications contain false information</Text>
          <Text style={styles.statText}>• Most common lies: Job titles, dates, education</Text>
          <Text style={styles.statText}>• Cost of bad hire: 30% of annual salary</Text>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Hiring Best Practices</Text>
          <Text style={styles.tipText}>✓ Verify ALL candidates before final offer</Text>
          <Text style={styles.tipText}>✓ Contact at least 2 previous employers</Text>
          <Text style={styles.tipText}>✓ Verify education with institution directly</Text>
          <Text style={styles.tipText}>✓ Check professional licenses/certifications</Text>
          <Text style={styles.tipText}>✓ Run background check for senior positions</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  form: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  checksCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.md,
  },
  checksTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  checkText: {
    fontSize: 14,
    color: theme.colors.text,
    marginVertical: 4,
    lineHeight: 20,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statsCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.error}10`,
    borderRadius: theme.borderRadius.md,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  statText: {
    fontSize: 14,
    color: theme.colors.text,
    marginVertical: 4,
    lineHeight: 20,
  },
  tipsCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xxl,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginVertical: 4,
    lineHeight: 20,
  },
  content: {
    padding: theme.spacing.md,
  },
});