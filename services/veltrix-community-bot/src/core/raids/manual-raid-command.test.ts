import test from "node:test";
import assert from "node:assert/strict";

import {
  formatManualRaidCommandError,
  parseTelegramNewRaidCommand,
  normalizeManualRaidOverrides,
  formatManualRaidCommandResult,
} from "./manual-raid-command.js";

test("parses telegram newraid URL and key value overrides", () => {
  assert.deepEqual(
    parseTelegramNewRaidCommand("/newraid https://x.com/vyntro_/status/123 xp=80 duration=2h campaign=starter"),
    {
      ok: true,
      url: "https://x.com/vyntro_/status/123",
      overrides: {
        xp: "80",
        duration: "2h",
        campaign: "starter",
      },
    }
  );
});

test("normalizes safe overrides and clamps XP and duration", () => {
  assert.deepEqual(
    normalizeManualRaidOverrides({
      xp: "999",
      duration: "30d",
      campaign: "starter",
      button: "Join the raid",
    }),
    {
      rewardXp: 100,
      durationMinutes: 10080,
      campaignRef: "starter",
      buttonLabel: "Join the raid",
    }
  );
});

test("formats delivery status for command replies", () => {
  assert.equal(
    formatManualRaidCommandResult({
      raidUrl: "https://veltrix-web.vercel.app/raids/raid-1",
      deliveries: [
        { provider: "telegram", ok: true },
        { provider: "discord", ok: false, error: "Missing channel" },
      ],
    }),
    "Live raid created: https://veltrix-web.vercel.app/raids/raid-1\nDelivery: telegram ok, discord failed (Missing channel)"
  );
});

test("formats manual raid authorization failures as actionable Telegram replies", () => {
  assert.match(
    formatManualRaidCommandError(
      new Error("Only project captains with raid alert permission can create live raids.")
    ),
    /Telegram group admin or a VYNTRO captain/
  );
});

test("formats non-Error manual raid failures with useful database details", () => {
  assert.equal(
    formatManualRaidCommandError({
      message: "Live raid capacity reached.",
      hint: "Upgrade the workspace plan.",
    }),
    "I couldn't create that raid yet: Live raid capacity reached. Upgrade the workspace plan."
  );
});
