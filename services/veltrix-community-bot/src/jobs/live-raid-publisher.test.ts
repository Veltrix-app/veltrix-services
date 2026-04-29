import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLiveRaidDeliveryMessage,
  buildLiveRaidInsertPayload,
  resolveLiveRaidBanner,
} from "./live-raid-publisher.js";

test("builds a live raid insert payload from a generated draft", () => {
  assert.deepEqual(
    buildLiveRaidInsertPayload({
      projectId: "project-1",
      projectName: "Chainwars",
      campaignId: "campaign-1",
      draft: {
        title: "Raid this launch",
        shortDescription: "Raid this launch #vyntro",
        target: "Open the source post, engage with it, then confirm the raid in VYNTRO.",
        instructions: ["Open the source post."],
        sourceUrl: "https://x.com/vyntro_/status/123",
        sourceExternalId: "123",
        banner: "https://cdn.example/raid.png",
        rewardXp: 50,
        startsAt: "2026-04-28T10:00:00.000Z",
        endsAt: "2026-04-29T10:00:00.000Z",
        campaignId: "campaign-1",
        buttonLabel: "Open raid",
      },
      sourceEventId: "event-1",
      sourceProvider: "x_manual_command",
      generatedBy: "manual_raid_command",
    }),
    {
      project_id: "project-1",
      campaign_id: "campaign-1",
      title: "Raid this launch",
      short_description: "Raid this launch #vyntro",
      community: "Chainwars",
      timer: "Live",
      reward: 50,
      reward_xp: 50,
      participants: 0,
      progress: 0,
      target: "Open the source post, engage with it, then confirm the raid in VYNTRO.",
      banner: "https://cdn.example/raid.png",
      instructions: ["Open the source post."],
      status: "active",
      source_provider: "x_manual_command",
      source_url: "https://x.com/vyntro_/status/123",
      source_external_id: "123",
      source_event_id: "event-1",
      ends_at: "2026-04-29T10:00:00.000Z",
      generated_by: "manual_raid_command",
    }
  );
});

test("builds a delivery message for a live raid", () => {
  assert.equal(
    buildLiveRaidDeliveryMessage({
      title: "Raid this launch",
      shortDescription: "Raid this launch #vyntro",
      rewardXp: 50,
      sourceLabel: "X command",
    }).body,
    "Raid this launch #vyntro\n\nOpen the raid, engage with the source post, then confirm it in VYNTRO."
  );
});

test("uses the default raid artwork when generated raids have no media", () => {
  assert.equal(
    resolveLiveRaidBanner(null),
    "https://veltrix-web.vercel.app/community-push/defaults/raid.png"
  );

  const payload = buildLiveRaidInsertPayload({
    projectId: "project-1",
    projectName: "VYNTRO",
    campaignId: "campaign-1",
    draft: {
      title: "Raid VYNTRO X post.",
      shortDescription: "Raid VYNTRO X post.",
      target: "Open the source post, engage with it, then confirm the raid in VYNTRO.",
      instructions: ["Open the source post."],
      sourceUrl: "https://x.com/i/status/123",
      sourceExternalId: "123",
      banner: null,
      rewardXp: 50,
      startsAt: "2026-04-29T10:00:00.000Z",
      endsAt: "2026-04-30T10:00:00.000Z",
      campaignId: "campaign-1",
      buttonLabel: "Open raid",
    },
    sourceEventId: "event-1",
    sourceProvider: "x_manual_command",
    generatedBy: "manual_raid_command",
  });

  assert.equal(payload.banner, "https://veltrix-web.vercel.app/community-push/defaults/raid.png");
});
