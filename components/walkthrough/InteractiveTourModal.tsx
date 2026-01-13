import React, { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography, shadows } from "../../lib/theme";

export type InteractiveTourStep = {
id: string;
title: string;
message: string;
/** Optional navigation helper */
suggestedTabKey?: string;
};

type Props = {
visible: boolean;
onRequestClose: () => void;
storageKey: string;
steps: Array<InteractiveTourStep>;
onNavigateToTab?: (tabKey: string) => void;
};

export default function InteractiveTourModal({
visible,
onRequestClose,
storageKey,
steps,
onNavigateToTab,
}: Props) {
const safeSteps = useMemo(() => steps.filter(Boolean), [steps]);
const [index, setIndex] = useState(0);

useEffect(() => {
if (visible) {
setIndex(0);
}
}, [visible]);

const step = safeSteps[index];

const closeAndRemember = async () => {
try {
await AsyncStorage.setItem(storageKey, "done");
} catch {
// Best-effort.
}
onRequestClose();
};

const handleNext = async () => {
const isLast = index >= safeSteps.length - 1;
if (isLast) {
await closeAndRemember();
return;
}
setIndex((v) => Math.min(v + 1, safeSteps.length - 1));
};

const handleGo = () => {
if (step?.suggestedTabKey) {
onNavigateToTab?.(step.suggestedTabKey);
}
};

if (!step) {
return null;
}

return (
<Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
<View style={styles.overlay}>
<View style={styles.card}>
<View style={styles.headerRow}>
<View style={styles.badge}>
<Ionicons name="walk" size={16} color={colors.primary} />
<Text style={styles.badgeText}>Guided Tour</Text>
</View>
<TouchableOpacity onPress={() => void closeAndRemember()} style={styles.closeButton}>
<Ionicons name="close" size={18} color={colors.textSecondary} />
</TouchableOpacity>
</View>

<Text style={styles.title}>{step.title}</Text>
<Text style={styles.message}>{step.message}</Text>

{!!step.suggestedTabKey && (
<TouchableOpacity onPress={handleGo} style={styles.goButton} activeOpacity={0.85}>
<Ionicons name="navigate" size={18} color={colors.textOnPrimary} />
<Text style={styles.goButtonText}>Take me there</Text>
</TouchableOpacity>
)}

<TouchableOpacity onPress={() => void handleNext()} style={styles.nextButton} activeOpacity={0.9}>
<Text style={styles.nextButtonText}>{index >= safeSteps.length - 1 ? "Done" : "I did it"}</Text>
<Ionicons name="chevron-forward" size={18} color={colors.textOnPrimary} />
</TouchableOpacity>

<View style={styles.progressRow}>
<Text style={styles.progressText}>Step {index + 1} of {safeSteps.length}</Text>
</View>
</View>
</View>
</Modal>
);
}

const styles = StyleSheet.create({
overlay: {
flex: 1,
backgroundColor: "rgba(15, 23, 42, 0.55)",
alignItems: "center",
justifyContent: "center",
padding: spacing.xl,
},
card: {
width: "100%",
maxWidth: 440,
backgroundColor: colors.surface,
borderRadius: borderRadius.xl,
padding: spacing.xl,
borderWidth: 1,
borderColor: colors.borderLight,
...shadows.lg,
},
headerRow: {
flexDirection: "row",
alignItems: "center",
justifyContent: "space-between",
marginBottom: spacing.md,
},
badge: {
flexDirection: "row",
alignItems: "center",
gap: 8,
backgroundColor: colors.primarySurface,
borderRadius: borderRadius.full,
paddingHorizontal: 12,
paddingVertical: 8,
borderWidth: 1,
borderColor: colors.primary + "25",
},
badgeText: {
...typography.caption,
fontWeight: "800",
color: colors.primary,
},
closeButton: {
width: 36,
height: 36,
borderRadius: 18,
backgroundColor: colors.background,
alignItems: "center",
justifyContent: "center",
},
title: {
...typography.h3,
color: colors.textPrimary,
marginBottom: spacing.sm,
},
message: {
...typography.body,
color: colors.textSecondary,
lineHeight: 22,
marginBottom: spacing.lg,
},
goButton: {
height: 48,
borderRadius: borderRadius.lg,
backgroundColor: colors.primary,
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
gap: 10,
marginBottom: spacing.sm,
},
goButtonText: {
...typography.button,
color: colors.textOnPrimary,
fontWeight: "800",
},
nextButton: {
height: 52,
borderRadius: borderRadius.lg,
backgroundColor: colors.textPrimary,
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
gap: 10,
},
nextButtonText: {
...typography.button,
color: colors.textOnPrimary,
fontWeight: "800",
},
progressRow: {
marginTop: spacing.md,
alignItems: "center",
},
progressText: {
...typography.caption,
color: colors.textMuted,
},
});
