import test from "node:test";
import assert from "node:assert/strict";

import {
  MOONWELL_BASE_CHAIN_ID,
  MOONWELL_BASE_VAULTS,
  buildMoonwellVaultPositionRead,
  buildMoonwellVaultReadUrl,
  classifyMoonwellVaultPosition,
  formatVaultTokenAmount,
  getMoonwellVaultBySlug,
  isEvmAddress,
} from "./moonwell-vaults";

test("moonwell base vault config uses the official Base ERC-4626 vault addresses", () => {
  assert.equal(MOONWELL_BASE_CHAIN_ID, 8453);
  assert.deepEqual(
    MOONWELL_BASE_VAULTS.map((vault) => [vault.slug, vault.address]),
    [
      ["usdc-vault", "0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca"],
      ["eth-vault", "0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1"],
      ["eurc-vault", "0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026"],
      ["cbbtc-vault", "0x543257ef2161176d7c8cd90ba65c2d4caef5a796"],
    ]
  );
  assert.equal(getMoonwellVaultBySlug("usdc-vault")?.assetSymbol, "USDC");
});

test("vault read URLs are only built for valid EVM wallets", () => {
  const wallet = "0x1234567890abcdef1234567890abcdef12345678";

  assert.equal(isEvmAddress(wallet), true);
  assert.equal(isEvmAddress("not-a-wallet"), false);
  assert.equal(
    buildMoonwellVaultReadUrl(wallet),
    "/api/defi/moonwell-vaults?wallet=0x1234567890abcdef1234567890abcdef12345678"
  );
  assert.equal(buildMoonwellVaultReadUrl("not-a-wallet"), null);
});

test("vault positions classify wallet and share states for the UI", () => {
  assert.equal(classifyMoonwellVaultPosition({ wallet: null, sharesRaw: "0" }), "wallet-missing");
  assert.equal(
    classifyMoonwellVaultPosition({
      wallet: "0x1234567890abcdef1234567890abcdef12345678",
      sharesRaw: "0",
    }),
    "no-position"
  );
  assert.equal(
    classifyMoonwellVaultPosition({
      wallet: "0x1234567890abcdef1234567890abcdef12345678",
      sharesRaw: "42",
    }),
    "position-detected"
  );
  assert.equal(
    classifyMoonwellVaultPosition({
      wallet: "0x1234567890abcdef1234567890abcdef12345678",
      sharesRaw: null,
      readFailed: true,
    }),
    "read-error"
  );
});

test("vault token amounts format readable values without losing raw precision", () => {
  assert.equal(formatVaultTokenAmount("1000000", 6, "USDC"), "1 USDC");
  assert.equal(formatVaultTokenAmount("1234567", 6, "USDC"), "1.234567 USDC");
  assert.equal(formatVaultTokenAmount("1000000000000000000", 18, "ETH"), "1 ETH");
  assert.equal(formatVaultTokenAmount("0", 18, "ETH"), "0 ETH");
});

test("raw contract reads become a UI-ready vault position", () => {
  const vault = getMoonwellVaultBySlug("usdc-vault");

  assert.ok(vault);

  const read = buildMoonwellVaultPositionRead({
    vault,
    wallet: "0x1234567890abcdef1234567890abcdef12345678",
    shareBalanceRaw: "2500000",
    shareDecimals: 6,
    assetAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    assetSymbol: "USDC",
    assetDecimals: 6,
    underlyingRaw: "2510000",
    maxWithdrawRaw: "2510000",
    totalAssetsRaw: "100000000000",
  });

  assert.equal(read.status, "position-detected");
  assert.equal(read.shareBalanceLabel, "2.5 mwUSDC");
  assert.equal(read.underlyingLabel, "2.51 USDC");
  assert.equal(read.maxWithdrawLabel, "2.51 USDC");
  assert.equal(read.totalAssetsLabel, "100000 USDC");
});
