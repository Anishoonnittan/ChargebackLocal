import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface DisputeEvidenceScreenProps {
  businessSessionToken: string;
  onBack: () => void;
}

type EvidenceTemplate = 'friendly_fraud' | 'item_not_received' | 'not_as_described' | 'unauthorized';

export default function DisputeEvidenceScreen({ businessSessionToken, onBack }: DisputeEvidenceScreenProps) {
  const [orderId, setOrderId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [customerCommunication, setCustomerCommunication] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EvidenceTemplate>('friendly_fraud');
  const [loading, setLoading] = useState(false);
  const [fraudScanData, setFraudScanData] = useState<any>(null);

  // Convex queries
  const recentScans = useQuery(api.chargebackFraud.getRecentScans, {
    sessionToken: businessSessionToken,
    limit: 10,
  });
  const generateEvidence = useMutation(api.chargebackFraud.generateDisputeEvidence);

  // Auto-populate fraud scan data when order ID is entered
  useEffect(() => {
    if (orderId && recentScans) {
      const matchingScan = recentScans.find((scan: any) => 
        scan.orderId?.toLowerCase() === orderId.toLowerCase()
      );
      if (matchingScan) {
        setFraudScanData(matchingScan);
      }
    }
  }, [orderId, recentScans]);

  const templates = [
    { id: 'friendly_fraud' as EvidenceTemplate, title: 'Friendly Fraud', icon: 'card', description: 'Customer made purchase but claims they didn\'t' },
    { id: 'item_not_received' as EvidenceTemplate, title: 'Item Not Received', icon: 'cube', description: 'Customer claims item was not delivered' },
    { id: 'not_as_described' as EvidenceTemplate, title: 'Not As Described', icon: 'alert-circle', description: 'Customer claims item differs from listing' },
    { id: 'unauthorized' as EvidenceTemplate, title: 'Unauthorized Transaction', icon: 'lock-closed', description: 'Card holder claims transaction was unauthorized' },
  ];

  const handleGenerateEvidence = async () => {
    if (!orderId || !transactionId) {
      Alert.alert('Missing Information', 'Please enter at least Order ID and Transaction ID');
      return;
    }

    setLoading(true);
    try {
      const evidence = {
        orderId,
        transactionId,
        trackingNumber,
        productDescription,
        customerCommunication,
        template: selectedTemplate,
        fraudSignals: fraudScanData?.signals || [],
        riskScore: fraudScanData?.riskScore,
      };

      await generateEvidence({
        sessionToken: businessSessionToken,
        orderId,
        disputeReason: selectedTemplate,
        evidence,
      });

      Alert.alert(
        'Evidence Package Created',
        'Your dispute evidence has been generated and saved. You can now export it to PDF or submit to your payment processor.',
        [
          { text: 'View Evidence', onPress: () => {} },
          { text: 'OK' },
        ]
      );

      // Clear form
      setOrderId('');
      setTransactionId('');
      setTrackingNumber('');
      setProductDescription('');
      setCustomerCommunication('');
      setFraudScanData(null);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to generate evidence package');
    } finally {
      setLoading(false);
    }
  };

  const evidenceChecklist = [
    { id: 1, label: 'Tracking number with delivery confirmation', completed: !!trackingNumber },
    { id: 2, label: 'Product description and photos', completed: !!productDescription },
    { id: 3, label: 'Customer communication records', completed: !!customerCommunication },
    { id: 4, label: 'Fraud analysis report', completed: !!fraudScanData },
    { id: 5, label: 'Transaction receipt', completed: !!transactionId },
  ];

  const completionPercentage = Math.round((evidenceChecklist.filter(item => item.completed).length / evidenceChecklist.length) * 100);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dispute Evidence Builder</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Evidence Completion Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.progressTitle}>Evidence Completion</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${completionPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>{completionPercentage}% Complete</Text>
        </View>

        {/* Template Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dispute Type</Text>
          <View style={styles.templatesGrid}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  selectedTemplate === template.id && styles.templateCardSelected,
                ]}
                onPress={() => setSelectedTemplate(template.id)}
              >
                <Ionicons
                  name={template.icon as any}
                  size={24}
                  color={selectedTemplate === template.id ? '#2563EB' : '#6B7280'}
                />
                <Text style={[
                  styles.templateTitle,
                  selectedTemplate === template.id && styles.templateTitleSelected,
                ]}>
                  {template.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Order ID *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., #12345"
              value={orderId}
              onChangeText={setOrderId}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Transaction ID *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., ch_3AbCdEfGhIjKlMnO"
              value={transactionId}
              onChangeText={setTransactionId}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tracking Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1Z999AA10123456784"
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Fraud Scan Data */}
        {fraudScanData && (
          <View style={styles.section}>
            <View style={styles.fraudScanHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Fraud Analysis Found</Text>
            </View>
            <View style={styles.fraudScanCard}>
              <View style={styles.fraudScanRow}>
                <Text style={styles.fraudScanLabel}>Risk Score:</Text>
                <View style={[
                  styles.riskBadge,
                  { backgroundColor: fraudScanData.riskScore > 70 ? '#FEE2E2' : fraudScanData.riskScore > 40 ? '#FEF3C7' : '#D1FAE5' }
                ]}>
                  <Text style={[
                    styles.riskBadgeText,
                    { color: fraudScanData.riskScore > 70 ? '#DC2626' : fraudScanData.riskScore > 40 ? '#D97706' : '#10B981' }
                  ]}>
                    {fraudScanData.riskScore}/100
                  </Text>
                </View>
              </View>
              <View style={styles.fraudScanRow}>
                <Text style={styles.fraudScanLabel}>Customer Email:</Text>
                <Text style={styles.fraudScanValue}>{fraudScanData.customerEmail}</Text>
              </View>
              <View style={styles.fraudScanRow}>
                <Text style={styles.fraudScanLabel}>Order Amount:</Text>
                <Text style={styles.fraudScanValue}>${fraudScanData.orderAmount}</Text>
              </View>
              <Text style={styles.fraudScanNote}>
                ✓ Fraud analysis will be automatically included in evidence package
              </Text>
            </View>
          </View>
        )}

        {/* Evidence Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evidence Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Product Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the product, SKU, features, and condition delivered"
              value={productDescription}
              onChangeText={setProductDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Customer Communication</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Paste email exchanges, chat logs, or support tickets"
              value={customerCommunication}
              onChangeText={setCustomerCommunication}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Evidence Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evidence Checklist</Text>
          {evidenceChecklist.map((item) => (
            <View key={item.id} style={styles.checklistItem}>
              <Ionicons
                name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={item.completed ? '#10B981' : '#D1D5DB'}
              />
              <Text style={[
                styles.checklistLabel,
                item.completed && styles.checklistLabelCompleted,
              ]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerateEvidence}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="document-text" size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generate Evidence Package</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  templateCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  templateCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  templateTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  templateTitleSelected: {
    color: '#2563EB',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  fraudScanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fraudScanCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  fraudScanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fraudScanLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
  },
  fraudScanValue: {
    fontSize: 14,
    color: '#166534',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fraudScanNote: {
    fontSize: 12,
    color: '#16A34A',
    marginTop: 4,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checklistLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 10,
    flex: 1,
  },
  checklistLabelCompleted: {
    color: '#10B981',
  },
  generateButton: {
    backgroundColor: '#2563EB',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});