import { NativeModules, Platform } from 'react-native';

const { CallDirectoryModule, CallScreeningModule } = NativeModules;

/**
 * Native Call Screening Bridge
 * 
 * Provides a unified TypeScript interface to iOS Call Directory Extension
 * and Android CallScreeningService
 */

// Types
export interface ScamNumber {
  phone_number: string;
  scam_type?: string;
  confidence: number;
  report_count: number;
  should_block: boolean;
}

export interface ScreeningStatus {
  enabled: boolean;
  lastSync?: number;
  numberCount?: number;
}

export interface CallLogEntry {
  phoneNumber: string;
  timestamp: number;
  type: 'incoming' | 'outgoing' | 'missed';
  duration: number;
}

export interface ScreeningStats {
  totalBlocked: number;
  totalSilenced: number;
  last24Hours: number;
  last7Days: number;
}

/**
 * iOS Call Directory Extension Interface
 */
const iOSCallDirectory = {
  /**
   * Sync scam numbers to iOS Call Directory Extension
   * @param numbers Array of scam numbers to block/identify
   */
  async syncScamNumbers(numbers: ScamNumber[]): Promise<boolean> {
    if (Platform.OS !== 'ios' || !CallDirectoryModule) {
      console.warn('iOS Call Directory not available');
      return false;
    }

    try {
      await CallDirectoryModule.syncScamNumbers(numbers);
      console.log(`✅ iOS: Synced ${numbers.length} scam numbers`);
      return true;
    } catch (error) {
      console.error('❌ iOS: Failed to sync scam numbers:', error);
      throw error;
    }
  },

  /**
   * Reload the iOS Call Directory Extension
   * Call this after updating scam numbers
   */
  async reloadExtension(): Promise<boolean> {
    if (Platform.OS !== 'ios' || !CallDirectoryModule) {
      return false;
    }

    try {
      await CallDirectoryModule.reloadExtension();
      console.log('✅ iOS: Extension reloaded');
      return true;
    } catch (error) {
      console.error('❌ iOS: Failed to reload extension:', error);
      throw error;
    }
  },

  /**
   * Check if Call Directory Extension is enabled in Settings
   * User must enable in: Settings → Phone → Call Blocking & Identification
   */
  async isEnabled(): Promise<boolean> {
    if (Platform.OS !== 'ios' || !CallDirectoryModule) {
      return false;
    }

    try {
      const enabled = await CallDirectoryModule.getEnabledStatus();
      return enabled;
    } catch (error) {
      console.error('❌ iOS: Failed to check status:', error);
      return false;
    }
  },

  /**
   * Open iOS Settings to enable Call Blocking
   */
  async openSettings(): Promise<boolean> {
    if (Platform.OS !== 'ios' || !CallDirectoryModule) {
      return false;
    }

    try {
      await CallDirectoryModule.openSettings();
      return true;
    } catch (error) {
      console.error('❌ iOS: Failed to open settings:', error);
      return false;
    }
  },
};

/**
 * Android Call Screening Interface
 */
const androidCallScreening = {
  /**
   * Sync scam numbers to Android local database
   * @param numbers Array of scam numbers to block/identify
   */
  async syncScamNumbers(numbers: ScamNumber[]): Promise<boolean> {
    if (Platform.OS !== 'android' || !CallScreeningModule) {
      console.warn('Android Call Screening not available');
      return false;
    }

    try {
      await CallScreeningModule.syncScamNumbers(numbers);
      console.log(`✅ Android: Synced ${numbers.length} scam numbers`);
      return true;
    } catch (error) {
      console.error('❌ Android: Failed to sync scam numbers:', error);
      throw error;
    }
  },

  /**
   * Check if CallScreeningService is enabled
   * User must grant permissions and set as default screening app
   */
  async isEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android' || !CallScreeningModule) {
      return false;
    }

    try {
      const enabled = await CallScreeningModule.isEnabled();
      return enabled;
    } catch (error) {
      console.error('❌ Android: Failed to check status:', error);
      return false;
    }
  },

  /**
   * Request permissions for call screening
   * Opens Android permissions dialog
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android' || !CallScreeningModule) {
      return false;
    }

    try {
      const granted = await CallScreeningModule.requestPermissions();
      return granted;
    } catch (error) {
      console.error('❌ Android: Failed to request permissions:', error);
      return false;
    }
  },

  /**
   * Open Android settings to enable call screening
   */
  async openSettings(): Promise<boolean> {
    if (Platform.OS !== 'android' || !CallScreeningModule) {
      return false;
    }

    try {
      await CallScreeningModule.openSettings();
      return true;
    } catch (error) {
      console.error('❌ Android: Failed to open settings:', error);
      return false;
    }
  },

  /**
   * Get call screening statistics
   * How many calls blocked, silenced, etc.
   */
  async getStats(): Promise<ScreeningStats> {
    if (Platform.OS !== 'android' || !CallScreeningModule) {
      return { totalBlocked: 0, totalSilenced: 0, last24Hours: 0, last7Days: 0 };
    }

    try {
      const stats = await CallScreeningModule.getStats();
      return stats;
    } catch (error) {
      console.error('❌ Android: Failed to get stats:', error);
      return { totalBlocked: 0, totalSilenced: 0, last24Hours: 0, last7Days: 0 };
    }
  },

  /**
   * Scan call log for missed scam calls
   * Requires READ_CALL_LOG permission
   */
  async scanCallLog(): Promise<CallLogEntry[]> {
    if (Platform.OS !== 'android' || !CallScreeningModule) {
      return [];
    }

    try {
      const entries = await CallScreeningModule.scanCallLog();
      return entries;
    } catch (error) {
      console.error('❌ Android: Failed to scan call log:', error);
      return [];
    }
  },
};

/**
 * Unified Call Screening API (works on both iOS and Android)
 */
export const NativeCallScreening = {
  ios: iOSCallDirectory,
  android: androidCallScreening,

  /**
   * Sync scam numbers to native modules (iOS or Android)
   * Automatically uses the correct platform API
   */
  async syncScamNumbers(numbers: ScamNumber[]): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return await iOSCallDirectory.syncScamNumbers(numbers);
    } else if (Platform.OS === 'android') {
      return await androidCallScreening.syncScamNumbers(numbers);
    }
    return false;
  },

  /**
   * Check if call screening is enabled on this device
   */
  async isEnabled(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return await iOSCallDirectory.isEnabled();
    } else if (Platform.OS === 'android') {
      return await androidCallScreening.isEnabled();
    }
    return false;
  },

  /**
   * Open platform settings to enable call screening
   */
  async openSettings(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return await iOSCallDirectory.openSettings();
    } else if (Platform.OS === 'android') {
      return await androidCallScreening.openSettings();
    }
    return false;
  },

  /**
   * Get platform name for UI display
   */
  getPlatformName(): string {
    return Platform.OS === 'ios' ? 'iOS' : 'Android';
  },

  /**
   * Check if native modules are available
   */
  isAvailable(): boolean {
    if (Platform.OS === 'ios') {
      return !!CallDirectoryModule;
    } else if (Platform.OS === 'android') {
      return !!CallScreeningModule;
    }
    return false;
  },
};

export default NativeCallScreening;