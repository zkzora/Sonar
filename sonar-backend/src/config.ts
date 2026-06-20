// src/config.ts
// Central, validated config loaded from the environment (.env via dotenv).

import 'dotenv/config'

function num(name: string, def: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') return def
  const n = Number(raw)
  if (!Number.isFinite(n)) throw new Error(`Env ${name} must be a number, got "${raw}"`)
  return n
}

export interface Thresholds {
  watch: number    // HF > watch        -> SAFE
  danger: number   // danger < HF <= watch  -> WATCH
  critical: number // critical < HF <= danger -> DANGER ; HF <= critical -> CRITICAL
}

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  hiroApiUrl: process.env.HIRO_API_URL || 'https://api.hiro.so',
  pollIntervalSec: num('POLL_INTERVAL_SEC', 120),
  criticalRepeatMin: num('CRITICAL_REPEAT_MIN', 30),
  dbPath: process.env.DB_PATH || './sonar.db',
  thresholds: {
    watch: num('HF_WATCH', 1.5),
    danger: num('HF_DANGER', 1.2),
    critical: num('HF_CRITICAL', 1.05),
  } as Thresholds,
}

export function assertConfig(): void {
  if (!config.telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is required — set it in .env (get one from @BotFather).')
  }
  const { watch, danger, critical } = config.thresholds
  if (!(watch > danger && danger > critical && critical > 1)) {
    throw new Error(
      `Threshold ordering invalid: require HF_WATCH > HF_DANGER > HF_CRITICAL > 1 ` +
      `(got watch=${watch}, danger=${danger}, critical=${critical}).`
    )
  }
}
