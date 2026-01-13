// Credit Bureau Integration Library
// Equifax, Experian, TransUnion API integration
// Provides credit risk analysis, identity verification, synthetic fraud detection

export interface CreditBureauData {
  customerEmail: string;
  customerPhone?: string;
  firstName?: string;
  lastName?: string;
  ssn?: string; // Last 4 digits or full (encrypted)
  dateOfBirth?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  orderAmount: number;
  orderId?: string;
}

export interface CreditReportData {
  creditScore: number; // 300-850 (FICO)
  creditScoreRange: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
  accountsOpen: number;
  accountsClosed: number;
  totalCreditLimit: number;
  creditUtilization: number; // Percentage
  paymentHistory: {
    onTimePayments: number;
    latePayments30Days: number;
    latePayments60Days: number;
    latePayments90Days: number;
  };
  derogatoryMarks: {
    bankruptcies: number;
    liens: number;
    judgments: number;
    collections: number;
  };
  recentInquiries: number; // Hard inquiries in last 6 months
  oldestAccount: number; // Age in years
  averageAccountAge: number; // Age in years
  addressHistory: Array<{
    address: string;
    reportedDate: string;
    verificationStatus: 'verified' | 'unverified' | 'mismatch';
  }>;
  phoneHistory: Array<{
    phone: string;
    type: 'landline' | 'mobile' | 'voip' | 'unknown';
    reportedDate: string;
  }>;
  identityVerification: {
    ssnValid: boolean;
    ssnMatchesName: boolean;
    addressVerified: boolean;
    phoneVerified: boolean;
    dobVerified: boolean;
  };
  syntheticFraudScore: number; // 0-100, higher = more suspicious
  velocityAlerts: {
    recentAddressChanges: number; // Last 90 days
    recentPhoneChanges: number; // Last 90 days
    recentNameChanges: number; // Last 90 days
  };
}

export interface CreditRiskSignal {
  name: string;
  status: 'passed' | 'warned' | 'failed';
  score: number;
  message: string;
  details: string;
  bureau?: 'equifax' | 'experian' | 'transunion' | 'combined';
}

export interface CreditRiskAnalysisResult {
  orderId?: string;
  customerEmail: string;
  orderAmount: number;
  creditRiskScore: number; // 0-100 (our internal score)
  creditReportData?: CreditReportData;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  signals: CreditRiskSignal[];
  recommendation: 'approve' | 'review' | 'block';
  actionRequired: string;
  estimatedChargebackProbability: number; // 0-100%
}

/**
 * Analyze credit risk using credit bureau data
 * This performs a SOFT INQUIRY (no impact on customer credit score)
 */
export async function analyzeCreditRisk(data: CreditBureauData): Promise<CreditRiskAnalysisResult> {
  // In production, this would make API calls to Equifax/Experian/TransUnion
  // For now, we'll simulate the response with realistic data
  
  const creditReport = await fetchCreditReport(data);
  const signals = generateCreditRiskSignals(creditReport, data);
  
  // Calculate overall credit risk score
  const totalScore = signals.reduce((sum, signal) => sum + signal.score, 0);
  const creditRiskScore = Math.min(Math.round(totalScore / signals.length), 100);
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (creditRiskScore < 25) riskLevel = 'low';
  else if (creditRiskScore < 50) riskLevel = 'medium';
  else if (creditRiskScore < 75) riskLevel = 'high';
  else riskLevel = 'critical';
  
  // Recommendation
  let recommendation: 'approve' | 'review' | 'block';
  if (creditRiskScore < 30) recommendation = 'approve';
  else if (creditRiskScore < 70) recommendation = 'review';
  else recommendation = 'block';
  
  // Estimate chargeback probability based on credit data
  const estimatedChargebackProbability = calculateChargebackProbability(creditReport, data);
  
  return {
    orderId: data.orderId,
    customerEmail: data.customerEmail,
    orderAmount: data.orderAmount,
    creditRiskScore,
    creditReportData: creditReport,
    riskLevel,
    signals,
    recommendation,
    actionRequired: recommendation === 'block' ? 'DECLINE' : recommendation === 'review' ? 'REVIEW' : 'APPROVE',
    estimatedChargebackProbability,
  };
}

/**
 * Fetch credit report from credit bureaus (soft inquiry)
 * In production, integrate with Equifax, Experian, TransUnion APIs
 */
