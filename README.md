# Sonar

**Non-custodial liquidation guardian for Bitcoin-native lending on Stacks.**

> This is a publicly accessible repository for the Sonar risk-monitoring engine.

Sonar monitors sBTC lending positions on Stacks and alerts borrowers before liquidation — with a plain-English explanation of *why* health is dropping, not just that it is.

🌐 [sonaragent.xyz](https://www.sonaragent.xyz)

---

## ✅ Mainnet Validated

The core read-path for **Zest Protocol v2** (`pool-borrow-v2-3`) is fully integrated and successfully reads on-chain data live from Stacks mainnet:

- `get-assets` → Returns all Zest-supported assets (sBTC, sUSDT, aeUSDC) — `HTTP 200 okay: true`
- `get-user-reserve-data` → Returns per-user collateral / debt state — `HTTP 200 okay: true`
- `stx-btc-oracle-v1-4 → get-price` → Live sBTC price confirmed ($64,472)
- `get-reserve-state` → Liquidation threshold confirmed (0.75)

No authentication required. All reads are performed via the Hiro public API.

---

## What Sonar does

- **Reads** live borrower position state directly from Clarity contracts on Stacks mainnet
- **Computes** health factors continuously against each reserve's on-chain liquidation threshold
- **Alerts** proactively via Telegram before a position is at risk
- **Explains** the cause in plain English: sBTC price movement, rising borrow rates, or both

When you borrow against sBTC on a Stacks protocol like Zest, your position carries a **health factor** — a number that tracks how safe you are from liquidation. At 1.0 you get liquidated. Most tools just show the number. Sonar tells you why it's moving and what to do about it.

Non-custodial by design. Sonar never holds keys or funds. You give it a Stacks address; it does the rest.

---

## Architecture

Sonar's backend pipeline is strictly **read-only** and **non-custodial** — no wallet connection, no private keys, no transaction signing of any kind.

```
┌─────────────────────────────────────────────┐
│              Stacks Mainnet                 │
│  Zest Protocol v2                           │
│  (pool-borrow-v2-3, stx-btc-oracle-v1-4)   │
└──────────────────┬──────────────────────────┘
                   │  read-only calls (Hiro API)
                   ▼
┌─────────────────────────────────────────────┐
│            Sonar Backend                    │
│                                             │
│  1. Read on-chain state                     │
│     └─ collateral, debt, oracle price       │
│                                             │
│  2. Compute Health Factor off-chain         │
│     └─ HF = Σ(collateralUSD × liqThreshold)│
│              ÷ Σ(debtUSD)                   │
│                                             │
│  3. Alert via Telegram                      │
│     └─ plain-English risk summary           │
└─────────────────────────────────────────────┘
```

> **100% read-only · Non-custodial · No wallet connection · No private keys**

The system only ever reads public on-chain state. It cannot move funds, sign transactions, or interact with any wallet. Sonar requires only a Stacks address to monitor.

---

## Status

| Component | Status |
|-----------|--------|
| Landing page | ✅ Live at sonaragent.xyz |
| Dashboard UI | ✅ Live at sonaragent.xyz/dashboard |
| Read-path validation (Zest v2 mainnet) | ✅ Confirmed — all reads return HTTP 200 |
| Health factor computation | ✅ Validated on mainnet (live oracle + reserve config) |
| Alert pipeline (Telegram) | 🔨 In progress |
| Multi-protocol (Granite) | 📅 Milestone 2 |

---

## Validated read paths (Stacks mainnet)

```
POST /v2/contracts/call-read/SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N/pool-borrow-v2-3/get-assets
→ Returns full list of Zest-supported assets (sBTC, sUSDT, aeUSDC)

POST /v2/contracts/call-read/SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N/pool-borrow-v2-3/get-user-reserve-data
→ Returns per-user collateral / debt state

GET  stx-btc-oracle-v1-4 → get-price
→ Live sBTC price ($64,472 confirmed)

POST .../get-reserve-state
→ Liquidation threshold (0.75 confirmed)
```

Both pool reads return `HTTP 200 okay: true` with no authentication.

**Health factor formula** — Aave-style, Zest-native:

```
HF = Σ(collateralUSD × liquidationThreshold) / Σ(debtUSD)
```

Liquidation triggers when HF < 1.0. Sonar's job is watching it approach. The computation is wired live into the dashboard: enter a Stacks address and the health factor is read and computed from mainnet in real time (see `app/lib/zest.js` + `app/api/positions`).

---

## Supported protocols

| Protocol | Type | Status |
|----------|------|--------|
| Zest | sBTC lending | Milestone 1 |
| Granite | sBTC lending | Milestone 2 |
| Velar Perps | Perpetuals | Post-grant |

---

## Built with

- Stacks mainnet + Hiro API
- Clarity contract read-only calls (`@stacks/transactions` for encode/decode)
- Node.js backend
- Telegram Bot API
- Next.js (frontend / dashboard)

---

## Repository scripts

- `validate-zest-read.js` — confirms Zest contract state is callable via the Hiro read-only API (zero dependencies)
- `prototype-health-factor.mjs` — reads live reserve config + oracle price and computes a wallet's health factor from mainnet

---

## Stacks Endowment Grant

Sonar is being developed with support from the Stacks Endowment Getting Started grant program. Follow progress on [X/Twitter](https://x.com/sonaragent_) or join the Telegram group.

---

*Not financial advice. Best-effort monitoring only. Always maintain a safe health buffer.*
