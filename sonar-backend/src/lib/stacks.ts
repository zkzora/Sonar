// src/lib/stacks.ts
// Single source of truth for Sonar's Zest v2 read + health-factor computation
// (Stacks mainnet). This is the EXACT logic validated in
// prototype-health-factor.mjs and previously in app/lib/zest.js — both the
// Next.js dashboard route and the standalone Telegram backend import from here.
//
// Read-only: only read-only Clarity `call-read` requests are ever made. No keys,
// no signing, no transactions.

import { hexToCV, cvToJSON, principalCV, serializeCV } from '@stacks/transactions'

const HIRO = process.env.HIRO_API_URL || 'https://api.hiro.so'
const POOL = 'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N'
const POOL_NAME = 'pool-borrow-v2-3'
const FIXED = 8 // Zest fixed-point: thresholds + oracle prices use 8 decimals
const DEFAULT_SBTC_LT = 0.75 // liquidation-threshold fallback for sBTC

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const pcv = (p: string) => '0x' + serializeCV(principalCV(p))
// Peel one (response …) / (optional …) layer off a cvToJSON node.
const unwrap = (cv: any) => (cv && cv.value && cv.value.value !== undefined ? cv.value : cv)

// Optional Hiro API key (set HIRO_API_KEY in the env) raises the rate limit.
const HIRO_KEY = process.env.HIRO_API_KEY

