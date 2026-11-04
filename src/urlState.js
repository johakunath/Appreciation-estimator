import { DEFAULTS, INFLATION_OPTIONS } from "./content.js";
import { PROPERTY_TYPES, HORIZON } from "./model.js";

/* Inputs live in the URL hash so a scenario can be shared (e.g. both partners score independently).
   localStorage is deliberately not used (see AGENTS.md). */

const SCORE_KEYS = ["supplyDemand", "locationMomentum", "locationAmenities", "propertyQuality", "regulatoryRisk", "interestOutlook"];
const inRange = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;

export function readState() {
  const s = { ...DEFAULTS };
  let p;
  try { p = new URLSearchParams(window.location.hash.slice(1)); } catch { return s; }
  for (const k of SCORE_KEYS) { const v = Number(p.get(k)); if (Number.isInteger(v) && inRange(v, 1, 5)) s[k] = v; }
  if (PROPERTY_TYPES[p.get("propertyType")]) s.propertyType = p.get("propertyType");
  if (["investment", "selfuse"].includes(p.get("useCase"))) s.useCase = p.get("useCase");
  const num = (k, lo, hi) => { if (p.has(k)) { const v = Number(p.get(k)); if (inRange(v, lo, hi)) s[k] = v; } };
  num("price", 10000, 10000000); num("years", HORIZON.min, HORIZON.max); num("knkPct", 0, 20); num("sellPct", 0, 10); num("capex", 0, 5000000);
  const infl = Number(p.get("inflation"));
  if (INFLATION_OPTIONS.includes(infl)) s.inflation = infl;
  return s;
}

export function writeState(s) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(s)) if (v !== DEFAULTS[k]) p.set(k, String(v));
  const hash = p.toString();
  try { window.history.replaceState(null, "", hash ? `#${hash}` : window.location.pathname + window.location.search); } catch { /* ignore */ }
}
