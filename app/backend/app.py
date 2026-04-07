from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

try:
    from backend.data_pipeline import load_cached_or_fallback, refresh_cache
except ModuleNotFoundError:
    from data_pipeline import load_cached_or_fallback, refresh_cache


BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
DEFAULT_SORT = "resource_index"
VALID_SORT_FIELDS = {
    "district_name",
    "state",
    "student_teacher_ratio",
    "teacher_count",
    "enrollment",
    "school_count",
    "resource_index",
}


DATA_STORE = load_cached_or_fallback(prefer_live=False)


def current_dataset():
    return DATA_STORE


def current_districts():
    return current_dataset()["districts"]


def current_meta():
    return current_dataset()["meta"]


def build_facets():
    districts = current_districts()
    return {
        "states": sorted({district["state"] for district in districts}),
        "locales": sorted({district["locale"] for district in districts}),
    }


def filter_districts(districts, search_term, state, min_score, locale):
    filtered = districts

    if search_term:
        lowered = search_term.lower()
        filtered = [
            district
            for district in filtered
            if lowered in district["district_name"].lower()
            or lowered in district["state"].lower()
            or lowered in district["state_name"].lower()
            or lowered in district["county_name"].lower()
            or lowered in district["locale"].lower()
        ]

    if state:
        filtered = [district for district in filtered if district["state"] == state.upper()]

    if locale:
        filtered = [district for district in filtered if district["locale"].lower() == locale.lower()]

    if min_score is not None:
        filtered = [district for district in filtered if district["resource_index"] >= min_score]

    return filtered


def sort_districts(districts, sort_field, sort_direction):
    field_name = sort_field if sort_field in VALID_SORT_FIELDS else DEFAULT_SORT
    reverse = sort_direction != "asc"
    return sorted(districts, key=lambda district: district[field_name], reverse=reverse)


def build_summary(districts):
    meta = current_meta()

    if not districts:
        return {
            "district_count": 0,
            "top_state": None,
            "average_score": 0,
            "lowest_ratio_district": None,
            "dataset_year": meta.get("dataset_year"),
            "source_mode": meta.get("source_mode"),
        }

    average_score = round(
        sum(district["resource_index"] for district in districts) / len(districts),
        1,
    )

    state_totals = {}
    for district in districts:
        state_totals.setdefault(district["state"], []).append(district["resource_index"])

    top_state, _ = max(
        state_totals.items(),
        key=lambda item: sum(item[1]) / len(item[1]),
    )

    lowest_ratio_district = min(
        districts,
        key=lambda district: district["student_teacher_ratio"],
    )

    return {
        "district_count": len(districts),
        "top_state": top_state,
        "average_score": average_score,
        "lowest_ratio_district": {
            "id": lowest_ratio_district["id"],
            "district_name": lowest_ratio_district["district_name"],
            "student_teacher_ratio": lowest_ratio_district["student_teacher_ratio"],
        },
        "dataset_year": meta.get("dataset_year"),
        "source_mode": meta.get("source_mode"),
    }


def find_district(district_id):
    return next((item for item in current_districts() if item["id"] == district_id), None)


def build_detail_payload(district):
    peers = [
        item
        for item in current_districts()
        if item["state"] == district["state"] and item["id"] != district["id"]
    ]
    peers.sort(key=lambda item: (-item["resource_index"], item["district_name"]))

    return {
        "district": district,
        "peers": peers[:4],
        "meta": current_meta(),
    }


def create_app(data_store=None):
    global DATA_STORE

    if data_store is not None:
        DATA_STORE = data_store

    app = Flask(__name__, static_folder=None)
    CORS(app)

    @app.get("/api/health")
    def health_check():
        return jsonify({"status": "ok"})

    @app.get("/api/data/status")
    def data_status():
        meta = current_meta()
        return jsonify(meta)

    @app.post("/api/data/refresh")
    def refresh_data():
        global DATA_STORE

        try:
            DATA_STORE = refresh_cache()
            return jsonify(DATA_STORE["meta"])
        except Exception as error:
            return jsonify({"error": f"Unable to refresh live data: {error}"}), 502

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

        filtered = filter_districts(current_districts(), search_term, state, parsed_score, locale)
        ordered = sort_districts(filtered, sort_field, sort_direction)
        summary = build_summary(ordered)

        limit = request.args.get("limit")
        if limit:
            ordered = ordered[: max(1, min(100, int(limit)))]

        return jsonify(
            {
                "districts": ordered,
                "summary": summary,
                "meta": current_meta(),
                "facets": build_facets(),
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
        district = find_district(district_id)
        if district is None:
            return jsonify({"error": "District not found"}), 404

        return jsonify(build_detail_payload(district))

    @app.get("/api/comparisons")
    def get_comparisons():
        ids = [value.strip() for value in request.args.get("ids", "").split(",") if value.strip()]
        if not ids:
            return jsonify({"districts": [], "meta": current_meta()})

        matches = [district for district in current_districts() if district["id"] in ids]
        sort_order = {district_id: index for index, district_id in enumerate(ids)}
        matches.sort(key=lambda district: sort_order.get(district["id"], 9999))
        return jsonify({"districts": matches, "meta": current_meta()})

    @app.get("/")
    def serve_index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/compare")
    def serve_compare():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/district/<district_id>")
    def serve_district_page(district_id):
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/<path:asset_path>")
    def serve_assets(asset_path):
        return send_from_directory(FRONTEND_DIR, asset_path)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
