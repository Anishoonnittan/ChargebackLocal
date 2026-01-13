import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";

interface RiskScoreGaugeProps {
  score: number; // 0-100
  level: string; // "LOW", "MEDIUM", "HIGH", "CRITICAL"
}

export function RiskScoreGauge({ score, level }: RiskScoreGaugeProps) {
  // Determine color based on risk level
  const getColorConfig = () => {
    switch (level) {
      case "LOW":
        return { color: theme.colors.success, label: "Low Risk", icon: "checkmark-circle" as const };
      case "MEDIUM":
        return { color: theme.colors.warning, label: "Medium Risk", icon: "warning" as const };
      case "HIGH":
        return { color: theme.colors.error, label: "High Risk", icon: "alert-circle" as const };
      case "CRITICAL":
        return { color: "#dc2626", label: "Critical Risk", icon: "close-circle" as const };
      default:
        return { color: theme.colors.textMuted, label: "Unknown", icon: "help-circle" as const };
    }
  };

  const config = getColorConfig();

  return (
    <View style={styles.container}>
      {/* Circular Progress */}
      <View style={styles.gaugeContainer}>
        <View style={[styles.circle, { borderColor: theme.colors.border }]}>
          <View
            style={[
              styles.progressCircle,
              {
                borderColor: config.color,
                borderTopColor: score > 0 ? config.color : "transparent",
                borderRightColor: score > 25 ? config.color : "transparent",
                borderBottomColor: score > 50 ? config.color : "transparent",
                borderLeftColor: score > 75 ? config.color : "transparent",
                transform: [{ rotate: `${(score / 100) * 360}deg` }],
              },
            ]}
          />
        </View>

        {/* Center Content */}
        <View style={styles.centerContent}>
          <Ionicons name={config.icon} size={32} color={config.color} />
          <Text style={[styles.scoreText, { color: config.color }]}>{score}</Text>
          <Text style={styles.scoreLabel}>Risk Score</Text>
        </View>
      </View>

      {/* Risk Level Label */}
      <View style={[styles.levelBadge, { backgroundColor: `${config.color}20` }]}>
        <Text style={[styles.levelText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
  },
  gaugeContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
  },
  progressCircle: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 36,
    fontWeight: "bold",
    marginTop: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  levelBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 14,
    fontWeight: "600",
  },
});