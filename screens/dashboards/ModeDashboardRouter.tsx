import React from "react";
import CharityDashboard from "./CharityDashboard";
import CommunityDashboard from "./CommunityDashboard";
import PersonalDashboard from "./PersonalDashboard";
import type { UserMode } from "../../types/userMode";
import { inferUserModeFromAccountType } from "../../lib/userModes";

type Props = {
  viewer?: any;
  mode?: UserMode;
  onGoToTab?: (tab: any) => void;
  onNavigateToFeature?: (feature: any) => void;
};

export default function ModeDashboardRouter({ viewer, mode, onGoToTab, onNavigateToFeature }: Props) {
  // Single source of truth for Scam Vigil (consumer app):
  // prefer explicit prop → then viewer.userMode → then infer from accountType.
  // Any legacy/business modes are coerced back to a consumer mode.
  const effectiveMode: UserMode = (() => {
    if (mode) return mode;

    const maybeUserMode = viewer?.userMode;
    if (maybeUserMode === "personal" || maybeUserMode === "charity" || maybeUserMode === "community") {
      return maybeUserMode;
    }

    return inferUserModeFromAccountType(viewer?.accountType);
  })();

  switch (effectiveMode) {
    case "charity":
      return <CharityDashboard viewer={viewer} onGoToTab={onGoToTab} onNavigateToFeature={onNavigateToFeature} />;
    case "community":
      return <CommunityDashboard viewer={viewer} onGoToTab={onGoToTab} onNavigateToFeature={onNavigateToFeature} />;
    case "personal":
    default:
      return <PersonalDashboard viewer={viewer} onGoToTab={onGoToTab} onNavigateToFeature={onNavigateToFeature} />;
  }
}