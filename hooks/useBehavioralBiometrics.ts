import { useState, useRef, useCallback } from 'react';

export type InteractionPattern = 'normal' | 'rushed' | 'suspicious';

interface BehavioralMetrics {
  typingSpeed: number;
  formFillTime: number;
  fieldInteractions: number;
  hesitationEvents: number;
  copyPasteDetected: boolean;
  interactionPattern: InteractionPattern;
}

interface FieldTracking {
  lastInputTime: number;
  charCount: number;
  focusCount: number;
  lastFocusTime: number;
}

export function useBehavioralBiometrics() {
  const [metrics, setMetrics] = useState<BehavioralMetrics>({
    typingSpeed: 0,
    formFillTime: 0,
    fieldInteractions: 0,
    hesitationEvents: 0,
    copyPasteDetected: false,
    interactionPattern: 'normal',
  });

  const fieldTracking = useRef<Map<string, FieldTracking>>(new Map());
  const formStartTime = useRef<number>(Date.now());
  const lastInputTime = useRef<number>(Date.now());

  const trackInput = useCallback((fieldName: string, value: string) => {
    const now = Date.now();
    const field = fieldTracking.current.get(fieldName) || {
      lastInputTime: now,
      charCount: 0,
      focusCount: 0,
      lastFocusTime: now,
    };

    const timeSinceLastInput = now - field.lastInputTime;
    
    // Detect hesitation (pause > 2 seconds between inputs)
    if (timeSinceLastInput > 2000 && field.charCount > 0) {
      setMetrics(prev => ({
        ...prev,
        hesitationEvents: prev.hesitationEvents + 1,
      }));
    }

    // Update field tracking
    const newCharCount = value.length;
    const charDelta = Math.abs(newCharCount - field.charCount);
    
    fieldTracking.current.set(fieldName, {
      ...field,
      lastInputTime: now,
      charCount: newCharCount,
    });

    // Calculate typing speed (characters per second)
    const totalTime = (now - formStartTime.current) / 1000;
    const totalChars = Array.from(fieldTracking.current.values())
      .reduce((sum, f) => sum + f.charCount, 0);
    const typingSpeed = totalTime > 0 ? totalChars / totalTime : 0;

    // Calculate form fill time
    const formFillTime = (now - formStartTime.current) / 1000;

    // Determine interaction pattern
    let interactionPattern: InteractionPattern = 'normal';
    if (typingSpeed > 10) {
      interactionPattern = 'rushed'; // Very fast typing
    } else if (metrics.hesitationEvents > 5 || metrics.copyPasteDetected) {
      interactionPattern = 'suspicious';
    }

    setMetrics(prev => ({
      ...prev,
      typingSpeed,
      formFillTime,
      interactionPattern,
    }));

    lastInputTime.current = now;
  }, [metrics.hesitationEvents, metrics.copyPasteDetected]);

  const trackFocus = useCallback((fieldName: string) => {
    const now = Date.now();
    const field = fieldTracking.current.get(fieldName) || {
      lastInputTime: now,
      charCount: 0,
      focusCount: 0,
      lastFocusTime: now,
    };

    fieldTracking.current.set(fieldName, {
      ...field,
      focusCount: field.focusCount + 1,
      lastFocusTime: now,
    });

    // Count total field interactions
    const totalInteractions = Array.from(fieldTracking.current.values())
      .reduce((sum, f) => sum + f.focusCount, 0);

    setMetrics(prev => ({
      ...prev,
      fieldInteractions: totalInteractions,
    }));
  }, []);

  const trackPaste = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      copyPasteDetected: true,
      interactionPattern: 'suspicious',
    }));
  }, []);

  const reset = useCallback(() => {
    fieldTracking.current.clear();
    formStartTime.current = Date.now();
    lastInputTime.current = Date.now();
    setMetrics({
      typingSpeed: 0,
      formFillTime: 0,
      fieldInteractions: 0,
      hesitationEvents: 0,
      copyPasteDetected: false,
      interactionPattern: 'normal',
    });
  }, []);

  return {
    ...metrics,
    trackInput,
    trackFocus,
    trackPaste,
    reset,
  };
}