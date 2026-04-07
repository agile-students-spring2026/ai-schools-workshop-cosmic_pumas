import { describe, expect, it } from "vitest";

import {
  assertDistrictDatasetMetadata,
  assertDistrictRecord,
  parseDistrictMetadata,
  parseDistrictRecords,
} from "./schema.js";

const record = {
  id: "0100005",
  name: "Albertville City",
  state: "AL",
  locale: "town",
  enrollment: 5900,
  teachers: 318.4,
  studentTeacherRatio: 18.5,
  revenuePerPupil: 15412,
  expenditurePerPupil: 10827,
  sourceYear: "2022-2023",
};

describe("schema", () => {
  it("accepts valid record and metadata shapes", () => {
    expect(() => assertDistrictRecord(record)).not.toThrow();
    expect(() =>
      assertDistrictDatasetMetadata({
        generatedAt: "2026-04-07T00:00:00.000Z",
        snapshotYear: "2022-2023",
        sources: {
          directory: { url: "directory-url", schoolYear: "2022-2023" },
          staff: { url: "staff-url", schoolYear: "2022-2023" },
          finance: { url: "finance-url", schoolYear: "2022-2023" },
          locale: { url: "locale-url", schoolYear: "2022-2023" },
        },
        counts: {
          directoryRows: 1,
          staffRows: 1,
          financeRows: 1,
          localeRows: 1,
          outputRecords: 1,
          fixtureRecords: 1,
          excluded: {},
        },
      }),
    ).not.toThrow();
  });

  it("rejects invalid shapes", () => {
    expect(() => assertDistrictRecord({})).toThrow("District id must be a non-empty string.");
    expect(() => assertDistrictRecord({ ...record, teachers: Number.NaN })).toThrow(
      "District teachers must be a finite number.",
    );
    expect(() => assertDistrictRecord({ ...record, locale: "invalid" })).toThrow(
      "District locale must be one of city, suburb, town, or rural.",
    );
    expect(() => assertDistrictRecord(null)).toThrow("District record must be an object.");
    expect(() => assertDistrictDatasetMetadata(null)).toThrow(
      "Dataset metadata must be an object.",
    );
    expect(() => assertDistrictDatasetMetadata({})).toThrow(
      "Metadata generatedAt must be a non-empty string.",
    );
    expect(() =>
      assertDistrictDatasetMetadata({
        generatedAt: "2026-04-07T00:00:00.000Z",
        snapshotYear: "2022-2023",
        counts: {
          directoryRows: 1,
          staffRows: 1,
          financeRows: 1,
          localeRows: 1,
          outputRecords: 1,
          fixtureRecords: 1,
          excluded: {},
        },
      }),
    ).toThrow("Metadata sources must be present.");
    expect(() =>
      assertDistrictDatasetMetadata({
        generatedAt: "2026-04-07T00:00:00.000Z",
        snapshotYear: "2022-2023",
        sources: {},
      }),
    ).toThrow("Metadata counts must be present.");
    expect(() =>
      assertDistrictDatasetMetadata({
        generatedAt: "2026-04-07T00:00:00.000Z",
        snapshotYear: "2022-2023",
        sources: {},
        counts: {
          directoryRows: 1,
          staffRows: 1,
          financeRows: 1,
          localeRows: 1,
          outputRecords: 1,
          fixtureRecords: 1,
        },
      }),
    ).toThrow("Metadata excluded counts must be present.");
  });

  it("parses JSON snapshots and metadata", () => {
    expect(parseDistrictRecords(JSON.stringify([record]))).toEqual([record]);
    expect(parseDistrictMetadata(
      JSON.stringify({
        generatedAt: "2026-04-07T00:00:00.000Z",
        snapshotYear: "2022-2023",
        sources: {
          directory: { url: "directory-url", schoolYear: "2022-2023" },
          staff: { url: "staff-url", schoolYear: "2022-2023" },
          finance: { url: "finance-url", schoolYear: "2022-2023" },
          locale: { url: "locale-url", schoolYear: "2022-2023" },
        },
        counts: {
          directoryRows: 1,
          staffRows: 1,
          financeRows: 1,
          localeRows: 1,
          outputRecords: 1,
          fixtureRecords: 1,
          excluded: {},
        },
      }),
    )).toMatchObject({ snapshotYear: "2022-2023" });

    expect(() => parseDistrictRecords("{}")).toThrow("District snapshot must be an array.");
  });
});
