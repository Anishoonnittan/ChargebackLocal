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

interface ContractorVettingScreenProps {
  onBack: () => void;
}

interface VettingResult {
  contractorName: string;
  abn: string;
  phone: string;
  email: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  licenses: string[];
  insurance: boolean;
  reviews: number;
  rating: number;
  flags: string[];
  recommendations: string[];
}

export default function ContractorVettingScreen({ onBack }: ContractorVettingScreenProps) {
  const [contractorName, setContractorName] = useState('');
  const [abn, setAbn] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<VettingResult | null>(null);

  const handleVet = async () => {
    if (!contractorName || (!abn && !phone)) {
      return;
    }

    setIsScanning(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Mock result
    const mockResult: VettingResult = {
      contractorName,
      abn: abn || '12 345 678 901',
      phone,
      email,
      riskScore: Math.floor(Math.random() * 100),
      riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
      licenses: ['Building License NSW', 'Electrical License'],
      insurance: Math.random() > 0.3,
      reviews: Math.floor(Math.random() * 100),
      rating: (Math.random() * 2 + 3).toFixed(1) as any,
      flags: [
        'Multiple recent complaints to Fair Trading',
        'No public liability insurance found',
        'ABN registered less than 6 months ago',
        'Phone number associated with previous scam reports',
      ].filter(() => Math.random() > 0.6),
      recommendations: [
        'Request proof of insurance before work begins',
        'Get written quotes from at least 2 other contractors',
        'Never pay full amount upfront',
        'Check references from previous customers',
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
        <Text style={styles.headerTitle}>Contractor Vetting</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="construct" size={24} color={theme.colors.primary} />
          <Text style={styles.infoBannerText}>
            Verify contractors before hiring to avoid scams and dodgy work
          </Text>
        </View>

        {/* Input Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contractor Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business/Contractor Name *</Text>
            <TextInput
              style={styles.input}
              value={contractorName}
              onChangeText={setContractorName}
              placeholder="ABC Plumbing Services"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ABN (Australian Business Number)</Text>
            <TextInput
              style={styles.input}
              value={abn}
              onChangeText={setAbn}
              placeholder="12 345 678 901"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
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
            <Text style={styles.label}>Email Address (Optional)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="contractor@example.com"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.vetButton, (!contractorName || (!abn && !phone)) && styles.vetButtonDisabled]}
            onPress={handleVet}
            disabled={!contractorName || (!abn && !phone) || isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
                <Text style={styles.vetButtonText}>Vet Contractor</Text>
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
                  <Text style={styles.riskTitle}>Trust Score</Text>
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

            {/* Credentials */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Credentials & Verification</Text>
              
              <View style={styles.credentialRow}>
                <View style={styles.credentialItem}>
                  <Ionicons 
                    name={result.insurance ? "shield-checkmark" : "close-circle"} 
                    size={24} 
                    color={result.insurance ? theme.colors.success : theme.colors.error} 
                  />
                  <Text style={styles.credentialLabel}>Insurance</Text>
                  <Text style={[
                    styles.credentialValue,
                    { color: result.insurance ? theme.colors.success : theme.colors.error }
                  ]}>
                    {result.insurance ? 'Verified' : 'Not Found'}
                  </Text>
                </View>

                <View style={styles.credentialItem}>
                  <Ionicons 
                    name="star" 
                    size={24} 
                    color={theme.colors.warning} 
                  />
                  <Text style={styles.credentialLabel}>Rating</Text>
                  <Text style={styles.credentialValue}>
                    {result.rating} / 5.0
                  </Text>
                </View>

                <View style={styles.credentialItem}>
                  <Ionicons 
                    name="chatbox-ellipses" 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                  <Text style={styles.credentialLabel}>Reviews</Text>
                  <Text style={styles.credentialValue}>
                    {result.reviews}
                  </Text>
                </View>
              </View>

              <View style={styles.licensesSection}>
                <Text style={styles.licensesTitle}>Licenses:</Text>
                {result.licenses.map((license, index) => (
                  <View key={index} style={styles.licenseItem}>
                    <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                    <Text style={styles.licenseText}>{license}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Red Flags */}
            {result.flags.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="warning" size={20} color={theme.colors.warning} />
                  <Text style={styles.cardTitle}>Red Flags</Text>
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
              <TouchableOpacity style={styles.trustButton}>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.trustButtonText}>Add to Trusted List</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reportButton}>
                <Ionicons name="flag" size={20} color={theme.colors.error} />
                <Text style={styles.reportButtonText}>Report Scam</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Features List */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What We Check:</Text>
          {[
            'ABN lookup & business registration',
            'Professional licenses & certifications',
            'Public liability insurance',
            'Customer reviews & ratings',
            'Complaints to Fair Trading NSW',
            'Previous scam reports',
            'Social media presence',
            'Business longevity',
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
  vetButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  vetButtonDisabled: {
    opacity: 0.5,
  },
  vetButtonText: {
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
  credentialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  credentialItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
  },
  credentialLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  credentialValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  licensesSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  licensesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  licenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  licenseText: {
    fontSize: 14,
    color: theme.colors.text,
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
  trustButton: {
    backgroundColor: theme.colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  trustButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
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
  reportButtonText: {
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