import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";

interface Signal {
  name: string;
  score: number;
  weight: number;
  status: string;
  details: string;
}

interface FraudSignalsBreakdownProps {
  signals: Signal[];
}

export function FraudSignalsBreakdown({ signals }: FraudSignalsBreakdownProps) {
  const getSignalIcon = (name: string) => {
    const iconMap: Record<string, string> = {
      device: "phone-portrait-outline",
      geolocation: "location-outline",
      velocity: "speedometer-outline",
      email: "mail-outline",
      phone: "call-outline",
      address: "home-outline",
      order_value: "card-outline",
      behavior: "pulse-outline",
    };
    return iconMap[name] || "alert-circle-outline";
  };

  const getSignalLabel = (name: string) => {
    const labelMap: Record<string, string> = {
      device: "Device Fingerprint",
      geolocation: "Geolocation",
      velocity: "Velocity Check",
      email: "Email Validation",
      phone: "Phone Validation",
      address: "Address Match",
      order_value: "Order Value",
      behavior: "Behavior Analysis",
    };
    return labelMap[name] || name;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PASS":
        return theme.colors.success;
      case "WARN":
        return theme.colors.warning;
      case "FAIL":
        return theme.colors.error;
      default:
        return theme.colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASS":
        return "checkmark-circle";
      case "WARN":
        return "warning";
      case "FAIL":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fraud Detection Signals</Text>

      {signals.map((signal, index) => (
        <View key={index} style={styles.signalCard}>
          <View style={styles.signalHeader}>
            <View style={styles.signalTitleRow}>
              <Ionicons
                name={getSignalIcon(signal.name) as any}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.signalName}>{getSignalLabel(signal.name)}</Text>
            </View>

            <View style={styles.signalStatus}>
              <Ionicons
                name={getStatusIcon(signal.status) as any}
                size={18}
                color={getStatusColor(signal.status)}
              />
              <Text style={[styles.statusText, { color: getStatusColor(signal.status) }]}>
                {signal.status}
              </Text>
            </View>
          </View>

          <Text style={styles.signalDetails}>{signal.details}</Text>

          {/* Score bar */}
          <View style={styles.scoreBarContainer}>
            <View style={styles.scoreBarBackground}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${signal.score}%`,
                    backgroundColor: getStatusColor(signal.status),
                  },
                ]}
              />
            </View>
            <Text style={styles.scoreText}>{signal.score}/100</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 12,
  },
  signalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  signalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  signalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  signalName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  signalStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  signalDetails: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  scoreBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scoreBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.sm,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: theme.borderRadius.sm,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    minWidth: 45,
    textAlign: "right",
  },
});