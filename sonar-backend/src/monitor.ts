// src/monitor.ts
// Polling loop + alert state machine.
//
// Anti-spam contract:
//   - last_level (in DB) = the level we last ALERTED at.
//   - prevSnapshot (in memory) = the most recent READING, for "(was X)" deltas.
// We message ONLY when the level worsens vs the last alerted level, recovers to
// SAFE from a worse level (once), or stays CRITICAL past the repeat window.

import { config } from './config.js'
import { allWatches, setState, type Level } from './db.js'
import { getPosition, type Position } from './lib/stacks.js'
import { classify, severity, formatAlert, formatRecovery, type PrevSnapshot } from './format.js'

export interface Sender {
  sendMessage(chatId: number, text: string): Promise<unknown>
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const prevSnapshots = new Map<string, PrevSnapshot>() // `${chat_id}:${address}` -> last reading
const key = (chatId: number, address: string) => `${chatId}:${address}`

/** Decide whether to alert and produce the message. Pure given inputs. */
export function decide(
  level: Level,
  lastLevel: Level | '',
  lastAlertAt: number,
  now: number,
  pos: Position,
  watch: { label?: string | null; address: string },
  prev: PrevSnapshot | undefined
): { send: boolean; text?: string } {
  const repeatMs = config.criticalRepeatMin * 60_000

  // (a) level worsens vs the last alerted level
  if (level !== 'SAFE' && severity(level) > severity(lastLevel)) {
    return { send: true, text: formatAlert(level, pos, watch, prev) }
  }
  // (b) recovered to SAFE from a worse level — one message
  if (level === 'SAFE' && severity(lastLevel) > severity('SAFE')) {
    return { send: true, text: formatRecovery(pos, watch, config.thresholds.watch, prev) }
  }
  // (c) still CRITICAL and the repeat window has elapsed
  if (level === 'CRITICAL' && now - lastAlertAt >= repeatMs) {
    return { send: true, text: formatAlert('CRITICAL', pos, watch, prev) }
  }
  return { send: false }
}

/** Run one full poll cycle across every watched wallet. */
export async function pollOnce(sender: Sender): Promise<void> {
  const watches = allWatches()
  for (const w of watches) {
    try {
      const pos = await getPosition(w.address)
      const level = classify(pos.healthFactor, config.thresholds)
      const now = Date.now()
      const prev = prevSnapshots.get(key(w.chat_id, w.address))

      const { send, text } = decide(level, w.last_level, w.last_alert_at, now, pos, w, prev)
      if (send && text) {
        await sender.sendMessage(w.chat_id, text)
        setState(w.chat_id, w.address, level, now)
      }

      // Track the latest reading for the next cycle's delta, regardless of send.
      prevSnapshots.set(key(w.chat_id, w.address), {
        healthFactor: pos.healthFactor,
        sbtcPriceUSD: pos.sbtcPriceUSD,
      })
    } catch (e: any) {
      // One bad read must never kill the loop.
      console.error(`[monitor] read failed for ${w.address} (chat ${w.chat_id}): ${e?.message || e}`)
    }
    await sleep(500) // pace between wallets on top of stacks.ts's per-call pacing
  }
}

/** Start the continuous loop. Returns a stop() function. */
export function startMonitor(sender: Sender): () => void {
  const intervalMs = config.pollIntervalSec * 1000
  let running = false
  let stopped = false

  const tick = async () => {
    if (running || stopped) return
    running = true
    try {
      await pollOnce(sender)
    } catch (e: any) {
      console.error('[monitor] cycle error:', e?.message || e)
    } finally {
      running = false
    }
  }

  console.log(`[monitor] polling every ${config.pollIntervalSec}s · thresholds`,
    config.thresholds, `· critical repeat ${config.criticalRepeatMin}m`)
  void tick() // run immediately on boot
  const handle = setInterval(tick, intervalMs)
  return () => { stopped = true; clearInterval(handle) }
}
