# StockPaws // Trading, with company.

A local Next.js + TypeScript application with a dedicated landing page, pet-assisted terminal and persistent paper-trading backend. Navy, cream, coral; sharp borders; five custom vector mascots. Requires Node.js 24 or newer.

## Run

```powershell
cd C:\Users\Admin\Desktop\eth-hack\stockpaws
npm install
npm run dev
```

Open http://127.0.0.1:3000. No API keys needed for the rules engine and paper trading.

Production mode:

```powershell
npm run build
npm run start -- --port 3012
```

Landing: http://127.0.0.1:3012/ · Terminal: http://127.0.0.1:3012/terminal · Health: http://127.0.0.1:3012/api/health

Optional: copy `.env.example` to `.env.local`, add Gemini and/or Sarvam keys, and restart. Keys stay on the server. Gemini provides text explanations of deterministic sample-market calculations. Sarvam supplies English/Hindi voice synthesis; it does not translate English analysis automatically. Configurable Gemini model must be available in your account.

## Implemented

- Landing with interactive companion profiles, workflow, phase tracker and terminal launch links.
- Six asset selectors and five illustrative chart timeframes; hover for sample prices.
- Five animated, draggable pets and specialized calculated insights.
- Optional Gemini Q&A and Sarvam speech playback, with explicit error/fallback states.
- MetaMask-compatible injected wallet connection and account-change handling. No signature or transaction requests.
- Server-side paper market buys/sells with balance checks, review screen, weighted cost basis, holdings/P&L updates and duplicate-request protection.
- Limit, stop-loss and TWAP **drafts**, saved to the journal. They are not scheduled or filled.
- SQLite persistence for portfolios, orders, journal notes and pet activity; HTTP-only guest-session cookies; session-scoped reads and request limits.
- Responsive layouts and reduced-motion support.

All prices, changes and history are fixtures. History is synthesized for the interface. Paper fills omit fees/slippage. Dollar risk and price references are calculations, not a rating or guarantee of safety.

## Verify

```powershell
npm test
npm run typecheck
npm run build
# With the production server running at port 3012:
npm run test:api
```

## Next milestones

See [PHASES.md](PHASES.md) for phase status, backend endpoints and storage details, [PRODUCT_REVIEW.md](PRODUCT_REVIEW.md) for the product assessment, and [VERIFICATION.md](VERIFICATION.md) for test evidence.

The database defaults to `data/stockpaws.sqlite` and survives server restarts. Keep it on persistent disk; do not delete it when rebuilding. Session cookies identify guest workspaces, not cross-device accounts. The previous localStorage prototype data is not imported as trusted state.

MongoDB cloud sync, live market data, voice input, chart vision, wallet sign-in and real execution remain future work. Gemini/Sarvam integrations require valid keys for provider-backed verification. Per-session quotas and 16 KiB request limits are implemented; stronger account/IP abuse controls belong to public-hosting work.
