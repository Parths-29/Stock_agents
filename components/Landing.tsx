"use client";
import { useState } from "react";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Command,
  Database,
  Layers,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PetAvatar from "./PetAvatar";
import { pets, type PetId } from "@/lib/market";
const profiles: Record<
  PetId,
  { title: string; description: string; question: string; answer: string }
> = {
  mochi: {
    title: "A little clarity. A lot of curiosity.",
    description:
      "Your trend coach turns market noise into plain language. Start with what changed, then understand what it means.",
    question: "What am I actually looking at?",
    answer:
      "A price move is a clue, not a conclusion. Let’s look at the context before chasing the candle.",
  },
  boba: {
    title: "Every chart has a trail.",
    description:
      "Your chart scout explores the range and points out levels worth investigating. No crystal ball required.",
    question: "Where should I look next?",
    answer:
      "Start with the observed highs and lows. A level on a chart still needs volume and follow-through.",
  },
  kip: {
    title: "Good decisions have numbers.",
    description:
      "Your quant companion converts a position idea into quantity and dollar exposure. Small details, clearer decisions.",
    question: "What does a $1,000 position risk?",
    answer:
      "With a 5% stop reference, planned price risk is $50 before fees, gaps and slippage.",
  },
  hoot: {
    title: "Watch the downside first.",
    description:
      "Your risk guardian puts stop and take-profit references beside your order, so the exit gets as much thought as the entry.",
    question: "Where does the plan break?",
    answer:
      "At a $100 entry, a 5% stop reference is $95. A 10% take-profit reference is $110. Neither is an active order.",
  },
  claude: {
    title: "Big ideas. Thoughtful little steps.",
    description:
      "Your execution planner breaks a trade idea into a reviewable schedule. You stay in charge of every decision.",
    question: "Can we take this one step at a time?",
    answer:
      "A $1,000 TWAP draft can be four $250 slices, 15 minutes apart. Save the plan; no execution runs in the background.",
  },
};
export default function Landing() {
  const [active, setActive] = useState<PetId>("mochi");
  const p = pets.find((p) => p.id === active)!,
    profile = profiles[active];
  return (
    <main className="landing">
      <div className="landing-announcement">
        <span className="dot" /> A CALMER CORNER OF THE MARKET.
        <span className="announcement-right">
          PAPER TRADING WORKSPACE <ArrowUpRight size={12} />
        </span>
      </div>
      <nav className="landing-nav" aria-label="Main navigation">
        <a className="brand" href="/" aria-label="StockPaws home">
          <span className="brand-icon">
            <PawPrint size={25} />
          </span>
          STOCKPAWS<span className="nav-edition">/ EST. FOR THE CURIOUS</span>
        </a>
        <div className="landing-nav-links">
          <a href="#companions">THE COMPANIONS</a>
          <a href="#workflow">HOW IT WORKS</a>
          <a href="#phases">THE BUILD</a>
        </div>
        <a className="landing-nav-cta" href="/login">
          OPEN TERMINAL <ArrowUpRight size={16} />
        </a>
      </nav>
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="landing-eyebrow">
            <span>01 / MEET YOUR MARKET COMPANIONS</span>
            <span className="little-cross">✳</span>
          </div>
          <h1>
            Wild markets.
            <br />
            <span>
              Good
              <br className="desktop-break" /> company.
            </span>
          </h1>
          <p>
            Five little co-pilots for your big trading questions.
            <br className="desktop-break" /> Read the chart. Understand the
            risk. Practice the plan.
          </p>
          <div className="hero-actions">
            <a className="landing-primary" href="/login">
              ENTER THE TERMINAL <ArrowUpRight size={21} />
            </a>
            <a className="hero-secondary" href="#companions">
              MEET YOUR PAWS <ArrowDown size={15} />
            </a>
          </div>
          <div className="hero-fineprint">
            <span>
              <Check size={12} /> VIRTUAL FUNDS
            </span>
            <span>
              <Check size={12} /> NO WALLET REQUIRED
            </span>
            <span>
              <Check size={12} /> YOUR PACE
            </span>
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="Illustrated StockPaws companion workspace"
        >
          <div className="art-topline">
            <span>
              <span className="dot" /> THE PAW FLOOR
            </span>
            <span>FIVE MINDS. ONE WORKSPACE.</span>
          </div>
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="art-grid" />
          <div className="hero-chart">
            <span>
              ETH / USD <small>ILLUSTRATIVE</small>
            </span>
            <svg viewBox="0 0 360 160" aria-hidden="true">
              <path
                d="M0 135 20 117 38 125 60 91 82 98 107 70 129 84 150 53 170 66 191 36 214 49 234 27 258 47 280 13 306 24 334 6 360 16"
                fill="none"
                stroke="#FF6F61"
                strokeWidth="3"
              />
              <path
                d="M0 135 20 117 38 125 60 91 82 98 107 70 129 84 150 53 170 66 191 36 214 49 234 27 258 47 280 13 306 24 334 6 360 16V160H0Z"
                fill="#FF6F6115"
              />
            </svg>
            <div className="chart-coordinate">
              OBSERVE → UNDERSTAND → PRACTICE
            </div>
          </div>
          <div className="hero-mascot main-mascot">
            <span className="mascot-callout">
              Less panic.
              <br />
              More perspective.<span>— MOCHI</span>
            </span>
            <PetAvatar id="mochi" size={190} />
          </div>
          <div className="hero-mascot boba-mascot">
            <PetAvatar id="boba" size={100} />
            <span>CHART SCOUT</span>
          </div>
          <div className="hero-mascot kip-mascot">
            <PetAvatar id="kip" size={100} />
          </div>
          <div className="hero-mascot hoot-mascot">
            <PetAvatar id="hoot" size={100} />
            <span>RISK? ON IT.</span>
          </div>
          <div className="hero-mascot claude-mascot">
            <PetAvatar id="claude" size={90} />
          </div>
          <div className="art-sticker">
            <PawPrint size={18} />
            <span>
              ALL PAWS
              <br />
              ON DECK.
            </span>
          </div>
          <div className="art-bottomline">
            <span>YOUR KEYS STAY YOURS.</span>
            <Command size={15} />
            <span>YOUR DECISIONS, TOO.</span>
          </div>
        </div>
      </section>
      <div className="landing-manifesto">
        <span>CURIOUS BY NATURE.</span>
        <span>CALCULATED BY DESIGN.</span>
        <span>
          ALWAYS IN YOUR CORNER. <PawPrint size={20} />
        </span>
      </div>
      <section id="companions" className="companions-section">
        <div className="section-intro">
          <div>
            <span className="landing-eyebrow">
              02 / SMALL PAWS. DISTINCT PERSPECTIVES.
            </span>
            <h2>
              Your new
              <br />
              market circle.
            </h2>
          </div>
          <p>
            One pet for every kind of question.
            <br />
            Choose a companion. Find your starting point.
          </p>
        </div>
        <div className="companion-layout">
          <div
            className="companion-menu"
            role="tablist"
            aria-label="Companions"
          >
            {pets.map((pet, i) => (
              <button
                role="tab"
                id={`tab-${pet.id}`}
                aria-controls="companion-profile"
                aria-selected={pet.id === active}
                key={pet.id}
                onClick={() => setActive(pet.id)}
                className={pet.id === active ? "selected" : ""}
              >
                <span className="companion-number">0{i + 1}</span>
                <PetAvatar id={pet.id} size={53} />
                <span className="companion-menu-name">
                  <b>{pet.name}</b>
                  <small>{pet.role}</small>
                </span>
                <ArrowUpRight size={18} />
              </button>
            ))}
          </div>
          <div
            className="companion-profile"
            id="companion-profile"
            role="tabpanel"
            aria-labelledby={`tab-${active}`}
          >
            <div className="profile-copy">
              <span className="profile-role">
                {p.role.toUpperCase()} / {p.animal}
              </span>
              <h3>{profile.title}</h3>
              <p>{profile.description}</p>
              <a href={`/terminal?demo=1&pet=${active}`}>
                TAKE {p.name.toUpperCase()} TO THE TERMINAL{" "}
                <ArrowUpRight size={16} />
              </a>
            </div>
            <div
              className="profile-portrait"
              style={{ "--pet-color": p.color } as React.CSSProperties}
            >
              <span className="portrait-cross">+</span>
              <PetAvatar id={active} size={185} />
              <span className="portrait-label">
                {p.name.toUpperCase()} / ON YOUR SIDE
              </span>
            </div>
            <div className="profile-example">
              <span>AN EXAMPLE CONVERSATION</span>
              <b>“{profile.question}”</b>
              <p>{profile.answer}</p>
              <small>ILLUSTRATIVE RESPONSE · NO MARKET PREDICTIONS</small>
            </div>
          </div>
        </div>
      </section>
      <section id="workflow" className="workflow-section">
        <div className="workflow-head">
          <span className="landing-eyebrow">03 / FROM NOISE TO A PLAN</span>
          <h2>
            A clearer head.
            <br />
            Before the next move.
          </h2>
          <p>A workspace that gives your questions somewhere to go.</p>
          <a href="/login" className="workflow-link">
            TRY THE PAPER WORKSPACE <ArrowDownRight size={22} />
          </a>
        </div>
        <div className="workflow-steps">
          {[
            {
              icon: Layers,
              title: "Find your context.",
              body: "Pick an asset and explore the sample chart. Prices and data sources are labeled, so you know what you are looking at.",
            },
            {
              icon: ShieldCheck,
              title: "Put a number on risk.",
              body: "Inspect position size and stop references with your companion. Calculations stay separate from AI explanations.",
            },
            {
              icon: Database,
              title: "Practice. Reflect. Repeat.",
              body: "Review a paper order and see your portfolio change. Your fills and journal are saved together on the server.",
            },
          ].map((s, i) => (
            <article key={s.title}>
              <span className="step-number">0{i + 1}</span>
              <div>
                <s.icon size={23} />
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section id="phases" className="phases-section">
        <div className="section-intro">
          <div>
            <span className="landing-eyebrow">04 / BUILDING IN THE OPEN</span>
            <h2>
              Real progress.
              <br />
              Clear boundaries.
            </h2>
          </div>
          <p>
            The paper workspace is here.
            <br />
            Here is what works, and what comes next.
          </p>
        </div>
        <div className="phase-table">
          {[
            {
              n: "01",
              name: "The experience",
              body: "Landing, terminal, responsive layouts, five interactive pets.",
              status: "IMPLEMENTED",
              done: true,
            },
            {
              n: "02",
              name: "The backend",
              body: "Guest sessions, SQLite persistence, server paper fills, journals and pet memory.",
              status: "IMPLEMENTED",
              done: true,
            },
            {
              n: "03",
              name: "Connected intelligence",
              body: "Live crypto prices, chart vision, Gemini and Sarvam verification.",
              status: "NEXT",
              done: false,
            },
            {
              n: "04",
              name: "Testnet execution",
              body: "Wallet authentication, protocol quotes, simulation and signed testnet swaps.",
              status: "PLANNED",
              done: false,
            },
            {
              n: "05",
              name: "Durable strategies",
              body: "Cancellable jobs, order monitoring and reliable scheduled execution.",
              status: "PLANNED",
              done: false,
            },
          ].map((f) => (
            <div className="phase-row" key={f.n}>
              <span>{f.n}</span>
              <h3>{f.name}</h3>
              <p>{f.body}</p>
              <b className={f.done ? "phase-done" : ""}>
                {f.done ? <Check size={12} /> : <ChevronRight size={12} />}{" "}
                {f.status}
              </b>
            </div>
          ))}
        </div>
        <div className="build-note">
          <Sparkles size={16} />
          <p>
            AI text and voice adapters are available with your API keys. Market
            prices are currently samples. Paper fills use virtual funds;
            strategy drafts do not execute.
          </p>
        </div>
      </section>
      <section className="landing-faq">
        <span className="landing-eyebrow">A FEW GOOD QUESTIONS.</span>
        <div>
          <details>
            <summary>Does this trade real money?</summary>
            <p>
              No. The current workspace uses virtual funds and sample prices.
              Connecting a wallet displays your address; it does not request a
              trade signature.
            </p>
          </details>
          <details>
            <summary>Do I need API keys to try it?</summary>
            <p>
              No. The calculation engine, companions, journal and server paper
              trading work without keys. Gemini Q&A and Sarvam speech need
              server-side credentials.
            </p>
          </details>
          <details>
            <summary>Where does my progress live?</summary>
            <p>
              Paper portfolios, journal entries and companion activity live in
              the local server’s SQLite database. An HTTP-only guest-session
              cookie identifies your workspace. This is not a cross-device
              account.
            </p>
          </details>
        </div>
      </section>
      <section className="landing-final">
        <div>
          <span className="landing-eyebrow">
            A LITTLE LESS CHAOS. A FEW MORE PAWS.
          </span>
          <h2>
            Make room for
            <br />a different kind of edge<span>.</span>
          </h2>
          <a className="landing-primary" href="/login">
            FIND YOUR COMPANY <ArrowUpRight size={21} />
          </a>
        </div>
        <div className="final-pets">
          <PetAvatar id="mochi" size={120} />
          <PetAvatar id="hoot" size={110} />
          <PetAvatar id="claude" size={120} />
        </div>
      </section>
      <div className="landing-footer">
        <a className="brand" href="/">
          <PawPrint size={20} /> STOCKPAWS
        </a>
        <span>CURIOUS MINDS. CONSIDERED MOVES.</span>
        <a href="/login">
          OPEN TERMINAL <ArrowUpRight size={13} />
        </a>
      </div>
    </main>
  );
}
