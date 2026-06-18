// prototype-health-factor.mjs
// Sonar — Health Factor Prototype (standalone, no frontend)
//
// Pulls REAL on-chain data from Zest Protocol v2 on Stacks mainnet:
//   1. Reserve config (liquidation threshold, decimals) per asset
//   2. The user's collateral (aToken balance) and debt (borrow balance)
//   3. The live oracle price for each asset
// then computes the Aave-style health factor and prints it.
//
// Run:  node prototype-health-factor.mjs [STACKS_ADDRESS]
// Deps: @stacks/transactions  (for Clarity encode/decode)

import { hexToCV, cvToJSON, principalCV, serializeCV } from '@stacks/transactions';

const HIRO = 'https://api.hiro.so';
const POOL = 'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N';
const POOL_NAME = 'pool-borrow-v2-3';
const FIXED = 8; // Zest fixed-point: thresholds and oracle prices use 8 decimals

// Default to a real Zest user that holds on-chain sBTC collateral.
const USER = process.argv[2] || 'SP2GHQRCRMYY4S8PMBR49BEKX144VR437YT42SF3B';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pcv = (p) => '0x' + serializeCV(principalCV(p));
const fmtUSD = (n) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });

// Paced read-only call (no API key → respect Hiro's per-minute limit).
async function read(addr, name, fn, args) {
  await sleep(180);
  const url = `${HIRO}/v2/contracts/call-read/${addr}/${name}/${fn}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: POOL, arguments: args }),
  });
  const data = await res.json();
  if (!data.okay) return { err: data.cause || JSON.stringify(data) };
  return cvToJSON(hexToCV(data.result));
}

// Unwrap a (response ok err) or (optional) wrapper down to the inner cvToJSON node.
const unwrap = (cv) => (cv && cv.value && cv.value.value !== undefined ? cv.value : cv);

async function reserveConfig(asset) {
  const rs = unwrap(await read(POOL, POOL_NAME, 'get-reserve-state', [pcv(asset)]));
  if (rs.err) return null;
  const r = rs.value;
  return {
    decimals: Number(r.decimals.value),
    liqThreshold: Number(r['liquidation-threshold'].value) / 10 ** FIXED, // e.g. 0.75
    oracle: r.oracle.value,
    aToken: r['a-token-address'].value,
    collateralEnabled: r['usage-as-collateral-enabled'].value,
  };
}

async function oraclePriceUSD(oracle, asset) {
  const [oa, on] = oracle.split('.');
  const p = unwrap(await read(oa, on, 'get-price', [pcv(asset)]));
  if (p.err || p.value === undefined) return null;
  return Number(p.value.value ?? p.value) / 10 ** FIXED; // USD per whole token
}

async function userCollateral(aToken, decimals) {
  const [aa, an] = aToken.split('.');
  const b = unwrap(await read(aa, an, 'get-balance', [pcv(USER)]));
  if (b.err) return 0;
  return Number(b.value.value ?? b.value) / 10 ** decimals; // token units
}

async function userDebt(asset, decimals) {
  const ud = await read(POOL, POOL_NAME, 'get-user-reserve-data', [pcv(USER), pcv(asset)]);
  if (ud.err) return { debt: 0, useAsCollateral: false };
  return {
    debt: Number(ud.value['principal-borrow-balance'].value) / 10 ** decimals,
    useAsCollateral: ud.value['use-as-collateral'].value,
  };
}

// HF = Σ(collateralUSD · liqThreshold) / Σ(debtUSD)
async function computeHealthFactor() {
  console.log('=== SONAR — HEALTH FACTOR PROTOTYPE ===');
  console.log(`Pool : ${POOL}.${POOL_NAME}`);
  console.log(`User : ${USER}`);
  console.log('---------------------------------------');

  const assets = (await read(POOL, POOL_NAME, 'get-assets', [])).value.map((a) => a.value);

  let weightedCollateralUSD = 0;
  let totalDebtUSD = 0;
  const rows = [];

  for (const asset of assets) {
    const cfg = await reserveConfig(asset);
    if (!cfg) continue;

    const collateral = await userCollateral(cfg.aToken, cfg.decimals);
    const { debt, useAsCollateral } = await userDebt(asset, cfg.decimals);
    if (collateral === 0 && debt === 0) continue; // skip empty reserves

    const price = await oraclePriceUSD(cfg.oracle, asset);
    if (price === null) { console.log(`  ! no oracle price for ${asset.split('.')[1]}, skipped`); continue; }

    const collateralUSD = collateral * price;
    const debtUSD = debt * price;
    if (useAsCollateral && cfg.collateralEnabled) weightedCollateralUSD += collateralUSD * cfg.liqThreshold;
    totalDebtUSD += debtUSD;

    rows.push({ sym: asset.split('.')[1], price, collateral, collateralUSD, debt, debtUSD, lt: cfg.liqThreshold });
  }

  console.log('\nPOSITION BREAKDOWN (live):');
  if (rows.length === 0) {
    console.log('  (no collateral or debt found for this user)');
  } else {
    for (const r of rows) {
      console.log(`  ${r.sym.padEnd(16)} price=${fmtUSD(r.price)}  collateral=${r.collateral} (${fmtUSD(r.collateralUSD)})  debt=${r.debt} (${fmtUSD(r.debtUSD)})  LT=${r.lt}`);
    }
  }

  console.log('\nTOTALS:');
  console.log(`  Liquidation-weighted collateral : ${fmtUSD(weightedCollateralUSD)}`);
  console.log(`  Total debt                      : ${fmtUSD(totalDebtUSD)}`);

  const hf = totalDebtUSD > 0 ? weightedCollateralUSD / totalDebtUSD : Infinity;
  console.log('\n>>> HEALTH FACTOR:', totalDebtUSD > 0 ? hf.toFixed(4) : '∞ (no debt — not at liquidation risk)');
  if (totalDebtUSD > 0) console.log('    Status:', hf >= 1.5 ? 'SAFE' : hf >= 1.1 ? 'CAUTION' : hf > 1.0 ? 'APPROACHING' : 'LIQUIDATABLE');

  // Worked example: apply the REAL sBTC liquidation threshold + REAL oracle
  // price to a sample position, so the finite-HF math Sonar monitors is visible.
  const sbtc = assets.find((a) => a.toLowerCase().includes('sbtc'));
  const cfg = await reserveConfig(sbtc);
  const price = await oraclePriceUSD(cfg.oracle, sbtc);
  const exCollateral = 0.5;                 // sample: 0.5 sBTC supplied
  const exDebt = 21000;                      // sample: $21,000 stablecoin borrowed
  const exWeighted = exCollateral * price * cfg.liqThreshold;
  const exHF = exWeighted / exDebt;
  const liqPrice = exDebt / (exCollateral * cfg.liqThreshold); // price where HF hits 1.0

  console.log('\n--- WORKED EXAMPLE (real sBTC price + real LT, sample balances) ---');
  console.log(`  sBTC price (live)      : ${fmtUSD(price)}`);
  console.log(`  Liquidation threshold  : ${cfg.liqThreshold}`);
  console.log(`  Collateral             : ${exCollateral} sBTC (${fmtUSD(exCollateral * price)})`);
  console.log(`  Debt                   : ${fmtUSD(exDebt)}`);
  console.log(`  Health factor          : ${exHF.toFixed(4)}  (${exHF >= 1.1 ? 'CAUTION' : 'APPROACHING'})`);
  console.log(`  Liquidation price      : ${fmtUSD(liqPrice)}  (sBTC price at which HF = 1.00)`);
}

computeHealthFactor().catch((e) => {
  console.log('\n❌ ERROR:', e.message);
  if (/rate limit/i.test(e.message)) console.log('   Hiro per-minute limit hit — wait 60s and retry, or add an API key.');
});