async function fetchCreditReport(data: CreditBureauData): Promise<CreditReportData> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In production, make real API calls:
  // - Equifax: https://api.equifax.com/business/credit-report
  // - Experian: https://api.experian.com/consumerservices/credit-report
  // - TransUnion: https://api.transunion.com/credit-report
  
  // Generate mock credit report for demonstration
  return generateMockCreditReport(data);
}

/**
 * Generate credit risk signals from credit bureau data
 */
function generateCreditRiskSignals(
  creditReport: CreditReportData,
  orderData: CreditBureauData
): CreditRiskSignal[] {
  const signals: CreditRiskSignal[] = [];
  
  // 1. Credit Score Analysis
  let creditScoreSignal: CreditRiskSignal;
  if (creditReport.creditScore >= 720) {
    creditScoreSignal = {
      name: 'Credit Score',
      status: 'passed',
      score: 0,
      message: `Excellent credit score (${creditReport.creditScore})`,
      details: 'Customer has excellent credit history. Very low chargeback risk.',
      bureau: 'combined',
    };
  } else if (creditReport.creditScore >= 650) {
    creditScoreSignal = {
      name: 'Credit Score',
      status: 'warned',
      score: 20,
      message: `Good credit score (${creditReport.creditScore})`,
      details: 'Customer has good credit history. Moderate chargeback risk.',
      bureau: 'combined',
    };
  } else if (creditReport.creditScore >= 580) {
    creditScoreSignal = {
      name: 'Credit Score',
      status: 'warned',
      score: 50,
      message: `Fair credit score (${creditReport.creditScore})`,
      details: 'Customer has fair credit history. Elevated chargeback risk.',
      bureau: 'combined',
    };
  } else {
    creditScoreSignal = {
      name: 'Credit Score',
      status: 'failed',
      score: 80,
      message: `Poor credit score (${creditReport.creditScore})`,
      details: 'Customer has poor credit history. High chargeback risk.',
      bureau: 'combined',
    };
  }
  signals.push(creditScoreSignal);
  
  // 2. Payment History Analysis
  const totalPayments = creditReport.paymentHistory.onTimePayments + 
    creditReport.paymentHistory.latePayments30Days +
    creditReport.paymentHistory.latePayments60Days +
    creditReport.paymentHistory.latePayments90Days;
  
  const onTimeRate = totalPayments > 0 ? 
    (creditReport.paymentHistory.onTimePayments / totalPayments) * 100 : 100;
  
  if (onTimeRate >= 95) {
    signals.push({
      name: 'Payment History',
      status: 'passed',
      score: 0,
      message: `Excellent payment history (${onTimeRate.toFixed(1)}% on-time)`,
      details: 'Customer consistently pays bills on time. Low fraud risk.',
      bureau: 'combined',
    });
  } else if (onTimeRate >= 80) {
    signals.push({
      name: 'Payment History',
      status: 'warned',
      score: 25,
      message: `Good payment history (${onTimeRate.toFixed(1)}% on-time)`,
      details: 'Customer has some late payments. Moderate fraud risk.',
      bureau: 'combined',
    });
  } else {
    signals.push({
      name: 'Payment History',
      status: 'failed',
      score: 65,
      message: `Poor payment history (${onTimeRate.toFixed(1)}% on-time)`,
      details: 'Customer has frequent late payments. High chargeback risk.',
      bureau: 'combined',
    });
  }
  
  // 3. Credit Utilization Analysis
  if (creditReport.creditUtilization < 30) {
    signals.push({
      name: 'Credit Utilization',
      status: 'passed',
      score: 0,
      message: `Low credit utilization (${creditReport.creditUtilization}%)`,
      details: 'Customer uses credit responsibly. Low financial stress.',
      bureau: 'combined',
    });
  } else if (creditReport.creditUtilization < 70) {
    signals.push({
      name: 'Credit Utilization',
      status: 'warned',
      score: 30,
      message: `Moderate credit utilization (${creditReport.creditUtilization}%)`,
      details: 'Customer has moderate credit usage. Some financial pressure.',
      bureau: 'combined',
    });
  } else {
    signals.push({
      name: 'Credit Utilization',
      status: 'failed',
      score: 70,
      message: `High credit utilization (${creditReport.creditUtilization}%)`,
      details: 'Customer is maxing out credit. High financial stress. Elevated chargeback risk.',
      bureau: 'combined',
    });
  }
  
  // 4. Derogatory Marks Analysis
  const totalDerogatoryMarks = 
    creditReport.derogatoryMarks.bankruptcies +
    creditReport.derogatoryMarks.liens +
    creditReport.derogatoryMarks.judgments +
    creditReport.derogatoryMarks.collections;
  
  if (totalDerogatoryMarks === 0) {
    signals.push({
      name: 'Derogatory Marks',
      status: 'passed',
      score: 0,
      message: 'No derogatory marks',
      details: 'No bankruptcies, liens, judgments, or collections found.',
      bureau: 'combined',
    });
  } else if (totalDerogatoryMarks <= 2) {
    signals.push({
      name: 'Derogatory Marks',
      status: 'warned',
      score: 40,
      message: `${totalDerogatoryMarks} derogatory mark(s) found`,
      details: 'Some negative marks on credit report. Elevated risk.',
      bureau: 'combined',
    });
  } else {
    signals.push({
      name: 'Derogatory Marks',
      status: 'failed',
      score: 85,
      message: `${totalDerogatoryMarks} derogatory marks found`,
      details: 'Multiple bankruptcies, liens, or collections. Very high risk.',
      bureau: 'combined',
    });
  }
  
  // 5. Identity Verification
  const identityVerified = 
    creditReport.identityVerification.ssnValid &&
    creditReport.identityVerification.ssnMatchesName &&
    creditReport.identityVerification.addressVerified;
  
  if (identityVerified) {
    signals.push({
      name: 'Identity Verification',
      status: 'passed',
      score: 0,
      message: 'Identity fully verified',
      details: 'SSN, name, and address match credit bureau records.',
      bureau: 'combined',
    });
  } else {
    signals.push({
      name: 'Identity Verification',
      status: 'failed',
      score: 90,
      message: 'Identity verification failed',
      details: 'SSN, name, or address do not match credit bureau records. Possible identity theft.',
      bureau: 'combined',
    });
  }
  
  // 6. Synthetic Identity Fraud Detection
  if (creditReport.syntheticFraudScore < 30) {
    signals.push({
      name: 'Synthetic Identity Check',
      status: 'passed',
      score: 0,
      message: 'Low synthetic fraud risk',
      details: 'Identity appears legitimate with established credit history.',
      bureau: 'combined',
    });
  } else if (creditReport.syntheticFraudScore < 60) {
    signals.push({
      name: 'Synthetic Identity Check',
      status: 'warned',
      score: 35,
      message: 'Moderate synthetic fraud risk',
      details: 'Some indicators of synthetic identity (thin file, recent accounts).',
      bureau: 'combined',
    });
  } else {
    signals.push({
      name: 'Synthetic Identity Check',
      status: 'failed',
      score: 95,
      message: 'High synthetic fraud risk',
      details: 'Strong indicators of synthetic identity fraud. New SSN, no credit history, rapid account opening.',
      bureau: 'combined',
    });
  }
  
  // 7. Recent Inquiries Analysis (velocity check)
  if (creditReport.recentInquiries === 0) {
    signals.push({
      name: 'Credit Inquiries',
      status: 'passed',
      score: 0,
      message: 'No recent inquiries',
      details: 'No hard inquiries in the last 6 months.',
      bureau: 'combined',
    });
  } else if (creditReport.recentInquiries <= 3) {
    signals.push({
      name: 'Credit Inquiries',
      status: 'warned',
      score: 15,
      message: `${creditReport.recentInquiries} recent inquiries`,
      details: 'Some recent credit applications. Normal activity.',
      bureau: 'combined',
    });
  } else {
    signals.push({
      name: 'Credit Inquiries',
      status: 'failed',
      score: 60,
      message: `${creditReport.recentInquiries} recent inquiries`,
      details: 'Excessive credit applications. Possible bust-out fraud or financial distress.',
      bureau: 'combined',
    });
  }
  
  // 8. Address/Phone Velocity Check
  const recentChanges = 
    creditReport.velocityAlerts.recentAddressChanges +
    creditReport.velocityAlerts.recentPhoneChanges;
  
  if (recentChanges === 0) {
    signals.push({
      name: 'Contact Velocity',
      status: 'passed',
      score: 0,
      message: 'Stable contact information',
      details: 'No recent address or phone changes.',
      bureau: 'combined',
    });
  } else if (recentChanges <= 2) {
    signals.push({
      name: 'Contact Velocity',
      status: 'warned',
      score: 20,
      message: `${recentChanges} recent contact change(s)`,
      details: 'Some recent changes to address or phone number.',
      bureau: 'combined',
    });
  } else {
    signals.push({
      name: 'Contact Velocity',
      status: 'failed',
      score: 70,
      message: `${recentChanges} recent contact changes`,
      details: 'Frequent address/phone changes. Possible fraud or identity manipulation.',
      bureau: 'combined',
    });
  }
  
  // 9. Order Amount vs. Credit Limit Analysis
  const orderToLimitRatio = (orderData.orderAmount / creditReport.totalCreditLimit) * 100;
  
  if (orderToLimitRatio < 10) {
    signals.push({
      name: 'Order-to-Credit Ratio',
      status: 'passed',
      score: 0,
      message: `Order is ${orderToLimitRatio.toFixed(1)}% of credit limit`,
      details: 'Order amount is well within customer financial capacity.',
      bureau: 'combined',
    });
  } else if (orderToLimitRatio < 25) {
    signals.push({
      name: 'Order-to-Credit Ratio',
      status: 'warned',
      score: 25,
      message: `Order is ${orderToLimitRatio.toFixed(1)}% of credit limit`,
      details: 'Order is moderate relative to credit capacity.',
      bureau: 'combined',
    });
  } else {
    signals.push({
      name: 'Order-to-Credit Ratio',
      status: 'failed',
      score: 65,
      message: `Order is ${orderToLimitRatio.toFixed(1)}% of credit limit`,
      details: 'Order is very large relative to credit capacity. High default risk.',
      bureau: 'combined',
    });
  }
  
  return signals;
}

