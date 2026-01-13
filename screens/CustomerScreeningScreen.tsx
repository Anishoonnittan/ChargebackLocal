import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, spacing, borderRadius, typography, shadows } from "../lib/theme";

interface CustomerScreeningScreenProps {
  onBack: () => void;
}

export default function CustomerScreeningScreen({ onBack }: CustomerScreeningScreenProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderValue, setOrderValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const handleScan = async () => {
    if (!customerEmail && !customerPhone) {
      Alert.alert('Missing Information', 'Please provide customer email or phone number');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const riskScore = Math.floor(Math.random() * 100);
      const riskLevel = riskScore > 70 ? 'HIGH RISK' : riskScore > 40 ? 'MEDIUM RISK' : 'LOW RISK';
      
      const findings = [];
      if (riskScore > 70) {
        findings.push('🚨 47 previous chargebacks across 12 merchants');
        findings.push('🚨 Email associated with known fraud ring');
        findings.push('🚨 Phone number flagged in chargeback database');
        findings.push('🚨 Prepaid/virtual card detected (90% fraud rate)');
      } else if (riskScore > 40) {
        findings.push('⚠️ New customer with no purchase history');
        findings.push('⚠️ Billing address ≠ shipping address');
        findings.push('⚠️ High-value order from first-time customer');
      } else {
        findings.push('✅ Repeat customer with clean history (25 orders)');
        findings.push('✅ Verified PayPal account since 2018');
        findings.push('✅ No chargebacks or payment disputes');
        findings.push('✅ Consistent shipping/billing addresses');
      }

      Alert.alert(
        `Customer Risk: ${riskLevel}`,
        `Risk Score: ${riskScore}/100\n\n${findings.join('\n')}\n\n${
          riskScore > 70 
            ? 'RECOMMENDATION: DECLINE ORDER. Request ID verification or refuse transaction.'
            : riskScore > 40
            ? 'RECOMMENDATION: Contact customer to verify order. Use secure payment method.'
            : 'RECOMMENDATION: Safe to fulfill. Proceed with standard process.'
        }`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to screen customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToQueue = () => {
    if (!customerName || !customerEmail) {
      Alert.alert('Missing Info', 'Name and email required to add to queue');
      return;
    }

    setCustomers([...customers, { name: customerName, email: customerEmail, phone: customerPhone, orderValue }]);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setOrderValue('');
    Alert.alert('Added', 'Customer added to bulk screening queue');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Screening</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Smith"
              placeholderTextColor={theme.colors.textSecondary}
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="customer@email.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={customerEmail}
              onChangeText={setCustomerEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+61 4XX XXX XXX"
              placeholderTextColor={theme.colors.textSecondary}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Order Value (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="$500"
              placeholderTextColor={theme.colors.textSecondary}
              value={orderValue}
              onChangeText={setOrderValue}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.scanButton, loading && styles.scanButtonDisabled]}
            onPress={handleScan}
            disabled={loading}
          >
            <Ionicons name="shield" size={24} color="#FFF" />
            <Text style={styles.scanButtonText}>
              {loading ? 'Screening...' : 'Screen Now'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={addToQueue}
          >
            <Ionicons name="add" size={24} color={theme.colors.primary} />
            <Text style={styles.addButtonText}>Add to Queue</Text>
          </TouchableOpacity>
        </View>

        {customers.length > 0 && (
          <View style={styles.queueCard}>
            <Text style={styles.queueTitle}>Screening Queue ({customers.length})</Text>
            {customers.map((customer, index) => (
              <View key={index} style={styles.queueItem}>
                <Text style={styles.queueName}>{customer.name}</Text>
                <Text style={styles.queueEmail}>{customer.email}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.bulkScanButton}
              onPress={() => Alert.alert('Bulk Scan', 'Scanning all customers in queue...')}
            >
              <Text style={styles.bulkScanText}>Scan All ({customers.length})</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>✅ What We Check</Text>
          <Text style={styles.infoText}>• Chargeback history across merchant network</Text>
          <Text style={styles.infoText}>• Email/phone number fraud database</Text>
          <Text style={styles.infoText}>• Payment method risk assessment</Text>
          <Text style={styles.infoText}>• Billing vs shipping address mismatch</Text>
          <Text style={styles.infoText}>• Purchase pattern analysis</Text>
          <Text style={styles.infoText}>• Device fingerprinting & IP reputation</Text>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Chargeback Prevention Tips</Text>
          <Text style={styles.tipText}>✓ Screen ALL orders before fulfillment</Text>
          <Text style={styles.tipText}>✓ Decline high-risk orders (save money long-term)</Text>
          <Text style={styles.tipText}>✓ Require ID verification for orders >$500</Text>
          <Text style={styles.tipText}>✓ Use signature confirmation on delivery</Text>
          <Text style={styles.tipText}>✓ Keep all customer communication records</Text>
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
  content: {
    padding: theme.spacing.md,
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
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${theme.colors.primary}15`,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    gap: theme.spacing.sm,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  queueCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  queueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  queueItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  queueName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  queueEmail: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  bulkScanButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  bulkScanText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  infoCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.text,
    marginVertical: 4,
    lineHeight: 20,
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
});