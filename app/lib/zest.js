// app/lib/zest.js
// Server-side Zest v2 read + health-factor computation (Stacks mainnet).
// Same logic proven in prototype-health-factor.mjs, packaged for the API route.

import { hexToCV, cvToJSON, principalCV, serializeCV } from '@stacks/transactions'

const HIRO = 'https://api.hiro.so'
const POOL = 'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N'
const POOL_NAME = 'pool-borrow-v2-3'
const FIXED = 8 // Zest fixed-point: thresholds + oracle prices use 8 decimals

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const pcv = (p) => '0x' + serializeCV(principalCV(p))
// Peel one (response …) / (optional …) layer off a cvToJSON node.
const unwrap = (cv) => (cv && cv.value && cv.value.value !== undefined ? cv.value : cv)

// Optional Hiro API key (set HIRO_API_KEY in the env) raises the rate limit.
const HIRO_KEY = process.env.HIRO_API_KEY

async function read(addr, name, fn, args) {
  await sleep(120) // pace anonymous Hiro calls
  const headers = { 'Content-Type': 'application/json' }
  if (HIRO_KEY) headers['x-api-key'] = HIRO_KEY
  const res = await fetch(`${HIRO}/v2/contracts/call-read/${addr}/${name}/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sender: POOL, arguments: args }),
  })
  // Hiro returns the rate-limit message as plain text (not JSON), so read text first.
  const text = await res.text()
  if (res.status === 429 || /rate limit/i.test(text)) throw new Error('Hiro rate limit')
  let data
  try { data = JSON.parse(text) } catch { throw new Error('Unexpected response from Hiro API') }
  if (!data.okay) return { err: data.cause || 'read failed' }
  return cvToJSON(hexToCV(data.result))
}

// ── module-level caches (persist across requests on a warm server) ──
let assetsCache = null
const reserveCache = new Map() // asset -> { cfg, ts }
const priceCache = new Map()   // asset -> { price, ts }
const RES_TTL = 5 * 60_000
const PRICE_TTL = 30_000

async function getAssets() {
  if (assetsCache) return assetsCache
  const r = await read(POOL, POOL_NAME, 'get-assets', [])
  if (r.err) throw new Error('get-assets failed')
  assetsCache = r.value.map((a) => a.value)
  return assetsCache
}

async function getReserve(asset) {
  const c = reserveCache.get(asset)
  if (c && Date.now() - c.ts < RES_TTL) return c.cfg
  const rs = unwrap(await read(POOL, POOL_NAME, 'get-reserve-state', [pcv(asset)]))
  if (rs.err) return null
  const r = rs.value
  const cfg = {
    symbol: asset.split('.')[1],
    decimals: Number(r.decimals.value),
    liqThreshold: Number(r['liquidation-threshold'].value) / 10 ** FIXED, // e.g. 0.75
    oracle: r.oracle.value,
    aToken: r['a-token-address'].value,
    collateralEnabled: r['usage-as-collateral-enabled'].value,
  }
  reserveCache.set(asset, { cfg, ts: Date.now() })
  return cfg
}

async function getPrice(oracle, asset) {
  const c = priceCache.get(asset)
  if (c && Date.now() - c.ts < PRICE_TTL) return c.price
  const [oa, on] = oracle.split('.')
  const p = unwrap(await read(oa, on, 'get-price', [pcv(asset)]))
  if (p.err || p.value === undefined) return null
  const price = Number(p.value) / 10 ** FIXED // USD per whole token
  priceCache.set(asset, { price, ts: Date.now() })
  return price
}

async function getCollateral(aToken, decimals, user) {
  const [aa, an] = aToken.split('.')
  const b = unwrap(await read(aa, an, 'get-balance', [pcv(user)]))
  if (b.err) return 0
  return Number(b.value) / 10 ** decimals
}

async function getDebt(asset, decimals, user) {
  const ud = await read(POOL, POOL_NAME, 'get-user-reserve-data', [pcv(user), pcv(asset)])
  if (ud.err) return { debt: 0, useAsCollateral: false }
  return {
    debt: Number(ud.value['principal-borrow-balance'].value) / 10 ** decimals,
    useAsCollateral: ud.value['use-as-collateral'].value,
  }
}

// Aave-style: HF = Σ(collateralUSD · liqThreshold) / Σ(debtUSD)
export async function getZestAccount(wallet) {
  const assets = await getAssets()
  let weightedCollateralUSD = 0
  let collateralUSD = 0
  let debtUSD = 0
  const collateralRows = []
  const debtRows = []
  let sbtcAmount = 0
  let sbtcLT = 0.75

  for (const asset of assets) {
    const cfg = await getReserve(asset)
    if (!cfg) continue
    const collateral = await getCollateral(cfg.aToken, cfg.decimals, wallet)
    const { debt, useAsCollateral } = await getDebt(asset, cfg.decimals, wallet)
    if (collateral === 0 && debt === 0) continue
    const price = await getPrice(cfg.oracle, asset)
    if (price === null) continue

    const cUSD = collateral * price
    const dUSD = debt * price
    if (useAsCollateral && cfg.collateralEnabled) weightedCollateralUSD += cUSD * cfg.liqThreshold
    collateralUSD += cUSD
    debtUSD += dUSD
    if (collateral > 0) collateralRows.push({ symbol: cfg.symbol, amount: collateral, usd: cUSD })
    if (debt > 0) debtRows.push({ symbol: cfg.symbol, amount: debt, usd: dUSD })
    if (cfg.symbol.toLowerCase().includes('sbtc')) { sbtcAmount = collateral; sbtcLT = cfg.liqThreshold }
  }

  const hasPosition = collateralRows.length > 0 || debtRows.length > 0
  const hf = debtUSD > 0 ? weightedCollateralUSD / debtUSD : null // null = no debt (∞)
  // Liquidation price is only well-defined when sBTC is the sole collateral.
  const sbtcOnly = collateralRows.length === 1 && collateralRows[0].symbol.toLowerCase().includes('sbtc')
  const liqPrice = debtUSD > 0 && sbtcOnly && sbtcAmount > 0 ? debtUSD / (sbtcAmount * sbtcLT) : null

  return { wallet, hasPosition, hf, collateralUSD, debtUSD, collateralRows, debtRows, liqPrice }
}
