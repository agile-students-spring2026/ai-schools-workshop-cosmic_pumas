import csv
import io
import json
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import requests


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
CACHE_FILE = DATA_DIR / "districts_cache.json"
FALLBACK_FILE = DATA_DIR / "districts_fallback.json"

DIRECTORY_URL = "https://nces.ed.gov/ccd/Data/zip/ccd_lea_029_1819_l_1a_091019.zip"
CHARACTERISTICS_URL = "https://data-nces.opendata.arcgis.com/api/download/v1/items/be3f7956f07849369e75f7008b2899d3/csv?layers=0"
OFFICE_URL = "https://data-nces.opendata.arcgis.com/api/download/v1/items/2cf893e8f3304db18ea9dd239acc74a3/csv?layers=0"
SOURCE_LABEL = "NCES CCD 2018-19 + NCES EDGE district datasets"
SOURCE_URLS = [DIRECTORY_URL, CHARACTERISTICS_URL, OFFICE_URL]

GRADE_ORDER = {
    "PK": 0,
    "KG": 1,
    "01": 2,
    "02": 3,
    "03": 4,
    "04": 5,
    "05": 6,
    "06": 7,
    "07": 8,
    "08": 9,
    "09": 10,
    "10": 11,
    "11": 12,
    "12": 13,
    "13": 14,
    "UG": 15,
}


def strip_bom(text):
    return text.lstrip("\ufeff")


def parse_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def parse_int(value, default=0):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def slugify(text):
    cleaned = []
    previous_dash = False
    for character in text.lower():
        if character.isalnum():
            cleaned.append(character)
            previous_dash = False
        elif not previous_dash:
            cleaned.append("-")
            previous_dash = True

    return "".join(cleaned).strip("-")


def normalize_state_name(name):
    return " ".join(part.capitalize() for part in name.split())


def normalize_locale(locale_text):
    if not locale_text:
        return "Unknown"

    return locale_text.strip()


def grade_span_score(grade_low, grade_high):
    low_value = GRADE_ORDER.get(grade_low, 2)
    high_value = GRADE_ORDER.get(grade_high, 13)

    if low_value <= GRADE_ORDER["PK"] and high_value >= GRADE_ORDER["12"]:
        return 100
    if high_value >= GRADE_ORDER["12"]:
        return 88
    if high_value >= GRADE_ORDER["08"]:
        return 76
    return 64


def compute_resource_index(enrollment, teacher_count, student_teacher_ratio, school_count, grade_low, grade_high):
    if enrollment <= 0 or teacher_count <= 0:
        return 0.0

    ratio_component = max(0, min(100, 100 - max(student_teacher_ratio - 10, 0) * 6.5))
    teacher_density = (teacher_count / enrollment) * 1000
    density_component = max(0, min(100, teacher_density * 1.7))
    school_component = max(0, min(100, school_count * 4.5))
    continuity_component = grade_span_score(grade_low, grade_high)

    return round(
        ratio_component * 0.45
        + density_component * 0.25
        + school_component * 0.1
        + continuity_component * 0.2,
        1,
    )


def read_zip_csv(url, session):
    response = session.get(url, timeout=90)
    response.raise_for_status()

    archive = zipfile.ZipFile(io.BytesIO(response.content))
    inner_name = archive.namelist()[0]

    with archive.open(inner_name) as handle:
        reader = csv.DictReader(io.TextIOWrapper(handle, encoding="latin1"))
        return [
            {strip_bom(key): value for key, value in row.items()}
            for row in reader
        ]


def read_csv_url(url, session):
    response = session.get(url, timeout=90)
    response.raise_for_status()
    reader = csv.DictReader(io.StringIO(response.text))
    return [{strip_bom(key): value for key, value in row.items()} for row in reader]


