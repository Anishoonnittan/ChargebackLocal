# 🚀 API + STRIPE + NAME IMPLEMENTATION PLAN

**Date:** January 2025  
**Status:** Ready to implement  
**Estimated Time:** 3-5 days

---

## 📋 **PART 1: NAME SUGGESTIONS** (Based on scam protection usage)

### **🏆 TOP RECOMMENDATION:**

### **"ScamShield"** 
**Tagline:** "Australia's #1 Scam Protection Platform"

**Why this name:**
- ✅ Clear, direct, memorable
- ✅ Immediately communicates scam protection
- ✅ Strong, protective imagery (shield)
- ✅ Easy to pronounce in any language
- ✅ Available domain: scamshield.com.au
- ✅ Short, punchy, professional
- ✅ Works for all 4 segments (Personal, Business, Charity, Community)

**Brand positioning:**
- "ScamShield protects millions of Australians from scams"
- "Shield yourself with ScamShield"
- "Your shield against scammers"

---

### **OTHER STRONG OPTIONS:**

| Name | Tagline | Pros | Cons | Rating |
|------|---------|------|------|--------|
| **ScamShield** | Stop scams before they start | Direct, clear, protective | None | ⭐⭐⭐⭐⭐ |
| **TrustGuard** | Verify everything, trust nothing | Keeps "Trust" theme, professional | Less direct about scams | ⭐⭐⭐⭐ |
| **Sentinel AU** | Australia's scam watchdog | Strong, vigilant imagery | "Sentinel" harder to spell | ⭐⭐⭐⭐ |
| **ScamStop** | Stop scams, protect Australians | Action-oriented, clear | Sounds reactive vs proactive | ⭐⭐⭐ |
| **GuardianAU** | Protecting Australians 24/7 | Warm, protective | Generic | ⭐⭐⭐ |
| **ScamProof** | Make yourself scam-proof | Prevention focus | Implies 100% protection | ⭐⭐⭐ |
| **TrueShield** | The truth protects | Combines current name | TrueProfile still better known | ⭐⭐⭐ |
| **Fortress** | Your financial fortress | Strong protection imagery | Too general | ⭐⭐ |
| **SafeCheck** | Check before you lose | Simple, clear | Too basic | ⭐⭐ |

---

### **🎯 FINAL RECOMMENDATION:**

**Rename app to: "ScamShield"**

**Implementation:**
1. Update app name in `.a0/build.yaml`
2. Update all app screens (AuthScreen, OnboardingScreen, etc.)
3. Update taglines throughout
4. Register domain: scamshield.com.au
5. Update branding assets
6. Submit name change to App Store/Play Store

**Time:** 2-3 hours

---

## 📋 **PART 2: API IMPLEMENTATION** (For Business segment)

### **🎯 OVERVIEW:**

Business users need programmatic access to scam detection features via REST API. This enables:
- E-commerce stores to screen customers automatically
- HR departments to verify candidates at scale
- Real estate agencies to verify tenants
- Financial institutions to detect fraud

### **✅ ENDPOINTS TO BUILD:**

#### **1. Profile Scanner API**
```
POST /api/v1/scan/profile
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "profileUrl": "https://facebook.com/johndoe",
  "platform": "facebook"
}

Response:
{
  "success": true,
  "data": {
    "trustScore": 85,
    "riskLevel": "real",
    "insights": [...],
    "scamPhrases": [],
    "hasSyntheticFace": false
  },
  "usage": {
    "requestsRemaining": 4750,
    "dailyLimit": 5000
  }
}
```

#### **2. Email Scanner API**
```
POST /api/v1/scan/email
Authorization: Bearer {api_key}

{
  "email": "john@example.com",
  "context": "customer_signup"
}

Response:
{
  "success": true,
  "data": {
    "score": 95,
    "riskLevel": "safe",
    "isDisposable": false,
    "isCatchAll": false,
    "findings": [...]
  }
}
```

#### **3. Bulk Profile Scanner API**
```
POST /api/v1/scan/bulk
Authorization: Bearer {api_key}

{
  "profiles": [
    {"url": "...", "platform": "facebook"},
    {"url": "...", "platform": "linkedin"}
  ]
}

Response:
{
  "success": true,
  "jobId": "bulk_abc123",
  "status": "processing",
  "estimatedTime": 120 // seconds
}

GET /api/v1/scan/bulk/{jobId}
-> Returns results when complete
```

#### **4. Link Scanner API**
```
POST /api/v1/scan/link
{ "url": "https://suspicious-site.com" }
```

