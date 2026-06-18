// app/api/positions/route.js
// GET /api/positions?wallet=SP...  → live Zest health-factor for a wallet.

import { NextResponse } from 'next/server'
import { principalCV } from '@stacks/transactions'
import { getZestAccount } from '../../lib/zest'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isValidStacksAddress(addr) {
  try { principalCV(addr); return true } catch { return false }
}

export async function GET(request) {
  const wallet = request.nextUrl.searchParams.get('wallet')?.trim()
  if (!wallet || !isValidStacksAddress(wallet)) {
    return NextResponse.json({ error: 'Invalid Stacks address' }, { status: 400 })
  }
  try {
    const account = await getZestAccount(wallet)
    return NextResponse.json(account)
  } catch (e) {
    const rateLimited = /rate limit/i.test(e.message || '')
    return NextResponse.json(
      { error: rateLimited ? 'Hiro rate limit reached — try again shortly' : 'Failed to read on-chain data' },
      { status: 502 }
    )
  }
}
