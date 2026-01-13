import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface ConfigurationScreenProps {
  sessionToken: string;
  onBack: () => void;
  onConnectStore?: () => void;
  initialSection?: "rules" | "monitoring";
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatTimeFromMinutes(minutesFromMidnight: number) {
  const clamped = Math.max(0, Math.min(1439, Math.floor(minutesFromMidnight)));
  const h24 = Math.floor(clamped / 60);
  const m = clamped % 60;

  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;

  return `${h12}:${pad2(m)} ${ampm}`;
}

const TIME_PRESETS: Array<{ label: string; minutes: number }> = [
  { label: "2:00 AM", minutes: 2 * 60 },
  { label: "6:00 AM", minutes: 6 * 60 },
  { label: "9:00 AM", minutes: 9 * 60 },
  { label: "12:00 PM", minutes: 12 * 60 },
  { label: "3:00 PM", minutes: 15 * 60 },
  { label: "6:00 PM", minutes: 18 * 60 },
  { label: "9:00 PM", minutes: 21 * 60 },
];

export default function ConfigurationScreen({
  sessionToken,
  onBack,
  onConnectStore,
  initialSection,
}: ConfigurationScreenProps) {
  const preAuthConfig = useQuery(api.preAuthCheck.getPreAuthConfig, { sessionToken });
  const updatePreAuthConfig = useMutation(api.preAuthCheck.updatePreAuthConfig);

  // Store connection status (mock - would come from Convex)
  const [isStoreConnected, setIsStoreConnected] = useState(false);
  const [storePlatform, setStorePlatform] = useState<string | null>(null);

  // Automatic scanning
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);

  // Auto-decision rules
  const [autoApproveLowRisk, setAutoApproveLowRisk] = useState(false);
  const [autoBlockHighRisk, setAutoBlockHighRisk] = useState(true);

  // Risk thresholds (percentages)
  const [lowRiskThreshold, setLowRiskThreshold] = useState(30);
  const [highRiskThreshold, setHighRiskThreshold] = useState(60);

  // Notifications
  const [notifyHighRisk, setNotifyHighRisk] = useState(true);
  const [notifyAutoBlock, setNotifyAutoBlock] = useState(true);
  const [notifyDailyReport, setNotifyDailyReport] = useState(false);

  // Post-auth monitoring schedule
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [postAuthCheckMinutes, setPostAuthCheckMinutes] = useState<number>(2 * 60);

  useEffect(() => {
    if (typeof preAuthConfig?.postAuthDailyCheckTimeMinutes === "number") {
      setPostAuthCheckMinutes(preAuthConfig.postAuthDailyCheckTimeMinutes);
    }
  }, [preAuthConfig?.postAuthDailyCheckTimeMinutes]);

  useEffect(() => {
    if (initialSection === "monitoring") {
      // Make it obvious to the user where the setting is.
      // We open the time picker automatically so they don't have to hunt/scroll.
      setIsTimePickerOpen(true);
    }
  }, [initialSection]);

  const postAuthTimeLabel = useMemo(
    () => formatTimeFromMinutes(postAuthCheckMinutes),
    [postAuthCheckMinutes]
  );

  const handleToggleAutoScan = (value: boolean) => {
    if (value && !isStoreConnected) {
      Alert.alert(
        'Store Not Connected',
        'Please connect your store first to enable automatic scanning.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect Store', onPress: onConnectStore },
        ]
      );
      return;
    }
    setAutoScanEnabled(value);
    // TODO: Save to Convex
  };

  const handleSaveSettings = async () => {
    // This screen currently contains some demo-only settings.
    // The one we fully persist (as requested) is the Post-Auth monitoring schedule.
    try {
      await updatePreAuthConfig({
        sessionToken,
        postAuthDailyCheckTimeMinutes: postAuthCheckMinutes,
        postAuthTimezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });

      Alert.alert(
        'Saved',
        `Post-Auth monitoring will run daily at ${postAuthTimeLabel}.\n\n(You can still run it anytime from Protect → Run.)`
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save settings');
    }
  };

  const renderPostAuthMonitoring = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Monitoring Settings</Text>
      <Text style={styles.sectionDesc}>
        Set the time your daily 120-day monitoring check runs (Protect tab orders).
      </Text>

      <View style={styles.settingCard}>
        <TouchableOpacity
          style={styles.timeRow}
          onPress={() => setIsTimePickerOpen(true)}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Daily check time</Text>
            <Text style={styles.settingDesc}>Runs once per day at your selected time</Text>
          </View>
          <View style={styles.timePill}>
            <Ionicons name="time" size={16} color="#009688" />
            <Text style={styles.timePillText}>{postAuthTimeLabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>

        <View style={styles.warningBox}>
          <Ionicons name="information-circle-outline" size={20} color="#ff9800" />
          <Text style={styles.warningText}>
            Tip: You can also run it anytime from Protect tab by tapping the Run button.
          </Text>
        </View>
      </View>

      <Modal visible={isTimePickerOpen} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setIsTimePickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose daily check time</Text>
              <TouchableOpacity onPress={() => setIsTimePickerOpen(false)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            {TIME_PRESETS.map((t) => {
              const selected = t.minutes === postAuthCheckMinutes;
              return (
                <TouchableOpacity
                  key={t.minutes}
                  style={[styles.timeOption, selected && styles.timeOptionSelected]}
                  onPress={() => {
                    setPostAuthCheckMinutes(t.minutes);
                    setIsTimePickerOpen(false);
                  }}
                >
                  <Text style={[styles.timeOptionText, selected && styles.timeOptionTextSelected]}>
                    {t.label}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );

  const renderStoreConnection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Store Connection</Text>
      
      {isStoreConnected ? (
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
            <View style={styles.connectionInfo}>
              <Text style={styles.connectionStatus}>Connected</Text>
              <Text style={styles.connectionPlatform}>
                {storePlatform || 'Shopify'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={() => {
              Alert.alert(
                'Disconnect Store',
                'Are you sure you want to disconnect your store? Automatic scanning will be disabled.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: () => {
                      setIsStoreConnected(false);
                      setAutoScanEnabled(false);
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.connectStoreButton}
          onPress={onConnectStore}
        >
          <Ionicons name="link-outline" size={20} color="#009688" />
          <Text style={styles.connectStoreButtonText}>Connect Store</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAutomaticScanning = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Automatic Scanning</Text>
      
      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Automatic Scanning</Text>
            <Text style={styles.settingDesc}>
              Automatically scan new orders when they arrive from your connected store
            </Text>
          </View>
          <Switch
            value={autoScanEnabled}
            onValueChange={handleToggleAutoScan}
            trackColor={{ false: '#ccc', true: '#009688' }}
            thumbColor="#fff"
            disabled={!isStoreConnected}
          />
        </View>
        
        {!isStoreConnected && (
          <View style={styles.warningBox}>
            <Ionicons name="information-circle-outline" size={20} color="#ff9800" />
            <Text style={styles.warningText}>
              Connect your store to enable automatic scanning
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderAutoDecisionRules = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Auto-Decision Rules</Text>
      <Text style={styles.sectionDesc}>
        Configure what happens automatically based on risk scores
      </Text>

      <View style={styles.settingCard}>
        {/* Low Risk */}
        <View style={styles.riskRuleRow}>
          <View style={styles.riskRuleHeader}>
            <View style={[styles.riskBadge, styles.riskBadgeLow]}>
              <Text style={styles.riskBadgeText}>Low Risk</Text>
            </View>
            <Text style={styles.riskRange}>0-{lowRiskThreshold}%</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto-approve orders</Text>
            <Switch
              value={autoApproveLowRisk}
              onValueChange={setAutoApproveLowRisk}
              trackColor={{ false: '#ccc', true: '#009688' }}
              thumbColor="#fff"
            />
          </View>
          <Text style={styles.riskRuleDesc}>
            {autoApproveLowRisk
              ? '✓ Low-risk orders will be auto-approved for fulfillment'
              : 'Orders will stay in Pending Review for manual approval'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Medium Risk */}
        <View style={styles.riskRuleRow}>
          <View style={styles.riskRuleHeader}>
            <View style={[styles.riskBadge, styles.riskBadgeMedium]}>
              <Text style={styles.riskBadgeText}>Medium Risk</Text>
            </View>
            <Text style={styles.riskRange}>
              {lowRiskThreshold + 1}-{highRiskThreshold}%
            </Text>
          </View>
          <Text style={styles.riskRuleDesc}>
            Always goes to Pending Review for manual approval
          </Text>
        </View>

        <View style={styles.divider} />

        {/* High Risk */}
        <View style={styles.riskRuleRow}>
          <View style={styles.riskRuleHeader}>
            <View style={[styles.riskBadge, styles.riskBadgeHigh]}>
              <Text style={styles.riskBadgeText}>High Risk</Text>
            </View>
            <Text style={styles.riskRange}>{highRiskThreshold + 1}-100%</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto-block orders</Text>
            <Switch
              value={autoBlockHighRisk}
              onValueChange={setAutoBlockHighRisk}
              trackColor={{ false: '#ccc', true: '#009688' }}
              thumbColor="#fff"
            />
          </View>
          <Text style={styles.riskRuleDesc}>
            {autoBlockHighRisk
              ? '✓ High-risk orders will be auto-blocked'
              : 'Orders will stay in Pending Review for manual decision'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      
      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>High-risk order alerts</Text>
          <Switch
            value={notifyHighRisk}
            onValueChange={setNotifyHighRisk}
            trackColor={{ false: '#ccc', true: '#009688' }}
            thumbColor="#fff"
          />
        </View>
        <Text style={styles.settingDesc}>
          Get notified when a high-risk order is detected
        </Text>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Auto-block notifications</Text>
          <Switch
            value={notifyAutoBlock}
            onValueChange={setNotifyAutoBlock}
            trackColor={{ false: '#ccc', true: '#009688' }}
            thumbColor="#fff"
          />
        </View>
        <Text style={styles.settingDesc}>
          Get notified when an order is auto-blocked
        </Text>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Daily summary report</Text>
          <Switch
            value={notifyDailyReport}
            onValueChange={setNotifyDailyReport}
            trackColor={{ false: '#ccc', true: '#009688' }}
            thumbColor="#fff"
          />
        </View>
        <Text style={styles.settingDesc}>
          Receive a daily summary of scanned orders
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle}>Configuration</Text>
          <Text style={{ fontSize: 11, color: "#4caf50", marginTop: 2, fontWeight: "700" }}>
            ✅ Monitoring Settings available
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStoreConnection()}
        {renderPostAuthMonitoring()}
        {renderAutomaticScanning()}
        {renderAutoDecisionRules()}
        {renderNotifications()}

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 20,
  },
  connectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectionInfo: {
    marginLeft: 12,
  },
  connectionStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
    marginBottom: 2,
  },
  connectionPlatform: {
    fontSize: 14,
    color: '#666',
  },
  disconnectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
    alignSelf: 'flex-start',
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f44336',
  },
  connectStoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#009688',
    borderStyle: 'dashed',
  },
  connectStoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#009688',
    marginLeft: 8,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#e65100',
    marginLeft: 8,
    flex: 1,
  },
  riskRuleRow: {
    marginBottom: 16,
  },
  riskRuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  riskBadgeLow: {
    backgroundColor: '#e8f5e9',
  },
  riskBadgeMedium: {
    backgroundColor: '#fff3e0',
  },
  riskBadgeHigh: {
    backgroundColor: '#ffebee',
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  riskRange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  riskRuleDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009688',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0f2f1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  timePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00796b',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  modalClose: {
    padding: 6,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 10,
  },
  timeOptionSelected: {
    backgroundColor: '#009688',
    borderColor: '#009688',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  timeOptionTextSelected: {
    color: '#fff',
  },
});