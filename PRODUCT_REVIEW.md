# Product assessment and build boundary

## The useful product

The differentiated idea is an ambient companion that explains what it observes and offers a concrete calculation or reviewable plan. A cute avatar alone does not solve the generic-wrapper problem. Each pet needs a visible input, useful action, clear provenance and measurable outcome.

Start with crypto and paper trading. Equities require a separate licensed market-data/broker integration; a wallet is not a stock broker. MetaMask can authorize chain transactions, but an exchange/router must construct actual swaps. Stop orders and TWAP require persistent scheduling, liquidity routing, slippage bounds and execution guarantees that a browser tab cannot provide.

## Current version delivered

The landing page introduces the companions and leads into wallet sign-in or an explicit guest demo. The terminal now reads live crypto quotes and OHLCV from Coinbase, while equity data and sample mode remain labeled fixtures. Users can inspect context, choose a specialist, calculate position risk, review a server-priced paper order, and inspect its effect in the vault/journal. SQLite persists wallet-linked and guest workspaces, transactional fills, idempotency records and pet activity. Live data, sign-in and paper trading operate without provider credentials; Gemini vision/text and Sarvam voice remain optional adapters.

No numerical safety score is presented: a score such as 92/100 implies calibration the blueprint does not supply. Dollar exposure, stop references and estimated loss are more inspectable. Rules-based pattern output describes measured chart extremes, without claiming that those alone confirm a technical setup.

## Next implementation sequence

1. **Streaming market inputs:** build on the implemented validated REST feed and timestamps with websocket reconnect, richer gap handling and licensed equity data.
2. **Evaluate pet actions:** chart PNG input and structured Gemini output are implemented. Verify real-provider behavior with credentials, then evaluate explanations against known scenarios; keep calculations outside the LLM.
3. **Cloud accounts and memory:** build on implemented EIP-712 wallet accounts with MongoDB storage and managed backup/recovery. Browser-local balances are not trusted server state.
4. **Voice input:** Sarvam STT, explicit microphone permission, language selection and clear recording state. TTS is implemented; transcription and translation are not.
5. **Testnet execution:** choose chain and swap venue, verify router addresses, fetch and simulate quotes, show token approvals/minimum received/gas, enforce slippage, then request an explicit user signature. No arbitrary transaction should be sent to make a button look functional.
6. **Persistent strategies:** durable scheduler, idempotency, cancellation, funds/permission model, observable jobs and failure recovery. Only then promote drafts to limit/stop/TWAP orders.

## Demo acceptance

The useful hackathon demonstration is a complete paper loop with transparent data, distinct pet tools and reviewable outputs. Measure calculation accuracy, failed-order behavior, clarity of fixture labels and whether someone understands their exposure after using Hoot. Provider-backed behavior remains unverified until valid keys are supplied. This is a functional prototype, not a production execution system.
