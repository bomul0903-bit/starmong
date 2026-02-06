# Starmong PRD (Product Requirements Document)

## 1. 프로젝트 개요

**Starmong**은 IAU 공식 88개 별자리 데이터를 기반으로 한 인터랙티브 별자리 연결 게임이다. 사용자는 별을 순서대로 연결하여 별자리를 완성하고, 카드를 수집하며, 점수를 획득한다.

- **버전**: 0.1.0
- **언어**: 한국어 UI
- **플랫폼**: 웹 (모바일 우선 레이아웃, max-width 448px)

---

## 2. 기술 스택

| 항목 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | React | 19 |
| 빌드 도구 | Vite | 6 |
| 스타일링 | Tailwind CSS + tailwindcss-animate | 3.4 |
| 아이콘 | lucide-react | 0.468 |
| 렌더링 | SVG (퍼센트 좌표, 반응형) | - |
| 데이터 저장 | localStorage | - |

---

## 3. 파일 구조

```
starmong/
├── index.html                          # HTML 진입점 (lang="ko")
├── package.json                        # 프로젝트 설정 (v0.1.0)
├── vite.config.js                      # Vite 설정 (react 플러그인)
├── tailwind.config.js                  # Tailwind 설정 (tailwindcss-animate)
├── postcss.config.js                   # PostCSS 설정
├── CLAUDE.md                           # Claude Code 가이드
├── src/
│   ├── main.jsx                        # ReactDOM 렌더링 진입점
│   ├── index.css                       # Tailwind directives
│   ├── starmong_gemini.jsx             # 메인 앱 (단일 파일 SPA, 409줄)
│   ├── starmong.jsx                    # 레거시 Canvas 프로토타입 (미사용)
│   └── data/
│       └── constellations.json         # 88개 별자리 데이터 (85KB)
├── scripts/
│   └── generate-constellations.js      # d3-celestial 기반 데이터 생성 스크립트
└── dist/                               # 프로덕션 빌드 결과물
```

---

## 4. 빌드 및 실행 명령어

```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드 (dist/)
npm run preview      # 프로덕션 빌드 미리보기
npm run generate     # 별자리 데이터 재생성
```

---

## 5. 앱 구조

단일 파일 SPA (`src/starmong_gemini.jsx`)로 구성되며, `view` 상태값으로 3개 화면을 전환한다.

### 5.1 Menu (메뉴 화면)

- 마스코트 강아지 캐릭터 (lucide `Dog` 아이콘, 바운스 애니메이션)
- "Star Mong" 타이틀 (그라디언트 텍스트: yellow → orange)
- 88개 별자리 카드 수집 안내 문구
- **[탐사 시작]** 버튼 → Map 뷰로 전환

### 5.2 Map (도감 화면)

- 4개 난이도 티어로 별자리 분류:

| 티어 | 라벨 | 색상 | 기준 |
|------|------|------|------|
| easy | 쉬움 | emerald | 별 3개 이하 |
| medium | 보통 | blue | 별 4~6개 |
| hard | 어려움 | orange | 별 7~11개 |
| extreme | 극한 | rose | 별 12개 이상 |

- **잠금 시스템**: 이전 티어의 모든 별자리를 완료해야 다음 티어 해금
- 각 별자리 항목에 표시되는 정보: 별 개수, 한국어 이름, 영어 이름(미완료 시) 또는 "수집 완료" 상태
- 완료된 별자리는 미니어처 SVG 썸네일 표시 (`Miniature` 컴포넌트)

### 5.3 Game (게임 화면)

- **타이머**: 경과 시간 표시 (분:초)
- **진행률**: 연결된 선 수 / 전체 선 수
- **남은 기회**: 3개 원형 인디케이터 (실수 시 소멸)
- **별 노드**: 퍼센트 좌표 기반 절대 위치 배치, 클릭으로 상호작용
- **힌트 버튼**: 2초간 정답 경로를 반투명 점선으로 표시
- **강아지 말풍선**: 하단에 상황별 안내 메시지 표시
- **별자리 이름 배지**: 우측 상단에 현재 별자리 이름 표시