/**
 * Calculate chargeback probability based on credit data
 */
function calculateChargebackProbability(
  creditReport: CreditReportData,
  orderData: CreditBureauData
): number {
  let probability = 5; // Base 5% probability
  
  // Credit score impact
  if (creditReport.creditScore < 580) probability += 25;
  else if (creditReport.creditScore < 650) probability += 15;
  else if (creditReport.creditScore < 720) probability += 5;
  
  // Payment history impact
  const totalLatePayments = 
    creditReport.paymentHistory.latePayments30Days +
    creditReport.paymentHistory.latePayments60Days +
    creditReport.paymentHistory.latePayments90Days;
  
  if (totalLatePayments > 5) probability += 20;
  else if (totalLatePayments > 2) probability += 10;
  
  // Derogatory marks impact
  const totalDerogatoryMarks = 
    creditReport.derogatoryMarks.bankruptcies +
    creditReport.derogatoryMarks.liens +
    creditReport.derogatoryMarks.collections;
  
  if (totalDerogatoryMarks > 0) probability += 15 * totalDerogatoryMarks;
  
  // Credit utilization impact
  if (creditReport.creditUtilization > 80) probability += 15;
  else if (creditReport.creditUtilization > 50) probability += 8;
  
  // Identity verification impact
  if (!creditReport.identityVerification.ssnValid) probability += 30;
  if (!creditReport.identityVerification.addressVerified) probability += 20;
  
  // Synthetic fraud impact
  if (creditReport.syntheticFraudScore > 60) probability += 40;
  else if (creditReport.syntheticFraudScore > 30) probability += 15;
  
  return Math.min(probability, 95); // Cap at 95%
}

