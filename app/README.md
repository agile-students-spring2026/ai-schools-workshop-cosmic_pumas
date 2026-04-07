# School District Evaluator App

This is a lightweight Flask app for evaluating US school districts with a seed dataset and a browser-based comparison interface.

## Structure
- `backend/`: Flask API, data loading, and frontend serving
- `frontend/`: HTML, CSS, and browser-side logic
- `tests/`: API and page tests

## Getting Started

1. Install dependencies: `pip install -r backend/requirements.txt`
2. Run the server: `python backend/app.py`
3. Open `http://127.0.0.1:5000`
4. Run tests: `python -m unittest discover tests`

## Current Features
- Search districts by name or state abbreviation
- Filter by state, locale, and minimum fit score
- Sort by academic and staffing indicators
- Compare the top two matching districts side-by-side
- Inspect a summary block with count, average fit score, and best-value district

## Notes
- The dataset is a development seed for workshop implementation, not a production-grade live feed.
- The API is designed so you can later replace the JSON file with live public data sources such as NCES, EDFacts, Census, or state report cards.
