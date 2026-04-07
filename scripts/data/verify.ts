import { readFile } from "node:fs/promises";

import {
  parseDistrictMetadata,
  parseDistrictRecords,
} from "../../src/lib/districts/index.js";
import { getDataPath } from "./lib.js";

async function main(): Promise<void> {
  const snapshot = parseDistrictRecords(
    await readFile(getDataPath("districts.snapshot.json"), "utf8"),
  );
  const fixture = parseDistrictRecords(
    await readFile(getDataPath("districts.fixture.json"), "utf8"),
  );
  const metadata = parseDistrictMetadata(
    await readFile(getDataPath("districts.metadata.json"), "utf8"),
  );

  if (metadata.counts.outputRecords !== snapshot.length) {
    throw new Error("Snapshot size does not match metadata outputRecords.");
  }

  if (metadata.counts.fixtureRecords !== fixture.length) {
    throw new Error("Fixture size does not match metadata fixtureRecords.");
  }

  const fixtureIds = new Set(fixture.map((district) => district.id));
  const snapshotIds = new Set(snapshot.map((district) => district.id));

  for (const fixtureId of fixtureIds) {
    if (!snapshotIds.has(fixtureId)) {
      throw new Error(`Fixture district ${fixtureId} does not exist in the snapshot.`);
    }
  }

  process.stdout.write(
    `Verified ${snapshot.length} snapshot records, ${fixture.length} fixture records, and metadata counts.\n`,
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
