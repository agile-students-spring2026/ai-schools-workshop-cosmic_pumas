import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BriefPanel } from '@/components/brief-panel'
import { CompareProvider } from '@/components/compare-provider'
import { listDistricts } from '@/lib/server/repository'

const allDistricts = listDistricts({ sort: 'name' })
const primaryDistrict = allDistricts[0]!
const comparisonDistricts = allDistricts.slice(1, 3)

describe('brief panel', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('submits the selected comparison districts and renders the success state', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        summary: `${primaryDistrict.name} shows strong funding and stable staffing.`,
        strengths: ['Revenue per pupil exceeds peers.'],
        cautions: ['Enrollment remains much larger than the state median.'],
        comparisonNotes: [`${comparisonDistricts[0]!.name} offers a tighter student / teacher ratio.`],
        sourceYear: primaryDistrict.sourceYear
      })
    })

    vi.stubGlobal('fetch', fetchSpy)
    window.localStorage.setItem(
      'district-compare-selection',
      JSON.stringify([
        primaryDistrict.id,
        comparisonDistricts[0]!.id,
        comparisonDistricts[1]!.id
      ])
    )

    render(
      <CompareProvider allDistricts={allDistricts}>
        <BriefPanel districtId={primaryDistrict.id} />
      </CompareProvider>
    )

    expect(await screen.findByText(comparisonDistricts[0]!.name)).toBeInTheDocument()
    expect(screen.getByText(comparisonDistricts[1]!.name)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Generate brief' }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          districtId: primaryDistrict.id,
          comparisonDistrictIds: comparisonDistricts.map(district => district.id)
        })
      })
    })

    expect(
      await screen.findByText(
        new RegExp(`${primaryDistrict.name} shows strong funding and stable staffing.`)
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        new RegExp(
          `${comparisonDistricts[0]!.name} offers a tighter student \\/ teacher ratio.`
        )
      )
    ).toBeInTheDocument()
  })

  it('renders the unavailable state from the API without crashing', async () => {
    const user = userEvent.setup()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            message:
              'AI district briefs are unavailable because no API key is configured.'
          }
        })
      })
    )

    render(
      <CompareProvider allDistricts={allDistricts}>
        <BriefPanel districtId={primaryDistrict.id} />
      </CompareProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Generate brief' }))

    expect(
      await screen.findByText(
        /AI district briefs are unavailable because no API key is configured/
      )
    ).toBeInTheDocument()
  })
})
