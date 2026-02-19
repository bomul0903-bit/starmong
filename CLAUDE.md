# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Starmong is an interactive constellation drawing game built with React. Users connect stars to form constellations, collect cards, and earn scores. The UI is in Korean.

## Tech Stack

- **React 19** + **Vite 6**
- **Tailwind CSS 3** + **tailwindcss-animate** for styling and animations
- **lucide-react** for icons
- SVG-based rendering (percentage coordinates for responsiveness)

## Build & Dev Commands

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server
npm run build        # production build to dist/
npm run preview      # preview production build
```

## Architecture

The main app lives in `src/starmong_gemini.jsx` — a single-file SPA with 3 views:

- **menu** — title screen with mascot dog character
- **map** — constellation list (도감) with completion status
- **game** — star connection gameplay with timer, hints, score

Star data uses percentage-based coordinates (0–100) for responsive SVG rendering. 4 constellations have hand-crafted presets; the rest are procedurally generated.

The legacy `src/starmong.jsx` is an earlier Canvas-based prototype (unused).

## Components

- `src/components/BackgroundStars` — 배경 별 애니메이션
- `src/components/TopBar` — 점수/진행도/아바타/홈/로그아웃
- `src/components/LoginView` — 로그인 화면 (Google OAuth + 익명)
- `src/components/MenuView` — 메뉴 화면
- `src/components/MapView` — 별자리 도감
- `src/components/GameView` — 게임 플레이
- `src/components/EduCardModal` — 학습 카드 모달
- `src/components/FailCardModal` — 실패 카드 모달
- `src/components/Miniature` — 별자리 미니어처

## Lib

- `src/lib/gameLogic.js` — 순수 게임 로직
- `src/lib/constants.js` — STAGES, TIERS, MAX_MISTAKES
- `src/lib/soundEngine.js` — Web Audio API (try-catch protected)
- `src/lib/supabase.js` — Supabase 클라이언트 (env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

## Testing

```bash
npx vitest run                           # 전체 85 tests
npx vitest run src/lib/__tests__/        # gameLogic 순수 함수 (35 tests, node 환경)
npx vitest run src/components/__tests__/ # 컴포넌트 렌더링/인터랙션 (50 tests, jsdom 환경)
```

- **설정**: `vite.config.js` (environment: node + setupFiles), `src/test/setup.js` (jest-dom + cleanup)
- **Mock**: `src/test/mocks.js` — SoundEngine/Supabase mock 함수, TEST_LEVEL fixtures
- **컴포넌트 테스트**: `// @vitest-environment jsdom` 주석으로 per-file jsdom 전환 (기존 node 테스트와 공존)
- **라이브러리**: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
- **커버리지**: LoginView(6), TopBar(8), GameView(17), MenuView(4), MapView(6), EduCardModal(5), FailCardModal(4)

## Auth (Supabase)

- **Google OAuth**: `supabase.auth.signInWithOAuth({ provider: 'google' })`
- **익명 로그인**: `supabase.auth.signInAnonymously()` (대시보드에서 Enable anonymous sign-ins 필요)
- 플로우: loading → LoginView (미인증) → 앱 (인증됨)
- TopBar 아바타: `user.is_anonymous` → lucide User 아이콘 / Google → 프로필 이미지
- 패키지: `@supabase/supabase-js`

## Data

- 88 constellations in `src/data/constellations.json`, 9-tier difficulty system
