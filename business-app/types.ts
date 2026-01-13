// ============================================
// CHARGEBACK SHIELD - TYPE DEFINITIONS
// Comprehensive fraud prevention platform types
// ============================================

// ============ USER & ACCOUNT TYPES ============

// Business user account details
export interface BusinessUser {
  _id: string;
  email: string;
  businessName: string;
  role: "business_user" | "business_admin";
  accountType: "business";
  tier: "free" | "pro" | "enterprise";
  verified: boolean;
  createdAt: number;
  shopifyStoreId?: string;
  stripeAccountId?: string;
  paypalAccountId?: string;
  telegramId?: string;
  webhookUrl?: string;
  apiKey?: string;
}

// ============ ORDER & TRANSACTION TYPES ============

// Order data for scanning
export interface OrderData {
  _id: string;
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  customerCountry: string;
  customerCity?: string;
  customerIP?: string;
  shippingAddress?: string;
  billingAddress?: string;
  paymentMethod: "card" | "paypal" | "bank" | "crypto" | "bnpl";
  cardLast4?: string;
  cardBrand?: string;
  timestamp: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "returned" | "refunded" | "blocked";
  riskScore?: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  riskFactors?: RiskFactor[];
  deviceFingerprint?: string;
  sessionId?: string;
}

// Risk factor breakdown
export interface RiskFactor {
  type: string;
  description: string;
  score: number;
  severity: "low" | "medium" | "high" | "critical";
}

// ============ FRAUD DETECTION TYPES ============

// AI-powered fraud score result
export interface FraudScoreResult {
  overallScore: number; // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendation: "approve" | "review" | "decline" | "block";
  confidence: number;
  factors: RiskFactor[];
  timestamp: number;
}

// Device fingerprint data
export interface DeviceFingerprint {
  _id: string;
  fingerprintHash: string;
  deviceType: "desktop" | "mobile" | "tablet" | "bot";
  browser: string;
  operatingSystem: string;
  screenResolution: string;
  timezone: string;
  language: string;
  ipAddress: string;
  vpnDetected: boolean;
  proxyDetected: boolean;
  torDetected: boolean;
  botDetected: boolean;
  firstSeen: number;
  lastSeen: number;
  orderCount: number;
  chargebackCount: number;
  riskScore: number;
}

// Velocity check result
export interface VelocityCheck {
  ordersLast24h: number;
  ordersLast7d: number;
  ordersLast30d: number;
  uniqueCardsUsed: number;
  uniqueIPsUsed: number;
  uniqueDevicesUsed: number;
  totalAmountLast24h: number;
  averageOrderValue: number;
  flags: string[];
}

// Geographic risk assessment
export interface GeoRiskAssessment {
  country: string;
  countryRiskLevel: "low" | "medium" | "high" | "critical";
  city: string;
  ipCountry: string;
  billingCountry: string;
  shippingCountry: string;
  countryMismatch: boolean;
  highRiskRegion: boolean;
  distanceKm?: number;
  flags: string[];
}

// ============ DARK WEB MONITORING TYPES ============

// Dark web monitoring scan
export interface DarkWebScan {
  _id: string;
  businessId: string;
  scanType: "email" | "phone" | "card" | "domain" | "credential";
  searchValue: string;
  maskedValue: string;
  status: "pending" | "scanning" | "completed" | "error";
  breachesFound: number;
  lastScanned: number;
  breaches: DarkWebBreach[];
}

// Dark web breach record
export interface DarkWebBreach {
  _id: string;
  breachName: string;
  breachDate: number;
  discoveredDate: number;
  source: string;
  dataTypes: string[]; // email, password, phone, card, etc.
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  affectedRecords: number;
  verified: boolean;
}

// Customer dark web exposure
export interface CustomerExposure {
  _id: string;
  customerId: string;
  customerEmail: string;
  exposureScore: number; // 0-100
  totalBreaches: number;
  passwordsExposed: number;
  cardsExposed: number;
  lastChecked: number;
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
  recommendations: string[];
}

// ============ CUSTOMER INTELLIGENCE TYPES ============

// Customer risk profile
export interface CustomerProfile {
  _id: string;
  customerId: string;
  email: string;
  name: string;
  phone?: string;
  // Risk metrics
  riskScore: number;
  riskLevel: "trusted" | "low" | "medium" | "high" | "blocked";
  trustScore: number;
  // Order history
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderDate: number;
  lastOrderDate: number;
  // Chargeback history
  chargebackCount: number;
  chargebackRate: number;
  disputesWon: number;
  disputesLost: number;
  // Flags
  isBlacklisted: boolean;
  isWhitelisted: boolean;
  isVIP: boolean;
  notes?: string;
  tags: string[];
  // Verification
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  // Dark web
  darkWebExposure: number;
  breachCount: number;
}

// Blacklist/Whitelist entry
export interface ListEntry {
  _id: string;
  type: "email" | "phone" | "ip" | "device" | "card" | "address";
  value: string;
  maskedValue: string;
  listType: "blacklist" | "whitelist" | "watchlist";
  reason: string;
  addedBy: string;
  addedAt: number;
  expiresAt?: number;
  hitCount: number;
  lastHit?: number;
}

// ============ CHARGEBACK & DISPUTE TYPES ============