async function read(addr: string, name: string, fn: string, args: string[]): Promise<any> {
  await sleep(120) // pace anonymous Hiro calls
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (HIRO_KEY) headers['x-api-key'] = HIRO_KEY
  const res = await fetch(`${HIRO}/v2/contracts/call-read/${addr}/${name}/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sender: POOL, arguments: args }),
  })
  // Hiro returns the rate-limit message as plain text (not JSON), so read text first.
  const text = await res.text()
  if (res.status === 429 || /rate limit/i.test(text)) throw new Error('Hiro rate limit')
  let data: any
  try { data = JSON.parse(text) } catch { throw new Error('Unexpected response from Hiro API') }
  if (!data.okay) return { err: data.cause || 'read failed' }
  return cvToJSON(hexToCV(data.result))
}

// ── module-level caches (persist across requests on a warm server) ──
let assetsCache: string[] | null = null
const reserveCache = new Map<string, { cfg: ReserveConfig; ts: number }>() // asset -> { cfg, ts }
const priceCache = new Map<string, { price: number; ts: number }>()         // asset -> { price, ts }
const RES_TTL = 5 * 60_000
const PRICE_TTL = 30_000

interface ReserveConfig {
  symbol: string
  decimals: number
  liqThreshold: number
  oracle: string
  aToken: string
  collateralEnabled: boolean
}

async function getAssets(): Promise<string[]> {
  if (assetsCache) return assetsCache
  const r = await read(POOL, POOL_NAME, 'get-assets', [])
  if (r.err) throw new Error('get-assets failed')
  assetsCache = r.value.map((a: any) => a.value)
  return assetsCache!
}

async function getReserve(asset: string): Promise<ReserveConfig | null> {
  const c = reserveCache.get(asset)
  if (c && Date.now() - c.ts < RES_TTL) return c.cfg
  const rs = unwrap(await read(POOL, POOL_NAME, 'get-reserve-state', [pcv(asset)]))
  if (rs.err) return null
  const r = rs.value
  const cfg: ReserveConfig = {
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

async function getPrice(oracle: string, asset: string): Promise<number | null> {
  const c = priceCache.get(asset)
  if (c && Date.now() - c.ts < PRICE_TTL) return c.price
  const [oa, on] = oracle.split('.')
  const p = unwrap(await read(oa, on, 'get-price', [pcv(asset)]))
  if (p.err || p.value === undefined) return null
  const price = Number(p.value) / 10 ** FIXED // USD per whole token
  priceCache.set(asset, { price, ts: Date.now() })
  return price
}

async function getCollateral(aToken: string, decimals: number, user: string): Promise<number> {
  const [aa, an] = aToken.split('.')
  const b = unwrap(await read(aa, an, 'get-balance', [pcv(user)]))
  if (b.err) return 0
  return Number(b.value) / 10 ** decimals
}

async function getDebt(asset: string, decimals: number, user: string): Promise<{ debt: number; useAsCollateral: boolean }> {
  const ud = await read(POOL, POOL_NAME, 'get-user-reserve-data', [pcv(user), pcv(asset)])
  if (ud.err) return { debt: 0, useAsCollateral: false }
  return {
    debt: Number(ud.value['principal-borrow-balance'].value) / 10 ** decimals,
    useAsCollateral: ud.value['use-as-collateral'].value,
  }
}

// Rich account shape consumed by the Next.js dashboard route. The dashboard
// depends on `hf === null` meaning "no debt (∞)" — keep that contract intact.
export interface ZestAccount {
  wallet: string
  hasPosition: boolean
  hf: number | null
  collateralUSD: number
  debtUSD: number
  collateralRows: { symbol: string; amount: number; usd: number }[]
  debtRows: { symbol: string; amount: number; usd: number }[]
  liqPrice: number | null
  // extra fields (additive — dashboard ignores them, backend uses them)
  sbtcPriceUSD: number
  sbtcLT: number
}

// Aave-style: HF = Σ(collateralUSD · liqThreshold) / Σ(debtUSD)
export async function getZestAccount(wallet: string): Promise<ZestAccount> {
  const assets = await getAssets()
  let weightedCollateralUSD = 0
  let collateralUSD = 0
  let debtUSD = 0
  const collateralRows: ZestAccount['collateralRows'] = []
  const debtRows: ZestAccount['debtRows'] = []
  let sbtcAmount = 0
  let sbtcLT = DEFAULT_SBTC_LT
  let sbtcPriceUSD = 0

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
    if (cfg.symbol.toLowerCase().includes('sbtc')) { sbtcAmount = collateral; sbtcLT = cfg.liqThreshold; sbtcPriceUSD = price }
  }

  // sBTC price is needed for alert copy even when the wallet holds no sBTC yet —
  // fetch it directly from its reserve/oracle if we didn't pick it up above.
  if (sbtcPriceUSD === 0) {
    const sbtcAsset = assets.find((a) => a.toLowerCase().includes('sbtc'))
    if (sbtcAsset) {
      const cfg = await getReserve(sbtcAsset)
      if (cfg) {
        sbtcLT = cfg.liqThreshold
        const p = await getPrice(cfg.oracle, sbtcAsset)
        if (p !== null) sbtcPriceUSD = p
      }
    }
  }

  const hasPosition = collateralRows.length > 0 || debtRows.length > 0
  const hf = debtUSD > 0 ? weightedCollateralUSD / debtUSD : null // null = no debt (∞)
  // Liquidation price is only well-defined when sBTC is the sole collateral.
  const sbtcOnly = collateralRows.length === 1 && collateralRows[0].symbol.toLowerCase().includes('sbtc')
  const liqPrice = debtUSD > 0 && sbtcOnly && sbtcAmount > 0 ? debtUSD / (sbtcAmount * sbtcLT) : null

  return { wallet, hasPosition, hf, collateralUSD, debtUSD, collateralRows, debtRows, liqPrice, sbtcPriceUSD, sbtcLT }
}

// Framework-agnostic position used by the Telegram backend.
// healthFactor is Infinity when there is no debt.
export interface Position {
  address: string
  collateralUSD: number
  debtUSD: number
  healthFactor: number // Infinity when debt = 0
  sbtcPriceUSD: number
  liqThreshold: number
  syncedAt: number
}

export async function getPosition(address: string): Promise<Position> {
  const acc = await getZestAccount(address)
  return {
    address,
    collateralUSD: acc.collateralUSD,
    debtUSD: acc.debtUSD,
    healthFactor: acc.debtUSD > 0 ? (acc.hf as number) : Infinity,
    sbtcPriceUSD: acc.sbtcPriceUSD,
    liqThreshold: acc.sbtcLT,
    syncedAt: Date.now(),
  }
}

// Validate a Stacks principal (mainnet SP…/SM…). Uses the same c32-checked
// decoder the rest of the stack relies on — address only, never keys.
export function isValidStacksAddress(addr: string): boolean {
  try { principalCV(addr); return true } catch { return false }
}
