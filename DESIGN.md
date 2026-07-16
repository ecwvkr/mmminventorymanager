---
name: 카페 무무무 인벤토리 매니저
description: 매장 태블릿에서 재고를 확인하고 발주·입고·레시피 소모를 처리하는 담백한 운영 도구
colors:
  primary: "#6f4e37"
  primary-ink: "#ffffff"
  accent: "#b08968"
  background: "#faf6f0"
  surface: "#ffffff"
  foreground: "#2e2420"
  muted: "#8a7d72"
  border: "#e7ddd0"
  status-ok: "#3f7d5c"
  status-low: "#c0552e"
  status-shipping: "#b8892b"
  status-inactive: "#9a9a9a"
typography:
  headline:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  title:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    typography: "{typography.title}"
  button-primary-disabled:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  chip-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  chip-inactive:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  status-badge:
    backgroundColor: "{colors.status-low}"
    textColor: "{colors.status-low}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: 카페 무무무 인벤토리 매니저

## 1. Overview

**Creative North Star: "The Quiet Counter"**

이 시스템은 매장 카운터 그 자체다 — 손님도, 소음도 없이 할 일만 조용히 처리한다. 커피 브랜드의
온기(코코아 브라운·크림)는 배경에 남아있지만, 화면 위에서 목소리를 내는 건 숫자와 상태뿐이다.
장식은 절제하고, 정보는 즉시 읽히고, 손끝은 어디를 눌러야 할지 헷갈리지 않는다.

밀도는 촘촘하되 산만하지 않다. 한 화면에 재고 수십 건이 리스트로 쌓여도, 위계는 굵기와 크기
두 가지 신호로만 정리된다(제목 굵게·본문 보통·메타데이터 흐리게). 이 시스템이 명시적으로
거부하는 것: 칸이 빽빽한 엑셀형 스프레드시트, 그라데이션과 히어로 메트릭 카드로 뒤덮인 화려한
SaaS 대시보드, 캐주얼하고 유희적인 소비자 앱의 인터랙션. 이건 업무 도구이고, 담백함이 신뢰를
만든다.

**Key Characteristics:**
- 단일 서체(IBM Plex Sans KR), 단일 액션 컬러(커피 브라운) — 목소리를 하나로 유지
- 평면(flat) 기본, 그림자는 호버 피드백에서만 미세하게 등장
- 상태(재고 부족/배송중/정상/비활성화)는 항상 색 + 텍스트 라벨로 이중 표시
- 터치타깃은 표준보다 넉넉하게(원형 스테퍼 버튼 44px 이상) — 고령/파트타이머 직원 고려

## 2. Colors

커피 로스팅 단계를 닮은 브라운 계열 하나가 액션을 전담하고, 나머지는 전부 재고 상태를 읽기
위한 저채도 중립색이다.

