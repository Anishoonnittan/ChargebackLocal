import { useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';

export interface DeviceFingerprint {
  deviceId: string;
  screenResolution: { width: number; height: number };
  timezone: number;
  platform: string;
  userAgent: string;
}

export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<DeviceFingerprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    collectFingerprint();
  }, []);

  const collectFingerprint = async () => {
    try {
      // Generate a simple device ID based on screen + platform + time
      const screenInfo = Dimensions.get('window');
      const simpleId = `${Platform.OS}-${screenInfo.width}x${screenInfo.height}-${Date.now()}`;
      
      // Simple user agent string
      const userAgent = Platform.Version 
        ? `${Platform.OS}/${Platform.Version}` 
        : Platform.OS;
      
      const fp: DeviceFingerprint = {
        deviceId: simpleId,
        screenResolution: {
          width: screenInfo.width,
          height: screenInfo.height,
        },
        timezone: new Date().getTimezoneOffset(),
        platform: Platform.OS,
        userAgent,
      };

      setFingerprint(fp);
    } catch (error) {
      console.error('Error collecting device fingerprint:', error);
      setFingerprint(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Create hash from fingerprint
  const fingerprintHash = fingerprint 
    ? JSON.stringify(fingerprint)
    : null;

  return { fingerprint, fingerprintHash, isLoading };
}