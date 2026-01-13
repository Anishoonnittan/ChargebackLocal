import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Switch, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface PreAuthOrder {
  id: string;
  orderId: string;
  customerEmail: string;
  orderAmount: number;
  quickRiskScore: number;
  quickRiskLevel: RiskLevel;
  quickRiskFactors: string[];
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'UNDER_REVIEW' | 'MOVED_TO_POST_AUTH';
  submittedAt: number;
}

interface PreAuthDashboardProps {
  onNavigateToOrder: (orderId: string) => void;
  onNavigateToSettings: () => void;
  onNavigateToPostAuth?: () => void;
}

const getRiskColor = (level: RiskLevel) => {
  switch (level) {
    case 'CRITICAL': return '#EF4444';
    case 'HIGH': return '#F97316';
    case 'MEDIUM': return '#EABA00';
    case 'LOW': return '#10B981';
    default: return colors.textMuted;
  }
};

const getRiskIcon = (level: RiskLevel) => {
  switch (level) {
    case 'CRITICAL': return 'alert-circle';
    case 'HIGH': return 'alert';
    case 'MEDIUM': return 'information';
    case 'LOW': return 'check-circle';
    default: return 'help-circle';
  }
};

const OrderCard: React.FC<{ 
  order: PreAuthOrder; 
  onPress: () => void;
  onApprove?: () => void;
  onDecline?: () => void;
  onMoveToPostAuth?: () => void;
}> = ({ order, onPress, onApprove, onDecline, onMoveToPostAuth }) => {
  const riskColor = getRiskColor(order.quickRiskLevel);
  const riskIcon = getRiskIcon(order.quickRiskLevel);

  const statusBadgeColor = order.status === 'APPROVED' ? '#10B981' : 
                          order.status === 'DECLINED' ? '#EF4444' : 
                          order.status === 'MOVED_TO_POST_AUTH' ? '#8B5CF6' :
                          colors.surfaceVariant;
  const statusBadgeText = order.status === 'MOVED_TO_POST_AUTH' ? 'In Deep Scan' : 
                         order.status === 'UNDER_REVIEW' ? 'REVIEWING' :
                         order.status;

  const showApproveDecline = order.status === 'PENDING' || order.status === 'UNDER_REVIEW';
  const showMoveToPostAuth = order.status === 'APPROVED';
  const isInPostAuth = order.status === 'MOVED_TO_POST_AUTH';

  return (
    <View style={[styles.orderCard, shadows.sm]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={styles.orderHeader}>
          <View style={styles.orderIdentifier}>
            <Text style={styles.orderId}>{order.orderId}</Text>
            <Text style={styles.customerEmail}>{order.customerEmail}</Text>
          </View>
          <View style={[styles.riskBadge, { borderColor: riskColor }]}>
            <MaterialCommunityIcons name={riskIcon} size={16} color={riskColor} />
            <Text style={[styles.riskScore, { color: riskColor }]}>{order.quickRiskScore}</Text>
          </View>
        </View>

        <View style={styles.orderContent}>
          <View style={styles.amountSection}>
            <Text style={styles.label}>Order Amount</Text>
            <Text style={styles.amount}>${order.orderAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.statusSection}>
            <View style={[styles.statusBadge, { backgroundColor: statusBadgeColor }]}>
              <Text style={styles.statusText}>{statusBadgeText}</Text>
            </View>
          </View>
        </View>

        {order.quickRiskFactors.length > 0 && (
          <View style={styles.riskFactors}>
            <Text style={styles.riskFactorsLabel}>Risk Factors:</Text>
            <Text style={styles.riskFactorsList}>{order.quickRiskFactors.slice(0, 2).join(', ')}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Action Buttons */}
      {showApproveDecline && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            onPress={onDecline} 
            style={[styles.actionBtn, styles.declineBtn]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" />
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={onApprove} 
            style={[styles.actionBtn, styles.approveBtn]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" />
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}

      {showMoveToPostAuth && onMoveToPostAuth && (
        <TouchableOpacity 
          onPress={onMoveToPostAuth} 
          style={[styles.actionBtn, styles.moveToPostAuthBtn]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-right-circle" size={18} color={colors.primary} />
          <Text style={styles.moveToPostAuthText}>Move to Deep Scan (Post-Auth)</Text>
        </TouchableOpacity>
      )}

      {isInPostAuth && (
        <View style={styles.inPostAuthBadge}>
          <MaterialCommunityIcons name="shield-check" size={16} color="#8B5CF6" />
          <Text style={styles.inPostAuthText}>In deep scan monitoring</Text>
        </View>
      )}
    </View>
  );
};

export const PreAuthDashboard: React.FC<PreAuthDashboardProps> = ({ 
  onNavigateToOrder, 
  onNavigateToSettings,
  onNavigateToPostAuth 
}) => {
  const [loading, setLoading] = React.useState(false);
  const [autoApprove, setAutoApprove] = React.useState(true);
  const [orders, setOrders] = React.useState<PreAuthOrder[]>([
    {
      id: '1',
      orderId: 'ORD-20250120-001',
      customerEmail: 'john.doe@example.com',
      orderAmount: 1200,
      quickRiskScore: 78,
      quickRiskLevel: 'HIGH',
      quickRiskFactors: ['High-value first order', 'Disposable email domain'],
      status: 'PENDING',
      submittedAt: Date.now() - 300000,
    },
    {
      id: '2',
      orderId: 'ORD-20250120-002',
      customerEmail: 'sarah.smith@example.com',
      orderAmount: 450,
      quickRiskScore: 25,
      quickRiskLevel: 'LOW',
      quickRiskFactors: [],
      status: 'APPROVED',
      submittedAt: Date.now() - 600000,
    },
    {
      id: '3',
      orderId: 'ORD-20250120-003',
      customerEmail: 'rush.buyer@gmail.com',
      orderAmount: 890,
      quickRiskScore: 92,
      quickRiskLevel: 'CRITICAL',
      quickRiskFactors: ['Velocity spike: 5 orders in 1 hour', 'Mismatched geolocation', 'High-risk country'],
      status: 'UNDER_REVIEW',
      submittedAt: Date.now() - 120000,
    },
  ]);

  const handleApprove = (orderId: string) => {
    Alert.alert(
      'Approve Order',
      'This order will be marked as approved and ready to move to post-auth monitoring.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => {
            setOrders(prev => prev.map(o => 
              o.id === orderId ? { ...o, status: 'APPROVED' as const } : o
            ));
          }
        }
      ]
    );
  };

  const handleDecline = (orderId: string) => {
    Alert.alert(
      'Decline Order',
      'This order will be declined and blocked from processing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            setOrders(prev => prev.map(o => 
              o.id === orderId ? { ...o, status: 'DECLINED' as const } : o
            ));
          }
        }
      ]
    );
  };

  const handleMoveToPostAuth = (orderId: string) => {
    Alert.alert(
      'Move to Post-Auth',
      'This order will be moved to deep scan post-authorization monitoring.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move',
          style: 'default',
          onPress: () => {
            setOrders(prev => prev.map(o => 
              o.id === orderId ? { ...o, status: 'MOVED_TO_POST_AUTH' as const } : o
            ));
          }
        }
      ]
    );
  };

  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'UNDER_REVIEW');
  const approvedOrders = orders.filter(o => o.status === 'APPROVED');
  const inPostAuthOrders = orders.filter(o => o.status === 'MOVED_TO_POST_AUTH');
  const declinedOrders = orders.filter(o => o.status === 'DECLINED');

  const stats = [
    { label: 'Pending Review', value: pendingOrders.length.toString(), icon: 'timer-sand', color: '#F97316' },
    { label: 'Approved', value: approvedOrders.length.toString(), icon: 'check-circle', color: '#10B981' },
    { label: 'Declined', value: declinedOrders.length.toString(), icon: 'close-circle', color: '#EF4444' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Pre-Authorization</Text>
            <Text style={styles.subtitle}>Prevent fraud before fulfillment</Text>
          </View>
          <TouchableOpacity onPress={onNavigateToSettings} activeOpacity={0.6}>
            <View style={styles.settingsButton}>
              <MaterialCommunityIcons name="cog" size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Auto-Approve Toggle */}
        <View style={[styles.autoApproveCard, shadows.sm]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <MaterialCommunityIcons name="robot" size={20} color={colors.primary} />
              <Text style={styles.autoApproveTitle}>Auto-Approve Low Risk</Text>
            </View>
            <Text style={styles.autoApproveSubtitle}>Orders with risk score under 30 auto-approved</Text>
          </View>
          <Switch
            value={autoApprove}
            onValueChange={setAutoApprove}
            trackColor={{ false: colors.borderLight, true: colors.primary + '40' }}
            thumbColor={autoApprove ? colors.primary : colors.textMuted}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, idx) => (
            <View key={idx} style={[styles.statCard, shadows.sm]}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.color + '20' }]}>
                <MaterialCommunityIcons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Pending Orders Section */}
        {pendingOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔴 Needs Your Attention</Text>
              <Text style={styles.sectionCount}>{pendingOrders.length}</Text>
            </View>
            <View style={styles.ordersList}>
              {pendingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPress={() => onNavigateToOrder(order.orderId)}
                  onApprove={() => handleApprove(order.id)}
                  onDecline={() => handleDecline(order.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Approved Orders Section */}
        {approvedOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✅ Ready for Post-Auth</Text>
              <Text style={styles.sectionCount}>{approvedOrders.length}</Text>
            </View>
            <View style={styles.ordersList}>
              {approvedOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPress={() => onNavigateToOrder(order.orderId)}
                  onMoveToPostAuth={() => handleMoveToPostAuth(order.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* In Post-Auth Monitoring */}
        {inPostAuthOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🛡️ In Deep Scan</Text>
              <Text style={styles.sectionCount}>{inPostAuthOrders.length}</Text>
            </View>
            <View style={styles.ordersList}>
              {inPostAuthOrders.slice(0, 3).map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPress={() => onNavigateToOrder(order.orderId)}
                />
              ))}
            </View>
            {onNavigateToPostAuth && (
              <TouchableOpacity onPress={onNavigateToPostAuth} style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>View All in Post-Auth Dashboard</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Info Box */}
        <View style={[styles.infoBox, shadows.sm]}>
          <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Two-Layer Defense</Text>
            <Text style={styles.infoText}>Pre-auth checks prevent bad orders. Auto-approve low-risk orders or manually review high-risk ones before moving to deep post-auth analysis.</Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoApproveCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  autoApproveTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  autoApproveSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  ordersList: {
    gap: spacing.md,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderIdentifier: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  customerEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  riskScore: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  amountSection: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  statusSection: {},
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  riskFactors: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  riskFactorsLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  riskFactorsList: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minHeight: 44,
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  declineBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  moveToPostAuthBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  moveToPostAuthText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  inPostAuthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#8B5CF6' + '15',
    borderRadius: borderRadius.sm,
  },
  inPostAuthText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  infoBox: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});

export default PreAuthDashboard;