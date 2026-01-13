# TrueProfile Pro - Browser Extension

> **Australia's #1 Scam Detector** - Now available as a browser extension for Chrome, Edge, and Firefox!

Protect yourself from scams while browsing with real-time profile scanning, link verification, email validation, and message analysis.

---

## 🎯 Features

### 1. 👤 Profile Scanner
Automatically scan social media profiles for scams and fake accounts.

**Supported Platforms:**
- Facebook
- Instagram  
- Twitter/X
- LinkedIn

**Features:**
- Auto-detect profiles when you visit them
- Trust Score badge injected directly on profiles
- One-click detailed analysis
- Add profiles to watchlist
- Keyboard shortcut: `Ctrl+Shift+S`

---

### 2. 🔗 Link Scanner
Scan suspicious links before clicking them.

**How to Use:**
- **Right-click any link** → "Scan Link with TrueProfile Pro"
- **Or:** Open extension popup → Link tab → Paste URL

**Detects:**
- Phishing websites
- Malware URLs
- Suspicious domains
- Trust score analysis

**Use Cases:**
- Email links
- Social media shared links
- Chat/WhatsApp links
- Unknown websites

---

### 3. 📧 Email Scanner
Verify email addresses for legitimacy.

**How to Use:**
- **Select email address** → Right-click → "Verify Email with TrueProfile Pro"
- **Or:** Open extension popup → Email tab → Paste email

**Checks:**
- Email validity
- Disposable email detection
- Free provider identification
- Risk scoring

**Use Cases:**
- Contact form verification
- New sender validation
- Business email verification
- Suspicious email checks

---

### 4. 💬 Message Scanner
Analyze text messages for scam patterns.

**How to Use:**
- **Select suspicious text** → Right-click → "Scan Selection with TrueProfile Pro"
- **Or:** Open extension popup → Message tab → Paste message

**Detects 7 Scam Types:**
1. **Urgency language** - "Act now", "Expires today"
2. **Impersonation** - Fake ATO, banks, government
3. **Phishing** - "Click to verify", password requests
4. **Payment requests** - Bitcoin, gift cards, wire transfers
5. **Lottery scams** - "You won $1 million"
6. **Romance scams** - Emotional manipulation
7. **Grammar errors** - "Kindly do the needful"

**Also Extracts:**
- Suspicious links
- Phone numbers
- Detailed recommendations

**Use Cases:**
- WhatsApp Web messages
- Gmail/Outlook messages
- Facebook Messenger
- Any suspicious text content

---

## 🚀 Installation

