export const C = {
  bg: "#121620",
  card: "#1A1F2E",
  card2: "#222838",
  border: "#2A3148",
  text: "#E4E8F0",
  sec: "#A8B1C4",
  mut: "#8A94AB",
  accent: "#4A9EFF",
  amber: "#F0B429",
  green: "#34D399",
  red: "#F0506A",
  purple: "#A78BFA",
  teal: "#38BCC8",
};

export const MONO = "'JetBrains Mono', monospace";

export const LEVEL_COLOR = { good: C.green, warn: C.amber, bad: C.red };
export const SCENARIO_COLOR = { bear: C.red, base: C.accent, bull: C.green };

export const card = extra => ({
  background: C.card, borderRadius: 9, padding: "16px 18px", border: `1px solid ${C.border}`, marginBottom: 14, ...extra,
});

export const sectionLabel = color => ({
  fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color, marginBottom: 12,
});

export const chip = (active, color) => ({
  padding: "7px 12px", borderRadius: 6, cursor: "pointer", fontSize: 14,
  border: active ? `2px solid ${color}` : `1px solid ${C.border}`,
  background: active ? color + "1A" : C.card2,
  color: active ? color : C.sec,
  fontWeight: active ? 600 : 400,
});

export const scoreColor = n => (n <= 2 ? C.red : n === 3 ? C.amber : C.green);

const nf1 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const fmtPct = (n, sign = true) => `${sign && n > 0 ? "+" : ""}${nf1.format(n)} %`;
export const fmtEur = n => `${Math.round(n).toLocaleString("de-DE")} €`;
export const fmtK = n => {
  const a = Math.abs(n), s = n < 0 ? "−" : "";
  if (a >= 1e6) return `${s}${(a / 1e6).toLocaleString("de-DE", { maximumFractionDigits: 2 })} Mio. €`;
  if (a >= 1000) return `${s}${Math.round(a / 1000).toLocaleString("de-DE")}k €`;
  return `${s}${Math.round(a)} €`;
};
export const fmtSignedK = n => (n > 0 ? "+" : "") + fmtK(n);