#### **5. Phone Scanner API**
```
POST /api/v1/scan/phone
{ "phoneNumber": "+61412345678" }
```

#### **6. Investment Scanner API**
```
POST /api/v1/scan/investment
{
  "type": "crypto_wallet",
  "input": "0x1234...abcd"
}
```

### **🔒 AUTHENTICATION & SECURITY:**

**API Key Generation:**
- Business users generate API keys in "API Access" screen
- Keys are hashed (SHA-256) before storage
- Each key has:
  - Environment (production/development/sandbox)
  - Rate limit (requests per minute)
  - Daily quota
  - Allowed endpoints (permission scoping)

**Request Authentication:**
```
Headers:
- Authorization: Bearer {api_key}
- X-API-Secret: {api_secret}
- X-Request-Signature: HMAC-SHA256(request_body, api_secret)
```

**Rate Limiting:**
- Per-minute: 60 requests (configurable per plan)
- Per-day: 5,000 requests (Starter), 50,000 (Pro), Unlimited (Enterprise)
- Returns 429 Too Many Requests when exceeded

**IP Whitelisting:**
- Business users can whitelist IPs
- Reject requests from non-whitelisted IPs

### **📊 USAGE TRACKING:**

Every API request logs:
- API key ID
- Endpoint
- Status code
- Response time
- IP address
- Timestamp

**Displayed in Analytics Dashboard:**
- Requests per day (chart)
- Most used endpoints
- Error rate
- Average response time
- Top IPs

### **📚 API DOCUMENTATION:**

Auto-generated docs at: `/api/docs`

**Includes:**
- Authentication guide
- Endpoint reference
- Code examples (cURL, JavaScript, Python, PHP)
- Rate limits
- Error codes
- Webhooks

### **⚙️ IMPLEMENTATION FILES:**

**New files to create:**
1. `convex/api/http.ts` - HTTP API routes (Convex supports this!)
2. `convex/api/auth.ts` - API key verification
3. `convex/api/rateLimit.ts` - Rate limiting logic
4. `convex/api/profileScanner.ts` - Profile scan endpoint
5. `convex/api/emailScanner.ts` - Email scan endpoint
6. `convex/api/bulkScanner.ts` - Bulk scan endpoint
7. `screens/APIDocsScreen.tsx` - Interactive API docs
8. Update `screens/APIAccessScreen.tsx` - Show API keys + generate new ones

**Time estimate:** 2-3 days

---

## 📋 **PART 3: STRIPE INTEGRATION** (Payment processing)

### **🎯 OVERVIEW:**

Stripe will handle:
- Subscription billing (monthly/annual)
- Add-on purchases (business features)
- Per-user billing (charity/community)
- Payment method management
- Invoicing
- Webhooks (subscription updates)

### **✅ STRIPE PRODUCTS TO CREATE:**

#### **Personal Plans:**
```
1. Personal Premium
   - $9.99/month or $99/year
   - Stripe Price ID: price_personal_premium_monthly
   
2. Personal Family
   - $19.99/month or $199/year
   - Stripe Price ID: price_personal_family_monthly
```

#### **Business Plans:**
```
1. Business Starter
   - $99/month or $990/year
   - 1 add-on included
   
2. Business Professional (MOST POPULAR)
   - $249/month or $2,490/year
   - 3 add-ons included
   
3. Business Enterprise
   - $499/month or $4,990/year
   - All features included
```

#### **Business Add-Ons (À La Carte):**
```
- Chargeback Shield: $99/month
- BEC Protection: $49/month
- Rental Safety: $49/month
- Tenant Screening: $79/month
- Customer Screening: $79/month
- Candidate Verification: $79/month
- API Access: $29/month (5K requests/day)
```

#### **Charity/Community:**
```
- Charity: $1/user/month (min $10/month, max $1,000/month)
- Community: $1/member/month (min $19/month, max $500/month)
```

### **💳 CHECKOUT FLOW:**

**User Journey:**
```
1. User taps "Upgrade" or "Pricing & Plans" in Settings
2. PricingScreen shows segment-specific plans
3. User selects plan → taps "Subscribe"
4. Opens Stripe Checkout (hosted page)
5. User enters payment details
6. Stripe redirects back to app
7. Webhook updates subscription status
8. User gains access to premium features
```

**Payment Methods Accepted:**
- Credit/debit cards (Visa, Mastercard, Amex)
- Apple Pay (iOS)
- Google Pay (Android)
- Bank transfer (AU BPAY) - for Enterprise

### **🔔 WEBHOOK HANDLING:**

**Stripe Webhooks to handle:**

