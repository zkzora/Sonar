import { NextResponse } from 'next/server'

// app.sonaragent.xyz/ → serve the dashboard (/dashboard) at the subdomain root.
// Only runs on the root path (see matcher), so /api/* and /_next/* are untouched
// and the dashboard's live data calls keep working.
export function proxy(request) {
  const host = (request.headers.get('host') || '').split(':')[0]
  if (host === 'app.sonaragent.xyz') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}
