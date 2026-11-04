# AGENTS.md — Wertsteigerung Estimator

Instructions for any AI coding agent (Claude, Codex, Cursor, Copilot, Gemini). `CLAUDE.md` imports this file.

## Project

Scenario-based property appreciation estimator for German residential real estate (Berlin focus). Part of **Project Property**, a personal tool suite of Johannes and Marina (private buyers, not professionals). Marina is less technical: UI must work without real-estate jargon.

Workflow of the suite: Immobilien Screener (GRY/cashflow) → **this tool** (appreciation range) → Capital Allocation Simulator (buy vs. rent vs. invest). Same dark design system, German UI.

## Principles (do not violate)

1. Never a point estimate: always Bear/Base/Bull (≈ P10/P50/P90).
2. A deal must work at the bear case. Results are shown **real, after all costs** first.
3. Anti-optimism: when in doubt, widen the downside, not the upside.
4. No false precision. Calibration values are judgment calls, documented as such.
5. Max 6–7 input factors. No data feeds, no backend, no Monte Carlo.

## Files (read only what you need)

| File | Content | Read when |
|---|---|---|
| `src/model.js` | Pure scoring engine + all calibration constants | Changing numbers or logic |
| `src/model.test.js` | Invariant tests (vitest) | Always after model changes |
| `src/content.js` | All UI texts, factor descriptions, `MARKET_SNAPSHOT` (dated facts), defaults | Text/fact changes |
| `src/theme.js` | Colors `C`, shared styles, number formatting (de-DE) | Styling |
| `src/components.jsx` | ScoreSelector, DivergingBar, NumberField | Shared UI |
| `src/InputsTab.jsx` / `ResultsTab.jsx` / `GuideTab.jsx` | Tab views; `ResultsTab.jsx` also exports result blocks + `ResultsPanel` | Layout of a tab |
| `src/FanChart.jsx` | SVG fan chart (real value path vs. cost line), hover tooltip | Chart changes |
| `src/App.jsx` | State, header, banner, tabs | Global UI/state |
| `src/urlState.js` | Inputs ↔ URL hash (shareable links) | New inputs |
| `docs/REVIEW-2026-11.md` | Review, evidence, sources for calibration | Before changing calibration |

## Model (v4) in one paragraph

Real base rate = property-type anchor (0.2–0.6 % p.a.) + capped sum of factor effects. Dynamic factors (supply/demand, location momentum, regulation) decay with a 6-year half-life. Static factors (amenities, quality) are mostly priced in: small tilt, mainly narrow/widen the bear band. Interest outlook is a one-off price-level shock annualised over the holding period. Band width depends on holding period (one-off idiosyncratic shock 13 % + market random walk 4.5 %/yr, P10/P90), downside skewed wider. Nominal = (1+real)(1+inflation)−1. Outcome: real net result after purchase costs, selling costs and capex; break-even real rate; stress test −15 % real.

## Invariants (enforced by `npm test`)

- Bear < Base < Bull for every input combination, type and horizon.
- Raising any factor score never lowers base or bear.
- Real rates independent of inflation.
- Annualised band narrows with horizon; downside wider than upside.

## Commands

```bash
npm ci
npm test         # must pass before every commit
npm run dev      # :5173
npm run build    # → dist/ (deployed to GitHub Pages from main)
```

## Conventions

- Inline styles with shared helpers from `theme.js`; no UI libraries.
- German UI, German number format (`fmtPct`, `fmtK`), "Bear/Base/Bull" stay English with plain-language label.
- Min font size 12 px (labels), 13 px body. Numbers in JetBrains Mono.
- State is shareable via URL hash. **No localStorage** (keep the app usable as a Claude.ai artifact).
- Dated facts (rates, inflation, regulation) only in `MARKET_SNAPSHOT` / `content.js` with `asOf`. Refresh yearly; cite primary sources (Destatis, EZB, Bundesbank, GREIX, Gutachterausschuss Berlin, vdp). No SEO blogs.
- New chart types or page layouts: SVG mockup first, owner chooses, then implement. Show the mockup **directly in the chat** as a rendered image (PNG screenshot) or inline artifact, never only as an HTML file or path.
- Layout: ≥920 px two columns (inputs left, sticky `ResultsPanel` right, tabs Bewertung | Anleitung); below that one column with tabs Bewertung | Szenarien | Anleitung.

## Do not

- Add a single-number score or point estimate.
- Add more factors, external APIs or market data feeds.
- Remove or loosen tests to make a change pass.
