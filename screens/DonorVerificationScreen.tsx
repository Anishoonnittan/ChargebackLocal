import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

interface DonorVerificationScreenProps {
  onBack: () => void;
}

interface VerificationResult {
  donorName: string;
  email: string;
  phone: string;
  donationHistory: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  flags: string[];
  recommendations: string[];
}

export default function DonorVerificationScreen({ onBack }: DonorVerificationScreenProps) {
  const [donorName, setDonorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!donorName || !email) {
      return;
    }

    setIsScanning(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock result
    const mockResult: VerificationResult = {
      donorName,
      email,
      phone,
      donationHistory: Math.floor(Math.random() * 50),
      riskScore: Math.floor(Math.random() * 100),
      riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
      flags: [
        'Email domain recently created (< 30 days)',
        'No previous donation history found',
        'Phone number not verified',
      ].filter(() => Math.random() > 0.5),
      recommendations: [
        'Request additional verification before processing large donations',
        'Send confirmation email with receipt',
        'Monitor for chargeback activity',
      ],
    };

    setResult(mockResult);
    setIsScanning(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return 'alert-circle';
      case 'medium': return 'warning';
      case 'low': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Donor Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
          <Text style={styles.infoBannerText}>
            Verify donor legitimacy to prevent fraud and protect your charity's reputation
          </Text>
        </View>

        {/* Input Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Donor Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Donor Name *</Text>
            <TextInput
              style={styles.input}
              value={donorName}
              onChangeText={setDonorName}
              placeholder="John Smith"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="donor@example.com"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number (Optional)</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+61 4XX XXX XXX"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Donation Amount</Text>
            <TextInput
              style={styles.input}
              value={donationAmount}
              onChangeText={setDonationAmount}
              placeholder="$100"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, (!donorName || !email) && styles.verifyButtonDisabled]}
            onPress={handleVerify}
            disabled={!donorName || !email || isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
                <Text style={styles.verifyButtonText}>Verify Donor</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {result && (
          <>
            {/* Risk Score */}
            <View style={styles.card}>
              <View style={styles.riskHeader}>
                <Ionicons 
                  name={getRiskIcon(result.riskLevel) as any} 
                  size={32} 
                  color={getRiskColor(result.riskLevel)} 
                />
                <View style={styles.riskInfo}>
                  <Text style={styles.riskTitle}>Risk Assessment</Text>
                  <Text style={[styles.riskLevel, { color: getRiskColor(result.riskLevel) }]}>
                    {result.riskLevel.toUpperCase()} RISK
                  </Text>
                </View>
                <View style={styles.riskScoreBadge}>
                  <Text style={styles.riskScoreText}>{result.riskScore}</Text>
                  <Text style={styles.riskScoreLabel}>/ 100</Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${result.riskScore}%`,
                      backgroundColor: getRiskColor(result.riskLevel)
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Donor History */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Donor Profile</Text>
              
              <View style={styles.statRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{result.donationHistory}</Text>
                  <Text style={styles.statLabel}>Previous Donations</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {result.email.includes('.org') || result.email.includes('.com.au') ? 'Yes' : 'No'}
                  </Text>
                  <Text style={styles.statLabel}>Email Verified</Text>
                </View>
              </View>
            </View>

            {/* Red Flags */}
            {result.flags.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="warning" size={20} color={theme.colors.warning} />
                  <Text style={styles.cardTitle}>Red Flags Detected</Text>
                </View>
                {result.flags.map((flag, index) => (
                  <View key={index} style={styles.flagItem}>
                    <Ionicons name="alert-circle-outline" size={18} color={theme.colors.warning} />
                    <Text style={styles.flagText}>{flag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="bulb" size={20} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Recommendations</Text>
              </View>
              {result.recommendations.map((rec, index) => (
                <View key={index} style={styles.recItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.success} />
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.acceptButton}>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.acceptButtonText}>Accept Donation</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton}>
                <Ionicons name="close" size={20} color={theme.colors.error} />
                <Text style={styles.rejectButtonText}>Flag as Suspicious</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Features List */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What We Check:</Text>
          {[
            'Email domain age and legitimacy',
            'Previous donation history',
            'Phone number verification',
            'Payment method validity',
            'Known fraud patterns',
            'Dark web exposure',
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.primary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  verifyButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  riskInfo: {
    flex: 1,
  },
  riskTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: '700',
  },
  riskScoreBadge: {
    alignItems: 'center',
  },
  riskScoreText: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
  },
  riskScoreLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  flagText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  recText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 16,
  },
  acceptButton: {
    backgroundColor: theme.colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  rejectButtonText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  featuresCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.text,
  },
});