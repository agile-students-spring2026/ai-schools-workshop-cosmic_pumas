import {
  buildDistrictComparison,
  calculateMedianValues,
  classifyMetricBand
} from '@/lib/server/comparison'
import { getFixtureDistricts } from '@/lib/server/data'

describe('comparison helpers', () => {
  it('calculates medians across even-sized collections', () => {
    const source = getFixtureDistricts().slice(0, 4)
    const result = calculateMedianValues(source)

    expect(result).toEqual({
      enrollment: 298.5,
      studentTeacherRatio: 9.55,
      revenuePerPupil: 47106,
      expenditurePerPupil: 46202.5
    })
  })

  it('classifies metric bands around a 5 percent threshold', () => {
    expect(classifyMetricBand(111, 100)).toBe('above-average')
    expect(classifyMetricBand(94, 100)).toBe('below-average')
    expect(classifyMetricBand(104, 100)).toBe('average')
  })

  it('builds district comparison context', () => {
    const districts = getFixtureDistricts()
    const result = buildDistrictComparison(districts[0], districts)

    expect(result.stateMedian.enrollment).toBe(363)
    expect(result.nationalMedian.enrollment).toBe(363)
    expect(result.metricBands.revenuePerPupil).toBe('average')
  })
})
