import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Simulated real-time data (in production, this would come from your backend)
const mockDashboardData = {
  thisMonth: {
    blocked: 12,
    flagged: 8,
    autoApproved: 247,
    protectedRevenue: 18750,
    chargebacksPrevented: 12,
  },
  recentAlerts: [
    {
      id: '1',
      orderId: '#ORD-2847',
      customer: 'John Smith',
      amount: 1249.99,
      riskScore: 87,
      reason: 'High-risk IP location + Mismatched billing',
      timestamp: '2 min ago',
      status: 'blocked',
    },
    {
      id: '2',
      orderId: '#ORD-2845',
      customer: 'Sarah Johnson',
      amount: 549.00,
      riskScore: 68,
      reason: 'New customer + High order value',
      timestamp: '15 min ago',
      status: 'flagged',
    },
    {
      id: '3',
      orderId: '#ORD-2842',
      customer: 'Mike Davis',
      amount: 2100.00,
      riskScore: 82,
      reason: 'Velocity check failed + VPN detected',
      timestamp: '1 hour ago',
      status: 'blocked',
    },
  ],
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  const data = mockDashboardData;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Protection Dashboard</Text>
        <Text style={styles.subtitle}>Real-time chargeback prevention</Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, styles.blockedCard]}>
          <Ionicons name="shield-checkmark" size={32} color="#ef4444" />
          <Text style={styles.metricValue}>{data.thisMonth.blocked}</Text>
          <Text style={styles.metricLabel}>Blocked</Text>
          <Text style={styles.metricSubtext}>This month</Text>
        </View>

        <View style={[styles.metricCard, styles.flaggedCard]}>
          <Ionicons name="alert-circle" size={32} color="#f59e0b" />
          <Text style={styles.metricValue}>{data.thisMonth.flagged}</Text>
          <Text style={styles.metricLabel}>Flagged</Text>
          <Text style={styles.metricSubtext}>Awaiting review</Text>
        </View>

        <View style={[styles.metricCard, styles.approvedCard]}>
          <Ionicons name="checkmark-circle" size={32} color="#10b981" />
          <Text style={styles.metricValue}>{data.thisMonth.autoApproved}</Text>
          <Text style={styles.metricLabel}>Auto-Approved</Text>
          <Text style={styles.metricSubtext}>This month</Text>
        </View>

        <View style={[styles.metricCard, styles.revenueCard]}>
          <Ionicons name="cash" size={32} color="#3b82f6" />
          <Text style={styles.metricValue}>${(data.thisMonth.protectedRevenue / 1000).toFixed(1)}k</Text>
          <Text style={styles.metricLabel}>Protected</Text>
          <Text style={styles.metricSubtext}>Revenue saved</Text>
        </View>
      </View>

      {/* Status Banner */}
      <View style={styles.statusBanner}>
        <View style={styles.statusIndicator} />
        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>🛡️ Pre-Auth Scanning Active</Text>
          <Text style={styles.statusText}>
            All incoming orders are automatically scanned before payment capture
          </Text>
        </View>
      </View>

      {/* Recent High-Risk Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚠️ Recent Alerts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders' as never)}>
            <Text style={styles.viewAll}>View All →</Text>
          </TouchableOpacity>
        </View>

        {data.recentAlerts.map((alert) => (
          <TouchableOpacity 
            key={alert.id}
            style={styles.alertCard}
            onPress={() => navigation.navigate('Orders' as never)}
          >
            <View style={styles.alertHeader}>
              <View style={styles.alertLeft}>
                <Text style={styles.alertOrderId}>{alert.orderId}</Text>
                <Text style={styles.alertCustomer}>{alert.customer}</Text>
              </View>
              <View style={styles.alertRight}>
                <Text style={styles.alertAmount}>${alert.amount.toFixed(2)}</Text>
                <View style={[
                  styles.statusBadge,
                  alert.status === 'blocked' ? styles.blockedBadge : styles.flaggedBadge
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {alert.status === 'blocked' ? '🚫 Blocked' : '⚠️ Review'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.alertRisk}>
              <View style={styles.riskBar}>
                <View 
                  style={[
                    styles.riskFill,
                    { 
                      width: `${alert.riskScore}%`,
                      backgroundColor: alert.riskScore >= 75 ? '#ef4444' : '#f59e0b'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.riskScore}>Risk: {alert.riskScore}</Text>
            </View>

            <Text style={styles.alertReason}>{alert.reason}</Text>
            <Text style={styles.alertTime}>{alert.timestamp}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡️ Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Orders' as never)}
        >
          <Ionicons name="list" size={24} color="#3b82f6" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Review Flagged Orders</Text>
            <Text style={styles.actionSubtext}>{data.thisMonth.flagged} orders awaiting decision</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Analytics' as never)}
        >
          <Ionicons name="stats-chart" size={24} color="#10b981" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>View Analytics</Text>
            <Text style={styles.actionSubtext}>Detailed protection insights</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <Ionicons name="settings" size={24} color="#8b5cf6" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Configure Rules</Text>
            <Text style={styles.actionSubtext}>Adjust risk thresholds & automation</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  blockedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  flaggedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  approvedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  revenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  metricSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  statusBanner: {
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginTop: 6,
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  alertLeft: {
    flex: 1,
  },
  alertOrderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  alertCustomer: {
    fontSize: 14,
    color: '#6b7280',
  },
  alertRight: {
    alignItems: 'flex-end',
  },
  alertAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  blockedBadge: {
    backgroundColor: '#fee2e2',
  },
  flaggedBadge: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertRisk: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  riskBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  riskFill: {
    height: '100%',
    borderRadius: 3,
  },
  riskScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 60,
  },
  alertReason: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  actionSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
});