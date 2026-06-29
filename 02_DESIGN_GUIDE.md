# 02. 디자인 가이드

> **이 파일이 필요한 시점:** 아이디어 확정 후 BX/디자인 시스템 설계 단계.

-----

## 0. 디자인 모드 진행 순서

```
[STEP 1] 아이디어 컨셉 재확인
    ↓
[STEP 2] BX 6종 산출 (필수)
    ↓
[STEP 3] 디자인 시스템 핵심 토큰 정의
    ↓
[STEP 4] 클로드 디자인용 첫 프롬프트 출력
```

각 스텝의 산출물은 다음 파일로 떨어뜨립니다.

- STEP 2 → `bx_[영어슬러그].md`
- STEP 3 → `designsystem_[영어슬러그].md`
- STEP 4 → `prompts_[영어슬러그]_design.md` 또는 위 파일에 통합

-----

## 1. BX 산출물 6종 (필수)

> **빠뜨리면 안 되는 6가지.** 하나라도 누락 시 디자인 모드 미완성.

### 1.1 추천 색상값

- **Primary 1개 + Secondary 1개 + Accent 1개** (HEX, RGB, HSL 모두 표기)
- **중성 컬러**: Gray Scale 9단계 (50, 100, 200, 300, 400, 500, 600, 700, 800, 900)
- **시맨틱 컬러**: Success / Warning / Error / Info 각 1개
- 각 컬러는 **선택 이유**를 한 줄로 설명 (브랜드 톤과 어떻게 연결되는가)
- WCAG AA 명도대비 통과 여부 명시 (최소 본문 4.5:1, 큰 텍스트 3:1)

> WCAG 명도대비 기준 출처: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

### 1.2 추천 메인 폰트

- **Display 폰트** (헤딩용) 1개
- **Body 폰트** (본문용) 1개 (Display와 같아도 됨)
- **숫자 폰트** (선택, 데이터 강조 시)
- 한글 + 영문 모두 지원되는 폰트 우선
- 라이선스: 무료 상업 이용 가능 우선 (Pretendard, Noto Sans KR, Spoqa Han Sans Neo 등)
- 선택 이유 한 줄 명시

> 한글 무료 상업용 폰트 검증: https://noonnu.cc

### 1.3 추천 로고용 프롬프트 (나노바나나 + 미드저니 두 버전)

**나노바나나 (Gemini 2.5 Flash Image / Nano Banana)** 는 자연어 묘사형, 편집 친화적. 미드저니는 키워드+파라미터형.

#### 나노바나나용 프롬프트 템플릿

```
A minimal flat logo for [브랜드명], a [한 줄 컨셉 설명] mobile app.
The logo should feel [형용사 3개, 예: friendly, modern, trustworthy].
Use a [도형 모티브, 예: rounded square, abstract leaf, monoline icon] 
combined with a clean wordmark in [폰트 스타일, 예: geometric sans-serif].
Primary color: [HEX]. Secondary color: [HEX]. White background.
Vector-style, scalable, no gradients, no 3D effects, no shadows.
Suitable for an app icon at 1024x1024 and a favicon at 32x32.
```

#### 미드저니용 프롬프트 템플릿

```
minimal flat logo for [브랜드명], [컨셉 키워드 3-5개], 
[모티브, 예: abstract leaf icon], geometric sans-serif wordmark, 
[primary color HEX], [secondary color HEX], white background, 
vector style, scalable, professional, clean, no gradients --ar 1:1 --v 6 --style raw --no text photorealistic shadow gradient
```

> 미드저니는 영문 키워드와 파라미터(`--ar`, `--v`, `--style`, `--no`) 조합. 텍스트(워드마크) 표현은 미드저니가 약하므로, 워드마크는 별도 폰트로 조합 권장.

#### 두 버전을 모두 제공할 때 명시할 것

