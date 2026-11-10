# Product assessment and build boundary

## The useful product

The differentiated idea is an ambient companion that explains what it observes and offers a concrete calculation or reviewable plan. A cute avatar alone does not solve the generic-wrapper problem. Each pet needs a visible input, useful action, clear provenance and measurable outcome.

Start with crypto and paper trading. Equities require a separate licensed market-data/broker integration; a wallet is not a stock broker. MetaMask can authorize chain transactions, but an exchange/router must construct actual swaps. Stop orders and TWAP require persistent scheduling, liquidity routing, slippage bounds and execution guarantees that a browser tab cannot provide.

## Current version delivered

The landing page introduces the five companions and launches the terminal. The workspace demonstrates the interaction loop: select an asset, inspect illustrative history, choose a specialist, calculate position risk, review a paper order, and inspect its effect in the vault/journal. Paper execution is now server-owned and persisted in SQLite, with guest-session isolation, transactional fills, idempotency and saved pet activity. It operates without provider credentials. AI and voice remain optional server-side adapters.

No numerical safety score is presented: a score such as 92/100 implies calibration the blueprint does not supply. Dollar exposure, stop references and estimated loss are more inspectable. Pattern output describes chart extremes; it does not pretend that a synthetic price line is evidence of a real setup.

## Next implementation sequence

1. **Trustworthy market inputs:** one crypto data provider, timestamps/staleness, symbol normalization, OHLCV, retry/backoff and websocket reconnect. Test gaps and stale quotes before calling data live.
2. **Structured pet actions:** typed tool schemas, citations to candles, explicit assumptions, chart-image input for Boba, numerical calculations outside the LLM. Evaluate answers against known scenarios.
3. **Cloud accounts and memory:** build on the implemented SQLite guest-session memory with wallet-authenticated accounts and MongoDB models for PetState and TradeJournal. Never use wallet address alone as proof of identity. Browser-local balances are not trusted server state.
4. **Voice input:** Sarvam STT, explicit microphone permission, language selection and clear recording state. TTS is implemented; transcription and translation are not.
5. **Testnet execution:** choose chain and swap venue, verify router addresses, fetch and simulate quotes, show token approvals/minimum received/gas, enforce slippage, then request an explicit user signature. No arbitrary transaction should be sent to make a button look functional.
6. **Persistent strategies:** durable scheduler, idempotency, cancellation, funds/permission model, observable jobs and failure recovery. Only then promote drafts to limit/stop/TWAP orders.

## Demo acceptance

The useful hackathon demonstration is a complete paper loop with transparent data, distinct pet tools and reviewable outputs. Measure calculation accuracy, failed-order behavior, clarity of fixture labels and whether someone understands their exposure after using Hoot. Provider-backed behavior remains unverified until valid keys are supplied. This is a functional prototype, not a production execution system.
