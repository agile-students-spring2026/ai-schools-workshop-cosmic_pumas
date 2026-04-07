export const rawCacheDirectory = ".cache/nces";

export const sources = {
  directory: {
    cacheFile: "ccd_lea_directory_2022_2023.zip",
    entryName: "ccd_lea_029_2223_w_1a_083023.csv",
    schoolYear: "2022-2023",
    url: "https://nces.ed.gov/ccd/data/zip/ccd_lea_029_2223_w_1a_083023.zip",
  },
  staff: {
    cacheFile: "ccd_lea_staff_2022_2023.zip",
    entryName: "ccd_lea_059_2223_l_1a_083023.csv",
    schoolYear: "2022-2023",
    url: "https://nces.ed.gov/ccd/data/zip/ccd_lea_059_2223_l_1a_083023.zip",
  },
  finance: {
    cacheFile: "ccd_f33_finance_2022_2023.zip",
    entryName: "sdf23_1a.txt",
    schoolYear: "2022-2023",
    url: "https://prod-ies-dm-migration.s3.us-gov-west-1.amazonaws.com/nces/asset_builder_data/2025/09/2025306_0.zip",
  },
  locale: {
    cacheFile: "edge_publiclea_locale_2022_2023.json",
    schoolYear: "2022-2023",
    url: "https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_GEOCODE_PUBLICLEA_2223/MapServer/0/query",
  },
} as const;
