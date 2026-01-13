import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export default function ChargebackAlertsScreen({
  sessionToken,
}: {
  sessionToken: string;
}) {
  const alerts = useQuery(api.chargebackFraud.getAllAlerts, { sessionToken });
  const markAsRead = useMutation(api.chargebackFraud.markAlertAsRead);
  const takeAction = useMutation(api.chargebackFraud.takeAlertAction);

  if (!alerts) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading alerts...</Text>
      </View>
    );
  }

  const unreadAlerts = alerts.filter((a: any) => a.status === "UNREAD");
  const readAlerts = alerts.filter((a: any) => a.status === "READ");

  const handleMarkAsRead = async (alertId: Id<"riskAlerts">) => {
    await markAsRead({ sessionToken, alertId });
  };

  const handleTakeAction = async (
    alertId: Id<"riskAlerts">,
    decision: string
  ) => {
    await takeAction({
      sessionToken,
      alertId,
      decision,
      notes: `Decision: ${decision}`,
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Risk Alerts</Text>
        <Text style={styles.subtitle}>
          {unreadAlerts.length} unread alert{unreadAlerts.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Unread Alerts */}
      {unreadAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unread Alerts</Text>
          {unreadAlerts.map((alert: any) => (
            <AlertCard
              key={alert._id}
              alert={alert}
              onMarkAsRead={handleMarkAsRead}
              onTakeAction={handleTakeAction}
            />
          ))}
        </View>
      )}

      {/* Read Alerts */}
      {readAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Previous Alerts</Text>
          {readAlerts.map((alert: any) => (
            <AlertCard
              key={alert._id}
              alert={alert}
              onMarkAsRead={handleMarkAsRead}
              onTakeAction={handleTakeAction}
            />
          ))}
        </View>
      )}

      {/* Empty State */}
      {alerts.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="shield-checkmark-outline" size={80} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Alerts</Text>
          <Text style={styles.emptyText}>
            You'll be notified here when high-risk orders are detected
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function AlertCard({
  alert,
  onMarkAsRead,
  onTakeAction,
}: {
  alert: any;
  onMarkAsRead: (alertId: Id<"riskAlerts">) => void;
  onTakeAction: (
    alertId: Id<"riskAlerts">,
    decision: string
  ) => void;
}) {
  const getAlertColor = (level: string) => {
    switch (level) {
      case "BLOCK":
        return { bg: "#fef2f2", text: "#dc2626", icon: "close-circle" };
      case "REVIEW":
        return { bg: "#fef3c7", text: "#d97706", icon: "warning" };
      case "WARN":
        return { bg: "#fef3c7", text: "#f59e0b", icon: "alert-circle" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280", icon: "information-circle" };
    }
  };

  const colors = getAlertColor(alert.alertLevel);
  const isUnread = alert.status === "UNREAD";
  const hasAction = alert.actionTaken;

  return (
    <TouchableOpacity
      style={[
        styles.alertCard,
        isUnread && styles.alertCardUnread,
        { borderLeftColor: colors.text },
      ]}
      onPress={() => {
        if (isUnread) {
          onMarkAsRead(alert._id);
        }
      }}
    >
      {/* Alert Icon */}
      <View style={[styles.alertIcon, { backgroundColor: colors.bg }]}>
        <Ionicons name={colors.icon as any} size={28} color={colors.text} />
      </View>

      {/* Alert Content */}
      <View style={styles.alertContent}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          {isUnread && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.alertMessage}>{alert.message}</Text>

        {/* Order Details */}
        {alert.orderDetails && (
          <View style={styles.orderDetailsCard}>
            <View style={styles.orderDetailRow}>
              <Text style={styles.orderDetailLabel}>Order ID:</Text>
              <Text style={styles.orderDetailValue}>
                {alert.orderDetails.orderId || "N/A"}
              </Text>
            </View>
            <View style={styles.orderDetailRow}>
              <Text style={styles.orderDetailLabel}>Customer:</Text>
              <Text style={styles.orderDetailValue}>
                {alert.orderDetails.customerEmail}
              </Text>
            </View>
            <View style={styles.orderDetailRow}>
              <Text style={styles.orderDetailLabel}>Amount:</Text>
              <Text style={[styles.orderDetailValue, styles.amountText]}>
                ${alert.orderDetails.amount}
              </Text>
            </View>
          </View>
        )}

        {/* Timestamp */}
        <Text style={styles.alertTimestamp}>
          {new Date(alert.createdAt).toLocaleString()}
        </Text>

        {/* Action Buttons */}
        {!hasAction && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => onTakeAction(alert._id, "APPROVED")}
            >
              <Ionicons name="checkmark" size={18} color="#10b981" />
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => onTakeAction(alert._id, "DECLINED")}
            >
              <Ionicons name="close" size={18} color="#ef4444" />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.reviewBtn]}
              onPress={() => onTakeAction(alert._id, "UNDER_REVIEW")}
            >
              <Ionicons name="eye" size={18} color="#3b82f6" />
              <Text style={styles.reviewBtnText}>Review</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Taken Badge */}
        {hasAction && (
          <View style={styles.actionTakenBadge}>
            <Ionicons
              name={
                alert.actionTaken.decision === "APPROVED"
                  ? "checkmark-circle"
                  : alert.actionTaken.decision === "DECLINED"
                  ? "close-circle"
                  : "time"
              }
              size={16}
              color={
                alert.actionTaken.decision === "APPROVED"
                  ? "#10b981"
                  : alert.actionTaken.decision === "DECLINED"
                  ? "#ef4444"
                  : "#3b82f6"
              }
            />
            <Text style={styles.actionTakenText}>
              {alert.actionTaken.decision}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  alertCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertCardUnread: {
    backgroundColor: "#fefce8",
  },
  alertIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444",
    marginLeft: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 12,
    lineHeight: 20,
  },
  orderDetailsCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  orderDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  orderDetailLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  orderDetailValue: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
  },
  amountText: {
    color: "#3b82f6",
    fontSize: 14,
  },
  alertTimestamp: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveBtn: {
    backgroundColor: "#d1fae5",
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#10b981",
  },
  declineBtn: {
    backgroundColor: "#fee2e2",
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ef4444",
  },
  reviewBtn: {
    backgroundColor: "#dbeafe",
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3b82f6",
  },
  actionTakenBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    gap: 6,
  },
  actionTakenText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});