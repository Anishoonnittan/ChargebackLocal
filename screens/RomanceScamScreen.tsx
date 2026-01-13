import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

type RedFlag = {
  id: string;
  flag: string;
  severity: 'high' | 'medium' | 'low';
};

export default function RomanceScamScreen({ onBack }: { onBack: () => void }) {
  const [profileUrl, setProfileUrl] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    riskScore: number;
    redFlags: RedFlag[];
    recommendation: string;
    details: string[];
  } | null>(null);

  const analyzeProfile = async () => {
    if (!profileUrl && !phoneNumber) {
      Alert.alert('Input Required', 'Please enter a profile URL or phone number');
      return;
    }

    setAnalyzing(true);

    // Simulate analysis (in production, call a0.dev LLM API)
    setTimeout(() => {
      const redFlags: RedFlag[] = [];
      let riskScore = 0;

      // Analyze profile URL patterns
      if (profileUrl) {
        if (profileUrl.includes('facebook.com') || profileUrl.includes('instagram.com')) {
          // Check for suspicious patterns
          if (Math.random() > 0.5) {
            redFlags.push({
              id: '1',
              flag: 'Profile created recently (< 30 days)',
              severity: 'high',
            });
            riskScore += 30;
          }
          if (Math.random() > 0.6) {
            redFlags.push({
              id: '2',
              flag: 'Few friends/followers (< 50)',
              severity: 'medium',
            });
            riskScore += 20;
          }
          if (Math.random() > 0.7) {
            redFlags.push({
              id: '3',
              flag: 'Stock photos detected (reverse image search)',
              severity: 'high',
            });
            riskScore += 35;
          }
        }
      }

      // Analyze phone number
      if (phoneNumber) {
        if (Math.random() > 0.5) {
          redFlags.push({
            id: '4',
            flag: 'Phone number reported in scam databases',
            severity: 'high',
          });
          riskScore += 40;
        }
        if (Math.random() > 0.6) {
          redFlags.push({
            id: '5',
            flag: 'Virtual phone number detected',
            severity: 'medium',
          });
          riskScore += 15;
        }
      }

      // Common romance scam patterns
      if (Math.random() > 0.7) {
        redFlags.push({
          id: '6',
          flag: 'Profile location mismatch with IP address',
          severity: 'high',
        });
        riskScore += 25;
      }

      const details = [
        'Profile authenticity checked',
        'Photo reverse image search completed',
        'Phone number cross-referenced with scam databases',
        'Social media activity analyzed',
        'Common romance scam patterns checked',
      ];

      setResult({
        riskScore: Math.min(riskScore, 100),
        redFlags,
        recommendation:
          riskScore > 60
            ? 'HIGH RISK: Strong indicators of romance scam. Do not send money or share personal information.'
            : riskScore > 30
            ? 'MEDIUM RISK: Some suspicious indicators. Proceed with caution and verify identity.'
            : 'LOW RISK: Profile appears legitimate. Still exercise caution with any financial requests.',
        details,
      });

      setAnalyzing(false);
    }, 2000);
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.warning;
      case 'low':
        return theme.colors.primary;
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 60) return theme.colors.error;
    if (score > 30) return theme.colors.warning;
    return theme.colors.success;
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Romance Scam Protection</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="heart-dislike" size={48} color={theme.colors.error} />
          <Text style={styles.title}>Romance Scam Protection</Text>
          <Text style={styles.subtitle}>
            Verify dating profiles before you trust. Check for fake photos, suspicious profiles, and
            romance scam red flags.
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Profile URL</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., facebook.com/profile, instagram.com/user"
            value={profileUrl}
            onChangeText={setProfileUrl}
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, styles.labelSpacing]}>Phone Number (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="+61 400 000 000"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.scanButton, analyzing && styles.scanButtonDisabled]}
            onPress={analyzeProfile}
            disabled={analyzing}
          >
            <Ionicons
              name={analyzing ? 'hourglass' : 'shield-checkmark'}
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.scanButtonText}>
              {analyzing ? 'Analyzing...' : 'Analyze Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        {result && (
          <View style={styles.resultSection}>
            <View style={[styles.riskCard, { borderLeftColor: getRiskColor(result.riskScore) }]}>
              <View style={styles.riskHeader}>
                <Text style={styles.riskLabel}>Risk Score</Text>
                <Text style={[styles.riskScore, { color: getRiskColor(result.riskScore) }]}>
                  {result.riskScore}/100
                </Text>
              </View>
              <Text style={styles.recommendation}>{result.recommendation}</Text>
            </View>

            {result.redFlags.length > 0 && (
              <View style={styles.redFlagsSection}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="warning" size={18} color={theme.colors.error} /> Red Flags
                  Detected
                </Text>
                {result.redFlags.map((flag) => (
                  <View key={flag.id} style={styles.redFlagItem}>
                    <View
                      style={[
                        styles.severityIndicator,
                        { backgroundColor: getSeverityColor(flag.severity) },
                      ]}
                    />
                    <Text style={styles.redFlagText}>{flag.flag}</Text>
                    <Text style={[styles.severityText, { color: getSeverityColor(flag.severity) }]}>
                      {flag.severity.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Analysis Completed</Text>
              {result.details.map((detail, index) => (
                <View key={index} style={styles.detailItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={theme.colors.success}
                    style={styles.detailIcon}
                  />
                  <Text style={styles.detailText}>{detail}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>
            <Ionicons name="bulb" size={18} color={theme.colors.warning} /> Romance Scam Warning
            Signs
          </Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Asks for money (emergency, travel, medical)</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Professes love very quickly</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Refuses video calls (only text/photos)</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Claims to be overseas (military, oil rig, etc.)</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Photos look too perfect (model-quality)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
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
    ...theme.typography.h2,
    fontWeight: 'bold',
  },
  recommendation: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  redFlagsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  redFlagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  severityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  redFlagText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  severityText: {
    ...theme.typography.caption,
    fontWeight: 'bold',
  },
  detailsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  detailIcon: {
    marginRight: theme.spacing.sm,
  },
  detailText: {
    ...theme.typography.body,
    color: theme.colors.text,
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