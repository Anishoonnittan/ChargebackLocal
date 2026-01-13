import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

interface CommunityAlertsScreenProps {
  onBack: () => void;
}

export default function CommunityAlertsScreen({ onBack }: CommunityAlertsScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'scam' | 'suspicious' | 'resolved'>('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertDescription, setNewAlertDescription] = useState('');
  const [newAlertCategory, setNewAlertCategory] = useState('Other');
  const [newAlertLocation, setNewAlertLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Real-time Convex queries
  const alerts = useQuery(api.communityAlerts.getCommunityAlerts, { 
    filter: selectedFilter,
    limit: 50 
  });
  const stats = useQuery(api.communityAlerts.getCommunityStats);
  
  // Add console logs to verify real-time data
  console.log('🔴 Community Alerts - Stats:', stats);
  console.log('🔴 Community Alerts - Alerts count:', alerts?.length ?? 0);
  
  // Mutation for submitting alerts
  const submitAlert = useMutation(api.communityAlerts.submitCommunityAlert);

  const handleSubmitAlert = async () => {
    if (!newAlertTitle.trim() || !newAlertDescription.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await submitAlert({
        title: newAlertTitle,
        description: newAlertDescription,
        category: newAlertCategory,
        location: newAlertLocation || 'Sydney, NSW',
        severity: 'medium',
        type: 'suspicious',
      });
      
      setNewAlertTitle('');
      setNewAlertDescription('');
      setNewAlertCategory('Other');
      setNewAlertLocation('');
      setShowReportModal(false);
    } catch (error) {
      console.error('Failed to submit alert:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = alerts === undefined || stats === undefined;
  const alertsList = alerts ?? [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'scam': return 'alert-circle';
      case 'suspicious': return 'warning';
      case 'resolved': return 'checkmark-circle';
      default: return 'information-circle';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'scam': return theme.colors.error;
      case 'suspicious': return theme.colors.warning;
      case 'resolved': return theme.colors.success;
      default: return theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Alerts</Text>
        <TouchableOpacity onPress={() => setShowReportModal(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Banner - Real-time */}
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.membersCount ?? 0}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.alertsTodayCount ?? 0}</Text>
            <Text style={styles.statLabel}>Alerts Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.scamsStoppedCount ?? 0}</Text>
            <Text style={styles.statLabel}>Scams Stopped</Text>
          </View>
        </View>

        {/* Prominent Report Button */}
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => setShowReportModal(true)}
        >
          <Ionicons name="warning" size={24} color="#fff" />
          <View style={styles.reportButtonText}>
            <Text style={styles.reportButtonTitle}>Report a Scam</Text>
            <Text style={styles.reportButtonSubtitle}>Help protect your community</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {[
            { key: 'all', label: 'All Alerts', icon: 'apps' },
            { key: 'scam', label: 'Scams', icon: 'alert-circle' },
            { key: 'suspicious', label: 'Suspicious', icon: 'warning' },
            { key: 'resolved', label: 'Resolved', icon: 'checkmark-circle' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                selectedFilter === filter.key && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(filter.key as any)}
            >
              <Ionicons 
                name={filter.icon as any} 
                size={16} 
                color={selectedFilter === filter.key ? '#fff' : theme.colors.text} 
              />
              <Text style={[
                styles.filterText,
                selectedFilter === filter.key && styles.filterTextActive,
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading state */}
        {isLoading && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 12, color: theme.colors.textSecondary }}>
              Loading alerts...
            </Text>
          </View>
        )}

        {/* Empty state */}
        {!isLoading && alertsList.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="alert-circle-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              No alerts yet
            </Text>
            <Text style={{ marginTop: 4, color: theme.colors.textSecondary, textAlign: 'center' }}>
              Be the first to report a scam in your community
            </Text>
          </View>
        )}

        {/* Alerts List - Real-time */}
        {!isLoading && alertsList.map((alert) => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={[styles.alertBadge, { backgroundColor: getAlertColor(alert.type) + '20' }]}>
                <Ionicons 
                  name={getAlertIcon(alert.type) as any} 
                  size={20} 
                  color={getAlertColor(alert.type)} 
                />
              </View>
              <View style={styles.alertHeaderInfo}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMeta}>
                  {alert.location} • {alert.timestamp}
                </Text>
              </View>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
                <Text style={styles.severityText}>
                  {alert.severity.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.alertDescription}>{alert.description}</Text>

            <View style={styles.alertFooter}>
              <View style={styles.categoryBadge}>
                <Ionicons name="pricetag" size={12} color={theme.colors.primary} />
                <Text style={styles.categoryText}>{alert.category}</Text>
              </View>
              <Text style={styles.reporterText}>Reported by {alert.reporter}</Text>
            </View>

            <View style={styles.alertActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="thumbs-up-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Helpful ({alert.helpfulCount})</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Comment ({alert.commentCount})</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report a Scam</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Alert Title *</Text>
                <TextInput
                  style={styles.input}
                  value={newAlertTitle}
                  onChangeText={setNewAlertTitle}
                  placeholder="Brief description of the scam"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newAlertDescription}
                  onChangeText={setNewAlertDescription}
                  placeholder="What happened? Include details to help others stay safe."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, submitting && { opacity: 0.6 }]} 
                onPress={handleSubmitAlert}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Submit Alert</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowReportModal(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  filtersContainer: {
    marginTop: 20,
    marginBottom: 12,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  filterTextActive: {
    color: '#fff',
  },
  alertCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  alertBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertHeaderInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  alertMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  alertDescription: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  reporterText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 18,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportButtonText: {
    flex: 1,
  },
  reportButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  reportButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
});