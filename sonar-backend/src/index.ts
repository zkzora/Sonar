// src/index.ts
// Boot: validate config, start the bot (long-polling) and the monitor loop.

import { config, assertConfig } from './config.js'
import { buildBot } from './bot.js'
import { startMonitor } from './monitor.js'

async function main() {
  assertConfig()

  const bot = buildBot()
  // The monitor sends via the same Telegram client (no webhook needed).
  const stopMonitor = startMonitor({
    sendMessage: (chatId, text) => bot.telegram.sendMessage(chatId, text),
  })

  // Long-polling: no public webhook required (good for a worker dyno).
  bot.launch(() => console.log('[bot] Sonar online (long-polling).'))

  const shutdown = (sig: string) => {
    console.log(`\n[shutdown] ${sig} — stopping…`)
    stopMonitor()
    bot.stop(sig)
    process.exit(0)
  }
  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))

  console.log(`[boot] Sonar backend up · poll ${config.pollIntervalSec}s · db ${config.dbPath}`)
}

main().catch((e) => {
  console.error('[fatal]', e?.message || e)
  process.exit(1)
})
