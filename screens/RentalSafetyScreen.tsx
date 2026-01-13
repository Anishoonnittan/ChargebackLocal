import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { theme, spacing, borderRadius, typography, shadows } from "../lib/theme";

interface RentalSafetyScreenProps {
  onBack: () => void;
}

export default function RentalSafetyScreen({ onBack }: RentalSafetyScreenProps) {
  const [scanType, setScanType] = useState<'landlord' | 'property'>('landlord');
  const [landlordName, setLandlordName] = useState('');
  const [landlordEmail, setLandlordEmail] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyLink, setPropertyLink] = useState('');
  const [propertyPrice, setPropertyPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (scanType === 'landlord') {
      if (!landlordName && !landlordEmail && !landlordPhone) {
        Alert.alert('Missing Information', 'Please provide at least one piece of landlord information');
        return;
      }
    } else {
      if (!propertyAddress && !propertyLink) {
        Alert.alert('Missing Information', 'Please provide property address or listing link');
        return;
      }
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock risk assessment
      const riskScore = Math.floor(Math.random() * 100);
      const riskLevel = riskScore > 70 ? 'HIGH RISK' : riskScore > 40 ? 'MEDIUM RISK' : 'LOW RISK';
      const riskColor = riskScore > 70 ? theme.colors.error : riskScore > 40 ? '#FF9500' : theme.colors.success;
      
      const redFlags = [];
      if (riskScore > 70) {
        redFlags.push('🚨 Landlord profile created less than 7 days ago');
        redFlags.push('🚨 Property photos found on multiple listings');
        redFlags.push('🚨 Request for deposit via untraceable method');
      } else if (riskScore > 40) {
        redFlags.push('⚠️ Limited rental history available');
        redFlags.push('⚠️ Property price below market average');
      } else {
        redFlags.push('✅ Verified landlord with 5+ years history');
        redFlags.push('✅ Property photos match address');
        redFlags.push('✅ Standard lease agreement');
      }

      Alert.alert(
        `${riskLevel}`,
        `Risk Score: ${riskScore}/100\n\n${redFlags.join('\n')}\n\n${
          riskScore > 70 
            ? 'RECOMMENDATION: Do not proceed. High likelihood of rental scam.'
            : riskScore > 40
            ? 'RECOMMENDATION: Request video tour and verify landlord identity before paying deposit.'
            : 'RECOMMENDATION: Appears legitimate. Still verify identity before payment.'
        }`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to scan. Please try again.');
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
        <Text style={styles.headerTitle}>Rental Safety</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="home-search" size={64} color={theme.colors.primary} />
          <Text style={styles.title}>Rental Safety Scanner</Text>
          <Text style={styles.subtitle}>
            Verify landlords & properties before paying deposit
          </Text>
        </View>

        {/* Scan Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, scanType === 'landlord' && styles.typeButtonActive]}
            onPress={() => setScanType('landlord')}
          >
            <MaterialCommunityIcons 
              name="account-search" 
              size={24} 
              color={scanType === 'landlord' ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <Text style={[
              styles.typeButtonText,
              scanType === 'landlord' && styles.typeButtonTextActive
            ]}>
              Verify Landlord
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, scanType === 'property' && styles.typeButtonActive]}
            onPress={() => setScanType('property')}
          >
            <MaterialCommunityIcons 
              name="home-search" 
              size={24} 
              color={scanType === 'property' ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <Text style={[
              styles.typeButtonText,
              scanType === 'property' && styles.typeButtonTextActive
            ]}>
              Check Property
            </Text>
          </TouchableOpacity>
        </View>

        {/* Landlord Verification Form */}
        {scanType === 'landlord' && (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Landlord Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Landlord Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., John Smith"
                placeholderTextColor={theme.colors.textSecondary}
                value={landlordName}
                onChangeText={setLandlordName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="landlord@email.com"
                placeholderTextColor={theme.colors.textSecondary}
                value={landlordEmail}
                onChangeText={setLandlordEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+61 4XX XXX XXX"
                placeholderTextColor={theme.colors.textSecondary}
                value={landlordPhone}
                onChangeText={setLandlordPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        )}

        {/* Property Verification Form */}
        {scanType === 'property' && (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Property Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Property Address</Text>
              <TextInput
                style={styles.input}
                placeholder="123 Main St, Sydney NSW 2000"
                placeholderTextColor={theme.colors.textSecondary}
                value={propertyAddress}
                onChangeText={setPropertyAddress}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Listing Link (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://domain.com.au/..."
                placeholderTextColor={theme.colors.textSecondary}
                value={propertyLink}
                onChangeText={setPropertyLink}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Advertised Price (per week)</Text>
              <TextInput
                style={styles.input}
                placeholder="$500"
                placeholderTextColor={theme.colors.textSecondary}
                value={propertyPrice}
                onChangeText={setPropertyPrice}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {/* Common Red Flags */}
        <View style={styles.redFlagsCard}>
          <Text style={styles.redFlagsTitle}>🚨 Common Rental Scam Red Flags</Text>
          <View style={styles.redFlag}>
            <Text style={styles.redFlagText}>• Price significantly below market rate</Text>
          </View>
          <View style={styles.redFlag}>
            <Text style={styles.redFlagText}>• Landlord refuses video tour or in-person viewing</Text>
          </View>
          <View style={styles.redFlag}>
            <Text style={styles.redFlagText}>• Request for deposit via wire transfer or gift cards</Text>
          </View>
          <View style={styles.redFlag}>
            <Text style={styles.redFlagText}>• Landlord claims to be overseas and unavailable</Text>
          </View>
          <View style={styles.redFlag}>
            <Text style={styles.redFlagText}>• Photos stolen from other listings (reverse image search)</Text>
          </View>
          <View style={styles.redFlag}>
            <Text style={styles.redFlagText}>• Urgent pressure to pay deposit immediately</Text>
          </View>
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={[styles.scanButton, loading && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={loading}
        >
          <MaterialCommunityIcons name="shield-search" size={24} color="#FFF" />
          <Text style={styles.scanButtonText}>
            {loading ? 'Scanning...' : `Scan ${scanType === 'landlord' ? 'Landlord' : 'Property'}`}
          </Text>
        </TouchableOpacity>

        {/* Safety Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Safety Tips</Text>
          <Text style={styles.tipText}>✓ Always view property in person before paying</Text>
          <Text style={styles.tipText}>✓ Verify landlord identity with government ID</Text>
          <Text style={styles.tipText}>✓ Use secure payment methods (never gift cards)</Text>
          <Text style={styles.tipText}>✓ Get written lease agreement before deposit</Text>
          <Text style={styles.tipText}>✓ Check property ownership on public records</Text>
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
  typeSelector: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  typeButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  typeButtonTextActive: {
    color: theme.colors.primary,
  },
  form: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
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
  redFlag: {
    marginVertical: 4,
  },
  redFlagText: {
    fontSize: 14,
    color: theme.colors.text,
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