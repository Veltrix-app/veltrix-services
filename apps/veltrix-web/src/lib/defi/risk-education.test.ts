import test from "node:test";
import assert from "node:assert/strict";

import {
  borrowLendingRiskTopics,
  getBorrowLendingRiskTopic,
  getRiskEducationChecklist,
} from "./risk-education";

test("borrow lending risk education covers the required user safety topics", () => {
  assert.deepEqual(
    borrowLendingRiskTopics.map((topic) => topic.slug),
    ["no-custody", "collateral", "liquidation", "repay", "safe-order"]
  );

  for (const topic of borrowLendingRiskTopics) {
    assert.ok(topic.title);
    assert.ok(topic.summary);
    assert.ok(topic.detail);
    assert.ok(topic.userAction);
  }
});

test("liquidation education keeps credit remaining and safe moves explicit", () => {
  const topic = getBorrowLendingRiskTopic("liquidation");

  assert.ok(topic);
  assert.match(`${topic?.summary} ${topic?.detail}`, /credit remaining/i);
  assert.match(`${topic?.summary} ${topic?.detail}`, /\$0|0%/i);
  assert.match(topic?.userAction ?? "", /repay|collateral/i);
});

test("risk education does not frame borrowing as yield or XP farming", () => {
  const content = borrowLendingRiskTopics
    .map((topic) => `${topic.title} ${topic.summary} ${topic.detail} ${topic.userAction}`)
    .join(" ")
    .toLowerCase();

  assert.equal(content.includes("guaranteed yield"), false);
  assert.equal(content.includes("borrow more for xp"), false);
  assert.equal(content.includes("risk-free"), false);
});

test("risk education checklist keeps the recommended order conservative", () => {
  assert.deepEqual(
    getRiskEducationChecklist().map((item) => item.label),
    ["Supply first", "Enable collateral deliberately", "Borrow small", "Monitor and repay"]
  );
});
