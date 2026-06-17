# Sonar

**DeFi position guardian for Stacks.** Sonar monitors your sBTC lending positions and alerts you before liquidation — with a plain-English explanation of *why* your health is dropping, not just that it is.

---

## What is Sonar?

When you borrow against sBTC on Stacks protocols like Zest, your position has a **health factor** — a number that tracks how safe you are from liquidation. When it hits 1.0, you get liquidated. Most tools just show you the number. Sonar tells you why it's moving and what to do about it.

Sonar is a non-custodial, read-only agent. It never touches your wallet or your funds. You give it a Stacks address; it does the rest.

---

## How It Works

**1. READ** — Sonar reads your position state directly from Clarity contracts on Stacks: health factor, collateral ratio, borrow rate, in real time. No wallet connection required.

**2. COMPUTE** — The agent continuously calculates your health factor and tracks what's driving changes: sBTC price movement, rising borrow rates, or both. You see the cause, not just the number.

**3. ALERT** — When your position approaches the liquidation threshold, Sonar sends an alert via Telegram or email with a plain-English explanation and a suggested action. You act in your own wallet.

---

## Key Features

- **Non-custodial** — Read-only by design. Sonar never holds keys or funds.
- **Stacks-native** — Reads directly from Clarity contracts. No proxy, no wrapper.
- **Agentic explanations** — Not just "health dropped" but why, and what to do next.
- **Always watching** — Continuous position monitoring so you never have to check manually.
- **Fast alerts** — Alert delivery via Telegram or email within seconds of a threshold breach.

---

## Supported Protocols

| Protocol | Type | Status |
|----------|------|--------|
| Zest | Lending · sBTC collateral | ✅ Live |
| Granite | Lending · sBTC collateral | 🔄 In Progress |
| Velar Perps | Perpetuals · sBTC | 🗓 Planned |

---

## Tech Stack

- **Frontend** — Next.js 15, React 19
- **Fonts** — Space Grotesk, Space Mono
- **Deployment** — Vercel
- **Chain** — Stacks Mainnet (Clarity contracts, sBTC)

---

## Disclaimer

Sonar provides best-effort monitoring, not guaranteed liquidation prevention. Always maintain a safe health factor buffer. Not financial advice.

---

Built on Stacks · Non-custodial · © 2026 Sonar
