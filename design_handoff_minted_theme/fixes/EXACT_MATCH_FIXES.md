# Exact-match fixes — apply in order

Audit date: Aug 2026, against the live repo. Most of the theme IS implemented (fonts, tokens, nav pills, settings gear, portfolio hero with range dropdown). The app still reads as "the old site" because of the items below — the shell is the big one.

## 1. App shell — THE big visual gap (2 min)
Replace `src/app/(app)/layout.tsx` with `fixes/app-layout.tsx`.
Why it matters: the current shell is `max-w-4xl` = **896px** and the header sits on the **card color**. The mockup is a **1080px** shell with the header on the page color (`--surface-0`), 24px side padding, 32px top padding. This alone changes the entire feel of every page.

## 2. AppNav width + height (2 min)
In `src/components/layout/AppNav.tsx`, change the top `<nav>` classes:
- `max-w-4xl` → `max-w-[1080px]`
- `px-2 py-2 sm:px-4` → `h-[68px] px-6`
- `gap-2` → `gap-6`

## 3. Market cards (Indices) — old dense layout still in place
Replace `src/components/indices/IndexCard.tsx` with `fixes/IndexCard.tsx`, then wire the two new props where the page renders cards:
- `delta` — preformatted absolute change (compute from quote: `change` field, or omit).
- `sparkData` — intraday/synthetic series; reuse `syntheticSeries(changePercent)` from `src/lib/portfolio/syntheticSeries`.
Mockup reference: `design_reference/ui_kits/IndicesScreen.jsx` (compact StatCard, 4-col grid, gap-3).
Also: the cards grid should be `grid-cols-2 md:grid-cols-4 gap-3` per section.

## 4. Indices — category filter chips (mockup has them, page doesn't)
The page still uses only the legacy sections settings panel. Add a chip row between the page header and the grid (visual spec in `design_reference/ui_kits/IndicesScreen.jsx` → `FilterChip`):
```tsx
// 36px pill chips: All + one per visible section; multi-select; count label
<div className="flex flex-wrap items-center gap-2">
  <Chip label="All" active={active.length === 0} onClick={clear} />
  {sections.map(s => <Chip key={s.key} label={s.label} active={active.includes(s.key)} onClick={() => toggle(s.key)} />)}
  <span className="ml-2 font-mono text-[var(--text-xs)] text-[var(--text-muted)]">{shownCount} of {totalCount}</span>
</div>
```
Chip classes: `h-9 rounded-[var(--radius-pill)] border px-4 text-[var(--text-sm)]` — active: `border-[var(--accent-soft-border)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]`; inactive: `border-[var(--border-default)] bg-[var(--surface-1)] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)]`.
Chips can drive the same `settings` object the panel writes (they're the quick version of it).

## 5. Per-screen QA checklist (verify each, in the browser, dark theme)
**Shell**: content column ~1080px wide; header 68px tall, same bg as page, 1px bottom border.
**Portfolio**: greeting 28px bold; 2fr/1fr grid; big card has range dropdown ("1 month ▾" closed; abbr badges when open) AND ₩ delta next to the % badge; right column = two stacked cards with no dead space; holding rows ≥56px, hover fill, mono values.
**Indices**: chip row present; cards have 20px radius, mono value, % + point delta, status label with colored dot (green=open pulse, amber=pre, muted=closed), 36px sparkline.
**News**: list cards radius 16, hover = `--surface-2`, source · time meta row, ticker chips with PriceChange.
**Journal**: calendar grid with mono day numbers + entry dots; selected day = `--accent-soft` fill; day panel lists trades (Buy/Sell badge) and notes.
**Flow**: uppercase eyebrow column headers; rows with hover fill + 1px separators; action badges; mono figures right-aligned.
**Monitor**: watchlist rows with inline sparkline + alert badge; Radar and Memos cards in right column.
**Global**: every number is IBM Plex Mono; buttons never wrap; focus shows mint ring; KR-colors switch flips all green/red to red/blue instantly.

If a check fails, the exact intended rendering is in `design_reference/ui_kits/` — open `index.html` in a browser to compare side by side.
