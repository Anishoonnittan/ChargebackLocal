import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type OrderStatus = 'pre-auth' | 'post-auth' | 'blocked';
type RiskLevel = 'low' | 'medium' | 'high';

interface Order {
  id: string;
  orderId: string;
  customer: string;
  email: string;
  amount: number;
  riskScore: number;
  riskLevel: RiskLevel;
  status: OrderStatus;
  timestamp: string;
  reasons: string[];
  ipAddress?: string;
  location?: string;
}

// Mock orders (in production, this would come from your backend)
const mockOrders: Order[] = [
  {
    id: '1',
    orderId: '#ORD-2845',
    customer: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    amount: 549.00,
    riskScore: 68,
    riskLevel: 'medium',
    status: 'pre-auth',
    timestamp: '15 min ago',
    reasons: ['New customer', 'High order value for first purchase'],
    ipAddress: '192.168.1.105',
    location: 'New York, US',
  },
  {
    id: '2',
    orderId: '#ORD-2840',
    customer: 'Emily Chen',
    email: 'emily.chen@email.com',
    amount: 299.00,
    riskScore: 55,
    riskLevel: 'medium',
    status: 'pre-auth',
    timestamp: '2 hours ago',
    reasons: ['Shipping to different country than billing'],
    ipAddress: '203.45.67.89',
    location: 'Singapore',
  },
  {
    id: '3',
    orderId: '#ORD-2838',
    customer: 'Robert Smith',
    email: 'robert.s@email.com',
    amount: 149.99,
    riskScore: 25,
    riskLevel: 'low',
    status: 'post-auth',
    timestamp: '3 hours ago',
    reasons: [],
    ipAddress: '172.58.32.12',
    location: 'Los Angeles, US',
  },
  {
    id: '4',
    orderId: '#ORD-2835',
    customer: 'Jennifer Lee',
    email: 'jlee@email.com',
    amount: 789.00,
    riskScore: 18,
    riskLevel: 'low',
    status: 'post-auth',
    timestamp: '5 hours ago',
    reasons: [],
    ipAddress: '198.23.45.67',
    location: 'Chicago, US',
  },
  {
    id: '5',
    orderId: '#ORD-2847',
    customer: 'John Smith',
    email: 'john.blocked@email.com',
    amount: 1249.99,
    riskScore: 87,
    riskLevel: 'high',
    status: 'blocked',
    timestamp: '2 min ago',
    reasons: ['High-risk IP location', 'Mismatched billing address', 'VPN detected'],
    ipAddress: '45.67.89.12',
    location: 'Unknown (VPN)',
  },
];

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<'pre-auth' | 'post-auth'>('pre-auth');
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const preAuthOrders = orders.filter(o => o.status === 'pre-auth');
  const postAuthOrders = orders.filter(o => o.status === 'post-auth');
  const blockedOrders = orders.filter(o => o.status === 'blocked');

  const handleApprove = (order: Order) => {
    Alert.alert(
      'Approve Order',
      `Approve order ${order.orderId} for $${order.amount.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => {
            setOrders(prev =>
              prev.map(o =>
                o.id === order.id ? { ...o, status: 'post-auth' as OrderStatus } : o
              )
            );
            Alert.alert('✅ Order Approved', 'Order moved to Post-Auth monitoring');
          },
        },
      ]
    );
  };

  const handleDecline = (order: Order) => {
    Alert.alert(
      'Decline Order',
      `Decline order ${order.orderId}? Payment will not be captured.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            setOrders(prev =>
              prev.map(o =>
                o.id === order.id ? { ...o, status: 'blocked' as OrderStatus } : o
              )
            );
            Alert.alert('🚫 Order Declined', 'Payment was not captured');
          },
        },
      ]
    );
  };

  const handleMoveToPostAuth = (order: Order) => {
    Alert.alert(
      'Move to Post-Auth',
      `Manually move order ${order.orderId} to Post-Auth monitoring?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move',
          onPress: () => {
            setOrders(prev =>
              prev.map(o =>
                o.id === order.id ? { ...o, status: 'post-auth' as OrderStatus } : o
              )
            );
          },
        },
      ]
    );
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
    }
  };

  const getRiskBg = (level: RiskLevel) => {
    switch (level) {
      case 'high': return '#fee2e2';
      case 'medium': return '#fef3c7';
      case 'low': return '#d1fae5';
    }
  };

  const renderOrder = (order: Order, showActions: boolean = false) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderLeft}>
          <Text style={styles.orderId}>{order.orderId}</Text>
          <Text style={styles.customer}>{order.customer}</Text>
          <Text style={styles.email}>{order.email}</Text>
        </View>
        <View style={styles.orderRight}>
          <Text style={styles.amount}>${order.amount.toFixed(2)}</Text>
          <View style={[styles.riskBadge, { backgroundColor: getRiskBg(order.riskLevel) }]}>
            <Text style={[styles.riskBadgeText, { color: getRiskColor(order.riskLevel) }]}>
              {order.riskLevel.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.riskSection}>
        <View style={styles.riskBar}>
          <View
            style={[
              styles.riskFill,
              {
                width: `${order.riskScore}%`,
                backgroundColor: getRiskColor(order.riskLevel),
              },
            ]}
          />
        </View>
        <Text style={styles.riskScore}>Risk: {order.riskScore}</Text>
      </View>

      {order.reasons.length > 0 && (
        <View style={styles.reasonsSection}>
          <Text style={styles.reasonsTitle}>⚠️ Risk Factors:</Text>
          {order.reasons.map((reason, idx) => (
            <Text key={idx} style={styles.reason}>• {reason}</Text>
          ))}
        </View>
      )}

      <View style={styles.metaRow}>
        <Ionicons name="location" size={14} color="#9ca3af" />
        <Text style={styles.metaText}>{order.location}</Text>
        <Text style={styles.metaDivider}>•</Text>
        <Text style={styles.metaText}>{order.timestamp}</Text>
      </View>

      {showActions && order.status === 'pre-auth' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDecline(order)}
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(order)}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}

      {order.status === 'post-auth' && (
        <View style={styles.statusRow}>
          <Ionicons name="shield-checkmark" size={16} color="#10b981" />
          <Text style={styles.statusText}>Monitoring for chargebacks</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Management</Text>
        <Text style={styles.subtitle}>Review and approve orders</Text>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          Orders are automatically scanned. Low-risk orders (under 40) auto-approve to Post-Auth.
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pre-auth' && styles.activeTab]}
          onPress={() => setActiveTab('pre-auth')}
        >
          <Text style={[styles.tabText, activeTab === 'pre-auth' && styles.activeTabText]}>
            Pre-Auth ({preAuthOrders.length})
          </Text>
          {preAuthOrders.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{preAuthOrders.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'post-auth' && styles.activeTab]}
          onPress={() => setActiveTab('post-auth')}
        >
          <Text style={[styles.tabText, activeTab === 'post-auth' && styles.activeTabText]}>
            Post-Auth ({postAuthOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'pre-auth' ? (
          <>
            {preAuthOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={64} color="#10b981" />
                <Text style={styles.emptyTitle}>All Clear! 🎉</Text>
                <Text style={styles.emptyText}>
                  No orders awaiting review. Low-risk orders are automatically approved.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>⚠️ Awaiting Review</Text>
                  <Text style={styles.sectionSubtitle}>
                    Medium/High risk orders need your decision
                  </Text>
                </View>
                {preAuthOrders.map(order => renderOrder(order, true))}
              </>
            )}

            {blockedOrders.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🚫 Auto-Blocked</Text>
                  <Text style={styles.sectionSubtitle}>
                    High-risk orders blocked automatically
                  </Text>
                </View>
                {blockedOrders.map(order => renderOrder(order, false))}
              </>
            )}
          </>
        ) : (
          <>
            {postAuthOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="hourglass" size={64} color="#9ca3af" />
                <Text style={styles.emptyTitle}>No Approved Orders</Text>
                <Text style={styles.emptyText}>
                  Approved orders will appear here for chargeback monitoring
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>✅ Approved & Monitoring</Text>
                  <Text style={styles.sectionSubtitle}>
                    Payments captured, monitoring for disputes
                  </Text>
                </View>
                {postAuthOrders.map(order => renderOrder(order, false))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Quick Stats Footer */}
      <View style={styles.footer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{preAuthOrders.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{postAuthOrders.length}</Text>
          <Text style={styles.statLabel}>Monitoring</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{blockedOrders.length}</Text>
          <Text style={styles.statLabel}>Blocked</Text>
        </View>
      </View>
    </View>
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  customer: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: '#9ca3af',
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  riskSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  reasonsSection: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 6,
  },
  reason: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  metaDivider: {
    fontSize: 12,
    color: '#d1d5db',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  declineButton: {
    backgroundColor: '#ef4444',
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    padding: 10,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#047857',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 12,
    paddingBottom: 20,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});