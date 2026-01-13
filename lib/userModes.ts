import { colors } from "./theme";
import type { UserMode, UserModeDefinition } from "../types/userMode";

export const USER_MODES: Array<UserModeDefinition> = [
  {
    key: "personal",
    title: "Personal",
    shortLabel: "Personal",
    description: "Protect yourself and your family from scams, impersonation, and risky links.",
    icon: "person",
    accentColor: colors.primary,
  },
  {
    key: "charity",
    title: "Charity",
    shortLabel: "Charity",
    description: "Verify volunteers & donors, and protect your mission from bad actors.",
    icon: "heart",
    accentColor: colors.secondary,
  },
  {
    key: "community",
    title: "Community",
    shortLabel: "Community",
    description: "Share alerts, keep members safe, and reduce marketplace/contractor scams.",
    icon: "people",
    accentColor: colors.warning,
  },
];

export function getUserModeDefinition(mode: UserMode | undefined | null): UserModeDefinition {
  const fallback = USER_MODES[0];
  if (!mode) return fallback;
  return USER_MODES.find((m) => m.key === mode) ?? fallback;
}

export function inferUserModeFromAccountType(
  accountType: string | undefined | null
): UserMode {
  switch (accountType) {
    case "charity":
      return "charity";
    case "community":
      return "community";
    case "personal":
    default:
      // Business users should use the separate ChargebackShield app
      return "personal";
  }
}