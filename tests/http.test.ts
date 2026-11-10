import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { assertOrigin } from "../lib/server/http";
test("origin validation uses browser host when Next normalizes internal URL", () => {
  const valid = new NextRequest("http://localhost:3012/api/trade", {
    headers: { host: "127.0.0.1:3012", origin: "http://127.0.0.1:3012" },
  });
  assert.doesNotThrow(() => assertOrigin(valid));
  const foreign = new NextRequest("http://localhost:3012/api/trade", {
    headers: { host: "127.0.0.1:3012", origin: "https://attacker.example" },
  });
  assert.throws(() => assertOrigin(foreign), /Same-origin/);
  const missing = new NextRequest("http://localhost:3012/api/trade", {
    headers: { host: "127.0.0.1:3012" },
  });
  assert.throws(() => assertOrigin(missing), /Same-origin/);
});
