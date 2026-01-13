import { useState, useEffect, useRef } from "react";

interface SessionData {
  landedAt: number;
  timeOnPage: number;
  pagesViewed: number;
  formInteractions: number;
  timeToCheckout: number | null;
  behaviorScore: number; // 0-100 (higher = more suspicious)
}

/**
 * Custom hook to track user session behavior for fraud detection
 * Monitors time on page, interactions, and checkout speed
 */
export function useSessionTracking() {
  const [sessionData, setSessionData] = useState<SessionData>({
    landedAt: Date.now(),
    timeOnPage: 0,
    pagesViewed: 1,
    formInteractions: 0,
    timeToCheckout: null,
    behaviorScore: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Update time on page every second
    intervalRef.current = setInterval(() => {
      setSessionData((prev) => ({
        ...prev,
        timeOnPage: Date.now() - prev.landedAt,
      }));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  /**
   * Track form interaction (input focus, text change, etc.)
   */
  const trackInteraction = () => {
    setSessionData((prev) => ({
      ...prev,
      formInteractions: prev.formInteractions + 1,
    }));
  };

  /**
   * Mark checkout completion and calculate behavior score
   */
  const markCheckout = () => {
    const timeToCheckout = Date.now() - sessionData.landedAt;
    
    // Calculate behavior score (0-100, higher = more suspicious)
    let score = 0;
    
    // Too fast checkout (< 30 seconds)
    if (timeToCheckout < 30000) {
      score += 30;
    }
    
    // Very few interactions (< 5)
    if (sessionData.formInteractions < 5) {
      score += 20;
    }
    
    // Suspiciously fast typing (> 10 interactions in < 10 seconds)
    if (sessionData.formInteractions > 10 && timeToCheckout < 10000) {
      score += 25;
    }
    
    setSessionData((prev) => ({
      ...prev,
      timeToCheckout,
      behaviorScore: Math.min(score, 100),
    }));

    return { timeToCheckout, behaviorScore: Math.min(score, 100) };
  };

  return {
    sessionData,
    trackInteraction,
    markCheckout,
  };
}