// Chargeback/Dispute record
export interface DisputeRecord {
  _id: string;
  orderId: string;
  orderAmount: number;
  chargebackDate: number;
  amount: number;
  currency: string;
  reason: string;
  reasonCode: string;
  category: "fraud" | "product" | "service" | "duplicate" | "subscription" | "other";
  status: "alert" | "filed" | "evidence_submitted" | "under_review" | "won" | "lost" | "refunded";
  evidencePackageId?: string;
  dueDate?: number;
  customerEmail: string;
  customerName: string;
  paymentProcessor: "stripe" | "paypal" | "square" | "adyen" | "other";
  cardBrand?: string;
  cardLast4?: string;
  notes?: string;
  timeline: DisputeTimelineEvent[];
}

// Dispute timeline event
export interface DisputeTimelineEvent {
  date: number;
  event: string;
  description: string;
  automated: boolean;
}

// Evidence for dispute submission
export interface EvidencePackage {
  _id: string;
  disputeId: string;
  // Documents
  receipt: string;
  invoice?: string;
  shippingProof?: string;
  deliveryConfirmation?: string;
  trackingNumber?: string;
  signatureProof?: string;
  customerCommunication?: string;
  termsOfService?: string;
  refundPolicy?: string;
  productDescription?: string;
  customerPhoto?: string;
  ipLogs?: string;
  deviceInfo?: string;
  // Status
  completeness: number; // 0-100%
  submittedDate?: number;
  status: "draft" | "ready" | "submitted" | "accepted" | "rejected";
  aiSuggestions?: string[];
  winProbability?: number;
}

// Pre-chargeback alert (Ethoca/Verifi style)
export interface PreChargebackAlert {
  _id: string;
  alertId: string;
  alertType: "ethoca" | "verifi" | "rdr" | "cdrn";
  orderId: string;
  amount: number;
  customerEmail: string;
  cardLast4: string;
  alertDate: number;
  expiresAt: number;
  status: "pending" | "refunded" | "accepted" | "expired";
  resolution?: "refund" | "accept" | "ignore";
  savedChargeback: boolean;
}

// ============ INTEGRATION TYPES ============

// Platform integration
export interface Integration {
  _id: string;
  platform: "shopify" | "stripe" | "paypal" | "woocommerce" | "bigcommerce" | "square" | "adyen";
  status: "connected" | "disconnected" | "error" | "pending";
  accountId?: string;
  accountName?: string;
  connectedAt?: number;
  lastSync?: number;
  ordersImported: number;
  webhookActive: boolean;
  permissions: string[];
  errorMessage?: string;
}

// Webhook event
export interface WebhookEvent {
  _id: string;
  eventType: string;
  source: string;
  payload: any;
  processedAt: number;
  status: "received" | "processed" | "failed";
  errorMessage?: string;
}

// ============ ANALYTICS TYPES ============

// Analytics metrics for business
export interface AnalyticsMetrics {
  // Order metrics
  totalOrdersScanned: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  totalRevenue: number;
  // Fraud prevention
  chargebacksBlocked: number;
  fraudOrdersBlocked: number;
  highRiskOrdersReviewed: number;
  autoBlockedOrders: number;
  // Chargeback metrics
  chargebacksFiled: number;
  chargebackRate: number;
  chargebackRateTrend: number; // +/- vs last period
  industryAverageRate: number;
  // Dispute metrics
  disputesWon: number;
  disputesLost: number;
  disputesPending: number;
  winRate: number;
  averageRecoveryTime: number;
  // Financial
  totalSavings: number;
  savingsThisMonth: number;
  moneyRecovered: number;
  lossesAvoided: number;
  roi: number;
  // Dark web
  darkWebScansCompleted: number;
  breachesDetected: number;
  customersAtRisk: number;
}

// Analytics time series data point
export interface AnalyticsDataPoint {
  date: string;
  orders: number;
  revenue: number;
  blocked: number;
  chargebacks: number;
  savings: number;
}

// ============ ALERT TYPES ============

// Recent alert/activity
export interface RecentAlert {
  _id: string;
  type: "order_flagged" | "chargeback_filed" | "dispute_won" | "dispute_lost" | 
        "dark_web_breach" | "customer_blocked" | "integration_status" | 
        "pre_chargeback" | "velocity_alert" | "high_risk_region";
  title: string;
  description: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  timestamp: number;
  read: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// ============ RULE ENGINE TYPES ============

// Custom fraud rule
export interface FraudRule {
  _id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  action: "block" | "review" | "flag" | "allow";
  createdAt: number;
  updatedAt: number;
  triggerCount: number;
  lastTriggered?: number;
}

// Rule condition
export interface RuleCondition {
  field: string;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "in_list";
  value: string | number | string[];
}

// ============ NOTIFICATION SETTINGS ============

// Notification preferences
export interface NotificationSettings {
  emailAlerts: boolean;
  pushAlerts: boolean;
  smsAlerts: boolean;
  // Alert types
  highRiskOrders: boolean;
  chargebackFiled: boolean;
  disputeUpdates: boolean;
  darkWebBreaches: boolean;
  preChargebackAlerts: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  // Thresholds
  riskScoreThreshold: number;
  amountThreshold: number;
}