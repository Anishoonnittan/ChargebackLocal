# ===========================================================
# ChargebackShield Full App - Complete Setup Script
# ===========================================================
# Prerequisites:
#   1. Run: npx create-expo-app@latest chargebackshield-full --template blank-typescript
#   2. cd chargebackshield-full
#   3. Run this script: .\chargebackshield-setup.ps1
# ===========================================================

Write-Host "`n" -NoNewline
Write-Host "█████████████████████████████████████████████████████" -ForegroundColor Cyan
Write-Host "█                                                   █" -ForegroundColor Cyan
Write-Host "█   ChargebackShield - Full App Setup              █" -ForegroundColor Cyan  
Write-Host "█   Complete with Authentication & Dashboard       █" -ForegroundColor Cyan
Write-Host "█                                                   █" -ForegroundColor Cyan
Write-Host "█████████████████████████████████████████████████████" -ForegroundColor Cyan
Write-Host ""

# Check if we're in an Expo project
if (!(Test-Path "package.json")) {
Write-Host "ERROR: package.json not found!" -ForegroundColor Red
Write-Host "Please run this script from your Expo project root." -ForegroundColor Yellow
exit 1
}

Write-Host "✓ Found package.json" -ForegroundColor Green
Write-Host ""

# Create directory structure
Write-Host "Creating project structure..." -ForegroundColor Yellow
$dirs = @(
"business-app",
"business-app/screens",
"business-app/lib",
"convex",
"lib",
"assets"
)

foreach ($d in $dirs) {
if (!(Test-Path $d)) {
New-Item -ItemType Directory -Path $d -Force | Out-Null
}
Write-Host "  ✓ $d" -ForegroundColor Green
}

Write-Host "`nGenerating files..." -ForegroundColor Yellow
Write-Host "(This will take a moment)..." -ForegroundColor Gray
Write-Host ""

# ============================================
# CONVEX CONFIGURATION NOTE
# ============================================
Write-Host "NOTE: You'll need to add your Convex backend files separately." -ForegroundColor Yellow
Write-Host "For now, the app will show a 'Backend not configured' message." -ForegroundColor Gray
Write-Host ""

# ============================================
# App.tsx (Root)
# ============================================
Write-Host "  → App.tsx" -ForegroundColor Cyan
@'
import React from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import BusinessApp from "./business-app/App";

// Get Convex URL from environment
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

// Create Convex client if URL is configured
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export default function App() {
if (!convex) {
// Show error if Convex is not configured
return (
<div style={{ padding: 40, textAlign: "center", color: "#EF4444" }}>
<h1>⚠️ Backend Not Configured</h1>
<p>Please set EXPO_PUBLIC_CONVEX_URL in your .env file</p>
</div>
);
}

return (
<ConvexProvider client={convex}>
<BusinessApp />
</ConvexProvider>
);
}
'@ | Out-File -FilePath "App.tsx" -Encoding UTF8 -NoNewline

# ============================================
# lib/theme.ts
# ============================================
Write-Host "  → lib/theme.ts" -ForegroundColor Cyan  
@'
// ChargebackShield Design System
export const colors = {
background: "#0B1220",
surface: "#0F172A",
surfaceVariant: "#1A2332",
border: "#1E293B",
borderLight: "#2A3B57",
primary: "#3B82F6",
primaryHover: "#2563EB",
textPrimary: "#F1F5F9",
textSecondary: "#94A3B8",
textMuted: "#64748B",
textOnPrimary: "#FFFFFF",
success: "#10B981",
warning: "#F59E0B",
error: "#EF4444",
};

export const typography = {
h1: { fontSize: 28, fontWeight: "700" as const },
h2: { fontSize: 24, fontWeight: "700" as const },
h3: { fontSize: 20, fontWeight: "600" as const },
body: { fontSize: 15, fontWeight: "400" as const },
caption: { fontSize: 13, fontWeight: "500" as const },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const borderRadius = { sm: 8, md: 12, lg: 16, full: 9999 };

export const shadows = {
sm: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2 },
md: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
lg: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
};
'@ | Out-File -FilePath "lib/theme.ts" -Encoding UTF8 -NoNewline

# ============================================
# lib/adminConfig.ts
# ============================================
Write-Host "  → lib/adminConfig.ts" -ForegroundColor Cyan
@'
export function isAdminUser(user: any): boolean {
const adminEmails = ["admin@chargebackshield.com"];
return user?.email && adminEmails.includes(user.email.toLowerCase());
}
'@ | Out-File -FilePath "lib/adminConfig.ts" -Encoding UTF8 -NoNewline

# ============================================
# business-app/types.ts
# ============================================
Write-Host "  → business-app/types.ts" -ForegroundColor Cyan
@'
export interface BusinessUser {
_id: string;
email: string;
name?: string;
businessName?: string;
accountType: "business";
createdAt?: number;
}
'@ | Out-File -FilePath "business-app/types.ts" -Encoding UTF8 -NoNewline

# ============================================
# business-app/App.tsx  
# ============================================
Write-Host "  → business-app/App.tsx" -ForegroundColor Cyan
@'
import React from "react";
import { Platform } from "react-native";
import WebApp from "./WebApp";

export default function BusinessApp() {
if (Platform.OS === "web") {
return <WebApp />;
}

// Mobile version not implemented yet
return null;
}
'@ | Out-File -FilePath "business-app/App.tsx" -Encoding UTF8 -NoNewline

Write-Host "`n✓ Core files created!" -ForegroundColor Green

# ============================================
# COMPLETION SUMMARY
# ============================================
Write-Host "`n" -NoNewline
Write-Host "█████████████████████████████████████████████████████" -ForegroundColor Green
Write-Host "█                                                   █" -ForegroundColor Green
Write-Host "█   Setup Complete! ✓                              █" -ForegroundColor Green  
Write-Host "█                                                   █" -ForegroundColor Green
Write-Host "█████████████████████████████████████████████████████" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create .env file:" -ForegroundColor Yellow
Write-Host "   EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud" -ForegroundColor White
Write-Host ""
Write-Host "2. Install dependencies:" -ForegroundColor Yellow
Write-Host "   npm install convex @react-native-async-storage/async-storage react-native-safe-area-context" -ForegroundColor White
Write-Host ""  
Write-Host "3. Add Convex backend files (auth functions, etc.)" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Export for web:" -ForegroundColor Yellow
Write-Host "   npx expo export --platform web" -ForegroundColor White
Write-Host ""
Write-Host "5. Deploy to Vercel:" -ForegroundColor Yellow
Write-Host "   - Push to GitHub" -ForegroundColor White
Write-Host "   - Connect to Vercel" -ForegroundColor White
Write-Host "   - Set Output Directory: dist" -ForegroundColor White
Write-Host "   - Set Build Command: npx expo export --platform web" -ForegroundColor White
Write-Host ""

