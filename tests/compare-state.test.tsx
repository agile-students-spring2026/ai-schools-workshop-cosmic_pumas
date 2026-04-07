import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CompareProvider } from '@/components/compare-provider'
import { CompareToggleButton } from '@/components/compare-toggle-button'
import { CompareTray } from '@/components/compare-tray'
import { listDistricts } from '@/lib/server/repository'

const allDistricts = listDistricts({ sort: 'name' })
const selectedDistricts = allDistricts.slice(0, 4)

describe('compare state', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('adds districts to the tray and enforces the selection cap', async () => {
    const user = userEvent.setup()

    render(
      <CompareProvider allDistricts={allDistricts}>
        <CompareToggleButton districtId={selectedDistricts[0]!.id} />
        <CompareToggleButton districtId={selectedDistricts[1]!.id} />
        <CompareToggleButton districtId={selectedDistricts[2]!.id} />
        <CompareToggleButton districtId={selectedDistricts[3]!.id} />
        <CompareTray />
      </CompareProvider>
    )

    await user.click(screen.getAllByRole('button', { name: 'Add to compare' })[0])
    await user.click(screen.getAllByRole('button', { name: 'Add to compare' })[0])
    await user.click(screen.getAllByRole('button', { name: 'Add to compare' })[0])

    expect(screen.getByText(/3 district selections/)).toBeInTheDocument()
    expect(screen.getByText(selectedDistricts[0]!.name)).toBeInTheDocument()
    expect(screen.getByText(selectedDistricts[1]!.name)).toBeInTheDocument()
    expect(screen.getByText(selectedDistricts[2]!.name)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Compare tray full' })
    ).toBeDisabled()

    await waitFor(() => {
      expect(
        window.localStorage.getItem('district-compare-selection')
      ).toContain(selectedDistricts[0]!.id)
    })
  })

  it('loads persisted selections from local storage', async () => {
    window.localStorage.setItem(
      'district-compare-selection',
      JSON.stringify([selectedDistricts[0]!.id, selectedDistricts[1]!.id])
    )

    render(
      <CompareProvider allDistricts={allDistricts}>
        <CompareTray />
      </CompareProvider>
    )

    expect(await screen.findByText(/2 district selections/)).toBeInTheDocument()
    expect(screen.getByText(selectedDistricts[0]!.name)).toBeInTheDocument()
    expect(screen.getByText(selectedDistricts[1]!.name)).toBeInTheDocument()
  })
})
