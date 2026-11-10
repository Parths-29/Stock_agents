# StockPaws delivery phases

| Phase                       | State       | Delivered / remaining                                                                                                                                                                                                                                                                                    |
| --------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01 — Experience             | Implemented | Landing, terminal, responsive layouts, interactive companion profiles, draggable pets, login/signup pages                                                                                                                                                                                                |
| 02 — Persistent backend     | Implemented | SQLite guest sessions, transactional paper fills, idempotency, journal, pet memory, request limits and health endpoint                                                                                                                                                                                   |
| 03 — Connected intelligence | In progress | **Delivered:** EIP-712 wallet accounts, cross-browser workspace recovery, live crypto quotes/OHLCV, explicit source/staleness labels, chart PNG capture, structured Gemini adapter, existing Sarvam TTS adapter. **Remaining:** API-key-backed AI/voice verification, voice input, MongoDB cloud adapter |
| 04 — Testnet execution      | Planned     | Verified router/chain choice, quotes, simulation, approvals, signed testnet swaps, contract spend policy and genuine explorer receipts                                                                                                                                                                   |
| 05 — Durable strategies     | Planned     | Persistent scheduler, cancellation, permissions, failure recovery and monitored stop/limit/TWAP execution                                                                                                                                                                                                |

## Backend endpoints

| Method     | Route                              | Behavior                                                                                                             |
| ---------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| GET        | `/api/health`                      | Database readiness and configuration flags, never credentials                                                        |
| GET        | `/api/session`                     | Resume/create guest session; returns identity, portfolio, journal, pet memory                                        |
| POST       | `/api/auth/challenge`              | Five-minute session/origin/wallet-bound EIP-712 challenge                                                            |
| POST       | `/api/auth/verify`                 | Verify ownership, consume challenge, rotate cookie and link/recover wallet workspace                                 |
| POST       | `/api/auth/logout`                 | Revoke current token and remove cookie                                                                               |
| GET        | `/api/market`                      | Live crypto quotes or explicitly requested samples                                                                   |
| GET        | `/api/market?symbol=ETH&frame=24H` | Selected quote and OHLCV; supports 1H, 24H, 7D, 30D and 90D                                                          |
| GET        | `/api/portfolio`                   | Current session's portfolio, journal and pet state                                                                   |
| POST       | `/api/trade`                       | Transactional paper fill or saved strategy draft; live fills require fresh server quotes and a 0.5% review tolerance |
| GET / POST | `/api/memory`                      | Session-scoped journal and pet memory                                                                                |
| POST       | `/api/agent`                       | Context-grounded rules or optional structured Gemini output, with optional PNG chart                                 |
| POST       | `/api/voice`                       | Optional Sarvam synthesis                                                                                            |

Mutations require a matching Origin, session cookie and JSON within the request limit. Most routes allow 16 KiB; image-capable analysis allows 750,000 bytes, with a 512 KiB decoded PNG limit. Provider and mutation quotas persist per session/minute. Guest replacement remains a public-hosting abuse-control concern.

## Persistence and identity

Default storage is `data/stockpaws.sqlite`, ignored by Git and retained across builds/restarts. Set `STOCKPAWS_DB_PATH` for another persistent location. The adapter targets one Node server, not ephemeral serverless instances or distributed replicas.

Guest tokens expire after 30 days; wallet-authenticated tokens after seven days. Cookies are HTTP-only, SameSite=Strict and Secure on HTTPS. Server records store token hashes. The signed message grants no transfer/approval permission. Only externally owned Ethereum/Sepolia accounts are supported at present; passkeys, social login, WalletConnect and contract wallets remain future work.

First wallet sign-in claims that guest workspace. Subsequent sign-ins resume the existing wallet account rather than merging another guest portfolio into it. Browser-local prototype balances are not trusted or imported as server balances.

## Evidence boundaries

- Crypto data comes from real Coinbase HTTP responses; the feed is polled, not a WebSocket stream.
- Equity prices/history and explicit sample mode are fixtures.
- Every execution is a paper fill. Strategy drafts neither reserve funds nor execute.
- Gemini vision and Sarvam synthesis need credentials for real-provider validation. Tests verify request/response contracts using controlled provider responses.
- Request IDs are correlation metadata. There is no verified TEE, on-chain spend shield, gasless settlement or human-proof integration yet.

See `VERIFICATION.md` for checks and `README.md` for screenshots and setup.
