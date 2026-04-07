import { describe, expect, it } from "vitest";

import {
  buildSnapshot,
  mapLocaleCode,
  normalizeJoinedDistrict,
  parsePositiveNumber,
  parseTeacherCount,
  type DirectoryRow,
  type FinanceRow,
  type StaffRow,
} from "./normalization.js";

const directoryRow: DirectoryRow = {
  LEAID: "0100005",
  LEA_NAME: "Albertville City",
  ST: "AL",
  SY_STATUS_TEXT: "Open",
  LEA_TYPE: "1",
};

const financeRow: FinanceRow = {
  LEAID: "0100005",
  CCDNF: "1",
  YEAR: "23",
  V33: "5900",
  TOTALREV: "90930000",
  TCURELSC: "63879000",
};

describe("normalization", () => {
  it("maps locale codes and parses positive numbers", () => {
    expect(mapLocaleCode("11")).toBe("city");
    expect(mapLocaleCode("22")).toBe("suburb");
    expect(mapLocaleCode("33")).toBe("town");
    expect(mapLocaleCode("42")).toBe("rural");
    expect(mapLocaleCode("99")).toBeUndefined();

    expect(parsePositiveNumber("12.5")).toBe(12.5);
    expect(parsePositiveNumber("-1")).toBeUndefined();
    expect(parsePositiveNumber("not-a-number")).toBeUndefined();
  });

  it("extracts only the top-level Teachers category", () => {
    const teacherRow: StaffRow = {
      LEAID: "0100005",
      STAFF: "Teachers",
      STAFF_COUNT: "318.4",
    };
    const nonTeacherRow: StaffRow = {
      LEAID: "0100005",
      STAFF: "Secondary Teachers",
      STAFF_COUNT: "100.0",
    };

    expect(parseTeacherCount(teacherRow)).toBe(318.4);
    expect(parseTeacherCount(nonTeacherRow)).toBeUndefined();
  });

  it("builds normalized snapshot records and exclusion counts", () => {
    const result = buildSnapshot(
      {
        directoryById: new Map([
          ["0100005", directoryRow],
          [
            "0100006",
            {
              ...directoryRow,
              LEAID: "0100006",
              LEA_NAME: "Closed District",
              SY_STATUS_TEXT: "Closed",
            },
          ],
        ]),
        teachersById: new Map([
          ["0100005", 318.4],
          ["0100006", 100],
        ]),
        financeById: new Map([
          ["0100005", financeRow],
          [
            "0100006",
            {
              ...financeRow,
              LEAID: "0100006",
            },
          ],
        ]),
        localeById: new Map([
          ["0100005", "32"],
          ["0100006", "11"],
        ]),
      },
      {
        directoryRows: 2,
        staffRows: 2,
        financeRows: 2,
        localeRows: 2,
      },
      {
        directory: { url: "directory-url", schoolYear: "2022-2023" },
        staff: { url: "staff-url", schoolYear: "2022-2023" },
        finance: { url: "finance-url", schoolYear: "2022-2023" },
        locale: { url: "locale-url", schoolYear: "2022-2023" },
      },
    );

    expect(result.records).toEqual([
      {
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
      },
    ]);
    expect(result.metadata.counts.outputRecords).toBe(1);
    expect(result.metadata.counts.fixtureRecords).toBe(1);
    expect(result.metadata.counts.excluded).toEqual({ closedDistrict: 1 });
  });

  it("covers joined-record exclusion reasons and source year fallbacks", () => {
    expect(normalizeJoinedDistrict({})).toEqual({ reason: "missingDirectory" });
    expect(
      normalizeJoinedDistrict({
        directory: { ...directoryRow, LEA_TYPE: "7" },
      }),
    ).toEqual({ reason: "unsupportedLeaType" });
    expect(
      normalizeJoinedDistrict({
        directory: { ...directoryRow, SY_STATUS_TEXT: "Closed" },
      }),
    ).toEqual({ reason: "closedDistrict" });
    expect(
      normalizeJoinedDistrict({
        directory: directoryRow,
      }),
    ).toEqual({ reason: "missingTeachers" });
    expect(
      normalizeJoinedDistrict({
        directory: directoryRow,
        teachers: 100,
      }),
    ).toEqual({ reason: "missingFinance" });
    expect(
      normalizeJoinedDistrict({
        directory: directoryRow,
        teachers: 100,
        finance: { ...financeRow, CCDNF: "0" },
      }),
    ).toEqual({ reason: "missingFinance" });
    expect(
      normalizeJoinedDistrict({
        directory: directoryRow,
        teachers: 100,
        finance: { ...financeRow, V33: "-1" },
      }),
    ).toEqual({ reason: "invalidEnrollment" });
    expect(
      normalizeJoinedDistrict({
        directory: directoryRow,
        teachers: 100,
        finance: { ...financeRow, TOTALREV: "-1" },
      }),
    ).toEqual({ reason: "invalidRevenue" });
    expect(
      normalizeJoinedDistrict({
        directory: directoryRow,
        teachers: 100,
        finance: { ...financeRow, TCURELSC: "-1" },
      }),
    ).toEqual({ reason: "invalidExpenditure" });
    expect(
      normalizeJoinedDistrict({
        directory: directoryRow,
        teachers: 100,
        finance: financeRow,
      }),
    ).toEqual({ reason: "missingLocale" });

    expect(
      normalizeJoinedDistrict({
        directory: directoryRow,
        teachers: 100,
        finance: { ...financeRow, YEAR: "Fiscal 2023" },
        localeCode: "11",
      }),
    ).toEqual({
      record: {
        id: "0100005",
        name: "Albertville City",
        state: "AL",
        locale: "city",
        enrollment: 5900,
        teachers: 100,
        studentTeacherRatio: 59,
        revenuePerPupil: 15412,
        expenditurePerPupil: 10827,
        sourceYear: "Fiscal 2023",
      },
    });
  });

  it("sorts snapshot output by state then name and rolls up repeated exclusions", () => {
    const result = buildSnapshot(
      {
        directoryById: new Map([
          ["2", { ...directoryRow, LEAID: "2", LEA_NAME: "Zulu", ST: "AL" }],
          ["1", { ...directoryRow, LEAID: "1", LEA_NAME: "Alpha", ST: "AL" }],
          ["3", { ...directoryRow, LEAID: "3", LEA_NAME: "Beta", ST: "AL" }],
        ]),
        teachersById: new Map([
          ["1", 10],
          ["2", 10],
        ]),
        financeById: new Map([
          ["1", { ...financeRow, LEAID: "1", V33: "100", TOTALREV: "1000", TCURELSC: "900" }],
          ["2", { ...financeRow, LEAID: "2", V33: "100", TOTALREV: "1000", TCURELSC: "900" }],
        ]),
        localeById: new Map([
          ["1", "11"],
          ["2", "21"],
        ]),
      },
      {
        directoryRows: 3,
        staffRows: 2,
        financeRows: 2,
        localeRows: 2,
      },
      {
        directory: { url: "directory-url", schoolYear: "2022-2023" },
        staff: { url: "staff-url", schoolYear: "2022-2023" },
        finance: { url: "finance-url", schoolYear: "2022-2023" },
        locale: { url: "locale-url", schoolYear: "2022-2023" },
      },
    );

    expect(result.records.map((record) => record.id)).toEqual(["0000001", "0000002"]);
    expect(result.metadata.counts.excluded).toEqual({ missingTeachers: 1 });
  });
});
