# CLAUDE.md

Map, not manual. Full detail lives in [PROJECT_MAP.md](PROJECT_MAP.md) (Korean, primary) and
[PROJECT_MAP_EN.md](PROJECT_MAP_EN.md) (English mirror) — keep both in sync when structure
changes. This file only covers what a session needs before touching anything.

## What this is

RichHub (투자 허브) — a Korean investment dashboard: multi-account portfolio, market data,
news, corporate disclosure monitoring, and an investment journal, backed by Supabase.

## Two implementations coexist on purpose

- **`main` branch / `index.html`** — the legacy single-file SPA (9,279 LOC), **live on GitHub
  Pages**. This is the reference implementation for behavior parity.
- **`rewrite/next` branch / `web/`** — a phased Next.js + TypeScript rewrite, same Supabase
  backend, targeting Vercel. Not yet feature-complete (see §13 of the PROJECT_MAP files for
  current phase status).

**Rule: never edit `index.html` as part of rewrite work.** It must stay untouched and live
until full parity is reached and cutover happens. If a task is about the rewrite, all edits
belong under `web/`.

The full phase-by-phase rewrite plan (target architecture, API route layout, phase order,
verification checklist) is a plan doc, not a committed file — ask for it if you need the
full roadmap rather than just current status.

## Working in `web/` (the rewrite)

Stack: Next.js App Router + TypeScript + Tailwind v4, TanStack React Query, `@supabase/ssr`.
No i18n library (custom Context — see below), no component library.

```bash
cd web
npm run dev      # localhost:3000
npm run build    # must pass before considering a change done — matches CI
npm run lint     # eslint, react-hooks v7 rules included
npx tsc --noEmit
```

CI (`.github/workflows/web-ci.yml`) runs the same three checks on every push/PR touching
`web/**`, on both `main` and `rewrite/next`.

### Conventions worth knowing before editing

- **i18n message-key indirection.** Plain (non-component) modules like `lib/auth/errors.ts`
  and `lib/portfolio/constants.ts` return/hold message *keys*, never literal text — only
  components with `useT()` in scope resolve keys to text. Add new UI strings to **both**
  `ko` and `en` in `lib/i18n/messages.ts`.
- **Locale-free API contract.** Server routes (e.g. `/api/market/quote`) return state codes,
  never localized labels — the client resolves labels via `t()`. Keep future routes the same
  way.
- **Up/down colors never flip by language.** Red=up/blue=down (Korean convention) in both
  EN and KO.
- **Proper nouns stay Korean in both languages** — broker names, `KR_TICKER_MAP`/
  `US_TICKER_MAP` keys, and the stored value `"기타"` are data, not UI copy.
- **`eslint-plugin-react-hooks` v7's `set-state-in-effect` rule** flags `setState` inside
  `useEffect`. `LanguageProvider.tsx`'s mount-effect localStorage hydration is a deliberate,
  correct use of this pattern — disable inline with a comment, don't restructure to dodge it.

Full rewrite structure, directory map, and phase status: PROJECT_MAP_EN.md §13 /
PROJECT_MAP.md §13.

## Working on the legacy app (`index.html`, `supabase/`)

No build step, no compiler, no CI for this side — a single duplicate declaration can break
the whole app. Always verify by opening `index.html` in a browser before pushing. See
PROJECT_MAP §5–8 for naming conventions and known fragility points (Supabase init deadlock,
DART's TLS/CORS constraints, Edge Function cache rules, etc.) before making changes here.

## Session start

1. `git status`, `git log --oneline -10` — check which branch and what's already in flight.
2. Read PROJECT_MAP.md (or PROJECT_MAP_EN.md) §9 for current known issues before assuming a
   bug is new.
3. If the task touches `web/`, confirm you're on `rewrite/next`, not `main`.
