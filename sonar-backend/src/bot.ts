// src/bot.ts
// Telegraf bot: command handlers for managing watches and on-demand reads.
// HARD RULE: address only. Never request, store, or accept keys/seed phrases.

import { Telegraf } from 'telegraf'
import { config } from './config.js'
import { addWatch, removeWatch, listWatches, type Level } from './db.js'
import { getPosition, isValidStacksAddress } from './lib/stacks.js'
import { classify, formatSnapshot, formatListRow, shortAddr, DISCLAIMER } from './format.js'

// Heuristic seed-phrase / private-key detector. We never want this text stored.
function looksLikeSecret(text: string): boolean {
  const t = text.trim()
  // 12+ lowercase word tokens in a row → likely a BIP39 mnemonic
  const words = t.split(/\s+/)
  const wordy = words.filter((w) => /^[a-z]{3,}$/.test(w))
  if (wordy.length >= 12) return true
  // long hex string → likely a raw private key
  if (/\b[0-9a-fA-F]{64,}\b/.test(t)) return true
  return false
}

const SAFETY_WARNING =
  '🛑 Stop — that looks like a seed phrase or private key.\n\n' +
  'Sonar is non-custodial and read-only. It NEVER needs your keys and will never store them. ' +
  'Please send only a public Stacks wallet address (starts with SP…). ' +
  'If you pasted a real secret anywhere, move your funds to a new wallet.'

/** Validate + normalise the address argument from a command. */
function parseAddress(arg: string | undefined): string | null {
  if (!arg) return null
  const a = arg.trim()
  return isValidStacksAddress(a) ? a : null
}

export function buildBot(): Telegraf {
  const bot = new Telegraf(config.telegramBotToken)

  // Global guard: refuse anything that smells like a secret, never store it.
  bot.use(async (ctx, next) => {
    const text = (ctx.message as any)?.text
    if (typeof text === 'string' && looksLikeSecret(text)) {
      await ctx.reply(SAFETY_WARNING)
      return // do not proceed to any handler / storage
    }
    return next()
  })

  bot.start((ctx) =>
    ctx.reply(
      [
        '📡 Sonar — liquidation guardian for sBTC lending on Stacks (Zest).',
        '',
        'I watch your position’s health factor on-chain and message you BEFORE liquidation risk — best-effort monitoring, never a guarantee.',
        '',
        '🔒 Non-custodial & read-only: I only ever use your PUBLIC wallet address. I never ask for, store, or handle private keys or seed phrases, and I never send transactions. You act in your own wallet.',
        '',
        'Get started:',
        '/watch <stx-address> [label] — start monitoring a wallet',
        '/status <stx-address> — fresh health-factor read',
        '/list — your watched wallets',
        '/help — all commands',
      ].join('\n')
    )
  )

  bot.help((ctx) =>
    ctx.reply(
      [
        'Sonar commands:',
        '/watch <stx-address> [label] — start monitoring; replies with a live snapshot',
        '/unwatch <stx-address> — stop monitoring',
        '/list — your watched wallets + current level',
        '/status <stx-address> — on-demand fresh read + health factor',
        '/help — this message',
        '',
        DISCLAIMER,
      ].join('\n')
    )
  )

  bot.command('watch', async (ctx) => {
    const [, addrArg, ...labelParts] = ctx.message.text.split(/\s+/)
    const address = parseAddress(addrArg)
    if (!address) {
      return ctx.reply('Usage: /watch <stx-address> [label]\nSend a valid public Stacks address (starts with SP…).')
    }
    const label = labelParts.join(' ').slice(0, 40) || null

    await ctx.reply(`Reading ${shortAddr(address)} live from Zest v2 mainnet…`)
    try {
      const pos = await getPosition(address)
      const level: Level = classify(pos.healthFactor, config.thresholds)
      // Seed last_level with the current level so the loop doesn't immediately
      // re-alert what we just showed the user.
      const { created } = addWatch(ctx.chat.id, address, label, level, Date.now())
      await ctx.reply(
        (created ? '✅ Now watching this wallet.\n\n' : '✅ Watch updated.\n\n') +
          formatSnapshot(pos, level, label)
      )
    } catch (e: any) {
      const rate = /rate limit/i.test(e?.message || '')
      await ctx.reply(rate ? 'Hiro rate limit — try again in a moment.' : 'Could not read on-chain data for that address. Try again shortly.')
    }
  })

  bot.command('unwatch', async (ctx) => {
    const [, addrArg] = ctx.message.text.split(/\s+/)
    const address = parseAddress(addrArg)
    if (!address) return ctx.reply('Usage: /unwatch <stx-address>')
    const removed = removeWatch(ctx.chat.id, address)
    return ctx.reply(removed ? `Stopped watching ${shortAddr(address)}.` : 'That address isn’t on your watch list.')
  })

  bot.command('list', async (ctx) => {
    const rows = listWatches(ctx.chat.id)
    if (rows.length === 0) return ctx.reply('No wallets watched yet. Add one with /watch <stx-address> [label].')
    const lines = rows.map((w) => formatListRow(w, (w.last_level || '?') as Level | '?'))
    return ctx.reply(['Your watched wallets:', ...lines, '', 'Levels reflect the last alert sent. Use /status <address> for a fresh read.'].join('\n'))
  })

  bot.command('status', async (ctx) => {
    const [, addrArg] = ctx.message.text.split(/\s+/)
    const address = parseAddress(addrArg)
    if (!address) return ctx.reply('Usage: /status <stx-address>')
    await ctx.reply(`Reading ${shortAddr(address)} live from Zest v2 mainnet…`)
    try {
      const pos = await getPosition(address)
      const level = classify(pos.healthFactor, config.thresholds)
      return ctx.reply(formatSnapshot(pos, level))
    } catch (e: any) {
      const rate = /rate limit/i.test(e?.message || '')
      return ctx.reply(rate ? 'Hiro rate limit — try again in a moment.' : 'Could not read on-chain data for that address. Try again shortly.')
    }
  })

  return bot
}