### Primary
- **Roasted Coffee** (#6f4e37): 주요 버튼(적용, 저장, 발주하기, 발주 완료), 활성 탭·칩, 활성 하단
  네비 아이콘. 화면당 한두 곳에서만 강조로 등장하고, 텍스트는 항상 흰색(#ffffff, `primary-ink`)과
  짝을 이룬다.

### Secondary
- **Latte Tan** (#b08968): 태그 텍스트(`#시즌`, `#원두`) 같은 부차적 강조에만 쓰는 2차 액센트.
  버튼 배경으로는 쓰지 않는다.

### Neutral
- **Cream** (#faf6f0): 페이지 배경. 순백이 아니라 은은한 미색으로 커피 브랜드의 온기를 유지한다.
- **Surface White** (#ffffff): 카드·입력창·모달 등 배경 위에 얹히는 표면. Cream과 대비되어
  콘텐츠 영역을 구분한다.
- **Espresso Ink** (#2e2420): 본문·제목 텍스트. 순검정이 아닌 짙은 에스프레소 톤.
- **Milk-Coffee Gray** (#8a7d72): 메타데이터·보조 텍스트·비활성 라벨(재고 수량 뒤 단위, 날짜,
  거래처명 등).
- **Border** (#e7ddd0): 카드 테두리, 구분선, input 테두리. 항상 은은해서 존재감이 콘텐츠를
  가리지 않는다.

### 상태 색 (Status)
- **Stock OK** (#3f7d5c): 정상 재고.
- **Stock Low** (#c0552e): 재고 부족 — 대시보드 지표, 배지, 발주 버튼 강조에 반복 사용.
- **Shipping Amber** (#b8892b): 배송중, 유통기한 임박 경고.
- **Inactive Gray** (#9a9a9a): 비활성화된 품목.

### Named Rules
**The One Action Rule.** 화면 어디서나 진짜 "액션"에만 Roasted Coffee를 쓴다. 정보 표시에는
상태 색이나 중립색만 쓰고, 브랜드 색으로 장식하지 않는다.

**The Dual-Signal Rule.** 상태는 색만으로 표현하지 않는다. 배지는 항상 색 배경 + 텍스트 라벨
(`재고 부족`, `배송중` 등)을 함께 쓴다. 색맹·저시력 직원도 텍스트로 구분할 수 있어야 한다.

## 3. Typography

**Body Font:** IBM Plex Sans KR (with system-ui, sans-serif fallback)

**Character:** 화면 전체가 단일 서체 하나로 통일된다. 위계는 폰트를 바꾸는 대신 굵기(500/700)와
크기(11px~18px)로만 만든다 — 담백하고 탄탄한 질감, 서체 간 대비로 주의를 끌지 않는다.

### Hierarchy
- **Headline** (700, 1.125rem/18px, line-height 1.3): 각 페이지 상단 제목("재고관리", "재고현황").
  화면당 한 번만 등장.
- **Title** (700, 0.875rem/14px, line-height 1.4): 카드/섹션 제목, 리스트 항목의 강조 텍스트
  (품목명), 버튼 레이블.
- **Body** (500, 0.875rem/14px, line-height 1.5): 기본 본문 — 리스트 행, 폼 입력값. 이 시스템의
  주력 크기로, 화면 텍스트의 대다수를 차지한다.
- **Label** (500, 0.6875rem/11px, line-height 1.3): 메타데이터, 상태 배지, 하단 네비 라벨, 태그.
  Milk-Coffee Gray와 함께 쓰여 본문보다 한 단계 물러선다.

대시보드의 요약 숫자(재고 부족/배송중 건수)만 예외적으로 2rem/24px, 700 굵기를 써서 화면당
가장 중요한 숫자 하나를 지정한다.

### Named Rules
**The No-Display-Face Rule.** 히어로 헤드라인이나 마케팅용 디스플레이 서체는 존재하지 않는다.
가장 큰 텍스트도 24px을 넘지 않는다 — 이 앱은 소리치지 않는다.

## 4. Elevation

기본은 완전히 평면(flat)이다. `surface`(#ffffff)와 `background`(#faf6f0)의 밝기 대비만으로
카드와 배경을 구분하고, box-shadow는 거의 쓰지 않는다. 유일한 예외는 재고관리 카드의 호버
피드백(`shadow-sm`, 아주 미세한 그림자)과 레시피 검색 드롭다운(`shadow-lg`, 플로팅 목록이
아래 콘텐츠 위에 뜬다는 것을 알리는 용도)뿐이다. 모달은 그림자가 아니라 반투명 어두운
배경(`rgba(0,0,0,0.4)`)으로 전면 콘텐츠와 분리한다.

### Shadow Vocabulary
- **hover-lift** (`box-shadow: 0 1px 2px rgba(0,0,0,0.05)`, Tailwind `shadow-sm`): 재고관리
  품목 카드에 마우스/터치 호버 시에만 등장하는 아주 미세한 그림자.
- **floating-panel** (`box-shadow: 0 10px 15px rgba(0,0,0,0.1)`, Tailwind `shadow-lg`): 레시피
  재료 검색 콤보박스처럼 콘텐츠 위에 뜨는 목록 전용.

### Named Rules
**The Flat-By-Default Rule.** 카드·버튼·입력창은 정지 상태에서 그림자가 없다. 그림자는 오직
호버 또는 콘텐츠가 다른 콘텐츠 위로 떠야 할 때만 응답으로 등장한다.

## 5. Components

담백하고 탄탄한 질감 — 장식 없이 명확한 경계와 배경 대비로만 구조를 드러낸다.

### Buttons
- **Shape:** 부드럽게 둥근 모서리 (12px, `rounded-xl`)
- **Primary:** 배경 Roasted Coffee(#6f4e37), 텍스트 흰색, 패딩 12px 16px, `title` 타이포(700,
  14px). "적용", "저장", "발주하기", "발주 완료"처럼 화면당 핵심 액션 하나에만 쓴다.
- **Disabled:** 동일 색상에 40% 불투명도(`disabled:opacity-40`)로 흐려지되 색은 바꾸지 않는다.
- **Secondary / Ghost:** 배경 없이 테두리(#e7ddd0)만 있는 버전(예: "취소", 이력 필터 비활성
  상태). 텍스트는 Espresso Ink 또는 Milk-Coffee Gray.
- **Destructive:** 삭제류 액션(품목 삭제)은 배경 대신 Stock Low(#c0552e) 텍스트 + 테두리로
  존재감을 낮춰 시작하고, 확정 단계에서만 채워진 빨간 배경으로 전환한다(2단계 확인).

### Chips (필터 칩 — 카테고리/거래처/상태)
- **Style:** 완전한 원형(`rounded-full`), 활성 시 배경 Roasted Coffee + 흰 텍스트, 비활성 시
  배경 Surface White + 테두리 + Milk-Coffee Gray 텍스트.
- **State:** 필터 선택형(단일/다중 선택 가능), 가로 스크롤 목록에 나열.

### Cards / Containers
- **Corner Style:** 12px(`rounded-xl`, 일반 섹션) 또는 16px(`rounded-2xl`, 모달)
- **Background:** Surface White, Border는 #e7ddd0
- **Shadow Strategy:** 기본 없음(Elevation 섹션 참고) — 배경색 대비만으로 구분
- **Internal Padding:** 12~16px(`p-3`~`p-4`)

### Inputs / Fields
- **Style:** Surface White 배경, #e7ddd0 테두리, 8px 모서리(`rounded-lg`), 패딩 8px 12px
- **Focus:** 테두리 색이 Roasted Coffee로 전환(`focus:border-primary`) — 글로우나 그림자 없이
  테두리 색 변화만으로 포커스를 알린다.
- **재고 수량 입력(Signature):** `StockInput` 컴포넌트는 두 가지 모드를 갖는다 — 개별 모드는
  −/입력/+ 한 줄, 묶음 모드는 "묶음" 줄과 "개별" 줄을 세로로 나눠 각각 독립된 −/입력/+ 스테퍼를
  준다(사이에 `+` 기호로 합산 관계를 보여줌). 숫자 입력창은 항상 중앙 정렬·굵은 숫자(700)로
  터치 후 바로 읽을 수 있게 한다.

### Status Badge
- **Style:** 완전한 원형(pill), 상태 색의 10% 불투명도 배경 + 동일 색 텍스트(`bg-low/10
  text-low` 같은 패턴). 배경은 항상 옅게, 텍스트는 항상 진하게 유지해 대비를 확보한다.
- **State:** 정상(초록)/재고 부족(빨강)/배송중(황토)/비활성화(회색) 4종 고정.

### Navigation
- **하단 탭바(5개 고정):** 아이콘 + 11px 라벨 수직 배치, 활성 탭은 Roasted Coffee 색 + 굵은
  아이콘 선(2.4px), 비활성 탭은 Milk-Coffee Gray + 얇은 선(1.8px). 배경은 95% 불투명 Surface
  White + 상단 테두리, iOS 안전영역(`env(safe-area-inset-bottom)`) 대응.

## 6. Do's and Don'ts

### Do:
- **Do** 액션 버튼 하나에만 Roasted Coffee(#6f4e37)를 쓴다 — 화면에 여러 개의 브랜드색 버튼이
  동시에 강조되지 않게 한다.
- **Do** 상태는 색 배경(10% 불투명도) + 텍스트 라벨을 항상 함께 쓴다.
- **Do** 터치 타깃은 44px 이상을 기본으로 한다 — 고령/파트타이머 직원이 쓰는 공용 태블릿이다.
- **Do** 숫자·재고 수량은 굵게(700), 메타데이터는 흐리게(Milk-Coffee Gray) — 굵기 대비로 위계를
  만든다.
- **Do** 재고 수량 스테퍼는 묶음/개별을 나눠 각각 독립적으로 조작 가능하게 한다.

### Don't:
- **Don't** 엑셀형 재고관리 툴처럼 칸이 빽빽한 표를 만들지 않는다. 리스트 행 사이에는 항상
  여백과 구분선을 둔다.
- **Don't** 화려한 SaaS 대시보드처럼 그라데이션, 히어로 메트릭 카드, 과도한 장식을 쓰지 않는다.
- **Don't** 장난스러운 소비자 앱처럼 캐주얼하거나 유희적인 인터랙션(통통 튀는 바운스, 이모지
  범벅 카피)을 넣지 않는다 — 이건 업무 도구다.
- **Don't** `border-left`/`border-right` 색 스트라이프를 강조 장식으로 쓰지 않는다.
- **Don't** 그림자를 기본 상태에서 쓰지 않는다. 정지 상태의 카드·버튼·입력창은 평면이어야 한다.
- **Don't** 텍스트에 그라데이션(`background-clip: text`)을 쓰지 않는다. 강조는 굵기/크기로만.
