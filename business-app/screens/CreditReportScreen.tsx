import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CreditReportData } from '../lib/creditBureauIntegration';

interface CreditReportScreenProps {
  creditReport: CreditReportData;
  customerEmail: string;
  orderAmount: number;
  onClose: () => void;
}

export default function CreditReportScreen({
  creditReport,
  customerEmail,
  orderAmount,
  onClose,
}: CreditReportScreenProps) {
  const getCreditScoreColor = (score: number) => {
    if (score >= 720) return '#10b981'; // Green
    if (score >= 650) return '#3b82f6'; // Blue
    if (score >= 580) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 30) return '#10b981';
    if (utilization < 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credit Bureau Report</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{customerEmail}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order Amount</Text>
              <Text style={styles.infoValue}>${orderAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Credit Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credit Score (FICO)</Text>
          <View style={[styles.card, { borderLeftColor: getCreditScoreColor(creditReport.creditScore), borderLeftWidth: 4 }]}>
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreValue, { color: getCreditScoreColor(creditReport.creditScore) }]}>
                {creditReport.creditScore}
              </Text>
              <Text style={styles.scoreRange}>{creditReport.creditScoreRange.replace('_', ' ').toUpperCase()}</Text>
            </View>
            
            {/* Score Bar */}
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { 
                width: `${((creditReport.creditScore - 300) / 550) * 100}%`,
                backgroundColor: getCreditScoreColor(creditReport.creditScore)
              }]} />
            </View>
            <View style={styles.scoreLabels}>
              <Text style={styles.scoreLabel}>300</Text>
              <Text style={styles.scoreLabel}>850</Text>
            </View>
          </View>
        </View>

        {/* Identity Verification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity Verification</Text>
          <View style={styles.card}>
            <View style={styles.verificationRow}>
              <Ionicons 
                name={creditReport.identityVerification.ssnValid ? "checkmark-circle" : "close-circle"}
                size={20}
                color={creditReport.identityVerification.ssnValid ? "#10b981" : "#ef4444"}
              />
              <Text style={styles.verificationText}>SSN Valid</Text>
            </View>
            <View style={styles.verificationRow}>
              <Ionicons 
                name={creditReport.identityVerification.ssnMatchesName ? "checkmark-circle" : "close-circle"}
                size={20}
                color={creditReport.identityVerification.ssnMatchesName ? "#10b981" : "#ef4444"}
              />
              <Text style={styles.verificationText}>SSN Matches Name</Text>
            </View>
            <View style={styles.verificationRow}>
              <Ionicons 
                name={creditReport.identityVerification.addressVerified ? "checkmark-circle" : "close-circle"}
                size={20}
                color={creditReport.identityVerification.addressVerified ? "#10b981" : "#ef4444"}
              />
              <Text style={styles.verificationText}>Address Verified</Text>
            </View>
            <View style={styles.verificationRow}>
              <Ionicons 
                name={creditReport.identityVerification.phoneVerified ? "checkmark-circle" : "close-circle"}
                size={20}
                color={creditReport.identityVerification.phoneVerified ? "#10b981" : "#ef4444"}
              />
              <Text style={styles.verificationText}>Phone Verified</Text>
            </View>
            <View style={styles.verificationRow}>
              <Ionicons 
                name={creditReport.identityVerification.dobVerified ? "checkmark-circle" : "close-circle"}
                size={20}
                color={creditReport.identityVerification.dobVerified ? "#10b981" : "#ef4444"}
              />
              <Text style={styles.verificationText}>Date of Birth Verified</Text>
            </View>
          </View>
        </View>

        {/* Credit Utilization */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credit Utilization</Text>
          <View style={styles.card}>
            <Text style={[styles.utilizationValue, { color: getUtilizationColor(creditReport.creditUtilization) }]}>
              {creditReport.creditUtilization}%
            </Text>
            <View style={styles.utilizationBar}>
              <View style={[styles.utilizationBarFill, {
                width: `${creditReport.creditUtilization}%`,
                backgroundColor: getUtilizationColor(creditReport.creditUtilization)
              }]} />
            </View>
            <Text style={styles.utilizationDetails}>
              ${(creditReport.totalCreditLimit * (creditReport.creditUtilization / 100)).toFixed(0)} of ${creditReport.totalCreditLimit.toLocaleString()} limit used
            </Text>
          </View>
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          <View style={styles.card}>
            <View style={styles.paymentRow}>
              <View style={[styles.paymentDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.paymentLabel}>On-Time Payments</Text>
              <Text style={styles.paymentValue}>{creditReport.paymentHistory.onTimePayments}</Text>
            </View>
            <View style={styles.paymentRow}>
              <View style={[styles.paymentDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.paymentLabel}>30 Days Late</Text>
              <Text style={styles.paymentValue}>{creditReport.paymentHistory.latePayments30Days}</Text>
            </View>
            <View style={styles.paymentRow}>
              <View style={[styles.paymentDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.paymentLabel}>60 Days Late</Text>
              <Text style={styles.paymentValue}>{creditReport.paymentHistory.latePayments60Days}</Text>
            </View>
            <View style={styles.paymentRow}>
              <View style={[styles.paymentDot, { backgroundColor: '#dc2626' }]} />
              <Text style={styles.paymentLabel}>90+ Days Late</Text>
              <Text style={styles.paymentValue}>{creditReport.paymentHistory.latePayments90Days}</Text>
            </View>
          </View>
        </View>

        {/* Account Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{creditReport.accountsOpen}</Text>
              <Text style={styles.statLabel}>Open Accounts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{creditReport.accountsClosed}</Text>
              <Text style={styles.statLabel}>Closed Accounts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{creditReport.oldestAccount.toFixed(1)}y</Text>
              <Text style={styles.statLabel}>Oldest Account</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{creditReport.averageAccountAge.toFixed(1)}y</Text>
              <Text style={styles.statLabel}>Avg Account Age</Text>
            </View>
          </View>
        </View>

        {/* Derogatory Marks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Derogatory Marks</Text>
          <View style={styles.card}>
            {(creditReport.derogatoryMarks.bankruptcies +
              creditReport.derogatoryMarks.liens +
              creditReport.derogatoryMarks.judgments +
              creditReport.derogatoryMarks.collections) === 0 ? (
              <View style={styles.noMarksContainer}>
                <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                <Text style={styles.noMarksText}>No Derogatory Marks</Text>
              </View>
            ) : (
              <>
                {creditReport.derogatoryMarks.bankruptcies > 0 && (
                  <View style={styles.derogatoryRow}>
                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
                    <Text style={styles.derogatoryText}>
                      {creditReport.derogatoryMarks.bankruptcies} Bankruptcy(ies)
                    </Text>
                  </View>
                )}
                {creditReport.derogatoryMarks.liens > 0 && (
                  <View style={styles.derogatoryRow}>
                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
                    <Text style={styles.derogatoryText}>
                      {creditReport.derogatoryMarks.liens} Lien(s)
                    </Text>
                  </View>
                )}
                {creditReport.derogatoryMarks.judgments > 0 && (
                  <View style={styles.derogatoryRow}>
                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
                    <Text style={styles.derogatoryText}>
                      {creditReport.derogatoryMarks.judgments} Judgment(s)
                    </Text>
                  </View>
                )}
                {creditReport.derogatoryMarks.collections > 0 && (
                  <View style={styles.derogatoryRow}>
                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
                    <Text style={styles.derogatoryText}>
                      {creditReport.derogatoryMarks.collections} Collection(s)
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Synthetic Fraud Risk */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synthetic Fraud Risk</Text>
          <View style={styles.card}>
            <Text style={[styles.fraudScore, {
              color: creditReport.syntheticFraudScore < 30 ? '#10b981' : 
                     creditReport.syntheticFraudScore < 60 ? '#f59e0b' : '#ef4444'
            }]}>
              {creditReport.syntheticFraudScore}/100
            </Text>
            <View style={styles.fraudBar}>
              <View style={[styles.fraudBarFill, {
                width: `${creditReport.syntheticFraudScore}%`,
                backgroundColor: creditReport.syntheticFraudScore < 30 ? '#10b981' : 
                                 creditReport.syntheticFraudScore < 60 ? '#f59e0b' : '#ef4444'
              }]} />
            </View>
            <Text style={styles.fraudLabel}>
              {creditReport.syntheticFraudScore < 30 ? 'Low Risk' :
               creditReport.syntheticFraudScore < 60 ? 'Moderate Risk' : 'High Risk'}
            </Text>
          </View>
        </View>

        {/* Velocity Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Velocity Alerts (Last 90 Days)</Text>
          <View style={styles.card}>
            <View style={styles.velocityRow}>
              <Ionicons name="home-outline" size={20} color="#6b7280" />
              <Text style={styles.velocityText}>Address Changes</Text>
              <Text style={styles.velocityValue}>{creditReport.velocityAlerts.recentAddressChanges}</Text>
            </View>
            <View style={styles.velocityRow}>
              <Ionicons name="call-outline" size={20} color="#6b7280" />
              <Text style={styles.velocityText}>Phone Changes</Text>
              <Text style={styles.velocityValue}>{creditReport.velocityAlerts.recentPhoneChanges}</Text>
            </View>
            <View style={styles.velocityRow}>
              <Ionicons name="person-outline" size={20} color="#6b7280" />
              <Text style={styles.velocityText}>Name Changes</Text>
              <Text style={styles.velocityValue}>{creditReport.velocityAlerts.recentNameChanges}</Text>
            </View>
          </View>
        </View>

        {/* Recent Inquiries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Credit Inquiries (6 Months)</Text>
          <View style={styles.card}>
            <Text style={[styles.inquiriesValue, {
              color: creditReport.recentInquiries === 0 ? '#10b981' :
                     creditReport.recentInquiries <= 3 ? '#f59e0b' : '#ef4444'
            }]}>
              {creditReport.recentInquiries}
            </Text>
            <Text style={styles.inquiriesLabel}>Hard Inquiries</Text>
          </View>
        </View>

        {/* Address History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address History</Text>
          {creditReport.addressHistory.map((address, index) => (
            <View key={index} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Ionicons name="location" size={16} color="#6b7280" />
                <Text style={styles.historyDate}>{address.reportedDate}</Text>
                <View style={[styles.verificationBadge, {
                  backgroundColor: address.verificationStatus === 'verified' ? '#d1fae5' :
                                   address.verificationStatus === 'unverified' ? '#fef3c7' : '#fee2e2'
                }]}>
                  <Text style={[styles.verificationBadgeText, {
                    color: address.verificationStatus === 'verified' ? '#065f46' :
                           address.verificationStatus === 'unverified' ? '#92400e' : '#991b1b'
                  }]}>
                    {address.verificationStatus}
                  </Text>
                </View>
              </View>
              <Text style={styles.historyText}>{address.address}</Text>
            </View>
          ))}
        </View>

        {/* Phone History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phone History</Text>
          {creditReport.phoneHistory.map((phone, index) => (
            <View key={index} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Ionicons name="call" size={16} color="#6b7280" />
                <Text style={styles.historyDate}>{phone.reportedDate}</Text>
                <View style={[styles.typeBadge, {
                  backgroundColor: phone.type === 'mobile' ? '#dbeafe' :
                                   phone.type === 'landline' ? '#e0e7ff' :
                                   phone.type === 'voip' ? '#fef3c7' : '#f3f4f6'
                }]}>
                  <Text style={[styles.typeBadgeText, {
                    color: phone.type === 'mobile' ? '#1e40af' :
                           phone.type === 'landline' ? '#4338ca' :
                           phone.type === 'voip' ? '#92400e' : '#374151'
                  }]}>
                    {(phone.type ?? 'unknown').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.historyText}>{phone.phone}</Text>
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
          <Text style={styles.disclaimerText}>
            This is a soft inquiry and does not impact the customer's credit score. 
            Data provided by Equifax, Experian, and TransUnion.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreRange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 4,
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  verificationText: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 12,
  },
  utilizationValue: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  utilizationBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  utilizationBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  utilizationDetails: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  paymentLabel: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563eb',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 6,
  },
  noMarksContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noMarksText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 8,
  },
  derogatoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  derogatoryText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 12,
    fontWeight: '500',
  },
  fraudScore: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  fraudBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  fraudBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  fraudLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  velocityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  velocityText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 12,
  },
  velocityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  inquiriesValue: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
  },
  inquiriesLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyDate: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  verificationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  verificationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyText: {
    fontSize: 13,
    color: '#1f2937',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
    lineHeight: 18,
  },
});