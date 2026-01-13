/**
 * Fraud Detection Utilities
 * 7 detection methods for chargeback fraud prevention
 */

// ============================================
// 1. DEVICE FINGERPRINTING
// ============================================
export interface DeviceFingerprint {
  deviceId: string;
  deviceName: string | null;
  deviceModel: string | null;
  osName: string | null;
  osVersion: string | null;
  screenResolution: {
    width: number;
    height: number;
  };
  timezone: number;
  platform: string;
  ip: string;
}

export interface FraudCheckResult {
  risk: boolean;
  score: number; // 0-100
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export async function checkDeviceFingerprint(
  deviceFingerprint: string,
  deviceHistory: any[]
): Promise<FraudCheckResult> {
  // Check if same device used for multiple accounts
  const uniqueEmails = new Set(deviceHistory.map(h => h.customerEmail)).size;
  
  if (uniqueEmails > 5) {
    return {
      risk: true,
      score: 40,
      severity: 'high',
      description: `Device used for ${uniqueEmails} different accounts (fraud farm indicator)`,
    };
  } else if (uniqueEmails > 3) {
    return {
      risk: true,
      score: 25,
      severity: 'medium',
      description: `Device used for ${uniqueEmails} different accounts`,
    };
  }
  
  return { risk: false, score: 0, severity: 'low', description: 'Device check passed' };
}

// ============================================
// 2. GEOLOCATION MISMATCH
// ============================================
export async function checkGeolocationMismatch(
  ipAddress: string,
  cardBin?: string
): Promise<FraudCheckResult> {
  try {
    // 1. Get IP geolocation (using ipapi.co - free 30k/month)
    const ipResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    if (!ipResponse.ok) {
      return { risk: false, score: 0, severity: 'low', description: 'IP lookup failed' };
    }
    const ipData = await ipResponse.json();
    const ipCountry = ipData.country_code;
    const ipCity = ipData.city;
    
    // 2. Get card BIN country (if provided)
    if (cardBin && cardBin.length >= 6) {
      const binResponse = await fetch(`https://lookup.binlist.net/${cardBin.substring(0, 6)}`);
      if (binResponse.ok) {
        const binData = await binResponse.json();
        const cardCountry = binData.country?.alpha2;
        
        // Compare countries
        if (cardCountry && ipCountry !== cardCountry) {
          return {
            risk: true,
            score: 30,
            severity: 'high',
            description: `IP in ${ipCountry} (${ipCity}), card issued in ${cardCountry}`,
          };
        }
      }
    }
    
    // Check for high-risk countries (based on fraud data)
    const highRiskCountries = ['NG', 'GH', 'RO', 'ID', 'PK', 'BD'];
    if (highRiskCountries.includes(ipCountry)) {
      return {
        risk: true,
        score: 15,
        severity: 'medium',
        description: `Order from high-risk country: ${ipCountry}`,
      };
    }
    
    return { risk: false, score: 0, severity: 'low', description: 'Geolocation check passed' };
  } catch (error) {
    console.error('Geolocation check failed:', error);
    return { risk: false, score: 0, severity: 'low', description: 'Geolocation check unavailable' };
  }
}

// ============================================
// 3. VELOCITY CHECKS
// ============================================
export async function checkVelocity(
  identifier: { email?: string; ip?: string; deviceFingerprint?: string },
  recentOrders: any[]
): Promise<FraudCheckResult> {
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  // Count orders in different time windows
  const ordersLast5Min = recentOrders.filter(o => o.scannedAt > fiveMinutesAgo).length;
  const ordersLastHour = recentOrders.filter(o => o.scannedAt > oneHourAgo).length;
  const ordersLastDay = recentOrders.filter(o => o.scannedAt > oneDayAgo).length;
  
  // Velocity thresholds
  if (ordersLast5Min > 3) {
    return {
      risk: true,
      score: 35,
      severity: 'high',
      description: `${ordersLast5Min} orders in 5 minutes (bot attack pattern)`,
    };
  }
  
  if (ordersLastHour > 10) {
    return {
      risk: true,
      score: 30,
      severity: 'high',
      description: `${ordersLastHour} orders in 1 hour (velocity abuse)`,
    };
  }
  
  if (ordersLastDay > 20) {
    return {
      risk: true,
      score: 20,
      severity: 'medium',
      description: `${ordersLastDay} orders in 24 hours`,
    };
  }
  
  return { risk: false, score: 0, severity: 'low', description: 'Velocity check passed' };
}

// ============================================
// 4. EMAIL VALIDATION
// ============================================
export async function validateEmail(email: string): Promise<FraudCheckResult> {
  const risks: string[] = [];
  let score = 0;
  
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      risk: true,
      score: 25,
      severity: 'high',
      description: 'Invalid email format',
    };
  }
  
  // Check for disposable email domains
  const disposableDomains = [
    'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email',
    'temp-mail.org', 'mailinator.com', 'maildrop.cc', 'trashmail.com'
  ];
  const domain = email.split('@')[1].toLowerCase();
  if (disposableDomains.includes(domain)) {
    risks.push('Disposable email');
    score += 25;
  }
  
  // Check for suspicious patterns
  if (/\d{8,}/.test(email)) {
    risks.push('Contains long number sequence');
    score += 10;
  }
  
  if (email.split('@')[0].length > 30) {
    risks.push('Unusually long email prefix');
    score += 5;
  }
  
  // TODO: Add API integration for email validation (Abstract API, Kickbox, etc.)
  // For now, return basic checks
  
  if (risks.length > 0) {
    return {
      risk: true,
      score,
      severity: score > 20 ? 'high' : 'medium',
      description: risks.join(', '),
    };
  }
  
  return { risk: false, score: 0, severity: 'low', description: 'Email validation passed' };
}

