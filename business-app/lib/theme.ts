/**
 * ChargebackShield Design System
 * Consistent colors, typography, spacing for the entire app
 * Business-focused fraud protection platform
 */

export const colors = {
  // Primary - Teal (trust, security)
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#14B8A6',
  primarySurface: '#CCFBF1',
  
  // Secondary - Coral (urgency, action)
  secondary: '#E11D48',
  secondaryDark: '#BE123C',
  secondaryLight: '#FB7185',
  
  // Neutrals
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  surfaceDark: '#E2E8F0',
  
  // Text
  text: '#0F172A',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
  
  // Material Design aliases
  onSurface: '#0F172A',
  outline: '#94A3B8',
  
  // Risk Score Colors
  riskLow: '#22C55E',        // 🟢 Low Risk (0-39)
  riskMedium: '#F59E0B',     // 🟡 Medium Risk (40-69)
  riskHigh: '#EF4444',       // 🔴 High Risk (70-100)
  
  // Semantic
  success: '#22C55E',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  
  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Overlay
  overlay: 'rgba(15, 23, 42, 0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600" as const,
    lineHeight: 32,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  // Body
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },
  buttonLarge: {
    fontSize: 18,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  // Size shortcuts for convenience
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Export as default theme object for easy import
export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
};

/**
 * Returns Risk Score color based on score value
 */
export function getRiskScoreColor(score: number): string {
  if (score >= 70) return colors.riskHigh;
  if (score >= 40) return colors.riskMedium;
  return colors.riskLow;
}

/**
 * Returns Risk Score label based on score value
 */
export function getRiskScoreLabel(score: number): string {
  if (score >= 70) return 'High Risk';
  if (score >= 40) return 'Medium Risk';
  return 'Low Risk';
}

/**
 * Returns Risk Score emoji based on score value
 */
export function getRiskScoreEmoji(score: number): string {
  if (score >= 70) return '🔴';
  if (score >= 40) return '🟡';
  return '🟢';
}