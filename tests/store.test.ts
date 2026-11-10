import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store, ServiceError, type TradeInput } from "../lib/server/store";
const order = (overrides: Partial<TradeInput> = {}): TradeInput => ({
  symbol: "ETH",
  side: "BUY",
  type: "MARKET",
  amount: 1000,
  requestId: "test-request-00000001",
  ...overrides,
});
test("live paper fills use a server quote and enforce review tolerance and freshness", () => {
  const store = new Store(":memory:");
  try {
    const { owner } = store.createSession(),
      input = order({ marketMode: "live", expectedPrice: 2000 });
    assert.throws(() => store.trade(owner, input), /fresh server quote/);
    assert.throws(
      () =>
        store.trade(owner, input, {
          price: 2100,
          source: "Coinbase Exchange",
          asOf: new Date().toISOString(),
        }),
      /Price moved/,
    );
    assert.throws(
      () =>
        store.trade(owner, input, {
          price: 2000,
          source: "Coinbase Exchange",
          asOf: new Date(Date.now() - 180000).toISOString(),
        }),
      /fresh server quote/,
    );
    const result = store.trade(owner, input, {
      price: 2000,
      source: "Coinbase Exchange",
      asOf: new Date().toISOString(),
    });
    assert.equal(result.order.quantity, 0.5);
    assert.equal(result.order.price, 2000);
    assert.equal(result.portfolio.cash, 24000);
    assert.equal(store.replay(owner, input)?.replayed, true);
  } finally {
    store.db.close();
  }
});
test("sessions use unguessable tokens and isolate portfolio, notes and pet state", () => {
  const store = new Store(":memory:");
  try {
    const a = store.createSession(),
      b = store.createSession();
    assert.equal(a.token.length, 64);
    assert.notEqual(a.owner, a.token);
    assert.equal(store.authenticate(a.token), a.owner);
    assert.throws(() => store.authenticate("invalid"), ServiceError);
    store.note(a.owner, "Private note");
    store.pet(a.owner, "hoot");
    store.trade(a.owner, order());
    assert.equal(store.snapshot(a.owner).portfolio.cash, 24000);
    assert.equal(store.snapshot(b.owner).portfolio.cash, 25000);
    assert.equal(store.snapshot(b.owner).journal.length, 0);
    assert.equal(store.snapshot(b.owner).petStates.length, 0);
  } finally {
    store.db.close();
  }
});
test("idempotent requests fill exactly once and reject changed payloads", () => {
  const store = new Store(":memory:");
  try {
    const { owner } = store.createSession();
    const first = store.trade(owner, order()),
      second = store.trade(owner, order());
    assert.equal(first.order.id, second.order.id);
    assert.equal(second.replayed, true);
    assert.equal(second.portfolio.cash, 24000);
    assert.equal(second.journal.length, 1);
    assert.throws(
      () => store.trade(owner, order({ amount: 2000 })),
      (e) => e instanceof ServiceError && e.status === 409,
    );
  } finally {
    store.db.close();
  }
});
test("invalid fills roll back without orphan journals or idempotency records", () => {
  const store = new Store(":memory:");
  try {
    const { owner } = store.createSession();
    assert.throws(
      () => store.trade(owner, order({ amount: 26000 })),
      /Insufficient/,
    );
    assert.throws(
      () => store.trade(owner, order({ amount: 0.001 })),
      /Invalid order/,
    );
    assert.equal(store.snapshot(owner).portfolio.cash, 25000);
    assert.equal(store.snapshot(owner).journal.length, 0);
    assert.equal(store.trade(owner, order()).portfolio.cash, 24000);
    assert.throws(
      () =>
        store.trade(
          owner,
          order({
            side: "SELL",
            symbol: "AAPL",
            requestId: "test-request-00000002",
          }),
        ),
      /Insufficient/,
    );
  } finally {
    store.db.close();
  }
});
test("strategy drafts persist without modifying cash or holdings", () => {
  const store = new Store(":memory:");
  try {
    const { owner } = store.createSession(),
      before = store.snapshot(owner).portfolio;
    const draft = store.trade(owner, order({ type: "TWAP", target: 2300 }));
    assert.equal(draft.order.status, "DRAFT");
    assert.deepEqual(draft.portfolio, before);
    assert.match(draft.journal[0].text, /No execution scheduled/);
    assert.throws(() =>
      store.trade(
        owner,
        order({ type: "LIMIT", target: 0, requestId: "test-request-00000002" }),
      ),
    );
  } finally {
    store.db.close();
  }
});
test("notes and pet activity validate, persist and remain within energy bounds", () => {
  const store = new Store(":memory:");
  try {
    const { owner } = store.createSession();
    assert.throws(() => store.note(owner, ""));
    assert.throws(() => store.note(owner, "x".repeat(501)));
    assert.throws(() => store.pet(owner, "unknown"));
    for (let i = 0; i < 25; i++) store.recordAnalysis(owner, "hoot");
    const p = store.snapshot(owner).petStates[0];
    assert.equal(p.energy, 0);
    assert.equal(p.activity, "Analysis complete");
  } finally {
    store.db.close();
  }
});
test("provider quotas apply per session and route bucket", () => {
  const store = new Store(":memory:");
  try {
    const a = store.createSession(),
      b = store.createSession();
    store.quota(a.owner, "voice", 1);
    assert.throws(
      () => store.quota(a.owner, "voice", 1),
      (e) => e instanceof ServiceError && e.status === 429,
    );
    store.quota(b.owner, "voice", 1);
    store.quota(a.owner, "agent", 1);
  } finally {
    store.db.close();
  }
});
test("database survives closing and reopening the server store", () => {
  const directory = mkdtempSync(join(tmpdir(), "stockpaws-test-")),
    path = join(directory, "db.sqlite");
  let store = new Store(path);
  try {
    const session = store.createSession();
    store.trade(session.owner, order());
    store.note(session.owner, "Saved across restart");
    store.recordAnalysis(session.owner, "mochi");
    store.db.close();
    store = new Store(path);
    const owner = store.authenticate(session.token),
      snapshot = store.snapshot(owner);
    assert.equal(snapshot.portfolio.cash, 24000);
    assert.equal(snapshot.journal.length, 2);
    assert.equal(snapshot.petStates[0].energy, 95);
    assert.equal(store.trade(owner, order()).replayed, true);
  } finally {
    store.db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
