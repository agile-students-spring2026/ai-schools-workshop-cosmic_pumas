import {
  buildSnapshot,
  parseTeacherCount,
  type DirectoryRow,
  type FinanceRow,
  type StaffRow,
} from "../../src/lib/districts/index.js";
import { sources } from "./constants.js";
import {
  cacheLocaleRows,
  ensureCachedSource,
  ensureDataDirectory,
  getCachePath,
  getDataPath,
  readZipEntryAsRecords,
  writeJsonFile,
} from "./lib.js";

async function main(): Promise<void> {
  await ensureDataDirectory();

  const directoryZip = await ensureCachedSource("directory");
  const staffZip = await ensureCachedSource("staff");
  const financeZip = await ensureCachedSource("finance");
  const localeById = await cacheLocaleRows(
    sources.locale.url,
    getCachePath(sources.locale.cacheFile),
  );

  const directoryById = new Map<string, DirectoryRow>();
  const teachersById = new Map<string, number>();
  const financeById = new Map<string, FinanceRow>();

  const directoryRows = await readZipEntryAsRecords<DirectoryRow>(
    directoryZip,
    sources.directory.entryName,
    ",",
    (row) => {
      directoryById.set(row.LEAID, row);
    },
  );

  const staffRows = await readZipEntryAsRecords<StaffRow>(
    staffZip,
    sources.staff.entryName,
    ",",
    (row) => {
      const teachers = parseTeacherCount(row);
      if (teachers !== undefined) {
        teachersById.set(row.LEAID, teachers);
      }
    },
  );

  const financeRows = await readZipEntryAsRecords<FinanceRow>(
    financeZip,
    sources.finance.entryName,
    "\t",
    (row) => {
      financeById.set(row.LEAID, row);
    },
  );

  const { records, metadata } = buildSnapshot(
    {
      directoryById,
      teachersById,
      financeById,
      localeById,
    },
    {
      directoryRows,
      staffRows,
      financeRows,
      localeRows: localeById.size,
    },
    {
      directory: {
        url: sources.directory.url,
        schoolYear: sources.directory.schoolYear,
      },
      staff: {
        url: sources.staff.url,
        schoolYear: sources.staff.schoolYear,
      },
      finance: {
        url: sources.finance.url,
        schoolYear: sources.finance.schoolYear,
      },
      locale: {
        url: sources.locale.url,
        schoolYear: sources.locale.schoolYear,
      },
    },
  );

  await writeJsonFile(getDataPath("districts.snapshot.json"), records);
  await writeJsonFile(getDataPath("districts.fixture.json"), records.slice(0, 12));
  await writeJsonFile(getDataPath("districts.metadata.json"), metadata);

  process.stdout.write(
    `Built ${records.length} normalized district records into ${getDataPath("districts.snapshot.json")}\n`,
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
