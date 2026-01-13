// Consumer app modes (Scam Vigil)
export type UserMode = "personal" | "charity" | "community";

// Business app modes are defined separately in business-app/types.ts
// and include: "business_b2c" | "b2b"

export type UserModeDefinition = {
  key: UserMode;
  title: string;
  shortLabel: string;
  description: string;
  icon: string; // Ionicons name
  accentColor: string;
};