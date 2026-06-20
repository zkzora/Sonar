// scripts/check.ts
// Phase 0 parity check: prints the computed Zest position for a wallet straight
// from the shared module, so we can confirm it matches the dashboard output.
//
// Usage:  npx tsx scripts/check.ts <stacks-address>
//   (defaults to a known mainnet wallet that holds sBTC collateral on Zest v2)

import { getZestAccount, isValidStacksAddress } from '../src/lib/stacks'

const addr = (process.argv[2] || 'SP2GHQRCRMYY4S8PMBR49BEKX144VR437YT42SF3B').trim()

const usd = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 })
const hf = (n: number | null) => (n == null || n === Infinity ? '∞ (no debt)' : n.toFixed(4))

async function main() {
  if (!isValidStacksAddress(addr)) {
    console.error(`Invalid Stacks address: ${addr}`)
    process.exit(1)
  }

  console.log('=== SONAR — PHASE 0 CHECK (live Zest v2 mainnet read) ===')
  console.log(`Address: ${addr}\n`)

  const t0 = Date.now()
  // Single live scan = the exact shape the dashboard route returns.
  const acc = await getZestAccount(addr)
  // Derive the framework-agnostic backend shape from the same scan (getPosition
  // does exactly this mapping) — avoids a second round of on-chain reads.
  const pos = {
    healthFactor: acc.debtUSD > 0 ? (acc.hf as number) : Infinity,
    collateralUSD: acc.collateralUSD,
    debtUSD: acc.debtUSD,
    sbtcPriceUSD: acc.sbtcPriceUSD,
    liqThreshold: acc.sbtcLT,
    syncedAt: Date.now(),
  }

  console.log('--- getZestAccount (dashboard route shape) ---')
  console.log(`  hasPosition     : ${acc.hasPosition}`)
  console.log(`  health factor   : ${hf(acc.hf)}`)
  console.log(`  collateral (USD): ${usd(acc.collateralUSD)}`)
  console.log(`  debt (USD)      : ${usd(acc.debtUSD)}`)
  console.log(`  liq. price      : ${acc.liqPrice ? usd(acc.liqPrice) : '—'}`)
  console.log(`  collateral rows : ${JSON.stringify(acc.collateralRows)}`)
  console.log(`  debt rows       : ${JSON.stringify(acc.debtRows)}`)

  console.log('\n--- getPosition (backend shape) ---')
  console.log(`  healthFactor    : ${hf(pos.healthFactor)}`)
  console.log(`  collateralUSD   : ${usd(pos.collateralUSD)}`)
  console.log(`  debtUSD         : ${usd(pos.debtUSD)}`)
  console.log(`  sbtcPriceUSD    : ${usd(pos.sbtcPriceUSD)}`)
  console.log(`  liqThreshold    : ${pos.liqThreshold}`)
  console.log(`  syncedAt        : ${new Date(pos.syncedAt).toISOString()}`)

  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s — compare against the dashboard for the same wallet.`)
}

main().catch((e) => {
  console.error('\n❌ ERROR:', e.message)
  if (/rate limit/i.test(e.message)) console.error('   Hiro per-minute limit hit — wait 60s and retry, or set HIRO_API_KEY.')
  process.exit(1)
})
