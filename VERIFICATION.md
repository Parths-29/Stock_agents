# Verification — November 10, 2026

- `npm test`: 13/13 passed (numerical logic, session ownership, atomic fills, idempotency, rollback, drafts, validation, provider quotas, disk persistence and origin checks).
- `npm run typecheck`: passed.
- `npm run build`: passed on Next.js 16.4.5, including the landing, terminal and seven API endpoints.
- `npm run test:api`: passed against the production server. Covers cookies, unauthorized access, server-selected prices, repeated requests, conflict handling, session isolation, notes, drafts, cross-origin rejection, malformed JSON, oversized requests, overspending and rules analysis.
- `/api/agent`: Hoot rules response returned correct ETH stop/take levels and $50 planned risk for a $1,000 position.
- Browser: selected Hoot on the landing page and followed the pet-specific link into `/terminal?pet=hoot`.
- Browser: confirmed a $1,000 ETH server paper buy; observed cash $25,000 → $24,000, updated quantity/cost basis, and a server-fill journal record.
- Browser: submitted a Hoot analysis and observed saved energy drop from 100% to 95%.
- Browser: stopped and restarted the production process, then reloaded. Cash remained $24,000, ETH quantity/cost basis and journal remained intact, and Hoot energy remained 95%.
- Browser: inspected the landing hero and interactive companion profiles on desktop and at 390px width. Corrected headline clipping and increased mobile text clearance from the mascot.
- Final production build and API integration suite passed after the corrections. Saved the final landing screenshot as `landing-preview.jpg`; production remains running at http://127.0.0.1:3012.

Not exercised: actual wallet connection (requires extension/user interaction), Gemini requests, Sarvam playback (both require keys), and production hosting. Market inputs are fixtures. No real transaction was constructed or sent.

SQLite is a local persistent-disk backend, not MongoDB Atlas. Guest cookies provide workspace isolation, not cross-device authenticated accounts. Live data, vision, speech input and real/testnet trading remain unimplemented as tracked in `PHASES.md`.

The initial registry-advertised Next.js 16.4.6 referenced unavailable `@next/env@16.4.6`; the installed and verified version is pinned to 16.4.5. The lockfile is included.
