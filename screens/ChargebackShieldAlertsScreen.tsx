import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, shadows } from "../lib/theme";

interface AlertsScreenProps {
  orders: any[];
}

function isAlertOrder(order: any) {
  return order?.status === "risk" || (typeof order?.riskScore === "number" && order.riskScore >= 70);
}

export const ChargebackShieldAlertsScreen: React.FC<AlertsScreenProps> = ({ orders }) => {
  const alerts = useMemo(() => orders.filter(isAlertOrder), [orders]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="warning" size={18} color={colors.error} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Alerts</Text>
            <Text style={styles.subtitle}>
              {alerts.length === 0
                ? "All clear — no high-risk orders"
                : `${alerts.length} high-risk order${alerts.length === 1 ? "" : "s"} need attention`}
            </Text>
          </View>
          {alerts.length > 0 ? (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{alerts.length > 99 ? "99+" : alerts.length}</Text>
            </View>
          ) : null}
        </View>

        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="shield-checkmark" size={34} color={colors.success} />
            </View>
            <Text style={styles.emptyTitle}>You're good</Text>
            <Text style={styles.emptySubtitle}>
              Keep scanning orders before fulfillment to stay protected.
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {alerts.map((alert: any) => (
              <AlertCard key={alert._id} alert={alert} />
            ))}
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
};

function AlertCard({ alert }: { alert: any }) {
  const amount = Number(alert.amount ?? 0);
  const riskScore = Number(alert.riskScore ?? 0);
  const daysMonitored = alert.daysMonitored ?? alert.daysSinceAuth ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardBanner}>
        <Ionicons name="alert-circle" size={16} color={colors.textOnPrimary} />
        <Text style={styles.cardBannerText}>HIGH RISK</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>{alert.orderId}</Text>
            <Text style={styles.meta}>{alert.email}</Text>
          </View>
          <View style={styles.riskPill}>
            <Text style={styles.riskPillText}>{riskScore}%</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <DetailPill icon="cash" text={`$${amount.toFixed(2)}`} />
          <DetailPill icon="calendar" text={`Day ${daysMonitored}/120`} />
        </View>

        <View style={styles.actionHint}>
          <Ionicons name="information-circle" size={16} color={colors.error} />
          <Text style={styles.actionHintText}>
            Recommended: verify billing/shipping match and confirm customer before shipping.
          </Text>
        </View>
      </View>
    </View>
  );
}

function DetailPill({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.detailPill}>
      <Ionicons name={icon} size={14} color={colors.textSecondary} />
      <Text style={styles.detailPillText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
  },
  countPill: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    minWidth: 26,
    height: 26,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  countPillText: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.textOnPrimary,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    ...shadows.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.successLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.sm,
  },
  cardBanner: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardBannerText: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.textOnPrimary,
    letterSpacing: 0.6,
  },
  cardBody: {
    padding: spacing.lg,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  riskPill: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  riskPillText: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.error,
  },
  detailsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  detailPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  detailPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textSecondary,
  },
  actionHint: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionHintText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});