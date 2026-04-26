import test from "node:test";
import assert from "node:assert/strict";

import { getMainPageSignalBanner, mainPageSignalBannerRoutes } from "./page-signal-banners";

test("main page signal banners exist for the primary product pages", () => {
  assert.deepEqual(mainPageSignalBannerRoutes, [
    "/home",
    "/community",
    "/projects",
    "/campaigns",
    "/quests",
    "/defi",
    "/raids",
    "/rewards",
  ]);

  for (const route of mainPageSignalBannerRoutes) {
    const banner = getMainPageSignalBanner(route);
    assert.ok(banner, `${route} should have a banner`);
    assert.equal(banner?.route, route);
    assert.ok(banner?.title);
    assert.ok(banner?.href);
    assert.ok((banner?.slides.length ?? 0) >= 1);
  }
});

test("main page signal banners use the vyntro campaign slideshow assets", () => {
  assert.deepEqual(
    getMainPageSignalBanner("/home")?.slides.map((slide) => slide.key),
    ["quests", "raids", "rewards", "community", "vaults", "borrow-lending", "anti-sybil"]
  );
  assert.deepEqual(
    getMainPageSignalBanner("/defi")?.slides.map((slide) => slide.key),
    ["vaults", "borrow-lending"]
  );
  assert.equal(getMainPageSignalBanner("/rewards")?.slides[0]?.src, "/brand/slides/vyntro-rewards.png");
});

test("main page signal banners stay scoped to top level routes", () => {
  assert.equal(getMainPageSignalBanner("/home/"), getMainPageSignalBanner("/home"));
  assert.equal(getMainPageSignalBanner("/quests/123"), null);
  assert.equal(getMainPageSignalBanner("/defi/vaults"), null);
  assert.equal(getMainPageSignalBanner("/profile"), null);
});
