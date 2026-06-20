/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // app.sonaragent.xyz/  →  serve the dashboard at the subdomain root.
        // Only the root path is rewritten; /api/* and /_next/* pass through,
        // so the dashboard's live data calls keep working.
        source: '/',
        has: [{ type: 'host', value: 'app.sonaragent.xyz' }],
        destination: '/dashboard',
      },
    ]
  },
}
module.exports = nextConfig
