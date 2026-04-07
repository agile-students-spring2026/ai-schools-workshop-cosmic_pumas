import { describe, expect, it } from "vitest";

import * as districts from "./index.js";

describe("dataset loaders", () => {
  it("loads the committed snapshot, fixture, and metadata", async () => {
    const [snapshot, fixture, metadata] = await Promise.all([
      districts.loadDistrictSnapshot(),
      districts.loadDistrictFixture(),
      districts.loadDistrictMetadata(),
    ]);

    expect(snapshot.length).toBeGreaterThan(10000);
    expect(fixture).toHaveLength(12);
    expect(metadata.counts.outputRecords).toBe(snapshot.length);
    expect(metadata.counts.fixtureRecords).toBe(fixture.length);
    expect(snapshot.some((district) => district.id === fixture[0]?.id)).toBe(true);
    expect(typeof districts.bandMetric).toBe("function");
  });
});
