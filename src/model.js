/* Scoring engine v4. Pure functions, no React. Rationale and sources: docs/REVIEW-2026-11.md §4.
   All rates are % p.a. Real rates are the core; nominal = (1+real)(1+inflation)-1.
   Calibration values marked (J) are judgment calls, not estimated parameters. */

export const HORIZON = { min: 3, max: 30, default: 15 };

// Real anchor (% p.a., maintained unit, neutral factors) and downside risk multiplier per property type. (J)
// Long-run real anchor DE ~0–1 % p.a. (Knoll/Schularick/Steger 2017; BIS DE 1970–2025: +0.1 %, 2005–2025: +1.0 %).
export const PROPERTY_TYPES = {
  apartment_standard:    { anchor: 0.5, risk: 1.0 },
  apartment_renovated:   { anchor: 0.5, risk: 0.95 },
  apartment_unrenovated: { anchor: 0.2, risk: 1.15 },
  apartment_newbuild:    { anchor: 0.2, risk: 0.9 },  // premium erodes with age, but more stable in downturns (GREIX 2023)
  altbau_renovated:      { anchor: 0.6, risk: 0.95 },
  altbau_unrenovated:    { anchor: 0.2, risk: 1.15 },
  house_detached:        { anchor: 0.6, risk: 1.1 },  // high land share, lower liquidity
  house_semi:            { anchor: 0.5, risk: 1.05 },
};

// Factor effects, index 0–4 = score 1–5.
// dynamic: initial real tilt % p.a., decays with half-life (mean reversion ~5 y, Glaeser & Gyourko).
// static:  current state is largely priced in -> small tilt, mainly affects downside width (bear).
// level:   one-off price level shock in % (ECB 2022: +1 pp mortgage rate ≈ −5…−9 % prices), annualised over horizon.
export const FACTORS = [
  { key: "supplyDemand",      kind: "dynamic", tilt: [-1.5, -0.6, 0, 0.6, 1.2] },
  { key: "locationMomentum",  kind: "dynamic", tilt: [-1.0, -0.4, 0, 0.5, 1.0] },
  { key: "locationAmenities", kind: "static",  tilt: [-0.2, -0.1, 0, 0.1, 0.2], bear: [0.4, 0.2, 0, -0.1, -0.2] },
  { key: "propertyQuality",   kind: "static",  tilt: [-0.3, -0.1, 0, 0.1, 0.2], bear: [0.4, 0.2, 0, -0.1, -0.2] },
  { key: "regulatoryRisk",    kind: "dynamic", tilt: [-0.8, -0.3, 0, 0.2, 0.4] },
  { key: "interestOutlook",   kind: "level",   shock: [-12, -6, 0, 5, 9] },
];

const HALF_LIFE = 6;        // years (J)
const IDIO_SHOCK = 13;      // % one-off property-specific deviation at sale (Giacoletti 2021: 11–18 %)
const MARKET_VOL = 4.5;     // % annual city-level real price volatility (J, random walk = conservative)
const Z_P10 = 1.2816;       // bear/bull ≈ P10/P90
const DOWN_SKEW = 1.15;     // downside wider than upside (IMF house-prices-at-risk) (J)
const UP_SKEW = 0.9;
export const STRESS = { shock: -15, years: 2 }; // one-off real drop like Berlin 2022–24 (~−16…−18 % real)

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const r1 = x => Math.round(x * 10) / 10;

/** Average share of an initial tilt that survives over T years with exponential decay. */
export function decayShare(T) {
  const k = Math.LN2 / HALF_LIFE;
  return (1 - Math.exp(-k * T)) / (k * T);
}

/** Upside cap on total adjustment (pp p.a.): 3 pp at ≤5 y, 1.5 pp at ≥10 y. Downside cap is twice that. */
export function adjustmentCap(T) {
  return clamp(1.5 + (10 - T) * 0.3, 1.5, 3);
}

/** Base P10/P90 half-width in pp p.a. before skew/multipliers: one-off idiosyncratic shock + market random walk. */
export function bandWidth(T) {
  return Z_P10 * Math.sqrt((IDIO_SHOCK / T) ** 2 + MARKET_VOL ** 2 / T);
}

export const toNominal = (real, infl) => ((1 + real / 100) * (1 + infl / 100) - 1) * 100;

