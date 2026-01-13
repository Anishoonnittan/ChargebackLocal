import React, { useState } from "react";
import {
View,
Text,
StyleSheet,
ScrollView,
TouchableOpacity,
TextInput,
Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";

/**
* ScamVigil - Branding Screen
* User-facing customization for app name, colors, and logo
*/

interface BrandingScreenProps {
onBack: () => void;
}

export default function BrandingScreen({ onBack }: BrandingScreenProps) {
const [brandName, setBrandName] = useState("ScamVigil");
const [primaryColor, setPrimaryColor] = useState("#0D9488");
const [supportEmail, setSupportEmail] = useState("support@scamvigil.com.au");
const [logoUrl, setLogoUrl] = useState("");

const handleSave = () => {
Alert.alert(
"Settings Saved",
"Your branding has been updated!",
[{ text: "Great!", style: "default" }]
);
};

return (
<SafeAreaView style={styles.container} edges={["top"]}>
{/* Header */}
<View style={styles.header}>
<TouchableOpacity style={styles.backButton} onPress={onBack}>
<Ionicons name="arrow-back" size={24} color={theme.colors.text} />
</TouchableOpacity>
<View style={styles.headerContent}>
<View style={styles.headerIcon}>
<Ionicons name="color-palette" size={28} color="#fff" />
</View>
<View>
<Text style={styles.title}>Branding</Text>
<Text style={styles.subtitle}>Customize your app appearance</Text>
</View>
</View>
</View>

<ScrollView contentContainerStyle={styles.content}>
<Text style={styles.sectionTitle}>🎨 Customize Your App</Text>
<Text style={styles.sectionSubtitle}>
Personalize ScamVigil with your own branding
</Text>

{/* Brand Name */}
<View style={styles.inputGroup}>
<Text style={styles.inputLabel}>App Name</Text>
<TextInput
style={styles.input}
placeholder="Your App Name"
value={brandName}
onChangeText={setBrandName}
/>
<Text style={styles.inputHint}>
This name will appear throughout the app
</Text>
</View>

{/* Primary Color */}
<View style={styles.inputGroup}>
<Text style={styles.inputLabel}>Primary Color</Text>
<View style={styles.colorInputRow}>
<View style={[styles.colorPreview, { backgroundColor: primaryColor }]} />
<TextInput
style={[styles.input, { flex: 1 }]}
placeholder="#0D9488"
value={primaryColor}
onChangeText={setPrimaryColor}
autoCapitalize="none"
/>
</View>
<Text style={styles.inputHint}>
Choose a hex color for buttons and accents
</Text>
</View>

{/* Support Email */}
<View style={styles.inputGroup}>
<Text style={styles.inputLabel}>Support Email</Text>
<TextInput
style={styles.input}
placeholder="support@yourbrand.com"
value={supportEmail}
onChangeText={setSupportEmail}
keyboardType="email-address"
autoCapitalize="none"
/>
<Text style={styles.inputHint}>
Users will see this email for support inquiries
</Text>
</View>

{/* Logo URL */}
<View style={styles.inputGroup}>
<Text style={styles.inputLabel}>Logo URL (Optional)</Text>
<TextInput
style={styles.input}
placeholder="https://yourbrand.com/logo.png"
value={logoUrl}
onChangeText={setLogoUrl}
autoCapitalize="none"
/>
<Text style={styles.inputHint}>
Recommended size: 200x50px, PNG or SVG
</Text>
</View>

{/* Save Button */}
<TouchableOpacity style={styles.saveButton} onPress={handleSave}>
<Text style={styles.saveButtonText}>Save Changes</Text>
</TouchableOpacity>

{/* Preview Card */}
<Text style={styles.sectionTitle}>👁️ Preview</Text>
<View style={[styles.previewCard, { borderColor: primaryColor }]}>
<View style={[styles.previewHeader, { backgroundColor: primaryColor }]}>
<Text style={styles.previewBrand}>{brandName || "Your Brand"}</Text>
</View>
<View style={styles.previewBody}>
<Text style={styles.previewText}>
This is how your branded app will appear.
</Text>
<View style={[styles.previewButton, { backgroundColor: primaryColor }]}>
<Text style={styles.previewButtonText}>Scan Profile</Text>
</View>
</View>
</View>

{/* Info Card */}
<View style={styles.infoCard}>
<Ionicons name="information-circle" size={24} color={theme.colors.primary} />
<Text style={styles.infoText}>
Changes will be reflected immediately in your app. You can update these settings anytime.
</Text>
</View>
</ScrollView>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: theme.colors.background,
},
content: {
padding: theme.spacing.lg,
paddingBottom: 100,
},
header: {
flexDirection: "row",
alignItems: "center",
paddingHorizontal: theme.spacing.lg,
paddingVertical: theme.spacing.md,
backgroundColor: "#fff",
borderBottomWidth: 1,
borderBottomColor: theme.colors.border,
},
backButton: {
width: 40,
height: 40,
borderRadius: 20,
backgroundColor: theme.colors.background,
alignItems: "center",
justifyContent: "center",
marginRight: theme.spacing.md,
},
headerContent: {
flexDirection: "row",
alignItems: "center",
flex: 1,
},
headerIcon: {
width: 48,
height: 48,
borderRadius: 12,
backgroundColor: theme.colors.success,
alignItems: "center",
justifyContent: "center",
marginRight: theme.spacing.md,
},
title: {
fontSize: theme.typography.sizes.xl,
fontWeight: "700",
color: theme.colors.text,
},
subtitle: {
fontSize: theme.typography.sizes.sm,
color: theme.colors.textSecondary,
marginTop: 2,
},
sectionTitle: {
fontSize: theme.typography.sizes.lg,
fontWeight: "700",
color: theme.colors.text,
marginBottom: theme.spacing.xs,
},
sectionSubtitle: {
fontSize: theme.typography.sizes.sm,
color: theme.colors.textSecondary,
marginBottom: theme.spacing.xl,
},
inputGroup: {
marginBottom: theme.spacing.xl,
},
inputLabel: {
fontSize: theme.typography.sizes.sm,
fontWeight: "600",
color: theme.colors.text,
marginBottom: theme.spacing.xs,
},
input: {
backgroundColor: "#fff",
borderWidth: 1,
borderColor: theme.colors.border,
borderRadius: theme.borderRadius.md,
padding: theme.spacing.md,
fontSize: theme.typography.sizes.base,
color: theme.colors.text,
},
inputHint: {
fontSize: theme.typography.sizes.xs,
color: theme.colors.textSecondary,
marginTop: theme.spacing.xs,
},
colorInputRow: {
flexDirection: "row",
alignItems: "center",
gap: theme.spacing.md,
},
colorPreview: {
width: 48,
height: 48,
borderRadius: theme.borderRadius.md,
borderWidth: 1,
borderColor: theme.colors.border,
},
saveButton: {
backgroundColor: theme.colors.primary,
paddingVertical: theme.spacing.md,
borderRadius: theme.borderRadius.lg,
alignItems: "center",
marginBottom: theme.spacing.xxl,
},
saveButtonText: {
color: "#fff",
fontSize: theme.typography.sizes.base,
fontWeight: "700",
},
previewCard: {
borderRadius: theme.borderRadius.lg,
overflow: "hidden",
borderWidth: 2,
marginBottom: theme.spacing.xl,
},
previewHeader: {
padding: theme.spacing.md,
alignItems: "center",
},
previewBrand: {
color: "#fff",
fontSize: theme.typography.sizes.base,
fontWeight: "700",
},
previewBody: {
backgroundColor: "#fff",
padding: theme.spacing.lg,
alignItems: "center",
},
previewText: {
fontSize: theme.typography.sizes.sm,
color: theme.colors.textSecondary,
textAlign: "center",
marginBottom: theme.spacing.md,
},
previewButton: {
paddingVertical: theme.spacing.sm,
paddingHorizontal: theme.spacing.xl,
borderRadius: theme.borderRadius.md,
},
previewButtonText: {
color: "#fff",
fontWeight: "600",
},
infoCard: {
flexDirection: "row",
backgroundColor: `${theme.colors.primary}10`,
borderRadius: theme.borderRadius.lg,
padding: theme.spacing.lg,
gap: theme.spacing.md,
borderWidth: 1,
borderColor: `${theme.colors.primary}30`,
},
infoText: {
flex: 1,
fontSize: theme.typography.sizes.sm,
color: theme.colors.text,
lineHeight: 20,
},
});
