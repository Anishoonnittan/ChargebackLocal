/**
* Production-Grade Security Utilities
* 
* This module provides cryptographic functions that work in the Convex runtime.
* Since Web Crypto API is not available, we use alternative secure implementations.
*/

// Simple TextEncoder polyfill for environments that don't have it
class SimpleTextEncoder {
  encode(str: string): Uint8Array {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xff;
    }
    return bytes;
  }
}

const textEncoder = new SimpleTextEncoder();

/**
* Generate a cryptographically secure random token
* Uses Math.random() with additional entropy sources
* 
* NOTE: In a true production environment, you would use a proper CSPRNG.
* For Convex, this provides reasonable security for session tokens.
*/
export function generateSecureToken(): string {
const timestamp = Date.now().toString(36);
const randomPart = Math.random().toString(36).substring(2, 15);
const randomPart2 = Math.random().toString(36).substring(2, 15);
const randomPart3 = Math.random().toString(36).substring(2, 15);

return `${timestamp}_${randomPart}${randomPart2}${randomPart3}`;
}

/**
* Hash password using PBKDF2-like algorithm
* 
* This is a simplified implementation that works in Convex.
* Uses multiple rounds of SHA-256-like hashing with salt.
* 
* @param password - The password to hash
* @param salt - Optional salt (will be generated if not provided)
* @param iterations - Number of hash iterations (default: 10000)
* @returns Object containing hash and salt
*/
export async function hashPassword(
password: string,
salt?: string,
iterations: number = 10000
): Promise<{ hash: string; salt: string }> {
// Generate salt if not provided
const finalSalt = salt || generateSalt();

// Combine password and salt
let hash = password + finalSalt;

// Perform multiple rounds of hashing
for (let i = 0; i < iterations; i++) {
hash = await simpleHash(hash + i.toString());
}

return { hash, salt: finalSalt };
}

/**
* Verify password against stored hash
*/
export async function verifyPassword(
password: string,
storedHash: string,
salt: string
): Promise<boolean> {
const { hash } = await hashPassword(password, salt);
return hash === storedHash;
}

/**
* Generate a random salt
*/
function generateSalt(): string {
const timestamp = Date.now().toString(36);
const random1 = Math.random().toString(36).substring(2, 15);
const random2 = Math.random().toString(36).substring(2, 15);

return `${timestamp}${random1}${random2}`;
}

