import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * TrueProfile Pro Database Schema
 * Stores user profiles, scan results, scam reports, and community data
 * Compliant with Australian Privacy Principles (APP)
 */
export default defineSchema({
  ...authTables,
  
  // Custom auth tables (simple password auth without OIDC)
  passwords: defineTable({
    userId: v.id("users"),
    passwordHash: v.string(),
    salt: v.optional(v.string()), // Salt for password hashing
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_token", ["token"]),

  passwordResetTokens: defineTable({
    userId: v.id("users"),
    email: v.string(),

    // We store a hash of the code (not the code itself).
    codeHash: v.string(),

    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_expires_at", ["expiresAt"]),

  // Extended users table with onboarding info
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()),
    role: v.optional(v.string()), // "user" | "admin" | "superadmin" | "business_user" - Controls access (defaults to "user")
    accountType: v.optional(v.string()), // "personal" | "business" | "charity" | "community" - User segment (business = B2B chargeback app)
    userMode: v.optional(v.string()), // "personal" | "business_b2c" | "charity" | "community" | "b2b" - Controls the UI mode (dashboards + navigation)
    businessName: v.optional(v.string()),
    userPurpose: v.optional(v.string()),
    isCharity: v.optional(v.boolean()),
    onboardingCompleted: v.optional(v.boolean()),
    totalScans: v.optional(v.float64()),
    realProfiles: v.optional(v.float64()),
    suspiciousProfiles: v.optional(v.float64()),
    fakeProfiles: v.optional(v.float64()),
    estimatedSavings: v.optional(v.float64()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    emailVerificationTime: v.optional(v.float64()),
    phoneVerificationTime: v.optional(v.float64()),
    createdAt: v.optional(v.float64()),
    // Subscription & billing
    subscriptionTier: v.optional(v.string()), // "free" | "basic" | "pro" | "business" | "enterprise"
    subscriptionStatus: v.optional(v.string()), // "active" | "canceled" | "expired" | "trialing"
    scansThisMonth: v.optional(v.number()), // Current month usage
    scanLimit: v.optional(v.number()), // Monthly scan limit based on tier
    subscriptionStartedAt: v.optional(v.number()),
    subscriptionEndsAt: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("email", ["email"]),
  
  // Profile scan records
  scans: defineTable({
    userId: v.id("users"),
    profileUrl: v.optional(v.string()),
    profileName: v.optional(v.string()),
    platform: v.string(), // "facebook", "instagram", "twitter", "linkedin"
    trustScore: v.number(), // 0-100
    riskLevel: v.optional(v.string()), // "real", "suspicious", "fake"
    status: v.optional(v.string()), // "pending", "analyzing", "complete", "error"
    // Analysis results
    insights: v.optional(v.array(v.object({
      type: v.string(), // "warning", "info", "positive"
      text: v.string(),
    }))),
    scamPhrases: v.optional(v.array(v.string())),
    // Flags found during analysis
    hasSyntheticFace: v.optional(v.boolean()),
    hasScamPhrases: v.optional(v.boolean()),
    accountAge: v.optional(v.string()),
    engagementPattern: v.optional(v.string()),
    // Meta
    createdAt: v.number(),
    scannedAt: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"]),
  
  // Security scans (link, email, SMS, phone, document, image)
  securityScans: defineTable({
    userId: v.id("users"),
    scanType: v.string(), // "link", "email", "sms", "phone", "document", "image"
    input: v.string(), // The URL/email/phone/message that was scanned
    score: v.number(), // 0-100 safety/trust score
    riskLevel: v.string(), // "safe", "suspicious", "dangerous", "scam", "fake", "legitimate", "authentic"
    findings: v.array(v.string()), // Array of detected issues or confirmations
    scannedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_type", ["scanType"]),
  
  // Scam reports for community safety
  scamReports: defineTable({
    scanId: v.optional(v.id("scans")),
    reporterId: v.optional(v.id("users")), // Optional for anonymous reports
    profileUrl: v.optional(v.string()),
    platform: v.optional(v.string()),
    scamType: v.string(), // "fake_profile", "phishing", "impersonation", "fraud"
    trustScore: v.optional(v.number()),
    scamPhrases: v.optional(v.array(v.string())),
    reporterEmail: v.optional(v.string()),
    description: v.optional(v.string()),
    additionalNotes: v.optional(v.string()),
    postcode: v.optional(v.string()), // AU postcode for mapping
    state: v.optional(v.string()), // AU state
    affectedFinancially: v.optional(v.boolean()),
    lossAmount: v.optional(v.number()),
    isVerified: v.optional(v.boolean()),
    status: v.optional(v.string()), // "submitted", "verified", "resolved"
    reportedAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
  }).index("by_postcode", ["postcode"])
    .index("by_scam_type", ["scamType"]),
  
  // Trending scam phrases from ACCC data
  scamPhrases: defineTable({
    phrase: v.string(),
    category: v.string(), // "visa", "investment", "romance", "crypto"
    frequency: v.number(), // How often seen this week
    isActive: v.boolean(),
    examples: v.optional(v.array(v.string())),
    lastUpdated: v.number(),
  }).index("by_category", ["category"])
    .index("by_frequency", ["frequency"]),
  
  // Verified leads (profiles user has marked as real)
  verifiedLeads: defineTable({
    userId: v.id("users"),
    scanId: v.id("scans"),
    profileName: v.optional(v.string()),
    profileUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    addedAt: v.number(),
  }).index("by_user", ["userId"]),
  
  // Trust Index metrics (AU-wide statistics)
  trustMetrics: defineTable({
    metricType: v.string(), // "daily_summary", "weekly_summary"
    date: v.string(),
    totalScans: v.number(),
    realProfilePercentage: v.number(),
    topScamCategory: v.optional(v.string()),
    totalReports: v.optional(v.number()),
  }).index("by_type_date", ["metricType", "date"]),
  
  // API Usage tracking for quota monitoring
  apiUsage: defineTable({
    userId: v.id("users"),
    apiService: v.string(), // "numverify", "google_safe_browsing", "abstract_email", "google_vision", "a0_llm"
    endpoint: v.optional(v.string()), // Specific endpoint called
    requestType: v.string(), // "phone", "link", "email", "image", "profile", "sms"
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    quotaRemaining: v.optional(v.number()),
    quotaLimit: v.optional(v.number()),
    costEstimate: v.optional(v.number()), // In cents
    responseTime: v.optional(v.number()), // In milliseconds
    timestamp: v.number(),
  }).index("by_user", ["userId"])
    .index("by_service", ["apiService"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user_service", ["userId", "apiService"]),
  
  // API Keys configuration (encrypted in production)
  apiKeys: defineTable({
    service: v.string(), // "numverify", "google_safe_browsing", etc.
    apiKey: v.string(), // The actual API key (encrypted in production)
    keyName: v.string(),
    isActive: v.boolean(),
    testStatus: v.optional(v.string()), // "untested", "valid", "invalid", "expired"
    lastTestedAt: v.optional(v.number()),
    quotaLimit: v.optional(v.number()), // Monthly or daily limit
    quotaPeriod: v.optional(v.string()), // "daily", "monthly"
    usageCount: v.optional(v.number()),
    lastResetAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_service", ["service"])
    .index("by_active", ["isActive"]),
  
  // Download/Export analytics
  exports: defineTable({
    userId: v.id("users"),
    exportType: v.string(), // "csv", "pdf_audit", "pdf_monthly", "pdf_client", "pdf_compliance"
    recordCount: v.number(),
    filters: v.optional(v.object({
      riskLevel: v.optional(v.string()),
      platform: v.optional(v.string()),
      dateRange: v.optional(v.string()),
    })),
    fileSize: v.optional(v.number()), // In bytes
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_type", ["exportType"])
    .index("by_timestamp", ["createdAt"]),
  
  // Bulk profile scans (CSV upload, batch processing)
  bulkScans: defineTable({
    userId: v.id("users"),
    jobId: v.string(), // Unique job identifier
    status: v.string(), // "pending", "processing", "completed", "failed", "canceled"
    totalProfiles: v.number(),
    processedCount: v.number(),
    successCount: v.number(),
    failureCount: v.number(),
    results: v.array(v.object({
      profileUrl: v.string(),
      profileName: v.optional(v.string()),
      platform: v.string(),
      trustScore: v.number(),
      riskLevel: v.string(),
      flags: v.array(v.string()),
      scannedAt: v.number(),
      error: v.optional(v.string()),
    })),
    fileName: v.optional(v.string()),
    source: v.optional(v.string()), // "csv_upload", "manual_paste", "api"
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_job_id", ["jobId"])
    .index("by_status", ["status"]),
  
  // Watchlist for profile monitoring (24/7 tracking)
  watchlist: defineTable({
    userId: v.id("users"),
    profileUrl: v.string(),
    profileName: v.optional(v.string()),
    platform: v.string(), // "facebook", "instagram", "twitter", "linkedin"
    checkFrequency: v.string(), // "hourly", "daily", "weekly"
    lastCheckedAt: v.optional(v.number()),
    nextCheckAt: v.optional(v.number()),
    alertsCount: v.number(),
    status: v.string(), // "active", "paused", "alerting", "error"
    initialTrustScore: v.number(),
    currentTrustScore: v.number(),
    addedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_next_check", ["nextCheckAt"]),
  
  // Profile snapshots (historical data for monitoring)
  profileSnapshots: defineTable({
    watchlistId: v.id("watchlist"),
    profileUrl: v.string(),
    snapshotData: v.object({
      bio: v.optional(v.string()),
      followersCount: v.optional(v.number()),
      followingCount: v.optional(v.number()),
      postsCount: v.optional(v.number()),
      profilePicUrl: v.optional(v.string()),
      location: v.optional(v.string()),
      verified: v.optional(v.boolean()),
      website: v.optional(v.string()),
      joinedDate: v.optional(v.string()),
    }),
    trustScore: v.number(),
    riskLevel: v.string(),
    flags: v.array(v.string()),
    capturedAt: v.number(),
  }).index("by_watchlist", ["watchlistId"])
    .index("by_captured_at", ["capturedAt"]),
  
  // Monitoring alerts (change detection notifications)
  monitoringAlerts: defineTable({
    userId: v.id("users"),
    watchlistId: v.id("watchlist"),
    profileUrl: v.string(),
    profileName: v.optional(v.string()),
    alertType: v.string(), // "bio_changed", "follower_spike", "follower_drop", "trust_drop", "suspicious_activity", "profile_deleted", "account_private"
    severity: v.string(), // "low", "medium", "high", "critical"
    title: v.string(),
    details: v.string(),
    oldValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    read: v.boolean(),
    dismissed: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"])
    .index("by_watchlist", ["watchlistId"])
    .index("by_severity", ["severity"]),
  
  // Message scans (WhatsApp/SMS/text analysis)
  messageScans: defineTable({
    userId: v.id("users"),
    messageText: v.string(),
    source: v.optional(v.string()), // "whatsapp", "sms", "telegram", "manual", "screenshot"
    riskScore: v.number(), // 0-100
    riskLevel: v.string(), // "safe", "suspicious", "high_risk", "scam"
    detectedPatterns: v.array(v.object({
      type: v.string(), // "urgency", "impersonation", "phishing_link", "payment_request", "grammar_errors", "known_scam"
      description: v.string(),
      severity: v.string(), // "low", "medium", "high"
    })),
    extractedLinks: v.optional(v.array(v.string())),
    linkSafetyResults: v.optional(v.array(v.object({
      url: v.string(),
      safe: v.boolean(),
      reason: v.optional(v.string()),
    }))),
    extractedPhones: v.optional(v.array(v.string())),
    phoneValidationResults: v.optional(v.array(v.object({
      phone: v.string(),
      valid: v.boolean(),
      country: v.optional(v.string()),
      carrier: v.optional(v.string()),
      lineType: v.optional(v.string()), // "mobile", "landline", "voip"
      risk: v.optional(v.string()),
    }))),
    recommendation: v.string(), // "safe_to_proceed", "verify_manually", "do_not_respond", "block_sender", "report_to_authorities"
    reportedToAuthorities: v.optional(v.boolean()),
    scannedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_risk_level", ["riskLevel"])
    .index("by_scanned_at", ["scannedAt"]),
  
  // Contact scans (phone number health checks)
  contactScans: defineTable({
    userId: v.id("users"),
    jobId: v.string(), // Unique scan job ID
    status: v.string(), // "pending", "processing", "completed", "failed"
    totalContacts: v.number(),
    processedCount: v.number(),
    riskyContactsCount: v.number(),
    results: v.array(v.object({
      name: v.optional(v.string()),
      phoneNumber: v.string(),
      riskLevel: v.string(), // "safe", "suspicious", "high_risk", "known_scam"
      riskScore: v.number(), // 0-100
      reasons: v.array(v.string()),
      reportCount: v.optional(v.number()), // Times reported as scam
      country: v.optional(v.string()),
      carrier: v.optional(v.string()),
      lineType: v.optional(v.string()), // "mobile", "landline", "voip", "premium_rate"
      lastReported: v.optional(v.number()),
    })),
    source: v.optional(v.string()), // "device_contacts", "csv_upload"
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_job_id", ["jobId"])
    .index("by_status", ["status"]),
  
  // Community-reported scam numbers
  communityReports: defineTable({
    phoneNumber: v.string(),
    scamType: v.string(), // "impersonation", "phishing", "lottery", "tech_support", "tax_scam", "banking", "romance", "other"
    claimedToBeFrom: v.optional(v.string()), // e.g., "ATO", "NBN", "Bank"
    description: v.optional(v.string()),
    hadFinancialLoss: v.boolean(),
    lossAmount: v.number(),
    reportedBy: v.string(), // userId or "anonymous"
    reportedAt: v.number(),
    verified: v.boolean(), // Auto-verified after enough upvotes
    upvotes: v.number(),
    downvotes: v.number(),
  }).index("by_phone_number", ["phoneNumber"])
    .index("by_reported_at", ["reportedAt"])
    .index("by_verified", ["verified"]),
  
  // Aggregated phone number intelligence (combines all data sources)
  numberIntelligence: defineTable({
    phoneNumber: v.string(),
    totalReports: v.number(),
    uniqueReporters: v.number(),
    verifiedReports: v.number(),
    riskScore: v.number(), // 0-100
    mostCommonScamType: v.optional(v.string()),
    totalFinancialLoss: v.number(),
    lastReportedAt: v.number(),
    isVerified: v.boolean(), // At least 3 verified reports
    // External API data (cached)
    truecallerSpamScore: v.optional(v.number()),
    truecallerName: v.optional(v.string()),
    twilioValid: v.optional(v.boolean()),
    twilioLineType: v.optional(v.string()),
    twilioCarrier: v.optional(v.string()),
    ipqsFraudScore: v.optional(v.number()),
    ipqsIsVoip: v.optional(v.boolean()),
    lastApiCheckAt: v.optional(v.number()),
  }).index("by_phone_number", ["phoneNumber"])
    .index("by_risk_score", ["riskScore"])
    .index("by_last_reported", ["lastReportedAt"]),
  
  // External API cache (Layer 2)
  apiCache: defineTable({
    phoneNumber: v.string(),
    provider: v.union(v.literal("truecaller"), v.literal("ipqs"), v.literal("twilio")),
    result: v.any(),
    timestamp: v.number()
  })
    .index("by_phone_provider", ["phoneNumber", "provider"])
    .index("by_timestamp", ["timestamp"]),

  // Verification discrepancies (for learning)
  verificationDiscrepancies: defineTable({
    phoneNumber: v.string(),
    layer1Score: v.number(),
    layer2Score: v.number(),
    layer2Provider: v.string(),
    discrepancy: v.number(),
    timestamp: v.number()
  })
    .index("by_phone_number", ["phoneNumber"])
    .index("by_discrepancy", ["discrepancy"])
    .index("by_timestamp", ["timestamp"]),

  // User feedback on algorithm predictions (for training)
  numberFeedback: defineTable({
    userId: v.id("users"),
    phoneNumber: v.string(),
    weShowed: v.string(), // "safe", "suspicious", "high_risk", "known_scam"
    actualRiskLevel: v.string(), // What the user confirmed
    isCorrect: v.boolean(), // Were we right?
    feedback: v.optional(v.string()), // User explanation
    scamType: v.optional(v.string()), // Type of scam
    financialLoss: v.optional(v.number()),
    claimedToBeFrom: v.optional(v.string()), // "ATO", "Bank", etc.
    contactName: v.optional(v.string()),
    callFrequency: v.optional(v.string()), // "one_time", "daily", etc.
    contactWasSaved: v.optional(v.boolean()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_phone", ["phoneNumber"])
    .index("by_timestamp", ["timestamp"]),

  // SMS Auto-Scan Settings (User Permissions & Preferences)
  smsAutoScanSettings: defineTable({
    userId: v.id("users"),
    isEnabled: v.boolean(), // Master toggle: is auto-scan ON?
    permissionGranted: v.boolean(), // Has user granted SMS permission?
    permissionRequestedAt: v.optional(v.number()), // When was permission first requested?
    permissionGrantedAt: v.optional(v.number()), // When did user accept permission?
    sendAlerts: v.boolean(), // Send push notifications for detected scams?
    alertThreshold: v.string(), // "suspicious", "high_risk", "scam" - Which scams trigger alert?
    whitelistedContacts: v.array(v.string()), // Phone numbers to never scan (trusted contacts)
    whitelistedKeywords: v.array(v.string()), // Messages containing these keywords won't be scanned
    scanningStartTime: v.optional(v.number()), // Hour (0-23) when auto-scan starts
    scanningEndTime: v.optional(v.number()), // Hour (0-23) when auto-scan ends
    storeScannedMessages: v.boolean(), // Store full message text in history? (privacy control)
    lastScanAt: v.optional(v.number()),
    totalMessagesScanned: v.number(), // Cumulative count
    totalScamsDetected: v.number(), // Cumulative count
    enabledAt: v.optional(v.number()),
    disabledAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_enabled", ["isEnabled"]),

  // Investment Scam Detector ($945M market)
  investmentScans: defineTable({
    userId: v.id("users"),
    scanType: v.string(), // "crypto_wallet", "investment_platform", "trading_app", "financial_advisor", "guaranteed_returns"
    input: v.string(), // Wallet address, URL, or platform name
    riskScore: v.number(), // 0-100
    riskLevel: v.string(), // "safe", "suspicious", "high_risk", "scam"
    // Investment-specific flags
    isLicensedASIC: v.optional(v.boolean()), // Australian Securities & Investments Commission
    asicLicenseNumber: v.optional(v.string()),
    domainAge: v.optional(v.number()), // Days since domain created
    hasSSLCertificate: v.optional(v.boolean()),
    guaranteedReturnsLanguage: v.optional(v.boolean()), // Red flag: "guaranteed 20% monthly"
    pressureToInvest: v.optional(v.boolean()), // Red flag: "limited time", "act now"
    // Crypto-specific
    walletAddress: v.optional(v.string()),
    walletBlockchain: v.optional(v.string()), // "bitcoin", "ethereum", "binance_smart_chain"
    walletReportCount: v.optional(v.number()), // Times reported as scam
    walletTransactionCount: v.optional(v.number()),
    walletBalance: v.optional(v.string()),
    // Platform details
    platformName: v.optional(v.string()),
    platformUrl: v.optional(v.string()),
    platformCountry: v.optional(v.string()),
    platformFounded: v.optional(v.string()),
    // Findings
    redFlags: v.array(v.string()),
    warnings: v.array(v.object({
      type: v.string(),
      severity: v.string(), // "low", "medium", "high", "critical"
      description: v.string(),
    })),
    recommendation: v.string(),
    estimatedLossRisk: v.optional(v.string()), // "low", "medium", "high", "total_loss_likely"
    similarScamReports: v.optional(v.number()), // Count of similar scams reported
    scannedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_risk_level", ["riskLevel"])
    .index("by_scan_type", ["scanType"])
    .index("by_scanned_at", ["scannedAt"]),

  // Family Protection Mode (protect elderly/vulnerable users)
  familyProtection: defineTable({
    protectedUserId: v.id("users"), // The elderly parent/vulnerable person
    guardianUserId: v.id("users"), // The adult child/protector
    relationshipType: v.string(), // "parent_child", "spouse", "sibling", "friend", "caregiver"
    protectionLevel: v.string(), // "monitor_only", "alert_on_high_risk", "alert_on_all", "require_approval"
    isActive: v.boolean(),
    // Guardian alert settings
    sendEmailAlerts: v.boolean(),
    sendPushAlerts: v.boolean(),
    sendSMSAlerts: v.optional(v.boolean()),
    alertThreshold: v.string(), // "suspicious", "high_risk", "scam"
    // Protected user settings
    autoBlockHighRisk: v.optional(v.boolean()), // Auto-block scam numbers/senders?
    requireGuardianApproval: v.optional(v.boolean()), // Guardian must approve large transactions?
    approvalThreshold: v.optional(v.number()), // Dollar amount requiring approval
    // Stats
    totalAlertsProcessed: v.number(),
    totalScamsBlocked: v.number(),
    totalSavingsProtected: v.number(), // Estimated $ saved
    lastAlertSentAt: v.optional(v.number()),
    // Timestamps
    linkedAt: v.number(),
    pausedAt: v.optional(v.number()),
    resumedAt: v.optional(v.number()),
  })
    .index("by_protected_user", ["protectedUserId"])
    .index("by_guardian", ["guardianUserId"])
    .index("by_active", ["isActive"]),

  // Guardian Alerts (notifications sent to protectors)
  guardianAlerts: defineTable({
    familyProtectionId: v.id("familyProtection"),
    guardianUserId: v.id("users"),
    protectedUserId: v.id("users"),
    alertType: v.string(), // "message_scan", "investment_scan", "payment_verification", "call_screening", "suspicious_activity"
    severity: v.string(), // "low", "medium", "high", "critical"
    title: v.string(),
    description: v.string(),
    // Related scan data
    scanType: v.optional(v.string()), // "message", "investment", "payment", "call"
    scanId: v.optional(v.string()), // ID of the related scan
    riskScore: v.optional(v.number()),
    riskLevel: v.optional(v.string()),
    detectedContent: v.optional(v.string()), // Preview of suspicious message/platform
    // Guardian actions
    read: v.boolean(),
    dismissed: v.boolean(),
    actionTaken: v.optional(v.string()), // "called_user", "blocked_sender", "reported_scam", "marked_safe"
    actionTakenAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_guardian", ["guardianUserId"])
    .index("by_guardian_unread", ["guardianUserId", "read"])
    .index("by_family_protection", ["familyProtectionId"])
    .index("by_severity", ["severity"]),

  // Payment Verifications ($152M market - payment redirection scams)
  paymentVerifications: defineTable({
    userId: v.id("users"),
    verificationSource: v.string(), // "manual_entry", "screenshot_ocr", "email_scan", "pdf_scan"
    // Bank details
    bsb: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    accountName: v.optional(v.string()),
    bankName: v.optional(v.string()),
    // Payment context
    paymentAmount: v.optional(v.number()),
    paymentPurpose: v.optional(v.string()), // "property_deposit", "invoice", "goods", "services", "other"
    expectedPayeeName: v.optional(v.string()),
    // Verification results
    accountNameMatches: v.optional(v.boolean()), // Does BSB/account match expected name?
    accountExists: v.optional(v.boolean()),
    accountActive: v.optional(v.boolean()),
    bankVerified: v.optional(v.boolean()),
    // Risk flags
    riskScore: v.number(), // 0-100
    riskLevel: v.string(), // "safe", "suspicious", "high_risk", "scam"
    redFlags: v.array(v.string()),
    warnings: v.array(v.object({
      type: v.string(), // "name_mismatch", "new_account", "suspicious_bank", "high_risk_location"
      severity: v.string(),
      description: v.string(),
    })),
    // Context extraction (from email/screenshot)
    extractedText: v.optional(v.string()), // Full OCR result
    detectedChanges: v.optional(v.array(v.object({
      field: v.string(), // "bsb", "account_number", "account_name"
      oldValue: v.string(),
      newValue: v.string(),
      changeDetected: v.boolean(),
    }))),
    // Recommendations
    recommendation: v.string(),
    safeToProCeed: v.boolean(),
    suggestedAction: v.string(), // "verify_with_recipient", "call_before_payment", "do_not_pay", "report_to_bank"
    scannedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_risk_level", ["riskLevel"])
    .index("by_scanned_at", ["scannedAt"]),

  // Real-Time Call Screening (Truecaller killer)
  callScreening: defineTable({
    userId: v.id("users"),
    phoneNumber: v.string(),
    callerName: v.optional(v.string()),
    callDirection: v.string(), // "incoming", "outgoing"
    callDuration: v.optional(v.number()), // Seconds
    // Real-time analysis
    transcription: v.optional(v.string()), // Speech-to-text of call
    detectedScamPatterns: v.array(v.object({
      type: v.string(), // "urgency", "impersonation", "payment_request", "password_request", "personal_info_request"
      confidence: v.number(), // 0-100
      timestamp: v.number(), // When in call (seconds)
      quote: v.optional(v.string()), // What they said
    })),
    // Risk assessment
    riskScore: v.number(), // 0-100
    riskLevel: v.string(), // "safe", "suspicious", "high_risk", "scam"
    isKnownScammer: v.boolean(),
    communityReportCount: v.optional(v.number()), // Times reported by others
    // Call metadata
    callBlocked: v.optional(v.boolean()), // Did user hang up during?
    callAnswered: v.optional(v.boolean()),
    userHungUpAfter: v.optional(v.number()), // Seconds before hanging up
    alertShownDuringCall: v.optional(v.boolean()),
    // Scam details
    claimedToBeFrom: v.optional(v.string()), // "ATO", "NBN", "Bank", "Police"
    scamType: v.optional(v.string()), // "tax_scam", "tech_support", "bank_fraud", "lottery"
    recommendedAction: v.string(),
    // User actions
    reportedAsScam: v.optional(v.boolean()),
    reportedToAuthorities: v.optional(v.boolean()),
    blockedNumber: v.optional(v.boolean()),
    markedAsSafe: v.optional(v.boolean()),
    callTime: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_phone_number", ["phoneNumber"])
    .index("by_risk_level", ["riskLevel"])
    .index("by_call_time", ["callTime"]),

  // Deepfake / Voice Clone Detection (future-proof)
  deepfakeScans: defineTable({
    userId: v.id("users"),
    scanType: v.string(), // "voice_call", "video_call", "audio_file", "video_file", "image"
    sourceType: v.string(), // "live_call", "whatsapp_call", "recorded_audio", "uploaded_file"
    // Analysis results
    isAIGenerated: v.boolean(),
    confidence: v.number(), // 0-100% confidence it's AI
    deepfakeType: v.optional(v.string()), // "voice_clone", "face_swap", "lip_sync", "full_synthesis"
    // Voice analysis
    voiceCharacteristics: v.optional(v.object({
      pitch: v.optional(v.number()),
      tempo: v.optional(v.number()),
      emotionConsistency: v.optional(v.number()),
      breathingPattern: v.optional(v.string()),
      backgroundNoise: v.optional(v.string()),
    })),
    // Comparison to known voice profile
    knownVoiceProfileId: v.optional(v.string()), // ID of family member voice profile
    voiceMatchScore: v.optional(v.number()), // 0-100% match to known voice
    voiceProfileMatches: v.optional(v.boolean()),
    // Video/image analysis
    faceManipulationDetected: v.optional(v.boolean()),
    lipSyncInconsistencies: v.optional(v.boolean()),
    artificialArtifacts: v.optional(v.array(v.string())),
    // Risk assessment
    riskScore: v.number(), // 0-100
    riskLevel: v.string(), // "authentic", "suspicious", "likely_fake", "confirmed_deepfake"
    redFlags: v.array(v.string()),
    // Context
    claimedIdentity: v.optional(v.string()), // "Mother", "Boss", "Bank Manager"
    requestedAction: v.optional(v.string()), // "Send money", "Share password", "Wire transfer"
    emotionalManipulation: v.optional(v.boolean()), // "Emergency", "Urgent help needed"
    // Recommendations
    recommendation: v.string(),
    suggestedVerification: v.string(), // "Call back on known number", "Ask security question", "Hang up immediately"
    scannedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_scan_type", ["scanType"])
    .index("by_risk_level", ["riskLevel"])
    .index("by_is_ai_generated", ["isAIGenerated"])
    .index("by_scanned_at", ["scannedAt"]),

  // Voice Profiles (for family voice verification)
  voiceProfiles: defineTable({
    userId: v.id("users"),
    profileName: v.string(), // "Mum", "Dad", "Boss", "Me"
    relationshipType: v.string(), // "family", "friend", "colleague", "self"
    // Deepfake safety helpers (not biometric):
    // - safeCallbackNumber: the real number you trust for this person/organization
    // - verificationPhrase: a codeword / shared question you can ask to verify identity
    safeCallbackNumber: v.optional(v.string()),
    verificationPhrase: v.optional(v.string()),
    notes: v.optional(v.string()),
    // Voice fingerprint data
    voiceFingerprint: v.optional(v.string()), // Encrypted biometric data
    recordingCount: v.number(),
    lastRecordingAt: v.optional(v.number()),
    // Verification stats
    totalVerifications: v.number(),
    successfulMatches: v.number(),
    failedMatches: v.number(),
    falsePositiveRate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_relationship", ["relationshipType"]),

  // Business API Keys (for API Access feature)
  businessApiKeys: defineTable({
    userId: v.id("users"),
    keyName: v.string(), // "Production API", "Development", "Partner Integration"
    apiKey: v.string(), // The actual API key (hashed)
    apiSecret: v.string(), // Secret for signature verification
    isActive: v.boolean(),
    environment: v.string(), // "production", "development", "sandbox"
    // Permissions
    allowedEndpoints: v.array(v.string()), // ["scan_profile", "scan_email", "scan_link", etc.]
    rateLimit: v.number(), // Requests per minute
    dailyQuota: v.number(), // Requests per day
    // Usage tracking
    requestsToday: v.number(),
    requestsThisMonth: v.number(),
    totalRequests: v.number(),
    lastUsedAt: v.optional(v.number()),
    // Metadata
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    lastRotatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_api_key", ["apiKey"])
    .index("by_active", ["isActive"]),

  // API Request Logs (for Analytics Dashboard)
  apiRequestLogs: defineTable({
    apiKeyId: v.id("businessApiKeys"),
    userId: v.id("users"),
    endpoint: v.string(), // "/api/scan/profile", "/api/scan/email"
    method: v.string(), // "POST", "GET"
    statusCode: v.number(), // 200, 400, 429, 500
    responseTime: v.number(), // Milliseconds
    requestSize: v.optional(v.number()), // Bytes
    responseSize: v.optional(v.number()), // Bytes
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_api_key", ["apiKeyId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_endpoint", ["endpoint"]),

  // Stripe Subscriptions
  subscriptions: defineTable({
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    // Subscription details
    plan: v.string(), // "personal_premium", "personal_family", "business_starter", "business_pro", "business_enterprise", "charity", "community"
    status: v.string(), // "active", "trialing", "past_due", "canceled", "unpaid", "incomplete"
    billingInterval: v.string(), // "month", "year"
    // Pricing
    amount: v.number(), // In cents
    currency: v.string(), // "aud"
    // Add-ons (for business)
    addons: v.optional(v.array(v.object({
      name: v.string(), // "chargeback_shield", "bec_protection", etc.
      priceId: v.string(),
      amount: v.number(),
    }))),
    // Per-user pricing (charity/community)
    userCount: v.optional(v.number()),
    pricePerUser: v.optional(v.number()),
    // Dates
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    trialStart: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"])
    .index("by_status", ["status"]),

  // Payment History
  payments: defineTable({
    userId: v.id("users"),
    subscriptionId: v.id("subscriptions"),
    stripePaymentIntentId: v.string(),
    stripeInvoiceId: v.optional(v.string()),
    // Payment details
    amount: v.number(), // In cents
    currency: v.string(),
    status: v.string(), // "succeeded", "pending", "failed", "refunded"
    paymentMethod: v.string(), // "card", "bank_transfer", "apple_pay", "google_pay"
    // Card details (last 4 digits only)
    cardBrand: v.optional(v.string()), // "visa", "mastercard", "amex"
    cardLast4: v.optional(v.string()),
    // Metadata
    description: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    invoiceUrl: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    refundedAt: v.optional(v.number()),
    refundAmount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_stripe_payment_intent", ["stripePaymentIntentId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  // Dark Web Monitoring
  darkWebMonitors: defineTable({
    userId: v.id("users"),
    email: v.string(),
    phone: v.optional(v.string()),
    isActive: v.boolean(),
    breachesFound: v.array(v.object({
      name: v.string(), // "Adobe", "LinkedIn", etc.
      title: v.string(), // Full breach title
      breachDate: v.string(), // "2013-10-04"
      dataClasses: v.array(v.string()), // ["Passwords", "Email addresses"]
      description: v.optional(v.string()),
      logoPath: v.optional(v.string()),
    })),
    breachCount: v.number(),
    lastChecked: v.optional(v.number()),
    nextCheckAt: v.optional(v.number()), // When to check again (24 hours)
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_next_check", ["nextCheckAt"])
    .index("by_active", ["isActive"]),

  // Dark Web Alerts
  darkWebAlerts: defineTable({
    userId: v.id("users"),
    monitorId: v.id("darkWebMonitors"),
    breachName: v.string(),
    breachDate: v.string(),
    dataExposed: v.array(v.string()), // What was compromised
    severity: v.string(), // "low", "medium", "high", "critical"
    recommendation: v.string(),
    read: v.boolean(),
    dismissed: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_monitor", ["monitorId"])
    .index("by_user_unread", ["userId", "read"])
    .index("by_severity", ["severity"]),

  // ========================================
  // PRE-AUTHORIZATION SYSTEM
  // ========================================

  // Merchant configuration for pre-auth checks (used by convex/preAuthCheck.ts)
  preAuthConfig: defineTable({
    userId: v.id("users"),

    autoApproveThreshold: v.number(),
    autoDeclineThreshold: v.number(),
    requireReviewAboveAmount: v.number(),

    firstTimeCustomerRequiresReview: v.boolean(),
    firstTimeCustomerMaxAmount: v.number(),

    maxOrdersPerEmailPerHour: v.number(),
    maxOrdersPerDevicePerHour: v.number(),

    blockHighRiskCountries: v.boolean(),
    highRiskCountryCodes: v.array(v.string()),

    blockDisposableEmails: v.boolean(),
    requirePhoneValidation: v.boolean(),

    reviewTimeoutHours: v.number(),

    notifyOnHighRisk: v.boolean(),
    notifyOnPendingReview: v.boolean(),

    // Post-auth monitoring schedule (user preference)
    // Time is stored as "minutes from local midnight" (0..1439)
    postAuthDailyCheckTimeMinutes: v.optional(v.number()),
    // The device timezone offset (Date.getTimezoneOffset()) at the time the user saved their preference.
    postAuthTimezoneOffsetMinutes: v.optional(v.number()),
    // Used to ensure the scheduled job runs at most once per local day per merchant.
    postAuthLastRunLocalDayKey: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // ========================================
  // MERCHANT SETTINGS (Automatic Scanning & Auto-Decision)
  // ========================================

  // Merchant Settings for automatic scanning and auto-decision rules
  merchantSettings: defineTable({
    userId: v.id("users"),

    // Automatic scanning
    automaticScanningEnabled: v.boolean(),
    
    // Auto-decision rules
    autoApproveEnabled: v.boolean(), // Auto-approve low-risk orders
    autoApproveThreshold: v.number(), // 0-30 = low risk
    
    autoBlockEnabled: v.boolean(), // Auto-block high-risk orders
    autoBlockThreshold: v.number(), // 61-100 = high risk
    
    // Medium risk always goes to pending review (31-60)
    
    // Notifications
    notifyHighRisk: v.boolean(),
    notifyAutoBlock: v.boolean(),
    notifyDailySummary: v.boolean(),
    
    // Store connection status
    storeConnected: v.boolean(),
    storeType: v.optional(v.string()), // "shopify", "woocommerce", "custom_api"
    
    // Daily monitoring check time (hour 0-23)
    monitoringCheckTime: v.optional(v.number()), // Hour of day (0-23) when daily monitoring runs
    
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Store Connections (Shopify, WooCommerce, Custom API)
  storeConnections: defineTable({
    userId: v.id("users"),
    
    platform: v.string(), // "shopify", "woocommerce", "custom_api"
    
    // Connection status
    status: v.string(), // "connected", "disconnected", "error", "expired"
    isActive: v.boolean(),
    
    // Platform-specific credentials (encrypted)
    credentials: v.object({
      // Shopify
      shopifyDomain: v.optional(v.string()),
      shopifyApiKey: v.optional(v.string()),
      shopifyPassword: v.optional(v.string()),
      
      // WooCommerce
      wooStoreUrl: v.optional(v.string()),
      wooConsumerKey: v.optional(v.string()),
      wooConsumerSecret: v.optional(v.string()),
      
      // Custom API
      webhookUrl: v.optional(v.string()),
      apiKey: v.optional(v.string()),
    }),
    
    // Webhook configuration
    webhookSecret: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
    
    // Sync stats
    lastSyncedAt: v.optional(v.number()),
    totalOrdersSynced: v.number(),
    lastError: v.optional(v.string()),
    
    connectedAt: v.number(),
    disconnectedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_platform", ["platform"])
    .index("by_status", ["status"]),

  // Incoming Orders from Webhooks (staging area before pre-auth)
  incomingOrders: defineTable({
    userId: v.id("users"),
    storeConnectionId: v.id("storeConnections"),
    
    // Platform details
    platform: v.string(), // "shopify", "woocommerce", "custom_api"
    platformOrderId: v.string(), // Original order ID from the store
    
    // Order data
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    customerName: v.optional(v.string()),
    orderAmount: v.number(),
    billingAddress: v.optional(v.string()),
    shippingAddress: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    
    // Processing status
    status: v.string(), // "pending", "processing", "scanned", "failed"
    processedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    
    // Linked to pre-auth scan
    preAuthOrderId: v.optional(v.id("preAuthOrders")),
    
    // Raw webhook payload
    rawPayload: v.optional(v.any()),
    
    receivedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_store_connection", ["storeConnectionId"])
    .index("by_platform_order_id", ["platformOrderId"])
    .index("by_status", ["status"])
    .index("by_received_at", ["receivedAt"]),

  // Pre-Authorization Orders (Gate before fulfillment)
  // NOTE: This schema matches the fields created/updated by convex/preAuthCheck.ts
  preAuthOrders: defineTable({
    userId: v.id("users"),

    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    orderAmount: v.number(),
    orderId: v.string(),

    billingAddress: v.optional(v.string()),
    shippingAddress: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    deviceFingerprint: v.optional(v.string()),
    cardBin: v.optional(v.string()),

    preAuthScore: v.number(),
    preAuthRiskLevel: v.string(),
    preAuthChecks: v.any(),

    status: v.string(), // AUTO_APPROVED | AUTO_DECLINED | PENDING_REVIEW | MANUAL_APPROVED | MANUAL_DECLINED | MOVED_TO_POST_AUTH
    autoDecision: v.any(),

    // Manual review
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    reviewDecision: v.optional(v.string()),
    reviewNotes: v.optional(v.string()),

    // Post-auth linking
    postAuthScanId: v.optional(v.id("chargebackScans")),
    movedToPostAuthAt: v.optional(v.number()),

    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_order_id", ["orderId"])
    .index("by_created_at", ["createdAt"]),

  // Post-Authorization monitoring records (demo + dashboard)
  postAuthOrders: defineTable({
    userId: v.optional(v.id("users")),
    
    orderId: v.string(),
    amount: v.number(),
    email: v.string(),
    cardBin: v.string(),
    ipAddress: v.string(),

    preAuthScore: v.number(),
    chargebackRisk: v.number(),
    fraudSignals: v.any(),

    status: v.string(), // UNDER_MONITORING | CHARGEBACKS_FILED | CLEARED

    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    lastCheckedAt: v.optional(v.number()),

    chargebackFiledAt: v.optional(v.number()),
    clearedAt: v.optional(v.number()),

    evidence: v.optional(v.array(v.any())),
    notes: v.optional(v.array(v.any())),

    chargebackReason: v.optional(v.string()),
    chargebackAmount: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  // ========================================
  // CHARGEBACK FRAUD DETECTION (14 Features)
  // ========================================

  // Chargeback fraud analysis records (Multi-Signal Risk Scoring)
  chargebackScans: defineTable({
    userId: v.id("users"),
    // Input data
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    orderAmount: v.number(),
    orderId: v.optional(v.string()),
    billingAddress: v.optional(v.string()),
    shippingAddress: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    deviceFingerprint: v.optional(v.string()),
    cardBin: v.optional(v.string()), // First 6 digits
    stripeChargeId: v.optional(v.string()),
    shopifyOrderId: v.optional(v.string()),
    
    // Multi-Signal Risk Scoring
    riskScore: v.number(), // 0-100 (weighted from all signals)
    riskLevel: v.string(), // "LOW", "MEDIUM", "HIGH", "CRITICAL"
    confidenceScore: v.optional(v.number()), // How confident are we? (more signals = higher confidence)
    
    // Individual signal scores
    signals: v.array(v.object({
      name: v.string(), // "device_fingerprint", "geolocation", "velocity", "email", "phone", "address", "order_value", "behavior"
      score: v.number(), // 0-100
      weight: v.number(), // 0.0-1.0 (importance of this signal)
      status: v.string(), // "PASS", "WARN", "FAIL"
      details: v.string(),
    })),
    
    // Detailed findings
    riskFactors: v.array(v.object({
      type: v.string(), // "device_fingerprint", "geolocation", "velocity", etc.
      severity: v.string(), // "low", "medium", "high"
      description: v.string(),
      score: v.number(),
    })),
    
    // Recommendations
    recommendation: v.string(),
    actionRequired: v.string(), // "APPROVE", "REVIEW", "DECLINE", "VERIFY_IDENTITY"
    suggestedActions: v.array(v.string()),
    
    // Merchant actions
    merchantDecision: v.optional(v.string()), // "APPROVED", "DECLINED", "REFUNDED"
    merchantDecisionAt: v.optional(v.number()),
    merchantNotes: v.optional(v.string()),
    
    // Outcome tracking (for ML improvement)
    actualChargeback: v.optional(v.boolean()), // Did this order result in a chargeback?
    chargebackDate: v.optional(v.number()),
    chargebackAmount: v.optional(v.number()),
    
    scannedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_risk_level", ["riskLevel"])
    .index("by_scanned_at", ["scannedAt"])
    .index("by_customer_email", ["customerEmail"])
    .index("by_device_fingerprint", ["deviceFingerprint"])
    .index("by_ip_address", ["ipAddress"]),

  // Dispute Evidence Builder
  disputeEvidencePackages: defineTable({
    scanId: v.id("chargebackScans"),
    userId: v.id("users"),
    
    // Evidence data
    transactionDetails: v.object({
      orderId: v.string(),
      amount: v.number(),
      date: v.number(),
      customerEmail: v.string(),
      customerIp: v.optional(v.string()),
      paymentMethod: v.optional(v.string()),
    }),
    
    proofOfDelivery: v.optional(v.object({
      trackingNumber: v.string(),
      carrier: v.string(),
      deliveredAt: v.number(),
      signatureUrl: v.optional(v.string()),
      deliveryAddress: v.optional(v.string()),
    })),
    
    customerCommunication: v.array(v.object({
      date: v.number(),
      channel: v.string(), // "email", "chat", "phone"
      summary: v.string(),
      messagePreview: v.optional(v.string()),
    })),
    
    productDetails: v.object({
      name: v.string(),
      description: v.string(),
      sku: v.optional(v.string()),
      imageUrls: v.array(v.string()),
    }),
    
    termsAcceptance: v.optional(v.object({
      acceptedAt: v.number(),
      ipAddress: v.string(),
      userAgent: v.optional(v.string()),
      termsVersion: v.optional(v.string()),
    })),
    
    // Generated evidence files
    pdfUrl: v.optional(v.string()), // Generated PDF stored in cloud
    csvUrl: v.optional(v.string()), // CSV export of evidence
    
    status: v.string(), // "generating", "completed", "failed"
    generatedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_scan", ["scanId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Pre-Dispute Intervention (Ethoca/Verifi alerts)
  disputeAlerts: defineTable({
    userId: v.id("users"),
    orderId: v.string(),
    customerEmail: v.string(),
    amount: v.number(),
    
    alertType: v.string(), // "ETHOCA", "VERIFI", "STRIPE_EARLY_FRAUD_WARNING"
    alertSource: v.optional(v.string()), // Where did alert come from
    alertedAt: v.number(),
    
    status: v.string(), // "PENDING", "REFUNDED", "IGNORED", "ESCALATED_TO_CHARGEBACK"
    
    actionTaken: v.optional(v.object({
      type: v.string(), // "AUTO_REFUND", "MANUAL_REFUND", "CONTACTED_CUSTOMER", "IGNORED"
      takenAt: v.number(),
      notes: v.optional(v.string()),
      refundAmount: v.optional(v.number()),
    })),
    
    // Outcome tracking
    chargebackPrevented: v.optional(v.boolean()),
    estimatedSavings: v.optional(v.number()), // Chargeback fee + amount saved
    
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_order", ["orderId"])
    .index("by_alerted_at", ["alertedAt"]),

  // Real-Time Alerts + Block Before Fulfillment
  riskAlerts: defineTable({
    userId: v.id("users"),
    scanId: v.id("chargebackScans"),
    
    alertLevel: v.string(), // "BLOCK", "REVIEW", "WARN", "INFO"
    message: v.string(),
    title: v.string(),
    
    orderDetails: v.optional(v.object({
      orderId: v.optional(v.string()),
      customerEmail: v.string(),
      amount: v.number(),
    })),
    
    status: v.string(), // "UNREAD", "READ", "ACTIONED"
    
    actionTaken: v.optional(v.object({
      decision: v.string(), // "APPROVED", "DECLINED", "REFUNDED", "VERIFIED_IDENTITY"
      takenAt: v.number(),
      notes: v.optional(v.string()),
    })),
    
    // Push notification tracking
    pushSent: v.optional(v.boolean()),
    pushSentAt: v.optional(v.number()),
    emailSent: v.optional(v.boolean()),
    emailSentAt: v.optional(v.number()),
    
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_user_status", ["userId", "status"])
    .index("by_created", ["createdAt"])
    .index("by_scan", ["scanId"])
    .index("by_alert_level", ["alertLevel"]),

  // Historical Analytics + Savings Tracker
  analyticsSnapshots: defineTable({
    userId: v.id("users"),
    period: v.string(), // "2024-01", "2024-02" (YYYY-MM format)
    periodType: v.string(), // "monthly", "weekly", "daily"
    
    metrics: v.object({
      totalScans: v.number(),
      blockedOrders: v.number(),
      approvedOrders: v.number(),
      reviewedOrders: v.number(),
      
      totalRiskAmount: v.number(), // $ value of blocked orders
      estimatedSavings: v.number(), // Assume 70% would've been chargebacks
      actualChargebacks: v.optional(v.number()), // Confirmed chargebacks
      chargebackAmount: v.optional(v.number()), // $ lost to chargebacks
      
      chargebackRate: v.optional(v.number()), // % of orders that became chargebacks
      falsePositiveRate: v.optional(v.number()), // % of blocked orders that were legit
      
      avgRiskScore: v.number(),
      
      // Breakdown by risk level
      lowRiskCount: v.number(),
      mediumRiskCount: v.number(),
      highRiskCount: v.number(),
      criticalRiskCount: v.number(),
      
      // Top risk factors
      topRiskFactors: v.array(v.object({
        type: v.string(),
        count: v.number(),
      })),
    }),
    
    createdAt: v.number(),
  })
    .index("by_user_period", ["userId", "period"])
    .index("by_period_type", ["periodType"]),

  // Customer Identity Verification
  identityVerifications: defineTable({
    scanId: v.id("chargebackScans"),
    userId: v.id("users"),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    
    verificationType: v.string(), // "SMS_CODE", "EMAIL_LINK", "PHOTO_ID", "3D_SECURE", "VIDEO_CALL"
    
    status: v.string(), // "PENDING", "VERIFIED", "FAILED", "EXPIRED", "CANCELED"
    
    verificationData: v.optional(v.object({
      code: v.optional(v.string()), // For SMS/Email verification
      token: v.optional(v.string()), // For secure links
      verifiedAt: v.optional(v.number()),
      attempts: v.number(),
      maxAttempts: v.number(),
      photoIdUrl: v.optional(v.string()), // Uploaded ID document
      selfieUrl: v.optional(v.string()), // Selfie for face match
      videoCallRecordingUrl: v.optional(v.string()),
    })),
    
    // Results
    identityConfirmed: v.optional(v.boolean()),
    faceMatchScore: v.optional(v.number()), // 0-100 similarity score
    idDocumentValid: v.optional(v.boolean()),
    
    expiresAt: v.number(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_scan", ["scanId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_customer_email", ["customerEmail"]),

  // Trust Integrations (Stripe, Shopify, PayPal, etc.)
  integrations: defineTable({
    userId: v.id("users"),
    
    provider: v.string(), // "STRIPE", "SHOPIFY", "PAYPAL", "SHIPSTATION", "AFTERSHIP"
    
    credentials: v.object({
      apiKey: v.optional(v.string()),
      apiSecret: v.optional(v.string()),
      accessToken: v.optional(v.string()),
      refreshToken: v.optional(v.string()),
      webhookSecret: v.optional(v.string()),
      shopDomain: v.optional(v.string()), // For Shopify
    }),
    
    status: v.string(), // "CONNECTED", "DISCONNECTED", "ERROR", "EXPIRED"
    
    lastSyncedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    
    config: v.object({
      autoSyncOrders: v.boolean(),
      autoSyncChargebacks: v.boolean(),
      autoBlockHighRisk: v.boolean(),
      autoRefundThreshold: v.optional(v.number()), // Auto-refund orders under this amount
      requireReviewThreshold: v.optional(v.number()), // Require manual review above this amount
    }),
    
    // Sync stats
    totalOrdersSynced: v.optional(v.number()),
    totalChargebacksSynced: v.optional(v.number()),
    lastSyncError: v.optional(v.string()),
    
    createdAt: v.number(),
    connectedAt: v.optional(v.number()),
    disconnectedAt: v.optional(v.number()),
  })
    .index("by_user_provider", ["userId", "provider"])
    .index("by_status", ["status"]),

  // Webhook events from integrations
  webhookEvents: defineTable({
    userId: v.id("users"),
    integrationId: v.id("integrations"),
    provider: v.string(),
    
    eventType: v.string(), // "charge.succeeded", "charge.dispute.created", "order.created", etc.
    eventId: v.string(), // Provider's event ID
    
    payload: v.any(), // Full webhook payload
    
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
    processingError: v.optional(v.string()),
    
    // Actions taken
    scanCreated: v.optional(v.boolean()),
    scanId: v.optional(v.id("chargebackScans")),
    alertCreated: v.optional(v.boolean()),
    alertId: v.optional(v.id("riskAlerts")),
    
    receivedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_integration", ["integrationId"])
    .index("by_event_id", ["eventId"])
    .index("by_processed", ["processed"])
    .index("by_received_at", ["receivedAt"]),

  // ========================================
  // PHASE 4A: MACHINE LEARNING
  // ========================================

  // Customer Risk Profiles (ML-powered lifetime scoring)
  customerRiskProfiles: defineTable({
    userId: v.id("users"), // Business merchant
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    
    // Lifetime statistics
    totalOrders: v.number(),
    totalSpent: v.number(),
    avgOrderValue: v.number(),
    firstOrderDate: v.number(),
    lastOrderDate: v.number(),
    daysSinceFirstOrder: v.number(),
    
    // Risk metrics
    lifetimeRiskScore: v.number(), // 0-100 ML-calculated risk
    riskTrend: v.string(), // "IMPROVING", "STABLE", "DECLINING", "CRITICAL"
    chargebackCount: v.number(),
    chargebackRate: v.number(), // % of orders that became chargebacks
    
    // Behavioral patterns
    avgDaysBetweenOrders: v.optional(v.number()),
    preferredPaymentMethod: v.optional(v.string()),
    shippingAddressChanges: v.number(),
    emailDomainType: v.optional(v.string()), // "free", "business", "disposable"
    phoneValidated: v.optional(v.boolean()),
    
    // ML predictions
    chargebackProbability: v.number(), // 0-100% likelihood of next order chargebacking
    predictedLifetimeValue: v.optional(v.number()),
    retentionProbability: v.optional(v.number()),
    
    // Flags
    isHighValue: v.boolean(), // Spending > avg
    isRepeatCustomer: v.boolean(),
    hasChargebackHistory: v.boolean(),
    isSuspicious: v.boolean(),
    
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_customer_email", ["customerEmail"])
    .index("by_lifetime_risk", ["lifetimeRiskScore"])
    .index("by_user_email", ["userId", "customerEmail"]),

  // Purchase Patterns (ML pattern recognition)
  purchasePatterns: defineTable({
    userId: v.id("users"),
    patternType: v.string(), // "VELOCITY_SPIKE", "LARGE_ORDER", "GEO_ANOMALY", "DEVICE_SWITCH", "TIME_ANOMALY"
    
    // Pattern details
    description: v.string(),
    severity: v.string(), // "LOW", "MEDIUM", "HIGH", "CRITICAL"
    confidence: v.number(), // 0-100% ML confidence
    
    // Related data
    customerEmail: v.optional(v.string()),
    orderIds: v.array(v.string()),
    affectedOrderCount: v.number(),
    totalAmount: v.number(),
    
    // ML analysis
    expectedBehavior: v.string(),
    actualBehavior: v.string(),
    deviationScore: v.number(), // How far from normal
    
    // Status
    status: v.string(), // "DETECTED", "INVESTIGATING", "CONFIRMED_FRAUD", "FALSE_POSITIVE"
    investigatedAt: v.optional(v.number()),
    outcome: v.optional(v.string()),
    
    detectedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_pattern_type", ["patternType"])
    .index("by_severity", ["severity"])
    .index("by_status", ["status"])
    .index("by_detected_at", ["detectedAt"]),

  // Anomaly Detections (ML anomaly detection)
  anomalyDetections: defineTable({
    userId: v.id("users"),
    scanId: v.optional(v.id("chargebackScans")),
    
    anomalyType: v.string(), // "STATISTICAL", "BEHAVIORAL", "TEMPORAL", "GEOGRAPHICAL", "NETWORK"
    
    // Detection details
    title: v.string(),
    description: v.string(),
    anomalyScore: v.number(), // 0-100 (higher = more anomalous)
    confidence: v.number(), // 0-100% ML confidence
    
    // Statistical analysis
    expectedValue: v.optional(v.number()),
    actualValue: v.optional(v.number()),
    standardDeviations: v.optional(v.number()), // How many σ away from mean
    
    // Context
    relatedCustomerEmail: v.optional(v.string()),
    relatedOrderId: v.optional(v.string()),
    affectedMetrics: v.array(v.string()),
    
    // Actions
    autoBlocked: v.optional(v.boolean()),
    requiresReview: v.boolean(),
    reviewed: v.boolean(),
    reviewedAt: v.optional(v.number()),
    reviewOutcome: v.optional(v.string()), // "FRAUD_CONFIRMED", "FALSE_POSITIVE", "NEEDS_MORE_DATA"
    
    detectedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_scan", ["scanId"])
    .index("by_anomaly_type", ["anomalyType"])
    .index("by_reviewed", ["reviewed"])
    .index("by_detected_at", ["detectedAt"]),

  // ML Models (versioning and performance tracking)
  mlModels: defineTable({
    userId: v.optional(v.id("users")), // null = global model
    
    modelType: v.string(), // "RISK_SCORING", "CHARGEBACK_PREDICTION", "ANOMALY_DETECTION", "CUSTOMER_LIFETIME_VALUE"
    version: v.string(), // "1.0.0", "1.1.0", etc.
    
    // Training data
    trainingDataSize: v.number(),
    trainingStartedAt: v.optional(v.number()),
    trainingCompletedAt: v.optional(v.number()),
    
    // Performance metrics
    accuracy: v.optional(v.number()), // 0-100%
    precision: v.optional(v.number()), // 0-100%
    recall: v.optional(v.number()), // 0-100%
    f1Score: v.optional(v.number()), // 0-100%
    falsePositiveRate: v.optional(v.number()),
    falseNegativeRate: v.optional(v.number()),
    
    // Deployment
    status: v.string(), // "TRAINING", "TESTING", "DEPLOYED", "DEPRECATED"
    isActive: v.boolean(),
    deployedAt: v.optional(v.number()),
    deprecatedAt: v.optional(v.number()),
    
    // Hyperparameters (stored for reproducibility)
    hyperparameters: v.optional(v.any()),
    
    createdAt: v.number(),
  })
    .index("by_model_type", ["modelType"])
    .index("by_status", ["status"])
    .index("by_active", ["isActive"]),

  // ========================================
  // PHASE 4C: TEAM COLLABORATION
  // ========================================

  // Team Members (multi-user accounts)
  teamMembers: defineTable({
    businessUserId: v.id("users"), // The business owner account
    memberUserId: v.id("users"), // The team member account
    
    // Member details
    role: v.string(), // "OWNER", "ADMIN", "ANALYST", "VIEWER"
    email: v.string(),
    name: v.optional(v.string()),
    
    // Permissions
    permissions: v.object({
      canViewScans: v.boolean(),
      canBlockOrders: v.boolean(),
      canApproveOrders: v.boolean(),
      canGenerateEvidence: v.boolean(),
      canManageIntegrations: v.boolean(),
      canManageTeam: v.boolean(),
      canViewAnalytics: v.boolean(),
      canExportData: v.boolean(),
      canManageBilling: v.boolean(),
    }),
    
    // Activity tracking
    lastActiveAt: v.optional(v.number()),
    totalScansReviewed: v.optional(v.number()),
    totalOrdersBlocked: v.optional(v.number()),
    totalOrdersApproved: v.optional(v.number()),
    
    // Status
    status: v.string(), // "ACTIVE", "INVITED", "SUSPENDED", "REMOVED"
    invitedAt: v.optional(v.number()),
    joinedAt: v.optional(v.number()),
    suspendedAt: v.optional(v.number()),
    removedAt: v.optional(v.number()),
    
    createdAt: v.number(),
  })
    .index("by_business", ["businessUserId"])
    .index("by_member", ["memberUserId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  // Team Invitations
  teamInvitations: defineTable({
    businessUserId: v.id("users"),
    invitedEmail: v.string(),
    invitedName: v.optional(v.string()),
    
    role: v.string(), // "ADMIN", "ANALYST", "VIEWER"
    permissions: v.object({
      canViewScans: v.boolean(),
      canBlockOrders: v.boolean(),
      canApproveOrders: v.boolean(),
      canGenerateEvidence: v.boolean(),
      canManageIntegrations: v.boolean(),
      canManageTeam: v.boolean(),
      canViewAnalytics: v.boolean(),
      canExportData: v.boolean(),
      canManageBilling: v.boolean(),
    }),
    
    invitationToken: v.string(),
    expiresAt: v.number(),
    
    status: v.string(), // "PENDING", "ACCEPTED", "EXPIRED", "CANCELED"
    
    acceptedAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    
    createdAt: v.number(),
  })
    .index("by_business", ["businessUserId"])
    .index("by_email", ["invitedEmail"])
    .index("by_token", ["invitationToken"])
    .index("by_status", ["status"]),

  // Team Activity Log
  teamActivityLogs: defineTable({
    businessUserId: v.id("users"),
    actorUserId: v.id("users"), // Who performed the action
    actorEmail: v.string(),
    actorName: v.optional(v.string()),
    
    actionType: v.string(), // "SCAN_REVIEWED", "ORDER_BLOCKED", "ORDER_APPROVED", "EVIDENCE_GENERATED", "INTEGRATION_ADDED", "TEAM_MEMBER_ADDED", "SETTINGS_CHANGED"
    actionDescription: v.string(),
    
    // Related entities
    relatedScanId: v.optional(v.id("chargebackScans")),
    relatedOrderId: v.optional(v.string()),
    relatedCustomerEmail: v.optional(v.string()),
    relatedTeamMemberId: v.optional(v.id("teamMembers")),
    
    // Action details
    metadata: v.optional(v.any()),
    
    createdAt: v.number(),
  })
    .index("by_business", ["businessUserId"])
    .index("by_actor", ["actorUserId"])
    .index("by_action_type", ["actionType"])
    .index("by_created_at", ["createdAt"]),

  // Order Comments (internal team notes)
  orderComments: defineTable({
    businessUserId: v.id("users"),
    scanId: v.id("chargebackScans"),
    orderId: v.optional(v.string()),
    
    authorUserId: v.id("users"),
    authorEmail: v.string(),
    authorName: v.optional(v.string()),
    
    commentText: v.string(),
    commentType: v.string(), // "NOTE", "REVIEW", "DECISION", "QUESTION"
    
    // Mentions
    mentionedUserIds: v.optional(v.array(v.id("users"))),
    
    // Attachments
    attachmentUrls: v.optional(v.array(v.string())),
    
    // Editing
    edited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    
    createdAt: v.number(),
  })
    .index("by_scan", ["scanId"])
    .index("by_business", ["businessUserId"])
    .index("by_author", ["authorUserId"])
    .index("by_created_at", ["createdAt"]),

  // ========================================
  // PHASE 4: ONBOARDING & WEBHOOKS
  // ========================================

  // Onboarding Progress (guided setup wizard)
  onboardingProgress: defineTable({
    userId: v.id("users"),
    
    currentStep: v.number(), // 0, 1, 2, 3, 4
    totalSteps: v.number(), // 5
    
    completedSteps: v.array(v.object({
      stepNumber: v.number(),
      stepName: v.string(),
      completedAt: v.number(),
    })),
    
    steps: v.object({
      // Step 0: Welcome
      welcomeViewed: v.boolean(),
      
      // Step 1: Connect Platform
      platformConnected: v.boolean(),
      platformType: v.optional(v.string()), // "SHOPIFY", "STRIPE", etc.
      
      // Step 2: Configure Webhooks
      webhooksConfigured: v.boolean(),
      
      // Step 3: Run Test Scan
      testScanCompleted: v.boolean(),
      
      // Step 4: Invite Team
      teamInvited: v.boolean(),
      teamMemberCount: v.optional(v.number()),
    }),
    
    isComplete: v.boolean(),
    completedAt: v.optional(v.number()),
    
    // Skipped
    skipped: v.boolean(),
    skippedAt: v.optional(v.number()),
    
    startedAt: v.number(),
    lastUpdatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_is_complete", ["isComplete"]),

  // Webhook Logs (Phase 3D monitoring)
  webhookLogs: defineTable({
    userId: v.id("users"),
    platform: v.string(), // "SHOPIFY", "STRIPE", "WOOCOMMERCE", "PAYPAL", "SQUARE", "BIGCOMMERCE", "MAGENTO"
    
    // Request details
    eventType: v.string(), // "order.created", "payment.updated", etc.
    eventId: v.optional(v.string()),
    requestHeaders: v.optional(v.any()),
    requestBody: v.any(),
    
    // Response details
    responseStatus: v.number(), // 200, 400, 500
    responseBody: v.optional(v.any()),
    responseTime: v.number(), // Milliseconds
    
    // Processing
    status: v.string(), // "SUCCESS", "FAILED", "PROCESSING"
    errorMessage: v.optional(v.string()),
    
    // Related entities
    scanId: v.optional(v.id("chargebackScans")),
    orderId: v.optional(v.string()),
    
    receivedAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_platform", ["platform"])
    .index("by_status", ["status"])
    .index("by_received_at", ["receivedAt"]),

  // ========================================
  // SECURITY & ANTI-HACKING SYSTEM
  // ========================================

  // Security Audit Logs (track all sensitive operations)
  securityLogs: defineTable({
    userId: v.optional(v.id("users")),
    
    eventType: v.string(), // "LOGIN_SUCCESS", "LOGIN_FAILED", "PASSWORD_CHANGE", "MFA_ENABLED", "API_KEY_CREATED", "DATA_EXPORT", "PERMISSION_CHANGE", "SUSPICIOUS_ACTIVITY"
    severity: v.string(), // "INFO", "WARNING", "ERROR", "CRITICAL"
    
    // Event details
    description: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    deviceFingerprint: v.optional(v.string()),
    location: v.optional(v.object({
      country: v.optional(v.string()),
      city: v.optional(v.string()),
      lat: v.optional(v.number()),
      lon: v.optional(v.number()),
    })),
    
    // Context
    affectedResources: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    
    // Threat analysis
    isSuspicious: v.boolean(),
    threatScore: v.optional(v.number()), // 0-100
    blockedBySystem: v.optional(v.boolean()),
    
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_event_type", ["eventType"])
    .index("by_severity", ["severity"])
    .index("by_is_suspicious", ["isSuspicious"])
    .index("by_timestamp", ["timestamp"]),

  // MFA Tokens (Two-Factor Authentication)
  mfaTokens: defineTable({
    userId: v.id("users"),
    
    // Token details
    secret: v.string(), // Encrypted TOTP secret
    backupCodes: v.array(v.string()), // Encrypted backup codes
    
    // Settings
    method: v.string(), // "TOTP", "SMS", "EMAIL"
    phoneNumber: v.optional(v.string()), // For SMS
    email: v.optional(v.string()), // For email
    
    // Status
    isEnabled: v.boolean(),
    isVerified: v.boolean(),
    
    // Usage tracking
    lastUsedAt: v.optional(v.number()),
    failedAttempts: v.number(),
    lastFailedAt: v.optional(v.number()),
    
    // Recovery
    backupCodesUsed: v.array(v.string()),
    
    enabledAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_is_enabled", ["isEnabled"]),

  // Suspicious Activity Detection
  suspiciousActivity: defineTable({
    userId: v.optional(v.id("users")),
    
    activityType: v.string(), // "BRUTE_FORCE_LOGIN", "RATE_LIMIT_EXCEEDED", "UNUSUAL_LOCATION", "DATA_SCRAPING", "API_ABUSE", "UNAUTHORIZED_ACCESS_ATTEMPT"
    severity: v.string(), // "LOW", "MEDIUM", "HIGH", "CRITICAL"
    
    // Detection details
    description: v.string(),
    detectionMethod: v.string(), // "RATE_LIMITER", "GEO_ANOMALY", "BEHAVIOR_ANALYSIS", "ML_MODEL"
    confidenceScore: v.number(), // 0-100% confidence it's malicious
    
    // Context
    ipAddress: v.string(),
    userAgent: v.optional(v.string()),
    deviceFingerprint: v.optional(v.string()),
    requestedEndpoint: v.optional(v.string()),
    requestCount: v.optional(v.number()),
    timeWindow: v.optional(v.string()), // "1_minute", "5_minutes", "1_hour"
    
    // Geolocation
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    isVPN: v.optional(v.boolean()),
    isTor: v.optional(v.boolean()),
    isProxy: v.optional(v.boolean()),
    
    // Actions taken
    actionTaken: v.string(), // "LOGGED", "BLOCKED", "RATE_LIMITED", "MFA_REQUIRED", "ACCOUNT_LOCKED"
    blockedAt: v.optional(v.number()),
    
    // Investigation
    investigated: v.boolean(),
    investigatedBy: v.optional(v.id("users")),
    investigatedAt: v.optional(v.number()),
    investigationNotes: v.optional(v.string()),
    falsePositive: v.optional(v.boolean()),
    
    detectedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_activity_type", ["activityType"])
    .index("by_severity", ["severity"])
    .index("by_ip_address", ["ipAddress"])
    .index("by_investigated", ["investigated"])
    .index("by_detected_at", ["detectedAt"]),

  // Rate Limiting Tracking
  rateLimitTracking: defineTable({
    identifier: v.string(), // IP address, user ID, or API key
    identifierType: v.string(), // "IP", "USER_ID", "API_KEY"
    
    endpoint: v.string(), // "/api/scan", "/api/webhooks/shopify"
    
    // Tracking
    requestCount: v.number(),
    windowStart: v.number(),
    windowEnd: v.number(),
    windowDuration: v.string(), // "1_minute", "5_minutes", "1_hour", "1_day"
    
    // Limits
    limit: v.number(), // Max requests allowed
    exceeded: v.boolean(),
    exceededAt: v.optional(v.number()),
    
    // Actions
    blockedUntil: v.optional(v.number()),
    warningsSent: v.number(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_identifier", ["identifier"])
    .index("by_identifier_type", ["identifierType"])
    .index("by_endpoint", ["endpoint"])
    .index("by_exceeded", ["exceeded"]),

  // Device Fingerprints (track devices for security)
  deviceFingerprints: defineTable({
    userId: v.id("users"),
    
    fingerprint: v.string(), // Unique device identifier
    
    // Device details
    platform: v.optional(v.string()), // "ios", "android", "web"
    deviceModel: v.optional(v.string()),
    osVersion: v.optional(v.string()),
    appVersion: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    language: v.optional(v.string()),
    
    // Security flags
    isTrusted: v.boolean(),
    isRooted: v.optional(v.boolean()), // Android
    isJailbroken: v.optional(v.boolean()), // iOS
    isEmulator: v.optional(v.boolean()),
    
    // Geolocation history
    locations: v.array(v.object({
      country: v.string(),
      city: v.optional(v.string()),
      ipAddress: v.string(),
      timestamp: v.number(),
    })),
    
    // Activity
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    loginCount: v.number(),
    lastLoginAt: v.optional(v.number()),
    
    // Blocking
    isBlocked: v.boolean(),
    blockedAt: v.optional(v.number()),
    blockReason: v.optional(v.string()),
    
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_fingerprint", ["fingerprint"])
    .index("by_is_trusted", ["isTrusted"])
    .index("by_is_blocked", ["isBlocked"]),

  // API Security Incidents
  apiSecurityIncidents: defineTable({
    incidentType: v.string(), // "INJECTION_ATTEMPT", "XSS_ATTEMPT", "CSRF_ATTEMPT", "API_KEY_LEAK", "UNAUTHORIZED_ACCESS", "DATA_BREACH_ATTEMPT"
    severity: v.string(), // "LOW", "MEDIUM", "HIGH", "CRITICAL"
    
    // Attack details
    description: v.string(),
    attackVector: v.string(), // "SQL_INJECTION", "XSS", "CSRF", "BRUTE_FORCE", "DOS", "DDOS"
    affectedEndpoint: v.string(),
    maliciousPayload: v.optional(v.string()),
    
    // Attacker info
    sourceIp: v.string(),
    userAgent: v.optional(v.string()),
    country: v.optional(v.string()),
    
    // Response
    blocked: v.boolean(),
    blockedBy: v.string(), // "WAF", "RATE_LIMITER", "INPUT_VALIDATOR", "CONVEX_AUTH"
    responseAction: v.string(), // "BLOCKED", "LOGGED", "ALERTED", "IP_BANNED"
    
    // Investigation
    investigated: v.boolean(),
    investigatedAt: v.optional(v.number()),
    resolutionNotes: v.optional(v.string()),
    
    detectedAt: v.number(),
  })
    .index("by_incident_type", ["incidentType"])
    .index("by_severity", ["severity"])
    .index("by_source_ip", ["sourceIp"])
    .index("by_detected_at", ["detectedAt"]),

  // Compliance Audit Trail (GDPR, SOC 2, PCI-DSS)
  complianceAuditTrail: defineTable({
    userId: v.optional(v.id("users")),
    
    complianceType: v.string(), // "GDPR", "SOC2", "PCI_DSS", "CCPA", "HIPAA"
    
    eventType: v.string(), // "DATA_ACCESS", "DATA_EXPORT", "DATA_DELETION", "CONSENT_GIVEN", "CONSENT_REVOKED", "DATA_BREACH_NOTIFICATION"
    eventDescription: v.string(),
    
    // Data subject
    dataSubjectEmail: v.optional(v.string()),
    dataSubjectId: v.optional(v.id("users")),
    
    // Legal basis (GDPR)
    legalBasis: v.optional(v.string()), // "CONSENT", "CONTRACT", "LEGITIMATE_INTEREST", "LEGAL_OBLIGATION"
    
    // Data categories
    dataCategories: v.array(v.string()), // ["PERSONAL_IDENTIFIABLE", "FINANCIAL", "BIOMETRIC", "HEALTH"]
    
    // Actor
    performedBy: v.optional(v.id("users")),
    performedByEmail: v.optional(v.string()),
    
    // Metadata
    ipAddress: v.optional(v.string()),
    location: v.optional(v.string()),
    
    // Retention
    retentionPeriod: v.optional(v.string()), // "30_days", "1_year", "7_years"
    deletionScheduledFor: v.optional(v.number()),
    
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_compliance_type", ["complianceType"])
    .index("by_event_type", ["eventType"])
    .index("by_data_subject", ["dataSubjectEmail"])
    .index("by_timestamp", ["timestamp"]),

  // A/B test aggregates (used for onboarding/tutorial copy experiments)
  abTestAggregates: defineTable({
    // Unique row key: `${app}:${experimentKey}:${variant}`
    key: v.string(),
    app: v.string(), // "scamvigil" | "chargeback"
    experimentKey: v.string(),
    variant: v.string(), // "A" | "B" | ...

    exposures: v.number(),
    completes: v.number(),
    skips: v.number(),
    videoClicks: v.number(),
    ctaClicks: v.number(),

    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_app_and_experiment", ["app", "experimentKey"]),

  // ============================================
  // MESSAGE TEMPLATES & NOTIFICATIONS
  // ============================================
  
  // Message templates for customer communication automation
  messageTemplates: defineTable({
    appId: v.id("apps"),
    name: v.string(), // e.g., "Pre-Shipment Confirmation", "Post-Delivery Follow-up"
    type: v.string(), // "pre_shipment", "post_delivery", "pre_dispute", "high_risk", "custom"
    channel: v.string(), // "email", "sms", "whatsapp"
    subject: v.optional(v.string()), // For email
    body: v.string(), // Message body with placeholders: {{customer_name}}, {{order_id}}, {{tracking_link}}
    isActive: v.boolean(),
    // ACMA Compliance
    includeStopText: v.boolean(), // Include "Reply STOP to unsubscribe"
    includePrivacyNotice: v.boolean(), // Include privacy policy link
    includeBusinessDetails: v.boolean(), // Include ABN + contact info
    // Trigger conditions
    triggerConditions: v.optional(v.object({
      riskScoreMin: v.optional(v.number()), // Trigger if risk score >= this
      orderValueMin: v.optional(v.number()), // Trigger if order value >= this
      customerType: v.optional(v.string()), // "new", "returning", "flagged"
      delayMinutes: v.optional(v.number()), // Wait X minutes before sending
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_app", ["appId"])
    .index("by_type", ["appId", "type"])
    .index("by_channel", ["appId", "channel"]),

  // Notification events log (sent messages)
  notificationEvents: defineTable({
    appId: v.id("apps"),
    templateId: v.optional(v.id("messageTemplates")),
    // Recipient
    customerId: v.optional(v.string()), // Customer ID from e-commerce platform
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerName: v.optional(v.string()),
    // Message details
    channel: v.string(), // "email", "sms", "whatsapp"
    subject: v.optional(v.string()),
    body: v.string(),
    // Related entities
    orderId: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    disputeAlertId: v.optional(v.id("disputeAlerts")),
    // Trigger info
    triggerType: v.string(), // "pre_shipment", "post_delivery", "pre_dispute", "high_risk", "manual"
    triggerReason: v.optional(v.string()), // e.g., "Risk score 85 exceeded threshold"
    // Status tracking
    status: v.string(), // "pending", "sent", "delivered", "failed", "bounced", "unsubscribed"
    externalMessageId: v.optional(v.string()), // Twilio/SendGrid message ID
    errorMessage: v.optional(v.string()),
    // Delivery tracking
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    openedAt: v.optional(v.number()),
    clickedAt: v.optional(v.number()),
    // Outcome tracking
    customerResponded: v.optional(v.boolean()),
    disputePrevented: v.optional(v.boolean()), // Did this message prevent a chargeback?
    createdAt: v.number(),
  })
    .index("by_app", ["appId"])
    .index("by_customer", ["appId", "customerEmail"])
    .index("by_order", ["appId", "orderId"])
    .index("by_status", ["appId", "status"])
    .index("by_trigger", ["appId", "triggerType"]),

  // Customer communication preferences (opt-in/opt-out)
  customerPreferences: defineTable({
    appId: v.id("apps"),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    // Channel preferences
    emailOptIn: v.boolean(),
    smsOptIn: v.boolean(),
    whatsappOptIn: v.boolean(),
    // Opt-out tracking (ACMA compliance)
    emailOptOutAt: v.optional(v.number()),
    smsOptOutAt: v.optional(v.number()),
    whatsappOptOutAt: v.optional(v.number()),
    optOutReason: v.optional(v.string()),
    // Consent tracking
    consentRecordedAt: v.number(),
    consentSource: v.string(), // "checkout", "account_settings", "manual"
    consentIpAddress: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_app", ["appId"])
    .index("by_email", ["appId", "customerEmail"])
    .index("by_phone", ["appId", "customerPhone"]),

  // Canned Responses (quick replies for support agents)
  cannedResponses: defineTable({
    title: v.string(),
    message: v.string(),
    category: v.string(),
    app: v.string(), // "scamvigil" | "chargeback" | "both"
    
    // Usage tracking
    usageCount: v.number(),
    lastUsedAt: v.optional(v.number()),
    
    // Management
    createdBy: v.id("users"),
    isActive: v.boolean(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_app", ["app"])
    .index("by_is_active", ["isActive"]),

  // ========================================
  // CUSTOMER COMMUNICATION AUTOMATION
  // ========================================

  // Message Log (all sent messages for audit/tracking)
  messageLog: defineTable({
    businessId: v.string(),
    customerId: v.string(),
    channel: v.string(), // "email", "sms", "whatsapp"
    templateId: v.string(),
    recipient: v.string(), // email or phone
    subject: v.string(),
    body: v.string(),
    status: v.string(), // "sent", "failed", "delivered", "opened"
    externalMessageId: v.optional(v.string()), // SendGrid/Twilio ID
    errorMessage: v.optional(v.string()),
    sentAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"])
    .index("by_sent_at", ["sentAt"]),

  // Communication Opt-Outs (ACMA compliance)
  communicationOptOuts: defineTable({
    businessId: v.string(),
    customerId: v.optional(v.string()),
    contactValue: v.string(), // email or phone number
    channel: v.string(), // "email", "sms", "whatsapp", "all"
    reason: v.string(),
    optOutAt: v.number(),
    complianceDeadline: v.number(), // ACMA: must action within 5 business days
  })
    .index("by_business", ["businessId"])
    .index("by_contact", ["contactValue"])
    .index("by_channel", ["channel"]),

});