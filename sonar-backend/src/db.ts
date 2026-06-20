// src/db.ts
// better-sqlite3 persistence for watched wallets. One row per (chat_id, address).
// Stores ONLY a public Stacks address + Telegram chat id — never keys.

import Database from 'better-sqlite3'
import { config } from './config.js'

export type Level = 'SAFE' | 'WATCH' | 'DANGER' | 'CRITICAL'

export interface Watch {
  chat_id: number
  address: string
  label: string | null
  last_level: Level | ''
  last_alert_at: number
  created_at: number
}

const db = new Database(config.dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS watches (
    chat_id       INTEGER NOT NULL,
    address       TEXT    NOT NULL,
    label         TEXT,
    last_level    TEXT,
    last_alert_at INTEGER,
    created_at    INTEGER,
    PRIMARY KEY (chat_id, address)
  )
`)

const stmts = {
  insert: db.prepare(
    `INSERT INTO watches (chat_id, address, label, last_level, last_alert_at, created_at)
     VALUES (@chat_id, @address, @label, @last_level, @last_alert_at, @created_at)
     ON CONFLICT(chat_id, address) DO UPDATE SET
       label = excluded.label,
       last_level = excluded.last_level,
       last_alert_at = excluded.last_alert_at`
  ),
  delete: db.prepare(`DELETE FROM watches WHERE chat_id = ? AND address = ?`),
  getOne: db.prepare(`SELECT * FROM watches WHERE chat_id = ? AND address = ?`),
  listForChat: db.prepare(`SELECT * FROM watches WHERE chat_id = ? ORDER BY created_at ASC`),
  listAll: db.prepare(`SELECT * FROM watches ORDER BY chat_id, created_at ASC`),
  updateState: db.prepare(
    `UPDATE watches SET last_level = ?, last_alert_at = ? WHERE chat_id = ? AND address = ?`
  ),
}

/** Add (or update) a watch. Returns false if it already existed (idempotent upsert). */
export function addWatch(
  chat_id: number,
  address: string,
  label: string | null,
  level: Level | '',
  now: number
): { created: boolean } {
  const existing = stmts.getOne.get(chat_id, address) as Watch | undefined
  stmts.insert.run({
    chat_id,
    address,
    label: label ?? (existing?.label ?? null),
    last_level: level,
    last_alert_at: now,
    created_at: existing?.created_at ?? now,
  })
  return { created: !existing }
}

export function removeWatch(chat_id: number, address: string): boolean {
  return stmts.delete.run(chat_id, address).changes > 0
}

export function getWatch(chat_id: number, address: string): Watch | undefined {
  return stmts.getOne.get(chat_id, address) as Watch | undefined
}

export function listWatches(chat_id: number): Watch[] {
  return stmts.listForChat.all(chat_id) as Watch[]
}

export function allWatches(): Watch[] {
  return stmts.listAll.all() as Watch[]
}

export function setState(chat_id: number, address: string, level: Level, alertAt: number): void {
  stmts.updateState.run(level, alertAt, chat_id, address)
}

export default db
