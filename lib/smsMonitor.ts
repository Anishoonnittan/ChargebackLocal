/**
 * Clipboard Monitor - Detects when user copies text and offers scanning
 * Works on iOS & Android without needing SMS permissions
 */

// NOTE:
// This codebase currently does NOT include the `expo-clipboard` module.
// A static import causes Metro to crash at startup.
// Until clipboard access is available in this project, we keep the API surface
// but gracefully no-op so the app remains stable.

import { Vibration, Platform } from 'react-native';

export const CLIPBOARD_MONITORING_AVAILABLE = false;

export interface ClipboardText {
  text: string;
  timestamp: number;
  isMessage: boolean; // Did it look like a message?
}

/**
 * Smart detection to check if clipboard text looks like a message
 * Returns true if text matches patterns like:
 * - SMS/WhatsApp message (20-500 chars)
 * - Contains sentences or phrases
 * - Has message-like keywords
 */
export function isLikelyMessage(text: string): boolean {
  // Ignore very short or very long text
  if (text.length < 10 || text.length > 1000) return false;

  // Ignore URLs (they go to Link Scanner instead)
  if (text.startsWith('http://') || text.startsWith('https://')) return false;

  // Ignore single words or numbers
  if (text.split(' ').length < 2) return false;

  // Check for message-like patterns
  const messagePatterns = [
    /click/i,
    /verify/i,
    /confirm/i,
    /update/i,
    /urgent/i,
    /immediately/i,
    /dear|sir|madam/i,
    /congratulations/i,
    /won|claim|prize/i,
    /password|code|otp/i,
    /transfer|send|pay/i,
    /bitcoin|crypto|card/i,
    /ato|centrelink|medicare|westpac|nab|cba|australia post/i,
  ];

  return messagePatterns.some(pattern => pattern.test(text));
}

/**
 * Get current clipboard text
 */
export async function getClipboardText(): Promise<string | null> {
  // Clipboard access is not available in this project yet.
  // Users can still manually paste into the Message Scanner.
  return null;
}

/**
 * Clear clipboard (optional - don't do by default, users might be copying for other apps)
 */
export async function clearClipboard(): Promise<void> {
  // Clipboard access is not available in this project yet.
}

/**
 * Haptic feedback when clipboard is detected
 */
export function triggerHapticFeedback(): void {
  try {
    Vibration.vibrate([0, 10, 20, 10], false);
  } catch (error) {
    console.log('Haptic feedback error:', error);
  }
}

/**
 * Check if clipboard monitoring is supported on this device
 */
export function isClipboardMonitoringSupported(): boolean {
  // Platform support alone isn't enough; we also need a clipboard module.
  return (Platform.OS === 'ios' || Platform.OS === 'android') && CLIPBOARD_MONITORING_AVAILABLE;
}

/**
 * Log clipboard monitoring event
 */
export function logClipboardEvent(event: {
  eventType: 'detected' | 'accepted' | 'dismissed' | 'error';
  textLength: number;
  isMessage: boolean;
  timestamp: number;
}): void {
  console.log('📋 Clipboard Monitor:', {
    ...event,
    time: new Date(event.timestamp).toLocaleTimeString(),
  });
}