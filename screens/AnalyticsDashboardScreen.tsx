import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

interface AnalyticsDashboardScreenProps {
  onBack: () => void;
}

const { width } = Dimensions.get('window');

export default function AnalyticsDashboardScreen({ onBack }: AnalyticsDashboardScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const stats = {
    totalScans: 1247,
    threatsBlocked: 89,
    moneySaved: 145000,
    peopleProtected: 342,
  };

  const trendData = [
    { day: 'Mon', scans: 45, threats: 3 },
    { day: 'Tue', scans: 62, threats: 5 },
    { day: 'Wed', scans: 38, threats: 2 },
    { day: 'Thu', scans: 71, threats: 7 },
    { day: 'Fri', scans: 55, threats: 4 },
    { day: 'Sat', scans: 28, threats: 1 },
    { day: 'Sun', scans: 34, threats: 2 },
  ];

  const maxScans = Math.max(...trendData.map(d => d.scans));

  const topThreats = [
    { type: 'Investment Scam', count: 23, change: +15 },
    { type: 'Romance Scam', count: 18, change: -5 },
    { type: 'Phishing', count: 15, change: +8 },
    { type: 'Marketplace Fraud', count: 12, change: +3 },
    { type: 'Tech Support Scam', count: 9, change: -2 },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period && styles.periodTextActive,
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="eye" size={24} color={theme.colors.primary} />
            <Text style={styles.metricValue}>{stats.totalScans.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Total Scans</Text>
            <Text style={[styles.metricChange, { color: theme.colors.success }]}>
              ↑ 12% vs last {selectedPeriod}
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.colors.error + '15' }]}>
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.error} />
            <Text style={styles.metricValue}>{stats.threatsBlocked}</Text>
            <Text style={styles.metricLabel}>Threats Blocked</Text>
            <Text style={[styles.metricChange, { color: theme.colors.success }]}>
              ↑ 8% vs last {selectedPeriod}
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.colors.success + '15' }]}>
            <Ionicons name="cash" size={24} color={theme.colors.success} />
            <Text style={styles.metricValue}>${(stats.moneySaved / 1000).toFixed(0)}K</Text>
            <Text style={styles.metricLabel}>Money Saved</Text>
            <Text style={[styles.metricChange, { color: theme.colors.success }]}>
              ↑ 25% vs last {selectedPeriod}
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.colors.warning + '15' }]}>
            <Ionicons name="people" size={24} color={theme.colors.warning} />
            <Text style={styles.metricValue}>{stats.peopleProtected}</Text>
            <Text style={styles.metricLabel}>People Protected</Text>
            <Text style={[styles.metricChange, { color: theme.colors.success }]}>
              ↑ 18% vs last {selectedPeriod}
            </Text>
          </View>
        </View>

        {/* Trend Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Scan Activity</Text>
          <View style={styles.chart}>
            {trendData.map((data, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={styles.chartBarContainer}>
                  <View 
                    style={[
                      styles.chartBarFill, 
                      { 
                        height: `${(data.scans / maxScans) * 100}%`,
                        backgroundColor: data.threats > 5 ? theme.colors.error : theme.colors.primary 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.chartLabel}>{data.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Threats */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Top Threats Detected</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {topThreats.map((threat, index) => (
            <View key={index} style={styles.threatItem}>
              <View style={styles.threatRank}>
                <Text style={styles.threatRankText}>{index + 1}</Text>
              </View>
              <View style={styles.threatInfo}>
                <Text style={styles.threatType}>{threat.type}</Text>
                <Text style={styles.threatCount}>{threat.count} incidents</Text>
              </View>
              <View style={[
                styles.threatChangeBadge,
                { backgroundColor: threat.change > 0 ? theme.colors.error + '20' : theme.colors.success + '20' }
              ]}>
                <Ionicons 
                  name={threat.change > 0 ? "trending-up" : "trending-down"} 
                  size={14} 
                  color={threat.change > 0 ? theme.colors.error : theme.colors.success} 
                />
                <Text style={[
                  styles.threatChangeText,
                  { color: threat.change > 0 ? theme.colors.error : theme.colors.success }
                ]}>
                  {Math.abs(threat.change)}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ROI Calculator */}
        <View style={styles.roiCard}>
          <View style={styles.roiHeader}>
            <Ionicons name="calculator" size={28} color={theme.colors.success} />
            <Text style={styles.roiTitle}>Return on Investment</Text>
          </View>
          <View style={styles.roiStats}>
            <View style={styles.roiStat}>
              <Text style={styles.roiStatLabel}>Subscription Cost</Text>
              <Text style={styles.roiStatValue}>$149/mo</Text>
            </View>
            <View style={styles.roiDivider} />
            <View style={styles.roiStat}>
              <Text style={styles.roiStatLabel}>Losses Prevented</Text>
              <Text style={[styles.roiStatValue, { color: theme.colors.success }]}>$145K</Text>
            </View>
            <View style={styles.roiDivider} />
            <View style={styles.roiStat}>
              <Text style={styles.roiStatLabel}>ROI</Text>
              <Text style={[styles.roiStatValue, { color: theme.colors.success }]}>973x</Text>
            </View>
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
  exportButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  periodTextActive: {
    color: '#fff',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 11,
    fontWeight: '600',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    gap: 8,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  chartLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  threatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  threatRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  threatRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  threatInfo: {
    flex: 1,
  },
  threatType: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  threatCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  threatChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  threatChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roiCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  roiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  roiTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  roiStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roiStat: {
    flex: 1,
    alignItems: 'center',
  },
  roiStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  roiStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  roiDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
  },
});