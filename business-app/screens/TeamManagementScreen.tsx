import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TeamMember {
  _id: string;
  email: string;
  name?: string;
  role: 'OWNER' | 'ADMIN' | 'ANALYST' | 'VIEWER';
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  permissions: {
    canViewScans: boolean;
    canBlockOrders: boolean;
    canApproveOrders: boolean;
    canGenerateEvidence: boolean;
    canManageIntegrations: boolean;
    canManageTeam: boolean;
    canViewAnalytics: boolean;
    canExportData: boolean;
    canManageBilling: boolean;
  };
  lastActiveAt?: number;
  joinedAt?: number;
}

interface Props {
  viewer: any;
  sessionToken: string;
}

const ROLE_PRESETS = {
  OWNER: {
    canViewScans: true,
    canBlockOrders: true,
    canApproveOrders: true,
    canGenerateEvidence: true,
    canManageIntegrations: true,
    canManageTeam: true,
    canViewAnalytics: true,
    canExportData: true,
    canManageBilling: true,
  },
  ADMIN: {
    canViewScans: true,
    canBlockOrders: true,
    canApproveOrders: true,
    canGenerateEvidence: true,
    canManageIntegrations: true,
    canManageTeam: true,
    canViewAnalytics: true,
    canExportData: true,
    canManageBilling: false,
  },
  ANALYST: {
    canViewScans: true,
    canBlockOrders: true,
    canApproveOrders: true,
    canGenerateEvidence: true,
    canManageIntegrations: false,
    canManageTeam: false,
    canViewAnalytics: true,
    canExportData: true,
    canManageBilling: false,
  },
  VIEWER: {
    canViewScans: true,
    canBlockOrders: false,
    canApproveOrders: false,
    canGenerateEvidence: false,
    canManageIntegrations: false,
    canManageTeam: false,
    canViewAnalytics: true,
    canExportData: false,
    canManageBilling: false,
  },
};

