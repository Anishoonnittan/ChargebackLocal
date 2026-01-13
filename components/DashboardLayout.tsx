import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius, shadows } from "../lib/theme";

export type DashboardQuickAction = {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
};

type Props = {
  title: string;
  subtitle: string;
  accentColor: string;
  headerIcon: keyof typeof Ionicons.glyphMap;
  viewerName?: string;
  quickActions: Array<DashboardQuickAction>;
  footerHint?: string;
};

export default function DashboardLayout({
  title,
  subtitle,
  accentColor,
  headerIcon,
  viewerName,
  quickActions,
  footerHint,
}: Props) {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { borderColor: accentColor + "22" }]}
        >
          <View style={styles.heroTopRow}>
            <View style={[styles.heroIcon, { backgroundColor: accentColor + "18" }]}
            >
              <Ionicons name={headerIcon} size={22} color={accentColor} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{title}</Text>
              <Text style={styles.heroSubtitle}>{subtitle}</Text>
            </View>
          </View>

          {!!viewerName && (
            <View style={styles.welcomeRow}>
              <Ionicons name="sparkles" size={16} color={colors.textSecondary} />
              <Text style={styles.welcomeText}>Welcome back, {viewerName}.</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.id}
              onPress={a.onPress}
              activeOpacity={0.85}
              style={styles.actionCard}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + "18" }]}
              >
                <Ionicons name={a.icon} size={20} color={a.color} />
              </View>
              <Text style={styles.actionTitle}>{a.title}</Text>
              {!!a.subtitle && <Text style={styles.actionSubtitle}>{a.subtitle}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Pro tip</Text>
            <Text style={styles.tipBody}>
              {footerHint ??
                "Run a quick scan before you trust a new profile, link, or payment request."}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxxl,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    ...shadows.sm,
    marginBottom: spacing.xl,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  heroSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  welcomeRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  welcomeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
  actionCard: {
    flexBasis: "48%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  actionTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  actionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  tipCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + "22",
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: {
    ...typography.label,
    color: colors.primary,
  },
  tipBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
});