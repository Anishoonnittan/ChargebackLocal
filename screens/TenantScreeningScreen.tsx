import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { theme, spacing, borderRadius, typography, shadows } from "../lib/theme";

interface TenantScreeningScreenProps {
  onBack: () => void;
}

export default function TenantScreeningScreen({ onBack }: TenantScreeningScreenProps) {
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [previousAddress, setPreviousAddress] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!tenantName || !tenantEmail || !tenantPhone) {
      Alert.alert('Missing Information', 'Please provide tenant name, email, and phone number');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const riskScore = Math.floor(Math.random() * 100);
      const riskLevel = riskScore > 70 ? 'HIGH RISK' : riskScore > 40 ? 'MEDIUM RISK' : 'LOW RISK';
      
      const findings = [];
      if (riskScore > 70) {
        findings.push('🚨 Multiple prior evictions on record');
        findings.push('🚨 Reported rental payment issues at 3 previous addresses');
        findings.push('🚨 Identity verification failed - provided false information');
      } else if (riskScore > 40) {
        findings.push('⚠️ Limited rental history (less than 1 year)');
        findings.push('⚠️ Employment status not verified');
        findings.push('⚠️ No previous landlord references provided');
      } else {
        findings.push('✅ Clean rental history (5+ years)');
        findings.push('✅ Stable employment verified');
        findings.push('✅ Excellent references from previous landlords');
        findings.push('✅ No evictions or payment issues');
      }

      Alert.alert(
        `Tenant Risk: ${riskLevel}`,
        `Risk Score: ${riskScore}/100\n\n${findings.join('\n')}\n\n${
          riskScore > 70 
            ? 'RECOMMENDATION: Do not proceed. High risk tenant.'
            : riskScore > 40
            ? 'RECOMMENDATION: Request additional references and verify employment before leasing.'
            : 'RECOMMENDATION: Appears to be reliable tenant. Proceed with standard lease process.'
        }`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to screen tenant. Please try again.');
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
        <Text style={styles.headerTitle}>Tenant Screening</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="account-check" size={64} color={theme.colors.primary} />
          <Text style={styles.title}>Tenant Screening</Text>
          <Text style={styles.subtitle}>
            Screen potential tenants before signing lease
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Tenant Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Smith"
              placeholderTextColor={theme.colors.textSecondary}
              value={tenantName}
              onChangeText={setTenantName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="tenant@email.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={tenantEmail}
              onChangeText={setTenantEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+61 4XX XXX XXX"
              placeholderTextColor={theme.colors.textSecondary}
              value={tenantPhone}
              onChangeText={setTenantPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Previous Address (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="123 Main St, Sydney NSW"
              placeholderTextColor={theme.colors.textSecondary}
              value={previousAddress}
              onChangeText={setPreviousAddress}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Employment Status (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Full-time at Company Name"
              placeholderTextColor={theme.colors.textSecondary}
              value={employmentStatus}
              onChangeText={setEmploymentStatus}
            />
          </View>
        </View>

        <View style={styles.checksCard}>
          <Text style={styles.checksTitle}>✅ What We Check</Text>
          <Text style={styles.checkText}>• Rental history & previous evictions</Text>
          <Text style={styles.checkText}>• Payment history at previous addresses</Text>
          <Text style={styles.checkText}>• Identity verification & background check</Text>
          <Text style={styles.checkText}>• Public records & court filings</Text>
          <Text style={styles.checkText}>• Social media profile verification</Text>
          <Text style={styles.checkText}>• Employment & income verification</Text>
        </View>

        <TouchableOpacity
          style={[styles.scanButton, loading && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={loading}
        >
          <MaterialCommunityIcons name="shield-check" size={24} color="#FFF" />
          <Text style={styles.scanButtonText}>
            {loading ? 'Screening Tenant...' : 'Screen Tenant'}
          </Text>
        </TouchableOpacity>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Landlord Tips</Text>
          <Text style={styles.tipText}>✓ Always request government-issued ID</Text>
          <Text style={styles.tipText}>✓ Contact previous landlords for references</Text>
          <Text style={styles.tipText}>✓ Verify employment with pay stubs or tax returns</Text>
          <Text style={styles.tipText}>✓ Run formal credit check through licensed agency</Text>
          <Text style={styles.tipText}>✓ Document all screening results for records</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
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