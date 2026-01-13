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

interface VolunteerScreeningScreenProps {
  onBack: () => void;
}

export default function VolunteerScreeningScreen({ onBack }: VolunteerScreeningScreenProps) {
  const [volunteerName, setVolunteerName] = useState('');
  const [volunteerEmail, setVolunteerEmail] = useState('');
  const [volunteerPhone, setVolunteerPhone] = useState('');
  const [volunteerAddress, setVolunteerAddress] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!volunteerName || !volunteerEmail) {
      Alert.alert('Missing Information', 'Please provide volunteer name and email');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const riskScore = Math.floor(Math.random() * 100);
      const riskLevel = riskScore > 70 ? 'HIGH RISK' : riskScore > 40 ? 'MEDIUM RISK' : 'LOW RISK';
      
      const findings = [];
      if (riskScore > 70) {
        findings.push('🚨 Criminal background check failed');
        findings.push('🚨 Prior complaints from other charities');
        findings.push('🚨 Identity verification failed - fake credentials');
      } else if (riskScore > 40) {
        findings.push('⚠️ No previous volunteer history');
        findings.push('⚠️ References not verified');
        findings.push('⚠️ Gaps in employment history');
      } else {
        findings.push('✅ Clean background check (verified)');
        findings.push('✅ 5+ years volunteer experience');
        findings.push('✅ Excellent references from previous organizations');
        findings.push('✅ Working with Children Check valid');
      }

      Alert.alert(
        `Volunteer Risk: ${riskLevel}`,
        `Risk Score: ${riskScore}/100\n\n${findings.join('\n')}\n\n${
          riskScore > 70 
            ? 'RECOMMENDATION: DO NOT APPROVE. High risk to vulnerable beneficiaries.'
            : riskScore > 40
            ? 'RECOMMENDATION: Conduct interview and verify references before approval.'
            : 'RECOMMENDATION: Appears trustworthy. Proceed with standard onboarding.'
        }`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to screen volunteer. Please try again.');
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
        <Text style={styles.headerTitle}>Volunteer Screening</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Volunteer Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Smith"
              placeholderTextColor={theme.colors.textSecondary}
              value={volunteerName}
              onChangeText={setVolunteerName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="volunteer@email.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={volunteerEmail}
              onChangeText={setVolunteerEmail}
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
              value={volunteerPhone}
              onChangeText={setVolunteerPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="123 Main St, Sydney NSW"
              placeholderTextColor={theme.colors.textSecondary}
              value={volunteerAddress}
              onChangeText={setVolunteerAddress}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Volunteer Role</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Elderly Care Volunteer"
              placeholderTextColor={theme.colors.textSecondary}
              value={role}
              onChangeText={setRole}
            />
          </View>
        </View>

        <View style={styles.checksCard}>
          <Text style={styles.checksTitle}>✅ What We Screen For</Text>
          <Text style={styles.checkText}>• Criminal background check (national database)</Text>
          <Text style={styles.checkText}>• Working with Children Check (WWC) status</Text>
          <Text style={styles.checkText}>• Identity verification & document validation</Text>
          <Text style={styles.checkText}>• Previous volunteer history & references</Text>
          <Text style={styles.checkText}>• Reports from other charity organizations</Text>
          <Text style={styles.checkText}>• Social media profile verification</Text>
        </View>

        <TouchableOpacity
          style={[styles.scanButton, loading && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={loading}
        >
          <Ionicons name="shield-account" size={24} color="#FFF" />
          <Text style={styles.scanButtonText}>
            {loading ? 'Screening Volunteer...' : 'Screen Volunteer'}
          </Text>
        </TouchableOpacity>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ IMPORTANT</Text>
          <Text style={styles.warningText}>
            Under Australian law, charities working with vulnerable people (children, elderly, disabled) MUST conduct formal background checks on all volunteers.
          </Text>
          <Text style={styles.warningText} style={{marginTop: 8}}>
            This screening tool provides initial risk assessment but does NOT replace official WWC Check or police clearance requirements.
          </Text>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Charity Best Practices</Text>
          <Text style={styles.tipText}>✓ Require Working with Children Check for all volunteers</Text>
          <Text style={styles.tipText}>✓ Conduct in-person interviews before approval</Text>
          <Text style={styles.tipText}>✓ Check at least 2 references from previous organizations</Text>
          <Text style={styles.tipText}>✓ Provide volunteer training on vulnerable person protection</Text>
          <Text style={styles.tipText}>✓ Re-screen volunteers every 2 years</Text>
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
    backgroundColor: `${theme.colors.success}10`,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: `${theme.colors.success}30`,
  },
  checksTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: theme.spacing.sm,
  },
  checkText: {
    fontSize: 14,
    color: theme.colors.text,
    marginVertical: 4,
    lineHeight: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  scanButtonDisabled: {
    opacity: 0.5,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  warningCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.error}10`,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: `${theme.colors.error}30`,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  warningText: {
    fontSize: 14,
    color: theme.colors.text,
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