# 디자인 시스템 — 투자 허브 v2

> 단일 변경 포인트: `index.html` `<style>` 최상단 `:root` 블록

---

## 색상 토큰

### Text
| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-text-primary` | `#1a1a1a` | 주요 본문, 강조 제목 |
| `--color-text-secondary` | `#555` | 중간 강조 |
| `--color-text-subtle` | `#666` | 설명 텍스트, 요약 |
| `--color-text-tertiary` | `#888` | 보조 레이블, 메타 |
| `--color-text-muted` | `#bbb` | 타임스탬프, 비활성 |
| `--color-text-disabled` | `#aaa` | disabled 상태 |
| `--color-text-strong` | `#333` | 코드·스텝 본문 |
| `--color-text-warm` | `#44403c` | 아이디어 태그 텍스트 |
| `--color-text-placeholder` | `#9ca3af` | 입력 placeholder |

### Surface
| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-bg-base` | `#f8f7f4` | 페이지 전체 배경 |
| `--color-bg-surface` | `#fff` | 카드 / 패널 / 버튼 |
| `--color-bg-subtle` | `#fafafa` | 테이블 헤더 |
| `--color-bg-muted` | `#f5f5f3` | 아이디어 태그 bg |
| `--color-bg-overlay` | `#f0efec` | 버튼 hover, code bg |
| `--color-bg-archive` | `#f8f8f8` | 아카이브 카드 |
| `--color-bg-badge` | `#f3f4f6` | 기타 증권사 뱃지 |
| `--color-edit-highlight` | `#fffef0` | 편집 중 행 배경 |

### Border
| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-border-default` | `#e8e8e8` | 카드 테두리 |
| `--color-border-input` | `#ddd` | 입력창·버튼 테두리 |
| `--color-border-strong` | `#999` | 호버 강조 테두리 |
| `--color-border-subtle` | `#e5e7eb` | 탭 구분선 |
| `--color-border-muted` | `#e5e5e5` | 내부 구분선 |
| `--color-border-faint` | `#f5f5f5` | 테이블 행 구분선 |

### Semantic — Success (상승 / 매수 / 연결)
| 토큰 | 값 |
|------|----|
| `--color-success` | `#0a8a57` |
| `--color-success-dark` | `#15803d` |
| `--color-success-deep` | `#065f46` |
| `--color-success-deeper` | `#064e3b` |
| `--color-success-text` | `#166534` |
| `--color-success-bg` | `#dcfce7` |
| `--color-success-bg-soft` | `#d1fae5` |
| `--color-success-bg-light` | `#f0fdf4` |
| `--color-success-border` | `#bbf7d0` |

### Semantic — Error (하락 / 매도 / 오류)
| 토큰 | 값 |
|------|----|
| `--color-error` | `#d63031` |
| `--color-error-text` | `#991b1b` |
| `--color-error-bg` | `#fee2e2` |
| `--color-error-subtle` | `#fef2f2` |
| `--color-error-border` | `#fecaca` |

### Semantic — Warning (보유 / 주의)
| 토큰 | 값 |
|------|----|
| `--color-warning` | `#d97706` |
| `--color-warning-bright` | `#f59e0b` |
| `--color-warning-dark` | `#b45309` |
| `--color-warning-deeper` | `#78350f` |
| `--color-warning-text` | `#92400e` |
| `--color-warning-bg` | `#fef3c7` |
| `--color-warning-subtle` | `#fffbeb` |
| `--color-warning-border` | `#fde68a` |

### Semantic — Info (링크 / 미국장)
| 토큰 | 값 |
|------|----|
| `--color-info` | `#1e40af` |
| `--color-info-text` | `#1e3a8a` |
| `--color-info-deep` | `#075985` |
| `--color-info-bg` | `#dbeafe` |
| `--color-info-border` | `#bfdbfe` |
| `--color-trade-long-bg` | `#eff6ff` |

