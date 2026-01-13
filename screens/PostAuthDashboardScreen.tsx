import React, { useMemo, useState } from "react";
import {
View,
Text,
StyleSheet,
ScrollView,
TouchableOpacity,
TextInput,
Alert,
ActivityIndicator,
Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { borderRadius, colors, shadows, spacing, typography } from "../lib/theme";

/**
* Post-Authorization Dashboard (120-day monitoring)
*
* IMPORTANT:
* - This is a business-app surface (bottom tab: Protect)
* - Data currently comes from `preAuthCheck.getPostAuthOrders` (demo-friendly)
*/

type PostAuthStatus = "UNDER_MONITORING" | "CHARGEBACKS_FILED" | "CLEARED";

type Props = {
sessionToken: string;
};

function formatMoney(amount: number) {
return `$${amount.toFixed(2)}`;
}

function getStatusMeta(status: string) {
const normalized = status as PostAuthStatus;

switch (normalized) {
case "CHARGEBACKS_FILED":
return {
label: "Chargeback",
icon: "warning" as const,
pillBg: colors.errorLight,
pillFg: colors.error,
};
case "CLEARED":
return {
label: "Cleared",
icon: "checkmark-circle" as const,
pillBg: colors.successLight,
pillFg: colors.success,
};
default:
return {
label: "Monitoring",
icon: "pulse" as const,
pillBg: colors.primarySurface,
pillFg: colors.primary,
};
}
}

function clamp(n: number, min: number, max: number) {
return Math.max(min, Math.min(max, n));
}

export default function PostAuthDashboardScreen({ sessionToken }: Props) {
const ordersQuery = useQuery(api.preAuthCheck.getPostAuthOrders, { sessionToken });
const createPostAuthOrder = useMutation(api.preAuthCheck.createPostAuthOrder);
const markChargebackFiled = useMutation(api.preAuthCheck.markChargebackFiled);
const markOrderCleared = useMutation(api.preAuthCheck.markOrderCleared);
const runMonitoringNow = useMutation(api.monitoringJobs.runNow);

const [isRunningCheckNow, setIsRunningCheckNow] = useState(false);
const [runNowStatusText, setRunNowStatusText] = useState<string | null>(null);

const [activeTab, setActiveTab] = useState<"monitoring" | "chargebacks" | "cleared">(
"monitoring"
);

// Manual add form
const [isAdding, setIsAdding] = useState(false);
const [orderId, setOrderId] = useState("");
const [email, setEmail] = useState("");
const [amount, setAmount] = useState("");
const [cardBin, setCardBin] = useState("");
const [ipAddress, setIpAddress] = useState("");

const orders = useMemo(() => {
return Array.isArray(ordersQuery) ? ordersQuery : [];
}, [ordersQuery]);

const monitoring = orders.filter((o: any) => o.status === "UNDER_MONITORING");
const chargebacks = orders.filter((o: any) => o.status === "CHARGEBACKS_FILED");
const cleared = orders.filter((o: any) => o.status === "CLEARED");

const filtered = useMemo(() => {
if (activeTab === "chargebacks") return chargebacks;
if (activeTab === "cleared") return cleared;
return monitoring;
}, [activeTab, chargebacks, cleared, monitoring]);

const isLoading = ordersQuery === undefined;

const handleStartMonitoring = async () => {
if (!orderId.trim() || !email.trim() || !amount.trim()) {
Alert.alert("Missing info", "Order ID, Email, and Amount are required.");
return;
}

const numericAmount = Number(amount);
if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
Alert.alert("Invalid amount", "Enter a valid amount like 99.99");
return;
}

try {
await createPostAuthOrder({
sessionToken,
orderId: orderId.trim(),
amount: numericAmount,
email: email.trim().toLowerCase(),
cardBin: cardBin.trim() || "000000",
ipAddress: ipAddress.trim() || "0.0.0.0",
preAuthScore: 80,
chargebackRisk: 20,
fraudSignals: [],
status: "UNDER_MONITORING",
});

setIsAdding(false);
setOrderId("");
setEmail("");
setAmount("");
setCardBin("");
setIpAddress("");

Alert.alert("Monitoring started", "This order is now in 120-day post-auth monitoring.");
} catch (e: any) {
Alert.alert("Error", e?.message ?? "Failed to start monitoring.");
}
};

const handleRunCheckNow = async () => {
  if (isRunningCheckNow) return;
  try {
    setIsRunningCheckNow(true);
    setRunNowStatusText("Running monitoring check…");

    // Ensure the loading UI renders even if the network responds very fast.
    await new Promise((resolve) => setTimeout(resolve, 250));

    const result: any = await runMonitoringNow({ sessionToken });
    const scanned = Number(result?.scanned ?? 0);
    const movedToCleared = Number(result?.movedToCleared ?? 0);
    const stillMonitoring = Number(result?.stillMonitoring ?? 0);

    const message =
      scanned === 0
        ? "No orders are currently under monitoring. Add an order (top-right) or move an approved order to Post-Auth."
        : `Checked ${scanned} order(s)\nStill monitoring: ${stillMonitoring}\nMoved to Cleared: ${movedToCleared}`;

    setRunNowStatusText(`Monitoring check complete. ${message.replace(/\n/g, " • ")}`);
    Alert.alert("Monitoring check complete", message);

    // Keep the success message visible briefly; avoids relying on Alert.
    setTimeout(() => setRunNowStatusText(null), 3500);
  } catch (e: any) {
    const message = e?.message ?? "Failed to run monitoring check.";
    setRunNowStatusText(message ? `Error: ${message}` : "Error: Failed to run monitoring check.");
    Alert.alert("Couldn't run monitoring check", message);
    setTimeout(() => setRunNowStatusText(null), 4500);
  } finally {
    setIsRunningCheckNow(false);
  }
};

const handleMarkChargeback = (postAuthOrderId: string) => {
// iOS supports Alert.prompt; Android doesn't.
if ((Alert as any).prompt) {
(Alert as any).prompt(
"Chargeback reason",
"Enter a short reason (e.g. Fraudulent / Not received)",
async (reason: string) => {
const normalized = (reason ?? "Chargeback filed").trim();
try {
await markChargebackFiled({
postAuthOrderId: postAuthOrderId as any,
chargebackReason: normalized,
chargebackAmount: 0,
});
} catch (e: any) {
Alert.alert("Error", e?.message ?? "Failed to mark chargeback.");
}
}
);
return;
}

Alert.alert("Chargeback", "Mark this order as chargeback filed?", [
{ text: "Cancel", style: "cancel" },
{
text: "Mark",
style: "destructive",
onPress: async () => {
try {
await markChargebackFiled({
postAuthOrderId: postAuthOrderId as any,
chargebackReason: "Chargeback filed",
chargebackAmount: 0,
});
} catch (e: any) {
Alert.alert("Error", e?.message ?? "Failed to mark chargeback.");
}
},
},
]);
};

const handleMarkCleared = (postAuthOrderId: string) => {
Alert.alert("Mark cleared", "Move this order to Cleared?", [
{ text: "Cancel", style: "cancel" },
{
text: "Mark Cleared",
onPress: async () => {
try {
await markOrderCleared({ postAuthOrderId: postAuthOrderId as any });
} catch (e: any) {
Alert.alert("Error", e?.message ?? "Failed to mark cleared.");
}
},
},
]);
};

function formatShortDateTime(ts?: number) {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    const hh = d.getHours();
    const mm = `${d.getMinutes()}`.padStart(2, "0");
    const ampm = hh >= 12 ? "PM" : "AM";
    const hh12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${hh12}:${mm} ${ampm}`;
  } catch {
    return "—";
  }
}

return (
<SafeAreaView style={styles.safeArea} edges={["top"]}>
<View style={styles.container}>
  <Modal transparent visible={isRunningCheckNow} animationType="fade">
    <View style={styles.blockingOverlay}>
      <View style={styles.blockingOverlayCard}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.blockingOverlayTitle}>Running monitoring check…</Text>
        <Text style={styles.blockingOverlaySubtitle}>
          This usually takes a few seconds.
        </Text>
      </View>
    </View>
  </Modal>

<View style={styles.header}>
<View style={styles.headerIcon}>
<Ionicons name="shield-checkmark" size={18} color={colors.primary} />
</View>
<View style={{ flex: 1 }}>
<Text style={styles.title}>Post-Authorization</Text>
<Text style={styles.subtitle}>120-day monitoring after fulfillment</Text>
</View>

<View style={styles.headerActions}>
  <TouchableOpacity
    style={styles.runButton}
    onPress={handleRunCheckNow}
    activeOpacity={0.85}
    disabled={isRunningCheckNow}
  >
    {isRunningCheckNow ? (
      <ActivityIndicator size="small" color={colors.textOnPrimary} />
    ) : (
      <Ionicons name="refresh" size={18} color={colors.textOnPrimary} />
    )}
    <Text style={styles.runButtonText}>Run</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.addButton}
    onPress={() => setIsAdding((prev: boolean) => !prev)}
    activeOpacity={0.85}
  >
    <Ionicons name={isAdding ? "close" : "add"} size={18} color={colors.textOnPrimary} />
    <Text style={styles.addButtonText}>{isAdding ? "Close" : "Add"}</Text>
  </TouchableOpacity>
</View>
</View>

{runNowStatusText ? (
<View style={styles.runNowBanner}>
<Ionicons
name={runNowStatusText.startsWith("Error") ? "warning" : "information-circle"}
size={16}
color={runNowStatusText.startsWith("Error") ? colors.error : colors.textSecondary}
/>
<Text
style={[
styles.runNowBannerText,
runNowStatusText.startsWith("Error") && { color: colors.error },
]}
>
{runNowStatusText}
</Text>
</View>
) : null}

{isAdding ? (
<View style={styles.formCard}>
<Text style={styles.formTitle}>Add order to monitoring</Text>

<View style={styles.formRow}>
<Field label="Order ID" value={orderId} onChange={setOrderId} placeholder="#12345" />
<Field
label="Amount"
value={amount}
onChange={setAmount}
placeholder="99.99"
keyboardType="decimal-pad"
/>
</View>

<Field
label="Customer email"
value={email}
onChange={setEmail}
placeholder="customer@example.com"
keyboardType="email-address"
/>

<View style={styles.formRow}>
<Field
label="Card BIN (optional)"
value={cardBin}
onChange={setCardBin}
placeholder="411111"
keyboardType="number-pad"
/>
<Field
label="IP (optional)"
value={ipAddress}
onChange={setIpAddress}
placeholder="203.0.113.1"
keyboardType="numbers-and-punctuation"
/>
</View>

<TouchableOpacity style={styles.primaryCta} onPress={handleStartMonitoring} activeOpacity={0.9}>
<Ionicons name="play" size={18} color={colors.textOnPrimary} />
<Text style={styles.primaryCtaText}>Start Monitoring</Text>
</TouchableOpacity>

<Text style={styles.formHint}>
Tip: Use this for already-fulfilled orders or pipeline orders.
</Text>
</View>
) : null}

<View style={styles.tabs}>
<TabPill
label={`Monitoring (${monitoring.length})`}
active={activeTab === "monitoring"}
onPress={() => setActiveTab("monitoring")}
/>
<TabPill
label={`Chargebacks (${chargebacks.length})`}
active={activeTab === "chargebacks"}
onPress={() => setActiveTab("chargebacks")}
/>
<TabPill
label={`Cleared (${cleared.length})`}
active={activeTab === "cleared"}
onPress={() => setActiveTab("cleared")}
/>
</View>

{isLoading ? (
<View style={styles.loading}>
<ActivityIndicator size="large" color={colors.primary} />
<Text style={styles.loadingText}>Loading monitored orders…</Text>
</View>
) : (
<ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: spacing.xl }}>
{filtered.length === 0 ? (
<View style={styles.empty}>
<Ionicons name="checkmark" size={46} color={colors.textMuted} />
<Text style={styles.emptyTitle}>Nothing here yet</Text>
<Text style={styles.emptyText}>
{activeTab === "monitoring"
? "Approved orders moved to Post-Auth will show here."
: activeTab === "chargebacks"
? "Orders marked as chargeback will show here."
: "Cleared orders appear here."}
</Text>
</View>
) : (
filtered.map((o: any) => {
const meta = getStatusMeta(o.status);
const days = typeof o.daysInMonitoring === "number" ? o.daysInMonitoring : 0;
const progress = clamp(days / 120, 0, 1);
const lastCheckedAt = (o.lastCheckedAt ?? o.updatedAt) as number | undefined;

return (
<View key={o._id ?? `${o.orderId}-${o.createdAt}`} style={styles.card}>
<View style={styles.cardTopRow}>
<View style={{ flex: 1 }}>
<Text style={styles.orderId}>Order {o.orderId}</Text>
<Text style={styles.orderEmail}>{o.email}</Text>
</View>

<View style={[styles.statusPill, { backgroundColor: meta.pillBg }]}>
<Ionicons name={meta.icon} size={14} color={meta.pillFg} />
<Text style={[styles.statusPillText, { color: meta.pillFg }]}>
{meta.label}
</Text>
</View>
</View>

<View style={styles.cardMidRow}>
<InfoChip icon="cash" label={formatMoney(o.amount ?? 0)} />
<InfoChip icon="calendar" label={`${days}/120 days`} />
<InfoChip
icon="speedometer"
label={`CB risk ${Math.round(o.chargebackRisk ?? 0)}%`}
/>
<InfoChip icon="time" label={`Checked ${formatShortDateTime(lastCheckedAt)}`} />
</View>

<View style={styles.progressTrack}>
<View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
</View>

<View style={styles.cardActions}>
<TouchableOpacity
style={[styles.secondaryCta, { borderColor: colors.border }]}
onPress={() => {
Alert.alert(
"Order details",
`Order: ${o.orderId}\nEmail: ${o.email}\nAmount: ${formatMoney(o.amount ?? 0)}\nStatus: ${o.status}`
);
}}
>
<Ionicons name="information-circle" size={18} color={colors.textSecondary} />
<Text style={styles.secondaryCtaText}>Details</Text>
</TouchableOpacity>

{o.status === "UNDER_MONITORING" ? (
<>
<TouchableOpacity
style={[styles.dangerCta, { backgroundColor: colors.error }]}
onPress={() => handleMarkChargeback(o._id)}
>
<Ionicons name="warning" size={18} color={colors.textOnPrimary} />
<Text style={styles.dangerCtaText}>Chargeback</Text>
</TouchableOpacity>

<TouchableOpacity
style={[styles.goodCta, { backgroundColor: colors.success }]}
onPress={() => handleMarkCleared(o._id)}
>
<Ionicons name="checkmark" size={18} color={colors.textOnPrimary} />
<Text style={styles.goodCtaText}>Cleared</Text>
</TouchableOpacity>
</>
) : null}
</View>
</View>
);
})
)}
</ScrollView>
)}

<Text style={styles.versionMarker}>Protect tab: Post-Auth dashboard v1</Text>
</View>
</SafeAreaView>
);
}

function TabPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
return (
<TouchableOpacity
onPress={onPress}
activeOpacity={0.9}
style={[styles.tabPill, active && styles.tabPillActive]}
>
<Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>{label}</Text>
</TouchableOpacity>
);
}

function InfoChip({
icon,
label,
}: {
icon: keyof typeof Ionicons.glyphMap;
label: string;
}) {
return (
<View style={styles.infoChip}>
<Ionicons name={icon} size={14} color={colors.textSecondary} />
<Text style={styles.infoChipText}>{label}</Text>
</View>
);
}

function Field({
label,
value,
onChange,
placeholder,
keyboardType,
}: {
label: string;
value: string;
onChange: (v: string) => void;
placeholder: string;
keyboardType?: any;
}) {
return (
<View style={{ flex: 1 }}>
<Text style={styles.fieldLabel}>{label}</Text>
<TextInput
value={value}
onChangeText={onChange}
placeholder={placeholder}
placeholderTextColor={colors.textMuted}
keyboardType={keyboardType}
autoCapitalize="none"
style={styles.input}
/>
</View>
);
}

const styles = StyleSheet.create({
safeArea: { flex: 1, backgroundColor: colors.background },
container: { flex: 1, backgroundColor: colors.background },

header: {
flexDirection: "row",
alignItems: "center",
gap: spacing.md,
paddingHorizontal: spacing.lg,
paddingTop: spacing.md,
paddingBottom: spacing.md,
backgroundColor: colors.surface,
borderBottomWidth: 1,
borderBottomColor: colors.borderLight,
},

headerIcon: {
width: 36,
height: 36,
borderRadius: 12,
backgroundColor: colors.primarySurface,
alignItems: "center",
justifyContent: "center",
},

title: {
...typography.h3,
fontWeight: "900",
color: colors.textPrimary,
},
subtitle: {
...typography.caption,
color: colors.textSecondary,
marginTop: 2,
},

headerActions: {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
},

runButton: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  backgroundColor: colors.primary,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 999,
  opacity: 1,
  ...shadows.sm,
},
runButtonText: {
  ...typography.caption,
  fontWeight: "900",
  color: colors.textOnPrimary,
},

addButton: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  backgroundColor: colors.primary,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 999,
  opacity: 1,
  ...shadows.sm,
},
addButtonText: {
  ...typography.caption,
  fontWeight: "900",
  color: colors.textOnPrimary,
},

formCard: {
marginTop: spacing.md,
marginHorizontal: spacing.lg,
backgroundColor: colors.surface,
borderRadius: borderRadius.xl,
padding: spacing.lg,
borderWidth: 1,
borderColor: colors.border,
...shadows.md,
},
formTitle: {
...typography.h4,
fontWeight: "900",
color: colors.textPrimary,
marginBottom: spacing.md,
},
formRow: {
flexDirection: "row",
gap: spacing.md,
marginBottom: spacing.md,
},
fieldLabel: {
...typography.caption,
fontWeight: "800",
color: colors.textSecondary,
marginBottom: spacing.xs,
},
input: {
backgroundColor: colors.background,
borderWidth: 1,
borderColor: colors.border,
borderRadius: borderRadius.md,
paddingHorizontal: spacing.md,
paddingVertical: spacing.sm,
color: colors.textPrimary,
},
primaryCta: {
marginTop: spacing.sm,
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
gap: spacing.sm,
backgroundColor: colors.primary,
borderRadius: borderRadius.lg,
paddingVertical: spacing.md,
...shadows.sm,
},
primaryCtaText: {
...typography.button,
fontWeight: "900",
color: colors.textOnPrimary,
},
formHint: {
marginTop: spacing.sm,
...typography.caption,
color: colors.textSecondary,
textAlign: "center",
},

tabs: {
flexDirection: "row",
gap: spacing.sm,
paddingHorizontal: spacing.lg,
paddingTop: spacing.md,
},
tabPill: {
flex: 1,
backgroundColor: colors.surface,
borderWidth: 1,
borderColor: colors.border,
borderRadius: 999,
paddingVertical: 10,
alignItems: "center",
},
tabPillActive: {
backgroundColor: colors.primary,
borderColor: colors.primary,
},
tabPillText: {
...typography.caption,
fontWeight: "900",
color: colors.textSecondary,
},
tabPillTextActive: {
color: colors.textOnPrimary,
},

list: {
flex: 1,
paddingHorizontal: spacing.lg,
paddingTop: spacing.md,
},

empty: {
marginTop: spacing.xxl,
alignItems: "center",
padding: spacing.xl,
},
emptyTitle: {
...typography.h3,
fontWeight: "900",
color: colors.textPrimary,
marginTop: spacing.md,
},
emptyText: {
...typography.body,
color: colors.textSecondary,
textAlign: "center",
marginTop: spacing.sm,
},

card: {
backgroundColor: colors.surface,
borderRadius: borderRadius.xl,
padding: spacing.lg,
borderWidth: 1,
borderColor: colors.border,
marginBottom: spacing.md,
...shadows.sm,
},
cardTopRow: {
flexDirection: "row",
alignItems: "flex-start",
gap: spacing.sm,
},
orderId: {
...typography.h4,
fontWeight: "900",
color: colors.textPrimary,
},
orderEmail: {
...typography.caption,
color: colors.textSecondary,
marginTop: 2,
},
statusPill: {
flexDirection: "row",
alignItems: "center",
gap: 6,
paddingHorizontal: 10,
paddingVertical: 6,
borderRadius: 999,
},
statusPillText: {
...typography.caption,
fontWeight: "900",
},

cardMidRow: {
flexDirection: "row",
flexWrap: "wrap",
gap: spacing.sm,
marginTop: spacing.md,
},
infoChip: {
flexDirection: "row",
alignItems: "center",
gap: 6,
backgroundColor: colors.surfaceVariant,
borderRadius: 999,
paddingHorizontal: 10,
paddingVertical: 6,
},
infoChipText: {
...typography.caption,
color: colors.textSecondary,
fontWeight: "800",
},

progressTrack: {
height: 10,
borderRadius: 999,
backgroundColor: colors.borderLight,
overflow: "hidden",
marginTop: spacing.md,
},
progressFill: {
height: "100%",
backgroundColor: colors.primary,
},

cardActions: {
flexDirection: "row",
flexWrap: "wrap",
gap: spacing.sm,
marginTop: spacing.md,
},
secondaryCta: {
flex: 1,
minWidth: 110,
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
gap: 8,
backgroundColor: colors.surface,
borderWidth: 1,
borderRadius: borderRadius.lg,
paddingVertical: spacing.sm,
},
secondaryCtaText: {
...typography.caption,
fontWeight: "900",
color: colors.textSecondary,
},
dangerCta: {
flex: 1,
minWidth: 110,
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
gap: 8,
borderRadius: borderRadius.lg,
paddingVertical: spacing.sm,
},
dangerCtaText: {
...typography.caption,
fontWeight: "900",
color: colors.textOnPrimary,
},
goodCta: {
flex: 1,
minWidth: 110,
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
gap: 8,
borderRadius: borderRadius.lg,
paddingVertical: spacing.sm,
},
goodCtaText: {
...typography.caption,
fontWeight: "900",
color: colors.textOnPrimary,
},

loading: {
flex: 1,
alignItems: "center",
justifyContent: "center",
padding: spacing.xl,
},
loadingText: {
marginTop: spacing.md,
...typography.caption,
color: colors.textSecondary,
},

versionMarker: {
textAlign: "center",
color: colors.textMuted,
fontSize: 11,
paddingVertical: spacing.sm,
},

runNowBanner: {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm,
  backgroundColor: colors.surface,
  borderBottomWidth: 1,
  borderBottomColor: colors.borderLight,
},
runNowBannerText: {
  flex: 1,
  ...typography.caption,
  color: colors.textSecondary,
  fontWeight: "800",
},

blockingOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.25)",
  alignItems: "center",
  justifyContent: "center",
  padding: spacing.xl,
},
blockingOverlayCard: {
  width: "100%",
  maxWidth: 420,
  backgroundColor: colors.surface,
  borderRadius: borderRadius.xl,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.xl,
  alignItems: "center",
  ...shadows.md,
},
blockingOverlayTitle: {
  marginTop: spacing.md,
  ...typography.h4,
  fontWeight: "900",
  color: colors.textPrimary,
  textAlign: "center",
},
blockingOverlaySubtitle: {
  marginTop: spacing.sm,
  ...typography.caption,
  color: colors.textSecondary,
  textAlign: "center",
},
});