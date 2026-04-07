import type {
  DistrictDatasetMetadata,
  DistrictLocale,
  DistrictRecord,
} from "./types.js";

const validLocales = new Set<DistrictLocale>(["city", "suburb", "town", "rural"]);

function assertFiniteNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

export function assertDistrictRecord(value: unknown): asserts value is DistrictRecord {
  if (typeof value !== "object" || value === null) {
    throw new Error("District record must be an object.");
  }

  const record = value as Record<string, unknown>;

  assertString(record.id, "District id");
  assertString(record.name, "District name");
  assertString(record.state, "District state");
  assertString(record.sourceYear, "District sourceYear");
  assertFiniteNumber(record.enrollment, "District enrollment");
  assertFiniteNumber(record.teachers, "District teachers");
  assertFiniteNumber(record.studentTeacherRatio, "District studentTeacherRatio");
  assertFiniteNumber(record.revenuePerPupil, "District revenuePerPupil");
  assertFiniteNumber(record.expenditurePerPupil, "District expenditurePerPupil");

  if (!validLocales.has(record.locale as DistrictLocale)) {
    throw new Error("District locale must be one of city, suburb, town, or rural.");
  }
}

export function parseDistrictRecords(json: string): DistrictRecord[] {
  const parsed = JSON.parse(json) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("District snapshot must be an array.");
  }

  parsed.forEach(assertDistrictRecord);
  return parsed;
}

export function assertDistrictDatasetMetadata(
  value: unknown,
): asserts value is DistrictDatasetMetadata {
  if (typeof value !== "object" || value === null) {
    throw new Error("Dataset metadata must be an object.");
  }

  const metadata = value as Record<string, unknown>;
  assertString(metadata.generatedAt, "Metadata generatedAt");
  assertString(metadata.snapshotYear, "Metadata snapshotYear");

  if (typeof metadata.sources !== "object" || metadata.sources === null) {
    throw new Error("Metadata sources must be present.");
  }

  if (typeof metadata.counts !== "object" || metadata.counts === null) {
    throw new Error("Metadata counts must be present.");
  }

  const counts = metadata.counts as Record<string, unknown>;
  assertFiniteNumber(counts.directoryRows, "Metadata directoryRows");
  assertFiniteNumber(counts.staffRows, "Metadata staffRows");
  assertFiniteNumber(counts.financeRows, "Metadata financeRows");
  assertFiniteNumber(counts.localeRows, "Metadata localeRows");
  assertFiniteNumber(counts.outputRecords, "Metadata outputRecords");
  assertFiniteNumber(counts.fixtureRecords, "Metadata fixtureRecords");

  if (typeof counts.excluded !== "object" || counts.excluded === null) {
    throw new Error("Metadata excluded counts must be present.");
  }
}

export function parseDistrictMetadata(json: string): DistrictDatasetMetadata {
  const parsed = JSON.parse(json) as unknown;
  assertDistrictDatasetMetadata(parsed);
  return parsed;
}
