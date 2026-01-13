/**
 * Floating Clipboard Scan Button
 * Appears when user copies a message, offers one-tap scanning
 * Beautiful overlay: "⚠️ Scan This Message?" with haptic feedback
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
  Vibration,
  AccessibilityInfo,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, shadows, typography } from "../lib/theme";
import { getClipboardText, isLikelyMessage, triggerHapticFeedback, logClipboardEvent, isClipboardMonitoringSupported } from "../lib/smsMonitor";

interface ClipboardScanButtonProps {
  onScanRequest: (message: string) => void;
  clipboardMonitoringEnabled: boolean;
}

export function ClipboardScanButton({
  onScanRequest,
  clipboardMonitoringEnabled,
}: ClipboardScanButtonProps) {
  const [visible, setVisible] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start clipboard monitoring when enabled
  useEffect(() => {
    if (!clipboardMonitoringEnabled || !isClipboardMonitoringSupported()) {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
      hideButton();
      return;
    }

    // Check clipboard every 500ms
    pollInterval.current = setInterval(async () => {
      try {
        const text = await getClipboardText();

        if (text && text !== copiedText && isLikelyMessage(text)) {
          setCopiedText(text);

          // Show button with animation
          triggerHapticFeedback();
          showButton(text);

          // Log detection event
          logClipboardEvent({
            eventType: "detected",
            textLength: text.length,
            isMessage: true,
            timestamp: Date.now(),
          });

          // Auto-hide after 8 seconds if user doesn't interact
          setTimeout(() => {
            if (visible) {
              handleDismiss();
            }
          }, 8000);
        }
      } catch (error) {
        console.log("Clipboard monitor error:", error);
      }
    }, 500);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [clipboardMonitoringEnabled, visible]);

  const showButton = useCallback((text: string) => {
    setCopiedText(text);
    setVisible(true);
    // Built-in, no extra dependency. Keep it subtle.
    Vibration.vibrate(10);

    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Auto-hide after 8 seconds
    setTimeout(() => {
      hideButton();
    }, 8000);
  }, [slideAnim]);

  const hideButton = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setCopiedText("");
    });
  }, [slideAnim]);

  const handleScan = useCallback(() => {
    if (typeof onScanRequest === 'function') {
      onScanRequest(copiedText);
    } else {
      console.warn('ClipboardScanButton: onScanRequest callback is not a function');
    }
    hideButton();
  }, [copiedText, onScanRequest, hideButton]);

  const handleDismiss = useCallback(() => {
    hideButton();
  }, [hideButton]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: 1,
        },
      ]}
    >
      <View style={styles.buttonContainer}>
        {/* Main Scan Button */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScan}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Scan clipboard message for scams"
          accessibilityHint="Tap to analyze the copied message for potential threats"
        >
          <View style={styles.scanButtonContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={18} color={colors.error} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.mainText}>Scan This Message?</Text>
              <Text style={styles.subText}>Check for scams</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Dismiss Button */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Dismiss clipboard scan"
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Preview of copied text */}
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Copied:</Text>
        <Text style={styles.previewText} numberOfLines={2}>
          {copiedText}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    zIndex: 999,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  scanButton: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.md,
  },
  scanButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    ...typography.label,
    color: colors.textOnSecondary,
    fontWeight: "600",
  },
  subText: {
    ...typography.caption,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  dismissButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  previewContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  previewLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  previewText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});