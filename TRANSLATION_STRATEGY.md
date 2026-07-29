# Translation Strategy for Investment Hub

> **Goal:** Make the project fully usable and maintainable for non-Korean-speaking team members.  
> **Status:** Plan + partial docs translated. UI translation not yet started.

---

## 1. What "translation everywhere" actually means

The project currently contains Korean text in three places:

1. **The app UI (`index.html`)** — user-facing Korean labels, buttons, messages (~hundreds of strings).
2. **Internal/planning documents (`*.md`)** — dev logs, plans, IR deck, guides.
3. **Data files (`corp_map.json`)** — Korean company names mapped to stock codes.

Each needs a different approach.

---

## 2. Recommended phased approach

### Phase 0 — Immediate (done)
- [x] Create `PROJECT_MAP_EN.md` as the English entry point for new employees.

### Phase 1 — App UI internationalization (highest user impact)
**Scope:** Add English support to `index.html` with a language toggle.

**Two technical options:**

| Option | Effort | Pros | Cons |
|--------|--------|------|------|
| **A. Full i18n refactor** | 3–5 days | Clean, maintainable, easy to add languages later | Large refactor of 9,279-line file |
| **B. Inline English overlay/toggle** | 1–2 days | Minimal code change | Fragile, harder to maintain, partial coverage |

**Recommended: Option A** — even though it is more work upfront, a single-file app will only get harder to refactor.

**Implementation plan for Option A:**

1. Extract all Korean UI strings from `index.html` into a translation dictionary:
   ```js
   const i18n = {
     ko: { home_title: '홈', portfolio_title: '투자 종목 관리', ... },
     en: { home_title: 'Home', portfolio_title: 'Portfolio', ... }
   };
   let lang = localStorage.getItem('lang') || 'ko';
   const t = (key) => i18n[lang][key] || key;
   ```
2. Replace hardcoded Korean text in HTML templates and JS `innerHTML`/`textContent` with `t('key')`.
3. Add a language switcher in the nav or profile modal.
4. Persist language choice in `localStorage`.
5. Keep Korean as default to avoid shocking existing users.
6. Add a development helper: warn in console if a translation key is missing.

**Challenges specific to this app:**
- Some strings are concatenated in JS (e.g., `"총 평가금액: " + formatWon(amount)`). These need parameterized translations: `t('total_value', {value: formatWon(amount)})`.
- Numbers, dates, and currency formats differ between KO and EN.
- Korean red=up / blue=down convention should stay for Korean users; English users expect green=up / red=down. This is a **market convention**, not just translation.

### Phase 2 — Internal documents
**Scope:** Translate the most important Korean markdown files to English.

**Priority order:**
1. `IR_서비스기획서_투자허브.md` → `IR_SERVICE_PLAN.md` (for investors/non-Korean stakeholders)
2. `개발내역.md` → `DEVELOPMENT_HISTORY_KO.md` already exists partially as `DEVELOPMENT_HISTORY_EN.md`; extend/correct it.
3. `개발_백로그_v1.1.md` → `BACKLOG_v1.1.md`
4. `기획_수급페이지_기관매매_v2.md` → `PLAN_SUPPLY_FLOW_v2.md`
5. `기획_KRX_지표_v3.md` → `PLAN_KRX_INDICATORS_v3.md`
6. `01_IDEATION_GUIDE.md` / `02_DESIGN_GUIDE.md` → lower priority unless non-Korean PMs/designers need them.

**Recommendation:** Keep the Korean originals and add `_EN` suffixed versions. Do not replace originals because the founding team works in Korean.

### Phase 3 — Data and screenshots
**Scope:** `corp_map.json`, screenshots, sample data.

- `corp_map.json` contains Korean legal company names. These are required by DART and should **not** be translated — they are data, not UI. The UI can show a separate `name_en` field if needed.
- Screenshots (`ss_*.png`) can be regenerated after UI translation. Low priority.

---

## 3. Language conventions to decide

Before translating the UI, the team should agree on:

| Topic | Question |
|-------|----------|
| Default language | Keep Korean default? Auto-detect browser locale? |
| Currency display | KRW 1,234,000 vs ₩1,234,000 vs "1.23M KRW" |
| Up/down colors | Korean convention (red up / blue down) vs global (green up / red down) per language? |
| Date format | 2026.07.29 vs 29 Jul 2026 vs 07/29/2026 |
| Number format | 1,234,567.89 vs 1.234.567,89 |
| Formal vs casual tone | "포트폴리오를 추가하세요" → "Add a portfolio" or "Please add a portfolio" |

---

## 4. Effort estimate

| Phase | Estimated effort |
|-------|------------------|
| Phase 0 — Project map EN | 1–2 hours ✅ |
| Phase 1A — Full UI i18n | 3–5 dev-days |
| Phase 1B — Inline toggle | 1–2 dev-days |
| Phase 2 — Core docs EN | 2–3 dev-days |
| Phase 3 — Data/screens | 0.5–1 dev-day |

---

## 5. Suggested first step

If you want to start immediately, the safest order is:

1. **Confirm language conventions** (default lang, colors, formats).
2. **Build a small i18n skeleton** in `index.html`: dictionary + `t()` helper + toggle.
3. **Translate one page first** (e.g., Home or Portfolio) as a proof of concept.
4. **Then roll out page by page** to limit risk.

---

*This document is `TRANSLATION_STRATEGY.md`. Update it as translation work progresses.*
