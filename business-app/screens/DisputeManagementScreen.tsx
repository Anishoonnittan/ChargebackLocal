import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing } from "../../lib/theme";
import type { BusinessUser } from "../types";

// Mock disputes data
const MOCK_DISPUTES = [
  {
    id: "DSP-001",
    orderId: "ORD-8234",
    amount: "$245.00",
    date: "Today",
    reason: "Customer claims unauthorized charge",
    status: "evidence_submitted",
    customerName: "John Smith",
  },
  {
    id: "DSP-002",
    orderId: "ORD-8210",
    amount: "$89.50",
    date: "2 days ago",
    reason: "Item not received",
    status: "filed",
    customerName: "Sarah Johnson",
  },
  {
    id: "DSP-003",
    orderId: "ORD-8189",
    amount: "$1,250.00",
    date: "5 days ago",
    reason: "Quality mismatch",
    status: "won",
    customerName: "Michael Brown",
  },
  {
    id: "DSP-004",
    orderId: "ORD-8156",
    amount: "$150.00",
    date: "1 week ago",
    reason: "Unauthorized charge",
    status: "lost",
    customerName: "Emily Davis",
  },
];

export default function DisputeManagementScreen({
  viewer,
  sessionToken,
}: {
  viewer: BusinessUser;
  sessionToken: string;
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<null | (typeof MOCK_DISPUTES)[0]>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "filed":
        return "#F59E0B";
      case "evidence_submitted":
        return colors.primary;
      case "won":
        return colors.success;
      case "lost":
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "filed":
        return "alert-circle";
      case "evidence_submitted":
        return "cloud-upload";
      case "won":
        return "checkmark-circle";
      case "lost":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredDisputes =
    activeFilter === "all"
      ? MOCK_DISPUTES
      : MOCK_DISPUTES.filter((dispute) => dispute.status === activeFilter);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="document-text" size={32} color={colors.primary} />
          <Text style={styles.title}>Dispute Management</Text>
          <Text style={styles.subtitle}>Manage and track your chargebacks</Text>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {["all", "filed", "evidence_submitted", "won", "lost"].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === filter && styles.filterTabTextActive,
                ]}
              >
                {getStatusLabel(filter)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Disputes List */}
        <View style={styles.disputesContainer}>
          {filteredDisputes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="checkmark-done-circle"
                size={48}
                color={colors.success}
              />
              <Text style={styles.emptyStateText}>No disputes found</Text>
              <Text style={styles.emptyStateSubtext}>
                You're all caught up!
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredDisputes}
              keyExtractor={(item: (typeof MOCK_DISPUTES)[number]) => item.id}
              renderItem={({ item }: { item: (typeof MOCK_DISPUTES)[number] }) => (
                <TouchableOpacity
                  style={styles.disputeCard}
                  onPress={() => {
                    setSelectedDispute(item);
                    setShowDetailModal(true);
                  }}
                >
                  <View style={styles.disputeHeader}>
                    <View style={styles.disputeInfo}>
                      <Text style={styles.disputeId}>{item.id}</Text>
                      <Text style={styles.disputeCustomer}>
                        {item.customerName}
                      </Text>
                    </View>
                    <Ionicons
                      name={getStatusIcon(item.status) as any}
                      size={24}
                      color={getStatusColor(item.status)}
                    />
                  </View>

                  <View style={styles.disputeBody}>
                    <Text style={styles.disputeReason}>{item.reason}</Text>
                    <Text style={styles.disputeOrderId}>Order: {item.orderId}</Text>
                  </View>

                  <View style={styles.disputeFooter}>
                    <View>
                      <Text style={styles.disputeAmount}>{item.amount}</Text>
                      <Text style={styles.disputeDate}>{item.date}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(item.status) + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: getStatusColor(item.status) },
                        ]}
                      >
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Disputes</Text>
            <Text style={styles.statValue}>{MOCK_DISPUTES.length}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg Amount</Text>
            <Text style={styles.statValue}>$668.63</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={styles.statValue}>75%</Text>
          </View>
        </View>
      </ScrollView>

      {/* Dispute Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="chevron-back" size={28} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Dispute Details</Text>
            <View style={{ width: 28 }} />
          </View>

          {selectedDispute && (
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Status Section */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Status</Text>
                <View style={styles.statusCard}>
                  <Ionicons
                    name={getStatusIcon(selectedDispute.status) as any}
                    size={32}
                    color={getStatusColor(selectedDispute.status)}
                  />
                  <Text style={styles.statusCardText}>
                    {getStatusLabel(selectedDispute.status)}
                  </Text>
                </View>
              </View>

              {/* Dispute Info */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Dispute Information</Text>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Dispute ID</Text>
                    <Text style={styles.infoValue}>
                      {selectedDispute.id}
                    </Text>
                  </View>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Order ID</Text>
                    <Text style={styles.infoValue}>
                      {selectedDispute.orderId}
                    </Text>
                  </View>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Amount</Text>
                    <Text style={styles.infoValue}>
                      {selectedDispute.amount}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Reason */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Chargeback Reason</Text>
                <View style={styles.reasonCard}>
                  <Text style={styles.reasonText}>{selectedDispute.reason}</Text>
                </View>
              </View>

              {/* Evidence Section */}
              {selectedDispute.status === "filed" && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    Alert.alert(
                      "Upload Evidence",
                      "Evidence builder features coming soon"
                    );
                  }}
                >
                  <Ionicons name="cloud-upload" size={20} color="white" />
                  <Text style={styles.actionButtonText}>
                    Upload Evidence Package
                  </Text>
                </TouchableOpacity>
              )}

              {selectedDispute.status === "won" && (
                <View style={styles.successCard}>
                  <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                  <Text style={styles.successTitle}>Dispute Won!</Text>
                  <Text style={styles.successText}>
                    You successfully recovered {selectedDispute.amount}
                  </Text>
                </View>
              )}

              {selectedDispute.status === "lost" && (
                <View style={styles.failureCard}>
                  <Ionicons name="close-circle" size={40} color={colors.error} />
                  <Text style={styles.failureTitle}>Dispute Lost</Text>
                  <Text style={styles.failureText}>
                    Consider implementing prevention measures for similar cases
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filterContainer: {
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    marginRight: spacing.sm,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: "white",
  },
  disputesContainer: {
    marginBottom: spacing.lg,
  },
  disputeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  disputeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  disputeInfo: {
    flex: 1,
  },
  disputeId: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  disputeCustomer: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  disputeBody: {
    marginBottom: spacing.md,
  },
  disputeReason: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  disputeOrderId: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  disputeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  disputeAmount: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  disputeDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    ...typography.h4,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  divider: {
    width: 1,
    backgroundColor: colors.outline,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.outline,
  },
  statusCardText: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.outline,
    marginVertical: spacing.md,
  },
  reasonCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  reasonText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  successCard: {
    backgroundColor: colors.success + "15",
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.success,
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.h3,
    color: colors.success,
    marginTop: spacing.md,
  },
  successText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  failureCard: {
    backgroundColor: colors.error + "15",
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.error,
    marginBottom: spacing.lg,
  },
  failureTitle: {
    ...typography.h3,
    color: colors.error,
    marginTop: spacing.md,
  },
  failureText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});