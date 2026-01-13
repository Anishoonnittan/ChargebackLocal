# Business App Architecture

## ✅ Consumer App (Scam Vigil) - Mode Restriction Complete

**Scam Vigil now only supports:**
- ✅ **Personal** - Individual fraud protection
- ✅ **Charity** - Donor & volunteer verification
- ✅ **Community** - Member safety & marketplace protection

**Business modes removed from Scam Vigil:**
- ❌ **Business B2C** - Moved to ChargebackShield
- ❌ **Business B2B/Enterprise** - Moved to ChargebackShield

**Rationale:**
- Clean separation of consumer vs. business products
- Different value propositions and pricing
- Shopify sellers should download ChargebackShield, not Scam Vigil
- Prevents confusion in Settings and mode selection

---

## Overview
This project contains **two separate React Native applications** that share a single Convex database:

1. **Scam Vigil** (Consumer App) - Personal safety & fraud detection
2. **ChargebackShield** (Business App) - B2B chargeback fraud prevention for e-commerce

---

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│  SCAM VIGIL (Consumer App)                  │
│  Target: Personal users, families           │
│  Features: Profile scanning, call screening │
│            message verification, dark web    │
└─────────────────────────────────────────────┘
                    ↓
         ┌──────────────────────┐
         │  Convex Backend      │
         │  (Shared Database)   │
         │  ✓ Single data model │
         │  ✓ Shared auth       │
         │  ✓ Role-based access │
         └──────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  CHARGEBACKSHIELD (Business App)            │
│  Target: Shopify/e-commerce merchants       │
│  Features: Chargeback detection, dispute    │
│            management, analytics            │
└─────────────────────────────────────────────┘
```

---

## Database Schema (Shared)

### User Roles & Account Types

**`users` table fields:**
- `role`: `"user" | "admin" | "superadmin" | "business_user"`
  - Controls access permissions
  - Business app users have role `"business_user"`

- `accountType`: `"personal" | "business" | "charity" | "community"`
  - User segment classification
  - **`"business"`** = B2B chargeback app users

- `userMode`: UI mode selector
  - Determines which dashboard/navigation to show

### Data Isolation Strategy

**Consumer Tables (Scam Vigil only):**
- `scans` - Profile scans
- `securityScans` - Link, email, SMS verification
- `messageScans` - WhatsApp/SMS analysis
- `callScreening` - Phone call analysis
- `darkWebMonitors` - Data breach monitoring

**Business Tables (ChargebackShield only):**
- `chargebackScans` - Risk assessment on orders
- `disputeEvidencePackages` - Evidence generation
- `disputeAlerts` - Pre-chargeback interventions
- `riskAlerts` - Real-time fraud alerts
- `analyticsSnapshots` - Business metrics
- `identityVerifications` - Customer verification
- `integrations` - Shopify/Stripe connections
- `webhookEvents` - Platform webhooks

**Shared Tables:**
- `users` - Authentication & profiles
- `sessions` - Session management
- `passwords` - Password hashing
- `subscriptions` - Stripe billing
- `payments` - Payment history

---

## File Structure

```
project-root/
│
├── App.tsx                          # Scam Vigil (Consumer) entry point
├── business-app/                    # ChargebackShield (Business) app
│   ├── App.tsx                      # Business app entry point
│   ├── screens/                     # Business-specific screens
│   │   ├── BusinessDashboard.tsx
│   │   ├── ChargebackAnalytics.tsx
│   │   ├── DisputeManagement.tsx
│   │   ├── IntegrationSettings.tsx
│   │   └── BusinessAuth.tsx
│   └── components/                  # Business UI components
│
├── convex/                          # Shared backend (BOTH APPS)
│   ├── schema.ts                    # Unified database schema
│   ├── auth.ts                      # Shared authentication
│   ├── users.ts                     # User management
│   ├── chargebacks.ts               # Business logic
│   └── scans.ts                     # Consumer logic
│
├── lib/                             # Shared utilities
│   ├── theme.ts                     # Design system (used by both)
│   └── api.ts                       # API helpers
│
├── hooks/                           # Shared React hooks
│   └── useAuth.ts
│
├── screens/                         # Consumer app screens
│   ├── DashboardScreen.tsx
│   ├── ScanScreen.tsx
│   └── SecurityScreen.tsx
│
└── components/                      # Consumer UI components
```

---

## User Flows

### Consumer User (Scam Vigil)
```
Landing Page
    ↓
