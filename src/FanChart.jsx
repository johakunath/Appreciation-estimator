import { useState, useRef } from "react";
import { C, MONO, SCENARIO_COLOR, fmtK } from "./theme.js";

/* Fan chart: real value if sold after t years (Bear–Bull band, Base line) vs. value needed to cover all costs.
   Colors are the suite's fixed scenario colors (CVD-validated, all pairs ΔE ≥ 8.8); identity is also carried by direct labels + legend. */

const W = 420, H = 240, M = { l: 48, r: 74, t: 14, b: 28 };
const KEYS = ["bull", "base", "bear"];
const LABEL = { bear: "Bear", base: "Base", bull: "Bull" };

function niceTicks(lo, hi, n = 4) {
  const raw = (hi - lo) / n, p = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * p).find(s => s >= raw);
  const ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-6; v += step) ticks.push(v);
  return ticks;
}

export default function FanChart({ path, breakEvenValue }) {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const T = path.at(-1).t;
  const vals = path.flatMap(p => [p.bear, p.bull]).concat(breakEvenValue);
  const pad = (Math.max(...vals) - Math.min(...vals)) * 0.06;
  const lo = Math.min(...vals) - pad, hi = Math.max(...vals) + pad;
  const x = t => M.l + (t / T) * (W - M.l - M.r);
  const y = v => M.t + (1 - (v - lo) / (hi - lo)) * (H - M.t - M.b);
  const line = k => path.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p[k]).toFixed(1)}`).join("");
  const band = line("bull") + [...path].reverse().map(p => `L${x(p.t).toFixed(1)},${y(p.bear).toFixed(1)}`).join("") + "Z";
  const yTicks = niceTicks(lo, hi);
  const xTicks = [0, Math.round(T / 3), Math.round((2 * T) / 3), T].filter((v, i, a) => a.indexOf(v) === i);

  // Direct end labels, nudged apart to avoid collisions.
  const ends = KEYS.map(k => ({ k, y: y(path.at(-1)[k]), v: path.at(-1)[k] })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;

  const onMove = e => {
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const t = Math.round(((px - M.l) / (W - M.l - M.r)) * T);
    setHover(t >= 0 && t <= T ? t : null);
  };
  const hp = hover != null ? path[hover] : null;

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
        role="img" aria-label={`Wertverlauf über ${T} Jahre in heutiger Kaufkraft: Bear ${fmtK(path.at(-1).bear)}, Base ${fmtK(path.at(-1).base)}, Bull ${fmtK(path.at(-1).bull)}. Kosten gedeckt ab ${fmtK(breakEvenValue)}.`}
        onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {yTicks.map(v => (
          <g key={v}>
            <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke={C.border} strokeWidth="1" />
            <text x={M.l - 6} y={y(v) + 4} fill={C.mut} fontSize="11" fontFamily={MONO} textAnchor="end">{fmtK(v).replace(" €", "")}</text>
          </g>
        ))}
        {xTicks.map(t => (
          <text key={t} x={x(t)} y={H - 8} fill={C.mut} fontSize="11" fontFamily={MONO} textAnchor="middle">{t === T ? `${t} J.` : t}</text>
        ))}
        <path d={band} fill={C.accent} fillOpacity="0.14" />
        <path d={line("bull")} fill="none" stroke={SCENARIO_COLOR.bull} strokeWidth="2" strokeLinejoin="round" />
        <path d={line("bear")} fill="none" stroke={SCENARIO_COLOR.bear} strokeWidth="2" strokeLinejoin="round" />
        <path d={line("base")} fill="none" stroke={SCENARIO_COLOR.base} strokeWidth="2.5" strokeLinejoin="round" />
        <line x1={M.l} x2={W - M.r} y1={y(breakEvenValue)} y2={y(breakEvenValue)} stroke={C.amber} strokeWidth="1.5" strokeDasharray="6 5" />
        {ends.map(e => (
          <g key={e.k}>
            <line x1={W - M.r + 4} x2={W - M.r + 12} y1={e.y} y2={e.y} stroke={SCENARIO_COLOR[e.k]} strokeWidth="2.5" strokeLinecap="round" />
            <text x={W - M.r + 16} y={e.y + 4} fill={C.text} fontSize="11" fontFamily={MONO}>{LABEL[e.k]} {fmtK(e.v).replace(" €", "")}</text>
          </g>
        ))}
        {hp && (
          <g pointerEvents="none">
            <line x1={x(hp.t)} x2={x(hp.t)} y1={M.t} y2={H - M.b} stroke={C.sec} strokeWidth="1" />
            {KEYS.map(k => <circle key={k} cx={x(hp.t)} cy={y(hp[k])} r="4" fill={SCENARIO_COLOR[k]} stroke={C.card} strokeWidth="2" />)}
          </g>
        )}
      </svg>
      {hp && (
        <div style={{
          position: "absolute", top: 4, left: `${(x(hp.t) / W) * 100}%`, transform: `translateX(${hp.t > T / 2 ? "-105%" : "5%"})`,
          background: C.card2, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 9px", fontSize: 12, pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          <div style={{ color: C.sec, marginBottom: 3 }}>Verkauf nach {hp.t} J.</div>
          {KEYS.map(k => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, fontFamily: MONO }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: SCENARIO_COLOR[k] }} />{LABEL[k]} {fmtK(hp[k])}
            </div>
          ))}
          <div style={{ color: C.mut, marginTop: 3, fontFamily: MONO }}>Kosten gedeckt ab {fmtK(breakEvenValue)}</div>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 12, color: C.sec, marginTop: 6 }}>
        <span><span style={{ display: "inline-block", width: 12, height: 8, background: C.accent + "40", borderRadius: 2, marginRight: 5 }} />Bear–Bull-Spanne</span>
        <span><span style={{ display: "inline-block", width: 12, height: 2.5, background: SCENARIO_COLOR.base, verticalAlign: "middle", marginRight: 5 }} />Base</span>
        <span><span style={{ display: "inline-block", width: 12, borderTop: `2px dashed ${C.amber}`, verticalAlign: "middle", marginRight: 5 }} />Kosten gedeckt (Kaufpreis + alle Kosten)</span>
      </div>
      <div style={{ fontSize: 12, color: C.mut, marginTop: 4 }}>Wert bei Verkauf nach x Jahren, in heutiger Kaufkraft, vor Verkaufskosten.</div>
    </div>
  );
}
