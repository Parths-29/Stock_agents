"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  KeyRound,
  LockKeyhole,
  PawPrint,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import PetAvatar from "./PetAvatar";
import { money } from "@/lib/market";
import { type Quote } from "@/lib/market-data";
type Provider = {
  request: (input: { method: string; params?: unknown[] }) => Promise<unknown>;
};
async function request(path: string, input?: unknown) {
  const r = await fetch(path, {
    method: input ? "POST" : "GET",
    headers: input ? { "Content-Type": "application/json" } : undefined,
    body: input ? JSON.stringify(input) : undefined,
    cache: "no-store",
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Request failed.");
  return d;
}
export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const [market, setMarket] = useState<Quote[]>([]);
  useEffect(() => {
    let mounted = true;
    const refresh = () =>
      request("/api/market")
        .then((d) => {
          if (mounted)
            setMarket(
              d.quotes.filter((q: Quote) =>
                ["ETH", "BTC", "SOL"].includes(q.symbol),
              ),
            );
        })
        .catch(() => {
          if (mounted) setMarket([]);
        });
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);
  const [busy, setBusy] = useState(false),
    [step, setStep] = useState(""),
    [error, setError] = useState(""),
    [address, setAddress] = useState(""),
    [ready, setReady] = useState(false);
  useEffect(() => {
    request("/api/session")
      .then((d) => {
        setAddress(d.identity.address || "");
        setReady(true);
      })
      .catch((e) => setError(e.message));
  }, []);
  async function signIn() {
    setError("");
    setBusy(true);
    try {
      const provider = (window as Window & { ethereum?: Provider }).ethereum;
      if (!provider)
        throw new Error(
          "No Ethereum wallet detected. Open this page in a browser with MetaMask, or explore the guest demo below.",
        );
      setStep("CONNECT YOUR WALLET");
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (!accounts[0]) throw new Error("No wallet account was selected.");
      const chainId = parseInt(
        (await provider.request({ method: "eth_chainId" })) as string,
        16,
      );
      if (![1, 11155111].includes(chainId))
        throw new Error(
          "Choose Ethereum Mainnet or Sepolia in your wallet, then try again. Signing in does not send a transaction.",
        );
      const challenge = await request("/api/auth/challenge", {
        address: accounts[0],
        chainId,
      });
      setStep("REVIEW THE SIGN-IN MESSAGE");
      const { id, ...typedData } = challenge;
      const signature = await provider.request({
        method: "eth_signTypedData_v4",
        params: [accounts[0], JSON.stringify(typedData)],
      });
      setStep("VERIFYING WALLET OWNERSHIP");
      const current = (await provider.request({
        method: "eth_accounts",
      })) as string[];
      if (current[0]?.toLowerCase() !== accounts[0].toLowerCase())
        throw new Error("Wallet account changed. Please try again.");
      await request("/api/auth/verify", { challengeId: id, signature });
      window.location.assign("/terminal");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in was cancelled.");
    } finally {
      setBusy(false);
      setStep("");
    }
  }
  async function logout() {
    setBusy(true);
    try {
      await request("/api/auth/logout", {});
      await request("/api/session");
      setAddress("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-shell">
      <a className="auth-back" href="/">
        <ArrowLeft size={14} /> BACK TO STOCKPAWS
      </a>
      <div className="auth-layout">
        <section className="auth-story">
          <a className="brand" href="/">
            <span className="brand-icon">
              <PawPrint size={25} />
            </span>
            STOCKPAWS
          </a>
          <span className="auth-edition">
            YOUR WORKSPACE. YOUR WALLET. YOUR CALL.
          </span>
          <h1>
            A familiar face.
            <br />A clearer
            <br />
            <span>next move.</span>
          </h1>
          <p>
            Meet your companions. Keep your practice portfolio and trading
            journal connected to a wallet you control.
          </p>
          <div className="auth-pet-scene">
            <span className="auth-pet-bubble">
              I’ll keep your place.
              <br />
              <small>— MOCHI, TREND COACH</small>
            </span>
            <PetAvatar id="mochi" size={160} />
            <PetAvatar id="hoot" size={100} />
            <span className="auth-scene-label">ALL PAWS ON DECK.</span>
          </div>
          <div className="auth-trust">
            <ShieldCheck size={19} />
            <div>
              <b>VERIFIED WALLET OWNERSHIP</b>
              <p>
                One-time, origin-bound EIP-712 message.
                <br />
                No transaction. No token approval.
              </p>
            </div>
          </div>
          <div className="auth-market-tape">
            {["ETH", "BTC", "SOL"].map((symbol) => {
              const q = market.find((q) => q.symbol === symbol);
              return (
                <span key={symbol}>
                  <b>{symbol}</b>
                  {q?.status === "live" && q.price ? money(q.price) : "—"}
                  <small>
                    {q?.status === "live" ? "COINBASE" : "AWAITING FEED"}
                  </small>
                </span>
              );
            })}
          </div>
        </section>
        <section className="auth-card">
          <div className="auth-tabs">
            <a className={mode === "login" ? "active" : ""} href="/login">
              SIGN IN
            </a>
            <a className={mode === "signup" ? "active" : ""} href="/signup">
              CREATE WORKSPACE
            </a>
          </div>
          <div className="auth-card-body">
            <span className="eyebrow">A GOOD PLACE TO START.</span>
            <h2>
              {address
                ? "Your paws are ready."
                : mode === "login"
                  ? "Welcome back."
                  : "Find your company."}
            </h2>
            <p>
              {address
                ? "Wallet ownership is verified. Your saved portfolio and journal are waiting."
                : mode === "login"
                  ? "Sign a short message to return to your wallet’s workspace. New here? Your first sign-in creates one."
                  : "Create your wallet-linked paper workspace. Keep your notes and practice trades together across browsers."}
            </p>
            {address ? (
              <>
                <div className="auth-address">
                  <Check size={17} />
                  <span>
                    AUTHENTICATED<span>{address}</span>
                  </span>
                </div>
                <a className="auth-primary" href="/terminal">
                  ENTER YOUR TERMINAL <ArrowUpRight size={18} />
                </a>
                <button
                  onClick={logout}
                  disabled={busy}
                  className="auth-logout"
                >
                  SIGN OUT
                </button>
              </>
            ) : (
              <>
                <button
                  className="auth-primary"
                  onClick={signIn}
                  disabled={!ready || busy}
                >
                  <Wallet size={18} />
                  {busy ? step : "CONTINUE WITH METAMASK"}
                  <ArrowUpRight size={18} />
                </button>
                <div className="auth-signing-note">
                  <LockKeyhole size={13} />
                  <span>
                    We verify a signature, never ask for your private key.
                  </span>
                </div>
                <ol className="auth-steps">
                  <li>
                    <span>01</span> Connect an Ethereum or Sepolia wallet.
                  </li>
                  <li>
                    <span>02</span> Review and sign the StockPaws message.
                  </li>
                  <li>
                    <span>03</span> Enter your saved paper workspace.
                  </li>
                </ol>
              </>
            )}
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <div className="auth-alternative">
              <span>JUST LOOKING AROUND?</span>
              <a href="/terminal?demo=1">
                EXPLORE THE GUEST DEMO <ArrowUpRight size={14} />
              </a>
              <p>Virtual funds. No signature required.</p>
            </div>
            <div className="auth-provider-note">
              <KeyRound size={15} />
              <p>
                Passkey and social sign-in are planned. WalletConnect and
                contract-wallet verification are not enabled yet.
              </p>
            </div>
          </div>
          <div className="auth-card-bottom">
            <span className="dot" /> PAPER TRADING · NO REAL FUNDS MOVE
          </div>
        </section>
      </div>
      <div className="auth-bottom">
        <span>CURIOUS MINDS. CONSIDERED MOVES.</span>
        <span>AUTHENTICATION ≠ SPENDING PERMISSION</span>
      </div>
    </main>
  );
}
