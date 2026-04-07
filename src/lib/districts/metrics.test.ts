import { describe, expect, it } from "vitest";

import {
  bandMetric,
  calculateMedian,
  calculateMedianMap,
  pickDistrictMetrics,
} from "./metrics.js";
import type { DistrictRecord } from "./types.js";

const districts: DistrictRecord[] = [
  {
    id: "1",
    name: "Alpha",
    state: "AL",
    locale: "city",
    enrollment: 100,
    teachers: 10,
    studentTeacherRatio: 10,
    revenuePerPupil: 1000,
    expenditurePerPupil: 900,
    sourceYear: "2022-2023",
  },
  {
    id: "2",
    name: "Beta",
    state: "AL",
    locale: "suburb",
    enrollment: 200,
    teachers: 20,
    studentTeacherRatio: 10,
    revenuePerPupil: 1200,
    expenditurePerPupil: 1000,
    sourceYear: "2022-2023",
  },
  {
    id: "3",
    name: "Gamma",
    state: "GA",
    locale: "town",
    enrollment: 300,
    teachers: 30,
    studentTeacherRatio: 10,
    revenuePerPupil: 1400,
    expenditurePerPupil: 1100,
    sourceYear: "2022-2023",
  },
];

describe("metrics", () => {
  it("calculates medians for odd and even sets", () => {
    expect(calculateMedian([3, 1, 2])).toBe(2);
    expect(calculateMedian([1, 3, 5, 7])).toBe(4);
  });

  it("throws on empty medians", () => {
    expect(() => calculateMedian([])).toThrow("Cannot calculate a median for an empty set.");
  });

  it("selects the metric subset from a district", () => {
    expect(pickDistrictMetrics(districts[0]!)).toEqual({
      enrollment: 100,
      teachers: 10,
      studentTeacherRatio: 10,
      revenuePerPupil: 1000,
      expenditurePerPupil: 900,
    });
  });

  it("calculates metric maps across districts", () => {
    expect(calculateMedianMap(districts)).toEqual({
      enrollment: 200,
      teachers: 20,
      studentTeacherRatio: 10,
      revenuePerPupil: 1200,
      expenditurePerPupil: 1000,
    });
  });

  it("throws when median maps are requested for an empty district set", () => {
    expect(() => calculateMedianMap([])).toThrow(
      "Cannot calculate medians for an empty district set.",
    );
  });

  it("bands metric values against the configured thresholds", () => {
    expect(bandMetric(84, 100)).toBe("wellBelow");
    expect(bandMetric(90, 100)).toBe("below");
    expect(bandMetric(100, 100)).toBe("aboutAverage");
    expect(bandMetric(110, 100)).toBe("above");
    expect(bandMetric(116, 100)).toBe("wellAbove");
    expect(bandMetric(10, 0)).toBe("aboutAverage");
  });
});
