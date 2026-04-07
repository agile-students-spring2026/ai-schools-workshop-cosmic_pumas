import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { CompareProvider } from '@/components/compare-provider'
import { getFixtureDistricts } from '@/lib/server/data'
import { getDistrictComparison } from '@/lib/server/repository'
import { formatComparisonValue, formatMetricBand } from '@/lib/district-presentation'

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  })
}))

describe('district page', () => {
  it('renders the district detail experience', async () => {
    const district = getFixtureDistricts()[0]!
    const comparison = getDistrictComparison(district.id)
    const { default: DistrictPage } = await import('@/app/districts/[id]/page')

    render(
      <CompareProvider allDistricts={getFixtureDistricts()}>
        {await DistrictPage({
          params: Promise.resolve({ id: district.id })
        })}
      </CompareProvider>
    )

    expect(
      screen.getByRole('heading', { level: 1, name: district.name })
    ).toBeInTheDocument()
    expect(screen.getByText(/Generate brief/)).toBeInTheDocument()
    expect(
      screen.getByText(
        `State median revenue per pupil: ${formatComparisonValue(
          comparison,
          'revenuePerPupil',
          'stateMedian'
        )}`
      )
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(
        formatMetricBand(comparison.metricBands.revenuePerPupil)
      ).length
    ).toBeGreaterThan(0)
  })

  it('delegates missing districts to notFound', async () => {
    const { default: DistrictPage } = await import('@/app/districts/[id]/page')

    await expect(
      DistrictPage({
        params: Promise.resolve({ id: 'missing' })
      })
    ).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
