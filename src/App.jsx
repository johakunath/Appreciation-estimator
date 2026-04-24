import { useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   WERTSTEIGERUNG · APPRECIATION ESTIMATOR v3
   ═══════════════════════════════════════════════════════════════════════════ */

const C = {
  bg: "#121620",
  card: "#1A1F2E",
  card2: "#222838",
  border: "#2A3148",
  text: "#E4E8F0",
  sec: "#98A2B8",
  mut: "#6B7690",
  accent: "#4A9EFF",
  amber: "#F0B429",
  green: "#34D399",
  red: "#F0506A",
  purple: "#A78BFA",
  teal: "#38BCC8",
};

/* ═══ PROPERTY TYPES ═══ */
const PROPERTY_TYPE_MODS = {
  apartment_standard: { label: "ETW Bestand (gepflegt)", mod: 0, desc: "Standard-Baseline. Gepflegter Zustand, funktional, keine größeren Mängel. Das liquideste Segment — die meisten Vergleichsdaten am Markt." },
  apartment_renovated: { label: "ETW modernisiert", mod: 0.3, desc: "Saniert oder umfassend modernisiert: neue Bäder, Küche, Böden, gute Energieklasse (B/C). Höherer Wiederverkaufswert, geringeres Instandhaltungsrisiko. Aufschlag ~0,3% p.a." },
  apartment_unrenovated: { label: "ETW unsaniert", mod: -0.4, desc: "Nicht renoviert, veraltete Ausstattung, schlechte Energieklasse (F-H). Wertsteigerung wird durch nötigen CapEx aufgefressen. Sanierungspotenzial als Upside nur für Profis. Abschlag -0,4% p.a." },
  apartment_newbuild: { label: "ETW Neubau", mod: 0.5, desc: "Erstbezug oder max. 5 Jahre alt. Top-Energieklasse, moderne Grundrisse, geringstes Instandhaltungsrisiko. Knappes Angebot treibt Preise. Aufschlag ~0,5% p.a." },
  altbau_renovated: { label: "Altbau saniert", mod: 0.1, desc: "Vor 1949, aber kernsaniert: neue Leitungen, Fenster, Heizung, guter Energieausweis. Charme-Premium in guten Lagen. Leichter Aufschlag +0,1% p.a." },
  altbau_unrenovated: { label: "Altbau unsaniert", mod: -0.3, desc: "Vor 1949, nicht saniert. Hohe Decken und Charme, aber Gas-Etagenheizung, alte Fenster, Energieklasse F-H. GEG-Risiko (Heizungstausch-Pflicht). Abschlag -0,3% p.a." },
  house_detached: { label: "Einfamilienhaus", mod: 0.3, desc: "Freistehend. Profitiert vom Grundstücksanteil und begrenztem Angebot. Aber weniger liquide (längere Verkaufszeit) und höhere Instandhaltung." },
  house_semi: { label: "DHH / Reihenhaus", mod: 0.15, desc: "Doppelhaushälfte oder Reihenhaus. Gute Balance aus Grundstückswert und Bezahlbarkeit. Moderate Wertsteigerung, besonders in Vorstadtlagen mit Familien-Nachfrage." },
};

/* ═══ SCORING ENGINE ═══ */

function computeAppreciation(inputs) {
  const { inflation, propertyType, supplyDemand, locationMomentum, locationAmenities, propertyQuality, regulatoryRisk, interestOutlook } = inputs;
  const typeMod = PROPERTY_TYPE_MODS[propertyType]?.mod || 0;

  const factors = [
    { name: "Angebot & Nachfrage", score: supplyDemand, weight: 0.28, delta: [-1.5, -0.5, 0, 0.8, 1.5] },
    { name: "Lage-Dynamik", score: locationMomentum, weight: 0.20, delta: [-1.0, -0.3, 0, 0.5, 1.2] },
    { name: "Lage-Infrastruktur", score: locationAmenities, weight: 0.12, delta: [-0.6, -0.2, 0, 0.3, 0.6] },
    { name: "Objektqualität", score: propertyQuality, weight: 0.15, delta: [-0.8, -0.3, 0, 0.4, 0.8] },
    { name: "Regulatorik", score: regulatoryRisk, weight: 0.12, delta: [-0.8, -0.3, 0, 0.3, 0.6] },
    { name: "Zinsentwicklung", score: interestOutlook, weight: 0.13, delta: [-1.2, -0.5, 0, 0.5, 1.0] },
  ];

  let totalDelta = 0, uncertaintySpread = 0;
  const breakdown = [];
  factors.forEach(f => {
    const d = f.delta[f.score - 1];
    totalDelta += d;
    uncertaintySpread += Math.abs(f.score - 3) * f.weight * 0.4;
    breakdown.push({ name: f.name, score: f.score, weight: f.weight, delta: d });
  });

  const baseRate = inflation + totalDelta + typeMod;
  const spread = Math.max(1.2, uncertaintySpread + 0.8);
  const bearRate = Math.max(-2, baseRate - spread);
  const bullRate = baseRate + spread;

  const scores = [supplyDemand, locationMomentum, locationAmenities, propertyQuality, regulatoryRisk, interestOutlook];
  const avg = scores.reduce((a, b) => a + b) / scores.length;
  const variance = scores.reduce((a, s) => a + Math.pow(s - avg, 2), 0) / scores.length;

  return {
    bearRate: Math.round(bearRate * 10) / 10,
    baseRate: Math.round(baseRate * 10) / 10,
    bullRate: Math.round(bullRate * 10) / 10,
    spread: Math.round(spread * 10) / 10,
    coherence: Math.max(0, Math.round(100 - variance * 18)),
    breakdown, typeMod,
    realBear: Math.round((bearRate - inflation) * 10) / 10,
    realBase: Math.round((baseRate - inflation) * 10) / 10,
    realBull: Math.round((bullRate - inflation) * 10) / 10,
  };
}

function projectValue(price, rate, years) {
  return Math.round(price * Math.pow(1 + rate / 100, years));
}

/* ═══ UI COMPONENTS ═══ */

function ScoreSelector({ label, value, onChange, descriptions, help }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <span style={{ fontSize: 15, color: C.text, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 13, color: C.accent, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{value}/5</span>
      </div>
      {help && <div style={{ fontSize: 13, color: C.mut, marginBottom: 8, lineHeight: 1.6 }}>{help}</div>}
      <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map(n => {
          const active = n === value;
          const col = n <= 2 ? C.red : n === 3 ? C.amber : C.green;
          return (
            <button key={n} onClick={() => onChange(n)} style={{
              flex: 1, height: 42, borderRadius: 7,
              border: active ? `2px solid ${col}` : `1px solid ${C.border}`,
              background: active ? col + "20" : C.card2,
              color: active ? col : C.mut,
              fontSize: 16, fontWeight: 700, cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
            }}>{n}</button>
          );
        })}
      </div>
      <div style={{ background: C.card2, borderRadius: 7, padding: "10px 12px" }}>
        {descriptions.map((d, i) => {
          const isActive = i + 1 === value;
          const col = (i + 1) <= 2 ? C.red : (i + 1) === 3 ? C.amber : C.green;
          return (
            <div key={i} style={{
              display: "flex", gap: 7, alignItems: "flex-start", padding: "4px 0",
              opacity: isActive ? 1 : 0.28,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: col, fontFamily: "'JetBrains Mono', monospace", minWidth: 16, textAlign: "right" }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: isActive ? C.text : C.sec, lineHeight: 1.5, fontWeight: isActive ? 600 : 400 }}>{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarIndicator({ value, min, max, color, label, weight }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 13, color: C.sec }}>{label}</span>
        <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color }}>
          {value > 0 ? "+" : ""}{value}%
          {weight > 0 && <span style={{ color: C.mut, marginLeft: 5 }}>({Math.round(weight * 100)}%)</span>}
        </span>
      </div>
      <div style={{ height: 7, background: C.card2, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}66, ${color})`, borderRadius: 4 }} />
      </div>
    </div>
  );
}

/* ═══ MAIN ═══ */

export default function App() {
  const [inflation, setInflation] = useState(2.3);
  const [propertyType, setPropertyType] = useState("apartment_standard");
  const [supplyDemand, setSupplyDemand] = useState(4);
  const [locationMomentum, setLocationMomentum] = useState(3);
  const [locationAmenities, setLocationAmenities] = useState(3);
  const [propertyQuality, setPropertyQuality] = useState(3);
  const [regulatoryRisk, setRegulatoryRisk] = useState(2);
  const [interestOutlook, setInterestOutlook] = useState(3);
  const [purchasePrice, setPurchasePrice] = useState(150000);
  const [projYears, setProjYears] = useState(15);
  const [tab, setTab] = useState("inputs");
  const [useCase, setUseCase] = useState("investment");

  const inputs = { inflation, propertyType, supplyDemand, locationMomentum, locationAmenities, propertyQuality, regulatoryRisk, interestOutlook };
  const result = useMemo(() => computeAppreciation(inputs), [JSON.stringify(inputs)]);

  const fmtK = n => n >= 1e6 ? `€${(n / 1e6).toFixed(2)}M` : n >= 1000 ? `€${(n / 1000).toFixed(0)}k` : `€${n}`;
  const fmtFull = n => `€${Math.round(n).toLocaleString("de-DE")}`;

  const bearVal = projectValue(purchasePrice, result.bearRate, projYears);
  const baseVal = projectValue(purchasePrice, result.baseRate, projYears);
  const bullVal = projectValue(purchasePrice, result.bullRate, projYears);
  const bearReal = projectValue(purchasePrice, result.realBear, projYears);
  const baseReal = projectValue(purchasePrice, result.realBase, projYears);
  const bullReal = projectValue(purchasePrice, result.realBull, projYears);
  const knkPct = 11;
  const knk = purchasePrice * knkPct / 100;

  const tabs = [
    { id: "inputs", label: "Bewertung" },
    { id: "results", label: "Szenarien" },
    { id: "guide", label: "Anleitung" },
  ];

  // Decision text
  const getDecision = () => {
    if (useCase === "investment") {
      if (result.realBase < 0.5) return { icon: "🔴", text: "Investment muss sich über Cashflow rechnen — nahezu keine reale Wertsteigerung. Wertgewinn ist Bonus, nicht Strategie." };
      if (result.realBear < 0) return { icon: "🟡", text: `Bear Case zeigt realen Wertverlust (${result.realBear}%). Funktioniert nur bei Base-Case oder besser. Nicht zu stark hebeln.` };
      if (result.realBear >= 0 && result.realBase >= 1) return { icon: "🟢", text: "Gute strukturelle Ausgangslage. Selbst der Bear Case erhält den realen Wert. Wertsteigerung als sinnvoller Ertrag neben Cashflow." };
      return { icon: "🟡", text: "Moderate Erwartung. Primär über Cashflow und Steuervorteile rechtfertigen. Wertsteigerung nicht als Hauptargument nutzen." };
    } else {
      if (result.realBase < 0.5) return { icon: "🟡", text: "Geringe reale Wertsteigerung. Für Eigennutzung weniger relevant — die gesparte Miete ist dein Return. Aber kein großer Vermögensaufbau über den Immobilienwert." };
      if (result.realBase >= 1) return { icon: "🟢", text: "Solide Wertsteigerung. Eigenheim baut neben Wohnwert auch Vermögen auf. Break-even vs. Mieten wird beschleunigt." };
      return { icon: "🟡", text: "Moderate Wertsteigerung. Für Eigennutzung zählt primär: Wie verhält sich die Rate zur bisherigen Miete?" };
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", background: C.bg, color: C.text, padding: "18px 16px", width: "100%", minHeight: "100vh", overflowY: "auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { border-color: ${C.accent} !important; outline: none; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
        button { font-family: inherit; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 10, color: C.teal, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 4 }}>Project Property</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em" }}>Wertsteigerung Estimator</h1>
        <div style={{ fontSize: 13, color: C.mut, marginTop: 4 }}>Szenario-basiert · Nie eine Punktschätzung</div>
      </div>

      {/* Quick Score Banner */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Bear", rate: result.bearRate, real: result.realBear, col: C.red },
          { label: "Base", rate: result.baseRate, real: result.realBase, col: C.accent, large: true },
          { label: "Bull", rate: result.bullRate, real: result.realBull, col: C.green },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, background: C.card, borderRadius: 9, padding: s.large ? "14px 10px" : "10px 8px",
            border: `1px solid ${C.border}`, textAlign: "center",
          }}>
            <div style={{ fontSize: 11, color: C.mut, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: s.large ? 26 : 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: s.col }}>{s.rate}%</div>
            <div style={{ fontSize: 12, color: C.mut, marginTop: 2 }}>{s.real}% real</div>
          </div>
        ))}
      </div>

      {/* Use case + tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 10, background: C.card, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
        {[{ id: "investment", label: "🏗️ Kapitalanlage" }, { id: "selfuse", label: "🏠 Eigennutzung" }].map(u => (
          <button key={u.id} onClick={() => setUseCase(u.id)} style={{
            flex: 1, padding: "8px 4px", borderRadius: 6, border: "none",
            background: useCase === u.id ? C.accent + "18" : "transparent",
            color: useCase === u.id ? C.accent : C.mut,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>{u.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 3, marginBottom: 16, background: C.card, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "9px 4px", borderRadius: 6, border: "none",
            background: tab === t.id ? C.card2 : "transparent",
            color: tab === t.id ? C.text : C.mut,
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ═══ INPUTS ═══ */}
      {tab === "inputs" && (
        <div>
          {/* Property Type */}
          <div style={{ background: C.card, borderRadius: 9, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.purple, marginBottom: 10 }}>Objekttyp</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
              {Object.entries(PROPERTY_TYPE_MODS).map(([key, val]) => {
                const active = propertyType === key;
                return (
                  <button key={key} onClick={() => setPropertyType(key)} style={{
                    padding: "7px 12px", borderRadius: 6,
                    border: active ? `2px solid ${C.purple}` : `1px solid ${C.border}`,
                    background: active ? C.purple + "18" : C.card2,
                    color: active ? C.purple : C.sec,
                    fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap",
                  }}>{val.label}</button>
                );
              })}
            </div>
            <div style={{ fontSize: 13, color: C.sec, lineHeight: 1.6, padding: "8px 10px", background: C.card2, borderRadius: 6 }}>
              {PROPERTY_TYPE_MODS[propertyType].desc}
              <div style={{ marginTop: 5, fontSize: 12, color: C.mut }}>
                Typ-Modifikator: <span style={{ color: PROPERTY_TYPE_MODS[propertyType].mod > 0 ? C.green : PROPERTY_TYPE_MODS[propertyType].mod < 0 ? C.red : C.sec, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                  {PROPERTY_TYPE_MODS[propertyType].mod > 0 ? "+" : ""}{PROPERTY_TYPE_MODS[propertyType].mod}% p.a.
                </span>
              </div>
            </div>
          </div>

          {/* Inflation */}
          <div style={{ background: C.card, borderRadius: 9, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 15, color: C.text, fontWeight: 600 }}>Inflationsannahme</span>
              <span style={{ fontSize: 15, fontFamily: "'JetBrains Mono', monospace", color: C.amber }}>{inflation}%</span>
            </div>
            <div style={{ fontSize: 13, color: C.mut, marginBottom: 10, lineHeight: 1.6 }}>
              Inflation = dein Basiswert. 10-Jahres-Ø Deutschland: 2,3% (inkl. 2022/23-Spitze). EZB-Ziel: 2%. Aktuell: ~1,9%.
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[1.5, 1.8, 2.0, 2.3, 2.5, 2.8, 3.0, 3.5].map(v => (
                <button key={v} onClick={() => setInflation(v)} style={{
                  padding: "7px 12px", borderRadius: 6,
                  border: inflation === v ? `2px solid ${C.amber}` : `1px solid ${C.border}`,
                  background: inflation === v ? C.amber + "18" : C.card2,
                  color: inflation === v ? C.amber : C.mut,
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                }}>{v}%</button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 12, color: C.mut }}>
              <span>← konservativ</span>
              <span style={{ color: C.amber }}>Ø 10J: 2,3%</span>
              <span>offensiv →</span>
            </div>
          </div>

          {/* Market Factors */}
          <div style={{ background: C.card, borderRadius: 9, padding: "16px 16px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.teal, marginBottom: 16 }}>Markt & Lage</div>

            <ScoreSelector label="Angebot & Nachfrage" value={supplyDemand} onChange={setSupplyDemand}
              help="Wie angespannt ist der Wohnungsmarkt im konkreten Gebiet? Prüfe ImmoScout-Vermarktungsdauer, Leerstandsquote und Baugenehmigungen."
              descriptions={[
                "Überangebot — Inserate stehen monatelang, Neubau-Pipeline voll, sinkende Nachfrage. Strukturschwache Regionen, Kleinstädte mit Abwanderung.",
                "Weiche Nachfrage — einige Leerstände, Käufer haben Auswahl. Mieten stagnieren. Vermarktungsdauer >60 Tage auf ImmoScout.",
                "Ausgeglichen — normaler Umsatz, keine extremen Preisbewegungen. Vermarktungsdauer 30-60 Tage.",
                "Unterangebot — Leerstand <2%, Bieterverfahren kommen vor, Mieten steigen 3-5% p.a. Vermarktungsdauer <30 Tage.",
                "Extremer Mangel — <1% Leerstand, mehrere Bewerber pro Wohnung, Neubau deckt max. 50-70% des Bedarfs. Berlin Innenstadt, München.",
              ]}
            />

            <ScoreSelector label="Lage-Dynamik (Veränderung)" value={locationMomentum} onChange={setLocationMomentum}
              help={useCase === "selfuse" ? "Wie entwickelt sich die Lebensqualität hier in den nächsten 10 Jahren?" : "Steigt die Nachfrage von Mietern und Käufern in diesem Kiez?"}
              descriptions={[
                "Absteigend — Geschäfte schließen, Infrastruktur verfällt, junge Leute ziehen weg. Keine Investitionen sichtbar.",
                "Stagnierend — keine wesentliche Veränderung. Der Kiez ist 'fertig' — kein neues Geld fließt rein.",
                "Stabil — etabliertes Viertel, hält seinen Wert. Keine aktive Aufwertung, aber solide Basis.",
                "Aufsteigend — neue Gastronomie/Shops, ÖPNV-Upgrades im Bau, junge Professionals ziehen zu. Mieten über Stadtdurchschnitt.",
                "Starker Aufschwung — großes Infrastrukturprojekt (U-Bahn, Tech-Campus, Quartiersentwicklung). Z.B. Adlershof, Tegel TXL.",
              ]}
            />

            <ScoreSelector label="Lage-Infrastruktur (Ist-Zustand)" value={locationAmenities} onChange={setLocationAmenities}
              help={useCase === "selfuse" ? "Was ist JETZT da? Besonders wichtig: Kita, Schulen, Kinderarzt, Spielplätze, ÖPNV." : "Gute Infrastruktur = stabilere Mieter, weniger Leerstand, bessere Werterhaltung."}
              descriptions={[
                "Mangelhaft — kein Supermarkt fußläufig, ÖPNV >15 Min. zur U/S-Bahn, keine Kita nah, keine Grünflächen.",
                "Grundversorgung — ein Supermarkt, Bus vorhanden, wenige Kitas (lange Wartelisten), begrenzte Angebote.",
                "Durchschnitt — Supermarkt, Bäcker fußläufig. U/S-Bahn <10 Min. Kitas und Grundschulen vorhanden. Park in der Nähe.",
                "Gut — mehrere Einkaufsmöglichkeiten, top ÖPNV, Kita-Auswahl, gute Schulen, Kinderarzt im Kiez, Parks, Gastro.",
                "Hervorragend — alles fußläufig: Biomarkt, ÖPNV-Knotenpunkt, Kita ohne Wartezeit, angesehene Schulen, großer Park.",
              ]}
            />
          </div>

          {/* Property & Regulation */}
          <div style={{ background: C.card, borderRadius: 9, padding: "16px 16px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.green, marginBottom: 16 }}>Objekt & Rahmenbedingungen</div>

            <ScoreSelector label="Objektqualität & Ausstattung" value={propertyQuality} onChange={setPropertyQuality}
              help={`Energieausweis, Sanierungsstand, Hausgeld, Ausstattung. Denke auch an: Wohnungsgröße (40-80m² = liquidestes Segment), Zimmerzahl (2-3 Zi = höchste Nachfrage), Etage (oben + Aufzug = Premium), Balkon/Terrasse, Anzahl Bäder (2 Bäder = Aufschlag bei 3+ Zi).`}
              descriptions={[
                "Schlecht — unsaniert, EPC G/H, alte Heizung, hohes Hausgeld, niedrige Rücklage. Ungünstige Größe oder Schnitt (z.B. <25m², kein Bad-Fenster, EG ohne Balkon, Durchgangszimmer). Sonder-Umlage wahrscheinlich.",
                "Unterdurchschnittlich — teilsaniert, EPC E/F, einige Systeme veraltet. Mittelfristig CapEx nötig. Okay-Schnitt, aber nichts Besonderes (kein Balkon, 1 Bad bei 3+ Zi, ungünstige Etage).",
                "Durchschnitt — funktional, typisch für Preisklasse. EPC C/D. Hausgeld im Rahmen. Gängige Größe (40-70m²), 2-3 Zimmer, Balkon oder Loggia vorhanden. Standard-Bad. Kein Aufzug nötig oder vorhanden.",
                "Gut — gepflegt, EPC B/C, moderne Heizung. Aufzug vorhanden. Guter Grundriss, Balkon, ggf. 2 Bäder bei größeren Wohnungen. 50-80m², beliebte Größe. Gute Rücklage.",
                "Hervorragend — Neubau/Kernsanierung, EPC A. Top-Schnitt, Fußbodenheizung, 2 Bäder, große Terrasse/Balkon, Aufzug, Keller. 50-100m² Sweet Spot. Niedrige Betriebskosten. Alles zeitgemäß.",
              ]}
            />

            <ScoreSelector label="Regulatorisches Umfeld" value={regulatoryRisk} onChange={setRegulatoryRisk}
              help={useCase === "selfuse" ? "Bei Eigennutzung weniger relevant, aber Milieuschutz kann Modernisierung erschweren." : "Starke Regulierung begrenzt Mietsteigerungen und damit indirekt die Wertsteigerung."}
              descriptions={[
                "Sehr restriktiv — Milieuschutz + Umwandlungsverbot + strenge Mietpreisbremse. Berlin Innenstadt (Kreuzberg, Neukölln, Friedrichshain).",
                "Restriktiv — Mietpreisbremse greift, Kappungsgrenze 15%/3J, teilweise Milieuschutz. Mieterhöhung möglich aber begrenzt.",
                "Moderat — Standard-Mietpreisbremse, Kappungsgrenze 20%/3J, kein Milieuschutz. Berliner Randlagen, mittelgroße Städte.",
                "Günstig — wenig Regulierung über Minimum hinaus. Gute Mietsteigerungsmöglichkeiten. Leipzig, Dresden, Uni-Städte.",
                "Sehr günstig — minimale Einschränkungen, freiere Mietpreisgestaltung. B/C-Standorte ohne Mietpreisbremse.",
              ]}
            />

            {/* Zinsentwicklung — HORIZONTAL compact */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                <span style={{ fontSize: 15, color: C.text, fontWeight: 600 }}>Zinsentwicklung</span>
                <span style={{ fontSize: 13, color: C.accent, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{interestOutlook}/5</span>
              </div>
              <div style={{ fontSize: 13, color: C.mut, marginBottom: 10, lineHeight: 1.6 }}>
                Niedrigere Zinsen → mehr Käufer → Preise steigen. EZB hat seit Juni 2024 die Zinsen 8× gesenkt. Bauzinsen aktuell ~3,5-4%.
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {[
                  { score: 1, label: "Steigen stark", icon: "📈", sub: "→ 5%+", col: C.red },
                  { score: 2, label: "Steigen leicht", icon: "↗️", sub: "→ 4-4,5%", col: C.red },
                  { score: 3, label: "Stabil", icon: "➡️", sub: "3,5-4%", col: C.amber },
                  { score: 4, label: "Sinken leicht", icon: "↘️", sub: "→ 3%", col: C.green },
                  { score: 5, label: "Sinken stark", icon: "📉", sub: "→ <2,5%", col: C.green },
                ].map(opt => {
                  const active = interestOutlook === opt.score;
                  return (
                    <button key={opt.score} onClick={() => setInterestOutlook(opt.score)} style={{
                      flex: 1, padding: "10px 4px", borderRadius: 7, textAlign: "center",
                      border: active ? `2px solid ${opt.col}` : `1px solid ${C.border}`,
                      background: active ? opt.col + "15" : C.card2,
                      cursor: "pointer", opacity: active ? 1 : 0.5,
                    }}>
                      <div style={{ fontSize: 20, lineHeight: 1, marginBottom: 4 }}>{opt.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? opt.col : C.sec, lineHeight: 1.3 }}>{opt.label}</div>
                      <div style={{ fontSize: 10, color: C.mut, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{opt.sub}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, color: C.mut, marginTop: 6, textAlign: "center" }}>
                {interestOutlook === 3 ? "Aktuell wahrscheinlichstes Szenario (Konsens der meisten Analysten)" :
                 interestOutlook < 3 ? "Steigende Zinsen bremsen die Immobilienpreise — wie 2022/23" :
                 "Sinkende Zinsen stützen Immobilienpreise — mehr Kaufnachfrage"}
              </div>
            </div>
          </div>

          {/* Factor breakdown */}
          <div style={{ background: C.card, borderRadius: 9, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.sec, marginBottom: 10 }}>Faktor-Beiträge</div>
            {result.breakdown.map((b, i) => (
              <BarIndicator key={i} label={b.name} value={b.delta} weight={b.weight} min={-2} max={2} color={b.delta < 0 ? C.red : b.delta > 0 ? C.green : C.sec} />
            ))}
            {result.typeMod !== 0 && <BarIndicator label="Objekttyp-Bonus" value={result.typeMod} weight={0} min={-2} max={2} color={result.typeMod > 0 ? C.purple : C.red} />}
            <div style={{ marginTop: 10, padding: "8px 10px", background: C.card2, borderRadius: 7, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: C.sec }}>Signal-Kohärenz</span>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: result.coherence > 70 ? C.green : result.coherence > 40 ? C.amber : C.red }}>{result.coherence}%</span>
            </div>
            <div style={{ fontSize: 12, color: C.mut, marginTop: 5, lineHeight: 1.5 }}>
              {result.coherence > 70 ? "Faktoren gleichgerichtet — enger Korridor, höhere Konfidenz." : result.coherence > 40 ? "Gemischte Signale — breite Spanne. Vorsicht bei Entscheidungen." : "Widersprüchliche Signale — sehr breite Unsicherheit. Nur Bear-Case für Entscheidungen nutzen."}
            </div>
          </div>
        </div>
      )}

      {/* ═══ RESULTS ═══ */}
      {tab === "results" && (
        <div>
          {/* Decision / Recommendation — AT THE TOP */}
          {(() => {
            const d = getDecision();
            return (
              <div style={{
                background: C.card, borderRadius: 9, padding: "14px 16px",
                border: `1px solid ${C.border}`,
                borderLeft: `4px solid ${d.icon === "🟢" ? C.green : d.icon === "🔴" ? C.red : C.amber}`,
                marginBottom: 14,
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: d.icon === "🟢" ? C.green : d.icon === "🔴" ? C.red : C.amber, marginBottom: 5 }}>
                  {d.icon} {useCase === "investment" ? "Investmententscheidung" : "Kaufentscheidung"}
                </div>
                <div style={{ fontSize: 14, color: C.sec, lineHeight: 1.7 }}>{d.text}</div>
              </div>
            );
          })()}

          {/* Projection inputs */}
          <div style={{ background: C.card, borderRadius: 9, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, color: C.sec, display: "block", marginBottom: 4 }}>Kaufpreis</label>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <input type="number" value={purchasePrice} step={5000} min={0} onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    style={{ flex: 1, padding: "8px 10px", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 15, fontFamily: "'JetBrains Mono', monospace" }} />
                  <span style={{ fontSize: 13, color: C.mut }}>€</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, color: C.sec, display: "block", marginBottom: 4 }}>Haltedauer</label>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <input type="number" value={projYears} step={1} min={1} max={40} onChange={e => setProjYears(parseInt(e.target.value) || 10)}
                    style={{ flex: 1, padding: "8px 10px", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 15, fontFamily: "'JetBrains Mono', monospace" }} />
                  <span style={{ fontSize: 13, color: C.mut }}>Jahre</span>
                </div>
              </div>
            </div>
          </div>

          {/* HORIZONTAL Scenario Cards */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Bear", rate: result.bearRate, realRate: result.realBear, nomVal: bearVal, realVal: bearReal, col: C.red, simLabel: "Pessimistisch" },
              { label: "Base", rate: result.baseRate, realRate: result.realBase, nomVal: baseVal, realVal: baseReal, col: C.accent, simLabel: "Base" },
              { label: "Bull", rate: result.bullRate, realRate: result.realBull, nomVal: bullVal, realVal: bullReal, col: C.green, simLabel: "Optimistisch" },
            ].map((s, i) => {
              const nomGain = s.nomVal - purchasePrice;
              const netGain = nomGain - knk;
              return (
                <div key={i} style={{
                  flex: 1, background: C.card, borderRadius: 9, padding: "14px 10px",
                  border: `1px solid ${C.border}`, borderTop: `3px solid ${s.col}`,
                  display: "flex", flexDirection: "column", alignItems: "center",
                }}>
                  <div style={{ fontSize: 12, color: s.col, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>

                  {/* HERO: annual rate */}
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: s.col, lineHeight: 1 }}>
                    {s.rate}%
                  </div>
                  <div style={{ fontSize: 12, color: C.mut, marginBottom: 10 }}>pro Jahr nominal</div>

                  {/* Real rate */}
                  <div style={{ fontSize: 16, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: C.sec }}>
                    {s.realRate}%
                  </div>
                  <div style={{ fontSize: 11, color: C.mut, marginBottom: 10 }}>pro Jahr real (kaufkraftbereinigt)</div>

                  {/* Divider */}
                  <div style={{ width: "100%", height: 1, background: C.border, marginBottom: 10 }} />

                  {/* Value after N years */}
                  <div style={{ fontSize: 11, color: C.mut, marginBottom: 2 }}>Wert nach {projYears}J (nominal)</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: C.text, marginBottom: 6 }}>
                    {fmtK(s.nomVal)}
                  </div>

                  <div style={{ fontSize: 11, color: C.mut, marginBottom: 2 }}>In heutiger Kaufkraft</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: C.sec, marginBottom: 6 }}>
                    {fmtK(s.realVal)}
                  </div>

                  <div style={{ width: "100%", height: 1, background: C.border, marginBottom: 8 }} />

                  {/* Net after KNK */}
                  <div style={{ fontSize: 11, color: C.mut, marginBottom: 2, textAlign: "center" }}>
                    Netto nach KNK
                    <span style={{ display: "block", fontSize: 10, color: C.mut }}>
                      (Kaufnebenkosten ~{knkPct}% = {fmtK(Math.round(knk))})
                    </span>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                    color: netGain >= 0 ? C.green : C.red, marginBottom: 6,
                  }}>
                    {netGain >= 0 ? "+" : ""}{fmtK(Math.round(netGain))}
                  </div>

                  <div style={{ fontSize: 11, color: C.mut }}>
                    Break-even: ~{s.rate > 0 ? Math.ceil(knkPct / s.rate) : "∞"} Jahre
                  </div>

                  {/* Simulator value */}
                  <div style={{ width: "100%", height: 1, background: C.border, margin: "8px 0" }} />
                  <div style={{ fontSize: 10, color: C.mut, marginBottom: 2 }}>→ Simulator-Wert</div>
                  <div style={{
                    padding: "4px 10px", borderRadius: 5, background: s.col + "15",
                    fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: s.col,
                  }}>
                    {s.rate}%
                  </div>
                  <div style={{ fontSize: 10, color: C.mut, marginTop: 2 }}>{s.simLabel}</div>
                </div>
              );
            })}
          </div>

          {/* Uncertainty spread */}
          <div style={{ background: C.card, borderRadius: 9, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.sec, marginBottom: 10 }}>
              Unsicherheitsspanne: ±{result.spread} Prozentpunkte
            </div>
            <div style={{ position: "relative", height: 48, marginBottom: 8 }}>
              <div style={{ position: "absolute", top: 20, left: 0, right: 0, height: 14, background: C.card2, borderRadius: 7 }} />
              {(() => {
                const scaleMin = -3, scaleMax = 8;
                const rMin = Math.max(scaleMin, result.bearRate);
                const rMax = Math.min(scaleMax, result.bullRate);
                const leftPct = ((rMin - scaleMin) / (scaleMax - scaleMin)) * 100;
                const widthPct = ((rMax - rMin) / (scaleMax - scaleMin)) * 100;
                const basePct = ((result.baseRate - scaleMin) / (scaleMax - scaleMin)) * 100;
                return (
                  <>
                    <div style={{ position: "absolute", top: 20, left: `${leftPct}%`, width: `${widthPct}%`, height: 14, background: `linear-gradient(90deg, ${C.red}55, ${C.accent}55, ${C.green}55)`, borderRadius: 7 }} />
                    <div style={{ position: "absolute", top: 15, left: `${basePct}%`, transform: "translateX(-50%)", width: 5, height: 24, background: C.accent, borderRadius: 3 }} />
                    <div style={{ position: "absolute", top: 0, left: `${basePct}%`, transform: "translateX(-50%)", fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: "'JetBrains Mono', monospace" }}>{result.baseRate}%</div>
                  </>
                );
              })()}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: C.red, fontFamily: "'JetBrains Mono', monospace" }}>{result.bearRate}%</span>
              <span style={{ fontSize: 12, color: C.green, fontFamily: "'JetBrains Mono', monospace" }}>{result.bullRate}%</span>
            </div>
          </div>

          {/* Decision rule */}
          <div style={{ background: C.card, borderRadius: 9, padding: "14px 16px", border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.purple}`, marginBottom: 14 }}>
            <div style={{ fontSize: 14, color: C.sec, lineHeight: 1.7 }}>
              <strong style={{ color: C.purple }}>Regel:</strong> Übertrage die Raten in den Capital Allocation Simulator. Ein Deal muss beim <strong style={{ color: C.red }}>Bear-Case</strong> funktionieren. Wenn er nur beim Base/Bull aufgeht, spekulierst du auf Wertsteigerung.
            </div>
          </div>
        </div>
      )}

      {/* ═══ GUIDE ═══ */}
      {tab === "guide" && (
        <div>
          <div style={{ background: C.card, borderRadius: 9, padding: "16px 16px", border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.teal}`, marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.teal, marginBottom: 8 }}>Wie dieses Tool funktioniert</div>
            <div style={{ fontSize: 14, color: C.sec, lineHeight: 1.8 }}>
              <p style={{ marginBottom: 8 }}>Dieses Tool <strong style={{ color: C.text }}>prognostiziert keine Wertsteigerung</strong>. Stattdessen generiert es eine <strong style={{ color: C.text }}>begründbare Szenario-Spanne</strong> aus beobachtbaren Marktbedingungen.</p>
              <p style={{ marginBottom: 8 }}>Die Basis-Rate startet bei deiner Inflationsannahme, dann +/- Anpassungen für sechs Faktoren + Objekttyp-Modifikator.</p>
              <p><strong style={{ color: C.text }}>KNK (Kaufnebenkosten)</strong> sind die Kosten beim Kauf: Grunderwerbsteuer (~6%), Notar (~1,5%), Makler (~3,5%) = ca. 11% in Berlin. Dieses Geld ist weg — kein Gegenwert. Du startest damit unter Wasser.</p>
            </div>
          </div>

          <div style={{ background: C.card, borderRadius: 9, padding: "16px 16px", border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.red}`, marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.red, marginBottom: 8 }}>Häufige Fallen</div>
            <div style={{ fontSize: 14, color: C.sec, lineHeight: 1.8 }}>
              <p style={{ marginBottom: 7 }}><strong style={{ color: C.text }}>1. Boom extrapolieren.</strong> CAGR 2015-2022 war 8-10% — einmaliger Zinszyklus. Nächste Dekade wird anders.</p>
              <p style={{ marginBottom: 7 }}><strong style={{ color: C.text }}>2. Nominal ≠ Real.</strong> Bei 2% Inflation ist 2% Wertsteigerung = null realer Gewinn.</p>
              <p style={{ marginBottom: 7 }}><strong style={{ color: C.text }}>3. KNK vergessen.</strong> 11% Kaufnebenkosten = 4 Jahre Break-even bei 3% Steigerung.</p>
              <p style={{ marginBottom: 7 }}><strong style={{ color: C.text }}>4. Bestätigungsfehler.</strong> Beide Partner unabhängig bewerten, dann vergleichen.</p>
              <p style={{ marginBottom: 7 }}><strong style={{ color: C.text }}>5. CapEx ignorieren.</strong> €30k Heizung + €15k Sonder-Umlage fressen die Brutto-Steigerung auf.</p>
              <p><strong style={{ color: C.text }}>6. Zinssensitivität.</strong> Berlin-Preise fielen 2022-24 trotz steigender Mieten — nur wegen höherer Zinsen.</p>
            </div>
          </div>

          <div style={{ background: C.card, borderRadius: 9, padding: "16px 16px", border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.green}`, marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.green, marginBottom: 8 }}>Benchmark-Raten Berlin (2026)</div>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr>{["Segment", "Bear", "Base", "Bull"].map((h, i) => (
                  <th key={i} style={{ textAlign: i === 0 ? "left" : "right", padding: "6px 8px", borderBottom: `1px solid ${C.border}`, color: [C.sec, C.red, C.accent, C.green][i], fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {[
                  ["ETW Innenstadt Bestand", "1%", "3%", "4,5%"],
                  ["ETW Randlage Bestand", "0%", "2%", "4%"],
                  ["ETW Neubau (EPC A/B)", "2%", "4%", "6%"],
                  ["Altbau unsaniert", "-1%", "1,5%", "3%"],
                  ["Einfamilienhaus", "1%", "3%", "5%"],
                  ["DHH / Reihenhaus", "0,5%", "2,5%", "4,5%"],
                ].map((row, i) => (
                  <tr key={i}>{row.map((v, j) => (
                    <td key={j} style={{ textAlign: j === 0 ? "left" : "right", padding: "6px 8px", borderBottom: `1px solid ${C.border}`, color: j === 0 ? C.sec : C.text, fontFamily: j > 0 ? "'JetBrains Mono', monospace" : undefined, fontSize: 13 }}>{v}</td>
                  ))}</tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 12, color: C.mut, marginTop: 8, fontStyle: "italic" }}>Nominale Raten. Richtwerte basierend auf Guthmann, JLL, CBRE, Investropa (Anfang 2026).</p>
          </div>

          <div style={{ background: C.card, borderRadius: 9, padding: "16px 16px", border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.amber}`, marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.amber, marginBottom: 8 }}>Bewertungs-Tipps je Faktor</div>
            <div style={{ fontSize: 14, color: C.sec, lineHeight: 1.8 }}>
              {[
                { title: "Angebot & Nachfrage (28%)", tips: "Prüfe: ImmoScout-Vermarktungsdauer, Leerstandsquote (Amt für Statistik), Baugenehmigungen im PLZ. Berlin gesamt: 4-5." },
                { title: "Lage-Dynamik (20%)", tips: "Prüfe: BVG-Ausbaupläne, neue Gewerbeanmeldungen, Mietspiegel-Entwicklung. Adlershof = 4-5. Charlottenburg = 3." },
                { title: "Lage-Infrastruktur (12%)", tips: "Checkliste: Supermarkt <5 Min, U/S-Bahn <10 Min, Kita <10 Min, Spielplatz <5 Min, Kinderarzt <15 Min." },
                { title: "Objektqualität (15%)", tips: "EPC-Klasse, Hausgeld/m², WEG-Rücklage, Grundriss, Etage+Aufzug, Balkon, Bäder. 40-80m² und 2-3 Zi = liquidestes Segment." },
                { title: "Regulatorik (12%)", tips: "Milieuschutz-Karte (Berlin Stadtentwicklung), Umwandlungsverbot, Mietspiegel-Situation. Berlin = 2, Leipzig/Dresden = 3-4." },
                { title: "Zinsentwicklung (13%)", tips: "EZB Forward Guidance, Interhyp Zinsbarometer. Score 3 als Default, außer du hast starke Überzeugung." },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 10, padding: "8px 12px", background: C.card2, borderRadius: 7 }}>
                  <div style={{ fontWeight: 700, color: C.text, marginBottom: 3, fontSize: 14 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: C.mut, lineHeight: 1.6 }}>{item.tips}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
