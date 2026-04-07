export type DistrictLocale = "city" | "suburb" | "town" | "rural";

export interface DistrictRecord {
  id: string;
  name: string;
  state: string;
  locale: DistrictLocale;
  enrollment: number;
  teachers: number;
  studentTeacherRatio: number;
  revenuePerPupil: number;
  expenditurePerPupil: number;
  sourceYear: string;
}

export const districtMetricKeys = [
  "enrollment",
  "teachers",
  "studentTeacherRatio",
  "revenuePerPupil",
  "expenditurePerPupil",
] as const;

export type DistrictMetricKey = (typeof districtMetricKeys)[number];

export type MetricBand =
  | "wellBelow"
  | "below"
  | "aboutAverage"
  | "above"
  | "wellAbove";

export type DistrictMedianMap = Record<DistrictMetricKey, number>;

export interface DistrictComparison {
  district: DistrictRecord;
  nationalMedian: DistrictMedianMap;
  stateMedian: DistrictMedianMap;
  metricBands: Record<DistrictMetricKey, MetricBand>;
}

export interface DistrictDatasetMetadata {
  generatedAt: string;
  snapshotYear: string;
  sources: {
    directory: { url: string; schoolYear: string };
    staff: { url: string; schoolYear: string };
    finance: { url: string; schoolYear: string };
    locale: { url: string; schoolYear: string };
  };
  counts: {
    directoryRows: number;
    staffRows: number;
    financeRows: number;
    localeRows: number;
    outputRecords: number;
    fixtureRecords: number;
    excluded: Record<string, number>;
  };
}

export type DistrictSortKey =
  | "name"
  | "state"
  | "locale"
  | DistrictMetricKey;

export interface DistrictSearchOptions {
  query?: string;
  state?: string;
  locale?: DistrictLocale;
  sort?: DistrictSortKey;
}
