import { describe, expect, it } from "vitest";

import {
  buildDistrictComparison,
  filterDistricts,
  getDistrictById,
  getNationalMedians,
  getStateMedians,
  listLocales,
  listStates,
  searchDistricts,
  sortDistricts,
} from "./comparisons.js";
import type { DistrictRecord } from "./types.js";

const districts: DistrictRecord[] = [
  {
    id: "1",
    name: "Alpha City",
    state: "AL",
    locale: "city",
    enrollment: 500,
    teachers: 50,
    studentTeacherRatio: 10,
    revenuePerPupil: 10000,
    expenditurePerPupil: 9000,
    sourceYear: "2022-2023",
  },
  {
    id: "2",
    name: "Bravo Town",
    state: "AL",
    locale: "town",
    enrollment: 250,
    teachers: 30,
    studentTeacherRatio: 8.3,
    revenuePerPupil: 11000,
    expenditurePerPupil: 9500,
    sourceYear: "2022-2023",
  },
  {
    id: "3",
    name: "Charlie Suburb",
    state: "GA",
    locale: "suburb",
    enrollment: 900,
    teachers: 60,
    studentTeacherRatio: 15,
    revenuePerPupil: 12000,
    expenditurePerPupil: 11500,
    sourceYear: "2022-2023",
  },
];

describe("comparisons", () => {
  it("gets districts by id", () => {
    expect(getDistrictById(districts, "2")?.name).toBe("Bravo Town");
    expect(getDistrictById(districts, "missing")).toBeUndefined();
  });

  it("filters by query, state, and locale", () => {
    expect(filterDistricts(districts, { query: "alpha" })).toHaveLength(1);
    expect(filterDistricts(districts, { state: "AL" })).toHaveLength(2);
    expect(filterDistricts(districts, { locale: "suburb" })).toHaveLength(1);
    expect(
      filterDistricts(districts, { query: "alpha", state: "GA", locale: "city" }),
    ).toHaveLength(0);
  });

  it("sorts districts deterministically", () => {
    expect(sortDistricts(districts, "name").map((district) => district.id)).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(sortDistricts(districts, "enrollment").map((district) => district.id)).toEqual([
      "3",
      "1",
      "2",
    ]);
    expect(sortDistricts(districts, "state").map((district) => district.id)).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(sortDistricts(districts, "locale").map((district) => district.id)).toEqual([
      "1",
      "3",
      "2",
    ]);
  });

  it("uses stable fallbacks when sort keys tie", () => {
    const tiedDistricts: DistrictRecord[] = [
      { ...districts[0], id: "4", name: "Zulu", state: "AL", enrollment: 100 },
      { ...districts[0], id: "5", name: "Alpha", state: "AL", enrollment: 100 },
      { ...districts[0], id: "6", name: "Bravo", state: "GA", enrollment: 100 },
    ];
    const sameNameDifferentState: DistrictRecord[] = [
      { ...districts[0], id: "7", name: "Shared Name", state: "GA" },
      { ...districts[0], id: "8", name: "Shared Name", state: "AL" },
    ];
    const sameLocaleDifferentName: DistrictRecord[] = [
      { ...districts[0], id: "9", name: "Zulu", locale: "city" },
      { ...districts[0], id: "10", name: "Alpha", locale: "city" },
    ];
    const fullyTiedDistricts: DistrictRecord[] = [
      { ...districts[0], id: "11" },
      { ...districts[0], id: "12" },
    ];

    expect(sortDistricts(tiedDistricts, "name").map((district) => district.id)).toEqual([
      "5",
      "6",
      "4",
    ]);
    expect(sortDistricts(tiedDistricts, "enrollment").map((district) => district.id)).toEqual([
      "5",
      "6",
      "4",
    ]);
    expect(sortDistricts(sameNameDifferentState, "name").map((district) => district.id)).toEqual([
      "8",
      "7",
    ]);
    expect(sortDistricts(sameLocaleDifferentName, "locale").map((district) => district.id)).toEqual([
      "10",
      "9",
    ]);
    expect(sortDistricts(fullyTiedDistricts, "name").map((district) => district.id)).toEqual([
      "11",
      "12",
    ]);
  });

  it("combines filtering and sorting in searchDistricts", () => {
    expect(searchDistricts(districts, { state: "AL", sort: "teachers" })).toEqual([
      districts[0],
      districts[1],
    ]);
  });

  it("calculates national and state medians", () => {
    expect(getNationalMedians(districts).teachers).toBe(50);
    expect(getStateMedians(districts, "AL").teachers).toBe(40);
    expect(() => getStateMedians(districts, "TX")).toThrow("No districts found for state TX.");
  });

  it("builds comparison payloads and throws for missing districts", () => {
    const comparison = buildDistrictComparison(districts, "1");
    expect(comparison.district.id).toBe("1");
    expect(comparison.stateMedian.teachers).toBe(40);
    expect(comparison.metricBands.enrollment).toBe("wellAbove");
    expect(() => buildDistrictComparison(districts, "missing")).toThrow(
      "District missing was not found.",
    );
  });

  it("lists unique states and locales", () => {
    expect(listStates(districts)).toEqual(["AL", "GA"]);
    expect(listLocales(districts)).toEqual(["city", "suburb", "town"]);
  });
});
