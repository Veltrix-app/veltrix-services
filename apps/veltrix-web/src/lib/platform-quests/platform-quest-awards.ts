import type { PlatformQuestSlug } from "./platform-quest-catalog";
import type { ServiceSupabase } from "../lootboxes/shard-server";
import {
  buildPlatformQuestShardSource,
  type PlatformQuestEligibilityResult,
} from "./platform-quest-eligibility";

export function buildPlatformQuestShardAwardRequest(input: {
  authUserId: string;
  slug: PlatformQuestSlug;
  now?: string;
  eligibility: PlatformQuestEligibilityResult;
}) {
  if (!input.eligibility.ok) {
    return null;
  }

  const source = buildPlatformQuestShardSource(input.slug, input.eligibility.windowKey);

  return {
    authUserId: input.authUserId,
    amount: input.eligibility.shardAmount,
    sourceType: source.sourceType,
    sourceRef: source.sourceRef,
    action: source.action,
    reason: `Platform quest reward: ${input.slug}`,
    metadata: {
      source: "vyntro_platform_quest",
      slug: input.slug,
      windowKey: input.eligibility.windowKey,
    },
  };
}

export async function grantPlatformQuestShards(params: {
  serviceSupabase: ServiceSupabase;
  authUserId: string;
  slug: PlatformQuestSlug;
  eligibility: PlatformQuestEligibilityResult;
}) {
  const request = buildPlatformQuestShardAwardRequest({
    authUserId: params.authUserId,
    slug: params.slug,
    eligibility: params.eligibility,
  });

  if (!request) {
    return {
      ok: false as const,
      reason: params.eligibility.ok ? "invalid-award" : params.eligibility.reason,
      error: params.eligibility.ok
        ? "Shard award request could not be built."
        : params.eligibility.message,
    };
  }

  const { grantShards } = await import("../lootboxes/shard-server");
  const result = await grantShards({
    serviceSupabase: params.serviceSupabase,
    ...request,
  });

  return {
    ok: true as const,
    ...result,
  };
}
