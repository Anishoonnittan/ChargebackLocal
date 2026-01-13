/**
 * SMS Verification for high-risk orders
 * Uses Twilio SMS API
 */

// Store for verification codes (in production, use database)
const verificationCodes: Map<string, { code: string; expiresAt: number; attempts: number }> = new Map();

export interface SMSVerificationResult {
  success: boolean;
  verificationId: string;
  message: string;
  error?: string;
}

/**
 * Send SMS verification code to customer
 */
export async function sendVerificationSMS(
  phone: string,
  customerName?: string
): Promise<SMSVerificationResult> {
  try {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with expiration (10 minutes)
    const verificationId = `${phone}-${Date.now()}`;
    verificationCodes.set(verificationId, {
      code,
      expiresAt: Date.now() + (10 * 60 * 1000),
      attempts: 0,
    });
    
    // In production, use Twilio API:
    // const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    // const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    // const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;
    
    // const response = await fetch(
    //   `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    //   {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
    //       "Content-Type": "application/x-www-form-urlencoded",
    //     },
    //     body: new URLSearchParams({
    //       To: phone,
    //       From: TWILIO_PHONE,
    //       Body: `Your ScamVigil verification code is: ${code}. Valid for 10 minutes.`,
    //     }),
    //   }
    // );
    
    // Mock success for now
    console.log(`📱 SMS sent to ${phone}: Code ${code}`);
    
    return {
      success: true,
      verificationId,
      message: `Verification code sent to ${phone}`,
    };
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return {
      success: false,
      verificationId: "",
      message: "Failed to send verification code",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verify SMS code
 */
export async function verifySMSCode(
  verificationId: string,
  code: string
): Promise<{ success: boolean; message: string; attemptsLeft?: number }> {
  const verification = verificationCodes.get(verificationId);
  
  if (!verification) {
    return {
      success: false,
      message: "Verification session not found or expired",
    };
  }
  
  // Check expiration
  if (Date.now() > verification.expiresAt) {
    verificationCodes.delete(verificationId);
    return {
      success: false,
      message: "Verification code expired. Please request a new one.",
    };
  }
  
  // Increment attempts
  verification.attempts += 1;
  
  // Check if code matches
  if (verification.code === code) {
    verificationCodes.delete(verificationId);
    return {
      success: true,
      message: "Phone number verified successfully!",
    };
  }
  
  // Max 3 attempts
  const attemptsLeft = 3 - verification.attempts;
  if (attemptsLeft <= 0) {
    verificationCodes.delete(verificationId);
    return {
      success: false,
      message: "Too many failed attempts. Please request a new code.",
      attemptsLeft: 0,
    };
  }
  
  return {
    success: false,
    message: "Invalid verification code",
    attemptsLeft,
  };
}

/**
 * Resend verification code
 */
export async function resendVerificationSMS(phone: string): Promise<SMSVerificationResult> {
  return sendVerificationSMS(phone);
}