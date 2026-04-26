# CLAUDE.md — Wertsteigerung Estimator

## Project

Wertsteigerung Estimator — scenario-based property appreciation estimator for German residential real estate. Part of **Project Property**, a personal tool suite for finding and buying property in Berlin.

## Owner

Johannes (Berlin-based, searches with partner Marina). Both are private investors / owner-occupier buyers, not professionals. Marina is less technical — UX must be intuitive without real estate jargon knowledge.

## What it does

Generates a defensible appreciation scenario range (bear/base/bull) based on six observable market factors + property type modifier. For private investors and owner-occupiers who want structured thinking about appreciation without false precision.

**Key principle:** A deal must work at the bear case. If it only works at base or bull, it's speculation.

## Tech Stack

- Vite + React 18 (single-page app)
- GitHub Actions → GitHub Pages (deploy via `.github/workflows/deploy.yml`)
- No external UI libraries — all custom components, inline styles
- No backend, no API, no database — pure client-side computation
- Dark mode UI with JetBrains Mono for numbers, DM Sans for text

## Design System

Colors defined in `C` object at top of `src/App.jsx`:
- Background: `#121620`, Cards: `#1A1F2E`
- Accent: `#4A9EFF` (blue), Amber: `#F0B429`, Green: `#34D399`, Red: `#F0506A`
- Text large enough for half-screen desktop use (min 13px body, 15px labels)
- All numbers use monospace font (`JetBrains Mono`)
- German-language UI throughout (except "Bear/Base/Bull" which stay English)

## Key Design Principles

1. **Never a point estimate** — always bear/base/bull scenario range
2. **Bear case rule** — a deal must work at bear case; base/bull is bonus
3. **No false precision** — avoid over-fitting, acknowledge uncertainty
4. **Uncertainty widens with extreme/contradictory inputs** — intentional
5. **Anti-optimism bias** — tool should make users more cautious, not more confident
6. **Both use cases** — Kapitalanlage (investment) and Eigennutzung (owner-occupied) with adapted guidance

## Scoring Engine

Located in `computeAppreciation()` in `src/App.jsx`. Six factors:

| Factor | Weight | Score 1 delta | Score 5 delta |
|---|---|---|---|
| Angebot & Nachfrage (Supply/Demand) | 28% | −1.5% | +1.5% |
| Lage-Dynamik (Location Momentum) | 20% | −1.0% | +1.2% |
| Lage-Infrastruktur (Location Amenities) | 12% | −0.6% | +0.6% |
| Objektqualität (Property Quality) | 15% | −0.8% | +0.8% |
| Regulatorik (Regulatory Climate) | 12% | −0.8% | +0.6% |
| Zinsentwicklung (Interest Rate Outlook) | 13% | −1.2% | +1.0% |

Property type modifier adjusts base rate: −0.4% (unrenovated) to +0.5% (new build).

Output: Bear/Base/Bull rates (nominal + real), uncertainty spread, signal coherence score.

## UI Modes

- **Kapitalanlage (Investment):** Decision guidance on cashflow vs. appreciation trade-off
- **Eigennutzung (Owner-occupied):** Decision guidance on rent savings and wealth building

## File Structure

```
src/
  main.jsx      — React entry point
  App.jsx       — entire app (~600 lines, single component)
.github/
  workflows/
    deploy.yml  — GitHub Actions: build + deploy to GitHub Pages
```

## Commands

```bash
npm install
npm run dev      # dev server on :5173
npm run build    # production build → dist/
npm run preview  # preview production build
```

## Defaults

- Inflation: 2.3% (German 10-year average 2015–2025)
- Supply/Demand Berlin: 4 (undersupply)
- Regulatory Berlin: 2 (restrictive)
- All other factors: 3 (neutral)

## Data Sources for Factor Scoring

- **Supply/Demand:** ImmoScout listing duration, Amt für Statistik Berlin-Brandenburg vacancy rates, building permits by PLZ
- **Location Momentum:** BVG infrastructure plans, Mietspiegel trajectory, commercial development
- **Location Amenities:** Kita-Navigator Berlin, school quality data, Google Maps proximity analysis
- **Property Quality:** Energieausweis, WEG protocols, Hausgeld per m²
- **Regulatory:** Berlin Milieuschutz map (Stadtentwicklung), Umwandlungsverbot status
- **Interest Rates:** ECB forward guidance, Interhyp rate tracker, Euribor futures

## Benchmark Rates Berlin (2026)

| Segment | Bear | Base | Bull |
|---|---|---|---|
| ETW Innenstadt Bestand | 1% | 3% | 4.5% |
| ETW Randlage Bestand | 0% | 2% | 4% |
| ETW Neubau (EPC A/B) | 2% | 4% | 6% |
| Altbau unsaniert | −1% | 1.5% | 3% |
| Einfamilienhaus | 1% | 3% | 5% |
| DHH / Reihenhaus | 0.5% | 2.5% | 4.5% |

Nominal rates. Source: Guthmann, JLL, CBRE, Investropa (early 2026).

## Related Tools (Project Property suite, separate repos)

- **Immobilien Screener** — listing extraction, GRY/cashflow screening, pipeline
- **Capital Allocation Simulator** — buy vs. rent vs. invest over 30 years
- **Workflow:** Screen (GRY/cashflow) → Estimate Appreciation → Simulate long-term capital allocation
- All share the same dark mode design system and German-language UI

## Common Tasks

- Adding property types: update `PROPERTY_TYPE_MODS` object
- Adjusting factor weights: update `factors` array in `computeAppreciation()`
- Changing delta ranges: update `delta` arrays (index 0–4 maps to score 1–5)
- UI text changes: all strings are inline in JSX (no i18n system)
- Adding factors: add to `factors` array, update `scores` array for coherence calc

## Things NOT to Do

- Don't add a single-number appreciation score — the whole point is scenario ranges
- Don't add localStorage — not supported in Claude.ai artifact rendering
- Don't add external API calls for market data — this is a judgment tool, not a data feed
- Don't over-complicate — max 6–7 input factors, not 20
