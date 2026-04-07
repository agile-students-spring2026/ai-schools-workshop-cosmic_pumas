import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseDistrictMetadata, parseDistrictRecords } from "./schema.js";
import type { DistrictDatasetMetadata, DistrictRecord } from "./types.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDirectory, "../../../");
const dataDirectory = path.join(repoRoot, "data");

async function readDataFile(fileName: string): Promise<string> {
  return readFile(path.join(dataDirectory, fileName), "utf8");
}

export async function loadDistrictSnapshot(): Promise<DistrictRecord[]> {
  return parseDistrictRecords(await readDataFile("districts.snapshot.json"));
}

export async function loadDistrictFixture(): Promise<DistrictRecord[]> {
  return parseDistrictRecords(await readDataFile("districts.fixture.json"));
}

export async function loadDistrictMetadata(): Promise<DistrictDatasetMetadata> {
  return parseDistrictMetadata(await readDataFile("districts.metadata.json"));
}
