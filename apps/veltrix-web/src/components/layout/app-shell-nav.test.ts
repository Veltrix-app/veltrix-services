import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

test("primary member navigation exposes the lootbox shop", () => {
  const source = readFileSync(join(process.cwd(), "apps/veltrix-web/src/components/layout/app-shell.tsx"), "utf8");

  assert.match(source, /href:\s*"\/lootboxes"/);
  assert.match(source, /label:\s*"Lootboxes"/);
});

test("vyntro wallet starts expanded and keeps a visible recall tab", () => {
  const source = readFileSync(
    join(process.cwd(), "apps/veltrix-web/src/components/layout/vyntro-wallet-widget.tsx"),
    "utf8"
  );

  assert.match(source, /useState\(false\)/);
  assert.match(source, /VYNTRO Wallet/);
  assert.match(source, />\s*Wallet\s*</);
  assert.match(source, /aria-label="Open VYNTRO wallet"/);
  assert.match(source, /className="fixed right-0 top-1\/2/);
  assert.doesNotMatch(source, /className="motion-press fixed right-0 top-1\/2/);
});
