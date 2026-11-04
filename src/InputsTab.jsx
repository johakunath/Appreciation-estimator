import { C, MONO, card, sectionLabel, chip, fmtPct } from "./theme.js";
import { ScoreSelector, DivergingBar } from "./components.jsx";
import { PROPERTY_TYPES } from "./model.js";
import { PROPERTY_TYPE_TEXT, FACTOR_TEXT, INTEREST_OPTIONS, INFLATION_OPTIONS, MARKET_SNAPSHOT as M } from "./content.js";

const riskLabel = r => (r > 1.05 ? "erhöht" : r < 0.97 ? "geringer" : "normal");

export default function InputsTab({ s, set, result }) {
  const type = PROPERTY_TYPES[s.propertyType];
  const factor = key => (
    <ScoreSelector key={key} label={FACTOR_TEXT[key].label} value={s[key]} onChange={v => set(key, v)}
      help={FACTOR_TEXT[key].help[s.useCase]} hint={FACTOR_TEXT[key].hint} descriptions={FACTOR_TEXT[key].descriptions} />
  );

  return (
    <div>
      <div style={card()}>
        <div style={sectionLabel(C.purple)}>Objekttyp</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {Object.entries(PROPERTY_TYPE_TEXT).map(([key, t]) => (
            <button key={key} aria-pressed={s.propertyType === key} onClick={() => set("propertyType", key)}
              style={{ ...chip(s.propertyType === key, C.purple), whiteSpace: "nowrap" }}>{t.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: C.sec, lineHeight: 1.6, padding: "10px 12px", background: C.card2, borderRadius: 6 }}>
          {PROPERTY_TYPE_TEXT[s.propertyType].desc}
          <div style={{ marginTop: 6, fontSize: 13, color: C.mut }}>
            Grundrate real: <span style={{ color: C.text, fontFamily: MONO, fontWeight: 600 }}>{fmtPct(type.anchor)} p.a.</span>
            {" · "}Abwärtsrisiko: <span style={{ color: type.risk > 1.05 ? C.red : type.risk < 0.97 ? C.green : C.sec, fontWeight: 600 }}>{riskLabel(type.risk)}</span>
          </div>
        </div>
      </div>

      <div style={card()}>
        <div style={sectionLabel(C.teal)}>Markt & Lage</div>
        {["supplyDemand", "locationMomentum", "locationAmenities"].map(factor)}
      </div>

      <div style={card()}>
        <div style={sectionLabel(C.green)}>Objekt & Regulierung</div>
        {["propertyQuality", "regulatoryRisk"].map(factor)}
      </div>

      <div style={card()}>
        <div style={sectionLabel(C.amber)}>Makro-Umfeld (gilt für jedes Objekt) · Stand {M.asOf}</div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
            <span style={{ fontSize: 15, color: C.text, fontWeight: 600 }}>Zinsentwicklung</span>
            <span style={{ fontSize: 13, color: C.accent, fontWeight: 600, fontFamily: MONO }}>{s.interestOutlook}/5</span>
          </div>
          <div style={{ fontSize: 13, color: C.mut, marginBottom: 10, lineHeight: 1.6 }}>
            Bauzinsen 10 J. aktuell {M.mortgage10y}, EZB-Einlagezins {M.ecbDeposit}. {M.ecbNote} Zinsänderungen wirken als einmaliger Preissprung (≈ −5 % pro +1 %-Punkt), nicht als Dauereffekt.
          </div>
          <div role="radiogroup" aria-label="Zinsentwicklung" style={{ display: "flex", gap: 5 }}>
            {INTEREST_OPTIONS.map(o => {
              const active = s.interestOutlook === o.score;
              const col = o.score <= 2 ? C.red : o.score === 3 ? C.amber : C.green;
              return (
                <button key={o.score} role="radio" aria-checked={active} onClick={() => set("interestOutlook", o.score)} style={{
                  flex: 1, padding: "9px 4px", borderRadius: 7, textAlign: "center", cursor: "pointer",
                  border: active ? `2px solid ${col}` : `1px solid ${C.border}`, background: active ? col + "1A" : C.card2,
                }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: active ? col : C.mut, fontFamily: MONO }}>{o.arrow}</div>
                  <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? col : C.sec, marginTop: 2 }}>{o.label}</div>
                  <div style={{ fontSize: 12, color: C.mut, marginTop: 2, fontFamily: MONO }}>{o.sub}</div>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: C.mut, marginTop: 6 }}>3 = Standard. Nur mit starker, begründeter Überzeugung ändern.</div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
            <span style={{ fontSize: 15, color: C.text, fontWeight: 600 }}>Inflationsannahme (Ø über Haltedauer)</span>
            <span style={{ fontSize: 15, fontFamily: MONO, color: C.amber }}>{fmtPct(s.inflation, false)}</span>
          </div>
          <div style={{ fontSize: 13, color: C.mut, marginBottom: 10, lineHeight: 1.6 }}>
            Beeinflusst nur die nominalen Werte. Aktuell {M.inflationNow}, 10-Jahres-Ø {M.inflationAvg10y}, EZB-Ziel 2 %.
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {INFLATION_OPTIONS.map(v => (
              <button key={v} aria-pressed={s.inflation === v} onClick={() => set("inflation", v)}
                style={{ ...chip(s.inflation === v, C.amber), fontFamily: MONO }}>{fmtPct(v, false)}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={card()}>
        <div style={sectionLabel(C.sec)}>Beitrag zur realen Rate (p.a. über {result.years} J.)</div>
        <DivergingBar label="Grundrate Objekttyp" value={result.anchor} />
        {result.breakdown.map(b => (
          <DivergingBar key={b.key} label={FACTOR_TEXT[b.key]?.label ?? "Zinsentwicklung"} value={b.effect} />
        ))}
        {result.capped && (
          <div style={{ fontSize: 13, color: C.amber, marginTop: 6 }}>Deckel aktiv: Die Summe der Faktoren wurde begrenzt. Dauerhaft höhere Raten sind historisch nicht belegt.</div>
        )}
        <div style={{ marginTop: 12, padding: "9px 12px", background: C.card2, borderRadius: 7, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.sec }}>Einigkeit der Faktoren</span>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: MONO, color: result.agreement > 70 ? C.green : result.agreement > 45 ? C.amber : C.red }}>{result.agreement} %</span>
        </div>
        <div style={{ fontSize: 13, color: C.mut, marginTop: 6, lineHeight: 1.5 }}>
          {result.agreement > 70 ? "Faktoren zeigen in eine Richtung." : "Widersprüchliche Signale: Die obere Spanne wird breiter. Entscheidung nur auf den Bear-Case stützen."}
          {" "}Negative Faktoren verbreitern den Bear-Case.
        </div>
      </div>
    </div>
  );
}