def normalize_district(directory_row, characteristics_row, office_row):
    enrollment = parse_int(characteristics_row.get("MEMBER"))
    teacher_count = parse_float(characteristics_row.get("TOTTCH"))
    school_count = parse_int(characteristics_row.get("SCH"))
    ratio = parse_float(characteristics_row.get("STUTERATIO"))
    if not ratio and enrollment and teacher_count:
        ratio = round(enrollment / teacher_count, 1)

    grade_low = characteristics_row.get("GSLO") or "PK"
    grade_high = characteristics_row.get("GSHI") or "12"
    locale = normalize_locale(characteristics_row.get("LOCALE_TEXT") or office_row.get("LOCALE"))
    district_name = directory_row.get("LEA_NAME") or characteristics_row.get("LEA_NAME") or office_row.get("NAME")

    return {
        "id": slugify(f"{district_name}-{directory_row.get('ST', '')}-{directory_row.get('LEAID', '')}"),
        "district_name": district_name,
        "district_code": directory_row.get("LEAID"),
        "state": directory_row.get("ST"),
        "state_name": normalize_state_name(directory_row.get("STATENAME", "")),
        "county_name": characteristics_row.get("CONAME") or office_row.get("NMCNTY") or "Unknown",
        "locale": locale,
        "grade_low": grade_low,
        "grade_high": grade_high,
        "school_year": characteristics_row.get("SURVYEAR") or directory_row.get("SCHOOL_YEAR"),
        "lea_type": directory_row.get("LEA_TYPE_TEXT") or characteristics_row.get("LEA_TYPE_TEXT"),
        "charter_status": directory_row.get("CHARTER_LEA_TEXT", "Unknown"),
        "enrollment": enrollment,
        "teacher_count": round(teacher_count, 1),
        "school_count": school_count,
        "student_teacher_ratio": round(ratio, 1),
        "resource_index": compute_resource_index(enrollment, teacher_count, ratio, school_count, grade_low, grade_high),
        "office_city": directory_row.get("LCITY") or office_row.get("CITY") or "",
        "office_state": directory_row.get("LSTATE") or office_row.get("STATE") or directory_row.get("ST"),
        "office_zip": directory_row.get("LZIP") or office_row.get("ZIP") or "",
        "phone": directory_row.get("PHONE") or "",
        "website": directory_row.get("WEBSITE") or "",
        "latitude": parse_float(characteristics_row.get("Lat") or office_row.get("LAT")),
        "longitude": parse_float(characteristics_row.get("Long") or office_row.get("LON")),
        "metro_area": office_row.get("NMCBSA") or "",
        "source_label": SOURCE_LABEL,
    }


def build_live_dataset(requests_session=None):
    session = requests_session or requests.Session()
    directory_rows = read_zip_csv(DIRECTORY_URL, session)
    characteristics_rows = read_csv_url(CHARACTERISTICS_URL, session)
    office_rows = read_csv_url(OFFICE_URL, session)

    directory_map = {
        row["LEAID"]: row
        for row in directory_rows
        if row.get("SY_STATUS_TEXT") == "Open"
        and "Regular public school district" in (row.get("LEA_TYPE_TEXT") or "")
    }
    office_map = {row["LEAID"]: row for row in office_rows if row.get("LEAID")}

    districts = []
    for row in characteristics_rows:
        leaid = row.get("LEAID")
        directory_row = directory_map.get(leaid)
        if directory_row is None:
            continue

        enrollment = parse_int(row.get("MEMBER"))
        teacher_count = parse_float(row.get("TOTTCH"))
        if enrollment <= 0 or teacher_count <= 0:
            continue

        districts.append(normalize_district(directory_row, row, office_map.get(leaid, {})))

    districts.sort(key=lambda district: (-district["resource_index"], district["district_name"]))

    return {
        "meta": {
            "source_mode": "live",
            "source_label": SOURCE_LABEL,
            "source_urls": SOURCE_URLS,
            "record_count": len(districts),
            "dataset_year": "2018-2019",
            "last_refreshed": datetime.now(timezone.utc).isoformat(),
        },
        "districts": districts,
    }


def write_dataset(dataset, path):
    path.write_text(json.dumps(dataset, indent=2), encoding="utf-8")


def read_dataset(path):
    return json.loads(path.read_text(encoding="utf-8"))


def load_cached_or_fallback(prefer_live=False):
    if CACHE_FILE.exists():
        dataset = read_dataset(CACHE_FILE)
        dataset.setdefault("meta", {})["source_mode"] = dataset.get("meta", {}).get("source_mode", "cache")
        return dataset

    if prefer_live:
        try:
            return refresh_cache()
        except requests.RequestException:
            pass

    dataset = read_dataset(FALLBACK_FILE)
    dataset.setdefault("meta", {})["source_mode"] = dataset.get("meta", {}).get("source_mode", "fallback")
    return dataset


def refresh_cache(requests_session=None):
    dataset = build_live_dataset(requests_session=requests_session)
    write_dataset(dataset, CACHE_FILE)
    return dataset