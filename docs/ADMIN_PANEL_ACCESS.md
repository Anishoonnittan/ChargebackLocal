# 🛡️ **ADMIN PANEL - ACCESS GUIDE**

## **📍 WHERE IS THE ADMIN PANEL?**

The Admin Panel is a powerful dashboard for managing ScamShield Pro's platform, APIs, analytics, and branding.

---

## **🚀 HOW TO ACCESS:**

### **Step 1: Sign In as Admin**
- ✅ **First user** who signs up automatically becomes an admin
- ✅ All subsequent users are regular users (no admin access)

### **Step 2: Navigate to Settings**
1. Open ScamShield Pro app
2. Tap **"More"** tab (5th icon in bottom navigation)
3. You're now in the Settings screen

### **Step 3: Access Admin Panel**
1. Scroll down to the **"ADMIN"** section
2. Tap on the **"Admin Panel"** card
3. ✅ You're in!

**Note:** The ADMIN section is **only visible to users with `role: "admin"` or `role: "superadmin"`**

---

## **🔑 WHO CAN ACCESS?**

| **User Type** | **Role** | **Can Access Admin Panel?** |
|---------------|----------|------------------------------|
| First user | `admin` | ✅ Yes |
| Other users | `user` | ❌ No |
| Promoted users | `admin` or `superadmin` | ✅ Yes |

---

## **✨ WHAT'S IN THE ADMIN PANEL?**

### **1. 📊 Platform Overview**
- This month's stats (scans, real profiles, suspicious, fakes)
- Estimated ad spend saved ($4,520 AUD)
- Scam trends in Australia (top 5 scam types)
- API usage monitoring (6,700 / 10,000 calls)

### **2. 🔑 API Keys**
- View & manage live API keys
- Copy keys to clipboard
- Show/hide for security
- Security warnings

### **3. 📖 API Documentation**
- `POST /api/v1/scan` - Analyze profiles & get Trust Score
- `GET /api/v1/scam-phrases` - Get Australian scam phrases
- Full cURL examples with authentication
- Webhook configuration
- Rate limiting toggle

### **4. 🎨 White-Label / Branding**
- Customize brand name
- Change primary color (with live preview)
- Custom support email
- Custom domain setup (CNAME configuration)
- Logo URL upload
- **Live preview** of branded scanner

### **5. 📄 Generate Reports**
- **Ad Engagement Audit** - CSV breakdown
- **Monthly Summary** - 30-day overview
- **Client Report** - White-labeled PDF with ROI
- **Compliance Report** - APP-compliant documentation

**Report Contents:**
- ✅ Executive Summary
- ✅ Profile Analysis Breakdown
- ✅ Trust Score Distribution
- ✅ Scam Phrase Detection
- ✅ ROI & Savings Calculation
- ✅ Recommendations & Next Steps
- ✅ APP Compliance Statement

### **6. 📈 Analytics** (Coming Soon)
- Real-time API usage monitoring
- Quota tracking

---

## **🛠️ HOW TO MAKE SOMEONE AN ADMIN:**

Currently, there's no UI for this - you need to use Convex dashboard:

1. Open Convex dashboard
2. Go to your project → Data → `users` table
3. Find the user
4. Edit their record
5. Change `role` field from `"user"` to `"admin"`
6. Save changes
7. ✅ User now has admin access!

**Or use the mutation:**
```typescript
// In Convex dashboard functions:
await ctx.runMutation(api.users.makeUserAdmin, { 
  userId: "USER_ID_HERE" 
});
```

---

## **🔒 SECURITY:**

- ✅ Admin Panel is **role-gated** (only admins can access)
- ✅ First user automatically becomes admin
- ✅ All Convex functions check for admin role
- ✅ No UI way to promote users (prevents unauthorized access)
- ✅ Must use Convex dashboard to promote users (secure)

---

## **📱 NAVIGATION FLOW:**

```
App Home
  └─> More (Settings) tab
        └─> ADMIN section (only if user is admin)
              └─> Admin Panel card
                    └─> Admin Dashboard
                          ├─> Overview
                          ├─> API Keys
                          ├─> API Docs
                          ├─> Branding
                          ├─> Reports
                          └─> Analytics (coming soon)
```

---

## **✅ FEATURES SUMMARY:**

| **Feature** | **Status** | **Description** |
|-------------|------------|-----------------|
| Platform Overview | ✅ Live | Stats, trends, savings |
| API Keys | ✅ Live | View, copy, manage keys |
| API Documentation | ✅ Live | Endpoints, examples, webhooks |
| White-Label Branding | ✅ Live | Customize app appearance |
| Generate Reports | ✅ Live | PDF reports for clients |
| Analytics Dashboard | ⏳ Coming Soon | Real-time usage monitoring |

---

## **🎯 QUICK TIPS:**

1. **First Sign-Up = Admin:**
   - The very first user who signs up automatically becomes an admin
   - No setup required!

2. **Admin Button Only Shows for Admins:**
   - Regular users won't see the ADMIN section
   - No confusion, clean UI

3. **ScamShield Pro Branding:**
   - All instances of "TrueProfile Pro" have been updated to "ScamShield Pro"
   - Consistent branding throughout

4. **Access from Browser Extension:**
   - Not yet available in browser extension
   - Admin Panel is mobile app only for now

---

## **🆘 TROUBLESHOOTING:**

### **I don't see the ADMIN section!**
- ✅ Check: Are you the first user?
- ✅ Check: Is your `role` set to `"admin"` in Convex?
- ✅ Check: Are you on the Settings (More) screen?

### **I can't access the Admin Panel!**
- ✅ Make sure you're signed in
- ✅ Check your user role in Convex dashboard
- ✅ Try signing out and back in

### **I need to make someone else an admin!**
- ✅ Use Convex dashboard to update their `role` field
- ✅ Or use the `makeUserAdmin` mutation
- ✅ No UI for this (security feature)

---

**Your Admin Panel is now fully functional and accessible!** 🎉

Check it out: **More → ADMIN → Admin Panel** 🚀