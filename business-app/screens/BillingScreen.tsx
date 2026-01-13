import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  viewer: any;
  sessionToken: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    interval: 'month',
    features: [
      '500 scans/month',
      'Basic fraud detection (8 checks)',
      'Email alerts',
      'Evidence builder',
      'Basic analytics',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 199,
    interval: 'month',
    recommended: true,
    features: [
      'Unlimited scans',
      'Advanced fraud detection (11+ checks)',
      'ML-powered risk scoring',
      'Credit bureau integration',
      'Email + Push + SMS alerts',
      'Team collaboration (5 members)',
      'Advanced analytics',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    interval: 'month',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Custom ML models',
      'Dedicated account manager',
      'SLA guarantee',
      'White-label options',
      'Custom integrations',
      'Phone support',
    ],
  },
];

export default function BillingScreen({ viewer, sessionToken }: Props) {
  const [currentPlan] = useState('pro'); // Mock: user is on Pro plan
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Mock usage data
  const usage = {
    scans: 342,
    limit: -1, // Unlimited
    percentage: 100,
    resetDate: Date.now() + 15 * 24 * 60 * 60 * 1000, // 15 days
  };

  // Mock payment method
  const paymentMethod = {
    type: 'card',
    brand: 'Visa',
    last4: '4242',
    expiry: '12/2025',
  };

  // Mock invoices
  const invoices = [
    {
      id: '1',
      date: Date.now() - 30 * 24 * 60 * 60 * 1000,
      amount: 199,
      status: 'paid',
      invoiceUrl: '#',
    },
    {
      id: '2',
      date: Date.now() - 60 * 24 * 60 * 60 * 1000,
      amount: 199,
      status: 'paid',
      invoiceUrl: '#',
    },
    {
      id: '3',
      date: Date.now() - 90 * 24 * 60 * 60 * 1000,
      amount: 199,
      status: 'paid',
      invoiceUrl: '#',
    },
  ];

  const handleUpgradePlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = () => {
    setShowUpgradeModal(false);
    Alert.alert('Success!', `You've been upgraded to the ${selectedPlan?.name} plan.`);
  };

  const handleUpdatePaymentMethod = () => {
    setShowPaymentModal(false);
    Alert.alert('Success!', 'Your payment method has been updated.');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription?',
      'Are you sure you want to cancel your subscription? You will lose access to ChargebackShield at the end of your billing period.',
      [
        { text: 'No, Keep Subscription', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Subscription Cancelled', 'Your subscription will end on ' + new Date(usage.resetDate).toLocaleDateString());
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header - simplified since back button is in App.tsx */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Billing & Subscription</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Current Plan Card */}
        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanHeader}>
            <View>
              <Text style={styles.currentPlanLabel}>Current Plan</Text>
              <Text style={styles.currentPlanName}>Pro Plan</Text>
            </View>
            <View style={styles.currentPlanBadge}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.currentPlanBadgeText}>Active</Text>
            </View>
          </View>
          <View style={styles.currentPlanPricing}>
            <Text style={styles.currentPlanPrice}>$199</Text>
            <Text style={styles.currentPlanInterval}>/month</Text>
          </View>
          <Text style={styles.currentPlanRenewal}>
            Renews on {new Date(usage.resetDate).toLocaleDateString()}
          </Text>
        </View>

        {/* Usage Card */}
        <View style={styles.usageCard}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageTitle}>Usage This Month</Text>
            <Text style={styles.usageSubtitle}>Resets in 15 days</Text>
          </View>
          <View style={styles.usageStats}>
            <View style={styles.usageStat}>
              <Text style={styles.usageStatValue}>{usage.scans}</Text>
              <Text style={styles.usageStatLabel}>Scans Run</Text>
            </View>
            <View style={styles.usageStat}>
              <Text style={styles.usageStatValue}>Unlimited</Text>
              <Text style={styles.usageStatLabel}>Scans Available</Text>
            </View>
          </View>
          <View style={styles.usageProgressBar}>
            <View style={[styles.usageProgress, { width: '100%' }]} />
          </View>
          <Text style={styles.usageNote}>✨ Unlimited scans on Pro plan</Text>
        </View>

        {/* Payment Method Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentCardIcon}>
              <Ionicons name="card" size={32} color="#2563EB" />
            </View>
            <View style={styles.paymentCardInfo}>
              <Text style={styles.paymentCardBrand}>{paymentMethod.brand} •••• {paymentMethod.last4}</Text>
              <Text style={styles.paymentCardExpiry}>Expires {paymentMethod.expiry}</Text>
            </View>
            <TouchableOpacity
              style={styles.paymentCardButton}
              onPress={() => setShowPaymentModal(true)}
            >
              <Text style={styles.paymentCardButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          {PLANS.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                plan.recommended && styles.planCardRecommended,
                currentPlan === plan.id && styles.planCardCurrent,
              ]}
            >
              {plan.recommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                {currentPlan === plan.id && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
              </View>
              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>${plan.price}</Text>
                <Text style={styles.planInterval}>/{plan.interval}</Text>
              </View>
              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.planFeature}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.planFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              {currentPlan !== plan.id && (
                <TouchableOpacity
                  style={[styles.planButton, plan.recommended && styles.planButtonPrimary]}
                  onPress={() => handleUpgradePlan(plan)}
                >
                  <Text style={[styles.planButtonText, plan.recommended && styles.planButtonTextPrimary]}>
                    {plan.price > (PLANS.find(p => p.id === currentPlan)?.price || 0) ? 'Upgrade' : 'Downgrade'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Invoice History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice History</Text>
          {invoices.map((invoice) => (
            <View key={invoice.id} style={styles.invoiceCard}>
              <View style={styles.invoiceInfo}>
                <Text style={styles.invoiceDate}>{new Date(invoice.date).toLocaleDateString()}</Text>
                <Text style={styles.invoiceAmount}>${invoice.amount}.00</Text>
              </View>
              <View style={styles.invoiceActions}>
                <View style={[styles.invoiceStatus, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.invoiceStatusText, { color: '#047857' }]}>Paid</Text>
                </View>
                <TouchableOpacity
                  style={styles.invoiceDownload}
                  onPress={() => Alert.alert('Download Invoice', 'Invoice PDF would download here')}
                >
                  <Ionicons name="download-outline" size={20} color="#2563EB" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerCard} onPress={handleCancelSubscription}>
            <Ionicons name="warning" size={24} color="#EF4444" />
            <View style={styles.dangerInfo}>
              <Text style={styles.dangerTitle}>Cancel Subscription</Text>
              <Text style={styles.dangerDescription}>
                You will lose access at the end of your billing period
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Upgrade Modal */}
      <Modal visible={showUpgradeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Plan Change</Text>
              <TouchableOpacity onPress={() => setShowUpgradeModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.modalPlanSummary}>
                <Text style={styles.modalPlanName}>{selectedPlan?.name} Plan</Text>
                <Text style={styles.modalPlanPrice}>${selectedPlan?.price}/month</Text>
              </View>
              <View style={styles.modalInfo}>
                <Ionicons name="information-circle" size={20} color="#2563EB" />
                <Text style={styles.modalInfoText}>
                  You will be charged ${selectedPlan?.price} today. Your next billing date will be{' '}
                  {new Date(usage.resetDate).toLocaleDateString()}.
                </Text>
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleConfirmUpgrade}>
                <Text style={styles.modalButtonPrimaryText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Payment Method</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="number-pad"
                maxLength={19}
              />
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    maxLength={5}
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
              <View style={styles.secureNote}>
                <Ionicons name="lock-closed" size={16} color="#10B981" />
                <Text style={styles.secureNoteText}>Your payment information is secure and encrypted</Text>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleUpdatePaymentMethod}>
                <Text style={styles.modalButtonPrimaryText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  currentPlanCard: {
    backgroundColor: '#2563EB',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  currentPlanLabel: {
    fontSize: 12,
    color: '#BFDBFE',
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  currentPlanBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  currentPlanPricing: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  currentPlanPrice: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  currentPlanInterval: {
    fontSize: 18,
    color: '#BFDBFE',
    marginBottom: 8,
    marginLeft: 4,
  },
  currentPlanRenewal: {
    fontSize: 14,
    color: '#BFDBFE',
  },
  usageCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  usageHeader: {
    marginBottom: 16,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  usageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  usageStats: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 32,
  },
  usageStat: {},
  usageStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4,
  },
  usageStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  usageProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  usageProgress: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  usageNote: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentCardInfo: {
    flex: 1,
  },
  paymentCardBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentCardExpiry: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentCardButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  paymentCardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  planCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  planCardRecommended: {
    borderColor: '#2563EB',
  },
  planCardCurrent: {
    backgroundColor: '#F9FAFB',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  currentBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2563EB',
  },
  planInterval: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 6,
  },
  planFeatures: {
    gap: 8,
    marginBottom: 16,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planFeatureText: {
    fontSize: 14,
    color: '#374151',
  },
  planButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
    alignItems: 'center',
  },
  planButtonPrimary: {
    backgroundColor: '#2563EB',
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  planButtonTextPrimary: {
    color: '#fff',
  },
  invoiceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  invoiceInfo: {},
  invoiceDate: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 4,
  },
  invoiceAmount: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '700',
  },
  invoiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  invoiceStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  invoiceStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceDownload: {
    padding: 4,
  },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 12,
  },
  dangerInfo: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 4,
  },
  dangerDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  modalPlanSummary: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalPlanName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalPlanPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
  },
  modalInfo: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
  },
  secureNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#047857',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});