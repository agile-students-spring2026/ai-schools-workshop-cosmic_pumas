from backend.data_pipeline import refresh_cache


def main():
    dataset = refresh_cache()
    meta = dataset["meta"]
    print(f"Refreshed {meta['record_count']} districts from {meta['source_label']}")
    print(f"Cached at {meta['last_refreshed']}")


if __name__ == "__main__":
    main()