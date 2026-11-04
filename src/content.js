/* All UI text and dated market facts. Update MARKET_SNAPSHOT at least yearly (see AGENTS.md). */

export const MARKET_SNAPSHOT = {
  asOf: "November 2026",
  inflationNow: "2,8 % (Okt. 2026)",
  inflationAvg10y: "2,4–2,6 %",
  ecbDeposit: "2,50 %",
  ecbNote: "8 Senkungen Juni 2024 – Juni 2025 auf 2,00 %, dann Erhöhungen im Juni und Sept. 2026 auf 2,50 %.",
  mortgage10y: "~4,0–4,5 %",
  sources: "Destatis, EZB, Interhyp, Dr. Klein",
};

export const DEFAULTS = {
  inflation: 2.5,
  propertyType: "apartment_standard",
  supplyDemand: 4,
  locationMomentum: 3,
  locationAmenities: 3,
  propertyQuality: 3,
  regulatoryRisk: 2,
  interestOutlook: 3,
  price: 350000,
  years: 15,
  knkPct: 11,
  sellPct: 3.57,
  capex: 0,
  useCase: "investment",
};

export const INFLATION_OPTIONS = [1.5, 2.0, 2.3, 2.5, 2.8, 3.0, 3.5];

export const PROPERTY_TYPE_TEXT = {
  apartment_standard: { label: "ETW Bestand (gepflegt)", desc: "Gepflegter Zustand, keine größeren Mängel. Das liquideste Segment mit den meisten Vergleichsdaten." },
  apartment_renovated: { label: "ETW modernisiert", desc: "Neue Bäder, Küche, Böden, Energieklasse B/C. Die Modernisierung steckt schon im Kaufpreis, bringt also keine höhere Wertsteigerung, aber weniger Risiko." },
  apartment_unrenovated: { label: "ETW unsaniert", desc: "Veraltete Ausstattung, Energieklasse F–H. Ohne Investition verliert das Objekt relativ an Wert. Sanierungskosten unten als Sonderkosten eintragen." },
  apartment_newbuild: { label: "ETW Neubau", desc: "Erstbezug oder max. 5 Jahre. Berlin 2025: Neubau ~8.100 €/m² vs. Bestand ~5.500 €/m². Dieser Aufschlag schrumpft mit dem Alter. Dafür im Abschwung stabiler (2022/23: −5 % statt −12 %)." },
  altbau_renovated: { label: "Altbau saniert", desc: "Vor 1949, kernsaniert: Leitungen, Fenster, Heizung neu. Beliebt, hoher Bodenwertanteil in guten Lagen." },
  altbau_unrenovated: { label: "Altbau unsaniert", desc: "Vor 1949, nicht saniert. Gas-Etagenheizung, alte Fenster, Energieklasse F–H. Heizungsgesetz (GEG) kann teuren Austausch erzwingen. Kosten unten eintragen." },
  house_detached: { label: "Einfamilienhaus", desc: "Freistehend. Hoher Grundstücksanteil stützt den Wert, aber weniger liquide (längere Verkaufszeit) und höhere Instandhaltung." },
  house_semi: { label: "DHH / Reihenhaus", desc: "Doppelhaushälfte oder Reihenhaus. Balance aus Grundstückswert und Bezahlbarkeit, Familien-Nachfrage in Randlagen." },
};

