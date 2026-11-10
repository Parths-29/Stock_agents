import { test } from "node:test";
import assert from "node:assert/strict";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Store } from "../lib/server/store";
import { verifyWalletSignIn } from "../lib/server/auth";
import { signingData } from "../lib/auth-message";
const origin = "http://127.0.0.1:3012";
test("wallet signature rotates session, preserves guest data and resumes the same account across devices", async () => {
  const store = new Store(":memory:");
  try {
    const wallet = privateKeyToAccount(generatePrivateKey()),
      guest = store.createSession();
    store.note(guest.owner, "Keep this journal");
    const challenge = store.challenge(
      guest.token,
      wallet.address,
      11155111,
      origin,
    );
    const signature = await wallet.signTypedData(signingData(challenge));
    const signed = await verifyWalletSignIn(
      store,
      guest.token,
      challenge.id,
      signature,
      origin,
    );
    assert.notEqual(signed.token, guest.token);
    assert.throws(() => store.authenticate(guest.token));
    assert.equal(
      store.identity(signed.token).address,
      wallet.address.toLowerCase(),
    );
    assert.equal(
      store.snapshot(store.authenticate(signed.token)).journal[0].text,
      "Keep this journal",
    );
    const otherDevice = store.createSession(),
      next = store.challenge(otherDevice.token, wallet.address, 1, origin),
      other = await verifyWalletSignIn(
        store,
        otherDevice.token,
        next.id,
        await wallet.signTypedData(signingData(next)),
        origin,
      );
    assert.equal(other.owner, signed.owner);
    assert.equal(
      store.snapshot(store.authenticate(other.token)).journal[0].text,
      "Keep this journal",
    );
    store.revoke(other.token);
    assert.throws(() => store.authenticate(other.token));
  } finally {
    store.db.close();
  }
});
test("wrong wallet, origin, browser session, expired and replayed challenges are rejected", async () => {
  const store = new Store(":memory:");
  try {
    const wallet = privateKeyToAccount(generatePrivateKey()),
      wrong = privateKeyToAccount(generatePrivateKey()),
      guest = store.createSession(),
      other = store.createSession();
    const challenge = store.challenge(guest.token, wallet.address, 1, origin),
      signature = await wallet.signTypedData(signingData(challenge));
    const wrongSignature = await wrong.signTypedData(signingData(challenge));
    await assert.rejects(() =>
      verifyWalletSignIn(
        store,
        guest.token,
        challenge.id,
        wrongSignature,
        origin,
      ),
    );
    await assert.rejects(() =>
      verifyWalletSignIn(store, other.token, challenge.id, signature, origin),
    );
    await assert.rejects(() =>
      verifyWalletSignIn(
        store,
        guest.token,
        challenge.id,
        signature,
        "https://attacker.example",
      ),
    );
    store.db
      .prepare("UPDATE auth_challenges SET expires=0 WHERE id=?")
      .run(challenge.id);
    await assert.rejects(() =>
      verifyWalletSignIn(store, guest.token, challenge.id, signature, origin),
    );
    const next = store.challenge(guest.token, wallet.address, 1, origin),
      valid = await wallet.signTypedData(signingData(next));
    const logged = await verifyWalletSignIn(
      store,
      guest.token,
      next.id,
      valid,
      origin,
    );
    await assert.rejects(() =>
      verifyWalletSignIn(store, logged.token, next.id, valid, origin),
    );
    assert.throws(
      () => store.challenge(logged.token, wrong.address, 1, origin),
      /Sign out/,
    );
  } finally {
    store.db.close();
  }
});
