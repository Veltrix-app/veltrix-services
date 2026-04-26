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
  }
});

test("main page signal banners stay scoped to top level routes", () => {
  assert.equal(getMainPageSignalBanner("/home/"), getMainPageSignalBanner("/home"));
  assert.equal(getMainPageSignalBanner("/quests/123"), null);
  assert.equal(getMainPageSignalBanner("/defi/vaults"), null);
  assert.equal(getMainPageSignalBanner("/profile"), null);
});
