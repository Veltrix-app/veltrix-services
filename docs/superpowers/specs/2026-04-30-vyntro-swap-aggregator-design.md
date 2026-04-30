# VYNTRO Swap Aggregator Design

Date: 2026-04-30
Status: Design ready for review
Owner: VYNTRO DeFi

## Goal

Add a VYNTRO Swap product to the webapp DeFi section. The user should see a premium, simple VYNTRO-native swap interface while the execution layer routes through external liquidity providers, starting with 0x as the primary aggregator and Uniswap as a secondary route/fallback.

The product must feel like part of the existing DeFi stack:

- Portfolio reads the user's current posture.
- Swap helps the user move into the right asset.
- Vaults and Borrow/Lending use those assets.
- Activity and XP record the swap posture without taking custody.

## Product Positioning

The page should be branded as `VYNTRO Swap`, not as a raw 0x or Uniswap widget. Provider attribution should be visible but secondary, for example: `Routes powered by 0x and Uniswap` in route details and legal/risk copy.

VYNTRO never takes custody, never guarantees execution, and never guarantees price improvement. The user signs approvals and swaps from their own wallet.

## Recommended Architecture

Use a hybrid quote engine:

1. 0x is the primary production route.
2. Uniswap Trading API is the secondary comparator/fallback.
3. The server normalizes quote results into one VYNTRO quote model.
4. The client displays the best safe quote by default and allows users to inspect route details before signing.

0x is the best first production route because its Swap API supports monetization through integrator swap fees. Uniswap adds strong brand trust, route diversity and fallback value.

Reference docs:

- 0x monetization: https://docs.0x.org/docs/0x-swap-api/guides/monetize-your-app-using-swap
- Uniswap swapping workflow: https://api-docs.uniswap.org/guides/swapping

## User Surface

Add `/defi/swap`.

Add `Swap` to the DeFi dropdown after `Portfolio` and before `Vaults`.

The page layout should follow the current VYNTRO DeFi visual language:

- Compact dark premium hero.
- One clear swap card as the primary workspace.
- One right-side safety/route rail.
- Small education strip for slippage, approval and route risk.
- No large technical provider branding in the hero.

Primary user flow:

1. User opens `DeFi -> Swap`.
2. User connects or verifies wallet if needed.
3. User selects sell token and buy token.
4. User enters sell amount.
5. VYNTRO requests quotes from 0x and Uniswap through server routes.
6. UI shows expected output, price impact, estimated gas, slippage, route provider and VYNTRO fee.
7. If an approval is required, user signs approval first.
8. User signs the swap transaction.
9. UI records activity and shows the next safe action, such as `Deposit into vault`, `Supply market`, or `Review portfolio`.

## API and Data Flow

Create web API routes:

- `GET /api/defi/swap/tokens`
- `POST /api/defi/swap/quote`
- `POST /api/defi/swap/execute-intent`
- `POST /api/defi/swap/activity`

The quote route should:

- Validate chain, wallet, sell token, buy token, amount and slippage.
- Call 0x with the server-held API key.
- Call Uniswap only when configured and supported for the requested chain/tokens.
- Normalize all quotes into one response shape.
- Pick a recommended quote using output amount, estimated gas, provider availability and error state.
- Never expose provider API keys to the browser.

The execute-intent route should:

- Persist a pre-sign swap intent with quote metadata.
- Return the transaction payload needed by the wallet.
- Mark the intent as submitted when the client sends the transaction hash.
- Mark the intent as confirmed when an on-chain or RPC check confirms the transaction.

## Database

Add a migration for:

- `defi_swap_intents`
- `defi_swap_quotes`
- `defi_swap_transactions`
- `defi_swap_fee_ledger`

Minimum fields:

- `id`
- `auth_user_id`
- `wallet_address`
- `chain_id`
- `sell_token_address`
- `buy_token_address`
- `sell_amount_raw`
- `expected_buy_amount_raw`
- `provider`
- `route_summary`
- `slippage_bps`
- `platform_fee_bps`
- `platform_fee_recipient`
- `status`
- `tx_hash`
- `error_message`
- `created_at`
- `updated_at`

Do not store private keys or signatures.

## Fee Model

Start with a small, transparent platform fee controlled by environment variables:

- `SWAP_PLATFORM_FEE_BPS`
- `SWAP_PLATFORM_FEE_RECIPIENT`
- `ZEROX_API_KEY`
- `UNISWAP_API_KEY`

Recommended initial fee:

- 0 bps in preview or internal testing.
- 10 to 30 bps for production after successful test swaps.

Fee disclosure must be visible in the quote panel before the user signs. If a provider or route cannot support the configured fee safely, the route should either show 0 fee or be excluded.

## Safety Rules

The swap flow must not execute if:

- Wallet is not connected or verified.
- Chain is unsupported.
- Token is unknown or blocked.
- Quote is expired.
- Price impact is above the configured danger threshold.
- Slippage is above the configured max.
- Provider quote returns incomplete transaction data.

The UI should show:

- `No custody`
- `You approve and sign from your wallet`
- `Output can change before confirmation`
- `VYNTRO fee`, if enabled
- `Provider route`, collapsed by default

## XP and Activity

Swaps should not become an easy farming loophole. XP should be conservative and tied to safe, meaningful behavior.

Recommended XP v1:

- First verified swap: small one-time XP.
- Swap used as a setup step before vault deposit or supply: eligible for route-completion XP.
- Repeated swaps alone: no repeat XP.
- Suspicious circular swaps: no XP and flagged for review.

Activity should feed `/defi/activity` and `/defi/portfolio`.

## Error Handling

User-facing errors should be short and actionable:

- `No route found`
- `Quote expired, refresh price`
- `Approval rejected`
- `Swap rejected`
- `Transaction submitted, waiting for confirmation`
- `Transaction failed on-chain`

Provider errors should be logged server-side with provider, chain, token pair, status code and sanitized message.

## Testing

Before production:

- Unit test quote normalization.
- Unit test fee bps and fee recipient handling.
- Unit test safety gate decisions.
- Mock 0x quote success, 0x failure, Uniswap fallback and no-route cases.
- Browser smoke test wallet-not-connected state.
- Browser smoke test quote preview with mocked response.
- Run repository verify script.

Production readiness requires a small real test swap on Base with fee set to 0 bps first.

## Rollout

Phase 1:

- UI page.
- Token list.
- 0x quotes.
- Approval and swap transaction payload.
- Activity record.
- No platform fee.

Phase 2:

- Enable platform fee.
- Add Uniswap fallback/comparison.
- Add XP route-completion logic.
- Add portfolio next-action integration.

Phase 3:

- Add advanced token search.
- Add route comparison view.
- Add project-sponsored swap missions.
- Add risk flags for high-slippage or circular swap behavior.

## Open Decision

The only decision still needed before implementation is fee posture for the first release:

- Recommended: launch with 0 bps for testing, then enable 10 to 30 bps after confirmed production swaps.
