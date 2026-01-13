# ChargebackShield Complete Setup Script
# ===========================================
# This script creates all essential files for the ChargebackShield app
# Run after: npx create-expo-app@latest . --template blank-typescript

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "ChargebackShield Full App Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Step 1: Create directory structure
Write-Host "`nStep 1: Creating directories..." -ForegroundColor Yellow

$directories = @(
"business-app",
"business-app/screens",
"business-app/lib",
"convex",
"lib"
)

foreach ($dir in $directories) {
if (!(Test-Path $dir)) {
New-Item -ItemType Directory -Path $dir -Force | Out-Null
Write-Host "  ✓ Created: $dir" -ForegroundColor Green
} else {
Write-Host "  • Exists: $dir" -ForegroundColor Gray
}
}

Write-Host "`nStep 2: Generating files..." -ForegroundColor Yellow
Write-Host "This may take a moment..." -ForegroundColor Gray

# File 1: lib/theme.ts
Write-Host "`n  Creating lib/theme.ts..." -ForegroundColor Cyan
@'
// Design System
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
body: { fontSize: 15, fontWeight: "400" as const },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const borderRadius = { sm: 8, md: 12, lg: 16, full: 9999 };

export const shadows = {
sm: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2 },
md: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
lg: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
};
'@ | Out-File -FilePath "lib/theme.ts" -Encoding UTF8

# File 2: lib/adminConfig.ts
Write-Host "  Creating lib/adminConfig.ts..." -ForegroundColor Cyan
@'
export function isAdminUser(user: any): boolean {
const adminEmails = ["admin@chargebackshield.com"];
return user?.email && adminEmails.includes(user.email.toLowerCase());
}
'@ | Out-File -FilePath "lib/adminConfig.ts" -Encoding UTF8

# File 3: business-app/types.ts
Write-Host "  Creating business-app/types.ts..." -ForegroundColor Cyan
@'
export interface BusinessUser {
_id: string;
email: string;
name?: string;
businessName?: string;
accountType: "business";
createdAt?: number;
}
'@ | Out-File -FilePath "business-app/types.ts" -Encoding UTF8

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Set EXPO_PUBLIC_CONVEX_URL in .env" -ForegroundColor White
Write-Host "2. Run: npm install @react-native-async-storage/async-storage" -ForegroundColor White
Write-Host "3. Run: npx expo export --platform web" -ForegroundColor White
Write-Host "4. Push to GitHub and deploy to Vercel`n" -ForegroundColor White

FULLEOF

echo "Created full-setup.ps1"
wc -l /project/full-setup.ps1