---

## 6. 게임 로직

### 6.1 별 연결

1. 첫 번째 별 클릭 → 활성 별로 설정 (노란색 하이라이트)
2. 다음 별 클릭 → 정답 경로(`path`)와 대조
   - **정답**: 선 그려짐 (노란색 애니메이션), 활성 별 이동, +150점
   - **오답**: 실수 횟수 +1, 강아지 경고 메시지
   - **이미 연결된 선**: 활성 별만 이동 (패널티 없음)
3. 모든 선 연결 완료 → `finishGame()` 호출

### 6.2 점수 체계

| 이벤트 | 점수 |
|--------|------|
| 선 연결 성공 | +150 |
| 별자리 완성 보너스 | +2000 - (경과시간 × 10), 최소 +1000 |

### 6.3 실패 조건

- 잘못된 연결 **3회** 시 게임 오버
- 실패 모달에서 선택 가능:
  - **다시 도전하기**: 게임 초기화 후 재시작
  - **모양 다시 확인**: 실수 횟수 리셋 + 힌트 표시 후 이어서 진행

### 6.4 완료 처리

- 완료 시 0.8초 후 "Star-Mong Card" 모달 표시
- 카드에 완성된 별자리 SVG + 이름 + 설명 표시
- **[도감에 보관하기]** 버튼 → Map 뷰로 복귀

---

## 7. 데이터 구조

### 7.1 별자리 데이터 (`constellations.json`)

```json
{
  "id": "Ori",
  "name": "오리온자리",
  "nameEn": "Orion",
  "difficulty": "어려움",
  "desc": "오리온자리(Orion)",
  "stars": [
    { "id": 1, "x": 45, "y": 20, "r": 5, "name": "베텔게우스" }
  ],
  "path": [[1, 2], [2, 3]]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | IAU 약어 (예: "Ori") |
| `name` | string | 한국어 이름 |
| `nameEn` | string | 영어 이름 |
| `difficulty` | string | "쉬움" / "보통" / "어려움" / "극한" |
| `desc` | string | 설명 텍스트 |
| `stars` | array | 별 목록 |
| `stars[].id` | number | 별 고유 ID (1부터 순차) |
| `stars[].x` | number | X 좌표 (0-100%, 경도 기반) |
| `stars[].y` | number | Y 좌표 (0-100%, 위도 기반, Y축 반전) |
| `stars[].r` | number | 반지름 (2-6, 등급 기반) |
| `stars[].name` | string? | 별 이름 (한국어, 선택) |
| `path` | array | 연결 경로 `[starId1, starId2]` 쌍 |

### 7.2 localStorage 저장 항목

| 키 | 타입 | 설명 |
|----|------|------|
| `starmong-completed` | JSON (number[]) | 완료한 별자리 ID 목록 |
| `starmong-score` | string (number) | 누적 점수 |

---

## 8. 데이터 파이프라인

`scripts/generate-constellations.js`가 d3-celestial 오픈소스 데이터를 가공한다.

### 처리 단계

1. **데이터 다운로드**: d3-celestial GitHub에서 4개 파일 fetch
   - 별자리 선 데이터 (`constellations.lines.json`)
   - 별자리 이름 데이터 (`constellations.json`)
   - 별 카탈로그 (`stars.6.json`)
   - 별 이름 (`starnames.json`)
2. **꼭짓점 추출**: MultiLineString에서 고유 좌표 추출 및 간선 생성
3. **별 매칭**: 각 꼭짓점을 가장 가까운 카탈로그 별과 매칭 (2도 이내)
4. **좌표 정규화**: 경위도를 10-90% 범위로 변환 (경도 래핑 처리)
5. **그래프 단순화**: 차수 2인 무명 노드 제거, 이웃 직접 연결
6. **뱀자리 병합**: 유일하게 2부분으로 나뉜 Serpens를 하나로 통합
7. **난이도 배정**: 최종 별 개수 기준 (≤3 쉬움, ≤6 보통, ≤11 어려움, 12+ 극한)
8. **출력**: `src/data/constellations.json`으로 저장

---

## 9. 상태 관리

React `useState`로 관리하는 상태 목록:

| 상태 | 타입 | 초기값 | 설명 |
|------|------|--------|------|
| `view` | string | `'menu'` | 현재 화면 (`menu`/`map`/`game`) |
| `completed` | number[] | localStorage | 완료한 별자리 ID 목록 |
| `currentLevel` | object | `null` | 현재 플레이 중인 별자리 데이터 |
| `activeStarId` | number | `null` | 현재 선택된 별 ID |
| `selectedStars` | number[] | `[]` | 이미 선택된 별 ID 목록 |
| `lines` | number[][] | `[]` | 그려진 연결선 `[id1, id2]` 목록 |
| `time` | number | `0` | 경과 시간 (초) |
| `score` | number | localStorage | 누적 점수 |
| `isGameActive` | boolean | `false` | 게임 진행 중 여부 |
| `showHint` | boolean | `false` | 힌트 표시 여부 |
| `showEduCard` | boolean | `false` | 완료 카드 모달 표시 여부 |
| `showFailCard` | boolean | `false` | 실패 모달 표시 여부 |
| `mistakes` | number | `0` | 현재 게임 실수 횟수 |
| `dogMsg` | string | 인사말 | 강아지 안내 메시지 |

---

## 10. UI/UX 디자인

### 10.1 색상 체계

- **배경**: `#020617` (slate-950)
- **카드/컨테이너**: slate-800/slate-900 계열
- **주요 액센트**: yellow-400/yellow-500 (별, 점수, 완료 표시)
- **보조 액센트**: blue-400 (시간, 별 수 표시)
- **오류/실패**: rose-500
- **난이도별**: emerald(쉬움), blue(보통), orange(어려움), rose(극한)