export default function TeamManagementScreen({ viewer, sessionToken }: Props) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'ANALYST' | 'VIEWER'>('ANALYST');
  const [customPermissions, setCustomPermissions] = useState(ROLE_PRESETS.ANALYST);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Mock team members (replace with Convex query)
  const teamMembers: TeamMember[] = [
    {
      _id: '1',
      email: 'owner@business.com',
      name: 'John Smith',
      role: 'OWNER',
      status: 'ACTIVE',
      permissions: ROLE_PRESETS.OWNER,
      joinedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      lastActiveAt: Date.now() - 5 * 60 * 1000,
    },
    {
      _id: '2',
      email: 'analyst@business.com',
      name: 'Sarah Johnson',
      role: 'ANALYST',
      status: 'ACTIVE',
      permissions: ROLE_PRESETS.ANALYST,
      joinedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      lastActiveAt: Date.now() - 2 * 60 * 60 * 1000,
    },
    {
      _id: '3',
      email: 'viewer@business.com',
      role: 'VIEWER',
      status: 'INVITED',
      permissions: ROLE_PRESETS.VIEWER,
    },
  ];

  const handleInvite = () => {
    if (!inviteEmail || !inviteName) {
      Alert.alert('Error', 'Please enter both name and email');
      return;
    }

    // TODO: Call Convex mutation to send invitation
    Alert.alert('Success', `Invitation sent to ${inviteEmail}`);
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteName('');
  };

  const handleRemoveMember = (member: TeamMember) => {
    Alert.alert(
      'Remove Team Member',
      `Are you sure you want to remove ${member.name || member.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // TODO: Call Convex mutation
            Alert.alert('Success', 'Team member removed');
          },
        },
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return '#7C3AED';
      case 'ADMIN':
        return '#2563EB';
      case 'ANALYST':
        return '#059669';
      case 'VIEWER':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#10B981';
      case 'INVITED':
        return '#F59E0B';
      case 'SUSPENDED':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Team Management</Text>
          <TouchableOpacity onPress={() => setShowInviteModal(true)} style={styles.inviteButton}>
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.inviteButtonText}>Invite</Text>
          </TouchableOpacity>
        </View>

        {/* Team Overview Card */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Team Overview</Text>
          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{teamMembers.length}</Text>
              <Text style={styles.statLabel}>Total Members</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {teamMembers.filter((m) => m.status === 'ACTIVE').length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {teamMembers.filter((m) => m.status === 'INVITED').length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Team Members List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Members</Text>
          {teamMembers.map((member) => (
            <View key={member._id} style={styles.memberCard}>
              <View
                style={[
                  styles.memberAvatar,
                  { backgroundColor: getRoleColor(member.role) + '20' },
                ]}
              >
                <Text style={[styles.memberAvatarText, { color: getRoleColor(member.role) }]}>
                  {(member.name || member.email)[0].toUpperCase()}
                </Text>
              </View>

              <View style={styles.memberInfo}>
                <View style={styles.memberHeader}>
                  <Text style={styles.memberName}>{member.name || member.email}</Text>
                  <View style={styles.memberBadges}>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
                      <Text style={styles.roleBadgeText}>{member.role}</Text>
                    </View>
                    <View
                      style={[styles.statusBadge, { backgroundColor: getStatusColor(member.status) }]}
                    >
                      <Text style={styles.statusBadgeText}>{member.status}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.memberEmail}>{member.email}</Text>

                <View style={styles.memberStats}>
                  <View style={styles.memberStat}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.memberStatText}>Last active: {formatTimeAgo(member.lastActiveAt)}</Text>
                  </View>
                </View>

                <View style={styles.permissionsSummary}>
                  {member.permissions.canBlockOrders && (
                    <View style={styles.permissionBadge}>
                      <Ionicons name="shield-checkmark" size={12} color="#059669" />
                      <Text style={styles.permissionBadgeText}>Block Orders</Text>
                    </View>
                  )}
                  {member.permissions.canManageTeam && (
                    <View style={styles.permissionBadge}>
                      <Ionicons name="people" size={12} color="#2563EB" />
                      <Text style={styles.permissionBadgeText}>Manage Team</Text>
                    </View>
                  )}
                </View>

                {member.role !== 'OWNER' && (
                  <View style={styles.memberActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => setSelectedMember(member)}>
                      <Ionicons name="create-outline" size={16} color="#2563EB" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]} onPress={() => handleRemoveMember(member)}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      <Text style={[styles.actionButtonText, styles.actionButtonDangerText]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Activity Log */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <Ionicons name="shield-checkmark" size={20} color="#059669" />
              <View style={styles.activityInfo}>
                <Text style={styles.activityText}>Sarah Johnson blocked order #12345</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="person-add" size={20} color="#2563EB" />
              <View style={styles.activityInfo}>
                <Text style={styles.activityText}>John Smith invited viewer@business.com</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Invite Modal */}
      <Modal visible={showInviteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Team Member</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Sarah Johnson"
                value={inviteName}
                onChangeText={setInviteName}
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="sarah@business.com"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.roleSelector}>
                {(['ADMIN', 'ANALYST', 'VIEWER'] as const).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleOption, selectedRole === role && styles.roleOptionSelected]}
                    onPress={() => {
                      setSelectedRole(role);
                      setCustomPermissions(ROLE_PRESETS[role]);
                    }}
                  >
                    <Text style={[styles.roleOptionText, selectedRole === role && styles.roleOptionTextSelected]}>
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Permissions</Text>
              <View style={styles.permissionsGrid}>
                {Object.entries(customPermissions).map(([key, value]) => (
                  <View key={key} style={styles.permissionRow}>
                    <Text style={styles.permissionLabel}>
                      {key.replace(/^can/, '').replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                    <Switch
                      value={value}
                      onValueChange={(newValue) => setCustomPermissions({ ...customPermissions, [key]: newValue })}
                      trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                      thumbColor={value ? '#2563EB' : '#F3F4F6'}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowInviteModal(false)}>
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleInvite}>
                <Text style={styles.modalButtonPrimaryText}>Send Invitation</Text>
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
  scrollContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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
  memberCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  memberBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  memberStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  memberStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberStatText: {
    fontSize: 12,
    color: '#6B7280',
  },
  permissionsSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  permissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  permissionBadgeText: {
    fontSize: 11,
    color: '#4B5563',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563EB',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  actionButtonDanger: {
    borderColor: '#EF4444',
  },
  actionButtonDangerText: {
    color: '#EF4444',
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activityInfo: {
    marginLeft: 12,
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
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
    maxHeight: '90%',
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  roleOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleOptionTextSelected: {
    color: '#2563EB',
  },
  permissionsGrid: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  permissionLabel: {
    fontSize: 14,
    color: '#374151',
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