Select "Personal Safety"
    ↓
Sign Up/Sign In
    ↓
Onboarding (collect user details)
    ↓
Dashboard
    ✓ Profile scanning
    ✓ Call screening
    ✓ Message verification
    ✓ Dark web monitoring
```

### Business User (ChargebackShield)
```
Business Landing Page
    ↓
Sign Up/Sign In (business email)
    ↓
Business Onboarding
    ✓ Business name
    ✓ Shopify/Stripe credentials
    ✓ Industry (e-commerce, SaaS, etc.)
    ↓
Business Dashboard
    ✓ Chargeback analytics
    ✓ Risk alerts
    ✓ Dispute management
    ✓ ROI tracking
```

---

## Authentication Strategy

**Both apps use the same Convex auth system:**

1. User signs up → Creates entry in `users` table
2. App detects `accountType`:
   - `"personal"` → Scam Vigil consumer app
   - `"business"` → ChargebackShield business app
3. Session token stored in AsyncStorage
4. Role-based access control via `role` field

**Cross-app authentication:**
- Users can technically have accounts in both apps
- Same email can exist with different `accountType`
- Separate billing/subscriptions per account type

---

## Why This Architecture?

### ✅ Advantages
1. **Cost efficient** - One backend, not double infrastructure
2. **Single source of truth** - Unified auth, billing, user management
3. **Future cross-sell** - Consumer discovers business features later
4. **Shared fraud data** - Business chargeback data can inform consumer scam detection
5. **Easier scaling** - One data pipeline, one admin panel

### ⚠️ Considerations
1. **Role-based access control** - Must enforce data isolation in queries
2. **Schema complexity** - Schema must handle both consumer + business data
3. **Testing** - Need to test both apps independently
4. **Deployment** - Two separate app bundles (but same backend)

---

## Marketing & Branding

### Consumer App: **Scam Vigil**
- **Tagline:** "Spot Scams Before They Spot You"
- **Target:** Personal users, families, elderly protection
- **Pricing:** Freemium → Premium ($9.99/mo)
- **Distribution:** App Store, Google Play

### Business App: **ChargebackShield**
- **Tagline:** "Stop Chargebacks. Save Revenue."
- **Target:** Shopify sellers, e-commerce businesses, SaaS companies
- **Pricing:** SaaS ($99-$999/mo based on order volume)
- **Distribution:** Shopify App Store, direct B2B sales

**Key:** Users don't know these apps share a database. To them, they're completely separate products with different branding.

---

## Development Workflow

### Working on Consumer App (Scam Vigil)
```bash
# Edit files in root directory
# Run consumer app
npm start
```

### Working on Business App (ChargebackShield)
```bash
# Edit files in business-app/ directory
# Run business app
cd business-app
npm start
```

### Updating Shared Backend
```bash
# Edit convex/ files
# Sync database (affects BOTH apps)
npx convex dev
```

---

## Next Steps

1. ✅ Schema updated to support both apps
2. 🔄 Create business app structure (in progress)
3. ⏳ Build business dashboard screens
4. ⏳ Implement chargeback analytics
5. ⏳ Add Shopify/Stripe integrations
6. ⏳ Deploy both apps separately

---

## Questions?

This architecture allows you to:
- Market the consumer app to individuals
- Market the business app to Shopify sellers
- Cross-sell between them later
- Keep costs low with shared infrastructure
- Scale independently based on product-market fit