import React, { useState, useRef, memo } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAction, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { theme } from "../lib/theme";

export const LinkScanner = memo(function LinkScanner() {
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const urlInputRef = useRef<TextInput>(null);

  const scanLinkAction = useAction(api.security.scanLink);
  const saveScan = useMutation(api.security.saveSecurityScan);

  const handlePasteAndScan = () => {
    Alert.alert(
      "📋 Paste URL",
      "Long-press inside the URL box and tap 'Paste' to scan a link you copied.",
      [{ text: "Got it", onPress: () => urlInputRef.current?.focus() }]
    );
  };

  const handleScan = async () => {
    if (!url.trim()) {
      Alert.alert("Error", "Please enter a URL to scan");
      return;
    }

    setLoading(true);
    try {
      const res = await scanLinkAction({ url, context: context || undefined });
      setResult(res);

      await saveScan({
        scanType: "link",
        input: url,
        score: res.safetyScore,
        riskLevel: res.riskLevel,
        findings: res.threats.map((t: any) => `${t.type}: ${t.description}`),
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to scan link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔗 Link Safety Scanner</Text>
      <Text style={styles.description}>
        Check if a URL is safe or potentially dangerous (phishing, malware, scams)
      </Text>

      <View style={styles.inputLabelRow}>
        <Text style={styles.label}>URL to check</Text>
        <TouchableOpacity style={styles.pasteButton} onPress={handlePasteAndScan}>
          <Ionicons name="clipboard-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.pasteButtonText}>Paste & Scan</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        ref={urlInputRef}
        style={styles.input}
        placeholder="https://example.com"
        placeholderTextColor={theme.colors.textSecondary}
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        keyboardType="url"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Context (optional): Where did you find this link?"
        placeholderTextColor={theme.colors.textSecondary}
        value={context}
        onChangeText={setContext}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.scanButton, loading && styles.scanButtonDisabled]}
        onPress={handleScan}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
            <Text style={styles.scanButtonText}>Scan Link</Text>
          </>
        )}
      </TouchableOpacity>

      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultScore}>{result.safetyScore}/100</Text>
            <View
              style={[
                styles.riskBadge,
                result.riskLevel === "safe" && styles.riskSafe,
                result.riskLevel === "suspicious" && styles.riskSuspicious,
                result.riskLevel === "dangerous" && styles.riskDangerous,
              ]}
            >
              <Text style={styles.riskBadgeText}>
                {result.riskLevel === "safe"
                  ? "✅ Safe"
                  : result.riskLevel === "suspicious"
                  ? "⚠️ Suspicious"
                  : "🚨 Dangerous"}
              </Text>
            </View>
          </View>

          <Text style={styles.recommendation}>{result.recommendation}</Text>

          {result.threats.length > 0 && (
            <View style={styles.threatsContainer}>
              <Text style={styles.threatsTitle}>🚩 Detected Threats:</Text>
              {result.threats.map((threat: any, idx: number) => (
                <View key={idx} style={styles.threatItem}>
                  <Text style={styles.threatType}>{threat.type}</Text>
                  <Text style={styles.threatDesc}>{threat.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    flex: 1,
  },
  pasteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  pasteButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  scanButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  scanButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  scanButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resultCard: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  resultScore: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  riskSafe: {
    backgroundColor: theme.colors.success,
  },
  riskSuspicious: {
    backgroundColor: theme.colors.warning,
  },
  riskDangerous: {
    backgroundColor: theme.colors.error,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  recommendation: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  threatsContainer: {
    marginTop: 12,
  },
  threatsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  threatItem: {
    marginBottom: 8,
  },
  threatType: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.error,
    marginBottom: 2,
  },
  threatDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});