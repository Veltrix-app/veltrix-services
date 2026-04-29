export const PROJECT_REWARD_SELECT_COLUMNS =
  "id, title, cost, rarity, image_url, campaign_id" as const;

export const PROJECT_REWARD_SUMMARY_SELECT_COLUMNS = "id, title, cost" as const;

const PROJECT_REWARD_VISIBLE_FILTER_COLUMN = "visible" as const;
const PROJECT_REWARD_VISIBLE_FILTER_VALUE = true as const;

export function getProjectRewardVisibilityFilter() {
  return {
    column: PROJECT_REWARD_VISIBLE_FILTER_COLUMN,
    value: PROJECT_REWARD_VISIBLE_FILTER_VALUE,
  } as const;
}
