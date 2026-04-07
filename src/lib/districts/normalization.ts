import type {
  DistrictDatasetMetadata,
  DistrictLocale,
  DistrictRecord,
} from "./types.js";

export interface DirectoryRow {
  LEAID: string;
  LEA_NAME: string;
  ST: string;
  SY_STATUS_TEXT: string;
  LEA_TYPE: string;
}

export interface StaffRow {
  LEAID: string;
  STAFF: string;
  STAFF_COUNT: string;
}

export interface FinanceRow {
  LEAID: string;
  CCDNF: string;
  YEAR: string;
  V33: string;
  TOTALREV: string;
  TCURELSC: string;
}

export interface LocaleRow {
  LEAID: string;
  LOCALE: string;
}

export interface JoinedDistrictInputs {
  directory?: DirectoryRow;
  teachers?: number;
  finance?: FinanceRow;
  localeCode?: string;
}

export interface SnapshotBuildResult {
  records: DistrictRecord[];
  metadata: DistrictDatasetMetadata;
}

const regularDistrictType = "1";
const openStatus = "open";
const teacherCategory = "Teachers";

export function mapLocaleCode(localeCode: string): DistrictLocale | undefined {
  const trimmed = localeCode.trim();

  if (trimmed.startsWith("1")) {
    return "city";
  }

  if (trimmed.startsWith("2")) {
    return "suburb";
  }

  if (trimmed.startsWith("3")) {
    return "town";
  }

  if (trimmed.startsWith("4")) {
    return "rural";
  }

  return undefined;
}

export function parsePositiveNumber(value: string): number | undefined {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

export function parseTeacherCount(row: StaffRow): number | undefined {
  if (row.STAFF !== teacherCategory) {
    return undefined;
  }

  return parsePositiveNumber(row.STAFF_COUNT);
}

function normalizeSourceYear(financeYear: string): string {
  const trimmed = financeYear.trim();

  if (!/^\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const startYear = 2000 + Number(trimmed) - 1;
  const endYear = 2000 + Number(trimmed);
  return `${startYear}-${endYear}`;
}

function roundToInteger(value: number): number {
  return Math.round(value);
}

function roundToOneDecimal(value: number): number {
  return Number(value.toFixed(1));
}

export function normalizeJoinedDistrict(inputs: JoinedDistrictInputs):
  | { record: DistrictRecord; reason?: never }
  | { reason: string; record?: never } {
  if (!inputs.directory) {
    return { reason: "missingDirectory" };
  }

  if (inputs.directory.LEA_TYPE !== regularDistrictType) {
    return { reason: "unsupportedLeaType" };
  }

  if (inputs.directory.SY_STATUS_TEXT.trim().toLowerCase() !== openStatus) {
    return { reason: "closedDistrict" };
  }

  if (typeof inputs.teachers !== "number" || inputs.teachers <= 0) {
    return { reason: "missingTeachers" };
  }

  if (!inputs.finance || inputs.finance.CCDNF !== "1") {
    return { reason: "missingFinance" };
  }

  const enrollment = parsePositiveNumber(inputs.finance.V33);
  if (!enrollment) {
    return { reason: "invalidEnrollment" };
  }

  const revenue = parsePositiveNumber(inputs.finance.TOTALREV);
  if (!revenue) {
    return { reason: "invalidRevenue" };
  }

  const expenditure = parsePositiveNumber(inputs.finance.TCURELSC);
  if (!expenditure) {
    return { reason: "invalidExpenditure" };
  }

  const locale = inputs.localeCode ? mapLocaleCode(inputs.localeCode) : undefined;
  if (!locale) {
    return { reason: "missingLocale" };
  }

  const teacherCount = roundToOneDecimal(inputs.teachers);

  return {
    record: {
      id: inputs.directory.LEAID.padStart(7, "0"),
      name: inputs.directory.LEA_NAME.trim(),
      state: inputs.directory.ST.trim(),
      locale,
      enrollment: roundToInteger(enrollment),
      teachers: teacherCount,
      studentTeacherRatio: roundToOneDecimal(enrollment / inputs.teachers),
      revenuePerPupil: roundToInteger(revenue / enrollment),
      expenditurePerPupil: roundToInteger(expenditure / enrollment),
      sourceYear: normalizeSourceYear(inputs.finance.YEAR),
    },
  };
}

export function buildSnapshot(
  inputs: {
    directoryById: Map<string, DirectoryRow>;
    teachersById: Map<string, number>;
    financeById: Map<string, FinanceRow>;
    localeById: Map<string, string>;
  },
  counts: Omit<DistrictDatasetMetadata["counts"], "outputRecords" | "fixtureRecords" | "excluded">,
  sources: DistrictDatasetMetadata["sources"],
): SnapshotBuildResult {
  const excluded = new Map<string, number>();
  const records: DistrictRecord[] = [];

  for (const [districtId, directory] of inputs.directoryById.entries()) {
    const joinedInputs: JoinedDistrictInputs = { directory };
    const teachers = inputs.teachersById.get(districtId);
    const finance = inputs.financeById.get(districtId);
    const localeCode = inputs.localeById.get(districtId);

    if (teachers !== undefined) {
      joinedInputs.teachers = teachers;
    }

    if (finance !== undefined) {
      joinedInputs.finance = finance;
    }

    if (localeCode !== undefined) {
      joinedInputs.localeCode = localeCode;
    }

    const built = normalizeJoinedDistrict(joinedInputs);

    if ("reason" in built) {
      excluded.set(built.reason, (excluded.get(built.reason) ?? 0) + 1);
      continue;
    }

    records.push(built.record);
  }

  records.sort((left, right) => {
    return (
      left.state.localeCompare(right.state, "en-US") ||
      left.name.localeCompare(right.name, "en-US")
    );
  });

  const fixtureRecords = Math.min(12, records.length);

  return {
    records,
    metadata: {
      generatedAt: new Date().toISOString(),
      snapshotYear: "2022-2023",
      sources,
      counts: {
        ...counts,
        outputRecords: records.length,
        fixtureRecords,
        excluded: Object.fromEntries([...excluded.entries()].sort()),
      },
    },
  };
}
