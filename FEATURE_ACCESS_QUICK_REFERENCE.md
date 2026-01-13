# 🎯 Quick Reference: Feature Access by Account Type

## How to Check Feature Access in Code

```typescript
import { hasFeatureAccess, getAvailableFeatures, getB2BFeatures } from '../lib/featureAccess';

// Check if user can access a specific feature
const { hasAccess, reason } = hasFeatureAccess(
  'chargebackShield',  // feature ID
  'business',          // user's account type
  'starter'            // user's subscription tier (optional)
);

if (!hasAccess) {
  // Show upgrade prompt with reason
  showUpgradeModal(reason);
}

// Get all features available to user
const features = getAvailableFeatures('business', 'professional');

// Get only B2B features
const b2bFeatures = getB2BFeatures();
```

## Feature IDs Reference

### Personal Features
- `romanceScam` - Romance Scam Protection
- `rentalSafety` - Rental Safety
- `familyProtection` - Family Protection Mode
- `investmentScan` - Investment Scam Detector
- `marketplaceSafety` - Marketplace Safety
- `contractorVetting` - Contractor Vetting

### Business Features (B2B)
- `chargebackShield` - **Chargeback Shield** (EXCLUSIVE)
- `becProtection` - BEC Protection
- `customerScreening` - Customer Screening (EXCLUSIVE)
- `tenantScreening` - Tenant Screening
- `candidateVerification` - Candidate Verification (EXCLUSIVE)
- `bulkComparison` - Bulk Comparison
- `analyticsDashboard` - Analytics Dashboard
- `apiAccess` - **API Access** (EXCLUSIVE)

### Charity Features
- `volunteerScreening` - Volunteer Screening (EXCLUSIVE)
- `donorVerification` - Donor Verification (EXCLUSIVE)
- `impactReports` - Impact Reports

### Community Features
- `communityAlerts` - Community Alerts (EXCLUSIVE)
- `contractorVetting` - Contractor Vetting
- `marketplaceSafety` - Marketplace Safety
- `impactReports` - Impact Reports

## Account Types
- `personal` - Individual users protecting themselves
- `business` - Companies protecting their business
- `charity` - Nonprofits protecting vulnerable people
- `community` - Neighborhood groups protecting their community

## Subscription Tiers

### Personal Tiers
- `free` - 10 scans/day, basic features
- `premium` - Unlimited scans, advanced protection
- `family` - Family Protection + Call Screening + Deepfake

### Business Tiers
- `free` - Trial (not used in production)
- `starter` - $99/mo, 5 users, 1 add-on
- `professional` - $249/mo, 15 users, 3 add-ons
- `enterprise` - $499/mo, unlimited users, all features

### Charity/Community Tiers
- `nonprofit` - $1/user/month for charities
- `group` - $1/member/month for communities

## Where Features Are Displayed

1. **Dashboard Quick Actions** (`screens/DashboardScreen.tsx`)
   - Shows 4 most relevant features for each account type
   - Business accounts see: Scan, Bulk Compare, Chargeback Shield, Analytics

2. **Security Screen** (`screens/SecurityScreen.tsx`)
   - Shows all available features filtered by account type
   - Features have badges: "NEW", "B2B", "ENTERPRISE"

3. **Pricing Screen** (`screens/PricingScreen.tsx`)
   - Shows segment-specific pricing and add-ons
   - Business add-ons clearly priced

## Testing Different Account Types

To test features for different account types:

1. Sign in to the app
2. Go to **More → Settings → Account Type**
3. Change account type (Personal/Business/Charity/Community)
4. Return to Dashboard - Quick actions will update
5. Go to Security - Available features will update

## Key Files

- `lib/featureAccess.ts` - Feature access control logic
- `App.tsx` - Main app routing
- `screens/DashboardScreen.tsx` - Dashboard with quick actions
- `screens/SecurityScreen.tsx` - Feature catalog
- `screens/PricingScreen.tsx` - Pricing by segment
- `screens/ChargebackShieldScreen.tsx` - Chargeback feature