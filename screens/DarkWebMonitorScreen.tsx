import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme, spacing, borderRadius } from "../lib/theme";

interface DarkWebMonitorScreenProps {
  onBack?: () => void;
}

export function DarkWebMonitorScreen({ onBack }: DarkWebMonitorScreenProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  const darkWebStatus = useQuery(api.darkWeb.getDarkWebStatus);
  const darkWebAlerts = useQuery(api.darkWeb.getDarkWebAlerts) || [];
  const startMonitoring = useMutation(api.darkWeb.startMonitoring);
  const checkEmailBreach = useAction(api.darkWeb.checkEmailBreach);
  const updateMonitorBreaches = useMutation(api.darkWeb.updateMonitorBreaches);
  const markAlertRead = useMutation(api.darkWeb.markAlertRead);
  const triggerCheck = useAction(api.darkWeb.triggerCheck);

  const handleStartMonitoring = async () => {
    if (!email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      // Start monitoring
      const monitorResult = await startMonitoring({ email });
      
      // Check for breaches
      const breachResult = await checkEmailBreach({ email });
      
      // Update monitor with breach data
      if (breachResult.isBreach) {
        await updateMonitorBreaches({
          monitorId: monitorResult.monitorId,
          breaches: breachResult.breaches.map(b => ({
            name: b.name,
            title: b.title,
            breachDate: b.breachDate,
            dataClasses: b.dataClasses,
            description: b.description,
            logoPath: b.logoPath,
          })),
        });
        
        Alert.alert(
          "⚠️ Breaches Found",
          `Your email was found in ${breachResult.breachCount} breach(es). Check the results below.`,
        );
      } else {
        Alert.alert("✅ All Clear", "Your email hasn't been found in known data breaches");
      }
      
      setEmail("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to start monitoring");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCheck = async () => {
    if (!darkWebStatus?.monitorId) return;
    
    setLoading(true);
    try {
      const result = await triggerCheck({ monitorId: darkWebStatus.monitorId });
      
      if (result.isBreach) {
        Alert.alert("Scan Complete", `Found ${result.breachCount} breach(es)`);
      } else {
        Alert.alert("✅ All Clear", "No new breaches detected");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to check for breaches");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "#d32f2f";
      case "high": return "#f57c00";
      case "medium": return "#fbc02d";
      case "low": return "#7cb342";
      default: return theme.colors.outline;
    }
  };

  // First-time setup screen
  if (!darkWebStatus) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onBackground} />
            </TouchableOpacity>
          )}
          <MaterialCommunityIcons name="spider-web" size={60} color={theme.colors.primary} />
          <Text style={styles.title}>Dark Web Monitor</Text>
          <Text style={styles.subtitle}>Check if your data has been compromised</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="shield-check" size={24} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.medium }}>
                <Text style={styles.infoTitle}>What We Check</Text>
                <Text style={styles.infoText}>
                  We scan millions of known data breaches to see if your email has been compromised on the dark web.
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="lock" size={24} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.medium }}>
                <Text style={styles.infoTitle}>Your Privacy</Text>
                <Text style={styles.infoText}>
                  Your email is checked securely. We never share your data.
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="bell-alert" size={24} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.medium }}>
                <Text style={styles.infoTitle}>Continuous Monitoring</Text>
                <Text style={styles.infoText}>
                  We'll check every 24 hours and alert you if new breaches are found.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Start Monitoring</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor={theme.colors.outline}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleStartMonitoring}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="magnify" size={20} color="white" />
                  <Text style={styles.buttonText}>Check Email</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.exampleSection}>
            <Text style={styles.exampleTitle}>🔍 What We Look For:</Text>
            <Text style={styles.exampleItem}>• Email addresses</Text>
            <Text style={styles.exampleItem}>• Passwords</Text>
            <Text style={styles.exampleItem}>• Credit card numbers</Text>
            <Text style={styles.exampleItem}>• Phone numbers</Text>
            <Text style={styles.exampleItem}>• Physical addresses</Text>
            <Text style={styles.exampleItem}>• Social security numbers</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Monitoring active screen
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onBackground} />
            </TouchableOpacity>
          )}
          {darkWebStatus.breachCount === 0 ? (
            <>
              <MaterialCommunityIcons name="shield-check" size={60} color="#4caf50" />
              <Text style={[styles.title, { color: "#4caf50" }]}>All Clear ✅</Text>
              <Text style={styles.subtitle}>No breaches found</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="alert-circle" size={60} color={theme.colors.error} />
              <Text style={[styles.title, { color: theme.colors.error }]}>Breaches Detected ⚠️</Text>
              <Text style={styles.subtitle}>{darkWebStatus.breachCount} breach(es) found</Text>
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Email Monitored:</Text>
              <Text style={styles.statusValue}>{darkWebStatus.email}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Last Checked:</Text>
              <Text style={styles.statusValue}>
                {darkWebStatus.lastChecked 
                  ? new Date(darkWebStatus.lastChecked).toLocaleString()
                  : "Just now"
                }
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Next Check:</Text>
              <Text style={styles.statusValue}>
                {darkWebStatus.nextCheckAt
                  ? new Date(darkWebStatus.nextCheckAt).toLocaleString()
                  : "In 24 hours"
                }
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary, loading && styles.buttonDisabled]}
            onPress={handleRefreshCheck}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <>
                <MaterialCommunityIcons name="refresh" size={20} color={theme.colors.primary} />
                <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Check Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {darkWebStatus.breachCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚨 Breaches Found</Text>
            
            {darkWebStatus.breachesFound.map((breach, i) => (
              <View key={i} style={styles.breachCard}>
                <View style={styles.breachHeader}>
                  <Text style={styles.breachName}>{breach.name}</Text>
                  <Text style={styles.breachDate}>{breach.breachDate}</Text>
                </View>
                
                <Text style={styles.breachTitle}>{breach.title}</Text>
                
                {breach.description && (
                  <Text style={styles.breachDescription} numberOfLines={3}>
                    {breach.description.replace(/<[^>]*>/g, '')}
                  </Text>
                )}
                
                <View style={styles.dataClassesContainer}>
                  <Text style={styles.dataClassesLabel}>Data Exposed:</Text>
                  {breach.dataClasses.slice(0, 5).map((dataClass, j) => (
                    <View key={j} style={styles.dataClassBadge}>
                      <Text style={styles.dataClassText}>{dataClass}</Text>
                    </View>
                  ))}
                  {breach.dataClasses.length > 5 && (
                    <Text style={styles.dataClassMore}>+{breach.dataClasses.length - 5} more</Text>
                  )}
                </View>
                
                <View style={styles.breachAction}>
                  <MaterialCommunityIcons name="shield-alert" size={16} color={theme.colors.error} />
                  <Text style={styles.breachActionText}>
                    Change your password on {breach.name} immediately
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ What to Do</Text>
          
          <View style={styles.actionItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#4caf50" />
            <Text style={styles.actionText}>Change passwords on all affected services</Text>
          </View>
          
          <View style={styles.actionItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#4caf50" />
            <Text style={styles.actionText}>Enable two-factor authentication (2FA)</Text>
          </View>
          
          <View style={styles.actionItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#4caf50" />
            <Text style={styles.actionText}>Use a password manager</Text>
          </View>
          
          <View style={styles.actionItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#4caf50" />
            <Text style={styles.actionText}>Monitor your credit reports</Text>
          </View>
          
          <View style={styles.actionItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#4caf50" />
            <Text style={styles.actionText}>Be alert for phishing emails</Text>
          </View>
        </View>

        {darkWebAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📬 Recent Alerts</Text>
            
            {darkWebAlerts.slice(0, 5).map((alert) => (
              <TouchableOpacity
                key={alert._id}
                style={[
                  styles.alertCard,
                  !alert.read && styles.alertCardUnread
                ]}
                onPress={() => markAlertRead({ alertId: alert._id })}
              >
                <View style={[styles.severityDot, { backgroundColor: getSeverityColor(alert.severity) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{alert.breachName}</Text>
                  <Text style={styles.alertDescription}>{alert.recommendation}</Text>
                  <Text style={styles.alertDate}>
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by Have I Been Pwned • Data updated daily
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: "center",
    padding: spacing.large,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  backButton: {
    position: "absolute",
    left: spacing.medium,
    top: spacing.medium,
    padding: spacing.small,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.onBackground,
    marginTop: spacing.medium,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.outline,
    marginTop: spacing.small,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    padding: spacing.large,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "rgba(33,150,243,0.08)",
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
    alignItems: "flex-start",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.onBackground,
    marginBottom: spacing.small,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.outline,
    lineHeight: 18,
  },
  section: {
    padding: spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.onBackground,
    marginBottom: spacing.medium,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: borderRadius.small,
    padding: spacing.medium,
    fontSize: 14,
    color: theme.colors.onBackground,
    marginBottom: spacing.medium,
  },
  button: {
    flexDirection: "row",
    backgroundColor: theme.colors.primary,
    padding: spacing.medium,
    borderRadius: borderRadius.small,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.small,
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  exampleSection: {
    padding: spacing.large,
    backgroundColor: theme.colors.surfaceVariant,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.onBackground,
    marginBottom: spacing.small,
  },
  exampleItem: {
    fontSize: 12,
    color: theme.colors.outline,
    marginBottom: spacing.small,
  },
  statusCard: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.small,
  },
  statusLabel: {
    fontSize: 12,
    color: theme.colors.outline,
  },
  statusValue: {
    fontSize: 12,
    color: theme.colors.onBackground,
    fontWeight: "500",
  },
  breachCard: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.medium,
    borderRadius: borderRadius.small,
    marginBottom: spacing.medium,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  breachHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.small,
  },
  breachName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.error,
  },
  breachDate: {
    fontSize: 12,
    color: theme.colors.outline,
  },
  breachTitle: {
    fontSize: 13,
    color: theme.colors.onBackground,
    marginBottom: spacing.small,
    fontWeight: "500",
  },
  breachDescription: {
    fontSize: 11,
    color: theme.colors.outline,
    marginBottom: spacing.small,
    lineHeight: 16,
  },
  dataClassesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.small,
    marginBottom: spacing.small,
    alignItems: "center",
  },
  dataClassesLabel: {
    fontSize: 11,
    color: theme.colors.outline,
    fontWeight: "500",
    marginRight: spacing.small,
  },
  dataClassBadge: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
  },
  dataClassText: {
    fontSize: 10,
    color: "white",
    fontWeight: "500",
  },
  dataClassMore: {
    fontSize: 10,
    color: theme.colors.outline,
    fontStyle: "italic",
  },
  breachAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(211,47,47,0.1)",
    padding: spacing.small,
    borderRadius: borderRadius.small,
    gap: spacing.small,
  },
  breachActionText: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.error,
    fontWeight: "500",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.medium,
    gap: spacing.medium,
  },
  actionText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.onBackground,
    lineHeight: 20,
  },
  alertCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    padding: spacing.medium,
    borderRadius: borderRadius.small,
    marginBottom: spacing.small,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "flex-start",
    gap: spacing.medium,
  },
  alertCardUnread: {
    backgroundColor: "rgba(33,150,243,0.05)",
    borderColor: theme.colors.primary,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.onBackground,
    marginBottom: spacing.small,
  },
  alertDescription: {
    fontSize: 12,
    color: theme.colors.outline,
    marginBottom: spacing.small,
    lineHeight: 16,
  },
  alertDate: {
    fontSize: 11,
    color: theme.colors.outline,
  },
  footer: {
    padding: spacing.large,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: theme.colors.outline,
    textAlign: "center",
  },
});