import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { colors, typography, spacing, borderRadius, shadows } from "../lib/theme";
import { USER_MODES, getUserModeDefinition, inferUserModeFromAccountType } from "../lib/userModes";
import type { UserMode } from "../types/userMode";

type Props = {
  sessionToken: string;
  viewer?: any;
  onComplete: () => void;
  onBack?: () => void;
};

export default function ModeSelectionScreen({ sessionToken, viewer, onComplete, onBack }: Props) {
  const updateUserModeForSession = useMutation(api.users.updateUserModeForSession);

  const suggestedMode: UserMode = useMemo(() => {
    const fromProfile = viewer?.userMode;
    if (fromProfile === "personal" || fromProfile === "charity" || fromProfile === "community") {
      return fromProfile;
    }
    return inferUserModeFromAccountType(viewer?.accountType);
  }, [viewer?.userMode, viewer?.accountType]);

  const [selectedMode, setSelectedMode] = useState<UserMode>(suggestedMode);
  const [isSaving, setIsSaving] = useState(false);

  const selectedDefinition = getUserModeDefinition(selectedMode);

  const handleContinue = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      await updateUserModeForSession({ sessionToken, userMode: selectedMode });
      onComplete();
    } catch (e: any) {
      console.error("Failed to update user mode:", e);
      Alert.alert(
        "Couldn't save mode",
        typeof e?.message === "string" ? e.message : "Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Choose your setup</Text>
            <Text style={styles.subtitle}>
              We'll tailor the dashboard and tools so you only see what's useful.
            </Text>
          </View>

          {!!onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cards}>
          {USER_MODES.map((mode) => {
            const isSelected = mode.key === selectedMode;
            return (
              <TouchableOpacity
                key={mode.key}
                onPress={() => setSelectedMode(mode.key)}
                activeOpacity={0.9}
                style={[
                  styles.card,
                  isSelected && { borderColor: mode.accentColor, borderWidth: 2 },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.iconPill,
                      { backgroundColor: mode.accentColor + "18" },
                    ]}
                  >
                    <Ionicons name={mode.icon as any} size={18} color={mode.accentColor} />
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{mode.title}</Text>
                  </View>

                  {isSelected ? (
                    <View style={[styles.selectedBadge, { backgroundColor: mode.accentColor }]}>
                      <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />
                      <Text style={styles.selectedBadgeText}>Selected</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  )}
                </View>

                <Text style={styles.cardDescription}>{mode.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footerCard}>
          <View style={styles.footerTopRow}>
            <View style={[styles.footerIcon, { backgroundColor: selectedDefinition.accentColor + "18" }]}>
              <Ionicons name={selectedDefinition.icon as any} size={20} color={selectedDefinition.accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.footerTitle}>You selected: {selectedDefinition.shortLabel}</Text>
              <Text style={styles.footerSubtitle}>
                You can change this later in Settings.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.ctaButton, isSaving && { opacity: 0.8 }]}
            onPress={() => void handleContinue()}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <>
                <Text style={styles.ctaText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.textOnPrimary} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.privacyNote}>
          Tip: Keeping one backend makes ScamVigil smarter — more fraud patterns, faster detection.
        </Text>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  cards: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  iconPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  cardTitle: {
    ...typography.bodyBold,
  },
  cardDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  selectedBadgeText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontWeight: "700",
  },
  exclusiveRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: "wrap",
  },
  exclusiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  exclusiveBadgeMuted: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  exclusiveText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: "700",
  },
  exclusiveTextMuted: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  footerCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  footerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  footerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  footerTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  footerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ctaButton: {
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    ...shadows.sm,
  },
  ctaText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  privacyNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xl,
    textAlign: "center",
  },
});