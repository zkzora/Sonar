// app/lib/zest.js
// DEPRECATED shim — the Zest read + health-factor logic now lives in the
// framework-agnostic single source of truth at src/lib/stacks.ts, shared by
// both the dashboard API route and the standalone Telegram backend.
// Re-exported here only for backward compatibility with older imports.

export { getZestAccount, getPosition, isValidStacksAddress } from '../../src/lib/stacks'
