import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMoonwellMarketTransactionIntent,
  buildMoonwellMarketTransactionLog,
  getMoonwellMarketBySlug,
  parseMarketActionAmount,
} from "./moonwell-market-transactions";

const usdcMarket = getMoonwellMarketBySlug("usdc-market");

if (!usdcMarket) {
  throw new Error("USDC market test fixture is missing.");
}

test("market action amounts parse to raw token units", () => {
  assert.deepEqual(parseMarketActionAmount("12.34", 6), {
    ok: true,
    raw: "12340000",
  });
  assert.deepEqual(parseMarketActionAmount("0", 6), {
    ok: false,
    error: "Amount must be greater than zero.",
  });
  assert.deepEqual(parseMarketActionAmount("1.1234567", 6), {
    ok: false,
    error: "This token supports 6 decimal places.",
  });
});

test("supply intent checks wallet balance and asks for approval when allowance is low", () => {
  const intent = buildMoonwellMarketTransactionIntent({
    kind: "supply",
    market: usdcMarket,
    amountRaw: "25000000",
    assetSymbol: "USDC",
    assetDecimals: 6,
    allowanceRaw: "1000000",
    walletAssetBalanceRaw: "50000000",
    suppliedUnderlyingRaw: "0",
    borrowedUnderlyingRaw: "0",
    collateralEnabled: false,
    marketLiquidityRaw: "1000000000000",
    riskAccepted: false,
    shortfallRaw: "0",
  });

  assert.equal(intent.ok, true);
  assert.equal(intent.needsApproval, true);
  assert.equal(intent.actionLabel, "Supply 25 USDC");
});

test("withdraw intent blocks amounts above supplied balance", () => {
  const intent = buildMoonwellMarketTransactionIntent({
    kind: "withdraw",
    market: usdcMarket,
    amountRaw: "25000000",
    assetSymbol: "USDC",
    assetDecimals: 6,
    allowanceRaw: "0",
    walletAssetBalanceRaw: "0",
    suppliedUnderlyingRaw: "10000000",
    borrowedUnderlyingRaw: "0",
    collateralEnabled: true,
    marketLiquidityRaw: "1000000000000",
    riskAccepted: false,
    shortfallRaw: "0",
  });

  assert.equal(intent.ok, false);
  assert.equal(intent.error, "Amount is higher than your supplied balance.");
});

test("borrow intent requires enabled collateral and an explicit risk gate", () => {
  const noCollateral = buildMoonwellMarketTransactionIntent({
    kind: "borrow",
    market: usdcMarket,
    amountRaw: "1000000",
    assetSymbol: "USDC",
    assetDecimals: 6,
    allowanceRaw: "0",
    walletAssetBalanceRaw: "0",
    suppliedUnderlyingRaw: "0",
    borrowedUnderlyingRaw: "0",
    collateralEnabled: false,
    marketLiquidityRaw: "1000000000000",
    riskAccepted: true,
    shortfallRaw: "0",
  });

  assert.equal(noCollateral.ok, false);
  assert.equal(noCollateral.error, "Enable supplied collateral before borrowing.");

  const noRiskGate = buildMoonwellMarketTransactionIntent({
    kind: "borrow",
    market: usdcMarket,
    amountRaw: "1000000",
    assetSymbol: "USDC",
    assetDecimals: 6,
    allowanceRaw: "0",
    walletAssetBalanceRaw: "0",
    suppliedUnderlyingRaw: "25000000",
    borrowedUnderlyingRaw: "0",
    collateralEnabled: true,
    marketLiquidityRaw: "1000000000000",
    riskAccepted: false,
    shortfallRaw: "0",
  });

  assert.equal(noRiskGate.ok, false);
  assert.equal(noRiskGate.error, "Confirm the borrow risk gate before signing.");
});

test("repay intent checks borrowed balance and approval", () => {
  const intent = buildMoonwellMarketTransactionIntent({
    kind: "repay",
    market: usdcMarket,
    amountRaw: "5000000",
    assetSymbol: "USDC",
    assetDecimals: 6,
    allowanceRaw: "0",
    walletAssetBalanceRaw: "9000000",
    suppliedUnderlyingRaw: "0",
    borrowedUnderlyingRaw: "10000000",
    collateralEnabled: true,
    marketLiquidityRaw: "1000000000000",
    riskAccepted: false,
    shortfallRaw: "0",
  });

  assert.equal(intent.ok, true);
  assert.equal(intent.needsApproval, true);
  assert.equal(intent.actionLabel, "Repay 5 USDC");
});

test("market transaction logs validate wallet, action and hash", () => {
  const log = buildMoonwellMarketTransactionLog({
    wallet: "0x1234567890abcdef1234567890abcdef12345678",
    market: usdcMarket,
    kind: "enable-collateral",
    status: "confirmed",
    amountRaw: "0",
    assetSymbol: "USDC",
    txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });

  assert.equal(log.ok, true);
  if (log.ok) {
    assert.equal(log.record.kind, "enable-collateral");
    assert.equal(log.record.amountRaw, "0");
    assert.equal(log.record.mTokenAddress, usdcMarket.mTokenAddress);
  }

  assert.deepEqual(
    buildMoonwellMarketTransactionLog({
      wallet: "not-a-wallet",
      market: usdcMarket,
      kind: "borrow",
      status: "submitted",
      amountRaw: "1",
      assetSymbol: "USDC",
      txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    }),
    { ok: false, error: "Valid wallet is required." }
  );
});
