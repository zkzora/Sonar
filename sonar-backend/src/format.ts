// src/format.ts
// Health-factor level classification + all user-facing copy.
// Copy rules: "best-effort monitoring", never "guarantee"; explain WHY HF moved
// and WHAT reduces risk; Sonar alerts, it never acts for the user.

import type { Position } from './lib/stacks.js'
import type { Thresholds } from './config.js'
import type { Level, Watch } from './db.js'

export const DISCLAIMER =
  'Best-effort monitoring — Sonar alerts, it doesn’t act for you. Manage your position in your own wallet.'

const SEVERITY: Record<Level, number> = { SAFE: 0, WATCH: 1, DANGER: 2, CRITICAL: 3 }

/** Severity rank. Unknown/empty last_level is treated as SAFE (baseline). */
export function severity(level: Level | ''): number {
  return level === '' ? SEVERITY.SAFE : SEVERITY[level]
}

/** Map a health factor to a level using env-configurable thresholds. */
export function classify(healthFactor: number, t: Thresholds): Level {
  if (!Number.isFinite(healthFactor)) return 'SAFE' // no debt -> ∞
  if (healthFactor > t.watch) return 'SAFE'
  if (healthFactor > t.danger) return 'WATCH'
  if (healthFactor > t.critical) return 'DANGER'
  return 'CRITICAL'
}

// ── small formatters ──
export function shortAddr(a: string): string {
  return a.length <= 12 ? a : `${a.slice(0, 4)}…${a.slice(-4)}`
}
const usd = (n: number) =>
  '$' + (n >= 1000 ? Math.round(n).toLocaleString('en-US') : n.toLocaleString('en-US', { maximumFractionDigits: 2 }))
const hfStr = (hf: number) => (Number.isFinite(hf) ? hf.toFixed(2) : '∞')
const namePrefix = (w: { label?: string | null; address: string }) =>
  w.label ? `${w.label} (${shortAddr(w.address)})` : shortAddr(w.address)

function sbtcLine(pos: Position): string {
  return `sBTC: ${usd(pos.collateralUSD)} collateral · ${usd(pos.debtUSD)} debt · liq threshold ${pos.liqThreshold}`
}

// Why did HF move? Uses the previous reading when we have one.
function whyLine(level: Level, pos: Position, prev?: PrevSnapshot): string {
  if (prev && prev.sbtcPriceUSD > 0 && pos.sbtcPriceUSD > 0 && prev.sbtcPriceUSD !== pos.sbtcPriceUSD) {
    const verb = pos.sbtcPriceUSD < prev.sbtcPriceUSD ? 'fell' : 'rose'
    return `HF ${pos.sbtcPriceUSD < prev.sbtcPriceUSD ? 'dropped' : 'moved'} as sBTC ${verb} from ${usd(prev.sbtcPriceUSD)} to ${usd(pos.sbtcPriceUSD)}.`
  }
  return `HF moved into the ${level} range (live sBTC ${usd(pos.sbtcPriceUSD)}).`
}

function headroomLine(pos: Position): string {
  const pct = Math.max(0, (pos.healthFactor - 1) * 100)
  return `You’re ~${pct.toFixed(0)}% above liquidation (HF 1.0).`
}

export interface PrevSnapshot {
  healthFactor: number
  sbtcPriceUSD: number
}

const HEADER: Record<Exclude<Level, 'SAFE'>, string> = {
  WATCH: '\u{1F440} Sonar — heads up, health factor slipping',
  DANGER: '⚠️ Sonar — position at risk',
  CRITICAL: '\u{1F6A8} Sonar — CRITICAL: liquidation risk',
}

/** Worsening / critical-repeat alert for a WATCH|DANGER|CRITICAL level. */
export function formatAlert(
  level: Exclude<Level, 'SAFE'>,
  pos: Position,
  watch: { label?: string | null; address: string },
  prev?: PrevSnapshot
): string {
  const wasStr = prev ? ` (was ${hfStr(prev.healthFactor)})` : ''
  const action =
    level === 'CRITICAL'
      ? 'Repay debt or add sBTC collateral now — at HF 1.0 the position can be liquidated.'
      : 'Repay debt or add sBTC collateral to restore headroom.'

  return [
    HEADER[level],
    `Wallet: ${namePrefix(watch)}`,
    `Health factor: ${hfStr(pos.healthFactor)}${wasStr}`,
    sbtcLine(pos),
    '',
    `${whyLine(level, pos, prev)} ${headroomLine(pos)}`,
    action,
    '',
    DISCLAIMER,
  ].join('\n')
}

/** One-time "back in safe range" recovery message. */
export function formatRecovery(
  pos: Position,
  watch: { label?: string | null; address: string },
  watchThreshold: number,
  prev?: PrevSnapshot
): string {
  const wasStr = prev ? ` (was ${hfStr(prev.healthFactor)})` : ''
  return [
    '✅ Sonar — back in safe range',
    `Wallet: ${namePrefix(watch)}`,
    `Health factor: ${hfStr(pos.healthFactor)}${wasStr}`,
    `Recovered above your watch level (HF ${watchThreshold}). ${sbtcLine(pos)}.`,
    '',
    DISCLAIMER,
  ].join('\n')
}

/** Neutral live snapshot for /watch, /status replies. */
export function formatSnapshot(pos: Position, level: Level, label?: string | null): string {
  const head = label ? `${label} (${shortAddr(pos.address)})` : shortAddr(pos.address)
  const hfLine = Number.isFinite(pos.healthFactor)
    ? `Health factor: ${hfStr(pos.healthFactor)} — ${level}`
    : 'Health factor: ∞ (no debt — not at liquidation risk)'
  return [
    `\u{1F4E1} ${head}`,
    hfLine,
    sbtcLine(pos),
    `sBTC price: ${usd(pos.sbtcPriceUSD)} · synced ${new Date(pos.syncedAt).toISOString().slice(11, 19)} UTC`,
    '',
    DISCLAIMER,
  ].join('\n')
}

/** Compact line for /list. */
export function formatListRow(w: Watch, level: Level | '?'): string {
  return `• ${namePrefix(w)} — ${level || w.last_level || 'pending'}`
}
