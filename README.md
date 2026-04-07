# National School District Explorer

This repository contains a `Next.js` + `TypeScript` MVP for exploring U.S. school districts with transparent public-data metrics and an AI-generated district brief.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and provide an OpenAI API key if you want the AI brief endpoint enabled:

   ```bash
   cp .env.example .env.local
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` starts the Next.js development server.
- `npm run build` builds the production app.
- `npm run start` starts the production server after a build.
- `npm run lint` runs ESLint.
- `npm run test` runs the Vitest suite once.
- `npm run test:coverage` runs Vitest with coverage thresholds.

## Environment

- `OPENAI_API_KEY` enables the AI brief endpoint.
- `OPENAI_MODEL` optionally overrides the default model name.

If no API key is configured, `POST /api/brief` returns a `503 AI_UNAVAILABLE` response and the rest of the app remains usable.

## Public data

Lane 1 uses fixture data committed in [`data/districts.fixture.json`](/Users/anthony/Documents/Projects/ai-schools-workshop-cosmic_pumas/data/districts.fixture.json). Later lanes can replace that source with a reproducible NCES-generated snapshot without changing the public API contracts.

## Routes

- `/` search-oriented landing page scaffold
- `/districts/[id]` district detail scaffold
- `/compare?ids=id1,id2` comparison scaffold
- `/api/districts`
- `/api/districts/[id]`
- `/api/brief`
