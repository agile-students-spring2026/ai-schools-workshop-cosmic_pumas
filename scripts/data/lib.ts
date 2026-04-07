import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "csv-parse";
import unzipper from "unzipper";

import { rawCacheDirectory, sources } from "./constants.js";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

function repoPath(...segments: string[]): string {
  return path.join(repoRoot, ...segments);
}

export function getCachePath(fileName: string): string {
  return repoPath(rawCacheDirectory, fileName);
}

export async function ensureCacheDirectory(): Promise<void> {
  await mkdir(repoPath(rawCacheDirectory), { recursive: true });
}

export async function ensureDataDirectory(): Promise<void> {
  await mkdir(repoPath("data"), { recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function downloadToFile(url: string, filePath: string): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, Buffer.from(await response.arrayBuffer()));
}

export async function ensureCachedSource(
  key: keyof typeof sources,
  refresh = false,
): Promise<string> {
  await ensureCacheDirectory();
  const source = sources[key];
  const cachePath = getCachePath(source.cacheFile);

  if (!refresh && (await fileExists(cachePath))) {
    return cachePath;
  }

  await downloadToFile(source.url, cachePath);
  return cachePath;
}

export async function readZipEntryAsRecords<RecordType extends object>(
  zipFilePath: string,
  entryName: string,
  delimiter: "," | "\t",
  onRecord: (record: RecordType) => void | Promise<void>,
): Promise<number> {
  const directory = await unzipper.Open.file(zipFilePath);
  const entry = directory.files.find(
    (candidate: { path: string }) => candidate.path === entryName,
  );

  if (!entry) {
    throw new Error(`Zip entry ${entryName} was not found in ${zipFilePath}.`);
  }

  const parser = entry
    .stream()
    .pipe(parse({ columns: true, delimiter, bom: true, relax_column_count: true }));

  let rowCount = 0;
  for await (const record of parser) {
    rowCount += 1;
    await onRecord(record as RecordType);
  }

  return rowCount;
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const json = JSON.stringify(value, null, 2) + "\n";
  await writeFile(filePath, json, "utf8");
}

export function getDataPath(fileName: string): string {
  return repoPath("data", fileName);
}

interface LocaleFeatureResponse {
  features: Array<{ attributes: { LEAID: string; LOCALE: string } }>;
  exceededTransferLimit?: boolean;
}

export async function cacheLocaleRows(
  url: string,
  cachePath: string,
  refresh = false,
): Promise<Map<string, string>> {
  if (!refresh) {
    try {
      const cached = await readJsonFile<Array<{ LEAID: string; LOCALE: string }>>(cachePath);
      return new Map(cached.map((row) => [row.LEAID, row.LOCALE]));
    } catch {
      // Cache miss falls through to refetch.
    }
  }

  const records: Array<{ LEAID: string; LOCALE: string }> = [];
  let resultOffset = 0;

  while (true) {
    const requestUrl = new URL(url);
    requestUrl.searchParams.set("where", "1=1");
    requestUrl.searchParams.set("outFields", "LEAID,LOCALE");
    requestUrl.searchParams.set("returnGeometry", "false");
    requestUrl.searchParams.set("f", "json");
    requestUrl.searchParams.set("resultOffset", String(resultOffset));
    requestUrl.searchParams.set("resultRecordCount", "2000");

    const response = await fetch(requestUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch locale rows: ${response.status} ${response.statusText}`,
      );
    }

    const payload = (await response.json()) as LocaleFeatureResponse;
    const rows = payload.features.map((feature) => feature.attributes);
    records.push(...rows);

    if (!payload.exceededTransferLimit || rows.length === 0) {
      break;
    }

    resultOffset += rows.length;
  }

  await writeJsonFile(cachePath, records);
  return new Map(records.map((row) => [row.LEAID, row.LOCALE]));
}
