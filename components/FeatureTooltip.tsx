import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography, shadows } from "../lib/theme";

type Props = {
featureId: string;
title: string;
message: string;
children: React.ReactNode;
/** If true, shows even if dismissed (useful for demos) */
forceVisible?: boolean;
};

const storageKeyFor = (featureId: string) => `feature_tooltip_dismissed:${featureId}`;

export default function FeatureTooltip({
featureId,
title,
message,
children,
forceVisible,
}: Props) {
const storageKey = useMemo(() => storageKeyFor(featureId), [featureId]);
const [isVisible, setIsVisible] = useState(false);

useEffect(() => {
let isMounted = true;

const load = async () => {
try {
const dismissed = await AsyncStorage.getItem(storageKey);
if (!isMounted) return;
setIsVisible(forceVisible ? true : dismissed !== "1");
} catch {
if (!isMounted) return;
setIsVisible(true);
}
};

void load();

return () => {
isMounted = false;
};
}, [storageKey, forceVisible]);

const dismiss = async () => {
setIsVisible(false);
try {
await AsyncStorage.setItem(storageKey, "1");
} catch {
// Best-effort only.
}
};

return (
<View style={styles.wrapper}>
{children}

{isVisible && (
<View style={styles.tooltip} pointerEvents="box-none">
<View style={styles.tooltipCard}>
<View style={styles.tooltipHeader}>
<View style={styles.tooltipBadge}>
<Ionicons name="sparkles" size={14} color={colors.primary} />
<Text style={styles.tooltipBadgeText}>Tip</Text>
</View>
<TouchableOpacity onPress={() => void dismiss()} style={styles.closeButton}>
<Ionicons name="close" size={16} color={colors.textSecondary} />
</TouchableOpacity>
</View>

<Text style={styles.tooltipTitle}>{title}</Text>
<Text style={styles.tooltipMessage}>{message}</Text>

<TouchableOpacity onPress={() => void dismiss()} style={styles.gotItButton} activeOpacity={0.9}>
<Text style={styles.gotItText}>Got it</Text>
</TouchableOpacity>
</View>
</View>
)}
</View>
);
}

const styles = StyleSheet.create({
wrapper: {
position: "relative",
},
tooltip: {
position: "absolute",
right: spacing.lg,
top: -8,
zIndex: 20,
},
tooltipCard: {
width: 260,
backgroundColor: colors.surface,
borderRadius: borderRadius.lg,
borderWidth: 1,
borderColor: colors.borderLight,
padding: spacing.md,
...shadows.md,
},
tooltipHeader: {
flexDirection: "row",
alignItems: "center",
justifyContent: "space-between",
marginBottom: spacing.sm,
},
tooltipBadge: {
flexDirection: "row",
alignItems: "center",
gap: 6,
backgroundColor: colors.primarySurface,
paddingHorizontal: 10,
paddingVertical: 6,
borderRadius: borderRadius.full,
borderWidth: 1,
borderColor: colors.primary + "25",
},
tooltipBadgeText: {
...typography.caption,
fontWeight: "800",
color: colors.primary,
},
closeButton: {
width: 28,
height: 28,
borderRadius: 14,
alignItems: "center",
justifyContent: "center",
backgroundColor: colors.background,
},
tooltipTitle: {
...typography.body,
fontWeight: "900",
color: colors.textPrimary,
marginBottom: 4,
},
tooltipMessage: {
...typography.caption,
color: colors.textSecondary,
lineHeight: 18,
},
gotItButton: {
marginTop: spacing.sm,
height: 36,
borderRadius: borderRadius.md,
backgroundColor: colors.primary,
alignItems: "center",
justifyContent: "center",
},
gotItText: {
...typography.caption,
fontWeight: "900",
color: colors.textOnPrimary,
},
});