### 10.2 공통 UI 요소

- **상단 바**: 점수 (트로피 아이콘) + 수집률 (별 아이콘) + 홈 버튼
- **둥근 모서리**: 대부분 2rem~3rem 라운딩
- **애니메이션**: tailwindcss-animate 활용 (zoom-in, slide-in, fade-in)
- **커스텀 스크롤바**: 4px 너비, slate-700 색상

### 10.3 인터랙션

- 별 클릭 시 크기/색상 변화 (활성: 노란색 확대 + glow, 선택됨: 작은 노란색, 미선택: 흰색 반투명)
- 연결선: 노란색 대시 애니메이션 (`stroke-dasharray` + `@keyframes dash`)
- 버튼: `active:translate-y-1` + `shadow` 조합으로 3D 눌림 효과

---

## 11. 현재 상태

### 완료된 항목

- [x] 메뉴/도감/게임 3개 뷰 구현
- [x] 88개 IAU 공식 별자리 데이터 생성 파이프라인
- [x] 별 연결 게임 로직 (점수, 실수, 힌트)
- [x] 난이도 티어 분류 및 잠금 시스템
- [x] 완료 카드 모달 및 도감 수집
- [x] localStorage 기반 진행 상태 저장
- [x] 프로덕션 빌드 (`dist/`)

### 미완료 / 개선 가능 항목

- [ ] Git 버전 관리 초기화
- [ ] 컴포넌트 분리 (현재 409줄 단일 파일)
- [ ] 별자리 교육 콘텐츠 (현재 `desc`가 단순 이름 반복)
- [ ] 사운드 효과 (연결 성공/실패/완성)
- [ ] 별 반짝임 등 배경 애니메이션
- [ ] 모바일 터치 드래그 UX (현재 탭 방식만)
- [ ] PWA 지원 (오프라인 플레이)
- [ ] 리더보드 / 소셜 공유
- [ ] 접근성 (키보드 네비게이션, 스크린 리더)
- [ ] 레거시 파일 (`starmong.jsx`) 정리
