import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ChargebackShieldApp } from "./ChargebackShieldApp";
import { colors, spacing } from "../lib/theme";

type ChargebackShieldScreenProps = {
  // Kept for backwards compatibility with existing navigation calls.
  sessionToken?: string;
  onBack?: () => void;
};

export default function ChargebackShieldScreen({ onBack }: ChargebackShieldScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : null}

          <View style={styles.headerTitles}>
            <Text style={styles.title}>ChargebackShield</Text>
            <Text style={styles.subtitle}>Scan → Monitor → Stop chargebacks</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Ionicons name="shield-checkmark" size={20} color={colors.info} />
        </View>
      </View>

      {/*
        Important:
        - The full ChargebackShield workflow lives in ChargebackShieldApp.
        - Keeping this screen as a wrapper ensures the same UI is shown from both:
          1) Consumer app (Security → ChargebackShield)
          2) Business app (Scan tab)
      */}
      <ChargebackShieldApp showTitle={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  headerRight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});