export const FACTOR_TEXT = {
  supplyDemand: {
    label: "Angebot & Nachfrage",
    help: { investment: "Wie knapp sind Wohnungen im konkreten Gebiet? Prüfe Vermarktungsdauer auf ImmoScout, Leerstand und Neubau.", selfuse: "Wie knapp sind Wohnungen im konkreten Gebiet? Prüfe Vermarktungsdauer auf ImmoScout, Leerstand und Neubau." },
    descriptions: [
      "Überangebot: Inserate stehen monatelang, viel Neubau, Abwanderung. Strukturschwache Regionen.",
      "Weiche Nachfrage: einige Leerstände, Käufer haben Auswahl, Mieten stagnieren. Vermarktung >60 Tage.",
      "Ausgeglichen: normaler Umsatz, keine extremen Preisbewegungen. Vermarktung 30–60 Tage.",
      "Knapp: Leerstand <1 %, Mieten steigen, aber Kaufkraft und Zinsen bremsen die Preise. Berlin gesamt (Leerstand 0,3 %).",
      "Extremer Mangel + kaufkräftige Nachfrage: Bieterverfahren, Vermarktung <30 Tage, Preise steigen trotz hoher Zinsen. Top-Lagen, München.",
    ],
  },
  locationMomentum: {
    label: "Lage-Dynamik (Veränderung)",
    help: { investment: "Wird der Kiez in den nächsten Jahren gefragter? Wirkung lässt mit der Zeit nach.", selfuse: "Wie entwickelt sich die Lebensqualität hier? Wirkung lässt mit der Zeit nach." },
    descriptions: [
      "Absteigend: Geschäfte schließen, Infrastruktur verfällt, junge Leute ziehen weg.",
      "Stagnierend: keine wesentliche Veränderung, kein neues Geld fließt rein.",
      "Stabil: etabliertes Viertel, keine aktive Aufwertung, aber solide Basis.",
      "Aufsteigend: neue Gastronomie und Läden, ÖPNV-Ausbau im Bau, Zuzug. Mieten über Stadtdurchschnitt.",
      "Starker Aufschwung: großes Projekt im Bau (U-Bahn, Campus, Quartier), z. B. Adlershof, Schumacher Quartier (Tegel).",
    ],
  },
  locationAmenities: {
    label: "Lage-Infrastruktur (Ist-Zustand)",
    hint: "Was heute da ist, steckt schon im Preis. Wirkt vor allem auf das Risiko (Bear-Case), kaum auf die Wertsteigerung.",
    help: { investment: "Gute Infrastruktur = stabilere Mieter, weniger Leerstand, bessere Werterhaltung im Abschwung.", selfuse: "Was ist JETZT da? Kita, Schulen, Kinderarzt, Spielplätze, ÖPNV." },
    descriptions: [
      "Mangelhaft: kein Supermarkt fußläufig, >15 Min. zur U/S-Bahn, keine Kita nah, kein Grün.",
      "Grundversorgung: ein Supermarkt, Bus, wenige Kitas mit langen Wartelisten.",
      "Durchschnitt: Supermarkt und Bäcker fußläufig, U/S-Bahn <10 Min., Kitas und Grundschulen, Park in der Nähe.",
      "Gut: mehrere Einkaufsmöglichkeiten, sehr guter ÖPNV, Kita-Auswahl, gute Schulen, Kinderarzt, Parks.",
      "Hervorragend: alles fußläufig, ÖPNV-Knotenpunkt, Kita ohne Wartezeit, angesehene Schulen, großer Park.",
    ],
  },
  propertyQuality: {
    label: "Objektqualität & Ausstattung",
    hint: "Steckt schon im Preis. Wirkt vor allem auf das Risiko: gute Objekte altern langsamer und verkaufen sich auch im Abschwung.",
    help: { investment: "Energieklasse, Zustand, Hausgeld, Rücklage, Grundriss. 40–80 m² und 2–3 Zimmer sind am leichtesten verkäuflich.", selfuse: "Energieklasse, Zustand, Hausgeld, Rücklage, Grundriss. 40–80 m² und 2–3 Zimmer sind am leichtesten verkäuflich." },
    descriptions: [
      "Schlecht: Energieklasse G/H, alte Heizung, hohes Hausgeld, niedrige Rücklage, ungünstiger Schnitt. Sonderumlage wahrscheinlich.",
      "Unterdurchschnittlich: teilsaniert, Energieklasse E/F, einiges veraltet, mittelfristig Investitionen nötig.",
      "Durchschnitt: funktional, Energieklasse C/D, Hausgeld im Rahmen, gängige Größe, Balkon vorhanden.",
      "Gut: gepflegt, Energieklasse B/C, moderne Heizung, Aufzug, guter Grundriss, gute Rücklage.",
      "Hervorragend: Energieklasse A, Top-Schnitt, Fußbodenheizung, 2 Bäder, große Terrasse, niedrige Nebenkosten.",
    ],
  },
  regulatoryRisk: {
    label: "Regulatorisches Umfeld",
    help: { investment: "Regulierung begrenzt Mietsteigerungen und damit indirekt die Wertsteigerung. Berlin: Mietpreisbremse bis 2029, Umwandlungsverbot bis 2030.", selfuse: "Bei Eigennutzung weniger relevant, aber Milieuschutz kann Modernisierung erschweren und den Wiederverkauf an Anleger." },
    descriptions: [
      "Sehr restriktiv: Milieuschutzgebiet (Berlin: 82 Gebiete) + Umwandlungsverbot + Mietpreisbremse, dazu politisches Risiko (Vergesellschaftung, Mietendeckel-Debatte).",
      "Restriktiv: Mietpreisbremse, Kappungsgrenze 15 %/3 J., Umwandlungsverbot. Berlin außerhalb von Milieuschutz.",
      "Moderat: Mietpreisbremse und Kappungsgrenze, kein Umwandlungsverbot, politisch stabil. Viele andere Großstädte.",
      "Günstig: keine Mietpreisbremse, Kappungsgrenze 20 %. Mittelstädte ohne angespannten Markt.",
      "Sehr günstig: nur gesetzliches Minimum, Mieterhöhungen voll ausschöpfbar, politisch stabil.",
    ],
  },
};

