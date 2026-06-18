# Sonar

**Non-custodial liquidation guardian for Bitcoin-native lending on Stacks.**

Sonar monitors sBTC lending positions on Stacks and alerts borrowers before liquidation — with a plain-English explanation of *why* health is dropping, not just that it is.

🌐 [sonaragent.xyz](https://www.sonaragent.xyz)

---

## What Sonar does

- **Reads** live borrower position state directly from Clarity contracts on Stacks mainnet — read-only, no wallet connection required
- **Computes** health factors continuously against each reserve's on-chain liquidation threshold
- **Alerts** proactively via Telegram before a position is at risk
- **Explains** the cause in plain English: sBTC price movement, rising borrow rates, or both

When you borrow against sBTC on a Stacks protocol like Zest, your position carries a **health factor** — a number that tracks how safe you are from liquidation. At 1.0 you get liquidated. Most tools just show the number. Sonar tells you why it's moving and what to do about it.

Non-custodial by design. Sonar never holds keys or funds. You give it a Stacks address; it does the rest.

## Status

| Component | Status |
|-----------|--------|
| Landing page | ✅ Live at sonaragent.xyz |
| Dashboard UI | ✅ Live at sonaragent.xyz/dashboard |
| Read-path validation | ✅ Confirmed — Zest v2 mainnet reads return HTTP 200 |
| Health factor computation | ✅ Validated on mainnet (live oracle + reserve config) |
| Alert pipeline (Telegram) | 🔨 In progress |
| Multi-protocol (Granite) | 📅 Milestone 2 |

## Architecture

```
Stacks Mainnet
└── Zest Protocol v2 (SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.pool-borrow-v2-3)
    └── Hiro API (read-only, no auth)
        └── Sonar backend
            ├── Health factor computation
            └── Telegram alert delivery
                └── User notification
```

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

## Supported protocols

| Protocol | Type | Status |
|----------|------|--------|
| Zest | sBTC lending | Milestone 1 |
| Granite | sBTC lending | Milestone 2 |
| Velar Perps | Perpetuals | Post-grant |

## Built with

- Stacks mainnet + Hiro API
- Clarity contract read-only calls (`@stacks/transactions` for encode/decode)
- Node.js backend
- Telegram Bot API
- Next.js (frontend / dashboard)

## Repository scripts

- `validate-zest-read.js` — confirms Zest contract state is callable via the Hiro read-only API (zero dependencies)
- `prototype-health-factor.mjs` — reads live reserve config + oracle price and computes a wallet's health factor from mainnet

## Stacks Endowment Grant

Sonar is being developed with support from the Stacks Endowment Getting Started grant program. Follow progress on [X/Twitter](https://x.com/sonaragent_) or join the Telegram group.

---

*Not financial advice. Best-effort monitoring only. Always maintain a safe health buffer.*
