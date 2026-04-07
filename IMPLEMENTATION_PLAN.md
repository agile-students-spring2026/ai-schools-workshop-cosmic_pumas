# National School District Explorer MVP

## Summary

Build a single `Next.js` + `TypeScript` app, deployed on Vercel, that lets parents and educators search U.S. school districts, inspect a transparent public-data scorecard, compare up to 3 districts, and generate an AI-written district brief from structured metrics.

Success criteria:

- National district dataset is available in-app from a committed, reproducible public-data snapshot.
- Users can search/filter districts, open a district detail page, compare districts, and request an AI brief.
- The app is runnable with `npm`, fully unit tested with 100% coverage on app code, and deployable with environment variables only.
- The product avoids an opaque "best district" ranking; it presents transparent comparisons and narrative summaries from public data.

## Public Interfaces

### Data source and storage

Use `NCES Common Core of Data` district directory plus district finance snapshot as the only required v1 data source.

Generate a normalized snapshot committed to the repo, not a live database.

Freeze the shared schema before parallel implementation starts:

- `DistrictRecord`
  - `id`
  - `name`
  - `state`
  - `locale`
  - `enrollment`
  - `teachers`
  - `studentTeacherRatio`
  - `revenuePerPupil`
  - `expenditurePerPupil`
  - `sourceYear`
- `DistrictComparison`
  - `district`
  - `nationalMedian`
  - `stateMedian`
  - `metricBands`
- `DistrictBriefRequest`
  - `districtId`
  - `comparisonDistrictIds[]`
- `DistrictBriefResponse`
  - `summary`
  - `strengths[]`
  - `cautions[]`
  - `comparisonNotes[]`
  - `sourceYear`

### App and API surface

- `GET /api/districts?query=&state=&locale=&sort=` returns searchable district summaries.
- `GET /api/districts/[id]` returns one district plus national/state comparison context.
- `POST /api/brief` accepts a `DistrictBriefRequest` and returns a `DistrictBriefResponse`.

UI routes:

- Landing/search page with filters and compare tray
- District detail page with metric cards and "Generate AI Brief"
- Comparison view for up to 3 districts

## Work Breakdown

### Shared kickoff

Target duration: 30-45 minutes

- Create the repo skeleton, testing setup, linting, deployment config, and fixture JSON matching the frozen interfaces.
- Agree on naming, file layout, and API contracts before anyone starts feature work.
- Have every lane build against fixture data first so real-data ingestion does not block UI or API implementation.

### Lane 1: App shell, backend contracts, deployment

Owner focus: platform/integration engineer

Tasks:

- Scaffold the `Next.js` app with strict TypeScript, `npm`, App Router, unit test runner, and coverage configuration.
- Set up Vercel-ready environment variable handling for the LLM provider.
- Implement data-access helpers against fixture data.
- Implement `GET /api/districts`, `GET /api/districts/[id]`, and `POST /api/brief`.
- Add request validation, response-shape validation, and consistent error handling.
- Wrap the model call in a single service interface so tests can mock it.
- Own final integration, deployment setup, and smoke-test flow.

Deliverables:

- Working app shell
- Stable API contracts
- Deployable environment configuration
- Mockable AI service boundary

### Lane 2: Data pipeline and comparison logic

Owner focus: data/logic engineer

Tasks:

- Build a reproducible ingestion script for NCES district directory and finance data.
- Normalize raw rows into the shared `DistrictRecord` schema.
- Emit a committed JSON snapshot for the app to consume.
- Implement deterministic helpers for lookup, filtering, sorting, state medians, national medians, and metric banding.
- Document data provenance and field definitions for each exposed metric.
- Produce early fixture data, then replace it with the normalized real snapshot without changing the contract.

Deliverables:

- Data ingestion script
- Normalized committed dataset
- Comparison and ranking helper functions
- Source and metric documentation

### Lane 3: Frontend UX and presentation

Owner focus: product/UI engineer

Tasks:

- Build the landing/search page against fixture data.
- Implement search, state filter, locale filter, sorting controls, district result cards, and compare tray.
- Build the district detail page with metric cards, comparison bands, and source-year display.
- Build the AI brief panel with loading, success, and failure states.
- Build the comparison view for up to 3 districts.
- Make the UI responsive and easy to demo live in under 5 minutes.

Deliverables:

- Search and discovery flow
- District detail flow
- Comparison experience
- Presentation-ready responsive UI

### Integration pass

Tasks:

- Swap fixture-backed data access to the generated NCES snapshot.
- Connect the live AI brief call through the shared service interface.
- Run the full test suite and close all coverage gaps.
- Perform a deploy smoke test on the production URL.
- Update the root `README.md` with setup, data sources, and demo instructions.

## Test Plan

### Unit tests

- Data normalization from NCES rows into `DistrictRecord`
- Filter, sort, and lookup helpers
- Median, banding, and comparison logic
- API validation and error mapping
- AI brief prompt builder and response parser with mocked model client

### Component and integration tests

- Search page filtering and compare tray behavior
- District detail loading, success, and failure states
- `POST /api/brief` success path with mocked AI response
- Missing `OPENAI_API_KEY` path returns a clear unavailable message without breaking the rest of the app

### Acceptance scenarios

- Search for a district by name and state
- Open a district and see transparent metrics with state/national context
- Compare 2-3 districts
- Generate an AI brief from selected district data
- Deploy and verify the production URL performs the same core flow

## Assumptions And Defaults

- Team size is 3 concurrent lanes.
- v1 is national in scope and uses only NCES public data.
- Additional Census enrichment is out of scope for the first version.
- v1 has no auth, saved lists, admin tools, or user-submitted data.
- v1 does not compute a single composite "best district" score.
- The deployment environment provides an LLM API key.
- If no API key is configured, the AI brief feature degrades gracefully while the rest of the app remains usable.
