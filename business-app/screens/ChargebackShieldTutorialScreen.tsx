import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../lib/theme";
import WalkthroughModal, { WalkthroughStep } from "../../components/walkthrough/WalkthroughModal";
import InteractiveTourModal, { InteractiveTourStep } from "../../components/walkthrough/InteractiveTourModal";
import { TUTORIAL_VIDEOS } from "../../lib/tutorialVideos";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getOrAssignVariant, type ABVariant } from "../../lib/abTesting";

export default function ChargebackShieldTutorialScreen({
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
      const v = await getOrAssignVariant("cb_tutorial_welcome_v1");
      if (isMounted) {
        setVariant(v);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const trackEvent = (event: "exposure" | "complete" | "skip" | "video_click", stepId?: string) => {
    void (async () => {
      try {
        await track({
          sessionToken,
          app: "chargeback",
          experimentKey: "cb_tutorial_welcome_v1",
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
        title: variant === "A" ? "Welcome to ChargebackShield" : "Protect revenue automatically",
        description:
          variant === "A"
            ? "Protect revenue by blocking high-risk orders and winning disputes."
            : "Scan orders, spot fraud signals, and reduce chargebacks without slowing fulfillment.",
        icon: "shield-checkmark",
        accentColor: "#2563EB",
      },
      {
        id: "scan",
        title: "Scan Orders",
        description: "Scan new orders to detect fraud signals before you fulfill.",
        icon: "scan",
        accentColor: colors.primary,
        videoUrl: TUTORIAL_VIDEOS.chargebackShield.scanOrder ?? undefined,
        videoLabel: "Watch: Scan an order (60s)",
      },
      {
        id: "protect",
        title: "Protection Center",
        description: "Use Dark Web, Fraud Intel, and Customer Intelligence to stay ahead.",
        icon: "sparkles",
        accentColor: colors.warning,
      },
      {
        id: "disputes",
        title: "Disputes",
        description: "Build evidence packages and track your win rate.",
        icon: "document-text",
        accentColor: colors.info,
        videoUrl: TUTORIAL_VIDEOS.chargebackShield.disputes ?? undefined,
        videoLabel: "Watch: Manage disputes (60s)",
      },
      {
        id: "integrations",
        title: "Integrations",
        description: "Connect Shopify/Stripe so orders and disputes sync automatically.",
        icon: "git-network",
        accentColor: colors.success,
        videoUrl: TUTORIAL_VIDEOS.chargebackShield.integrations ?? undefined,
        videoLabel: "Watch: Connect integrations (60s)",
      },
    ],
    [variant]
  );

  const interactiveSteps: Array<InteractiveTourStep> = useMemo(
    () => [
      {
        id: "go_home",
        title: "Home Dashboard",
        message: "Your KPIs live here. Check revenue protected + risk trends.",
        suggestedTabKey: "dashboard",
      },
      {
        id: "go_scan",
        title: "Scan",
        message: "Scan a suspicious order now. You can do this before fulfillment.",
        suggestedTabKey: "scan",
      },
      {
        id: "go_protect",
        title: "Protect",
        message: "Use Protection Center for Dark Web, Fraud Intel, and Customers.",
        suggestedTabKey: "protect",
      },
      {
        id: "go_disputes",
        title: "Disputes",
        message: "Track disputes and build stronger evidence packages.",
        suggestedTabKey: "disputes",
      },
      {
        id: "go_more",
        title: "More",
        message: "Analytics, Integration Hub, and Settings live here.",
        suggestedTabKey: "more",
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

        <WalkthroughModal
          visible
          onRequestClose={onClose}
          steps={steps}
          storageKey="chargeback_walkthrough_v1"
          onStartInteractiveTour={() => setShowInteractive(true)}
          trackEvent={trackEvent}
        />

        <InteractiveTourModal
          visible={showInteractive}
          onRequestClose={() => setShowInteractive(false)}
          storageKey="chargeback_interactive_tour_v1"
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
});