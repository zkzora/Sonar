# Sonar — Telegram alert backend

Non-custodial, **read-only** liquidation guardian for sBTC lending on Stacks (Zest).
Sonar reads public Clarity contract state, computes each watched wallet's health
factor, and messages the borrower on Telegram **before** liquidation risk —
best-effort monitoring, never a guarantee.

> **Sonar never holds keys or funds and never sends transactions.** It uses your
> **public wallet address only**. You always act in your own wallet.

## What it does

- Polls every watched wallet on an interval and computes the Aave-style health
  factor `HF = Σ(collateralUSD × liqThreshold) / Σ(debtUSD)` from live on-chain
  reads on Zest v2 mainnet (`SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.pool-borrow-v2-3`).
- Classifies HF into **SAFE / WATCH / DANGER / CRITICAL** (env-configurable).
- Sends a Telegram alert only when the level **worsens**, **recovers to SAFE**, or
  stays **CRITICAL** past a repeat window — no same-level spam.
- Each alert explains *why* HF moved and *what* reduces risk.

## Commands

| Command | Description |
| --- | --- |
| `/start` | Intro + non-custodial disclaimer |
| `/watch <stx-address> [label]` | Start monitoring; replies with a live HF snapshot |
| `/unwatch <stx-address>` | Stop monitoring |
| `/list` | Your watched wallets + current level |
| `/status <stx-address>` | On-demand fresh read + HF |
| `/help` | Command list |

Any message that looks like a seed phrase or private key is refused and never
stored, with a safety warning.

## Setup

```bash
cd sonar-backend
npm install
cp .env.example .env   # then fill in TELEGRAM_BOT_TOKEN
npm run check -- SP2GHQRCRMYY4S8PMBR49BEKX144VR437YT42SF3B   # sanity read
npm start              # boot bot + monitor loop
```

`npm run dev` runs with auto-reload (`tsx watch`).

### Configuration (`.env`)

| Var | Default | Meaning |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | — | From @BotFather (required) |
| `HIRO_API_URL` | `https://api.hiro.so` | Read-only Stacks node |
| `HIRO_API_KEY` | — | Optional; raises the Hiro rate limit |
| `POLL_INTERVAL_SEC` | `120` | Seconds between poll cycles |
| `HF_WATCH` | `1.5` | `HF > HF_WATCH` → SAFE |
| `HF_DANGER` | `1.2` | `HF_DANGER < HF ≤ HF_WATCH` → WATCH |
| `HF_CRITICAL` | `1.05` | `HF_CRITICAL < HF ≤ HF_DANGER` → DANGER; `HF ≤ HF_CRITICAL` → CRITICAL |
| `CRITICAL_REPEAT_MIN` | `30` | Re-send a CRITICAL alert at most this often |
| `DB_PATH` | `./sonar.db` | SQLite file (use a persistent volume) |

## Deploy

- Run as a **long-running worker** (Railway / Render / Fly) — **not** Vercel
  serverless. The monitor loop and the bot must run continuously.
- The bot uses **long-polling**, so no public webhook is needed.
- `better-sqlite3` writes a file at `DB_PATH`; mount a **persistent volume** so
  watches survive restarts.

## Read logic / single source of truth

The read + health-factor computation lives in
[`src/lib/stacks.ts`](src/lib/stacks.ts). It is a **synced copy** of the repo
root's `src/lib/stacks.ts`, which the Next.js dashboard route
(`/api/positions`) also imports — same validated decoding everywhere. If you
change one copy, change both. Verify parity with the root
`npx tsx scripts/check.ts <address>` against the dashboard.

## Demo (Milestone 1 evidence)

Most Zest wallets hold collateral but no debt (HF = ∞) and won't trigger. For a
live alert: open a small real sBTC borrow on Zest mainnet, `/watch` it, and let
the loop fire — real on-chain data, not mocked. Thresholds are env-configurable
so a real finite-HF position can be made to cross WATCH/DANGER for the demo.