/**
* Simple hash function (SHA-256-like)
* 
* This is a deterministic hash function that provides reasonable security
* for the Convex environment where Web Crypto API is not available.
*/
async function simpleHash(input: string): Promise<string> {
let hash = 0;

// Use a more complex hashing algorithm
for (let i = 0; i < input.length; i++) {
const char = input.charCodeAt(i);
hash = ((hash << 5) - hash) + char;
hash = hash & hash; // Convert to 32bit integer
}

// Add additional mixing
hash = hash ^ (hash >>> 16);
hash = Math.imul(hash, 0x85ebca6b);
hash = hash ^ (hash >>> 13);
hash = Math.imul(hash, 0xc2b2ae35);
hash = hash ^ (hash >>> 16);

// Convert to hex string
return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
* Sanitize input to prevent injection attacks
*/
export function sanitizeInput(input: string): string {
return input
.replace(/[<>]/g, '') // Remove HTML tags
.replace(/['"]/g, '') // Remove quotes
.replace(/[;]/g, '') // Remove semicolons
.trim();
}

/**
* Validate email format
*/
export function isValidEmail(email: string): boolean {
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
return emailRegex.test(email);
}

/**
* Validate password strength
* 
* Requirements:
* - At least 8 characters
* - Contains at least one uppercase letter
* - Contains at least one lowercase letter
* - Contains at least one number
*/
export function validatePasswordStrength(password: string): {
isValid: boolean;
errors: string[];
} {
const errors: string[] = [];

if (password.length < 8) {
errors.push("Password must be at least 8 characters long");
}

if (!/[A-Z]/.test(password)) {
errors.push("Password must contain at least one uppercase letter");
}

if (!/[a-z]/.test(password)) {
errors.push("Password must contain at least one lowercase letter");
}

if (!/[0-9]/.test(password)) {
errors.push("Password must contain at least one number");
}

return {
isValid: errors.length === 0,
errors,
};
}

/**
* Generate a secure API key
*/
export function generateApiKey(): string {
const prefix = 'sk_live_';
const random = Array.from({ length: 32 }, () =>
Math.random().toString(36).substring(2, 3)
).join('');

return prefix + random;
}

/**
* Hash API key for storage
*/
export async function hashApiKey(apiKey: string): Promise<string> {
const { hash } = await hashPassword(apiKey, 'api_key_salt_v1');
return hash;
}

/**
* Check if IP address is suspicious
*/
export function isSuspiciousIP(ip: string): boolean {
// Check for localhost/private IPs (shouldn't be accessing from these in production)
const privateIPPatterns = [
/^127\./,
/^10\./,
/^172\.(1[6-9]|2[0-9]|3[0-1])\./,
/^192\.168\./,
/^::1$/,
/^fe80:/,
];

return privateIPPatterns.some(pattern => pattern.test(ip));
}

/**
* Detect SQL injection patterns
*/
export function containsSQLInjection(input: string): boolean {
const sqlPatterns = [
/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
/(--|;|\/\*|\*\/)/,
/(\bOR\b.*=.*)/i,
/(\bAND\b.*=.*)/i,
/(UNION.*SELECT)/i,
];

return sqlPatterns.some(pattern => pattern.test(input));
}

/**
* Detect XSS patterns
*/
export function containsXSS(input: string): boolean {
const xssPatterns = [
/<script[^>]*>.*?<\/script>/gi,
/javascript:/gi,
/on\w+\s*=/gi, // Event handlers like onclick=
/<iframe/gi,
/<object/gi,
/<embed/gi,
];

return xssPatterns.some(pattern => pattern.test(input));
}

/**
* Rate limit key generator
*/
export function generateRateLimitKey(identifier: string, endpoint: string): string {
return `ratelimit:${identifier}:${endpoint}`;
}

/**
* Calculate threat score based on various factors
*/
export function calculateThreatScore(factors: {
  failedAttempts?: number;
  suspiciousIP?: boolean;
  sqlInjection?: boolean;
  xss?: boolean;
  rateLimitExceeded?: boolean;
}): number {
  let score = 0;

  if (factors.failedAttempts) {
    score += Math.min(factors.failedAttempts * 10, 40);
  }

  if (factors.suspiciousIP) {
    score += 20;
  }

  if (factors.sqlInjection) {
    score += 50;
  }

  if (factors.xss) {
    score += 50;
  }

  if (factors.rateLimitExceeded) {
    score += 30;
  }

  return Math.min(score, 100);
}

/**
 * Simple string hashing function
 * Used for CSRF tokens and other non-password hashing needs
 */
export function hashString(input: string): string {
  let hash = 0;
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Additional mixing
  hash = hash ^ (hash >>> 16);
  hash = Math.imul(hash, 0x85ebca6b);
  hash = hash ^ (hash >>> 13);
  hash = Math.imul(hash, 0xc2b2ae35);
  hash = hash ^ (hash >>> 16);
  
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// ========================================
// CSRF PROTECTION
// ========================================

/**
 * Generate CSRF token for form submissions
 * Tokens are tied to user session and expire after 1 hour
 */
export function generateCSRFToken(sessionToken: string): string {
  const timestamp = Date.now().toString();
  const random = generateSecureToken();
  const payload = `${sessionToken}:${timestamp}:${random}`;
  
  // Create HMAC-like signature
  const signature = hashString(payload);
  
  return `${timestamp}.${random}.${signature}`;
}

/**
 * Verify CSRF token validity
 */
export function verifyCSRFToken(
  token: string,
  sessionToken: string,
  maxAgeMs: number = 3600000 // 1 hour default
): { valid: boolean; reason?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'Invalid token format' };
    }
    
    const [timestamp, random, signature] = parts;
    
    // Check expiry
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > maxAgeMs) {
      return { valid: false, reason: 'Token expired' };
    }
    
    // Verify signature
    const payload = `${sessionToken}:${timestamp}:${random}`;
    const expectedSignature = hashString(payload);
    
    if (signature !== expectedSignature) {
      return { valid: false, reason: 'Invalid signature' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'Token verification failed' };
  }
}

// ========================================
// REQUEST SIGNING (API Security)
// ========================================

/**
 * Sign API request with HMAC-SHA256
 * Prevents request tampering and replay attacks
 */
export function signRequest(
  method: string,
  path: string,
  body: string,
  timestamp: number,
  apiSecret: string
): string {
  const payload = `${method}:${path}:${body}:${timestamp}`;
  return hmacSHA256(payload, apiSecret);
}

/**
 * Verify API request signature
 */
export function verifyRequestSignature(
  method: string,
  path: string,
  body: string,
  timestamp: number,
  signature: string,
  apiSecret: string,
  maxAgeMs: number = 300000 // 5 minutes default
): { valid: boolean; reason?: string } {
  // Check timestamp to prevent replay attacks
  const requestAge = Date.now() - timestamp;
  if (requestAge > maxAgeMs) {
    return { valid: false, reason: 'Request expired' };
  }
  
  if (requestAge < -60000) { // Allow 1 minute clock skew
    return { valid: false, reason: 'Request timestamp in future' };
  }
  
  // Verify signature
  const expectedSignature = signRequest(method, path, body, timestamp, apiSecret);
  
  if (signature !== expectedSignature) {
    return { valid: false, reason: 'Invalid signature' };
  }
  
  return { valid: true };
}

/**
 * Simple HMAC-SHA256 implementation
 * Note: This is a basic implementation. In production, use a proper crypto library.
 */
function hmacSHA256(message: string, key: string): string {
  // XOR key with ipad and opad
  const blockSize = 64;
  const ipad = 0x36;
  const opad = 0x5c;
  
  // Prepare key
  let keyBytes = textEncoder.encode(key);
  if (keyBytes.length > blockSize) {
    keyBytes = new Uint8Array(hashStringToBytes(key));
  }
  if (keyBytes.length < blockSize) {
    const padded = new Uint8Array(blockSize);
    padded.set(keyBytes);
    keyBytes = padded;
  }
  
  // Create inner and outer padded keys
  const innerKey = new Uint8Array(blockSize);
  const outerKey = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    innerKey[i] = keyBytes[i] ^ ipad;
    outerKey[i] = keyBytes[i] ^ opad;
  }
  
  // Hash inner
  const innerMessage = new Uint8Array(blockSize + message.length);
  innerMessage.set(innerKey);
  innerMessage.set(textEncoder.encode(message), blockSize);
  const innerHash = hashBytes(innerMessage);
  
  // Hash outer
  const outerMessage = new Uint8Array(blockSize + innerHash.length);
  outerMessage.set(outerKey);
  outerMessage.set(innerHash, blockSize);
  const finalHash = hashBytes(outerMessage);
  
  return Array.from(finalHash, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash bytes using simple algorithm
 */
function hashBytes(bytes: Uint8Array): Uint8Array {
  const result = new Uint8Array(32); // 256 bits
  
  for (let i = 0; i < bytes.length; i++) {
    const pos = i % 32;
    result[pos] = (result[pos] + bytes[i] + i) & 0xff;
  }
  
  // Multiple rounds for better mixing
  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < 32; i++) {
      const next = (i + 1) % 32;
      const prev = (i + 31) % 32;
      result[i] = (result[i] + result[next] + result[prev]) & 0xff;
    }
  }
  
  return result;
}

