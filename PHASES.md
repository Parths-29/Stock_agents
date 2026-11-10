# StockPaws delivery phases

This file tracks shipped behavior, not just component scaffolds.

| Phase | State | Deliverable | Acceptance |
| --- | --- | --- | --- |
| 01 — Experience | Implemented | Dedicated aesthetic landing at `/`, terminal at `/terminal`, interactive pet profiles and pet-specific launch links, responsive design | Visitor can understand the product, choose a pet and enter the workspace |
| 02 — Persistent paper backend | Implemented | HTTP-only guest session, SQLite store, portfolio reads, atomic server-side fills, request idempotency, strategy drafts, journal, pet activity, provider quotas and health endpoint | Fills cannot overspend; duplicate requests cannot double-fill; sessions cannot access each other; data survives server restart |
| 03 — Connected intelligence | Next | Live crypto feed with timestamps/staleness, real OHLCV, structured Gemini tools/chart images, Sarvam voice input, MongoDB cloud adapter with authenticated users | Inputs have provenance; disconnects are visible; provider-backed behavior is verified with credentials |
| 04 — Testnet execution | Planned | Wallet sign-in, selected chain/router, quote validation, transaction simulation, approval review, explicit signature flow | Real testnet swap completes and its receipt matches the reviewed quote |
| 05 — Durable strategies | Planned | Persistent scheduler, idempotent jobs, cancellation, funds/permissions model, stop/limit/TWAP monitoring | Restart, partial fill, cancellation and provider failures are tested before strategies execute |

## Phase 02 backend contract

The Node server uses SQLite for a self-contained local installation. No cloud service or key is required. This is guest-session persistence, not wallet authentication or a cross-device account. The MongoDB Atlas requirement remains part of phase 03's cloud/account work.

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/api/health` | Database readiness and integration configuration flags; never keys |
| GET | `/api/session` | Creates or resumes a 30-day guest workspace; returns portfolio, journal and pet activity |
| GET | `/api/portfolio` | Reads the current session's portfolio, journal and pet state |
| POST | `/api/trade` | Validates a paper order; server selects price; transaction saves balance, order and journal; same request ID replays safely |
| GET / POST | `/api/memory` | Reads memory; writes a journal note or selected pet for the current session |
| POST | `/api/agent` | Session-scoped calculated insights or optional Gemini text; records pet activity/energy |
| POST | `/api/voice` | Session-scoped Sarvam synthesis when configured |

Mutations require a matching Origin header, a guest-session cookie and JSON no larger than 16 KiB. AI/voice/trade/memory quotas are persisted per session and minute. Paid-provider endpoints still require stronger account/IP abuse controls before public hosting; guest sessions can be replaced.

## Database and ownership

- Default database: `data/stockpaws.sqlite`; ignored by Git. Override with `STOCKPAWS_DB_PATH`.
- Session tokens are cryptographically random and stored as hashes on the server; the cookie is HTTP-only, SameSite=Strict, and Secure on HTTPS.
- All private queries derive ownership from the session, never a wallet address or caller-supplied user ID.
- Paper market fills use server fixture prices. Non-market strategies are saved drafts and do not reserve funds.
- Browser-local prototype data is retained in localStorage but is no longer loaded as trusted portfolio state. The backend initializes its own paper portfolio.
- Keep the database on persistent disk. This adapter is for one Node server, not ephemeral serverless instances or distributed replicas.

## Checks

`npm test` exercises numerical logic, session isolation, idempotent fills, rollback, drafts, note validation, quotas and on-disk persistence. `npm run test:api` tests the running server's HTTP contract. See `VERIFICATION.md` for the current run results.
