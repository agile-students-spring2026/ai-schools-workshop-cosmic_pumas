import json
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS


BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
DATA_FILE = BASE_DIR / "data" / "districts.json"

STATE_NAMES = {
    "AZ": "Arizona",
    "CO": "Colorado",
    "MD": "Maryland",
    "NC": "North Carolina",
    "NE": "Nebraska",
    "OR": "Oregon",
    "TX": "Texas",
    "VA": "Virginia",
    "WI": "Wisconsin",
}

DEFAULT_SORT = "parent_fit_score"
VALID_SORT_FIELDS = {
    "district_name",
    "state",
    "graduation_rate",
    "math_proficiency",
    "reading_proficiency",
    "student_teacher_ratio",
    "per_student_spending",
    "teacher_salary",
    "college_readiness",
    "equity_score",
    "parent_fit_score",
}


def compute_parent_fit_score(district):
    academic_index = (
        district["graduation_rate"] * 0.3
        + district["math_proficiency"] * 0.2
        + district["reading_proficiency"] * 0.2
        + district["college_readiness"] * 0.2
        + district["equity_score"] * 0.1
    )
    absenteeism_penalty = district["chronic_absenteeism"] * 0.35
    ratio_penalty = max(district["student_teacher_ratio"] - 12, 0) * 1.4
    return max(0, min(100, academic_index - absenteeism_penalty - ratio_penalty + 12))


def load_districts():
    with DATA_FILE.open("r", encoding="utf-8") as file_handle:
        districts = json.load(file_handle)

    for district in districts:
        district["parent_fit_score"] = round(compute_parent_fit_score(district), 1)

    return districts


DISTRICTS = load_districts()


def filter_districts(districts, search_term, state, min_score, locale):
    filtered = districts

    if search_term:
        lowered = search_term.lower()
        filtered = [
            district
            for district in filtered
            if lowered in district["district_name"].lower()
            or lowered in district["state"].lower()
            or lowered in STATE_NAMES.get(district["state"], "").lower()
        ]

    if state:
        filtered = [district for district in filtered if district["state"] == state.upper()]

    if locale:
        filtered = [district for district in filtered if district["locale"].lower() == locale.lower()]

    if min_score is not None:
        filtered = [district for district in filtered if district["parent_fit_score"] >= min_score]

    return filtered


def sort_districts(districts, sort_field, sort_direction):
    field_name = sort_field if sort_field in VALID_SORT_FIELDS else DEFAULT_SORT
    reverse = sort_direction != "asc"
    return sorted(districts, key=lambda district: district[field_name], reverse=reverse)


def build_summary(districts):
    if not districts:
        return {
            "district_count": 0,
            "top_state": None,
            "average_score": 0,
            "best_value_district": None,
        }

    average_score = round(
        sum(district["parent_fit_score"] for district in districts) / len(districts),
        1,
    )

    state_totals = {}
    for district in districts:
        state_totals.setdefault(district["state"], []).append(district["parent_fit_score"])

    top_state, _ = max(
        state_totals.items(),
        key=lambda item: sum(item[1]) / len(item[1]),
    )

    best_value_district = max(
        districts,
        key=lambda district: district["parent_fit_score"] / district["per_student_spending"],
    )

    return {
        "district_count": len(districts),
        "top_state": top_state,
        "average_score": average_score,
        "best_value_district": {
            "id": best_value_district["id"],
            "district_name": best_value_district["district_name"],
            "parent_fit_score": best_value_district["parent_fit_score"],
        },
    }


def create_app():
    app = Flask(__name__, static_folder=None)
    CORS(app)

    @app.get("/api/health")
    def health_check():
        return jsonify({"status": "ok"})

    @app.get("/api/districts")
    def get_districts():
        search_term = request.args.get("search", "").strip()
        state = request.args.get("state", "").strip()
        locale = request.args.get("locale", "").strip()
        sort_field = request.args.get("sort", DEFAULT_SORT).strip()
        sort_direction = request.args.get("direction", "desc").strip().lower()

        min_score = request.args.get("minScore")
        parsed_score = None
        if min_score:
            try:
                parsed_score = float(min_score)
            except ValueError:
                return jsonify({"error": "minScore must be numeric"}), 400

        filtered = filter_districts(DISTRICTS, search_term, state, parsed_score, locale)
        ordered = sort_districts(filtered, sort_field, sort_direction)

        return jsonify(
            {
                "districts": ordered,
                "summary": build_summary(ordered),
                "filters": {
                    "search": search_term,
                    "state": state.upper(),
                    "locale": locale,
                    "minScore": parsed_score,
                    "sort": sort_field,
                    "direction": sort_direction,
                },
            }
        )

    @app.get("/api/districts/<district_id>")
    def get_district(district_id):
        district = next((item for item in DISTRICTS if item["id"] == district_id), None)
        if district is None:
            return jsonify({"error": "District not found"}), 404

        return jsonify(district)

    @app.get("/")
    def serve_index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/<path:asset_path>")
    def serve_assets(asset_path):
        return send_from_directory(FRONTEND_DIR, asset_path)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
