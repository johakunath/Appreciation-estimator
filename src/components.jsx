import { useState, useEffect } from "react";
import { C, MONO, scoreColor, fmtPct } from "./theme.js";

export function ScoreSelector({ label, value, onChange, descriptions, help, hint }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <span style={{ fontSize: 15, color: C.text, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 13, color: C.accent, fontWeight: 600, fontFamily: MONO }}>{value}/5</span>
      </div>
      {help && <div style={{ fontSize: 13, color: C.mut, marginBottom: 8, lineHeight: 1.6 }}>{help}</div>}
      <div role="radiogroup" aria-label={label} style={{ display: "flex", gap: 5, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map(n => {
          const active = n === value, col = scoreColor(n);
          return (
            <button key={n} role="radio" aria-checked={active} onClick={() => onChange(n)} style={{
              flex: 1, height: 40, borderRadius: 7, cursor: "pointer", fontSize: 16, fontWeight: 700, fontFamily: MONO,
              border: active ? `2px solid ${col}` : `1px solid ${C.border}`,
              background: active ? col + "20" : C.card2, color: active ? col : C.mut,
            }}>{n}</button>
          );
        })}
      </div>
      <div style={{ background: C.card2, borderRadius: 7, padding: "6px 6px" }}>
        {descriptions.map((d, i) => {
          const active = i + 1 === value;
          return (
            <div key={i} onClick={() => onChange(i + 1)} style={{
              display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 8px", borderRadius: 5, cursor: "pointer",
              background: active ? scoreColor(i + 1) + "14" : "transparent",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(i + 1), fontFamily: MONO, minWidth: 14, textAlign: "right" }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: active ? C.text : C.mut, lineHeight: 1.5, fontWeight: active ? 600 : 400 }}>{d}</span>
            </div>
          );
        })}
      </div>
      {hint && <div style={{ fontSize: 12, color: C.teal, marginTop: 6, lineHeight: 1.5 }}>ⓘ {hint}</div>}
    </div>
  );
}

/** Horizontal bar diverging from a centre line. */
export function DivergingBar({ label, value, range = 1.5, note }) {
  const pct = Math.min(50, (Math.abs(value) / range) * 50);
  const col = value < 0 ? C.red : value > 0 ? C.green : C.mut;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 13, color: C.sec }}>{label}{note && <span style={{ color: C.mut }}> · {note}</span>}</span>
        <span style={{ fontSize: 13, fontFamily: MONO, color: col }}>{fmtPct(value)}</span>
      </div>
      <div style={{ position: "relative", height: 8, background: C.card2, borderRadius: 4 }}>
        <div style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 1, background: C.mut }} />
        {value !== 0 && (
          <div style={{
            position: "absolute", top: 0, bottom: 0, borderRadius: 4, background: col,
            left: value < 0 ? `${50 - pct}%` : "50%", width: `${pct}%`,
          }} />
        )}
      </div>
    </div>
  );
}

/** Number input with local text state: no jumping while typing, clamped on blur. */
const fmtInput = v => v.toLocaleString("de-DE", { maximumFractionDigits: 2 });
/** Parses German ("350.000", "3,57") and plain ("3.57") number input. */
export function parseDe(text) {
  let t = String(text).trim().replace(/\s|€|%/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  return parseFloat(t);
}

export function NumberField({ label, value, onChange, min, max, unit, width }) {
  const [text, setText] = useState(fmtInput(value));
  useEffect(() => setText(fmtInput(value)), [value]);
  const commit = () => {
    const n = parseDe(text);
    const v = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : value;
    onChange(v);
    setText(fmtInput(v));
  };
  return (
    <div style={{ flex: `1 1 ${width ?? 140}px` }}>
      <label style={{ fontSize: 13, color: C.sec, display: "block", marginBottom: 4 }}>{label}</label>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input type="text" inputMode="decimal" value={text}
          onChange={e => setText(e.target.value)} onBlur={commit} onKeyDown={e => e.key === "Enter" && commit()}
          style={{ flex: 1, minWidth: 0, padding: "8px 10px", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 15, fontFamily: MONO }} />
        {unit && <span style={{ fontSize: 13, color: C.mut }}>{unit}</span>}
      </div>
    </div>
  );
}
