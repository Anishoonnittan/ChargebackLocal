import React, { useEffect, useMemo, useState } from "react";
import {
View,
Text,
StyleSheet,
TouchableOpacity,
Modal,
Dimensions,
Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, spacing, borderRadius, typography, shadows } from "../../lib/theme";

export type WalkthroughStep = {
id: string;
title: string;
description: string;
icon: keyof typeof Ionicons.glyphMap;
accentColor: string;
/** Optional: show a short video link (opens externally) */
videoUrl?: string;
videoLabel?: string;
};

type Props = {
visible: boolean;
onRequestClose: () => void;
steps: Array<WalkthroughStep>;
/**
* Used to remember that this user completed/closed the tour (local only).
* Example: "scamvigil_walkthrough_v1" | "chargeback_walkthrough_v1"
*/
storageKey: string;
/**
* If provided, we record simple A/B events to Convex.
* This is optional (works even if you don't pass these).
*/
trackEvent?: (event: "exposure" | "complete" | "skip" | "video_click", stepId?: string) => void;
/**
* Optional: a CTA to start an interactive in-app tour.
* We keep this separate from the walkthrough carousel so it stays stable.
*/
onStartInteractiveTour?: () => void;
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WalkthroughModal({
visible,
onRequestClose,
steps,
storageKey,
trackEvent,
onStartInteractiveTour,
}: Props) {
const safeSteps = useMemo(() => steps.filter(Boolean), [steps]);
const [stepIndex, setStepIndex] = useState(0);

useEffect(() => {
if (visible) {
setStepIndex(0);
trackEvent?.("exposure");
}
}, [visible, trackEvent]);

const step = safeSteps[stepIndex];

const markCompletedAndClose = async (reason: "complete" | "skip") => {
try {
await AsyncStorage.setItem(storageKey, "done");
} catch {
// Best-effort only.
}

trackEvent?.(reason);
onRequestClose();
};

const handleNext = async () => {
const isLast = stepIndex >= safeSteps.length - 1;
if (isLast) {
await markCompletedAndClose("complete");
return;
}
setStepIndex((i) => Math.min(i + 1, safeSteps.length - 1));
};

const handleWatchVideo = async () => {
if (!step?.videoUrl) {
return;
}

trackEvent?.("video_click", step.id);

try {
await Linking.openURL(step.videoUrl);
} catch {
// ignore
}
};

if (!step) {
return null;
}

return (
<Modal visible={visible} animationType="slide" onRequestClose={onRequestClose}>
<View style={styles.container}>
<View style={styles.topBar}>
<TouchableOpacity
onPress={() => void markCompletedAndClose("skip")}
style={styles.skipButton}
>
<Text style={styles.skipText}>Skip</Text>
</TouchableOpacity>

<View style={styles.progressPills}>
{safeSteps.map((s, idx) => {
const isActive = idx === stepIndex;
return (
<View
key={s.id}
style={[
styles.progressPill,
{ backgroundColor: isActive ? colors.primary : colors.borderLight },
]}
/>
);
})}
</View>

<View style={{ width: 60 }} />
</View>

<View style={styles.content}>
<View style={[styles.iconShell, { backgroundColor: `${step.accentColor}18` }]}>
<View style={[styles.iconCircle, { backgroundColor: step.accentColor }]}>
<Ionicons name={step.icon} size={28} color={colors.textOnPrimary} />
</View>
</View>

<Text style={styles.title}>{step.title}</Text>
<Text style={styles.description}>{step.description}</Text>

{!!step.videoUrl && (
<TouchableOpacity
onPress={() => void handleWatchVideo()}
style={styles.videoCard}
activeOpacity={0.85}
>
<View style={styles.videoIcon}>
<Ionicons name="play" size={18} color={colors.primary} />
</View>
<View style={{ flex: 1 }}>
<Text style={styles.videoTitle}>{step.videoLabel ?? "Watch 60s demo"}</Text>
<Text style={styles.videoSubtitle}>Opens in your browser</Text>
</View>
<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
</TouchableOpacity>
)}
</View>

<View style={styles.footer}>
{!!onStartInteractiveTour && (
<TouchableOpacity
onPress={onStartInteractiveTour}
style={styles.secondaryButton}
activeOpacity={0.85}
>
<Ionicons name="walk" size={18} color={colors.primary} />
<Text style={styles.secondaryButtonText}>Interactive Tour</Text>
</TouchableOpacity>
)}

<TouchableOpacity
onPress={() => void handleNext()}
style={styles.primaryButton}
activeOpacity={0.9}
>
<Text style={styles.primaryButtonText}>
{stepIndex >= safeSteps.length - 1 ? "Get Started" : "Next"}
</Text>
<Ionicons name="arrow-forward" size={18} color={colors.textOnPrimary} />
</TouchableOpacity>
</View>

<View style={{ height: Math.max(12, SCREEN_HEIGHT * 0.02) }} />
</View>
</Modal>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: colors.background,
},
topBar: {
flexDirection: "row",
alignItems: "center",
justifyContent: "space-between",
paddingHorizontal: spacing.lg,
paddingTop: spacing.md,
paddingBottom: spacing.sm,
},
skipButton: {
paddingVertical: 8,
paddingHorizontal: 10,
borderRadius: borderRadius.full,
backgroundColor: colors.surface,
borderWidth: 1,
borderColor: colors.borderLight,
},
skipText: {
...typography.caption,
color: colors.textSecondary,
fontWeight: "700",
},
progressPills: {
flexDirection: "row",
alignItems: "center",
gap: 6,
},
progressPill: {
width: 18,
height: 6,
borderRadius: 99,
},
content: {
flex: 1,
paddingHorizontal: spacing.xl,
paddingTop: spacing.xl,
alignItems: "center",
},
iconShell: {
width: 88,
height: 88,
borderRadius: 44,
alignItems: "center",
justifyContent: "center",
marginBottom: spacing.lg,
},
iconCircle: {
width: 56,
height: 56,
borderRadius: 28,
alignItems: "center",
justifyContent: "center",
...shadows.sm,
},
title: {
...typography.h2,
textAlign: "center",
color: colors.textPrimary,
marginBottom: spacing.sm,
},
description: {
...typography.body,
textAlign: "center",
color: colors.textSecondary,
lineHeight: 22,
maxWidth: 340,
},
videoCard: {
marginTop: spacing.xl,
width: "100%",
maxWidth: 420,
flexDirection: "row",
alignItems: "center",
backgroundColor: colors.surface,
borderWidth: 1,
borderColor: colors.borderLight,
borderRadius: borderRadius.lg,
padding: spacing.md,
gap: spacing.md,
...shadows.sm,
},
videoIcon: {
width: 40,
height: 40,
borderRadius: 20,
backgroundColor: colors.primarySurface,
alignItems: "center",
justifyContent: "center",
},
videoTitle: {
...typography.body,
fontWeight: "800",
color: colors.textPrimary,
},
videoSubtitle: {
...typography.caption,
color: colors.textMuted,
marginTop: 2,
},
footer: {
paddingHorizontal: spacing.xl,
paddingBottom: spacing.lg,
gap: spacing.sm,
},
secondaryButton: {
height: 52,
borderRadius: borderRadius.lg,
backgroundColor: colors.surface,
borderWidth: 1,
borderColor: colors.primary + "40",
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
gap: 10,
},
secondaryButtonText: {
...typography.button,
color: colors.primary,
fontWeight: "800",
},
primaryButton: {
height: 56,
borderRadius: borderRadius.lg,
backgroundColor: colors.primary,
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
gap: 10,
...shadows.md,
},
primaryButtonText: {
...typography.button,
color: colors.textOnPrimary,
fontWeight: "800",
},
});
