import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import PreAuthScanScreen from './PreAuthScanScreen';
import BulkScanScreen from './BulkScanScreen';

export default function PreAuthDashboardScreen({
  // ... existing props ...
}: PreAuthDashboardScreenProps) {
  // ... existing state ...
  const [showManualScan, setShowManualScan] = useState(false);
  const [showBulkScan, setShowBulkScan] = useState(false);

  // ... existing functions ...

  // Handle bulk scan completion
  const handleBulkScansCompleted = (orders: any[]) => {
    // Orders are added to pending review automatically
    setShowBulkScan(false);
    // Refresh the dashboard
  };

  if (showManualScan) {
    return (
      <PreAuthScanScreen
        onBack={() => setShowManualScan(false)}
      />
    );
  }

  if (showBulkScan) {
    return (
      <BulkScanScreen
        onBack={() => setShowBulkScan(false)}
        onOrdersScanned={handleBulkScansCompleted}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>Pre-Auth scans + 120-day monitoring</Text>
          <Text style={styles.title}>ChargebackShield</Text>
        </View>
        <TouchableOpacity style={styles.profileIcon}>
          <MaterialIcons name="account-circle" size={32} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsHeader}>
        <TouchableOpacity
          style={styles.actionPill}
          onPress={() => setShowManualScan(true)}
        >
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.actionPillText}>Manual Scan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionPill, styles.bulkScanPill]}
          onPress={() => setShowBulkScan(true)}
        >
          <MaterialIcons name="upload" size={20} color={theme.colors.primary} />
          <Text style={styles.bulkScanPillText}>Bulk Scan</Text>
        </TouchableOpacity>
      </View>

      {/* ... rest of existing component ... */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  profileIcon: {
    padding: 10,
  },
  tabsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  actionPillText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  bulkScanPill: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  bulkScanPillText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});