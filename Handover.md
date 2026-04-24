# CLAUDE.md — Project Context for Claude Code

## Project

Wertsteigerung Estimator — a scenario-based property appreciation estimator for German residential real estate. Part of "Project Property," a personal tool suite for finding and buying property in Berlin.

## Owner

Johannes (Berlin-based, searches with partner Marina). Both are private investors / owner-occupier buyers, not professionals. Marina is less technical — UX must be intuitive without real estate jargon knowledge.

## Tech Stack

- Vite + React 18 (single-page app)
- No external UI libraries — all custom components, inline styles
- No backend, no API, no database — pure client-side computation
- Dark mode UI with JetBrains Mono for numbers, DM Sans for text

## Design System

Colors defined in `C` object at top of `src/App.jsx`:
- Background: `#121620`, Cards: `#1A1F2E`
- Accent: `#4A9EFF` (blue), Amber: `#F0B429`, Green: `#34D399`, Red: `#F0506A`
- Text should be large enough for half-screen desktop use (min 13px body, 15px labels)
- All numbers use monospace font (`JetBrains Mono`)
- German-language UI throughout (except "Bear/Base/Bull" which stay English)

## Key Design Principles

1. **Never a point estimate** — always bear/base/bull scenario range
2. **Bear case rule** — a deal must work at bear case; base/bull is bonus
3. **No false precision** — avoid over-fitting, acknowledge uncertainty
4. **Uncertainty widens with extreme/contradictory inputs** — this is intentional
5. **Anti-optimism bias** — tool should make users more cautious, not more confident
6. **Both use cases** — Kapitalanlage (investment) and Eigennutzung (owner-occupied) with adapted guidance

## Scoring Engine

Located in `computeAppreciation()` function. Six factors with fixed weights:
- Supply/Demand (28%), Location Momentum (20%), Location Amenities (12%)
- Property Quality (15%), Regulatory Climate (12%), Interest Outlook (13%)

Each factor maps score 1-5 to a delta array. Total delta + inflation + property type modifier = base rate. Spread calculated from input extremity.

## File Structure

```
src/
  main.jsx    — React entry point
  App.jsx     — entire app (single component, ~600 lines)
```

## Commands

```bash
npm run dev      # start dev server on :5173
npm run build    # production build to dist/
npm run preview  # preview production build
```

## Related Tools (same Project Property suite, separate repos)

- **Immobilien Screener** — listing extraction, screening, pipeline (Claude artifact, shared storage)
- **Capital Allocation Simulator** — buy/rent/invest simulation over 30 years (Claude artifact)
- Both use the same dark mode design system and German-language UI

## Common Tasks

- Adding new property types: update `PROPERTY_TYPE_MODS` object
- Adjusting factor weights: update `factors` array in `computeAppreciation()`
- Changing delta ranges: update `delta` arrays (index 0-4 maps to score 1-5)
- UI text changes: all strings are inline in JSX (no i18n system)
- Adding new factors: add to `factors` array, update `scores` array for coherence calc

## Things NOT to Do

- Don't add a single-number "appreciation score" — the whole point is scenario ranges
- Don't add localStorage (not supported in Claude.ai artifact rendering)
- Don't add external API calls for market data — this is a judgment tool, not a data feed
- Don't over-complicate — max 6-7 input factors, not 20
