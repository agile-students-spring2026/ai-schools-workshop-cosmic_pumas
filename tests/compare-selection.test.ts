import { parseCompareIds, normalizeCompareIds } from '@/lib/compare-selection'
import {
  formatComparisonValue,
  formatMetricBand
} from '@/lib/district-presentation'
import { buildDistrictComparison } from '@/lib/server/comparison'
import { getFixtureDistricts } from '@/lib/server/data'
import { listDistricts } from '@/lib/server/repository'

const allDistricts = listDistricts({ sort: 'name' })

describe('compare selection utilities', () => {
  it('deduplicates and caps compare ids', () => {
    const ids = allDistricts.slice(0, 4).map(district => district.id)

    expect(
      normalizeCompareIds([
        ` ${ids[0]} `,
        ids[0]!,
        ids[1]!,
        ids[2]!,
        ids[3]!
      ])
    ).toEqual(ids.slice(0, 3))
  })

  it('parses compare ids from route params', () => {
    const ids = allDistricts.slice(0, 3).map(district => district.id)

    expect(parseCompareIds([`${ids[0]},${ids[1]}`, ids[2]!])).toEqual(ids)
  })
})

describe('district presentation helpers', () => {
  it('formats metric bands for human-readable copy', () => {
    expect(formatMetricBand('above-average')).toBe('Above average')
    expect(formatMetricBand('average')).toBe('Near average')
    expect(formatMetricBand('below-average')).toBe('Below average')
  })

  it('formats comparison values using the metric definition formatter', () => {
    const districts = getFixtureDistricts()
    const comparison = buildDistrictComparison(districts[0], districts)

    expect(formatComparisonValue(comparison, 'revenuePerPupil', 'nationalMedian')).toBe(
      '$41,047'
    )
  })
})