### Accent / Purple (관심 / 숨김 / 복기)
| 토큰 | 값 |
|------|----|
| `--color-accent` | `#6b21a8` |
| `--color-accent-dark` | `#5b21b6` |
| `--color-accent-mid` | `#6d28d9` |
| `--color-accent-deeper` | `#4c1d95` |
| `--color-accent-indigo` | `#4f46e5` |
| `--color-accent-soft` | `#6366f1` |
| `--color-accent-bg` | `#f3e8ff` |
| `--color-accent-bg-soft` | `#ede9fe` |
| `--color-accent-subtle` | `#eef2ff` |
| `--color-accent-border` | `#c4b5fd` |
| `--color-accent-border-soft` | `#c7d2fe` |

### Accent — Brand (토스풍 파랑 · 인터랙션 전용)
> 가격 등락 색(빨강=상승/파랑=하락)과 **무관**. 버튼·탭·칩·포커스 등 인터랙션 강조에만 사용.

| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-accent-primary` | `#3182f6` | 주요 버튼(.btn-primary)·활성 탭/칩·포커스 |
| `--color-accent-hover` | `#1b64da` | 주요 버튼 hover |
| `--color-accent-bg` | `#e8f0fe` | 선택 카드 배경·포커스 링 |
| `--color-accent-weak` | `#4593fc` | 보조 강조·hover 테두리 |
| `--color-accent-on` | `#ffffff` | accent 위 텍스트 |

### Trade Type
| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-trade-short-bg` | `#fff7ed` | 단타 뱃지 배경 |
| `--color-trade-short-text` | `#c2410c` | 단타 뱃지 텍스트 |
| `--color-trade-long-text` | `#1d4ed8` | 장타 뱃지 텍스트 |

### Broker Badges
| 토큰 | 값 |
|------|----|
| `--color-broker-kakao-bg` | `#fef9c3` |
| `--color-broker-kakao-text` | `#854d0e` |
| `--color-broker-mirae-bg` | `#e0e7ff` |
| `--color-broker-mirae-text` | `#3730a3` |
| `--color-broker-shinhan-bg` | `#e0f2fe` |
| `--color-broker-hanhwa-bg` | `#ffedd5` |
| `--color-broker-hanhwa-text` | `#9a3412` |
| `--color-broker-daesin-bg` | `#ccfbf1` |
| `--color-broker-daesin-text` | `#134e4a` |

---

## 타이포그래피 토큰

| 토큰 | 값 | 용도 |
|------|----|------|
| `--text-2xs` | `9px` | 최소 마이크로 텍스트 |
| `--text-xs` | `10px` | 섹션 레이블, 필 |
| `--text-sm` | `11px` | 보조 메타, 필터 버튼 |
| `--text-base` | `12px` | 기본 본문 버튼 |
| `--text-table` | `12.5px` | 테이블 셀 (전용) |
| `--text-md` | `13px` | 주요 본문, 탭 |
| `--text-lg` | `14px` | 입력창, 소제목 |
| `--text-xl` | `15px` | 메트릭 값, 네비 로고 |
| `--text-2xl` | `16px` | 지수 값 |
| `--text-3xl` | `17px` | 실시간 시세 |

---

## 간격 토큰 (4pt 그리드)

