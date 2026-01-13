import React, { useMemo, useState } from "react";
import {
ActivityIndicator,
Alert,
KeyboardAvoidingView,
Platform,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { borderRadius, colors, spacing, typography } from "../../lib/theme";

export default function ChangePasswordScreen({
sessionToken,
onBack,
}: {
sessionToken: string;
onBack: () => void;
}) {
const changePassword = useAction(api.auth.changePassword);

const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [isSaving, setIsSaving] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);

const canSubmit = useMemo(() => {
if (isSaving) return false;
if (!currentPassword || !newPassword || !confirmPassword) return false;
if (newPassword.length < 8) return false;
if (newPassword !== confirmPassword) return false;
return true;
}, [confirmPassword, currentPassword, isSaving, newPassword]);

const submit = async () => {
setError(null);
setSuccess(null);

if (!currentPassword || !newPassword || !confirmPassword) {
setError("Please fill in all fields.");
return;
}

if (newPassword.length < 8) {
setError("New password must be at least 8 characters.");
return;
}

if (newPassword !== confirmPassword) {
setError("New password and confirmation do not match.");
return;
}

setIsSaving(true);
try {
await changePassword({ sessionToken, currentPassword, newPassword });
setSuccess("Password updated successfully.");
setCurrentPassword("");
setNewPassword("");
setConfirmPassword("");
Alert.alert("Password Updated", "Your password has been changed.");
} catch (e: any) {
setError(e?.message ?? "Failed to change password.");
} finally {
setIsSaving(false);
}
};

return (
<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
<View style={styles.header}>
<TouchableOpacity onPress={onBack} style={styles.backButton}>
<Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
<Text style={styles.backText}>Settings</Text>
</TouchableOpacity>
<Text style={styles.title}>Change Password</Text>
<View style={{ width: 70 }} />
</View>

<KeyboardAvoidingView
style={{ flex: 1 }}
behavior={Platform.OS === "ios" ? "padding" : undefined}
>
<ScrollView
contentContainerStyle={styles.content}
keyboardShouldPersistTaps="handled"
>
<View style={styles.card}>
<Text style={styles.cardTitle}>Security</Text>
<Text style={styles.cardSubtitle}>
Choose a strong password you don't use anywhere else.
</Text>

<View style={styles.field}>
<Text style={styles.label}>Current Password</Text>
<TextInput
value={currentPassword}
onChangeText={setCurrentPassword}
placeholder="••••••••"
placeholderTextColor={colors.textMuted}
secureTextEntry
autoCapitalize="none"
style={styles.input}
/>
</View>

<View style={styles.field}>
<Text style={styles.label}>New Password</Text>
<TextInput
value={newPassword}
onChangeText={setNewPassword}
placeholder="At least 8 characters"
placeholderTextColor={colors.textMuted}
secureTextEntry
autoCapitalize="none"
style={styles.input}
/>
</View>

<View style={styles.field}>
<Text style={styles.label}>Confirm New Password</Text>
<TextInput
value={confirmPassword}
onChangeText={setConfirmPassword}
placeholder="Re-enter new password"
placeholderTextColor={colors.textMuted}
secureTextEntry
autoCapitalize="none"
style={styles.input}
/>
</View>

{error ? (
<View style={styles.messageError}>
<Ionicons name="alert-circle" size={18} color={colors.error} />
<Text style={styles.messageErrorText}>{error}</Text>
</View>
) : null}

{success ? (
<View style={styles.messageSuccess}>
<Ionicons name="checkmark-circle" size={18} color="#10B981" />
<Text style={styles.messageSuccessText}>{success}</Text>
</View>
) : null}

<TouchableOpacity
onPress={submit}
disabled={!canSubmit}
style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
>
{isSaving ? (
<ActivityIndicator color="#FFFFFF" />
) : (
<Text style={styles.primaryButtonText}>Update Password</Text>
)}
</TouchableOpacity>
</View>

<Text style={styles.finePrint}>
Tip: If you forgot your current password, use the “Forgot password?” link on the sign-in screen.
</Text>
</ScrollView>
</KeyboardAvoidingView>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: colors.background,
},
header: {
paddingHorizontal: spacing.lg,
paddingTop: spacing.sm,
paddingBottom: spacing.sm,
flexDirection: "row",
alignItems: "center",
justifyContent: "space-between",
borderBottomWidth: 1,
borderBottomColor: colors.outline,
backgroundColor: colors.background,
},
backButton: {
flexDirection: "row",
alignItems: "center",
gap: spacing.xs,
paddingVertical: spacing.xs,
paddingRight: spacing.sm,
},
backText: {
...typography.body,
color: colors.textSecondary,
fontWeight: "600",
},
title: {
...typography.h4,
color: colors.textPrimary,
},
content: {
padding: spacing.lg,
paddingBottom: spacing.xl,
},
card: {
backgroundColor: colors.surface,
borderWidth: 1,
borderColor: colors.outline,
borderRadius: borderRadius.lg,
padding: spacing.lg,
},
cardTitle: {
...typography.h3,
color: colors.textPrimary,
marginBottom: spacing.xs,
},
cardSubtitle: {
...typography.body,
color: colors.textSecondary,
marginBottom: spacing.lg,
},
field: {
marginBottom: spacing.md,
},
label: {
...typography.caption,
color: colors.textSecondary,
fontWeight: "700",
marginBottom: spacing.xs,
},
input: {
borderWidth: 1,
borderColor: colors.borderLight,
backgroundColor: colors.surfaceVariant,
borderRadius: borderRadius.md,
paddingHorizontal: spacing.md,
paddingVertical: spacing.md,
color: colors.textPrimary,
},
messageError: {
flexDirection: "row",
alignItems: "center",
gap: spacing.xs,
backgroundColor: `${colors.error}15`,
borderRadius: borderRadius.md,
paddingHorizontal: spacing.md,
paddingVertical: spacing.sm,
marginBottom: spacing.md,
},
messageErrorText: {
...typography.caption,
color: colors.error,
flex: 1,
},
messageSuccess: {
flexDirection: "row",
alignItems: "center",
gap: spacing.xs,
backgroundColor: "#10B98115",
borderRadius: borderRadius.md,
paddingHorizontal: spacing.md,
paddingVertical: spacing.sm,
marginBottom: spacing.md,
},
messageSuccessText: {
...typography.caption,
color: "#10B981",
flex: 1,
},
primaryButton: {
backgroundColor: colors.primary,
borderRadius: borderRadius.md,
paddingVertical: spacing.md,
alignItems: "center",
},
primaryButtonDisabled: {
opacity: 0.5,
},
primaryButtonText: {
...typography.body,
color: "#FFFFFF",
fontWeight: "800",
},
finePrint: {
...typography.caption,
color: colors.textMuted,
marginTop: spacing.md,
textAlign: "center",
},
});
