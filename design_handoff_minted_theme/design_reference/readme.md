# Minted Design System

**Minted** is the identity for a personal investing & life-tracking hub aimed at young investors (the app codebase is currently named "RichHub" — Next.js + Tailwind, mounted locally at `web/`). The product spans: portfolio, market indices, news, insider flow, watchlist monitor, and a personal journal (trades, habits, health). Bilingual KR/EN; mockups here are English.

**Direction chosen by the user:** "Minted — fresh growth energy" (option 1c in `Directions.dc.html`). Deep evergreen surfaces, one vivid mint accent, geometric type. Trustworthy and elegant without being stiff; youthful without crypto-neon.

- Dark is the **primary** theme; light is fully supported via `[data-theme="light"]`.
- Price direction colors are a **user setting**: default western (up = green), `[data-price-convention="kr"]` switches to KR convention (up = red, down = blue). Always use `--price-up` / `--price-down`, never `--positive`/`--negative`, for price movement.

## Content fundamentals

- Tone: **friendly & encouraging**, banking-app warm. Second person ("You've grown your money to…"), never hype ("moon", "🚀") and never scolding.
- Celebrate progress: streaks, "ahead of your plan", months invested. Losses are stated plainly, without drama: "−0.8% today".
- Sentence case everywhere — titles, buttons, labels. No ALL-CAPS except tiny eyebrow labels (with `--tracking-caps`).
- Numbers are sacred: always `--font-mono`, always tabular, currency symbol included (₩, $).
- No emoji. Arrows ↗ ↘ and +/− signs carry direction.
- Buttons are verbs: "Add an investment", "Start a journal entry" — not "Submit", "OK".

## Visual foundations

- **Color**: evergreen surface ramp (`--surface-0…3`), one mint accent (`--accent`). Warm coral for negative (not alarm-red), honey for warnings, sky for info. Max one accent-filled element per view region.
- **Type**: Space Grotesk for everything textual (display −0.03em tracking, headings −0.02em); IBM Plex Mono for every figure. Base size 15px — roomy, never below 12px.
- **Backgrounds**: flat solid surfaces. No gradients except chart area fills (`--chart-fill-top→bottom`). No textures, no imagery-as-decoration.
- **Cards**: `--surface-1` on `--surface-0`, 1px `--border-default`, `--radius-xl` (20px), padding `--space-6`+. Dark theme uses borders + inset highlight instead of drop shadows; light theme uses soft shadows (`--shadow-card`).
- **Corners**: generous — 20px cards, 12px controls, pill badges.
- **Hover**: fill shifts one surface step (`--surface-2→3`) or accent brightens (`--accent-hover`), 120–200ms `--ease-out`. Press: `--accent-pressed`, scale 0.98.
- **Focus**: 2px `--border-focus` ring via `--shadow-glow-accent`.
- **Motion**: subtle only — fades, 200ms ease-out slides, gently counting numbers. Nothing bounces.
- **Charts**: 2.5px mint line, gradient fill below, gridlines `--chart-grid` only when values must be read. Alt series: sky, honey, lavender (`--chart-alt-*`).
- **Layout**: max-width 1080px shells, generous `--space-8` section gaps; dense tables allowed but rows ≥ 48px tall. Hit targets ≥ 44px.

## Iconography

No bundled icon font in the source codebase (it uses text + unicode). Minted uses **Lucide** (CDN, stroke 2, 20px default) for UI glyphs, matching Space Grotesk's geometry. Unicode arrows (↗ ↘ →) are fine inline with mono figures. No emoji. **No logo mark exists** — the wordmark is plain type: lowercase `minted` + mint terminal dot (see `guidelines/brand-wordmark.html`). Do not invent a pictorial logo.

## Index

- `styles.css` — global entry; imports everything in `tokens/`.
- `ds_fallback_loader.js` — card/kit loader: uses `_ds_bundle.js` when compiled, else builds the namespace from the JSX sources in-browser.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `fonts.css`.
- `guidelines/` — foundation specimen cards (Design System tab).
- `components/core/` — Button, IconButton, Input, Select, Switch, Tabs.
- `components/display/` — Card, Badge, Toast, EmptyState, Skeleton.
- `components/data/` — StatCard, PriceChange, Sparkline, TickerRow.
- `ui_kits/minted/` — full screens: portfolio dashboard, indices, news, login.
- `Directions.dc.html` — the original three explored directions (1c chosen).

### Intentional additions
Component inventory follows the app's `src/components/ui/` (Button, Card, Input, Select, Skeleton, Toast, EmptyState, toggles→Switch, tabs→Tabs, TagChip→Badge), plus finance-specific data primitives grounded in its IndexCard/MonitorCard patterns: **StatCard, PriceChange, Sparkline, TickerRow** — added because price display must be consistent and convention-aware everywhere.
