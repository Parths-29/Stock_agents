# Verification — November 10, 2026

## Automated checks

- `npm test`: **21/21 passed**. Covers deterministic risk, buy/sell accounting, invalid balances, quote freshness, OHLCV validation, provider failure without silent sample fallback, request coalescing, structured model output, image payloads, wallet signatures, challenge replay, origin/session binding, logout, cross-browser account recovery, idempotency, atomic rollback, quotas and disk persistence.
- `npm run typecheck`: passed.
- `npm run build`: passed on Next.js 16.4.5 / Node.js 24.19.0. Includes landing, login/signup, authenticated terminal and the API routes.
- `npm run test:api`: passed against the local production server. Exercises HTTP-only cookies, unauthorized reads, server-priced paper fills, idempotency, isolation, drafts, malformed/oversized JSON, origin checks, EIP-712 verification with generated test accounts, token rotation, replay rejection, account recovery and logout.
- Live HTTP test: Coinbase returned ETH at **$2,087.74** with **96 OHLCV candles**, and a virtual $100 paper fill used that server quote. This is a verification snapshot, not a fixed price.

## Browser checks

- Unauthenticated `/terminal` redirected to `/login`; the explicit guest-demo link opened `/terminal?demo=1`.
- Login and signup pages rendered the split-screen companion design. Missing wallet extensions produce an actionable error rather than a false connected state.
- ETH/BTC/SOL displayed current Coinbase quotes and source labels. The ETH chart rendered actual OHLCV with UTC history timestamps.
- Boba captured the rendered SVG chart as a PNG and submitted it successfully. With no Gemini key configured, the response explicitly reported that vision inference had not occurred and returned calculated chart ranges.
- Quote polling retained analysis provenance rather than discarding a pending/provider response.
- Landing, companion selectors, paper order review/fill, journal and persistence were exercised during the prior phases. A production restart retained balances, holdings, notes and pet energy.
- Desktop and 390px mobile layouts were inspected; mobile data controls remain available without duplicating desktop controls.
- Real application screenshots are stored in `docs/screenshots/` and referenced from the README.

## Verification limits

No real-user wallet was used for sign-in; cryptographic and HTTP verification used generated test accounts. Gemini and Sarvam require API keys for actual provider-backed vision/speech checks; their contracts and fallback behavior are tested. WalletConnect, passkeys, social login, contract wallets, MongoDB, speech input, TEE attestation, World ID, gasless deposits, on-chain spend policies and real/testnet swaps remain unimplemented.

All fills are virtual. No real transaction was constructed or sent. Equities and explicit sample mode remain fixtures. The persistent database is SQLite on local disk, not MongoDB Atlas.