```typescript
// convex/stripe/webhooks.ts

export const handleStripeWebhook = internalAction({
  handler: async (ctx, { event }) => {
    switch (event.type) {
      case "customer.subscription.created":
        // New subscription → activate premium features
        break;
        
      case "customer.subscription.updated":
        // Plan changed → update user access
        break;
        
      case "customer.subscription.deleted":
        // Canceled → revoke premium access
        break;
        
      case "invoice.payment_succeeded":
        // Payment successful → log payment history
        break;
        
      case "invoice.payment_failed":
        // Payment failed → send email alert
        break;
        
      case "customer.subscription.trial_will_end":
        // Trial ending soon → send reminder
        break;
    }
  },
});
```

### **🔒 FEATURE GATING:**

**Check subscription before allowing premium features:**

```typescript
// convex/subscriptions.ts

export const checkFeatureAccess = query({
  args: { feature: v.string() },
  handler: async (ctx, { feature }) => {
    const user = await getCurrentUser(ctx);
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    
    if (!subscription) {
      return { hasAccess: false, reason: "no_subscription" };
    }
    
    // Check if plan includes this feature
    const planFeatures = getPlanFeatures(subscription.plan);
    if (!planFeatures.includes(feature)) {
      return { hasAccess: false, reason: "plan_upgrade_required" };
    }
    
    return { hasAccess: true };
  },
});
```

**Usage in screens:**

```typescript
// screens/ChargebackShieldScreen.tsx

const { hasAccess } = useQuery(api.subscriptions.checkFeatureAccess, {
  feature: "chargeback_shield",
});

if (!hasAccess) {
  return <UpgradePrompt feature="Chargeback Shield" price="$99/month" />;
}

// Show feature...
```

### **📊 SUBSCRIPTION MANAGEMENT:**

**SettingsScreen additions:**
```
Settings
├─ Account
│  ├─ Subscription: Business Professional ($249/mo)
│  ├─ Billing: •••• 4242 (Visa)
│  ├─ Next billing date: Feb 15, 2025
│  ├─ Manage subscription → (Stripe Customer Portal)
│  └─ Cancel subscription
└─ ...
```

**Stripe Customer Portal:**
- Update payment method
- View invoices
- Change plan
- Cancel subscription
- Update billing address

### **⚙️ IMPLEMENTATION FILES:**

**New files to create:**
1. `convex/stripe/checkout.ts` - Create checkout session
2. `convex/stripe/webhooks.ts` - Handle Stripe webhooks
3. `convex/stripe/subscriptions.ts` - Subscription queries
4. `convex/stripe/customers.ts` - Customer management
5. `screens/CheckoutScreen.tsx` - Payment flow (or use Stripe hosted)
6. `screens/SubscriptionManagementScreen.tsx` - Manage subscription
7. `lib/stripe.ts` - Stripe SDK initialization

**Environment variables needed:**
```
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Time estimate:** 2-3 days

---

## 📊 **IMPLEMENTATION TIMELINE:**

| Task | Time | Priority |
|------|------|----------|
| **1. Rename to "ScamShield"** | 3 hours | 🔴 High |
| **2. API Implementation** | 2-3 days | 🟠 Medium |
| **3. Stripe Integration** | 2-3 days | 🔴 High |
| **4. Testing & QA** | 1 day | 🔴 High |
| **Total** | **5-7 days** | |

---

## 🎯 **RECOMMENDED BUILD ORDER:**

### **Week 1:**
1. ✅ Rename app to "ScamShield" (3 hours)
2. ✅ Build Stripe integration (2-3 days)
3. ✅ Test payment flows (1 day)

### **Week 2:**
4. ✅ Build API endpoints (2-3 days)
5. ✅ Test API + rate limiting (1 day)
6. ✅ Write API documentation (1 day)

### **Week 3:**
7. ✅ Beta test with real customers
8. ✅ Fix bugs + optimize
9. ✅ Launch! 🚀

---

## ✅ **NEXT STEPS:**

**Should I:**
1. ✅ **Start with Stripe integration** (enables revenue immediately)?
2. ✅ **Start with API implementation** (differentiates from competitors)?
3. ✅ **Rename app to "ScamShield" first** (rebrand before launch)?
4. ✅ **Build all 3 simultaneously** (5-7 days total)?

**My recommendation:** Build in this order:
1. **Rename to ScamShield** (3 hours) → Fresh brand
2. **Stripe integration** (3 days) → Start making money
3. **API implementation** (3 days) → B2B differentiator

**Total: 6-7 days to launch with payments + API** 🚀

---

**Ready to build? Let me know which to start with!** 🎯