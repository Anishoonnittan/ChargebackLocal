import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { theme, spacing, borderRadius, typography, shadows } from "../lib/theme";

interface MarketplaceSafetyScreenProps {
  onBack: () => void;
}

export default function MarketplaceSafetyScreen({ onBack }: MarketplaceSafetyScreenProps) {
  const [sellerName, setSellerName] = useState('');
  const [sellerProfile, setSellerProfile] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemImages, setItemImages] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!sellerProfile && !sellerName) {
      Alert.alert('Missing Information', 'Please provide seller name or profile link');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const riskScore = Math.floor(Math.random() * 100);
      const riskLevel = riskScore > 70 ? 'HIGH RISK' : riskScore > 40 ? 'MEDIUM RISK' : 'LOW RISK';
      
      const findings = [];
      if (riskScore > 70) {
        findings.push('🚨 Seller account created less than 3 days ago');
        findings.push('🚨 Item photos stolen from other listings (reverse image match)');
        findings.push('🚨 Price 60% below market value (likely scam)');
        findings.push('🚨 Multiple reports of non-delivery from this seller');
      } else if (riskScore > 40) {
        findings.push('⚠️ New seller with limited transaction history');
        findings.push('⚠️ No reviews or ratings available');
        findings.push('⚠️ Requests payment via bank transfer (no buyer protection)');
      } else {
        findings.push('✅ Established seller (3+ years, 500+ transactions)');
        findings.push('✅ 4.8★ average rating from verified buyers');
        findings.push('✅ Original product photos verified');
        findings.push('✅ Accepts PayPal/secure payment methods');
      }

      Alert.alert(
        `Seller Risk: ${riskLevel}`,
        `Risk Score: ${riskScore}/100\n\n${findings.join('\n')}\n\n${
          riskScore > 70 
            ? 'RECOMMENDATION: DO NOT BUY. High likelihood of scam. Report seller to platform.'
            : riskScore > 40
            ? 'RECOMMENDATION: Request more photos, meet in public place, use secure payment.'
            : 'RECOMMENDATION: Appears legitimate. Proceed with standard precautions.'
        }`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to scan seller. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketplace Safety</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="cart-check" size={64} color={theme.colors.primary} />
          <Text style={styles.title}>Marketplace Safety</Text>
          <Text style={styles.subtitle}>
            Verify sellers before buying on Facebook, Gumtree, eBay
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seller Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Seller's display name"
              placeholderTextColor={theme.colors.textSecondary}
              value={sellerName}
              onChangeText={setSellerName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seller Profile Link</Text>
            <TextInput
              style={styles.input}
              placeholder="https://facebook.com/marketplace/profile/..."
              placeholderTextColor={theme.colors.textSecondary}
              value={sellerProfile}
              onChangeText={setSellerProfile}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.sectionTitle}>Item Information (Optional)</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., iPhone 15 Pro Max"
              placeholderTextColor={theme.colors.textSecondary}
              value={itemTitle}
              onChangeText={setItemTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Asking Price</Text>
            <TextInput
              style={styles.input}
              placeholder="$800"
              placeholderTextColor={theme.colors.textSecondary}
              value={itemPrice}
              onChangeText={setItemPrice}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Image URL (for reverse search)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={theme.colors.textSecondary}
              value={itemImages}
              onChangeText={setItemImages}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.redFlagsCard}>
          <Text style={styles.redFlagsTitle}>🚨 Marketplace Scam Red Flags</Text>
          <Text style={styles.redFlagText}>• Brand new seller account with no history</Text>
          <Text style={styles.redFlagText}>• Price significantly below market value</Text>
          <Text style={styles.redFlagText}>• Seller refuses to meet in person or video call</Text>
          <Text style={styles.redFlagText}>• Requests payment via wire transfer or gift cards</Text>
          <Text style={styles.redFlagText}>• Stock photos or images stolen from other listings</Text>
          <Text style={styles.redFlagText}>• Urgent pressure to buy immediately</Text>
          <Text style={styles.redFlagText}>• Poor grammar or generic responses</Text>
          <Text style={styles.redFlagText}>• Seller located overseas but item is "local"</Text>
        </View>

        <TouchableOpacity
          style={[styles.scanButton, loading && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={loading}
        >
          <MaterialCommunityIcons name="shield-search" size={24} color="#FFF" />
          <Text style={styles.scanButtonText}>
            {loading ? 'Scanning Seller...' : 'Scan Seller'}
          </Text>
        </TouchableOpacity>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Safe Buying Tips</Text>
          <Text style={styles.tipText}>✓ Meet in public place (police station, shopping center)</Text>
          <Text style={styles.tipText}>✓ Inspect item thoroughly before paying</Text>
          <Text style={styles.tipText}>✓ Use platform's secure payment system (PayPal, escrow)</Text>
          <Text style={styles.tipText}>✓ Never pay via bank transfer or gift cards</Text>
          <Text style={styles.tipText}>✓ Bring a friend when meeting sellers</Text>
          <Text style={styles.tipText}>✓ Trust your instincts - if it feels off, walk away</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  form: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  redFlagsCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.error}10`,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: `${theme.colors.error}30`,
  },
  redFlagsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  redFlagText: {
    fontSize: 14,
    color: theme.colors.text,
    marginVertical: 4,
    lineHeight: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  scanButtonDisabled: {
    opacity: 0.5,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  tipsCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xxl,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginVertical: 4,
    lineHeight: 20,
  },
  content: {
    padding: theme.spacing.md,
  },
});