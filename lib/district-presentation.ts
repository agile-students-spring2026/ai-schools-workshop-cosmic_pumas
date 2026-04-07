import type {
  DistrictComparison,
  DistrictRecord,
  MetricBand
} from '@/lib/contracts/schemas'

type MetricKey = keyof Pick<
  DistrictRecord,
  | 'enrollment'
  | 'studentTeacherRatio'
  | 'revenuePerPupil'
  | 'expenditurePerPupil'
>

type MetricDefinition = {
  key: MetricKey
  label: string
  description: string
  format: (value: number) => string
}

const wholeNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0
})

const decimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

export const DISTRICT_METRICS: MetricDefinition[] = [
  {
    key: 'enrollment',
    label: 'Enrollment',
    description: 'Students currently enrolled',
    format: value => wholeNumberFormatter.format(value)
  },
  {
    key: 'studentTeacherRatio',
    label: 'Student / teacher ratio',
    description: 'Students per teacher',
    format: value => decimalFormatter.format(value)
  },
  {
    key: 'revenuePerPupil',
    label: 'Revenue per pupil',
    description: 'Annual revenue allocated per student',
    format: value => currencyFormatter.format(value)
  },
  {
    key: 'expenditurePerPupil',
    label: 'Expenditure per pupil',
    description: 'Annual spending per student',
    format: value => currencyFormatter.format(value)
  }
]

export function formatTeacherCount(value: number) {
  return wholeNumberFormatter.format(value)
}

export function formatMetricBand(metricBand: MetricBand) {
  switch (metricBand) {
    case 'above-average':
      return 'Above average'
    case 'below-average':
      return 'Below average'
    case 'average':
    default:
      return 'Near average'
  }
}

export function formatComparisonValue(
  comparison: DistrictComparison,
  metric: MetricKey,
  benchmark: 'stateMedian' | 'nationalMedian'
) {
  const definition = DISTRICT_METRICS.find(
    candidate => candidate.key === metric
  ) as MetricDefinition

  return definition.format(comparison[benchmark][metric])
}
