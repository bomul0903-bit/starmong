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