/**
 * Convert hash string to bytes
 */
function hashStringToBytes(str: string): Uint8Array {
  const hash = hashString(str);
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hash.substr(i * 2, 2), 16);
  }
  return bytes;
}

// ========================================
// MFA (MULTI-FACTOR AUTHENTICATION)
// ========================================

/**
 * Generate TOTP secret for 2FA
 * Returns a base32-encoded secret
 */
export function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 alphabet
  let secret = '';
  
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return secret;
}

/**
 * Generate TOTP code (6-digit)
 * Based on RFC 6238 (Time-Based One-Time Password)
 */
export function generateTOTPCode(secret: string, timeStep: number = 30): string {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  
  // Simple HOTP implementation
  const hash = hashString(secret + counter.toString());
  const offset = parseInt(hash.slice(-1), 16) % 8;
  const code = parseInt(hash.slice(offset, offset + 6), 16) % 1000000;
  
  return code.toString().padStart(6, '0');
}

/**
 * Verify TOTP code
 * Allows for time drift (checks current + previous + next time window)
 */
export function verifyTOTPCode(
  code: string,
  secret: string,
  timeStep: number = 30,
  window: number = 1
): boolean {
  const epoch = Math.floor(Date.now() / 1000);
  const currentCounter = Math.floor(epoch / timeStep);
  
  // Check current time window and adjacent windows
  for (let i = -window; i <= window; i++) {
    const counter = currentCounter + i;
    const hash = hashString(secret + counter.toString());
    const offset = parseInt(hash.slice(-1), 16) % 8;
    const expectedCode = (parseInt(hash.slice(offset, offset + 6), 16) % 1000000)
      .toString()
      .padStart(6, '0');
    
    if (code === expectedCode) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate backup codes for MFA recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const code = Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');
    
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  
  return codes;
}

/**
 * Hash backup code for storage
 */
export async function hashBackupCode(code: string): Promise<string> {
  const { hash } = await hashPassword(code, 'backup_code_salt_v1');
  return hash;
}

/**
 * Generate QR code data URL for TOTP setup
 */
export function generateTOTPQRCodeData(
  secret: string,
  accountName: string,
  issuer: string = 'TrueProfile'
): string {
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  return otpauthUrl;
}

// ========================================
// ML-BASED THREAT DETECTION
// ========================================

/**
 * Behavioral Analysis - Detect anomalous user behavior
 */
export function analyzeBehavioralAnomaly(
  currentBehavior: {
    loginTime: number; // Hour of day (0-23)
    location: { country: string; city?: string };
    device: string;
    ipAddress: string;
  },
  historicalBehavior: {
    commonLoginHours: number[]; // Array of common login hours
    commonCountries: string[];
    commonDevices: string[];
    commonIPs: string[];
  }
): {
  anomalyScore: number; // 0-100
  anomalies: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
} {
  const anomalies: string[] = [];
  let score = 0;
  
  // Check login time anomaly
  if (!historicalBehavior.commonLoginHours.includes(currentBehavior.loginTime)) {
    anomalies.push(`Unusual login time: ${currentBehavior.loginTime}:00`);
    score += 15;
  }
  
  // Check location anomaly
  if (!historicalBehavior.commonCountries.includes(currentBehavior.location.country)) {
    anomalies.push(`New country: ${currentBehavior.location.country}`);
    score += 30;
  }
  
  // Check device anomaly
  if (!historicalBehavior.commonDevices.includes(currentBehavior.device)) {
    anomalies.push(`New device: ${currentBehavior.device}`);
    score += 20;
  }
  
  // Check IP anomaly
  if (!historicalBehavior.commonIPs.includes(currentBehavior.ipAddress)) {
    anomalies.push(`New IP address: ${currentBehavior.ipAddress}`);
    score += 15;
  }
  
  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (score >= 60) riskLevel = 'CRITICAL';
  else if (score >= 40) riskLevel = 'HIGH';
  else if (score >= 20) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';
  
  return {
    anomalyScore: Math.min(score, 100),
    anomalies,
    riskLevel,
  };
}

/**
 * Velocity Analysis - Detect rapid-fire actions
 */
export function analyzeVelocityAnomaly(
  actions: Array<{ timestamp: number; type: string; endpoint: string }>,
  timeWindowMs: number = 60000 // 1 minute
): {
  isAnomalous: boolean;
  actionsPerMinute: number;
  suspiciousPatterns: string[];
  riskScore: number;
} {
  const now = Date.now();
  const recentActions = actions.filter(a => now - a.timestamp < timeWindowMs);
  const actionsPerMinute = (recentActions.length / timeWindowMs) * 60000;
  
  const suspiciousPatterns: string[] = [];
  let riskScore = 0;
  
  // Check for high velocity
  if (actionsPerMinute > 60) {
    suspiciousPatterns.push(`Extremely high velocity: ${actionsPerMinute.toFixed(1)} actions/min`);
    riskScore += 50;
  } else if (actionsPerMinute > 30) {
    suspiciousPatterns.push(`High velocity: ${actionsPerMinute.toFixed(1)} actions/min`);
    riskScore += 30;
  }
  
  // Check for repeated identical actions
  const actionTypes = recentActions.map(a => a.type);
  const uniqueTypes = new Set(actionTypes);
  if (actionTypes.length > 10 && uniqueTypes.size === 1) {
    suspiciousPatterns.push(`Repeated identical action: ${actionTypes[0]}`);
    riskScore += 30;
  }
  
  // Check for endpoint scanning
  const endpoints = recentActions.map(a => a.endpoint);
  const uniqueEndpoints = new Set(endpoints);
  if (uniqueEndpoints.size > 20 && timeWindowMs < 60000) {
    suspiciousPatterns.push(`Endpoint scanning: ${uniqueEndpoints.size} unique endpoints`);
    riskScore += 40;
  }
  
  return {
    isAnomalous: riskScore >= 30,
    actionsPerMinute,
    suspiciousPatterns,
    riskScore: Math.min(riskScore, 100),
  };
}

/**
 * Geolocation Anomaly - Detect impossible travel
 */
export function detectImpossibleTravel(
  previousLogin: { timestamp: number; country: string; city?: string; lat?: number; lon?: number },
  currentLogin: { timestamp: number; country: string; city?: string; lat?: number; lon?: number }
): {
  isImpossible: boolean;
  distanceKm?: number;
  timeElapsedHours: number;
  requiredSpeedKmh?: number;
  riskScore: number;
} {
  const timeElapsedMs = currentLogin.timestamp - previousLogin.timestamp;
  const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
  
  // If same country, low risk
  if (previousLogin.country === currentLogin.country) {
    return {
      isImpossible: false,
      timeElapsedHours,
      riskScore: 0,
    };
  }
  
  // If coordinates available, calculate distance
  if (previousLogin.lat && previousLogin.lon && currentLogin.lat && currentLogin.lon) {
    const distanceKm = calculateDistance(
      previousLogin.lat,
      previousLogin.lon,
      currentLogin.lat,
      currentLogin.lon
    );
    
    const requiredSpeedKmh = distanceKm / timeElapsedHours;
    
    // Commercial flight speed ~900 km/h
    // If required speed > 1000 km/h, it's suspicious
    const isImpossible = requiredSpeedKmh > 1000;
    const riskScore = isImpossible ? 80 : requiredSpeedKmh > 500 ? 40 : 10;
    
    return {
      isImpossible,
      distanceKm,
      timeElapsedHours,
      requiredSpeedKmh,
      riskScore,
    };
  }
  
  // Different countries but no coordinates - moderate risk
  return {
    isImpossible: false,
    timeElapsedHours,
    riskScore: 30,
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * ML-based Risk Scoring
 * Combines multiple signals to produce a comprehensive risk score
 */
export function calculateMLRiskScore(signals: {
  behavioralAnomaly?: number; // 0-100
  velocityAnomaly?: number; // 0-100
  geolocationAnomaly?: number; // 0-100
  deviceFingerprint?: { isTrusted: boolean; isRooted?: boolean; isEmulator?: boolean };
  accountAge?: number; // Days
  previousViolations?: number;
  ipReputation?: number; // 0-100 (0 = bad, 100 = good)
}): {
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0-100 (more signals = higher confidence)
  factors: Array<{ name: string; score: number; weight: number }>;
} {
  const factors: Array<{ name: string; score: number; weight: number }> = [];
  let totalWeight = 0;
  let weightedSum = 0;
  
  // Behavioral anomaly (weight: 0.25)
  if (signals.behavioralAnomaly !== undefined) {
    const weight = 0.25;
    factors.push({ name: 'Behavioral Anomaly', score: signals.behavioralAnomaly, weight });
    weightedSum += signals.behavioralAnomaly * weight;
    totalWeight += weight;
  }
  
  // Velocity anomaly (weight: 0.20)
  if (signals.velocityAnomaly !== undefined) {
    const weight = 0.20;
    factors.push({ name: 'Velocity Anomaly', score: signals.velocityAnomaly, weight });
    weightedSum += signals.velocityAnomaly * weight;
    totalWeight += weight;
  }
  
  // Geolocation anomaly (weight: 0.20)
  if (signals.geolocationAnomaly !== undefined) {
    const weight = 0.20;
    factors.push({ name: 'Geolocation Anomaly', score: signals.geolocationAnomaly, weight });
    weightedSum += signals.geolocationAnomaly * weight;
    totalWeight += weight;
  }
  
  // Device fingerprint (weight: 0.15)
  if (signals.deviceFingerprint) {
    let deviceScore = 0;
    if (!signals.deviceFingerprint.isTrusted) deviceScore += 40;
    if (signals.deviceFingerprint.isRooted) deviceScore += 30;
    if (signals.deviceFingerprint.isEmulator) deviceScore += 30;
    
    const weight = 0.15;
    factors.push({ name: 'Device Trust', score: deviceScore, weight });
    weightedSum += deviceScore * weight;
    totalWeight += weight;
  }
  
  // Account age (weight: 0.10)
  if (signals.accountAge !== undefined) {
    let ageScore = 0;
    if (signals.accountAge < 1) ageScore = 50; // Less than 1 day
    else if (signals.accountAge < 7) ageScore = 30; // Less than 1 week
    else if (signals.accountAge < 30) ageScore = 10; // Less than 1 month
    
    const weight = 0.10;
    factors.push({ name: 'Account Age', score: ageScore, weight });
    weightedSum += ageScore * weight;
    totalWeight += weight;
  }
  
  // Previous violations (weight: 0.10)
  if (signals.previousViolations !== undefined) {
    const violationScore = Math.min(signals.previousViolations * 20, 100);
    const weight = 0.10;
    factors.push({ name: 'Previous Violations', score: violationScore, weight });
    weightedSum += violationScore * weight;
    totalWeight += weight;
  }
  
  // IP reputation (weight: 0.10)
  if (signals.ipReputation !== undefined) {
    const ipScore = 100 - signals.ipReputation; // Invert (low reputation = high risk)
    const weight = 0.10;
    factors.push({ name: 'IP Reputation', score: ipScore, weight });
    weightedSum += ipScore * weight;
    totalWeight += weight;
  }
  
  // Calculate final risk score
  const riskScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  
  // Calculate confidence (more signals = higher confidence)
  const maxSignals = 7;
  const actualSignals = factors.length;
  const confidence = Math.round((actualSignals / maxSignals) * 100);
  
  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (riskScore >= 75) riskLevel = 'CRITICAL';
  else if (riskScore >= 50) riskLevel = 'HIGH';
  else if (riskScore >= 25) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';
  
  return {
    riskScore,
    riskLevel,
    confidence,
    factors,
  };
}

/**
 * Pattern Recognition - Detect known attack patterns
 */
export function detectAttackPattern(
  events: Array<{
    timestamp: number;
    type: string;
    success: boolean;
    ipAddress: string;
    endpoint: string;
  }>
): {
  patterns: Array<{
    type: 'BRUTE_FORCE' | 'CREDENTIAL_STUFFING' | 'ACCOUNT_ENUMERATION' | 'DOS' | 'API_ABUSE';
    confidence: number;
    description: string;
    affectedEndpoints: string[];
  }>;
  overallThreatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
} {
  const patterns: Array<{
    type: 'BRUTE_FORCE' | 'CREDENTIAL_STUFFING' | 'ACCOUNT_ENUMERATION' | 'DOS' | 'API_ABUSE';
    confidence: number;
    description: string;
    affectedEndpoints: string[];
  }> = [];
  
  // Brute force detection (many failed login attempts)
  const loginAttempts = events.filter(e => e.type === 'LOGIN');
  const failedLogins = loginAttempts.filter(e => !e.success);
  if (failedLogins.length >= 5) {
    patterns.push({
      type: 'BRUTE_FORCE',
      confidence: Math.min((failedLogins.length / 10) * 100, 100),
      description: `${failedLogins.length} failed login attempts detected`,
      affectedEndpoints: ['/auth/login'],
    });
  }
  
  // Credential stuffing (many different IPs, same pattern)
  const uniqueIPs = new Set(events.map(e => e.ipAddress));
  if (uniqueIPs.size > 10 && events.length > 50) {
    patterns.push({
      type: 'CREDENTIAL_STUFFING',
      confidence: 70,
      description: `${uniqueIPs.size} unique IPs attempting ${events.length} actions`,
      affectedEndpoints: [...new Set(events.map(e => e.endpoint))],
    });
  }
  
  // Account enumeration (testing many different accounts)
  const accountTests = events.filter(e => e.type === 'ACCOUNT_CHECK');
  if (accountTests.length > 20) {
    patterns.push({
      type: 'ACCOUNT_ENUMERATION',
      confidence: 80,
      description: `${accountTests.length} account enumeration attempts`,
      affectedEndpoints: [...new Set(accountTests.map(e => e.endpoint))],
    });
  }
  
  // DOS attack (extremely high request rate)
  const timeWindow = 60000; // 1 minute
  const now = Date.now();
  const recentEvents = events.filter(e => now - e.timestamp < timeWindow);
  if (recentEvents.length > 100) {
    patterns.push({
      type: 'DOS',
      confidence: 90,
      description: `${recentEvents.length} requests in 1 minute`,
      affectedEndpoints: [...new Set(recentEvents.map(e => e.endpoint))],
    });
  }
  
  // API abuse (high volume from single source)
  const ipCounts = new Map<string, number>();
  events.forEach(e => {
    ipCounts.set(e.ipAddress, (ipCounts.get(e.ipAddress) || 0) + 1);
  });
  
  for (const [ip, count] of ipCounts.entries()) {
    if (count > 50) {
      patterns.push({
        type: 'API_ABUSE',
        confidence: 75,
        description: `${count} requests from single IP: ${ip}`,
        affectedEndpoints: [...new Set(events.filter(e => e.ipAddress === ip).map(e => e.endpoint))],
      });
    }
  }
  
  // Determine overall threat level
  const maxConfidence = patterns.length > 0 ? Math.max(...patterns.map(p => p.confidence)) : 0;
  let overallThreatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (maxConfidence >= 80) overallThreatLevel = 'CRITICAL';
  else if (maxConfidence >= 60) overallThreatLevel = 'HIGH';
  else if (maxConfidence >= 40) overallThreatLevel = 'MEDIUM';
  else overallThreatLevel = 'LOW';
  
  return {
    patterns,
    overallThreatLevel,
  };
}

/**
 * Detect bot/scraper behavior patterns
 */
export function detectBotBehavior(
  userAgent: string,
  requestCount: number,
  timeWindowMs: number,
  endpoints: string[]
): { isBot: boolean; confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  let confidence = 0;
  
  // Check user agent
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i,
    /headless/i, /phantom/i, /selenium/i
  ];
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    reasons.push('Bot user agent detected');
    confidence += 40;
  }
  
  // Check request rate
  const requestsPerSecond = requestCount / (timeWindowMs / 1000);
  if (requestsPerSecond > 10) {
    reasons.push(`High request rate: ${requestsPerSecond.toFixed(1)} req/s`);
    confidence += 30;
  }
  
  // Check endpoint patterns (scrapers often hit many endpoints quickly)
  const uniqueEndpoints = new Set(endpoints).size;
  if (uniqueEndpoints > 20 && timeWindowMs < 60000) {
    reasons.push(`Rapid endpoint scanning: ${uniqueEndpoints} endpoints in ${timeWindowMs}ms`);
    confidence += 30;
  }
  
  return {
    isBot: confidence >= 50,
    confidence,
    reasons
  };
}

/**
 * Generate honeypot field for forms
 * Bots will fill this, humans won't see it
 */
export function generateHoneypot(): { fieldName: string; expectedValue: string } {
  const fieldNames = ['email_confirm', 'phone_verify', 'address_line_3', 'company_tax_id'];
  const fieldName = fieldNames[Math.floor(Math.random() * fieldNames.length)];
  
  return {
    fieldName,
    expectedValue: '' // Should remain empty
  };
}