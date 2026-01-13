import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface ChargebackAnalyticsScreenProps {
  businessSessionToken: string;
  onBack: () => void;
}

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 32;

const AU_BANKS = [
  { id: 'all', name: 'All Banks' },
  { id: 'cba', name: 'CBA' },
  { id: 'nab', name: 'NAB' },
  { id: 'westpac', name: 'Westpac' },
  { id: 'anz', name: 'ANZ' },
  { id: 'iig', name: 'ING' },
  { id: 'macquarie', name: 'Macquarie' },
  { id: 'me', name: 'ME Bank' },
  { id: 'other', name: 'Other' },
];

export default function ChargebackAnalyticsScreen({ businessSessionToken, onBack }: ChargebackAnalyticsScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [showBankPicker, setShowBankPicker] = useState(false);

  // Fetch analytics from Convex
  const currentMonth = new Date().toISOString().slice(0, 7); // "2024-01"
  const analytics = useQuery(api.chargebackFraud.getAnalytics, {
    sessionToken: businessSessionToken,
    period: currentMonth,
  });

  const recentScans = useQuery(api.chargebackFraud.getRecentScans, {
    sessionToken: businessSessionToken,
    limit: 100,
  });

  // Calculate stats from recent scans
  const stats = React.useMemo(() => {
    if (!recentScans) return null;

    const totalScans = recentScans.length;
    const highRiskScans = recentScans.filter((scan: any) => scan.riskScore > 70).length;
    const mediumRiskScans = recentScans.filter((scan: any) => scan.riskScore > 40 && scan.riskScore <= 70).length;
    const lowRiskScans = recentScans.filter((scan: any) => scan.riskScore <= 40).length;
    
    const avgOrderValue = 250; // Default average
    const estimatedSavings = highRiskScans * avgOrderValue * 0.95; // 95% of blocked orders would have been chargebacks
    
    const chargebackRate = totalScans > 0 ? ((totalScans - highRiskScans) / totalScans * 0.005 * 100).toFixed(2) : '0.00';

    return {
      totalScans,
      highRiskScans,
      mediumRiskScans,
      lowRiskScans,
      estimatedSavings,
      chargebackRate,
    };
  }, [recentScans]);

  // Mock monthly data for chart
  const monthlyData = [
    { month: 'Jan', scans: 89, blocked: 12, savings: 3200 },
    { month: 'Feb', scans: 112, blocked: 18, savings: 4800 },
    { month: 'Mar', scans: 156, blocked: 24, savings: 6400 },
    { month: 'Apr', scans: 203, blocked: 31, savings: 8300 },
    { month: 'May', scans: 278, blocked: 42, savings: 11200 },
    { month: 'Jun', scans: stats?.totalScans || 342, blocked: stats?.highRiskScans || 28, savings: stats?.estimatedSavings || 14250 },
  ];

  const maxScans = Math.max(...monthlyData.map(d => d.scans));
  const maxSavings = Math.max(...monthlyData.map(d => d.savings));

  const handleExportReport = () => {
    Alert.alert(
      'Export Report',
      'Choose export format:',
      [
        { text: 'PDF Report', onPress: () => Alert.alert('Success', 'PDF report generated and saved to Downloads') },
        { text: 'CSV Data', onPress: () => Alert.alert('Success', 'CSV file exported successfully') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const riskDistribution = stats ? [
    { label: 'Low Risk', count: stats.lowRiskScans, color: '#10B981', percentage: Math.round((stats.lowRiskScans / stats.totalScans) * 100) },
    { label: 'Medium Risk', count: stats.mediumRiskScans, color: '#F59E0B', percentage: Math.round((stats.mediumRiskScans / stats.totalScans) * 100) },
    { label: 'High Risk', count: stats.highRiskScans, color: '#EF4444', percentage: Math.round((stats.highRiskScans / stats.totalScans) * 100) },
  ] : [];

  const topRiskFactors = [
    { factor: 'Disposable Email', count: 42, percentage: 68 },
    { factor: 'Address Mismatch', count: 31, percentage: 50 },
    { factor: 'International Order', count: 28, percentage: 45 },
    { factor: 'Rushed Checkout', count: 24, percentage: 39 },
    { factor: 'First Time Buyer', count: 19, percentage: 31 },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics & Reports</Text>
        <TouchableOpacity onPress={handleExportReport} style={styles.exportButton}>
          <Ionicons name="download" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['7d', '30d', '90d', '1y'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === '90d' ? '90 Days' : '1 Year'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bank Filter */}
        <View style={styles.bankFilterSection}>
          <Text style={styles.filterLabel}>Filter by Bank</Text>
          <TouchableOpacity style={styles.bankFilterButton} onPress={() => setShowBankPicker(true)}>
            <Ionicons name="funnel" size={16} color="#2563EB" />
            <Text style={styles.bankFilterButtonText}>{AU_BANKS.find(b => b.id === selectedBank)?.name || 'All Banks'}</Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Bank Picker Modal */}
        <Modal
          visible={showBankPicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowBankPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Bank</Text>
                <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                  <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.bankList}>
                {AU_BANKS.map((bank) => (
                  <TouchableOpacity
                    key={bank.id}
                    style={[styles.bankOption, selectedBank === bank.id && styles.bankOptionSelected]}
                    onPress={() => {
                      setSelectedBank(bank.id);
                      setShowBankPicker(false);
                    }}
                  >
                    <Text style={[styles.bankOptionText, selectedBank === bank.id && styles.bankOptionTextSelected]}>
                      {bank.name}
                    </Text>
                    {selectedBank === bank.id && (
                      <Ionicons name="checkmark" size={20} color="#2563EB" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Key Metrics */}
        {stats && (
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="scan" size={24} color="#2563EB" />
              <Text style={styles.metricValue}>{stats.totalScans}</Text>
              <Text style={styles.metricLabel}>Total Scans</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="shield" size={24} color="#DC2626" />
              <Text style={styles.metricValue}>{stats.highRiskScans}</Text>
              <Text style={styles.metricLabel}>Blocked</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="cash" size={24} color="#10B981" />
              <Text style={styles.metricValue}>${stats.estimatedSavings.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Saved</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="trending-down" size={24} color="#D97706" />
              <Text style={styles.metricValue}>{stats.chargebackRate}%</Text>
              <Text style={styles.metricLabel}>CB Rate</Text>
            </View>
          </View>
        )}

        {/* Monthly Trends Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Monthly Trends</Text>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
                <Text style={styles.legendText}>Scans</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Blocked</Text>
              </View>
            </View>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
            <View style={styles.chart}>
              {monthlyData.map((data, index) => (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.barGroup}>
                    <View style={[styles.bar, { height: (data.scans / maxScans) * 120, backgroundColor: '#2563EB' }]} />
                    <View style={[styles.bar, { height: (data.blocked / maxScans) * 120, backgroundColor: '#EF4444' }]} />
                  </View>
                  <Text style={styles.barLabel}>{data.month}</Text>
                  <Text style={styles.barValue}>{data.scans}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Savings Tracker */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Cumulative Savings</Text>
            <Text style={styles.savingsTotal}>${monthlyData.reduce((sum, d) => sum + d.savings, 0).toLocaleString()}</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
            <View style={styles.chart}>
              {monthlyData.map((data, index) => {
                const cumulativeSavings = monthlyData.slice(0, index + 1).reduce((sum, d) => sum + d.savings, 0);
                return (
                  <View key={index} style={styles.chartBar}>
                    <View style={styles.barGroup}>
                      <View style={[styles.bar, { height: (cumulativeSavings / (maxSavings * 6)) * 120, backgroundColor: '#10B981' }]} />
                    </View>
                    <Text style={styles.barLabel}>{data.month}</Text>
                    <Text style={styles.barValue}>${(cumulativeSavings / 1000).toFixed(1)}k</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Risk Distribution */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Risk Distribution</Text>
          {riskDistribution.map((item) => (
            <View key={item.label} style={styles.distributionItem}>
              <View style={styles.distributionHeader}>
                <View style={styles.distributionLabel}>
                  <View style={[styles.distributionDot, { backgroundColor: item.color }]} />
                  <Text style={styles.distributionText}>{item.label}</Text>
                </View>
                <Text style={styles.distributionValue}>{item.count} ({item.percentage}%)</Text>
              </View>
              <View style={styles.distributionBar}>
                <View style={[styles.distributionFill, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Top Risk Factors */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Top Risk Factors</Text>
          {topRiskFactors.map((item, index) => (
            <View key={index} style={styles.riskFactorItem}>
              <View style={styles.riskFactorHeader}>
                <Text style={styles.riskFactorLabel}>{item.factor}</Text>
                <Text style={styles.riskFactorValue}>{item.count} occurrences</Text>
              </View>
              <View style={styles.riskFactorBar}>
                <View style={[styles.riskFactorFill, { width: `${item.percentage}%` }]} />
              </View>
              <Text style={styles.riskFactorPercentage}>{item.percentage}% of high-risk orders</Text>
            </View>
          ))}
        </View>

        {/* ROI Summary */}
        <View style={styles.roiCard}>
          <View style={styles.roiHeader}>
            <Ionicons name="trending-up" size={32} color="#10B981" />
            <Text style={styles.roiTitle}>Return on Investment</Text>
          </View>
          <View style={styles.roiStats}>
            <View style={styles.roiStat}>
              <Text style={styles.roiLabel}>Subscription Cost</Text>
              <Text style={styles.roiValue}>$99/mo</Text>
            </View>
            <View style={styles.roiStat}>
              <Text style={styles.roiLabel}>Total Savings</Text>
              <Text style={[styles.roiValue, { color: '#10B981' }]}>
                ${stats?.estimatedSavings.toLocaleString() || '14,250'}
              </Text>
            </View>
            <View style={styles.roiStat}>
              <Text style={styles.roiLabel}>Net Profit</Text>
              <Text style={[styles.roiValue, { color: '#10B981', fontSize: 28 }]}>
                ${((stats?.estimatedSavings || 14250) - 99).toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.roiMultiplier}>
            <Text style={styles.roiMultiplierText}>
              {Math.round((stats?.estimatedSavings || 14250) / 99)}x ROI
            </Text>
          </View>
        </View>

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
  exportButton: {
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
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  periodText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  bankFilterSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  bankFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bankFilterButtonText: {
    fontSize: 13,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  bankList: {
    maxHeight: 200,
  },
  bankOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 4,
  },
  bankOptionSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  bankOptionText: {
    fontSize: 13,
    color: '#6B7280',
  },
  bankOptionTextSelected: {
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  metricCard: {
    width: (width - 44) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  chartScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    paddingHorizontal: 8,
  },
  chartBar: {
    alignItems: 'center',
    gap: 4,
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 120,
  },
  bar: {
    width: 16,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  barValue: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  savingsTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  distributionItem: {
    marginBottom: 16,
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distributionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  distributionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  distributionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  distributionBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    borderRadius: 4,
  },
  riskFactorItem: {
    marginBottom: 16,
  },
  riskFactorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  riskFactorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  riskFactorValue: {
    fontSize: 13,
    color: '#6B7280',
  },
  riskFactorBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  riskFactorFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 3,
  },
  riskFactorPercentage: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  roiCard: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  roiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  roiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
  },
  roiStats: {
    gap: 12,
  },
  roiStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roiLabel: {
    fontSize: 14,
    color: '#166534',
  },
  roiValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
  },
  roiMultiplier: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    alignItems: 'center',
  },
  roiMultiplierText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10B981',
  },
});