- 각 도구의 특성 차이 한 줄 (“나노바나나는 묘사형, 미드저니는 키워드형”)
- 결과물 유형 차이 (“나노바나나는 편집 반복에 강함, 미드저니는 첫 비주얼 임팩트 강함”)

### 1.4 추천 로고 컨셉

- **메인 컨셉 1개 + 대안 2개**
- 각 컨셉마다:
  - 모티브 (어디서 영감 받았는지)
  - 어떻게 브랜드 핵심 가치와 연결되는지
  - 시각적 형태 한 줄 묘사 (단순 도형 / 모노라인 / 추상 / 레터마크 등)

### 1.5 UI 디자인 시 참고사항

다음을 모두 포함:

- **레이아웃 원칙**: 그리드 시스템 (4pt 또는 8pt grid 권장), 콘텐츠 최대 폭, 모바일 안전 영역
- **컴포넌트 우선순위**: 어떤 컴포넌트가 가장 자주 등장하는지 (Card / List / FAB / Sheet 등)
- **인터랙션 톤**: 마이크로 인터랙션을 어디까지 쓸지 (예: “주요 CTA에만 짧은 spring 애니메이션, 나머지는 fade”)
- **Empty/Error/Loading 상태 디자인 방향**: 일러스트 / 아이콘 / 텍스트 only 등
- **다크모드 지원 여부와 우선순위**

### 1.6 브랜드 컨셉

- **한 줄 브랜드 스테이트먼트**: “[누구를 위한] [무엇을 제공하는] [어떤 브랜드]”
  예) “30대 1인 가구를 위한, 5분 안에 결정되는 저녁 메뉴 어시스턴트”
- **브랜드 톤 키워드 3-5개**: (예: friendly, decisive, low-pressure, witty)
- **브랜드 보이스 예시**:
  - DO: [이런 톤의 카피]
  - DON’T: [이런 톤은 피함]
- **브랜드 페르소나**: “이 브랜드가 사람이라면 [이런 사람]”

-----

## 2. 디자인 시스템 핵심 토큰

BX 단계 끝나면 다음 토큰들을 정의합니다.

### 2.1 Color Tokens

```
// Brand
--color-primary-50 ... --color-primary-900
--color-secondary-50 ... --color-secondary-900
--color-accent

// Neutral
--color-gray-50 ... --color-gray-900

// Semantic
--color-success / --color-warning / --color-error / --color-info

// Surface (다크모드 고려)
--color-bg-primary
--color-bg-secondary
--color-bg-elevated
--color-text-primary
--color-text-secondary
--color-text-tertiary
--color-border-default
--color-border-strong
```

### 2.2 Typography Tokens

타입 스케일 (Major Third 1.25 또는 Minor Third 1.2 추천):

```
--font-size-xs:  12px
--font-size-sm:  14px
--font-size-md:  16px (base)
--font-size-lg:  18px
--font-size-xl:  20px
--font-size-2xl: 24px
--font-size-3xl: 30px
--font-size-4xl: 36px

--line-height-tight:   1.2
--line-height-normal:  1.5
--line-height-relaxed: 1.75

--font-weight-regular:  400
--font-weight-medium:   500
--font-weight-semibold: 600
--font-weight-bold:     700
```

### 2.3 Spacing Tokens (4pt grid)

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

### 2.4 Radius / Elevation

```
--radius-sm:   4px
--radius-md:   8px
--radius-lg:   16px
--radius-full: 9999px

--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
--shadow-md: 0 4px 6px rgba(0,0,0,0.1)
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1)
```

### 2.5 컴포넌트 우선순위 (MVP에서 만들 것)

**Tier 1 (필수)**: Button, Input, Card, List Item, Bottom Navigation, App Bar
**Tier 2 (1-2주 내)**: Modal/Sheet, Toast, Empty State, Loading Skeleton, Tab
**Tier 3 (필요할 때)**: Dropdown, Stepper, Date Picker, Chart 컴포넌트