// ============================================
// 5. PHONE VALIDATION
// ============================================
export async function validatePhone(phone?: string): Promise<FraudCheckResult> {
  if (!phone) {
    return { risk: false, score: 0, severity: 'low', description: 'No phone provided' };
  }
  
  // Remove formatting
  const cleaned = phone.replace(/\D/g, '');
  
  // Basic length check
  if (cleaned.length < 10 || cleaned.length > 15) {
    return {
      risk: true,
      score: 15,
      severity: 'medium',
      description: 'Invalid phone number length',
    };
  }
  
  // TODO: Add Twilio Lookup API for line type detection (VOIP check)
  // For now, return basic validation
  
  return { risk: false, score: 0, severity: 'low', description: 'Phone validation passed' };
}

// ============================================
// 6. ADDRESS MISMATCH
// ============================================
export function checkAddressMismatch(
  billingAddress?: string,
  shippingAddress?: string
): FraudCheckResult {
  if (!billingAddress || !shippingAddress) {
    return { risk: false, score: 0, severity: 'low', description: 'Incomplete address data' };
  }
  
  // Normalize addresses for comparison
  const normalize = (addr: string) => addr.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedBilling = normalize(billingAddress);
  const normalizedShipping = normalize(shippingAddress);
  
  // Check if addresses match
  if (normalizedBilling === normalizedShipping) {
    return { risk: false, score: 0, severity: 'low', description: 'Addresses match' };
  }
  
  // Extract country/state indicators (simplified)
  const extractCountry = (addr: string) => {
    const countries = ['USA', 'US', 'UK', 'AU', 'CA', 'NZ', 'DE', 'FR', 'IT', 'ES'];
    for (const country of countries) {
      if (addr.toUpperCase().includes(country)) return country;
    }
    return null;
  };
  
  const billingCountry = extractCountry(billingAddress);
  const shippingCountry = extractCountry(shippingAddress);
  
  if (billingCountry && shippingCountry && billingCountry !== shippingCountry) {
    return {
      risk: true,
      score: 25,
      severity: 'high',
      description: `Different countries: billing in ${billingCountry}, shipping to ${shippingCountry}`,
    };
  }
  
  // Addresses different but same country
  return {
    risk: true,
    score: 12,
    severity: 'medium',
    description: 'Billing and shipping addresses do not match',
  };
}