| 토큰 | 값 |
|------|----|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-7` | `28px` |
| `--space-8` | `32px` |

---

## 보더 레디어스 토큰

| 토큰 | 값 | 용도 |
|------|----|------|
| `--radius-sm` | `4px` | 인라인 코드, 작은 뱃지 |
| `--radius-md` | `6px` | 버튼 (edit row) |
| `--radius-lg` | `8px` | 입력창 |
| `--radius-xl` | `10px` | 버튼 `.btn`, 카드 소형 |
| `--radius-2xl` | `12px` | 카드 중형 (metric 등) |
| `--radius-3xl` | `16px` | 카드 대형 (.card · 토스풍) |
| `--radius-pill` | `20px` | 필터 버튼, 태그 |
| `--radius-full` | `50%` | 상태 점 (dot-live 등) |

---

## 그림자 토큰 (토스풍 소프트 섀도우)

| 토큰 | 값 | 용도 |
|------|----|------|
| `--shadow-card` | `0 1px 3px rgba(17,24,39,.06)` | 카드 기본 |
| `--shadow-hover` | `0 4px 16px rgba(17,24,39,.09)` | 카드 hover |
| `--shadow-pop` | `0 8px 28px rgba(17,24,39,.12)` | 팝오버·드롭다운 |
| `--shadow-nav` | `0 -1px 0 rgba(17,24,39,.06)` | 하단 탭바 상단 경계 |

> 다크모드는 동일 토큰을 더 진한 알파로 오버라이드.

---

## 접근성 현황

### 터치 타겟
- `.btn`, `.fbtn`, `.tbtn`, `.memo-vtab`, `.nav-tab`, `.itab` → `min-height: 44px` 적용 (WCAG 2.5.5)

### 포커스 링
- `:focus-visible` → `2px solid var(--color-info)` outline 적용
- 마우스 클릭 시에는 outline 숨김 (`:focus:not(:focus-visible)`)

### 아이콘 전용 버튼 aria-label
| 버튼 | aria-label |
|------|-----------|
| 보유종목 뉴스 `↻` | `보유 종목 뉴스 새로고침` |
| API 키 삭제 `✕` | `API 키 삭제` |
| 편집 저장 `✓` | `저장` |
| 편집 취소 `✕` | `취소` |

### 색상 대비 주의 항목
> 아래 토큰은 WCAG 2.1 AA (4.5:1) 기준 미달 — 향후 조정 검토
- `--color-text-tertiary` (#888 on #fff) → 3.54:1
- `--color-text-muted` (#bbb on #fff) → 1.97:1 (비활성 의도적 사용)

---

## 반응형 / 모바일 하단 탭바

브레이크포인트: `768px`(태블릿 이하), `480px`(폰).

- **하단 탭바 `.bottom-nav`**: 데스크톱 `display:none`, `≤768px`에서 `position:fixed;bottom:0` 노출.
  항목 `.bn-item[data-page]`은 기존 `goPage()` 핸들러 재사용. 활성 동기화는 `goPage` 내
  `.bn-item` 토글 1줄로 처리(상단탭/복원과 일치). iOS `env(safe-area-inset-bottom)` 대응.
- **사용자 유형별 노출**: `.bn-biz`(기업 전용)·`.bn-personal`(개인 전용)을 `body.biz-mode`로 토글
  (상단 `.biz-only/.personal-only` 패턴과 동일). 유형당 정확히 5개 노출.
- `≤768px`에서 상단 `.nav-tabs` 숨김 + `body{padding-bottom}`로 본문 가림 방지.
- `.metrics`: 데스크톱 6열 → 768px 3열 → 480px 2열(오버플로 방지).

---

## 다크모드 준비

`@media (prefers-color-scheme: dark)` 블록 정의됨 (현재 비활성화 아님 — 시스템 설정 따름).

오버라이드 범위:
- Surface 토큰 8개 (bg-base, bg-surface, bg-subtle, bg-muted, bg-overlay)
- Border 토큰 4개 (border-default, border-input, border-muted, border-faint)
- Text 토큰 6개 (primary~disabled)
- Semantic 색상은 유지 (배경이 어두워져도 그대로 읽힘)

완전한 다크모드 구현 시 추가 필요:
- 카드 그림자 조정
- 증권사 뱃지 색상 오버라이드
- 뉴스 카드 링크 색상

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | 초안 — 72개 색상·10개 폰트사이즈 토큰화, 접근성 CSS, 다크모드 준비 |
| 2026-06-29 | 토스 스타일 개편 — accent(파랑) 5종·shadow 4종·radius-3xl 토큰 추가, bg-base 쿨그레이(#f2f4f6), 카드 소프트 섀도우, 탭/칩/CTA 파랑 통일, 입력 포커스 링, **모바일 하단 탭바** 신설(반응형). 미정의 토큰 `--color-border`/`--color-bg-primary` 정의(검정 테두리·투명 드롭다운 버그 수정) |