/**
 * Generate mock credit report for demonstration
 */
function generateMockCreditReport(data: CreditBureauData): CreditReportData {
  // Simulate different credit profiles based on email/order patterns
  const isHighRisk = 
    data.customerEmail.includes('tempmail') ||
    data.orderAmount > 1000;
  
  const isMediumRisk = 
    data.orderAmount > 500 ||
    !data.customerPhone;
  
  if (isHighRisk) {
    return {
      creditScore: 540,
      creditScoreRange: 'poor',
      accountsOpen: 2,
      accountsClosed: 1,
      totalCreditLimit: 2500,
      creditUtilization: 92,
      paymentHistory: {
        onTimePayments: 8,
        latePayments30Days: 4,
        latePayments60Days: 2,
        latePayments90Days: 1,
      },
      derogatoryMarks: {
        bankruptcies: 0,
        liens: 0,
        judgments: 1,
        collections: 2,
      },
      recentInquiries: 8,
      oldestAccount: 1.5,
      averageAccountAge: 0.9,
      addressHistory: [
        {
          address: data.billingAddress?.street || 'Unknown',
          reportedDate: '2024-01-15',
          verificationStatus: 'unverified',
        },
        {
          address: '456 Previous St',
          reportedDate: '2023-11-20',
          verificationStatus: 'verified',
        },
      ],
      phoneHistory: [
        {
          phone: data.customerPhone || 'Unknown',
          type: 'voip',
          reportedDate: '2024-02-01',
        },
      ],
      identityVerification: {
        ssnValid: false,
        ssnMatchesName: false,
        addressVerified: false,
        phoneVerified: false,
        dobVerified: false,
      },
      syntheticFraudScore: 78,
      velocityAlerts: {
        recentAddressChanges: 3,
        recentPhoneChanges: 2,
        recentNameChanges: 1,
      },
    };
  } else if (isMediumRisk) {
    return {
      creditScore: 660,
      creditScoreRange: 'fair',
      accountsOpen: 5,
      accountsClosed: 3,
      totalCreditLimit: 12000,
      creditUtilization: 45,
      paymentHistory: {
        onTimePayments: 42,
        latePayments30Days: 3,
        latePayments60Days: 1,
        latePayments90Days: 0,
      },
      derogatoryMarks: {
        bankruptcies: 0,
        liens: 0,
        judgments: 0,
        collections: 1,
      },
      recentInquiries: 3,
      oldestAccount: 4.5,
      averageAccountAge: 3.2,
      addressHistory: [
        {
          address: data.billingAddress?.street || 'Unknown',
          reportedDate: '2022-06-10',
          verificationStatus: 'verified',
        },
      ],
      phoneHistory: [
        {
          phone: data.customerPhone || 'Unknown',
          type: 'mobile',
          reportedDate: '2022-06-10',
        },
      ],
      identityVerification: {
        ssnValid: true,
        ssnMatchesName: true,
        addressVerified: true,
        phoneVerified: true,
        dobVerified: true,
      },
      syntheticFraudScore: 25,
      velocityAlerts: {
        recentAddressChanges: 1,
        recentPhoneChanges: 0,
        recentNameChanges: 0,
      },
    };
  } else {
    return {
      creditScore: 760,
      creditScoreRange: 'excellent',
      accountsOpen: 8,
      accountsClosed: 5,
      totalCreditLimit: 45000,
      creditUtilization: 18,
      paymentHistory: {
        onTimePayments: 124,
        latePayments30Days: 1,
        latePayments60Days: 0,
        latePayments90Days: 0,
      },
      derogatoryMarks: {
        bankruptcies: 0,
        liens: 0,
        judgments: 0,
        collections: 0,
      },
      recentInquiries: 1,
      oldestAccount: 12.5,
      averageAccountAge: 7.8,
      addressHistory: [
        {
          address: data.billingAddress?.street || 'Unknown',
          reportedDate: '2018-03-15',
          verificationStatus: 'verified',
        },
      ],
      phoneHistory: [
        {
          phone: data.customerPhone || 'Unknown',
          type: 'mobile',
          reportedDate: '2018-03-15',
        },
      ],
      identityVerification: {
        ssnValid: true,
        ssnMatchesName: true,
        addressVerified: true,
        phoneVerified: true,
        dobVerified: true,
      },
      syntheticFraudScore: 5,
      velocityAlerts: {
        recentAddressChanges: 0,
        recentPhoneChanges: 0,
        recentNameChanges: 0,
      },
    };
  }
}

/**
 * Check if credit bureau integration is enabled for merchant
 */
export function isCreditBureauEnabled(merchantId: string): boolean {
  // In production, check merchant's subscription plan and configuration
  // Credit bureau checks typically require higher-tier plans due to API costs
  return true; // For demo purposes
}

/**
 * Get cost estimate for credit bureau check
 */
export function getCreditCheckCost(checkType: 'soft' | 'hard'): number {
  // Typical costs:
  // - Soft inquiry: $0.50 - $1.50 per check
  // - Hard inquiry: $2.00 - $5.00 per check
  return checkType === 'soft' ? 1.00 : 3.50;
}