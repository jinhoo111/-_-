# Handoff: Minted theme for RichHub (web/)

## Overview
Full visual re-theme of the RichHub investing app to the **Minted** design system: deep evergreen surfaces, one vivid mint accent, Space Grotesk + IBM Plex Mono, dark as the primary theme, and price-direction colors as a user setting (western green/red default, KR red/blue via attribute). Rebrand name: **minted.** (lowercase wordmark + mint terminal dot, plain type — there is no pictorial logo; do not invent one).

## About the Design Files
Files in `design_reference/` are **design references created in HTML/JSX** — prototypes showing intended look and behavior, NOT production code to copy directly. The task is to **recreate this styling inside the existing Next.js 16 + Tailwind v4 codebase** (`web/`), using its established patterns (CSS custom properties consumed via `[var(--…)]` arbitrary values, next-themes, existing `src/components/ui/*` primitives).

## Fidelity
**High-fidelity.** Colors, type, spacing, radii, and interaction states are final. Copy exact values — do not round or substitute.

## Implementation plan (ordered)

### 1. globals.css — one-file swap
Replace `web/src/app/globals.css` with `globals.minted.css` from this bundle. It contains:
- Minted tokens: `:root` = light, `.dark` = dark (matches the app's existing next-themes class model).
- `[data-price-convention="kr"]` overrides for `--price-up/--price-down` (light + dark variants).
- **Legacy aliases**: every old var name (`--color-text-primary`, `--color-bg-surface`, `--color-up`, `--text-base`, `--radius-control`, `--btn-h-*`, `--shadow-*`, broker badges…) mapped to the new tokens, so all existing `text-[var(--…)]`-style classes keep working with zero call-site changes. Delete aliases progressively as call sites migrate to the new names.
- The `@theme inline` block now points `--font-sans` at `--font-body` and `--font-mono` at `--font-mono-plex` (see step 2).

### 2. Fonts — `src/app/layout.tsx`
Replace Geist with:
```tsx
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-body", weight: ["400","500","600","700"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono-plex", weight: ["400","500","600"] });
// <html className={`${grotesk.variable} ${plexMono.variable}`}>
```
Rule: **every figure (prices, amounts, percentages, tickers, dates in tables) renders in IBM Plex Mono**; everything else in Space Grotesk.

### 3. Theme default — `src/app/providers.tsx`
next-themes: `defaultTheme="dark"` (dark is Minted's primary). Keep `attribute="class"` — the CSS uses `.dark`.

### 4. Price convention — user setting
- Add a `pricesKr: boolean` user preference (default **true** for the existing KR user base if desired; the design default is western).
- Reflect it as `data-price-convention="kr"` on `<html>`.
- Replace every direct use of `--color-up/--color-down` with `--price-up/--price-down` (the aliases already redirect them, so this is cleanup, not a blocker).
- Port `PriceChange` (in `design_reference/components/data/PriceChange.jsx`) as a React component — it is the single way price movement is rendered: mono font, explicit +/− sign, ↗/↘ glyph, optional soft-pill `badge` variant, colors from `--price-up/--price-down` only.

### 5. Restyle `src/components/ui/*`
Copy exact values from `design_reference/components/` (all values inline in the JSX):
- **Button** (`core/Button.jsx`): 48px md / 36px sm; radius 12px; semibold; variants primary (mint fill, `--text-on-accent` text), secondary (`--surface-2` + border), ghost, danger (`--negative-soft` bg, `--negative` text); hover shifts one step (`--accent-hover` / `--surface-3`); press scale 0.98; `white-space: nowrap`; transitions 120ms `cubic-bezier(0.16,1,0.3,1)`. Labels are sentence-case verbs.
- **Input/Select** (`core/Input.jsx`, `core/Select.jsx`): 48px; `--surface-2` fill; 1px `--border-default`; focus = `--border-focus` border + `0 0 0 4px var(--accent-soft)` ring; label 13px `--text-secondary` above; error line in `--negative`.
- **Card** (`display/Card.jsx`): `--surface-1`, 1px `--border-default`, radius 20px, padding 24px, `--shadow-card`.
- **Badge/TagChip** (`display/Badge.jsx`): pill, soft tinted fills (`--*-soft` bg + solid color text), 4px 12px padding, semibold 13px; `mono` variant for figures.
- **Tabs** (all `*Tabs.tsx` + `core/Tabs.jsx`): segmented pill — container `--surface-2` radius 999 padding 4; active item `--surface-0` fill + `--accent` text.
- **Toast** (`display/Toast.jsx`): 360px, `--surface-2`, border `--border-strong`, radius 16, tinted icon disc (28px circle) — **no colored left borders**.
- **Skeleton, EmptyState**: shimmer gradient between `--surface-2/3`; empty states = glyph tile + warm forward-looking copy + primary action.
- **Switch** (`core/Switch.jsx`): 48×28 pill, mint when on.
- **AppNav** (`layout/AppNav.tsx`): wordmark `minted.` (Space Grotesk 700, −0.03em, mint dot); nav items = pill buttons (active `--accent-soft` bg + `--accent` text); settings gear popover holds display name, language, theme switch, KR-colors switch (see `design_reference/ui_kits/AppShell.jsx`).

### 6. Screen patterns (reference `design_reference/ui_kits/`)
- **Portfolio** (`PortfolioScreen.jsx`): greeting header; 2fr/1fr stat grid — big total card with range dropdown (closed trigger shows "1 month ▾" only; open list shows abbr badge 1D/7D/1M/3M/9M/YTD/1Y/All + full name + ✓) and % **plus absolute ₩ delta side by side**; right column stacks two compact cards; holdings as 56px rows with 2-letter tile, mono values.
- **Indices** (`IndicesScreen.jsx`): category filter chips (All/Korea/US/FX/Rates/Crypto/Commodities, multi-select, count label); 4-col compact stat cards, each with market status (pulsing green dot = open, amber = pre-market, muted = closed; hours on hover) and % + point delta.
- **News** (`NewsScreen.jsx`): flat list cards (16/20px padding, radius 16, hover `--surface-2`), source · time · tag row, ticker chips with PriceChange.
- **Login** (`LoginScreen.jsx`): centered 400px column, wordmark, single card, full-width primary button.
- **Journal** (`JournalScreen.jsx`): month calendar grid (7-col, mono day numbers, mint dot = trade day / sky dot = note day, selected day gets `--accent-soft` fill), selected-day panel listing trade entries (Buy/Sell badge + name + qty + P&L) and note entries; three compact stat cards on top (streak, entries, win rate).
- **Flow** (`FlowScreen.jsx`): Insider trades / Fund 13F tabs; uppercase eyebrow column headers; 6-col grid table rows (company + PriceChange, insider/fund, action badge, mono shares/value/date), hover fill, 1px row separators; weekly summary stat cards.
- **Monitor** (`MonitorScreen.jsx`): watchlist rows (tile, name + alert badge, inline sparkline, mono price + PriceChange); Radar card (signal badge + text list); Memos card (ticker-tagged notes on `--surface-2` tiles); add-ticker search input in the header.

## Interactions & Behavior
- Hover: background shifts one surface step, 120ms ease-out. Press: scale 0.98. Focus: mint ring.
- Motion: fades + 8px rises, 200–350ms `cubic-bezier(0.16,1,0.3,1)`, 120ms stagger. Nothing bounces.
- Dropdowns/popovers: `--surface-1`, `--border-strong`, radius 16, `--shadow-pop`, close on outside click.
- Charts: 2.5px `--chart-line` stroke + vertical gradient fill (`--chart-fill-top→bottom`); losing series use `--price-down` stroke with no fill; alt series `--chart-alt-1/2/3`.

## State Management
- `theme` (next-themes, default dark), `pricesKr` boolean → `data-price-convention` attr, `displayName`, `language` — all in the settings popover.
- Portfolio range selection is client state; each range shows % + absolute delta + note + series.

## Design Tokens
Canonical source: `design_reference/tokens/*.css` (colors incl. both themes + KR flips, typography, spacing/radii/motion). `globals.minted.css` is the same content restructured for this codebase.

## Content rules
Warm second person, sentence case everywhere, buttons are verbs, no emoji, no hype; losses stated plainly. Numbers always mono with explicit sign and currency symbol. Minimum text size 12px.

## Assets
No image assets. Wordmark is plain type. Icons: Lucide (stroke 2, 20px) if an icon lib is added; unicode arrows ↗ ↘ inline with figures. Broker badge colors intentionally kept from the old theme (external brands).

## Files
- `globals.minted.css` — ready-to-swap globals.css (tokens + legacy aliases)
- `design_reference/tokens/` — colors.css, typography.css, spacing.css, fonts.css
- `design_reference/components/` — core/ (Button, IconButton, Input, Select, Switch, Tabs), display/ (Card, Badge, Toast, EmptyState, Skeleton), data/ (StatCard, PriceChange, Sparkline, TickerRow) — each with .d.ts props contract
- `design_reference/ui_kits/` — AppShell, LoginScreen, PortfolioScreen, IndicesScreen, NewsScreen + index.html (interactive prototype)
- `design_reference/readme.md` — full design-system guide (voice, foundations, iconography)
