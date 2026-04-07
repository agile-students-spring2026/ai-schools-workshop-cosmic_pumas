export const MAX_COMPARE_DISTRICTS = 3

export function normalizeCompareIds(ids: string[]) {
  const normalized: string[] = []
  const seen = new Set<string>()

  for (const rawId of ids) {
    const id = rawId.trim()

    if (!id || seen.has(id)) {
      continue
    }

    normalized.push(id)
    seen.add(id)

    if (normalized.length === MAX_COMPARE_DISTRICTS) {
      break
    }
  }

  return normalized
}

export function parseCompareIds(ids: string | string[] | undefined) {
  if (!ids) {
    return []
  }

  return normalizeCompareIds(
    (Array.isArray(ids) ? ids.join(',') : ids)
      .split(',')
      .map(value => value.trim())
  )
}
