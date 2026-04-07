# District Data Pipeline

This directory contains the app-facing district snapshot and the provenance metadata produced by Lane 2.

Files:

- `districts.snapshot.json`: canonical normalized `DistrictRecord[]` dataset.
- `districts.fixture.json`: small deterministic subset for early integration and tests.
- `districts.metadata.json`: source URLs, source years, row counts, and exclusion totals.

Source metrics:

- `enrollment`: district fall membership from the NCES F-33 `V33` field.
- `teachers`: district teacher FTE from the CCD LEA Staff `Teachers` category.
- `studentTeacherRatio`: `enrollment / teachers`, rounded to one decimal.
- `revenuePerPupil`: district total revenue divided by enrollment, rounded to the nearest whole dollar.
- `expenditurePerPupil`: district current elementary/secondary expenditure divided by enrollment, rounded to the nearest whole dollar.

Filtering rules:

- Keep only open regular public districts from the CCD LEA directory.
- Require a district join across directory, staff, finance, and locale sources.
- Exclude districts with missing or non-positive enrollment, teacher counts, revenue, or expenditure.

Locale mapping:

- `11-13` -> `city`
- `21-23` -> `suburb`
- `31-33` -> `town`
- `41-43` -> `rural`
