export type CommunityCommandKey =
  | "link"
  | "profile"
  | "rank"
  | "missions"
  | "leaderboard"
  | "raid"
  | "captain";

export type CommunityCommandPlatform = "discord" | "telegram";

export type CommunityCommandSettingsSnapshot = {
  commandsEnabled: boolean;
  missionCommandsEnabled?: boolean;
  captainCommandsEnabled?: boolean;
  commandDeepLinksEnabled?: boolean;
  leaderboardEnabled?: boolean;
  raidOpsEnabled?: boolean;
  captainsEnabled?: boolean;
};

export function isCommunityCommandEnabled(params: {
  command: CommunityCommandKey;
  platform: CommunityCommandPlatform;
  settings: CommunityCommandSettingsSnapshot;
}) {
  if (!params.settings.commandsEnabled) {
    return false;
  }

  if (params.command === "missions") {
    return params.settings.missionCommandsEnabled !== false;
  }

  if (params.command === "leaderboard") {
    return params.settings.leaderboardEnabled !== false;
  }

  if (params.command === "raid") {
    return params.settings.raidOpsEnabled === true;
  }

  if (params.command === "captain") {
    return (
      params.settings.captainsEnabled !== false &&
      params.settings.captainCommandsEnabled !== false
    );
  }

  if (params.command === "rank" && params.platform === "telegram") {
    return false;
  }

  return true;
}

export function areCommunityCommandDeepLinksEnabled(
  settings: CommunityCommandSettingsSnapshot
) {
  return settings.commandDeepLinksEnabled !== false;
}

export function buildDisabledCommandMessage(command: CommunityCommandKey) {
  if (command === "missions") {
    return "Mission commands are disabled for this community right now. Enable them in the Veltrix portal first.";
  }

  if (command === "leaderboard") {
    return "Leaderboards are disabled for this community right now. Enable them in the Veltrix portal first.";
  }

  if (command === "raid") {
    return "Raid ops are disabled for this community right now. Enable them in the Veltrix portal first.";
  }

  if (command === "captain") {
    return "Captain commands are disabled for this community right now. Enable them in the Veltrix portal first.";
  }

  return "Community commands are disabled for this community right now. Enable them in the Veltrix portal first.";
}
