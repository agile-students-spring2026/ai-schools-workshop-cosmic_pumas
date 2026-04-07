import { bandMetric, calculateMedianMap, getMetricValue } from "./metrics.js";
import {
  districtMetricKeys,
  type DistrictComparison,
  type DistrictLocale,
  type DistrictMedianMap,
  type DistrictMetricKey,
  type DistrictRecord,
  type DistrictSearchOptions,
  type DistrictSortKey,
} from "./types.js";

function compareText(left: string, right: string): number {
  return left.localeCompare(right, "en-US", { sensitivity: "base" });
}

function compareMetric(
  left: DistrictRecord,
  right: DistrictRecord,
  metric: DistrictMetricKey,
): number {
  return getMetricValue(left, metric) - getMetricValue(right, metric);
}

export function getDistrictById(
  districts: DistrictRecord[],
  districtId: string,
): DistrictRecord | undefined {
  return districts.find((district) => district.id === districtId);
}

export function filterDistricts(
  districts: DistrictRecord[],
  options: DistrictSearchOptions = {},
): DistrictRecord[] {
  const query = options.query?.trim().toLowerCase();
  const state = options.state?.trim().toUpperCase();
  const locale = options.locale;

  return districts.filter((district) => {
    if (query && !district.name.toLowerCase().includes(query)) {
      return false;
    }

    if (state && district.state !== state) {
      return false;
    }

    if (locale && district.locale !== locale) {
      return false;
    }

    return true;
  });
}

export function sortDistricts(
  districts: DistrictRecord[],
  sort: DistrictSortKey = "name",
): DistrictRecord[] {
  return districts
    .map((district, index) => ({ district, index }))
    .sort((left, right) => {
      const leftDistrict = left.district;
      const rightDistrict = right.district;

      let comparison = 0;

      if (sort === "name") {
        comparison =
          compareText(leftDistrict.name, rightDistrict.name) ||
          compareText(leftDistrict.state, rightDistrict.state);
      } else if (sort === "state") {
        comparison =
          compareText(leftDistrict.state, rightDistrict.state) ||
          compareText(leftDistrict.name, rightDistrict.name);
      } else if (sort === "locale") {
        comparison =
          compareText(leftDistrict.locale, rightDistrict.locale) ||
          compareText(leftDistrict.name, rightDistrict.name);
      } else {
        comparison =
          compareMetric(rightDistrict, leftDistrict, sort) ||
          compareText(leftDistrict.name, rightDistrict.name);
      }

      return comparison || left.index - right.index;
    })
    .map(({ district }) => district);
}

export function searchDistricts(
  districts: DistrictRecord[],
  options: DistrictSearchOptions = {},
): DistrictRecord[] {
  return sortDistricts(filterDistricts(districts, options), options.sort);
}

export function getNationalMedians(districts: DistrictRecord[]): DistrictMedianMap {
  return calculateMedianMap(districts);
}

export function getStateMedians(
  districts: DistrictRecord[],
  state: string,
): DistrictMedianMap {
  const matches = districts.filter((district) => district.state === state);

  if (matches.length === 0) {
    throw new Error(`No districts found for state ${state}.`);
  }

  return calculateMedianMap(matches);
}

export function buildDistrictComparison(
  districts: DistrictRecord[],
  districtId: string,
): DistrictComparison {
  const district = getDistrictById(districts, districtId);

  if (!district) {
    throw new Error(`District ${districtId} was not found.`);
  }

  const nationalMedian = getNationalMedians(districts);
  const stateMedian = getStateMedians(districts, district.state);

  const metricBands = districtMetricKeys.reduce<Record<DistrictMetricKey, ReturnType<typeof bandMetric>>>(
    (accumulator, metric) => {
      accumulator[metric] = bandMetric(getMetricValue(district, metric), stateMedian[metric]);
      return accumulator;
    },
    {
      enrollment: "aboutAverage",
      teachers: "aboutAverage",
      studentTeacherRatio: "aboutAverage",
      revenuePerPupil: "aboutAverage",
      expenditurePerPupil: "aboutAverage",
    },
  );

  return {
    district,
    nationalMedian,
    stateMedian,
    metricBands,
  };
}

export function listStates(districts: DistrictRecord[]): string[] {
  return [...new Set(districts.map((district) => district.state))].sort(compareText);
}

export function listLocales(districts: DistrictRecord[]): DistrictLocale[] {
  return [...new Set(districts.map((district) => district.locale))].sort(
    compareText,
  ) as DistrictLocale[];
}
