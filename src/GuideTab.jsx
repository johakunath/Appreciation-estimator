import { C, card } from "./theme.js";
import { PITFALLS, REFERENCE_DATA, FACTOR_TIPS } from "./content.js";

const title = color => ({ fontSize: 16, fontWeight: 700, color, marginBottom: 8 });
const body = { fontSize: 14, color: C.sec, lineHeight: 1.8 };
const strong = { color: C.text };

export default function GuideTab() {
  return (
    <div>
      <div style={card({ borderLeft: `4px solid ${C.teal}` })}>
        <div style={title(C.teal)}>Wie dieses Tool funktioniert</div>
        <div style={body}>
          <p style={{ marginBottom: 8 }}>Das Tool <strong style={strong}>prognostiziert keine Wertsteigerung</strong>. Es erzeugt eine begründbare Spanne aus drei Szenarien: <strong style={{ color: C.red }}>Bear</strong> = ungünstig, <strong style={{ color: C.accent }}>Base</strong> = mittel, <strong style={{ color: C.green }}>Bull</strong> = günstig. Bear und Bull entsprechen grob dem 10 %- und 90 %-Fall.</p>
          <p style={{ marginBottom: 8 }}><strong style={strong}>Start:</strong> eine reale Grundrate je Objekttyp (0,2–0,6 % p.a.). Langfristig sind deutsche Immobilienpreise real kaum gestiegen (1970–2025: +0,1 % p.a.).</p>
          <p style={{ marginBottom: 8 }}><strong style={strong}>Anpassung:</strong> Markt- und Lagefaktoren verschieben die Rate, ihre Wirkung lässt mit der Zeit nach. Zinsen wirken als einmaliger Preissprung. Ist-Zustand von Lage und Objekt steckt schon im Preis und wirkt vor allem auf das Risiko. Die Summe ist gedeckelt.</p>
          <p style={{ marginBottom: 8 }}><strong style={strong}>Spanne:</strong> hängt von der Haltedauer ab. Kurz = breit, weil ein einzelnes Objekt beim Verkauf stark vom Durchschnitt abweichen kann (±11–18 %). Nach unten breiter als nach oben.</p>
          <p><strong style={strong}>Ergebnis:</strong> real nach Kaufnebenkosten, Verkaufskosten und Sonderkosten. Kaufnebenkosten (Grunderwerbsteuer, Notar, Makler) sind weg, sobald du kaufst. Du startest damit im Minus.</p>
        </div>
      </div>

      <div style={card({ borderLeft: `4px solid ${C.red}` })}>
        <div style={title(C.red)}>Häufige Fallen</div>
        <div style={body}>
          {PITFALLS.map(([h, t], i) => (
            <p key={i} style={{ marginBottom: 7 }}><strong style={strong}>{i + 1}. {h}</strong> {t}</p>
          ))}
        </div>
      </div>

      <div style={card({ borderLeft: `4px solid ${C.green}` })}>
        <div style={title(C.green)}>Referenzwerte (historisch)</div>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <tbody>
            {REFERENCE_DATA.rows.map(([k, v], i) => (
              <tr key={i}>
                <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.border}`, color: C.sec }}>{k}</td>
                <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.border}`, color: C.text, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 12, color: C.mut, marginTop: 8, lineHeight: 1.5 }}>{REFERENCE_DATA.source}</p>
      </div>

      <div style={card({ borderLeft: `4px solid ${C.amber}` })}>
        <div style={title(C.amber)}>Bewertungs-Tipps je Faktor</div>
        {FACTOR_TIPS.map(([h, t], i) => (
          <div key={i} style={{ marginBottom: 10, padding: "8px 12px", background: C.card2, borderRadius: 7 }}>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 3, fontSize: 14 }}>{h}</div>
            <div style={{ fontSize: 13, color: C.mut, lineHeight: 1.6 }}>{t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
