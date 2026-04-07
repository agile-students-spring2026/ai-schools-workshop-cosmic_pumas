import type {
  DistrictComparison,
  DistrictRecord,
  MetricBand,
  MetricValues
} from '@/lib/contracts/schemas'

const METRIC_KEYS = [
  'enrollment',
  'studentTeacherRatio',
  'revenuePerPupil',
  'expenditurePerPupil'
] as const

type MetricKey = (typeof METRIC_KEYS)[number]

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right)

  if (sorted.length === 0) {
    throw new Error('Median requires at least one value.')
  }

  const midpoint = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    const lower = sorted[midpoint - 1]!
    const upper = sorted[midpoint]!

    return Number(((lower + upper) / 2).toFixed(2))
  }

  return sorted[midpoint]!
}

export function calculateMedianValues(districts: DistrictRecord[]): MetricValues {
  return {
    enrollment: median(districts.map(district => district.enrollment)),
    studentTeacherRatio: median(
      districts.map(district => district.studentTeacherRatio)
    ),
    revenuePerPupil: median(districts.map(district => district.revenuePerPupil)),
    expenditurePerPupil: median(
      districts.map(district => district.expenditurePerPupil)
    )
  }
}

export function classifyMetricBand(value: number, benchmark: number): MetricBand {
  const margin = benchmark * 0.05

  if (value > benchmark + margin) {
    return 'above-average'
  }

  if (value < benchmark - margin) {
    return 'below-average'
  }

  return 'average'
}

export function buildDistrictComparison(
  district: DistrictRecord,
  allDistricts: DistrictRecord[]
): DistrictComparison {
  const stateDistricts = allDistricts.filter(
    candidate => candidate.state === district.state
  )
  const stateMedian = calculateMedianValues(stateDistricts)
  const nationalMedian = calculateMedianValues(allDistricts)

  const metricBands = Object.fromEntries(
    METRIC_KEYS.map(metric => [
      metric,
      classifyMetricBand(district[metric], stateMedian[metric])
    ])
  ) as Record<MetricKey, MetricBand>

  return {
    nationalMedian,
    stateMedian,
    metricBands
  }
}
