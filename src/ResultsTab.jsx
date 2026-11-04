import { useState } from "react";
import { C, MONO, card, LEVEL_COLOR, SCENARIO_COLOR, fmtPct, fmtK, fmtSignedK } from "./theme.js";
import { NumberField } from "./components.jsx";
import { HORIZON, STRESS } from "./model.js";
import { DECISION_TEXT, SCENARIO_TEXT } from "./content.js";

const KEYS = ["bear", "base", "bull"];
const sep = { width: "100%", height: 1, background: C.border, margin: "10px 0" };
const small = { fontSize: 12, color: C.mut };

export default function ResultsTab({ s, set, result, outcome, level }) {
  const d = DECISION_TEXT[s.useCase][level];
  const col = LEVEL_COLOR[level];
  const [copied, setCopied] = useState(false);
  const simText = `Bear ${result.nominal.bear} % · Base ${result.nominal.base} % · Bull ${result.nominal.bull} %`;
  const copySim = () => navigator.clipboard?.writeText(simText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });

  return (
    <div>
      <div style={card({ borderLeft: `4px solid ${col}` })}>
        <div style={{ fontSize: 16, fontWeight: 700, color: col, marginBottom: 5 }}>{d.title}</div>
        <div style={{ fontSize: 14, color: C.sec, lineHeight: 1.7 }}>{d.text}</div>
      </div>

      <div style={card()}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <NumberField label="Kaufpreis" unit="€" value={s.price} min={10000} max={10000000} onChange={v => set("price", v)} width={170} />
          <NumberField label="Haltedauer" unit="Jahre" value={s.years} min={HORIZON.min} max={HORIZON.max} onChange={v => set("years", Math.round(v))} width={110} />
          <NumberField label="Kaufnebenkosten" unit="%" value={s.knkPct} min={0} max={20} onChange={v => set("knkPct", v)} width={110} />
          <NumberField label="Verkaufskosten" unit="%" value={s.sellPct} min={0} max={10} onChange={v => set("sellPct", v)} width={110} />
          <NumberField label="Sonderkosten (Sanierung, Umlage)" unit="€" value={s.capex} min={0} max={5000000} onChange={v => set("capex", v)} width={170} />
        </div>
        <div style={{ ...small, marginTop: 8, lineHeight: 1.5 }}>
          Berlin: Grunderwerbsteuer 6 % + Notar/Grundbuch ~1,5–2 % + Makler 3,57 % ≈ 11 % (ohne Makler ~7,5 %). Verkauf mit Makler: ~3,57 %. Laufende Instandhaltung ist nicht enthalten.
        </div>
      </div>

      {s.useCase === "investment" && s.years < 10 && (
        <div style={card({ borderLeft: `4px solid ${C.amber}` })}>
          <div style={{ fontSize: 14, color: C.sec, lineHeight: 1.6 }}>
            <strong style={{ color: C.amber }}>Spekulationsfrist:</strong> Verkauf vor 10 Jahren ist einkommensteuerpflichtig (§23 EStG). Bereits genutzte Abschreibung (AfA) erhöht den steuerpflichtigen Gewinn. Hier nicht eingerechnet.
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        {KEYS.map(k => {
          const o = outcome[k], c = SCENARIO_COLOR[k];
          return (
            <div key={k} style={{
              flex: "1 1 200px", background: C.card, borderRadius: 9, padding: "14px 12px", textAlign: "center",
              border: `1px solid ${C.border}`, borderTop: `3px solid ${c}`, display: "flex", flexDirection: "column", alignItems: "center",
            }}>
              <div style={{ fontSize: 13, color: c, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{SCENARIO_TEXT[k].label}</div>
              <div style={{ ...small, marginBottom: 8 }}>{SCENARIO_TEXT[k].plain}</div>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: MONO, color: c, lineHeight: 1 }}>{fmtPct(result.real[k])}</div>
              <div style={{ ...small, marginTop: 3 }}>p.a. real (nach Inflation)</div>
              <div style={{ fontSize: 14, fontFamily: MONO, color: C.sec, marginTop: 6 }}>{fmtPct(result.nominal[k])}</div>
              <div style={small}>p.a. nominal</div>

              <div style={sep} />
              <div style={small}>Wert nach {result.years} J. in heutiger Kaufkraft</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: MONO, color: C.text, marginBottom: 4 }}>{fmtK(o.realValue)}</div>
              <div style={small}>nominal: {fmtK(o.nomValue)}</div>

              <div style={sep} />
              <div style={{ fontSize: 13, color: C.sec }}>Ergebnis nach allen Kosten, real</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: MONO, color: o.netReal >= 0 ? C.green : C.red, margin: "3px 0" }}>{fmtSignedK(o.netReal)}</div>
              <div style={small}>nominal: {fmtSignedK(o.netNominal)}</div>
            </div>
          );
        })}
      </div>

      <div style={card()}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <div style={{ fontSize: 13, color: C.sec }}>Nötige reale Wertsteigerung, um alle Kosten wieder einzuspielen</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO, color: C.text, margin: "4px 0" }}>{fmtPct(outcome.breakEvenReal)} p.a.</div>
            <div style={small}>
              Erreicht in: {KEYS.filter(k => result.exact.real[k] >= outcome.breakEvenReal).map(k => SCENARIO_TEXT[k].label).join(", ") || "keinem Szenario"}
            </div>
          </div>
          <div style={{ flex: "1 1 260px" }}>
            <div style={{ fontSize: 13, color: C.sec }}>Stresstest: einmalig {STRESS.shock} % real in den ersten {STRESS.years} Jahren (wie 2022–24), danach Base</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO, color: outcome.stress.netReal >= 0 ? C.green : C.red, margin: "4px 0" }}>{fmtSignedK(outcome.stress.netReal)}</div>
            <div style={small}>Ergebnis nach allen Kosten, real</div>
          </div>
        </div>
      </div>

      <RangeBar result={result} breakEven={outcome.breakEvenReal} />

      <div style={card({ borderLeft: `4px solid ${C.purple}` })}>
        <div style={{ fontSize: 14, color: C.sec, lineHeight: 1.7 }}>
          <strong style={{ color: C.purple }}>Regel:</strong> Ein Deal muss beim <strong style={{ color: C.red }}>Bear-Case</strong> funktionieren. Wenn er nur bei Base/Bull aufgeht, spekulierst du auf Wertsteigerung.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: C.mut }}>Für den Capital Allocation Simulator (nominal):</span>
          <span style={{ fontSize: 13, fontFamily: MONO, color: C.text }}>{simText.replaceAll(".", ",")}</span>
          <button onClick={copySim} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 5, border: `1px solid ${C.border}`, background: C.card2, color: copied ? C.green : C.sec, cursor: "pointer" }}>
            {copied ? "Kopiert" : "Kopieren"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RangeBar({ result, breakEven }) {
  const lo = Math.min(-5, Math.floor(result.real.bear) - 1), hi = Math.max(5, Math.ceil(result.real.bull) + 1);
  const x = v => `${((v - lo) / (hi - lo)) * 100}%`;
  const ticks = [];
  for (let t = Math.ceil(lo); t <= hi; t++) ticks.push(t);
  return (
    <div style={card()}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.sec, marginBottom: 14 }}>
        Spanne real p.a.: Bear −{String(result.down).replace(".", ",")} / Bull +{String(result.up).replace(".", ",")} Prozentpunkte um Base
      </div>
      <div style={{ position: "relative", height: 64 }}>
        <div style={{ position: "absolute", top: 24, left: 0, right: 0, height: 14, background: C.card2, borderRadius: 7 }} />
        <div style={{ position: "absolute", top: 24, left: x(result.real.bear), width: `calc(${x(result.real.bull)} - ${x(result.real.bear)})`, height: 14, background: `linear-gradient(90deg, ${C.red}66, ${C.accent}66, ${C.green}66)`, borderRadius: 7 }} />
        <div style={{ position: "absolute", top: 18, bottom: 20, left: x(0), width: 1, background: C.sec }} />
        <div style={{ position: "absolute", top: 18, bottom: 20, left: x(breakEven), width: 2, background: C.amber }} />
        <div style={{ position: "absolute", top: 0, left: x(breakEven), transform: "translateX(-50%)", fontSize: 12, color: C.amber, whiteSpace: "nowrap" }}>Kosten gedeckt</div>
        <div style={{ position: "absolute", top: 19, left: x(result.real.base), transform: "translateX(-50%)", width: 5, height: 24, background: C.accent, borderRadius: 3 }} />
        {ticks.map(t => (
          <div key={t} style={{ position: "absolute", top: 46, left: x(t), transform: "translateX(-50%)", fontSize: 12, color: t === 0 ? C.sec : C.mut, fontFamily: MONO }}>{t}</div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: MONO }}>
        <span style={{ color: C.red }}>Bear {fmtPct(result.real.bear)}</span>
        <span style={{ color: C.accent }}>Base {fmtPct(result.real.base)}</span>
        <span style={{ color: C.green }}>Bull {fmtPct(result.real.bull)}</span>
      </div>
    </div>
  );
}