export const INTEREST_OPTIONS = [
  { score: 1, label: "Steigen stark", arrow: "↑↑", sub: "→ 5,5 %+" },
  { score: 2, label: "Steigen leicht", arrow: "↑", sub: "→ ~5 %" },
  { score: 3, label: "Stabil", arrow: "→", sub: "4–4,5 %" },
  { score: 4, label: "Sinken leicht", arrow: "↓", sub: "→ ~3,5 %" },
  { score: 5, label: "Sinken stark", arrow: "↓↓", sub: "→ <3 %" },
];

export const SCENARIO_TEXT = {
  bear: { label: "Bear", plain: "ungünstig" },
  base: { label: "Base", plain: "mittel" },
  bull: { label: "Bull", plain: "günstig" },
};

export const DECISION_TEXT = {
  investment: {
    good: { title: "Wertsteigerung trägt auch im Bear-Case", text: "Selbst im ungünstigen Szenario bleibt real nach allen Kosten ein Plus. Wertsteigerung ist ein sinnvoller Ertrag neben dem Cashflow." },
    warn: { title: "Wertsteigerung trägt nur im Base-Case", text: "Im Bear-Case realer Verlust nach Kosten. Der Deal muss über Cashflow und Steuervorteile funktionieren. Nicht zu stark hebeln." },
    bad: { title: "Wertsteigerung deckt nicht einmal im Base-Case die Kosten", text: "Kaufnebenkosten und Verkaufskosten werden real erst nach langer Zeit oder gar nicht wieder eingespielt. Rechtfertigung nur über Cashflow. Wertsteigerung ist kein Argument." },
  },
  selfuse: {
    good: { title: "Vermögensaufbau auch im Bear-Case", text: "Selbst im ungünstigen Szenario bleibt real nach allen Kosten ein Plus. Neben dem Wohnwert baut die Immobilie Vermögen auf." },
    warn: { title: "Vermögensaufbau nur im Base-Case", text: "Im Bear-Case realer Verlust nach Kosten. Entscheidend ist, wie sich Rate plus Hausgeld zur heutigen Miete verhält. Dein Return ist primär die gesparte Miete." },
    bad: { title: "Wertsteigerung deckt die Kaufkosten nicht", text: "Real wird über die Haltedauer kein Vermögen über den Wert aufgebaut. Kauf lohnt sich nur, wenn die Wohnkosten im Vergleich zur Miete passen oder Sicherheit/Wohnwert den Ausschlag geben." },
  },
};

