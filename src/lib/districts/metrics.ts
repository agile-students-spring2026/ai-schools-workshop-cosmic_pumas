import {
  districtMetricKeys,
  type DistrictMedianMap,
  type DistrictMetricKey,
  type DistrictRecord,
  type MetricBand,
} from "./types.js";

export function getMetricValue(
  district: DistrictRecord,
  metric: DistrictMetricKey,
): number {
  return district[metric];
}

export function pickDistrictMetrics(district: DistrictRecord): DistrictMedianMap {
  return {
    enrollment: district.enrollment,
    teachers: district.teachers,
    studentTeacherRatio: district.studentTeacherRatio,
    revenuePerPupil: district.revenuePerPupil,
    expenditurePerPupil: district.expenditurePerPupil,
  };
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) {
    throw new Error("Cannot calculate a median for an empty set.");
  }

  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[midpoint]!;
  }

  return roundToOneDecimal((sorted[midpoint - 1]! + sorted[midpoint]!) / 2);
}

export function calculateMedianMap(districts: DistrictRecord[]): DistrictMedianMap {
  if (districts.length === 0) {
    throw new Error("Cannot calculate medians for an empty district set.");
  }

  return districtMetricKeys.reduce<DistrictMedianMap>(
    (accumulator, metric) => {
      accumulator[metric] = calculateMedian(
        districts.map((district) => getMetricValue(district, metric)),
      );
      return accumulator;
    },
    {
      enrollment: 0,
      teachers: 0,
      studentTeacherRatio: 0,
      revenuePerPupil: 0,
      expenditurePerPupil: 0,
    },
  );
}

export function bandMetric(value: number, median: number): MetricBand {
  if (median <= 0) {
    return "aboutAverage";
  }

  const ratio = value / median;

  if (ratio < 0.85) {
    return "wellBelow";
  }

  if (ratio < 0.95) {
    return "below";
  }

  if (ratio <= 1.05) {
    return "aboutAverage";
  }

  if (ratio <= 1.15) {
    return "above";
  }

  return "wellAbove";
}

export function roundToOneDecimal(value: number): number {
  return Number(value.toFixed(1));
}