// ============================================
// 7. ORDER VALUE ANOMALIES
// ============================================
export function checkOrderAnomalies(
  orderAmount: number,
  userHistory: { totalOrders: number; avgOrderValue: number }
): FraudCheckResult {
  const { totalOrders, avgOrderValue } = userHistory;
  const risks: string[] = [];
  let score = 0;
  
  // First order check
  if (totalOrders === 0) {
    if (orderAmount > 1000) {
      risks.push(`High-value first order ($${orderAmount})`);
      score += 30;
    } else if (orderAmount > 500) {
      risks.push(`First order over $500 ($${orderAmount})`);
      score += 15;
    }
  }
  
  // Anomaly detection for existing customers
  if (totalOrders > 0 && avgOrderValue > 0) {
    const ratio = orderAmount / avgOrderValue;
    
    if (ratio > 5) {
      risks.push(`Order 5x above average ($${avgOrderValue.toFixed(2)} avg)`);
      score += 25;
    } else if (ratio > 3) {
      risks.push(`Order 3x above average ($${avgOrderValue.toFixed(2)} avg)`);
      score += 15;
    }
  }
  
  // Suspiciously round numbers (common in fraud)
  if (orderAmount % 1000 === 0 || orderAmount % 500 === 0) {
    risks.push('Suspiciously round order amount');
    score += 5;
  }
  
  if (risks.length > 0) {
    return {
      risk: true,
      score,
      severity: score > 20 ? 'high' : 'medium',
      description: risks.join(', '),
    };
  }
  
  return { risk: false, score: 0, severity: 'low', description: 'Order value check passed' };
}

// ============================================
// 8. BEHAVIOR ANALYSIS
// ============================================
export interface SessionData {
  landedAt: number;
  timeToCheckout: number; // milliseconds
  pagesViewed: number;
  formFillSpeed?: number; // seconds
}

export function analyzeBehavior(sessionData: SessionData): FraudCheckResult {
  const risks: string[] = [];
  let score = 0;
  
  const timeToCheckoutSeconds = sessionData.timeToCheckout / 1000;
  
  // Too fast (bot-like behavior)
  if (timeToCheckoutSeconds < 20) {
    risks.push(`Rushed checkout (${Math.round(timeToCheckoutSeconds)}s)`);
    score += 25;
  } else if (timeToCheckoutSeconds < 60) {
    risks.push(`Fast checkout (${Math.round(timeToCheckoutSeconds)}s)`);
    score += 15;
  }
  
  // No browsing (direct to checkout)
  if (sessionData.pagesViewed < 2) {
    risks.push('No product browsing detected');
    score += 12;
  }
  
  // Form filled too quickly
  if (sessionData.formFillSpeed && sessionData.formFillSpeed < 5) {
    risks.push('Form filled suspiciously fast');
    score += 15;
  }
  
  if (risks.length > 0) {
    return {
      risk: true,
      score,
      severity: score > 20 ? 'high' : 'medium',
      description: risks.join(', '),
    };
  }
  
  return { risk: false, score: 0, severity: 'low', description: 'Behavior analysis passed' };
}

// ============================================
// MULTI-SIGNAL RISK SCORING
// ============================================
export interface Signal {
  name: string;
  score: number;
  weight: number;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
}

export function calculateRiskScore(signals: Signal[]): {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidenceScore: number;
} {
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  signals.forEach(signal => {
    totalWeightedScore += signal.score * signal.weight;
    totalWeight += signal.weight;
  });
  
  const riskScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight)) : 0;
  
  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (riskScore >= 70) riskLevel = 'CRITICAL';
  else if (riskScore >= 50) riskLevel = 'HIGH';
  else if (riskScore >= 30) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';
  
  // Confidence score (more signals = higher confidence)
  const confidenceScore = Math.min(100, signals.length * 14); // Max at 7 signals
  
  return { riskScore, riskLevel, confidenceScore };
}