export const PITFALLS = [
  ["Boom extrapolieren.", "2014–2022 stiegen Berliner Wohnungspreise um rund 10 % p.a. (GREIX), getragen von fallenden Zinsen. Das war ein einmaliger Zinszyklus."],
  ["Nominal ≠ Real.", "Bei 2,5 % Inflation ist 2,5 % Wertsteigerung real null Gewinn. Das Tool zeigt deshalb das reale Ergebnis zuerst."],
  ["Nebenkosten vergessen.", "~11 % Kaufnebenkosten plus ~3,6 % Maklerkosten beim Verkauf: Über 15 Jahre braucht es ~0,9 % reale Wertsteigerung p.a. nur zum Ausgleich, über 5 Jahre ~2,9 %."],
  ["Bestätigungsfehler.", "Beide Partner bewerten unabhängig, dann vergleichen. Link kopieren und teilen."],
  ["Instandhaltung ignorieren.", "Die Raten gelten für ein instand gehaltenes Objekt. Laufende Instandhaltung (~1–1,5 % des Gebäudewerts p.a.), Heizungstausch oder Sonderumlage kommen dazu."],
  ["Zinssensitivität.", "Berlin-Wohnungspreise fielen 2022–24 trotz steigender Mieten um ~8 % nominal, real ~17 %, vor allem wegen der höheren Zinsen."],
  ["Neubau-Aufschlag.", "Neubau kostet in Berlin ~45 % mehr pro m² als Bestand. Dieser Aufschlag schmilzt mit dem Alter des Gebäudes."],
  ["Spekulationsfrist.", "Kapitalanlage: Verkauf vor 10 Jahren ist einkommensteuerpflichtig (§23 EStG), bereits genutzte Abschreibung (AfA) erhöht den Gewinn."],
];

export const REFERENCE_DATA = {
  rows: [
    ["Berlin ETW Ø €/m² (Gutachterausschuss)", "2023 −6 %, 2024 −1 %, 2025 +5 %, H1 2026 +1 %"],
    ["Berlin ETW GREIX (ggü. Vorjahr)", "Q1 2025 +2,9 %, Q4 2025 −0,2 %, Q1 2026 −2,0 %"],
    ["Rückgang Berlin ETW 2022–24", "~−8 % nominal, ~−17 % real"],
    ["Deutschland real p.a. 1970–2025", "+0,1 %"],
    ["Deutschland real p.a. 1995–2009", "−1,8 %"],
    ["Deutschland real p.a. 2009–2022", "+3,3 %"],
    ["Deutschland, 15-Jahres-Zeiträume real", "−1,8 % bis +2,9 % p.a."],
    ["Konsens Deutschland 2026–28 (Reuters, März 2026)", "~+3 % p.a. nominal (vor den Zinserhöhungen)"],
  ],
  source: "Quellen: Gutachterausschuss Berlin, GREIX (Kiel Institut), BIS/FRED, Reuters. Stand November 2026. Details: docs/REVIEW-2026-11.md.",
};

export const FACTOR_TIPS = [
  ["Angebot & Nachfrage", "Vermarktungsdauer auf ImmoScout, Leerstand (Amt für Statistik), Baugenehmigungen im PLZ. Berlin gesamt: 4."],
  ["Lage-Dynamik", "BVG-Ausbaupläne, Gewerbeanmeldungen, Mietspiegel-Entwicklung. Adlershof = 4–5, Charlottenburg = 3."],
  ["Lage-Infrastruktur", "Supermarkt <5 Min., U/S-Bahn <10 Min., Kita <10 Min., Spielplatz <5 Min., Kinderarzt <15 Min."],
  ["Objektqualität", "Energieausweis, Hausgeld pro m², Rücklage der Eigentümergemeinschaft (WEG-Protokolle), Grundriss, Etage + Aufzug, Balkon."],
  ["Regulatorik", "Milieuschutz-Karte (Senatsverwaltung Stadtentwicklung). In Milieuschutz = 1, sonst Berlin = 2. Nach der Wahl 2026 eher vorsichtig bewerten."],
  ["Zinsentwicklung", "EZB-Ausblick, Interhyp-Zinscharts. 3 als Standard, außer du hast eine starke, begründete Überzeugung."],
];
