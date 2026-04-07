import {
  getDistrictById,
  getDistrictByIdOrThrow,
  getDistrictComparison,
  getDistrictCount,
  getDistrictSummariesByIds,
  listDistricts,
  parseDistrictListQuery
} from '@/lib/server/repository'
import { getFixtureDistricts } from '@/lib/server/data'

describe('district repository', () => {
  const districts = getFixtureDistricts()
  const districtIds = districts.map(district => district.id)
  const firstDistrict = districts[0]!

  it('parses list queries and applies the default sort', () => {
    const query = parseDistrictListQuery(new URLSearchParams('state=ma'))

    expect(query).toEqual({
      query: undefined,
      state: 'MA',
      locale: undefined,
      sort: 'name'
    })
  })

  it('rejects invalid query params', () => {
    const parse = () =>
      parseDistrictListQuery(new URLSearchParams('sort=unsupported'))

    expect(parse).toThrow('Query parameters are invalid.')
  })

  it('filters and sorts districts', () => {
    const targetDistrict = districts.find(district => district.locale === 'rural')!
    const result = listDistricts({
      query: targetDistrict.name.split(' ')[0],
      state: targetDistrict.state,
      locale: targetDistrict.locale,
      sort: 'enrollment-desc'
    })

    expect(result.length).toBeGreaterThan(0)
    expect(result.every(district => district.state === targetDistrict.state)).toBe(true)
    expect(
      result.every(district => district.locale === targetDistrict.locale)
    ).toBe(true)
    expect(result[0]!.enrollment).toBeGreaterThanOrEqual(result.at(-1)!.enrollment)
  })

  it('supports alternate sort orders and exact id queries', () => {
    const byRatio = listDistricts({
      query: firstDistrict.id,
      sort: 'student-teacher-ratio-asc'
    })
    const byRevenue = getFixtureDistricts()
      .slice()
      .sort((left, right) => right.revenuePerPupil - left.revenuePerPupil)

    expect(byRatio.map(district => district.id)).toEqual([firstDistrict.id])
    expect(byRevenue[0]!.revenuePerPupil).toBeGreaterThanOrEqual(byRevenue[1]!.revenuePerPupil)
  })

  it('defaults to name sorting when no sort is provided directly', () => {
    const result = listDistricts({})

    expect(result[0]?.id).toBe([...districtIds].sort((left, right) => {
      const leftDistrict = districts.find(district => district.id === left)!
      const rightDistrict = districts.find(district => district.id === right)!
      return leftDistrict.name.localeCompare(rightDistrict.name)
    })[0])
  })

  it('reports district counts and lookups', () => {
    expect(getDistrictCount()).toBe(districts.length)
    expect(getDistrictById(firstDistrict.id)?.name).toBe(firstDistrict.name)
    expect(getDistrictById('missing')).toBeNull()
  })

  it('throws on unknown district lookups', () => {
    const lookup = () => getDistrictByIdOrThrow('missing')

    expect(lookup).toThrow('Could not find district "missing".')
  })

  it('returns comparison data and mapped summary selections', () => {
    const comparison = getDistrictComparison(firstDistrict.id)
    const selections = getDistrictSummariesByIds([
      districts[0]!.id,
      districts[1]!.id,
      'missing'
    ])

    expect(comparison.metricBands.enrollment).toMatch(
      /^(below-average|average|above-average)$/
    )
    expect(selections.map(district => district.id)).toEqual([
      districts[0]!.id,
      districts[1]!.id
    ])
  })

  it('throws when comparison data is requested for an unknown district', () => {
    const comparison = () => getDistrictComparison('missing')

    expect(comparison).toThrow('Could not find district "missing".')
  })
})
