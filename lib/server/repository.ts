import {
  districtListQuerySchema,
  districtSummarySchema,
  type DistrictListQuery,
  type DistrictRecord,
  type DistrictSort,
  type DistrictSummary
} from '@/lib/contracts/schemas'
import { buildDistrictComparison } from '@/lib/server/comparison'
import { getFixtureDistricts } from '@/lib/server/data'
import {
  DistrictNotFoundError,
  InvalidQueryError
} from '@/lib/server/errors'

function toDistrictSummary(district: DistrictRecord): DistrictSummary {
  return districtSummarySchema.parse(district)
}

function sortDistricts(districts: DistrictRecord[], sort: DistrictSort) {
  const sorted = [...districts]

  switch (sort) {
    case 'enrollment-desc':
      return sorted.sort((left, right) => right.enrollment - left.enrollment)
    case 'student-teacher-ratio-asc':
      return sorted.sort(
        (left, right) => left.studentTeacherRatio - right.studentTeacherRatio
      )
    case 'revenue-desc':
      return sorted.sort(
        (left, right) => right.revenuePerPupil - left.revenuePerPupil
      )
    case 'name':
    default:
      return sorted.sort((left, right) => left.name.localeCompare(right.name))
  }
}

export function parseDistrictListQuery(
  searchParams: URLSearchParams
): DistrictListQuery {
  const parsed = districtListQuerySchema.safeParse({
    query: searchParams.get('query') ?? undefined,
    state: searchParams.get('state') ?? undefined,
    locale: searchParams.get('locale') ?? undefined,
    sort: searchParams.get('sort') ?? undefined
  })

  if (!parsed.success) {
    throw new InvalidQueryError('Query parameters are invalid.')
  }

  return {
    query: parsed.data.query,
    state: parsed.data.state,
    locale: parsed.data.locale,
    sort: parsed.data.sort ?? 'name'
  }
}

export function listDistricts(query: DistrictListQuery): DistrictSummary[] {
  const districts = getFixtureDistricts().filter(district => {
    const queryMatches =
      !query.query ||
      district.name.toLowerCase().includes(query.query.toLowerCase()) ||
      district.id.toLowerCase() === query.query.toLowerCase()

    const stateMatches = !query.state || district.state === query.state
    const localeMatches =
      !query.locale ||
      district.locale.toLowerCase() === query.locale.toLowerCase()

    return queryMatches && stateMatches && localeMatches
  })

  return sortDistricts(districts, query.sort ?? 'name').map(toDistrictSummary)
}

export function getDistrictCount() {
  return getFixtureDistricts().length
}

export function getDistrictById(districtId: string): DistrictRecord | null {
  return (
    getFixtureDistricts().find(district => district.id === districtId) ?? null
  )
}

export function getDistrictByIdOrThrow(districtId: string): DistrictRecord {
  const district = getDistrictById(districtId)

  if (!district) {
    throw new DistrictNotFoundError(districtId)
  }

  return district
}

export function getDistrictComparison(districtId: string) {
  const districts = getFixtureDistricts()
  const district = districts.find(candidate => candidate.id === districtId)

  if (!district) {
    throw new DistrictNotFoundError(districtId)
  }

  return buildDistrictComparison(district, districts)
}

export function getDistrictSummariesByIds(ids: string[]) {
  const districts = getFixtureDistricts()

  return ids
    .map(id => districts.find(district => district.id === id) ?? null)
    .filter((district): district is DistrictRecord => district !== null)
    .map(toDistrictSummary)
}
