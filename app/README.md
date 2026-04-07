# School District Evaluator App

This is a lightweight Flask app for evaluating US school districts with a browser-based explorer, saved comparisons, district detail pages, and a real NCES data-ingestion path.

## Structure
- `backend/`: Flask API, NCES ingestion pipeline, cached/fallback data loading, and frontend serving
- `frontend/`: HTML, CSS, and browser-side logic
- `tests/`: API, routing, and data-pipeline tests

## Getting Started

1. Install dependencies: `pip install -r backend/requirements.txt`
2. Refresh the live district cache once: `python backend/sync_district_data.py`
3. Run the server: `python backend/app.py`
4. Open `http://127.0.0.1:5000`
5. Run tests: `python -m unittest discover tests`
6. Generate coverage: `coverage run -m unittest discover tests ; coverage report -m`

## Current Features
- Pull district structure data from public NCES CCD and EDGE datasets into a local cache
- Fall back to a bundled sample dataset when the live refresh is unavailable
- Search districts by name, state, county, or locale
- Save districts into a reusable compare set backed by browser local storage
- Open district detail pages with contact, location, and same-state peer context
- Share a comparison view through a copyable URL

## Notes
- The current live pipeline uses NCES CCD and NCES EDGE district datasets. The app computes a structural resource index from staffing ratio, teacher density, school count, and grade-span continuity.
- The resource index is a triage signal, not an academic quality score.
- Docker deployment is included through `Dockerfile`, and the production command runs the Flask app with Gunicorn.
