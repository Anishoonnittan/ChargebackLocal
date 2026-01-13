import React, { useState } from "react";
import {
View,
Text,
StyleSheet,
ScrollView,
TouchableOpacity,
ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../convex/_generated/api";
import { colors, spacing, borderRadius, typography, shadows } from "../lib/theme";
import { useSafeConvexQuery } from "../hooks/useSafeConvexQuery";

type TimeRange = "24h" | "7d" | "30d" | "all";

export default function ABTestAnalyticsScreen({ onBack }: { onBack: () => void }) {
const [timeRange, setTimeRange] = useState<TimeRange>("7d");

// Fetch A/B test results from Convex
const {
  data: experiments,
  error: experimentsError,
  status: experimentsStatus,
} = useSafeConvexQuery<any[]>(api.abTests.getExperimentResults, { timeRange });

const experimentsSafe = experiments ?? [];

const renderTimeRangeSelector = () => (
<View style={styles.timeRangeSelector}>
{(["24h", "7d", "30d", "all"] as TimeRange[]).map((range) => (
<TouchableOpacity
key={range}
style={[
styles.timeRangeButton,
timeRange === range && styles.timeRangeButtonActive,
]}
onPress={() => setTimeRange(range)}
>
<Text
style={[
styles.timeRangeText,
timeRange === range && styles.timeRangeTextActive,
]}
>
{range === "all" ? "All Time" : range.toUpperCase()}
</Text>
</TouchableOpacity>
))}
</View>
);

const renderExperimentCard = (experiment: any) => {
const variantA = experiment.variants.find((v: any) => v.variant === "A");
const variantB = experiment.variants.find((v: any) => v.variant === "B");

const conversionRateA = variantA
? (variantA.conversions / variantA.exposures) * 100
: 0;
const conversionRateB = variantB
? (variantB.conversions / variantB.exposures) * 100
: 0;

const improvement = conversionRateB - conversionRateA;
const winner = conversionRateB > conversionRateA ? "B" : "A";
const isSignificant = Math.abs(improvement) > 5; // 5% threshold

return (
<View key={experiment.experimentKey} style={styles.experimentCard}>
{/* Header */}
<View style={styles.experimentHeader}>
<View style={styles.experimentTitleRow}>
<Ionicons name="flask" size={20} color={colors.primary} />
<Text style={styles.experimentTitle}>{experiment.name}</Text>
</View>
{isSignificant && (
<View style={styles.winnerBadge}>
<Ionicons name="trophy" size={14} color={colors.warning} />
<Text style={styles.winnerText}>Winner: {winner}</Text>
</View>
)}
</View>

<Text style={styles.experimentDescription}>{experiment.description}</Text>

{/* Variants Comparison */}
<View style={styles.variantsContainer}>
{/* Variant A */}
<View style={styles.variantCard}>
<View style={styles.variantHeader}>
<Text style={styles.variantLabel}>Variant A</Text>
{winner === "A" && isSignificant && (
<Ionicons name="checkmark-circle" size={18} color={colors.success} />
)}
</View>
<Text style={styles.variantTitle}>{experiment.variantATitle}</Text>
<View style={styles.metricsRow}>
<View style={styles.metric}>
<Text style={styles.metricValue}>{variantA?.exposures || 0}</Text>
<Text style={styles.metricLabel}>Exposures</Text>
</View>
<View style={styles.metric}>
<Text style={styles.metricValue}>{variantA?.conversions || 0}</Text>
<Text style={styles.metricLabel}>Conversions</Text>
</View>
<View style={styles.metric}>
<Text style={[styles.metricValue, { color: colors.primary }]}>
{conversionRateA.toFixed(1)}%
</Text>
<Text style={styles.metricLabel}>Rate</Text>
</View>
</View>
</View>

{/* Variant B */}
<View style={styles.variantCard}>
<View style={styles.variantHeader}>
<Text style={styles.variantLabel}>Variant B</Text>
{winner === "B" && isSignificant && (
<Ionicons name="checkmark-circle" size={18} color={colors.success} />
)}
</View>
<Text style={styles.variantTitle}>{experiment.variantBTitle}</Text>
<View style={styles.metricsRow}>
<View style={styles.metric}>
<Text style={styles.metricValue}>{variantB?.exposures || 0}</Text>
<Text style={styles.metricLabel}>Exposures</Text>
</View>
<View style={styles.metric}>
<Text style={styles.metricValue}>{variantB?.conversions || 0}</Text>
<Text style={styles.metricLabel}>Conversions</Text>
</View>
<View style={styles.metric}>
<Text style={[styles.metricValue, { color: colors.primary }]}>
{conversionRateB.toFixed(1)}%
</Text>
<Text style={styles.metricLabel}>Rate</Text>
</View>
</View>
</View>
</View>

{/* Improvement */}
<View style={styles.improvementRow}>
<Ionicons
name={improvement > 0 ? "trending-up" : "trending-down"}
size={18}
color={improvement > 0 ? colors.success : colors.error}
/>
<Text
style={[
styles.improvementText,
{ color: improvement > 0 ? colors.success : colors.error },
]}
>
{improvement > 0 ? "+" : ""}
{improvement.toFixed(1)}% improvement
</Text>
{isSignificant && (
<View style={styles.significantBadge}>
<Text style={styles.significantText}>Significant</Text>
</View>
)}
</View>
</View>
);
};

return (
<SafeAreaView style={styles.container} edges={["top"]}>
{/* Header */}
<View style={styles.header}>
<TouchableOpacity onPress={onBack} style={styles.backButton}>
<Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
</TouchableOpacity>
<Text style={styles.headerTitle}>A/B Test Analytics</Text>
<View style={{ width: 44 }} />
</View>

{/* Time Range Selector */}
{renderTimeRangeSelector()}

<ScrollView
contentContainerStyle={styles.scrollContent}
showsVerticalScrollIndicator={false}
>
{/* Summary Stats */}
<View style={styles.summaryCard}>
<Text style={styles.summaryTitle}>Active Experiments</Text>
<Text style={styles.summaryValue}>{experimentsSafe.length}</Text>
<Text style={styles.summarySubtitle}>
Testing copy, CTAs, colors & layouts
</Text>
</View>

{/* Experiments */}
{experimentsStatus === "loading" ? (
<View style={styles.loadingContainer}>
<ActivityIndicator size="large" color={colors.primary} />
<Text style={styles.loadingText}>Loading experiments...</Text>
</View>
) : experimentsError ? (
  <View style={styles.emptyState}>
    <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
    <Text style={styles.emptyTitle}>Analytics not available yet</Text>
    <Text style={styles.emptySubtitle}>
      The A/B testing backend hasn't been deployed to Convex yet, so results can't load.
      The app will keep working normally.
    </Text>
  </View>
) : experimentsSafe.length === 0 ? (
<View style={styles.emptyState}>
<Ionicons name="flask-outline" size={64} color={colors.textMuted} />
<Text style={styles.emptyTitle}>No experiments yet</Text>
<Text style={styles.emptySubtitle}>
A/B tests will appear here once users start interacting with your app
</Text>
</View>
) : (
experimentsSafe.map(renderExperimentCard)
)}

{/* Info Footer */}
<View style={styles.infoFooter}>
<Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
<Text style={styles.infoText}>
Experiments with 5%+ improvement and 100+ exposures are marked as significant
</Text>
</View>
</ScrollView>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: colors.background,
},
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
headerTitle: {
...typography.h3,
color: colors.textPrimary,
},
timeRangeSelector: {
flexDirection: "row",
paddingHorizontal: spacing.lg,
marginBottom: spacing.lg,
gap: spacing.sm,
},
timeRangeButton: {
flex: 1,
height: 36,
borderRadius: borderRadius.md,
backgroundColor: colors.surface,
borderWidth: 1,
borderColor: colors.borderLight,
alignItems: "center",
justifyContent: "center",
},
timeRangeButtonActive: {
backgroundColor: colors.primary,
borderColor: colors.primary,
},
timeRangeText: {
...typography.caption,
fontWeight: "700",
color: colors.textSecondary,
},
timeRangeTextActive: {
color: colors.textOnPrimary,
},
scrollContent: {
paddingHorizontal: spacing.lg,
paddingBottom: 40,
},
summaryCard: {
backgroundColor: colors.surface,
borderRadius: borderRadius.xl,
padding: spacing.xl,
marginBottom: spacing.lg,
alignItems: "center",
...shadows.md,
},
summaryTitle: {
...typography.caption,
color: colors.textSecondary,
marginBottom: spacing.xs,
},
summaryValue: {
fontSize: 48,
fontWeight: "700",
color: colors.primary,
marginBottom: spacing.xs,
},
summarySubtitle: {
...typography.caption,
color: colors.textMuted,
textAlign: "center",
},
experimentCard: {
backgroundColor: colors.surface,
borderRadius: borderRadius.xl,
padding: spacing.lg,
marginBottom: spacing.lg,
borderWidth: 1,
borderColor: colors.borderLight,
...shadows.sm,
},
experimentHeader: {
flexDirection: "row",
alignItems: "center",
justifyContent: "space-between",
marginBottom: spacing.sm,
},
experimentTitleRow: {
flexDirection: "row",
alignItems: "center",
gap: spacing.sm,
flex: 1,
},
experimentTitle: {
...typography.h4,
color: colors.textPrimary,
},
winnerBadge: {
flexDirection: "row",
alignItems: "center",
gap: 4,
backgroundColor: colors.warning + "15",
paddingHorizontal: 8,
paddingVertical: 4,
borderRadius: borderRadius.sm,
},
winnerText: {
...typography.caption,
fontWeight: "700",
color: colors.warning,
},
experimentDescription: {
...typography.body,
color: colors.textSecondary,
marginBottom: spacing.lg,
},
variantsContainer: {
gap: spacing.md,
marginBottom: spacing.md,
},
variantCard: {
backgroundColor: colors.background,
borderRadius: borderRadius.lg,
padding: spacing.md,
borderWidth: 1,
borderColor: colors.borderLight,
},
variantHeader: {
flexDirection: "row",
alignItems: "center",
justifyContent: "space-between",
marginBottom: spacing.xs,
},
variantLabel: {
...typography.caption,
fontWeight: "700",
color: colors.textMuted,
},
variantTitle: {
...typography.body,
fontWeight: "600",
color: colors.textPrimary,
marginBottom: spacing.md,
},
metricsRow: {
flexDirection: "row",
gap: spacing.lg,
},
metric: {
flex: 1,
},
metricValue: {
...typography.h4,
color: colors.textPrimary,
marginBottom: 2,
},
metricLabel: {
...typography.caption,
color: colors.textMuted,
},
improvementRow: {
flexDirection: "row",
alignItems: "center",
gap: spacing.sm,
paddingTop: spacing.md,
borderTopWidth: 1,
borderTopColor: colors.borderLight,
},
improvementText: {
...typography.body,
fontWeight: "700",
},
significantBadge: {
backgroundColor: colors.success + "15",
paddingHorizontal: 8,
paddingVertical: 4,
borderRadius: borderRadius.sm,
marginLeft: "auto",
},
significantText: {
...typography.caption,
fontWeight: "700",
color: colors.success,
},
loadingContainer: {
alignItems: "center",
paddingVertical: spacing.xl * 2,
},
loadingText: {
...typography.body,
color: colors.textMuted,
marginTop: spacing.md,
},
emptyState: {
alignItems: "center",
paddingVertical: spacing.xl * 2,
},
emptyTitle: {
...typography.h3,
color: colors.textPrimary,
marginTop: spacing.lg,
marginBottom: spacing.sm,
},
emptySubtitle: {
...typography.body,
color: colors.textSecondary,
textAlign: "center",
maxWidth: 300,
},
infoFooter: {
flexDirection: "row",
alignItems: "flex-start",
gap: spacing.sm,
marginTop: spacing.lg,
},
infoText: {
...typography.caption,
color: colors.textMuted,
flex: 1,
lineHeight: 18,
},
});

// end