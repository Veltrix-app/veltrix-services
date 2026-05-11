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
  assert.match(source, /AnimatedShardWallet/);
  assert.match(source, /buildAnimatedShardWalletRead/);
  assert.doesNotMatch(source, /className="motion-press fixed right-0 top-1\/2/);
});

test("app shell exposes a cinematic route transition stage", () => {
  const shellSource = readFileSync(
    join(process.cwd(), "apps/veltrix-web/src/components/layout/app-shell.tsx"),
    "utf8"
  );
  const motionSource = readFileSync(
    join(process.cwd(), "apps/veltrix-web/src/components/layout/vyntro-motion-layer.tsx"),
    "utf8"
  );
  const cssSource = readFileSync(join(process.cwd(), "apps/veltrix-web/src/app/globals.css"), "utf8");

  assert.match(shellSource, /data-vyntro-route-stage/);
  assert.match(motionSource, /getRouteMotionProfile/);
  assert.match(motionSource, /vyntro-route-family/);
  assert.match(cssSource, /vyntro-route-stage/);
  assert.match(cssSource, /vyntro-route-veil/);
  assert.match(cssSource, /prefers-reduced-motion:\s*reduce/);
});

test("app shell exposes the global command palette trigger", () => {
  const shellSource = readFileSync(
    join(process.cwd(), "apps/veltrix-web/src/components/layout/app-shell.tsx"),
    "utf8"
  );
  const paletteSource = readFileSync(
    join(process.cwd(), "apps/veltrix-web/src/components/layout/vyntro-command-palette.tsx"),
    "utf8"
  );

  assert.match(shellSource, /VyntroCommandPalette/);
  assert.match(shellSource, /Open command palette/);
  assert.match(paletteSource, /metaKey \|\| event\.ctrlKey/);
  assert.match(paletteSource, /buildCommandPaletteActions/);
});
