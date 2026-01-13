import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../lib/theme";
import WalkthroughModal, { WalkthroughStep } from "../components/walkthrough/WalkthroughModal";
import InteractiveTourModal, { InteractiveTourStep } from "../components/walkthrough/InteractiveTourModal";
import { TUTORIAL_VIDEOS } from "../lib/tutorialVideos";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { getOrAssignVariant, type ABVariant } from "../lib/abTesting";

export default function ScamVigilTutorialScreen({
  sessionToken,
  onClose,
  onNavigateToTab,
}: {
  sessionToken: string;
  onClose: () => void;
  onNavigateToTab?: (tabKey: string) => void;
}) {
  const [showInteractive, setShowInteractive] = useState(false);
  const [variant, setVariant] = useState<ABVariant>("A");
  const track = useMutation(api.abTests.track);

  React.useEffect(() => {
    let isMounted = true;
    void (async () => {
      const v = await getOrAssignVariant("sv_tutorial_welcome_v1");
      if (isMounted) {
        setVariant(v);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const trackEvent = (event: "exposure" | "complete" | "skip" | "video_click", stepId?: string) => {
    // Best-effort only. Never block UI.
    void (async () => {
      try {
        await track({
          sessionToken,
          app: "scamvigil",
          experimentKey: "sv_tutorial_welcome_v1",
          variant,
          eventType: event,
        });
      } catch {
        // If the backend function isn't deployed yet, ignore.
      }
    })();
  };

  const steps: Array<WalkthroughStep> = useMemo(
    () => [
      {
        id: "welcome",
        title: variant === "A" ? "Welcome to ScamVigil" : "Stop scams before they start",
        description:
          variant === "A"
            ? "Spot scams early, protect your money, and stay safe online."
            : "Scan, verify, and get clear next steps—so you never guess again.",
        icon: "shield-checkmark",
        accentColor: colors.primary,
      },
      {
        id: "scan",
        title: "Scan Anything",
        description: "Use Scan to check links, messages, profiles, and investment offers.",
        icon: "search",
        accentColor: colors.info,
        videoUrl: TUTORIAL_VIDEOS.scamVigil.scan ?? undefined,
        videoLabel: "Watch: How scanning works (60s)",
      },
      {
        id: "protection",
        title: "Protection Center",
        description: "Quick Actions give you the best tool for your situation in one tap.",
        icon: "sparkles",
        accentColor: colors.warning,
        videoUrl: TUTORIAL_VIDEOS.scamVigil.protectionCenter ?? undefined,
        videoLabel: "Watch: Protection Center tour (60s)",
      },
      {
        id: "community",
        title: "Community Alerts",
        description: "See what other people are reporting in your area and share warnings.",
        icon: "people",
        accentColor: colors.secondary,
        videoUrl: TUTORIAL_VIDEOS.scamVigil.communityAlerts ?? undefined,
        videoLabel: "Watch: Community Alerts (60s)",
      },
      {
        id: "done",
        title: "You're ready",
        description: "Start with Scan, then explore Security for deeper protection tools.",
        icon: "checkmark-circle",
        accentColor: colors.success,
      },
    ],
    [variant]
  );

  const interactiveSteps: Array<InteractiveTourStep> = useMemo(
    () => [
      {
        id: "go_scan",
        title: "Go to Scan",
        message: "Tap 'Take me there' to jump to Scan. Try scanning a suspicious link or message.",
        suggestedTabKey: "Scan",
      },
      {
        id: "go_security",
        title: "Open Security",
        message: "This is your Protection Center. Use Quick Actions for the fastest help.",
        suggestedTabKey: "Security",
      },
      {
        id: "go_safety",
        title: "Check Safety",
        message: "See community alerts and recent scam activity.",
        suggestedTabKey: "Safety",
      },
      {
        id: "go_more",
        title: "Settings & Help",
        message: "Everything else lives in More—settings, help center, and admin tools (if you're the owner).",
        suggestedTabKey: "More",
      },
    ],
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Tutorial</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitle}>Walkthrough + optional interactive tour.</Text>

        <View style={styles.callout}>
          <Ionicons name="videocam" size={18} color={colors.textSecondary} />
          <Text style={styles.calloutText}>
            Add your video links in lib/tutorialVideos.ts to enable "Watch" buttons.
          </Text>
        </View>

        <WalkthroughModal
          visible
          onRequestClose={onClose}
          steps={steps}
          storageKey="scamvigil_walkthrough_v1"
          onStartInteractiveTour={() => setShowInteractive(true)}
          trackEvent={trackEvent}
        />

        <InteractiveTourModal
          visible={showInteractive}
          onRequestClose={() => setShowInteractive(false)}
          storageKey="scamvigil_interactive_tour_v1"
          steps={interactiveSteps}
          onNavigateToTab={(tabKey) => onNavigateToTab?.(tabKey)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...typography.h3, color: colors.textPrimary },
  body: { flex: 1 },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  callout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  calloutText: { ...typography.caption, color: colors.textMuted, flex: 1 },
});