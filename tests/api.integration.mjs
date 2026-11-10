import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3012";
async function request(path, { cookie, body, origin = base, raw } = {}) {
  const response = await fetch(base + path, {
    method: body !== undefined || raw !== undefined ? "POST" : "GET",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body !== undefined || raw !== undefined
        ? { "Content-Type": "application/json", Origin: origin }
        : {}),
    },
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  return { response, data: await response.json() };
}
const health = await request("/api/health");
assert.equal(health.data.status, "ok");
const missing = await request("/api/portfolio");
assert.equal(missing.response.status, 401);
const a = await request("/api/session"),
  b = await request("/api/session");
const cookieA = a.response.headers.get("set-cookie").split(";")[0],
  cookieB = b.response.headers.get("set-cookie").split(";")[0];
assert.match(a.response.headers.get("set-cookie"), /HttpOnly/i);
assert.match(a.response.headers.get("set-cookie"), /SameSite=strict/i);
const order = {
  symbol: "ETH",
  side: "BUY",
  type: "MARKET",
  amount: 1000,
  requestId: randomUUID(),
  price: 0.01,
  portfolio: { cash: 999999 },
};
const fill = await request("/api/trade", { cookie: cookieA, body: order });
assert.equal(fill.response.status, 200);
assert.equal(fill.data.portfolio.cash, 24000);
assert.equal(fill.data.order.price, 2450.8);
const duplicate = await request("/api/trade", { cookie: cookieA, body: order });
assert.equal(duplicate.data.replayed, true);
assert.equal(duplicate.data.journal.length, 1);
const conflict = await request("/api/trade", {
  cookie: cookieA,
  body: { ...order, amount: 2 },
});
assert.equal(conflict.response.status, 409);
const note = await request("/api/memory", {
  cookie: cookieA,
  body: { kind: "note", text: "Integration test journal" },
});
assert.equal(note.data.journal.length, 2);
const other = await request("/api/portfolio", { cookie: cookieB });
assert.equal(other.data.portfolio.cash, 25000);
assert.equal(other.data.journal.length, 0);
const draft = await request("/api/trade", {
  cookie: cookieA,
  body: { ...order, type: "TWAP", target: 2400, requestId: randomUUID() },
});
assert.equal(draft.data.order.status, "DRAFT");
assert.equal(draft.data.portfolio.cash, 24000);
const cross = await request("/api/memory", {
  cookie: cookieA,
  origin: "https://example.org",
  body: { kind: "note", text: "forbidden" },
});
assert.equal(cross.response.status, 403);
const malformed = await request("/api/trade", { cookie: cookieA, raw: "{" });
assert.equal(malformed.response.status, 400);
const oversized = await request("/api/memory", {
  cookie: cookieA,
  body: { kind: "note", text: "x".repeat(17000) },
});
assert.equal(oversized.response.status, 413);
const overspend = await request("/api/trade", {
  cookie: cookieA,
  body: { ...order, amount: 1e6, requestId: randomUUID() },
});
assert.equal(overspend.response.status, 400);
if (!health.data.providers.gemini) {
  const agent = await request("/api/agent", {
    cookie: cookieA,
    body: { agentId: "hoot", ticker: "ETH", userPrompt: "risk?", amount: 1000 },
  });
  assert.equal(agent.data.metrics.positionRisk, 50);
  assert.equal(agent.data.petStates.find((p) => p.petId === "hoot").energy, 95);
}
const gated=await fetch(base+'/terminal',{redirect:'manual'});assert.equal(gated.status,307);assert.match(gated.headers.get('location'),/login/);
const wallet=privateKeyToAccount(generatePrivateKey());
const challenge=await request('/api/auth/challenge',{cookie:cookieA,body:{address:wallet.address,chainId:11155111}});assert.equal(challenge.response.status,200);
const signature=await wallet.signTypedData({...challenge.data,domain:{...challenge.data.domain,chainId:BigInt(challenge.data.domain.chainId)}});
const verified=await request('/api/auth/verify',{cookie:cookieA,body:{challengeId:challenge.data.id,signature}});assert.equal(verified.response.status,200);assert.equal(verified.data.identity.authenticated,true);
const signedCookie=verified.response.headers.get('set-cookie').split(';')[0];
assert.equal((await request('/api/portfolio',{cookie:cookieA})).response.status,401);
assert.equal((await request('/api/portfolio',{cookie:signedCookie})).data.portfolio.cash,24000);
assert.equal((await request('/api/auth/verify',{cookie:signedCookie,body:{challengeId:challenge.data.id,signature}})).response.status,401);
const second=await request('/api/auth/challenge',{cookie:cookieB,body:{address:wallet.address,chainId:1}}),secondSig=await wallet.signTypedData({...second.data,domain:{...second.data.domain,chainId:BigInt(second.data.domain.chainId)}});
const secondLogin=await request('/api/auth/verify',{cookie:cookieB,body:{challengeId:second.data.id,signature:secondSig}});assert.equal(secondLogin.response.status,200);const secondCookie=secondLogin.response.headers.get('set-cookie').split(';')[0];assert.equal((await request('/api/portfolio',{cookie:secondCookie})).data.portfolio.cash,24000);
const market=await request('/api/market?symbol=ETH&frame=24H');assert.equal(market.response.status,200);assert.equal(market.data.quote.source,'Coinbase Exchange');
if(market.data.quote.status==='live'){
 const liveOrder=await request('/api/trade',{cookie:signedCookie,body:{symbol:'ETH',side:'BUY',type:'MARKET',amount:100,marketMode:'live',expectedPrice:market.data.quote.price,requestId:randomUUID()}});assert.equal(liveOrder.response.status,200);assert.equal(liveOrder.data.order.priceSource,'Coinbase Exchange');console.log(`LIVE VERIFIED: ETH $${market.data.quote.price}; ${market.data.chart.candles.length} candles; server paper fill at $${liveOrder.data.order.price}.`);
}else{assert.ok(['stale','unavailable'].includes(market.data.quote.status));console.log('Market provider unavailable/stale: explicit degraded response verified.');}
const logout=await request('/api/auth/logout',{cookie:signedCookie,body:{}});assert.equal(logout.response.status,200);assert.equal((await request('/api/portfolio',{cookie:signedCookie})).response.status,401);
console.log('PASS: paper trading, isolation, idempotency, JSON limits, origin protection, rules analysis, EIP-712 sign-in, session rotation, replay rejection, cross-browser wallet accounts, logout, route gating and live market contract.');
