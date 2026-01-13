import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  viewer: any;
  sessionToken: string;
}

const { width } = Dimensions.get('window');

export default function OnboardingWizardScreen({ viewer, sessionToken }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('https://your-deployment.convex.site/webhooks/shopify');
  const [testScanCompleted, setTestScanCompleted] = useState(false);
  const [teamEmail, setTeamEmail] = useState('');

  const totalSteps = 5;

  const platforms = [
    { id: 'shopify', name: 'Shopify', icon: 'bag-handle', color: '#96BF48' },
    { id: 'stripe', name: 'Stripe', icon: 'card', color: '#635BFF' },
    { id: 'woocommerce', name: 'WooCommerce', icon: 'cart', color: '#96588A' },
    { id: 'square', name: 'Square', icon: 'square', color: '#000000' },
  ];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finish onboarding
      Alert.alert('Success!', 'Your ChargebackShield is ready to protect your revenue!');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRunTestScan = () => {
    setTestScanCompleted(true);
    Alert.alert('Test Scan Complete!', 'Order scanned successfully with 85/100 risk score.');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.heroGradient}>
              <Ionicons name="shield-checkmark" size={80} color="#fff" />
            </View>
            <Text style={styles.stepTitle}>Welcome to ChargebackShield</Text>
            <Text style={styles.stepDescription}>
              Protect your revenue from chargebacks with AI-powered fraud detection.
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.featureText}>11+ fraud detection checks</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.featureText}>Real-time order scanning</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.featureText}>Dispute evidence builder</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.featureText}>Save thousands per month</Text>
              </View>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Ionicons name="link" size={64} color="#2563EB" />
            <Text style={styles.stepTitle}>Connect Your Platform</Text>
            <Text style={styles.stepDescription}>
              Choose the platform you want to protect from chargebacks.
            </Text>
            <View style={styles.platformGrid}>
              {platforms.map((platform) => (
                <TouchableOpacity
                  key={platform.id}
                  style={[
                    styles.platformCard,
                    selectedPlatform === platform.id && styles.platformCardSelected,
                  ]}
                  onPress={() => setSelectedPlatform(platform.id)}
                >
                  <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
                    <Ionicons name={platform.icon as any} size={32} color={platform.color} />
                  </View>
                  <Text style={styles.platformName}>{platform.name}</Text>
                  {selectedPlatform === platform.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#10B981"
                      style={styles.platformCheck}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {selectedPlatform && (
              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={20} color="#2563EB" />
                <Text style={styles.infoText}>
                  You can add more platforms later from Integration Hub
                </Text>
              </View>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Ionicons name="cloud-upload" size={64} color="#2563EB" />
            <Text style={styles.stepTitle}>Configure Webhooks</Text>
            <Text style={styles.stepDescription}>
              Copy this webhook URL to your {selectedPlatform || 'platform'} settings to enable
              automatic order scanning.
            </Text>
            <View style={styles.webhookCard}>
              <Text style={styles.webhookLabel}>Webhook URL</Text>
              <View style={styles.webhookUrlContainer}>
                <Text style={styles.webhookUrl} numberOfLines={1}>
                  {webhookUrl}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => Alert.alert('Copied!', 'Webhook URL copied to clipboard')}
                >
                  <Ionicons name="copy" size={20} color="#2563EB" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Setup Instructions</Text>
              <View style={styles.instructionsList}>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>1</Text>
                  </View>
                  <Text style={styles.instructionText}>
                    Log in to your {selectedPlatform || 'platform'} admin panel
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>2</Text>
                  </View>
                  <Text style={styles.instructionText}>
                    Go to Settings → Notifications → Webhooks
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>3</Text>
                  </View>
                  <Text style={styles.instructionText}>
                    Create new webhook and paste the URL above
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>4</Text>
                  </View>
                  <Text style={styles.instructionText}>
                    Select "Order Created" and "Order Paid" events
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Ionicons name="search" size={64} color="#2563EB" />
            <Text style={styles.stepTitle}>Run Your First Scan</Text>
            <Text style={styles.stepDescription}>
              Test the fraud detection system with a sample high-risk order.
            </Text>
            {!testScanCompleted ? (
              <>
                <View style={styles.testCard}>
                  <View style={styles.testCardIcon}>
                    <Ionicons name="warning" size={32} color="#F59E0B" />
                  </View>
                  <Text style={styles.testCardTitle}>Sample High-Risk Order</Text>
                  <Text style={styles.testCardDescription}>
                    • Disposable email detected{'\n'}• International address mismatch{'\n'}• VPN
                    detected{'\n'}• Rushed checkout (15 seconds)
                  </Text>
                  <TouchableOpacity style={styles.testButton} onPress={handleRunTestScan}>
                    <Ionicons name="play-circle" size={20} color="#fff" />
                    <Text style={styles.testButtonText}>Run Test Scan</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.resultCard}>
                <View style={styles.resultGauge}>
                  <Text style={styles.resultScore}>85</Text>
                  <Text style={styles.resultScoreLabel}>Risk Score</Text>
                </View>
                <View style={styles.resultDetails}>
                  <View style={styles.resultBadge}>
                    <Text style={styles.resultBadgeText}>HIGH RISK</Text>
                  </View>
                  <Text style={styles.resultRecommendation}>Recommendation: BLOCK ORDER</Text>
                </View>
                <View style={styles.resultChecks}>
                  <View style={styles.resultCheck}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                    <Text style={styles.resultCheckText}>Disposable Email</Text>
                  </View>
                  <View style={styles.resultCheck}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                    <Text style={styles.resultCheckText}>Geolocation Mismatch</Text>
                  </View>
                  <View style={styles.resultCheck}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                    <Text style={styles.resultCheckText}>VPN Detected</Text>
                  </View>
                </View>
                <View style={styles.successCard}>
                  <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                  <Text style={styles.successText}>Great! Your fraud detection is working.</Text>
                </View>
              </View>
            )}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Ionicons name="people" size={64} color="#2563EB" />
            <Text style={styles.stepTitle}>Invite Your Team</Text>
            <Text style={styles.stepDescription}>
              Add team members to collaborate on fraud prevention. (Optional)
            </Text>
            <View style={styles.inviteCard}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.emailInput}
                placeholder="colleague@business.com"
                value={teamEmail}
                onChangeText={setTeamEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => {
                  Alert.alert('Invitation Sent!', `Invitation sent to ${teamEmail}`);
                  setTeamEmail('');
                }}
              >
                <Ionicons name="paper-plane" size={20} color="#fff" />
                <Text style={styles.inviteButtonText}>Send Invitation</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.skipHint}>You can skip this and add team members later</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.skipButton} />
        <View style={styles.progressContainer}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[styles.progressDot, currentStep >= index && styles.progressDotActive]}
            />
          ))}
        </View>
        <View style={styles.skipButton} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>{renderStepContent()}</ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.navButtonSecondary} onPress={handlePrevious}>
            <Ionicons name="arrow-back" size={20} color="#374151" />
            <Text style={styles.navButtonSecondaryText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.navButtonPrimary, currentStep === 0 && styles.navButtonPrimaryFull]}
          onPress={handleNext}
          disabled={currentStep === 1 && !selectedPlatform}
        >
          <Text style={styles.navButtonPrimaryText}>
            {currentStep === totalSteps - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  skipButton: {
    width: 60,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  progressDotActive: {
    backgroundColor: '#2563EB',
    width: 24,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  stepContent: {
    padding: 24,
    alignItems: 'center',
  },
  heroGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#2563EB',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  featureList: {
    width: '100%',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 16,
  },
  platformCard: {
    width: (width - 72) / 2,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  platformCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  platformIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  platformCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
  },
  webhookCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  webhookLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  webhookUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  webhookUrl: {
    flex: 1,
    fontSize: 12,
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  instructionsCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  testCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  testCardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  testCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  testCardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultGauge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultScore: {
    fontSize: 36,
    fontWeight: '700',
    color: '#F59E0B',
  },
  resultScoreLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  resultDetails: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  resultBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  resultRecommendation: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  resultChecks: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  resultCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultCheckText: {
    fontSize: 14,
    color: '#374151',
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: '#047857',
    fontWeight: '600',
  },
  inviteCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  navButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 8,
  },
  navButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  navButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    gap: 8,
  },
  navButtonPrimaryFull: {
    flex: 2,
  },
  navButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});