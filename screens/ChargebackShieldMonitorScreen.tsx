import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, shadows } from "../lib/theme";

interface MonitorScreenProps {
  orders: any[];
}

type FilterKey = "all" | "monitoring" | "risk" | "cleared";

function getStatusTone(status: string): { bg: string; fg: string } {
  if (status === "risk") return { bg: colors.errorLight, fg: colors.error };
  if (status === "cleared") return { bg: colors.successLight, fg: colors.success };
  return { bg: colors.warningLight, fg: colors.warning };
}

export const ChargebackShieldMonitorScreen: React.FC<MonitorScreenProps> = ({ orders }) => {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o: any) => o.status === filter);
  }, [orders, filter]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Monitoring</Text>
          <Text style={styles.subtitle}>Track approved orders for 120 days (0–120)</Text>
        </View>

        <View style={styles.filterRow}>
          {(["all", "monitoring", "risk", "cleared"] as FilterKey[]).map((key) => {
            const isActive = filter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.filterButton, isActive && styles.filterButtonActive]}
                onPress={() => setFilter(key)}
                activeOpacity={0.9}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {key === "all" ? "All" : key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle" size={36} color={colors.success} />
            </View>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              Scan an order and move it to monitoring to start tracking.
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {filteredOrders.map((order: any) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
};

function OrderCard({ order }: { order: any }) {
  const daysMonitored = order.daysMonitored ?? order.daysSinceAuth ?? 0;
  const daysLeft = Math.max(0, 120 - daysMonitored);
  const progressPercent = Math.min(100, (daysMonitored / 120) * 100);

  const tone = getStatusTone(order.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>{order.orderId}</Text>
          <Text style={styles.orderMeta}>{order.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: tone.bg, borderColor: tone.bg }]}>
          <Text style={[styles.statusBadgeText, { color: tone.fg }]}>
            {order.status === "monitoring" ? "Monitoring" : order.status === "risk" ? "Risk" : "Cleared"}
          </Text>
        </View>
      </View>

      <View style={styles.cardStatsRow}>
        <View style={styles.statPill}>
          <Ionicons name="cash" size={14} color={colors.textSecondary} />
          <Text style={styles.statPillText}>${Number(order.amount ?? 0).toFixed(2)}</Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="speedometer" size={14} color={colors.textSecondary} />
          <Text style={styles.statPillText}>{order.riskScore}% risk</Text>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Day {daysMonitored}/120</Text>
          <Text style={styles.progressMuted}>{daysLeft} days left</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: tone.fg }]} />
        </View>
      </View>
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
    marginBottom: spacing.lg,
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
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.textOnPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
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
  orderMeta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },
  cardStatsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statPill: {
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
  statPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textSecondary,
  },
  progressBlock: {
    marginTop: spacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  progressMuted: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  progressTrack: {
    height: 10,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
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
});