// src/scripts/check.ts
// Standalone read + classify check for the backend (no Telegram needed).
//   npm run check -- <stx-address>
//   npx tsx src/scripts/check.ts <stx-address>

import { config } from '../config.js'
import { getPosition, isValidStacksAddress } from '../lib/stacks.js'
import { classify, formatSnapshot } from '../format.js'

const addr = (process.argv[2] || 'SP2GHQRCRMYY4S8PMBR49BEKX144VR437YT42SF3B').trim()

async function main() {
  if (!isValidStacksAddress(addr)) {
    console.error(`Invalid Stacks address: ${addr}`)
    process.exit(1)
  }
  console.log(`Reading ${addr} live from Zest v2 mainnet…\n`)
  const pos = await getPosition(addr)
  const level = classify(pos.healthFactor, config.thresholds)
  console.log(formatSnapshot(pos, level))
  console.log('\n(raw)', JSON.stringify(pos, (_k, v) => (v === Infinity ? '∞' : v), 2))
}

main().catch((e) => {
  console.error('\n❌ ERROR:', e?.message || e)
  process.exit(1)
})