export function computeAppreciation(inputs) {
  const { inflation, propertyType, years } = inputs;
  const T = clamp(years ?? HORIZON.default, HORIZON.min, HORIZON.max);
  const type = PROPERTY_TYPES[propertyType] ?? PROPERTY_TYPES.apartment_standard;
  const decay = decayShare(T);

  let tilt = 0, bearAdj = 0;
  const breakdown = FACTORS.map(f => {
    const s = inputs[f.key];
    let effect;
    if (f.kind === "dynamic") effect = f.tilt[s - 1] * decay;
    else if (f.kind === "static") effect = f.tilt[s - 1];
    else effect = (Math.pow(1 + f.shock[s - 1] / 100, 1 / T) - 1) * 100;
    tilt += effect;
    if (f.bear) bearAdj += f.bear[s - 1];
    return { key: f.key, score: s, effect: r1(effect) };
  });

  const cap = adjustmentCap(T);
  const cappedTilt = clamp(tilt, -2 * cap, cap);
  const baseReal = type.anchor + cappedTilt;

  // Uncertainty multipliers (max ×1.5). Negative signals fatten the downside; positive and contradictory
  // signals widen the upside. Keeps bear monotonic: improving a factor never lowers the bear case.
  const scores = FACTORS.map(f => inputs[f.key]);
  const n = scores.length;
  const mean = scores.reduce((a, b) => a + b, 0) / n;
  const negExt = scores.reduce((a, s) => a + Math.max(0, 3 - s), 0) / n / 2;
  const posExt = scores.reduce((a, s) => a + Math.max(0, s - 3), 0) / n / 2;
  const disagreement = Math.sqrt(scores.reduce((a, s) => a + (s - mean) ** 2, 0) / n) / 2;
  const downMult = 1 + 0.5 * negExt;
  const upMult = 1 + 0.25 * posExt + 0.25 * disagreement;

  const w = bandWidth(T);
  const downRaw = w * DOWN_SKEW * downMult * type.risk;
  const down = Math.max(0.5 * downRaw, downRaw + bearAdj);
  const up = w * UP_SKEW * upMult;

  const real = { bear: baseReal - down, base: baseReal, bull: baseReal + up };
  const nominal = { bear: toNominal(real.bear, inflation), base: toNominal(real.base, inflation), bull: toNominal(real.bull, inflation) };

  return {
    years: T,
    real: { bear: r1(real.bear), base: r1(real.base), bull: r1(real.bull) },
    nominal: { bear: r1(nominal.bear), base: r1(nominal.base), bull: r1(nominal.bull) },
    exact: { real, nominal },
    down: r1(down), up: r1(up),
    anchor: type.anchor,
    breakdown,
    capped: tilt !== cappedTilt,
    agreement: Math.round((1 - disagreement) * 100),
  };
}

/** € outcomes per scenario. Costs in % of price, capex in € (today's money). */
export function computeOutcome(result, { price, knkPct, sellPct, capex }) {
  const T = result.years;
  const k = knkPct / 100, s = sellPct / 100;
  const cost = price * (1 + k) + capex;
  const scenario = key => {
    const realValue = price * Math.pow(1 + result.exact.real[key] / 100, T);
    const nomValue = price * Math.pow(1 + result.exact.nominal[key] / 100, T);
    return {
      realValue, nomValue,
      netReal: realValue * (1 - s) - cost,
      netNominal: nomValue * (1 - s) - cost,
    };
  };
  const stressReal = price * (1 + STRESS.shock / 100) * Math.pow(1 + result.exact.real.base / 100, Math.max(0, T - STRESS.years));
  const breakEvenReal = price > 0 ? (Math.pow(cost / price / (1 - s), 1 / T) - 1) * 100 : 0;
  return {
    bear: scenario("bear"), base: scenario("base"), bull: scenario("bull"),
    stress: { realValue: stressReal, netReal: stressReal * (1 - s) - cost },
    breakEvenReal: r1(breakEvenReal),
    totalCost: cost,
  };
}

/** Decision level follows the bear-case rule, based on real net result after all costs. */
export function decisionLevel(outcome) {
  if (outcome.bear.netReal >= 0) return "good";
  if (outcome.base.netReal >= 0) return "warn";
  return "bad";
}

/** Real value (today's money, before selling costs) if sold after t = 0…T years, per scenario. For the fan chart. */
export function valuePath(inputs, price) {
  const T = clamp(inputs.years ?? HORIZON.default, HORIZON.min, HORIZON.max);
  const path = [{ t: 0, bear: price, base: price, bull: price }];
  for (let t = 1; t <= T; t++) {
    const r = computeAppreciation({ ...inputs, years: Math.max(t, HORIZON.min) }).exact.real;
    const v = k => price * Math.pow(1 + r[k] / 100, t);
    path.push({ t, bear: v("bear"), base: v("base"), bull: v("bull") });
  }
  return path;
}
