import { sources } from "./constants.js";
import {
  cacheLocaleRows,
  ensureCachedSource,
  getCachePath,
} from "./lib.js";

async function main(): Promise<void> {
  await Promise.all([
    ensureCachedSource("directory"),
    ensureCachedSource("staff"),
    ensureCachedSource("finance"),
  ]);
  await cacheLocaleRows(sources.locale.url, getCachePath(sources.locale.cacheFile));

  process.stdout.write(
    [
      "Cached NCES sources:",
      `- ${getCachePath("ccd_lea_directory_2022_2023.zip")}`,
      `- ${getCachePath("ccd_lea_staff_2022_2023.zip")}`,
      `- ${getCachePath("ccd_f33_finance_2022_2023.zip")}`,
      `- ${getCachePath("edge_publiclea_locale_2022_2023.json")}`,
    ].join("\n") + "\n",
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
