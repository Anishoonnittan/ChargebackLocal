import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

type AdminSupportDashboardScreenProps = {
  navigation: any;
  sessionToken: string;
};

const statusColors: Record<string, string> = {
  open: '#10B981',
  in_progress: '#3B82F6',
  waiting: '#F59E0B',
  resolved: '#8B5CF6',
  closed: '#6B7280',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function AdminSupportDashboardScreen({ navigation, sessionToken }: AdminSupportDashboardScreenProps) {
  const [selectedApp, setSelectedApp] = useState<'all' | 'scamvigil' | 'chargeback'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const stats = useQuery(api.supportTickets.getAdminStats, { sessionToken });
  const allTickets = useQuery(api.supportTickets.getAllTickets, { sessionToken });

  const filteredTickets = allTickets?.filter((ticket) => {
    if (selectedApp !== 'all' && ticket.app !== selectedApp) return false;
    if (selectedStatus !== 'all' && ticket.status !== selectedStatus) return false;
    return true;
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Dashboard</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CannedResponses')}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="mail-open-outline" size={24} color="#2563EB" />
              <Text style={styles.statValue}>{stats.openTickets}</Text>
              <Text style={styles.statLabel}>Open</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time-outline" size={24} color="#F59E0B" />
              <Text style={styles.statValue}>{stats.inProgressTickets}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#8B5CF6" />
              <Text style={styles.statValue}>{stats.resolvedToday}</Text>
              <Text style={styles.statLabel}>Resolved Today</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="star-outline" size={24} color="#10B981" />
              <Text style={styles.statValue}>{Number(stats.avgRating || 0).toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
          </View>
        )}

        {/* Filters */}
        <View style={styles.filtersSection}>
          <Text style={styles.filtersTitle}>Filters</Text>

          {/* App Filter */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, selectedApp === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedApp('all')}
            >
              <Text style={[styles.filterChipText, selectedApp === 'all' && styles.filterChipTextActive]}>
                All Apps
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedApp === 'scamvigil' && styles.filterChipActive]}
              onPress={() => setSelectedApp('scamvigil')}
            >
              <Text style={[styles.filterChipText, selectedApp === 'scamvigil' && styles.filterChipTextActive]}>
                ScamVigil
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedApp === 'chargeback' && styles.filterChipActive]}
              onPress={() => setSelectedApp('chargeback')}
            >
              <Text style={[styles.filterChipText, selectedApp === 'chargeback' && styles.filterChipTextActive]}>
                ChargebackShield
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilterScroll}>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, selectedStatus === 'all' && styles.filterChipActive]}
                onPress={() => setSelectedStatus('all')}
              >
                <Text style={[styles.filterChipText, selectedStatus === 'all' && styles.filterChipTextActive]}>
                  All Status
                </Text>
              </TouchableOpacity>
              {Object.keys(statusLabels).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterChip, selectedStatus === status && styles.filterChipActive]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
                  <Text style={[styles.filterChipText, selectedStatus === status && styles.filterChipTextActive]}>
                    {statusLabels[status]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Tickets List */}
        <View style={styles.ticketsSection}>
          <Text style={styles.ticketsTitle}>
            Tickets ({filteredTickets?.length || 0})
          </Text>

          {!filteredTickets ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : filteredTickets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No tickets found</Text>
            </View>
          ) : (
            <View style={styles.ticketsList}>
              {filteredTickets.map((ticket) => (
                <TouchableOpacity
                  key={ticket._id}
                  style={styles.ticketCard}
                  onPress={() => navigation.navigate('AdminTicketDetail', { ticketId: ticket._id })}
                >
                  <View style={styles.ticketHeader}>
                    <View style={styles.ticketNumber}>
                      <Ionicons name="ticket" size={16} color="#6B7280" />
                      <Text style={styles.ticketNumberText}>{ticket.ticketNumber}</Text>
                    </View>
                    <View style={styles.appBadge}>
                      <Text style={styles.appBadgeText}>
                        {ticket.app === 'scamvigil' ? 'SV' : 'CB'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.ticketSubject} numberOfLines={1}>
                    {ticket.subject}
                  </Text>

                  <View style={styles.ticketFooter}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColors[ticket.status] + '20' },
                      ]}
                    >
                      <View
                        style={[styles.statusDot, { backgroundColor: statusColors[ticket.status] }]}
                      />
                      <Text style={[styles.statusText, { color: statusColors[ticket.status] }]}>
                        {statusLabels[ticket.status]}
                      </Text>
                    </View>
                    <Text style={styles.ticketTime}>{formatDate(ticket._creationTime)}</Text>
                  </View>

                  {ticket.assignedTo && (
                    <View style={styles.assignedBadge}>
                      <Ionicons name="person" size={12} color="#6B7280" />
                      <Text style={styles.assignedText}>Assigned</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filtersSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statusFilterScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ticketsSection: {
    paddingHorizontal: 20,
  },
  ticketsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  ticketsList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  appBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  appBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ticketTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  assignedText: {
    fontSize: 11,
    color: '#6B7280',
  },
});