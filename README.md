# Wertsteigerung Estimator

Scenario-based property appreciation estimator for German residential real estate.

Part of **Project Property** — a suite of AI-assisted tools for finding and evaluating residential property in Germany.

## What it does

Generates a defensible appreciation scenario range (bear/base/bull) based on six observable market factors + property type modifier. Designed for private investors and owner-occupiers who want structured thinking about appreciation without false precision.

**Key principle:** A deal must work at the bear case. If it only works at base or bull, it's speculation.

## Architecture

Single-page React app (Vite). No backend, no API calls, no external dependencies beyond React. All computation happens client-side.

### Scoring Engine

- **Input:** Inflation assumption + 6 factor scores (1-5) + property type
- **Factors:** Supply/Demand (28%), Location Momentum (20%), Location Amenities (12%), Property Quality (15%), Regulatory Climate (12%), Interest Rate Outlook (13%)
- **Output:** Bear/Base/Bull rates (nominal + real), uncertainty spread, signal coherence score
- **Property type modifier:** Adjusts base rate by -0.4% to +0.5% depending on type (e.g., new build +0.5%, unrenovated -0.4%)

### UI Modes

- **Kapitalanlage (Investment):** Decision guidance focused on cashflow vs. appreciation trade-off
- **Eigennutzung (Owner-occupied):** Decision guidance focused on rent savings and wealth building

## Project Property Tool Suite

This estimator works alongside:

1. **Immobilien Screener** — listing extraction, GRY/cashflow screening, pipeline management
2. **Capital Allocation Simulator** — buy vs. rent vs. invest scenario modeling over 30 years
3. **Wertsteigerung Estimator** (this tool) — appreciation scenario estimation

**Workflow:** Screen (GRY/cashflow) → Estimate Appreciation → Simulate long-term capital allocation

## Development

```bash
npm install
npm run dev
```

## Defaults

- Inflation: 2.3% (German 10-year average 2015-2025)
- Berlin regulatory climate: 2 (restrictive)
- Supply/Demand Berlin: 4 (undersupply)
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
|---------|------|------|------|
| ETW Innenstadt Bestand | 1% | 3% | 4.5% |
| ETW Randlage Bestand | 0% | 2% | 4% |
| ETW Neubau (EPC A/B) | 2% | 4% | 6% |
| Altbau unsaniert | -1% | 1.5% | 3% |
| Einfamilienhaus | 1% | 3% | 5% |
| DHH / Reihenhaus | 0.5% | 2.5% | 4.5% |

Based on Guthmann, JLL, CBRE, Investropa market reports (early 2026). Nominal rates.
