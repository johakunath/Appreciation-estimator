import { useState, useEffect } from "react";
import { C, MONO, SCENARIO_COLOR, fmtPct } from "./theme.js";
import { computeAppreciation, computeOutcome, decisionLevel } from "./model.js";
import { SCENARIO_TEXT, DEFAULTS } from "./content.js";
import { readState, writeState } from "./urlState.js";
import InputsTab from "./InputsTab.jsx";
import ResultsTab from "./ResultsTab.jsx";
import GuideTab from "./GuideTab.jsx";

/* WERTSTEIGERUNG · APPRECIATION ESTIMATOR v4. Model: model.js · Texts/market facts: content.js */

const TABS = [{ id: "inputs", label: "Bewertung" }, { id: "results", label: "Szenarien" }, { id: "guide", label: "Anleitung" }];
const USE_CASES = [{ id: "investment", label: "Kapitalanlage" }, { id: "selfuse", label: "Eigennutzung" }];

const segBtn = (active, activeBg, activeColor) => ({
  flex: 1, padding: "9px 4px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
  background: active ? activeBg : "transparent", color: active ? activeColor : C.mut,
});
const segWrap = { display: "flex", gap: 3, marginBottom: 10, background: C.card, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` };

export default function App() {
  const [s, setS] = useState(readState);
  const [tab, setTab] = useState("inputs");
  const [linkCopied, setLinkCopied] = useState(false);
  const set = (k, v) => setS(prev => ({ ...prev, [k]: v }));
  useEffect(() => writeState(s), [s]);

  const result = computeAppreciation(s);
  const outcome = computeOutcome(result, s);
  const level = decisionLevel(outcome);

  const copyLink = () => navigator.clipboard?.writeText(window.location.href).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1500); });

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", background: C.bg, color: C.text, minHeight: "100vh", padding: "20px 16px" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { border-color: ${C.accent} !important; outline: none; }
        button { font-family: inherit; }
        button:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
      `}</style>

      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: C.teal, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 4 }}>Project Property</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em" }}>Wertsteigerung Estimator</h1>
            <div style={{ fontSize: 13, color: C.mut, marginTop: 4 }}>Szenario-basiert · Nie eine Punktschätzung · Ein Deal muss im Bear-Case funktionieren</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setS({ ...DEFAULTS, useCase: s.useCase })} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, color: C.sec, cursor: "pointer" }}>Zurücksetzen</button>
            <button onClick={copyLink} title="Link mit allen Eingaben kopieren, z. B. zum Vergleichen mit Partner:in" style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, color: linkCopied ? C.green : C.sec, cursor: "pointer" }}>
              {linkCopied ? "Link kopiert" : "Link teilen"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          {["bear", "base", "bull"].map(k => (
            <div key={k} style={{ flex: "1 1 160px", background: C.card, borderRadius: 9, padding: "12px 10px", border: `1px solid ${C.border}`, borderTop: `3px solid ${SCENARIO_COLOR[k]}`, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: C.mut, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                {SCENARIO_TEXT[k].label} <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>· {SCENARIO_TEXT[k].plain}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: MONO, color: SCENARIO_COLOR[k] }}>{fmtPct(result.real[k])}</div>
              <div style={{ fontSize: 12, color: C.mut, marginTop: 2 }}>real · {fmtPct(result.nominal[k])} nominal</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.mut, textAlign: "center", marginBottom: 14 }}>
          Wertsteigerung p.a. über {result.years} Jahre · real = nach Inflation · Kosten gedeckt ab {fmtPct(outcome.breakEvenReal)} real
        </div>

        <div style={segWrap}>
          {USE_CASES.map(u => (
            <button key={u.id} aria-pressed={s.useCase === u.id} onClick={() => set("useCase", u.id)} style={segBtn(s.useCase === u.id, C.accent + "1A", C.accent)}>{u.label}</button>
          ))}
        </div>
        <div role="tablist" style={{ ...segWrap, marginBottom: 16 }}>
          {TABS.map(t => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} style={segBtn(tab === t.id, C.card2, C.text)}>{t.label}</button>
          ))}
        </div>

        {tab === "inputs" && <InputsTab s={s} set={set} result={result} />}
        {tab === "results" && <ResultsTab s={s} set={set} result={result} outcome={outcome} level={level} />}
        {tab === "guide" && <GuideTab />}
      </div>
    </div>
  );
}
