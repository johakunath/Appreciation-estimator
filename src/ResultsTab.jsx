import { useState } from "react";
import { C, MONO, card, LEVEL_COLOR, SCENARIO_COLOR, fmtPct, fmtK, fmtSignedK } from "./theme.js";
import { NumberField } from "./components.jsx";
import FanChart from "./FanChart.jsx";
import { HORIZON, STRESS } from "./model.js";
import { DECISION_TEXT, SCENARIO_TEXT } from "./content.js";

const KEYS = ["bear", "base", "bull"];
const small = { fontSize: 12, color: C.mut };
const netColor = v => (v >= 0 ? C.green : C.red);

/* ── Building blocks, used by the narrow tab view and the wide sticky panel ── */

export function CostsCard({ s, set }) {
  return (
    <div style={card()}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.purple, marginBottom: 12 }}>Kauf & Kosten</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <NumberField label="Kaufpreis" unit="€" value={s.price} min={10000} max={10000000} onChange={v => set("price", v)} width={150} />
        <NumberField label="Haltedauer" unit="Jahre" value={s.years} min={HORIZON.min} max={HORIZON.max} onChange={v => set("years", Math.round(v))} width={100} />
        <NumberField label="Kaufnebenkosten" unit="%" value={s.knkPct} min={0} max={20} onChange={v => set("knkPct", v)} width={100} />
        <NumberField label="Verkaufskosten" unit="%" value={s.sellPct} min={0} max={10} onChange={v => set("sellPct", v)} width={100} />
        <NumberField label="Sonderkosten" unit="€" value={s.capex} min={0} max={5000000} onChange={v => set("capex", v)} width={120} />
      </div>
      <div style={{ ...small, marginTop: 8, lineHeight: 1.5 }}>
        Berlin: Grunderwerbsteuer 6 % + Notar/Grundbuch ~1,5–2 % + Makler 3,57 % ≈ 11 % (ohne Makler ~7,5 %). Verkauf mit Makler ~3,57 %. Sonderkosten = Sanierung, Heizungstausch, Sonderumlage. Laufende Instandhaltung ist nicht enthalten.
      </div>
    </div>
  );
}

export function DecisionCard({ s, level }) {
  const d = DECISION_TEXT[s.useCase][level], col = LEVEL_COLOR[level];
  return (
    <div style={card({ borderLeft: `4px solid ${col}` })}>
      <div style={{ fontSize: 15, fontWeight: 700, color: col, marginBottom: 5 }}>{d.title}</div>
      <div style={{ fontSize: 13, color: C.sec, lineHeight: 1.6 }}>{d.text}</div>
    </div>
  );
}

export function TaxWarning({ s }) {
  if (s.useCase !== "investment" || s.years >= 10) return null;
  return (
    <div style={card({ borderLeft: `4px solid ${C.amber}` })}>
      <div style={{ fontSize: 13, color: C.sec, lineHeight: 1.6 }}>
        <strong style={{ color: C.amber }}>Spekulationsfrist:</strong> Verkauf vor 10 Jahren ist einkommensteuerpflichtig (§23 EStG). Bereits genutzte Abschreibung (AfA) erhöht den Gewinn. Hier nicht eingerechnet.
      </div>
    </div>
  );
}

export function ChartCard({ path, outcome, s }) {
  const breakEvenValue = outcome.totalCost / (1 - s.sellPct / 100);
  return (
    <div style={card()}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.sec, marginBottom: 8 }}>Wertverlauf real</div>
      <FanChart path={path} breakEvenValue={breakEvenValue} />
    </div>
  );
}

export function KeyFigures({ result, outcome }) {
  return (
    <div style={card()}>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 150px" }}>
          <div style={{ fontSize: 13, color: C.sec }}>Kosten gedeckt ab</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: MONO, color: C.text, margin: "3px 0" }}>{fmtPct(outcome.breakEvenReal)} p.a.</div>
          <div style={small}>real · erreicht in: {KEYS.filter(k => outcome[k].netReal >= 0).map(k => SCENARIO_TEXT[k].label).join(", ") || "keinem Szenario"}</div>
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <div style={{ fontSize: 13, color: C.sec }}>Stresstest</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: MONO, color: netColor(outcome.stress.netReal), margin: "3px 0" }}>{fmtSignedK(outcome.stress.netReal)}</div>
          <div style={small}>einmalig {STRESS.shock} % real in {STRESS.years} J. (wie 2022–24), danach Base</div>
        </div>
      </div>
    </div>
  );
}