### Chrome / Edge
1. Download the extension from [Chrome Web Store](#)
2. Click "Add to Chrome/Edge"
3. Sign in to TrueProfile Pro
4. Start scanning!

### Firefox
1. Download from [Firefox Add-ons](#)
2. Click "Add to Firefox"
3. Sign in to TrueProfile Pro
4. Start scanning!

### Developer Mode (Testing)
1. Clone this repository
2. Open Chrome/Edge → `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `browser-extension` folder
6. Extension installed!

---

## 📖 How to Use

### Method 1: Context Menu (Right-Click)
1. **On a link:** Right-click → "Scan Link with TrueProfile Pro"
2. **On selected text:** Right-click → "Scan Selection with TrueProfile Pro"  
3. **On selected email:** Right-click → "Verify Email with TrueProfile Pro"

### Method 2: Extension Popup
1. Click the TrueProfile Pro icon in toolbar
2. Choose tab: Profile / Link / Email / Message
3. Paste content into input field
4. Click scan button
5. View results instantly!

### Method 3: Keyboard Shortcut
- Press `Ctrl+Shift+S` (Windows/Linux)
- Press `Cmd+Shift+S` (Mac)
- Scans current profile page

---

## 🎨 Screenshot Tour

### Multi-Tab Popup Interface
```
┌─────────────────────────────────────┐
│ 🛡️ TrueProfile Pro - Scam Detector  │
├─────────────────────────────────────┤
│ [👤 Profile] [🔗 Link] [📧 Email] [💬 Message] │
├─────────────────────────────────────┤
│                                     │
│  Paste URL to scan:                 │
│  ┌─────────────────────────────────┐│
│  │ https://suspicious-site.com     ││
│  └─────────────────────────────────┘│
│                                     │
│  [🔗 Scan Link]                     │
│                                     │
│  Or right-click any link →          │
│  "Scan Link with TrueProfile Pro"   │
│                                     │
├─────────────────────────────────────┤
│ Today's Activity                    │
│ Scans performed: 12                 │
│ Threats blocked: 3                  │
└─────────────────────────────────────┘
```

### Context Menu
```
Right-click on suspicious link:
┌────────────────────────────────────┐
│ Open link in new tab               │
│ Copy link address                  │
│ ────────────────────────────       │
│ 🔗 Scan Link with TrueProfile Pro  │ ← NEW!
│ 🔍 Scan Selection with TrueProfile...│ ← NEW!
│ 📧 Verify Email with TrueProfile...│ ← NEW!
└────────────────────────────────────┘
```

### Result Card
```
┌─────────────────────────────────────┐
│ Link Scan Result          [🚨 SCAM] │
├─────────────────────────────────────┤
│           🚨 15%                     │
│                                     │
│ URL: https://fake-ato-verify...     │
│                                     │
│ ⚠️ Phishing Detected                │
│ This website impersonates the ATO.  │
│ DO NOT enter personal information.  │
│                                     │
│ 🚩 Red Flags:                       │
│ • Domain recently registered        │
│ • SSL certificate invalid           │
│ • Known phishing pattern            │
└─────────────────────────────────────┘
```

---

## 🔒 Privacy & Security

### What We Access
- ✅ **URLs you actively scan** (only when you click scan)
- ✅ **Profile pages you visit** (Facebook, Instagram, etc.)
- ✅ **Text you select and scan** (only when you right-click → scan)

### What We DON'T Access
- ❌ Your browsing history
- ❌ Passwords or personal data
- ❌ Content you don't explicitly scan
- ❌ Private messages (unless you paste them)

### Data Storage
- Results cached locally for 24 hours
- Authentication token stored securely
- No tracking or analytics

### Permissions Explained
- **activeTab** - Access current tab when you click scan
- **storage** - Cache scan results locally
- **notifications** - Show desktop alerts for high-risk scans
- **contextMenus** - Add right-click scan options
- **clipboardRead** - Read clipboard when you paste

---

## 🛠️ Development

### Tech Stack
- **Manifest V3** (latest Chrome extension standard)
- **Vanilla JavaScript** (no frameworks - fast & lightweight)
- **Service Worker** (background processing)
- **Content Scripts** (profile badge injection)

### File Structure
```
browser-extension/
├── manifest.json           # Extension configuration
├── background/
│   └── service-worker.js   # Background tasks + API calls
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.css           # Styling
│   └── popup.js            # Popup logic
├── content-scripts/
│   ├── facebook.js         # Facebook profile scanner
│   ├── instagram.js        # Instagram profile scanner
│   ├── twitter.js          # Twitter/X profile scanner
│   └── linkedin.js         # LinkedIn profile scanner
└── styles/
    └── badge.css           # Trust Score badge styles
```

### Testing Locally
1. Load extension in developer mode
2. Navigate to:
   - Facebook profile → See badge
   - Right-click a link → Scan
   - Select email → Verify
   - Copy message → Scan
3. Open popup → Test all 4 tabs
4. Check console for errors

---

## 📊 API Endpoints

All scanners connect to TrueProfile Pro backend:

```javascript
POST /scan              # Profile scanning
POST /scan-link         # Link verification
POST /scan-email        # Email validation
POST /scan-message      # Message analysis
POST /monitoring/add    # Add to watchlist
POST /monitoring/check  # Check watchlist updates
```

**Authentication:** Bearer token from TrueProfile Pro account

---

## 🐛 Troubleshooting

### Extension Not Working
1. **Sign in first** - Click extension → Sign In
2. **Refresh page** - After installing, reload the page
3. **Check permissions** - Extension needs activeTab permission

### Context Menu Not Showing
1. **Right-click in the right place:**
   - Links: Right-click directly on link
   - Email: Select email text first, then right-click
   - Message: Select text first, then right-click

### No Scan Results
1. **Check internet connection**
2. **Verify you're signed in** (check popup)
3. **Try again** - API might be temporarily busy

### Badge Not Showing on Profiles
1. **Supported platforms only:** Facebook, IG, Twitter, LinkedIn
2. **Refresh page** after installing extension
3. **Profile page only** - Won't show on news feed

---

## 🎉 Changelog

### Version 1.0.0 (Current)
- ✅ Profile Scanner (Facebook, IG, Twitter, LinkedIn)
- ✅ Link Scanner with context menu
- ✅ Email Scanner with context menu
- ✅ Message Scanner with context menu
- ✅ Multi-tab popup interface
- ✅ Desktop notifications
- ✅ Watchlist monitoring
- ✅ Daily activity stats
- ✅ Keyboard shortcut (Ctrl+Shift+S)

---

## 📞 Support

- **Website:** [trueprofilepro.com.au](https://trueprofilepro.com.au)
- **Email:** support@trueprofilepro.com.au
- **Report Scams:** Use the "Report to ACCC" button in app
- **Bug Reports:** Create issue on GitHub

---

## 📜 License

© 2024 TrueProfile Pro. All rights reserved.

---

## 🇦🇺 Built for Australians

Specifically designed to detect Australian scams:
- ATO impersonation
- Centrelink fraud
- Australia Post scams
- Bank impersonation (CBA, NAB, Westpac, ANZ)
- Romance scams targeting Aussies

**Spot Scams Before They Spot You!** 🛡️🇦🇺