> 안드로이드 환경이므로 Material Design 3 (https://m3.material.io) 의 컴포넌트 명명/스펙을 베이스로 출발하고, 브랜드 색상·라운딩만 커스터마이징하는 게 가장 빠릅니다.

-----

## 3. 클로드 디자인용 첫 프롬프트 템플릿

디자인 시스템을 클로드 디자인 (Artifacts/Frontend Design) 에 넣고 첫 화면을 뽑을 때 사용.

### 3.1 첫 디자인 프롬프트 (복붙용)

```
[프로젝트명] 의 첫 화면 디자인을 만들어주세요. 안드로이드 모바일(360x800) 기준입니다.

== 브랜드 컨셉 ==
[브랜드 한 줄 스테이트먼트]
톤 키워드: [톤 3-5개]

== 색상 토큰 ==
- Primary: [HEX]
- Secondary: [HEX]
- Accent: [HEX]
- Gray-50 ~ Gray-900: [9단계 HEX 나열]
- Success/Warning/Error/Info: [4개 HEX]

== 타이포그래피 ==
- Display: [폰트명]
- Body: [폰트명]
- Type scale: 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36

== Spacing & Radius ==
- 4pt grid (4/8/12/16/20/24/32/40/48/64)
- Radius: 4 / 8 / 16 / full

== 만들 화면 ==
[화면 이름] — 사용자가 [목적] 을 위해 들어오는 화면입니다.

핵심 요소:
1. [요소 1 — 무엇을 보여주는지]
2. [요소 2]
3. [요소 3]

상호작용:
- [버튼/제스처별 기대 동작]

상태:
- 로딩 / 빈 데이터 / 에러 / 정상 4가지 모두 보여주세요.

제약:
- Material Design 3 베이스로 시작하되 위 토큰으로 커스터마이징.
- 가장 빈번하게 등장하는 컴포넌트(Card, List, Button)에 집중.
- 마이크로 인터랙션은 CTA에만 적용.
- 다크모드 토글은 [지원/미지원] 입니다.

원하는 산출물:
- React + Tailwind 기반 single-file 프로토타입
- 위 4가지 상태(로딩/빈/에러/정상)를 모두 토글로 볼 수 있게
- 디자인 의도를 주석으로 짧게 설명
```

### 3.2 프롬프트 작성 시 주의

- **모호한 표현 금지**: “예쁘게” / “세련되게” → “[톤 키워드 3개]를 표현하는 형태로”
- **레퍼런스 명시**: 비슷한 톤의 앱 1-2개를 명시하면 결과물이 훨씬 빨라짐. (예: “Headspace 의 차분한 톤 + Notion 의 정돈된 정보 밀도”)
- **상태(state) 누락 금지**: 로딩/빈/에러/정상 4가지는 디자인 단계에서 무조건 같이 뽑기. 나중에 추가하면 디자인 시스템이 깨짐.
- **모바일 뷰포트 명시**: `360x800` 기준으로. 시뮬레이터 디폴트 (iPhone 14) 가 아니라 안드로이드 베이스라인.

> 출처 (Claude 프롬프트 best practice): https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices

-----

## 4. 데이터 드리븐 디자인 체크리스트

유저는 데이터 드리븐 디자인을 추구하므로, 디자인 산출물에는 다음을 함께 정의합니다.

- **각 화면의 핵심 측정 이벤트**: 예) 홈 화면 → `home_view`, `home_card_tap`, `home_search_focus`
- **A/B 테스트 후보**: 디자인 단에서 가설 갈리는 부분 1-2개를 미리 표시 (예: “CTA 위치를 화면 하단 vs 카드 내 — 추후 A/B”)
- **Empty/Error 상태에서의 회복 플로우**: 단순 메시지가 아니라 “다음 행동으로 어떻게 유도할지”
- **퍼널 정의**: Onboarding → First Action → Activation → Retention 4단계 각각에서 측정할 지표