/** Compact table of all scenario numbers (also the table view of the chart). */
export function ScenarioTable({ result, outcome }) {
  const rows = [
    ["Rate p.a. real", k => fmtPct(result.real[k])],
    ["Rate p.a. nominal", k => fmtPct(result.nominal[k])],
    [`Wert nach ${result.years} J. (heutige Kaufkraft)`, k => fmtK(outcome[k].realValue)],
    [`Wert nach ${result.years} J. nominal`, k => fmtK(outcome[k].nomValue)],
    ["Ergebnis nach allen Kosten, real", k => <span style={{ color: netColor(outcome[k].netReal), fontWeight: 700 }}>{fmtSignedK(outcome[k].netReal)}</span>],
    ["Ergebnis nach allen Kosten, nominal", k => fmtSignedK(outcome[k].netNominal)],
  ];
  const td = { padding: "6px 6px", borderBottom: `1px solid ${C.border}`, fontSize: 13 };
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ ...td, textAlign: "left", color: C.mut, fontWeight: 500 }} />
          {KEYS.map(k => (
            <th key={k} style={{ ...td, textAlign: "right", color: C.text, fontWeight: 700 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: SCENARIO_COLOR[k], marginRight: 5 }} />{SCENARIO_TEXT[k].label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, f]) => (
          <tr key={label}>
            <td style={{ ...td, color: C.sec }}>{label}</td>
            {KEYS.map(k => <td key={k} style={{ ...td, textAlign: "right", fontFamily: MONO, color: C.text, whiteSpace: "nowrap" }}>{f(k)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SimulatorLine({ result }) {
  const [copied, setCopied] = useState(false);
  const simText = `Bear ${result.nominal.bear} % · Base ${result.nominal.base} % · Bull ${result.nominal.bull} %`;
  const copy = () => navigator.clipboard?.writeText(simText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, color: C.mut }}>Capital Allocation Simulator (nominal):</span>
      <span style={{ fontSize: 13, fontFamily: MONO, color: C.text }}>{simText.replaceAll(".", ",")}</span>
      <button onClick={copy} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 5, border: `1px solid ${C.border}`, background: C.card2, color: copied ? C.green : C.sec, cursor: "pointer" }}>
        {copied ? "Kopiert" : "Kopieren"}
      </button>
    </div>
  );
}

const Rule = () => (
  <div style={{ fontSize: 13, color: C.sec, lineHeight: 1.6 }}>
    <strong style={{ color: C.purple }}>Regel:</strong> Ein Deal muss im <strong style={{ color: C.text }}>Bear-Case</strong> funktionieren. Geht er nur bei Base/Bull auf, spekulierst du auf Wertsteigerung.
  </div>
);

/* ── Narrow screens: full results tab ── */

export default function ResultsTab({ s, set, result, outcome, level, path }) {
  return (
    <div>
      <DecisionCard s={s} level={level} />
      <CostsCard s={s} set={set} />
      <TaxWarning s={s} />
      <ChartCard path={path} outcome={outcome} s={s} />
      <KeyFigures result={result} outcome={outcome} />
      <div style={card()}><ScenarioTable result={result} outcome={outcome} /></div>
      <div style={card({ borderLeft: `4px solid ${C.purple}` })}>
        <Rule />
        <div style={{ marginTop: 10 }}><SimulatorLine result={result} /></div>
      </div>
    </div>
  );
}

/* ── Wide screens: sticky panel next to the inputs ── */

export function ResultsPanel({ s, result, outcome, level, path }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {KEYS.map(k => (
          <div key={k} style={{ flex: 1, background: C.card, borderRadius: 8, padding: "10px 6px", border: `1px solid ${C.border}`, borderTop: `3px solid ${SCENARIO_COLOR[k]}`, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: C.mut, fontWeight: 600 }}>{SCENARIO_TEXT[k].label} <span style={{ fontWeight: 400 }}>· {SCENARIO_TEXT[k].plain}</span></div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: MONO, color: SCENARIO_COLOR[k], margin: "2px 0" }}>{fmtPct(result.real[k])}</div>
            <div style={small}>real p.a.</div>
            <div style={{ fontSize: 13, fontFamily: MONO, fontWeight: 700, color: netColor(outcome[k].netReal), marginTop: 6 }}>{fmtSignedK(outcome[k].netReal)}</div>
            <div style={small}>nach Kosten</div>
          </div>
        ))}
      </div>
      <DecisionCard s={s} level={level} />
      <TaxWarning s={s} />
      <ChartCard path={path} outcome={outcome} s={s} />
      <KeyFigures result={result} outcome={outcome} />
      <details style={card({ padding: "12px 16px" })}>
        <summary style={{ fontSize: 13, color: C.accent, cursor: "pointer" }}>Details: alle Werte, nominal, Simulator-Raten</summary>
        <div style={{ marginTop: 10 }}><ScenarioTable result={result} outcome={outcome} /></div>
        <div style={{ marginTop: 12 }}><Rule /></div>
        <div style={{ marginTop: 10 }}><SimulatorLine result={result} /></div>
      </details>
    </div>
  );
}
