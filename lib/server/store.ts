import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { signInTypes, type SignInChallenge } from "../auth-message";
import {
  assets,
  fillOrder,
  initialPortfolio,
  money,
  pets,
  type Portfolio,
  type Symbol,
} from "../market";

export class ServiceError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export type JournalEntry = { id: string; text: string; time: string };
export type PetState = {
  petId: string;
  energy: number;
  activity: string;
  updatedAt: string;
};
export type TradeInput = {
  symbol: Symbol;
  side: "BUY" | "SELL";
  amount: number;
  type: "MARKET" | "LIMIT" | "STOP-LOSS" | "TWAP";
  target?: number;
  requestId: string;
  marketMode?: "live" | "sample";
  expectedPrice?: number;
};
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export class Store {
  readonly db: DatabaseSync;
  constructor(path: string) {
    if (path !== ":memory:")
      mkdirSync(dirname(resolve(path)), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db
      .exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
   CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, expires INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS portfolios(owner TEXT PRIMARY KEY REFERENCES sessions(id), value TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS journal(id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES sessions(id), text TEXT NOT NULL, time TEXT NOT NULL);
   CREATE INDEX IF NOT EXISTS journal_owner ON journal(owner,time);
   CREATE TABLE IF NOT EXISTS orders(owner TEXT NOT NULL REFERENCES sessions(id), request_id TEXT NOT NULL, payload TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(owner,request_id));
   CREATE TABLE IF NOT EXISTS pet_states(owner TEXT NOT NULL REFERENCES sessions(id), pet_id TEXT NOT NULL, energy INTEGER NOT NULL, activity TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(owner,pet_id));
   CREATE TABLE IF NOT EXISTS quotas(owner TEXT NOT NULL REFERENCES sessions(id), bucket TEXT NOT NULL, window INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(owner,bucket));
   CREATE TABLE IF NOT EXISTS wallet_accounts(address TEXT PRIMARY KEY,owner TEXT NOT NULL REFERENCES sessions(id));
   CREATE TABLE IF NOT EXISTS wallet_sessions(session_id TEXT PRIMARY KEY REFERENCES sessions(id),address TEXT NOT NULL,account_owner TEXT NOT NULL REFERENCES sessions(id));
   CREATE TABLE IF NOT EXISTS auth_challenges(id TEXT PRIMARY KEY,session_id TEXT NOT NULL REFERENCES sessions(id),payload TEXT NOT NULL,expires INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0);`);
  }
  createSession() {
    const token = randomBytes(32).toString("hex"),
      owner = hash(token);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare("INSERT INTO sessions VALUES (?,?)")
        .run(owner, Date.now() + 30 * 86400000);
      this.db
        .prepare("INSERT INTO portfolios VALUES (?,?)")
        .run(owner, JSON.stringify(initialPortfolio));
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
    return { token, owner };
  }
  authenticate(token: string | undefined) {
    if (!token || !/^[a-f0-9]{64}$/.test(token))
      throw new ServiceError("Open the terminal to start a session.", 401);
    const owner = hash(token),
      row = this.db
        .prepare("SELECT expires FROM sessions WHERE id=?")
        .get(owner);
    if (!row || Number(row.expires) < Date.now())
      throw new ServiceError("Session expired. Reload the terminal.", 401);
    const identity = this.db
      .prepare("SELECT account_owner FROM wallet_sessions WHERE session_id=?")
      .get(owner);
    return identity ? String(identity.account_owner) : owner;
  }
  identity(token: string | undefined) {
    this.authenticate(token);
    const row = this.db
      .prepare("SELECT address FROM wallet_sessions WHERE session_id=?")
      .get(hash(token!));
    return { authenticated: !!row, address: row ? String(row.address) : null };
  }
  revoke(token: string | undefined) {
    if (token)
      this.db
        .prepare("UPDATE sessions SET expires=0 WHERE id=?")
        .run(hash(token));
  }
  challenge(
    token: string,
    address: string,
    chainId: number,
    origin: string,
  ): SignInChallenge {
    const owner = this.authenticate(token);
    this.quota(owner, "auth", 8);
    if (
      !/^0x[a-fA-F0-9]{40}$/.test(address) ||
      ![1, 11155111].includes(chainId)
    )
      throw new ServiceError("Use an Ethereum or Sepolia account.");
    const identity = this.identity(token);
    if (identity.address && identity.address !== address.toLowerCase())
      throw new ServiceError(
        "Sign out before changing the authenticated wallet.",
        409,
      );
    const id = randomUUID(),
      now = Date.now(),
      expires = now + 5 * 60000;
    const payload: SignInChallenge = {
      id,
      domain: {
        name: "StockPaws",
        version: "1",
        chainId,
        salt: `0x${hash(origin)}`,
      },
      types: signInTypes,
      primaryType: "SignIn",
      message: {
        wallet: address.toLowerCase() as `0x${string}`,
        uri: origin,
        nonce: `0x${randomBytes(32).toString("hex")}`,
        issuedAt: new Date(now).toISOString(),
        expirationTime: new Date(expires).toISOString(),
        statement:
          "Sign in to StockPaws. This proves wallet ownership only. No transaction, token approval or spending permission.",
      },
    };
    this.db.prepare("DELETE FROM auth_challenges WHERE expires<?").run(now);
    this.db
      .prepare(
        "INSERT INTO auth_challenges(id,session_id,payload,expires) VALUES (?,?,?,?)",
      )
      .run(id, hash(token), JSON.stringify(payload), expires);
    return payload;
  }
  readChallenge(token: string, id: unknown, origin: string): SignInChallenge {
    this.authenticate(token);
    if (typeof id !== "string" || id.length > 80)
      throw new ServiceError("Invalid challenge.");
    const row = this.db
      .prepare(
        "SELECT payload,expires,used FROM auth_challenges WHERE id=? AND session_id=?",
      )
      .get(id, hash(token));
    if (!row || Number(row.used) || Number(row.expires) <= Date.now())
      throw new ServiceError("Sign-in challenge expired or already used.", 401);
    const payload = JSON.parse(String(row.payload)) as SignInChallenge;
    if (payload.message.uri !== origin)
      throw new ServiceError("Sign-in origin mismatch.", 403);
    return payload;
  }
  completeSignIn(token: string, challenge: SignInChallenge) {
    const guestOwner = this.authenticate(token),
      address = challenge.message.wallet.toLowerCase(),
      newToken = randomBytes(32).toString("hex"),
      id = hash(newToken);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const consumed = this.db
        .prepare(
          "UPDATE auth_challenges SET used=1 WHERE id=? AND session_id=? AND used=0 AND expires>?",
        )
        .run(challenge.id, hash(token), Date.now());
      if (Number(consumed.changes) !== 1)
        throw new ServiceError("Challenge expired or already used.", 401);
      const account = this.db
        .prepare("SELECT owner FROM wallet_accounts WHERE address=?")
        .get(address);
      const owner = account ? String(account.owner) : guestOwner;
      if (!account)
        this.db
          .prepare("INSERT INTO wallet_accounts VALUES (?,?)")
          .run(address, owner);
      this.db
        .prepare("INSERT INTO sessions VALUES (?,?)")
        .run(id, Date.now() + 7 * 86400000);
      this.db
        .prepare("INSERT INTO wallet_sessions VALUES (?,?,?)")
        .run(id, address, owner);
      this.revoke(token);
      this.db.exec("COMMIT");
      return { token: newToken, owner, address };
    } catch (e) {
      if (this.db.isTransaction) this.db.exec("ROLLBACK");
      throw e;
    }
  }
  snapshot(owner: string) {
    const row = this.db
      .prepare("SELECT value FROM portfolios WHERE owner=?")
      .get(owner);
    if (!row) throw new ServiceError("Session not found.", 401);
    const journal = this.db
      .prepare(
        "SELECT id,text,time FROM journal WHERE owner=? ORDER BY time DESC,rowid DESC LIMIT 100",
      )
      .all(owner) as unknown as JournalEntry[];
    const petStates = this.db
      .prepare(
        "SELECT pet_id AS petId,energy,activity,updated_at AS updatedAt FROM pet_states WHERE owner=?",
      )
      .all(owner) as unknown as PetState[];
    return {
      portfolio: JSON.parse(String(row.value)) as Portfolio,
      journal,
      petStates,
    };
  }
  note(owner: string, text: unknown) {
    if (typeof text !== "string" || !text.trim() || text.length > 500)
      throw new ServiceError("Notes must contain 1–500 characters.");
    this.insertNote(owner, text.trim());
    return this.snapshot(owner);
  }
  private insertNote(owner: string, text: string) {
    this.db
      .prepare("INSERT INTO journal VALUES (?,?,?,?)")
      .run(randomUUID(), owner, text, new Date().toISOString());
  }
  pet(owner: string, petId: unknown) {
    if (!pets.some((p) => p.id === petId))
      throw new ServiceError("Unknown companion.");
    this.db
      .prepare(
        `INSERT INTO pet_states VALUES (?,?,100,'Selected',?) ON CONFLICT(owner,pet_id) DO UPDATE SET activity='Selected', updated_at=excluded.updated_at`,
      )
      .run(owner, String(petId), new Date().toISOString());
    return this.snapshot(owner);
  }
  recordAnalysis(owner: string, petId: string) {
    this.db
      .prepare(
        `INSERT INTO pet_states VALUES (?,?,95,'Analysis complete',?) ON CONFLICT(owner,pet_id) DO UPDATE SET energy=MAX(0,energy-5),activity='Analysis complete',updated_at=excluded.updated_at`,
      )
      .run(owner, petId, new Date().toISOString());
  }
  quota(owner: string, bucket: string, limit: number) {
    const window = Math.floor(Date.now() / 60000);
    this.db
      .prepare(
        `INSERT INTO quotas VALUES (?,?,?,1) ON CONFLICT(owner,bucket) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END,window=excluded.window`,
      )
      .run(owner, bucket, window);
    const row = this.db
      .prepare("SELECT count FROM quotas WHERE owner=? AND bucket=?")
      .get(owner, bucket)!;
    if (Number(row.count) > limit)
      throw new ServiceError("Too many requests. Try again in a minute.", 429);
  }
  private orderPayload(input: TradeInput) {
    return JSON.stringify({
      symbol: input.symbol,
      side: input.side,
      amount: input.amount,
      type: input.type,
      target: input.type === "MARKET" ? null : input.target,
      marketMode: input.marketMode || "sample",
      expectedPrice: input.marketMode === "live" ? input.expectedPrice : null,
    });
  }
  replay(owner: string, input: TradeInput) {
    if (!input || typeof input.requestId !== "string") return null;
    const old = this.db
      .prepare(
        "SELECT payload,result FROM orders WHERE owner=? AND request_id=?",
      )
      .get(owner, input.requestId);
    if (!old) return null;
    if (old.payload !== this.orderPayload(input))
      throw new ServiceError(
        "This request ID was already used for a different order.",
        409,
      );
    return {
      ...this.snapshot(owner),
      order: JSON.parse(String(old.result)),
      replayed: true,
    };
  }
  trade(
    owner: string,
    input: TradeInput,
    execution?: { price: number; source: string; asOf: string | null },
  ) {
    if (
      !input ||
      !assets.some((a) => a.symbol === input.symbol) ||
      !["BUY", "SELL"].includes(input.side) ||
      !["MARKET", "LIMIT", "STOP-LOSS", "TWAP"].includes(input.type) ||
      !Number.isFinite(input.amount) ||
      input.amount < 0.01 ||
      Math.abs(input.amount * 100 - Math.round(input.amount * 100)) >
        0.000001 ||
      input.amount > 1e9 ||
      typeof input.requestId !== "string" ||
      (input.marketMode !== undefined &&
        !["live", "sample"].includes(input.marketMode)) ||
      !/^[a-zA-Z0-9-]{16,80}$/.test(input.requestId)
    )
      throw new ServiceError("Invalid order.");
    if (
      input.type !== "MARKET" &&
      (!Number.isFinite(input.target) || input.target! <= 0)
    )
      throw new ServiceError("A positive reference price is required.");
    const payload = this.orderPayload(input);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const existing = this.db
        .prepare(
          "SELECT payload,result FROM orders WHERE owner=? AND request_id=?",
        )
        .get(owner, input.requestId);
      if (existing) {
        if (existing.payload !== payload)
          throw new ServiceError(
            "This request ID was already used for a different order.",
            409,
          );
        this.db.exec("COMMIT");
        return {
          ...this.snapshot(owner),
          order: JSON.parse(String(existing.result)),
          replayed: true,
        };
      }
      const current = this.snapshot(owner),
        asset = assets.find((a) => a.symbol === input.symbol)!;
      const live = input.marketMode === "live" && asset.kind === "CRYPTO";
      if (
        live &&
        (!execution ||
          !Number.isFinite(execution.price) ||
          execution.price <= 0 ||
          !execution.asOf ||
          !Number.isFinite(Date.parse(execution.asOf)) ||
          Date.now() - Date.parse(execution.asOf) > 120000)
      )
        throw new ServiceError("A fresh server quote is required.", 503);
      const price = live ? execution!.price : asset.price;
      if (
        live &&
        input.type === "MARKET" &&
        (!Number.isFinite(input.expectedPrice) ||
          input.expectedPrice! <= 0 ||
          Math.abs(price / input.expectedPrice! - 1) > 0.005)
      )
        throw new ServiceError(
          "Price moved beyond the 0.5% review tolerance. Close this review and request a new quote.",
          409,
        );
      if (input.type === "MARKET") {
        let next: Portfolio;
        try {
          next = fillOrder(current.portfolio, input, price);
        } catch (e) {
          throw new ServiceError((e as Error).message);
        }
        this.db
          .prepare("UPDATE portfolios SET value=? WHERE owner=?")
          .run(JSON.stringify(next), owner);
      }
      const order = {
        id: randomUUID(),
        status: input.type === "MARKET" ? "FILLED" : "DRAFT",
        symbol: input.symbol,
        side: input.side,
        amount: input.amount,
        price,
        quantity: input.amount / price,
        type: input.type,
        target: input.target ?? null,
        time: new Date().toISOString(),
        mode: "PAPER",
        priceSource: live ? execution!.source : "fixture",
        priceAsOf: live ? execution!.asOf : null,
      };
      this.insertNote(
        owner,
        input.type === "MARKET"
          ? `${input.side} ${money(input.amount)} ${input.symbol} @ ${money(price)} · server paper fill · ${live ? execution!.source : "sample price"}`
          : `DRAFT ${input.type}: ${input.side} ${money(input.amount)} ${input.symbol}, reference ${money(input.target!)}${input.type === "TWAP" ? " · 4 slices, 15 minutes apart" : ""}. No execution scheduled.`,
      );
      this.db
        .prepare("INSERT INTO orders VALUES (?,?,?,?)")
        .run(owner, input.requestId, payload, JSON.stringify(order));
      this.db.exec("COMMIT");
      return { ...this.snapshot(owner), order, replayed: false };
    } catch (e) {
      if (this.db.isTransaction) this.db.exec("ROLLBACK");
      throw e;
    }
  }
}
const globalStore = globalThis as typeof globalThis & {
  stockpawsStore?: Store;
};
export function getStore() {
  return (globalStore.stockpawsStore ??= new Store(
    process.env.STOCKPAWS_DB_PATH ||
      resolve(process.cwd(), "data", "stockpaws.sqlite"),
  ));
}