-----

## 5. BX 산출물 MD 파일 템플릿

```markdown
# BX: [브랜드명]

## 0. 한 줄 요약
[브랜드 스테이트먼트]

## 1. 브랜드 컨셉
- 톤 키워드: [...]
- 브랜드 페르소나: [...]
- 보이스 DO/DON'T:
  - DO: ...
  - DON'T: ...

## 2. 색상
| 토큰 | HEX | RGB | 용도 | 명도대비 |
|---|---|---|---|---|
| Primary | #... | rgb(...) | 주요 CTA | 4.5:1 (AA pass) |
| ... | | | | |

## 3. 타이포그래피
- Display: [폰트명] — 라이선스: [무료 상업용 OK / ...]
- Body: [폰트명]
- 선택 이유: ...

## 4. 로고
### 메인 컨셉
- 모티브: ...
- 시각적 형태: ...

### 나노바나나 프롬프트
\`\`\`
[프롬프트]
\`\`\`

### 미드저니 프롬프트
\`\`\`
[프롬프트]
\`\`\`

### 대안 컨셉 2개
1. [컨셉 A] — 모티브 / 형태
2. [컨셉 B] — 모티브 / 형태

## 5. UI 디자인 참고사항
- 그리드: ...
- 컴포넌트 우선순위: ...
- 인터랙션 톤: ...
- 상태 디자인: ...
- 다크모드: [지원/미지원]

## 6. 다음 단계
디자인 시스템 토큰 정의 → `designsystem_[슬러그].md` 참조
```

-----

## 6. 디자인 시스템 MD 파일 템플릿

```markdown
# Design System: [브랜드명]

## 1. Color Tokens
[CSS variables 형태로 나열]

## 2. Typography Tokens
[CSS variables]

## 3. Spacing & Radius Tokens
[CSS variables]

## 4. Components — Tier 1 (MVP 필수)
- Button (Primary / Secondary / Tertiary / Destructive)
- Input (Default / Focused / Error / Disabled)
- Card (Default / Elevated / Interactive)
- List Item
- Bottom Navigation
- App Bar

각 컴포넌트마다:
- 사이즈 변형 (sm/md/lg)
- 상태 (default/hover/active/disabled)
- 사용처 가이드

## 5. Components — Tier 2 (이후)
[...]

## 6. 측정 이벤트 표준
| 이벤트명 | 트리거 | 파라미터 |
|---|---|---|
| screen_view | 화면 진입 | screen_name |
| ... | | |

## 7. 클로드 디자인 첫 프롬프트
[위 § 3.1 템플릿을 채운 형태로 첨부]
```

-----

## 7. 자주 빠지는 함정

1. **컬러를 너무 많이 정함**: Primary 5색, Secondary 3색, Accent 4색 → MVP 단계에서는 Primary 1, Secondary 1, Accent 1로 출발. 늘리는 건 쉽지만 줄이는 건 어려움.
1. **다크모드 늦게 추가**: 디자인 시스템 만들 때부터 light/dark surface 토큰 같이 정의. 나중에 추가하면 토큰 구조 다 갈아엎어야 함.
1. **폰트 라이선스 미확인**: “예쁘다”고 골랐는데 상업용 유료. 처음부터 무료 상업용 OK 폰트로.
1. **컴포넌트 욕심**: MVP인데 차트, 캘린더, 리치 텍스트 에디터까지 시스템에 넣음 → 만들지도 못하고 끝남.
1. **카피 톤 정의 안 함**: 컬러/폰트만 BX고 카피 톤은 빼먹음 → 마케팅 단에서 다시 갈아엎음.
1. **레퍼런스 없는 프롬프트**: 클로드 디자인에 톤만 텍스트로 설명 → 결과물이 매번 다름. 비슷한 앱 1-2개를 레퍼런스로 명시.