import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { theme } from '../lib/theme';
import NativeCallScreening from '../lib/nativeCallScreening';

interface CallProtectionSetupScreenProps {
  onBack: () => void;
}

type SetupStep = 'checking' | 'disabled' | 'enabled' | 'syncing';

export default function CallProtectionSetupScreen({ onBack }: CallProtectionSetupScreenProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('checking');
  const [isEnabled, setIsEnabled] = useState(false);
  const [blocklistCount, setBlocklistCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch optimized blocklist based on platform
  const iosBlocklist = useQuery(api.callScreening.getOptimizedIOSBlocklist);
  const androidBlocklist = useQuery(api.callScreening.getOptimizedAndroidBlocklist);

  useEffect(() => {
    checkProtectionStatus();
    
    // Check every time app comes to foreground
    const interval = setInterval(checkProtectionStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkProtectionStatus = async () => {
    try {
      const enabled = await NativeCallScreening.isEnabled();
      setIsEnabled(enabled);
      setCurrentStep(enabled ? 'enabled' : 'disabled');
      
      // Get last sync time from storage
      const lastSync = await getLastSyncTime();
      setLastSyncTime(lastSync);
    } catch (error) {
      console.log('Protection status check:', error);
      setCurrentStep('disabled');
    }
  };

  const getLastSyncTime = async (): Promise<Date | null> => {
    // TODO: Implement AsyncStorage to track last sync
    // For now, return null
    return null;
  };

  const handleEnableProtection = async () => {
    try {
      await NativeCallScreening.openSettings();
      
      // Show platform-specific instructions
      if (Platform.OS === 'ios') {
        Alert.alert(
          '📱 Enable in Settings',
          'In Settings:\n1. Scroll to "Phone"\n2. Tap "Call Blocking & Identification"\n3. Toggle "ScamVigil" ON\n4. Return to this app',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open settings. Please enable manually.');
    }
  };

  const handleSyncBlocklist = async () => {
    setIsSyncing(true);
    
    try {
      const blocklist = Platform.OS === 'ios' ? iosBlocklist : androidBlocklist;
      
      if (!blocklist || blocklist.length === 0) {
        Alert.alert('Error', 'No blocklist available. Please try again.');
        setIsSyncing(false);
        return;
      }

      // Sync to native module
      await NativeCallScreening.syncScamNumbers(blocklist);
      
      setBlocklistCount(blocklist.length);
      setLastSyncTime(new Date());
      
      Alert.alert(
        '✅ Protection Updated',
        `You are now protected from ${blocklist.length.toLocaleString()} known scam numbers.`,
        [{ text: 'Great!' }]
      );
    } catch (error: any) {
      Alert.alert('Sync Error', error.message || 'Failed to sync blocklist');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const renderCheckingState = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.statusText}>Checking protection status...</Text>
    </View>
  );

  const renderDisabledState = () => (
    <ScrollView style={styles.scrollContent}>
      <View style={styles.heroCard}>
        <Ionicons name="shield-outline" size={80} color={theme.colors.primary} />
        <Text style={styles.heroTitle}>Enable Call Protection</Text>
        <Text style={styles.heroDescription}>
          Block scam calls automatically before your phone rings
        </Text>
      </View>

      <View style={styles.featuresCard}>
        <Text style={styles.sectionTitle}>What You Get:</Text>
        
        <View style={styles.feature}>
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Automatic Blocking</Text>
            <Text style={styles.featureDescription}>
              {Platform.OS === 'ios' 
                ? '80,000+ scam numbers blocked instantly'
                : 'Real-time screening before your phone rings'}
            </Text>
          </View>
        </View>

        <View style={styles.feature}>
          <Ionicons name="flash" size={24} color={theme.colors.success} />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Works Offline</Text>
            <Text style={styles.featureDescription}>
              Protection works even without internet connection
            </Text>
          </View>
        </View>

        <View style={styles.feature}>
          <Ionicons name="battery-charging" size={24} color={theme.colors.success} />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Battery Efficient</Text>
            <Text style={styles.featureDescription}>
              Uses minimal battery - you won't notice any difference
            </Text>
          </View>
        </View>

        <View style={styles.feature}>
          <Ionicons name="lock-closed" size={24} color={theme.colors.success} />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Private & Secure</Text>
            <Text style={styles.featureDescription}>
              No call recording. All processing on your device.
            </Text>
          </View>
        </View>
      </View>

      {Platform.OS === 'ios' && (
        <View style={styles.stepsCard}>
          <Text style={styles.sectionTitle}>Setup Steps (2 minutes):</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Tap "Enable Protection" below</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              In Settings, scroll to "Phone" → "Call Blocking & Identification"
            </Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Toggle "ScamVigil" ON</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>Return here and tap "Sync Protection"</Text>
          </View>
        </View>
      )}

      {Platform.OS === 'android' && (
        <View style={styles.stepsCard}>
          <Text style={styles.sectionTitle}>Setup Steps (1 minute):</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Tap "Enable Protection" below</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Allow "Screen calls" permission</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Return here - you're protected!</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleEnableProtection}
      >
        <Ionicons name="shield-checkmark" size={24} color="#fff" />
        <Text style={styles.primaryButtonText}>Enable Protection</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => Linking.openURL('https://scamvigil.com.au/help/call-protection')}
      >
        <Ionicons name="help-circle-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.secondaryButtonText}>How does this work?</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderEnabledState = () => {
    const blocklist = Platform.OS === 'ios' ? iosBlocklist : androidBlocklist;
    const count = blocklist?.length || blocklistCount;

    return (
      <ScrollView style={styles.scrollContent}>
        <View style={styles.successCard}>
          <Ionicons name="shield-checkmark" size={80} color={theme.colors.success} />
          <Text style={styles.successTitle}>✅ Protection Active</Text>
          <Text style={styles.successDescription}>
            You're protected from scam calls
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{count.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Scam Numbers Blocked</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {Platform.OS === 'ios' ? 'Offline' : 'Real-time'}
            </Text>
            <Text style={styles.statLabel}>Protection Mode</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="sync" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>
              Last Updated: {formatLastSync(lastSyncTime)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="trending-up" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>
              {Platform.OS === 'ios' 
                ? 'Auto-updates daily when app opens'
                : 'Real-time protection active'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, isSyncing && styles.buttonDisabled]}
          onPress={handleSyncBlocklist}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.primaryButtonText}>Syncing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.primaryButtonText}>Update Protection</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.tipsCard}>
          <Text style={styles.sectionTitle}>💡 Tips:</Text>
          
          <Text style={styles.tipText}>
            • New scam numbers are added daily by the community
          </Text>
          <Text style={styles.tipText}>
            • Tap "Update Protection" weekly for best results
          </Text>
          <Text style={styles.tipText}>
            • Report suspicious calls to help protect others
          </Text>
          {Platform.OS === 'ios' && (
            <Text style={styles.tipText}>
              • You can disable anytime in Settings → Phone → Call Blocking
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleEnableProtection}
        >
          <Ionicons name="settings-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.secondaryButtonText}>
            {Platform.OS === 'ios' ? 'Open iOS Settings' : 'Manage Permissions'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Call Protection</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {currentStep === 'checking' && renderCheckingState()}
      {currentStep === 'disabled' && renderDisabledState()}
      {currentStep === 'enabled' && renderEnabledState()}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  scrollContent: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },

  // Hero Section
  heroCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.surface,
    margin: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary + '20',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },

  // Success Section
  successCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.success + '10',
    margin: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.success + '30',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
  },
  successDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },

  // Features
  featuresCard: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  featureText: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  // Steps
  stepsCard: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
    paddingTop: 4,
  },

  // Stats
  statsCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },

  // Info
  infoCard: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 12,
    flex: 1,
  },

  // Tips
  tipsCard: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});