import { describe, it, expect } from "vitest";
import { computeAppreciation, computeOutcome, decisionLevel, PROPERTY_TYPES, FACTORS, bandWidth, decayShare } from "./model.js";

const DEFAULTS = {
  inflation: 2.5, propertyType: "apartment_standard", years: 15,
  supplyDemand: 4, locationMomentum: 3, locationAmenities: 3, propertyQuality: 3, regulatoryRisk: 2, interestOutlook: 3,
};
const COSTS = { price: 350000, knkPct: 11, sellPct: 3.57, capex: 0 };
const KEYS = FACTORS.map(f => f.key);
const HORIZONS = [3, 5, 10, 15, 30];

function* allCombos() {
  const n = KEYS.length;
  for (let i = 0; i < 5 ** n; i++) {
    const o = {};
    let x = i;
    for (const k of KEYS) { o[k] = (x % 5) + 1; x = Math.floor(x / 5); }
    yield o;
  }
}

describe("invariants over all inputs", () => {
  it("bear < base < bull for every combination, type and horizon", () => {
    let bad = 0;
    for (const scores of allCombos())
      for (const propertyType of Object.keys(PROPERTY_TYPES))
        for (const years of HORIZONS) {
          const r = computeAppreciation({ ...DEFAULTS, ...scores, propertyType, years });
          if (!(r.exact.real.bear < r.exact.real.base && r.exact.real.base < r.exact.real.bull)) bad++;
          if (!(r.exact.nominal.bear < r.exact.nominal.base && r.exact.nominal.base < r.exact.nominal.bull)) bad++;
        }
    expect(bad).toBe(0);
  });

  it("raising any single factor score never lowers base or bear", () => {
    let bad = 0;
    for (const scores of allCombos())
      for (const years of HORIZONS) {
        const r = computeAppreciation({ ...DEFAULTS, ...scores, years });
        for (const k of KEYS) {
          if (scores[k] === 5) continue;
          const r2 = computeAppreciation({ ...DEFAULTS, ...scores, years, [k]: scores[k] + 1 });
          if (r2.exact.real.base < r.exact.real.base - 1e-9) bad++;
          if (r2.exact.real.bear < r.exact.real.bear - 1e-9) bad++;
        }
      }
    expect(bad).toBe(0);
  });

  it("real rates do not depend on inflation", () => {
    const a = computeAppreciation({ ...DEFAULTS, inflation: 1.5 });
    const b = computeAppreciation({ ...DEFAULTS, inflation: 3.5 });
    expect(a.real).toEqual(b.real);
    expect(b.nominal.base).toBeGreaterThan(a.nominal.base);
  });

  it("total adjustment is capped: bull real stays plausible even with all 5", () => {
    const all5 = Object.fromEntries(KEYS.map(k => [k, 5]));
    const r = computeAppreciation({ ...DEFAULTS, ...all5, propertyType: "altbau_renovated", years: 15 });
    expect(r.capped).toBe(true);
    expect(r.real.base).toBeLessThanOrEqual(2.1 + 1e-9);
  });
});

describe("uncertainty", () => {
  it("annualised band narrows with horizon", () => {
    expect(bandWidth(5)).toBeGreaterThan(bandWidth(10));
    expect(bandWidth(10)).toBeGreaterThan(bandWidth(15));
  });

  it("downside is wider than upside", () => {
    const r = computeAppreciation(DEFAULTS);
    expect(r.down).toBeGreaterThan(r.up);
  });

  it("contradictory inputs widen the band vs. coherent moderate inputs", () => {
    const coherent = computeAppreciation({ ...DEFAULTS, supplyDemand: 4, locationMomentum: 4, locationAmenities: 4, propertyQuality: 4, regulatoryRisk: 4, interestOutlook: 4 });
    const mixed = computeAppreciation({ ...DEFAULTS, supplyDemand: 5, locationMomentum: 1, locationAmenities: 5, propertyQuality: 1, regulatoryRisk: 5, interestOutlook: 1 });
    expect(mixed.exact.real.bull - mixed.exact.real.bear).toBeGreaterThan(coherent.exact.real.bull - coherent.exact.real.bear);
    expect(mixed.agreement).toBeLessThan(coherent.agreement);
  });

  it("dynamic factor effect decays with horizon", () => {
    expect(decayShare(5)).toBeGreaterThan(decayShare(15));
    const short = computeAppreciation({ ...DEFAULTS, years: 5 }).breakdown.find(b => b.key === "supplyDemand").effect;
    const long = computeAppreciation({ ...DEFAULTS, years: 30 }).breakdown.find(b => b.key === "supplyDemand").effect;
    expect(short).toBeGreaterThan(long);
  });
});

describe("calibration sanity (Berlin default, 15 y)", () => {
  const r = computeAppreciation(DEFAULTS);
  it("base real within long-run anchor range 0–1.5 % p.a.", () => {
    expect(r.real.base).toBeGreaterThanOrEqual(0);
    expect(r.real.base).toBeLessThanOrEqual(1.5);
  });
  it("bear/bull real within historical rolling 15y range DE (−1.8 … +2.9 %) widened for single-property risk", () => {
    expect(r.real.bear).toBeGreaterThan(-3);
    expect(r.real.bear).toBeLessThan(-1);
    expect(r.real.bull).toBeGreaterThan(1.5);
    expect(r.real.bull).toBeLessThan(3.5);
  });
});

describe("outcome", () => {
  it("break-even real rate yields ~zero real net result", () => {
    const r = computeAppreciation(DEFAULTS);
    const o = computeOutcome(r, COSTS);
    const T = r.years, be = o.breakEvenReal / 100;
    const net = COSTS.price * (1 + be) ** T * (1 - COSTS.sellPct / 100) - COSTS.price * (1 + COSTS.knkPct / 100);
    expect(Math.abs(net)).toBeLessThan(COSTS.price * 0.01);
  });

  it("real net is below nominal net when inflation > 0", () => {
    const o = computeOutcome(computeAppreciation(DEFAULTS), COSTS);
    for (const k of ["bear", "base", "bull"]) expect(o[k].netReal).toBeLessThan(o[k].netNominal);
  });

  it("capex reduces net result one-for-one", () => {
    const r = computeAppreciation(DEFAULTS);
    const a = computeOutcome(r, COSTS), b = computeOutcome(r, { ...COSTS, capex: 20000 });
    expect(a.base.netReal - b.base.netReal).toBeCloseTo(20000, 0);
  });

  it("decision follows bear-case rule", () => {
    expect(decisionLevel({ bear: { netReal: 1 }, base: { netReal: 1 } })).toBe("good");
    expect(decisionLevel({ bear: { netReal: -1 }, base: { netReal: 1 } })).toBe("warn");
    expect(decisionLevel({ bear: { netReal: -1 }, base: { netReal: -1 } })).toBe("bad");
  });
});

import { parseDe } from "./components.jsx";
describe("number input parsing", () => {
  it.each([["350.000", 350000], ["350000", 350000], ["3,57", 3.57], ["3.57", 3.57], ["1.250.000", 1250000], ["11", 11], ["20.000 €", 20000]])("%s -> %d", (t, v) => {
    expect(parseDe(t)).toBe(v);
  });
});
