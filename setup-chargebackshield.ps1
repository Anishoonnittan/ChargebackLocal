# ChargebackShield Full App Setup Script
# Run this in your new chargebackshield-full folder after: npx create-expo-app@latest . --template blank-typescript

Write-Host "Setting up ChargebackShield full app..." -ForegroundColor Cyan

# Create directories
Write-Host "Creating directories..." -ForegroundColor Yellow
$dirs = @(
"business-app",
"business-app/screens",
"business-app/lib",
"convex",
"lib"
)

foreach ($dir in $dirs) {
if (!(Test-Path $dir)) {
New-Item -ItemType Directory -Path $dir -Force | Out-Null
Write-Host "  Created: $dir" -ForegroundColor Green
}
}

# Create lib/theme.ts
Write-Host "Creating lib/theme.ts..." -ForegroundColor Yellow
@'
// Design System - Colors, Typography, Spacing

export const colors = {
// Backgrounds
background: "#0B1220",
surface: "#0F172A",
surfaceVariant: "#1A2332",

// Borders
border: "#1E293B",
borderLight: "#2A3B57",

// Brand
primary: "#3B82F6",
primaryHover: "#2563EB",

// Text
textPrimary: "#F1F5F9",
textSecondary: "#94A3B8",
textMuted: "#64748B",
textOnPrimary: "#FFFFFF",

// Status
success: "#10B981",
warning: "#F59E0B",
error: "#EF4444",
info: "#3B82F6",
};

export const typography = {
h1: { fontSize: 28, fontWeight: "700" as const },
h2: { fontSize: 24, fontWeight: "700" as const },
h3: { fontSize: 20, fontWeight: "600" as const },
body: { fontSize: 15, fontWeight: "400" as const },
caption: { fontSize: 13, fontWeight: "500" as const },
};

export const spacing = {
xs: 4,
sm: 8,
md: 16,
lg: 24,
xl: 32,
};

export const borderRadius = {
sm: 8,
md: 12,
lg: 16,
full: 9999,
};

export const shadows = {
sm: {
shadowColor: "#000",
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.25,
shadowRadius: 4,
elevation: 2,
},
md: {
shadowColor: "#000",
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.3,
shadowRadius: 8,
elevation: 4,
},
lg: {
shadowColor: "#000",
shadowOffset: { width: 0, height: 8 },
shadowOpacity: 0.35,
shadowRadius: 16,
elevation: 8,
},
};
'@ | Out-File -FilePath "lib/theme.ts" -Encoding UTF8
Write-Host "  Created lib/theme.ts" -ForegroundColor Green

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Install dependencies: npm install" -ForegroundColor White
Write-Host "2. Export for web: npx expo export --platform web" -ForegroundColor White
Write-Host "3. Push to GitHub and deploy to Vercel" -ForegroundColor White

