import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToStaticMarkup } from 'react-dom/server'
import RootLayout from '@/app/layout'
import AppErrorBoundary from '@/app/error'
import HomePage from '@/app/page'
import NotFound from '@/app/not-found'
import ComparePage from '@/app/compare/page'
import { listDistricts } from '@/lib/server/repository'

const { replace } = vi.hoisted(() => ({
  replace: vi.fn()
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  useRouter: () => ({
    replace
  })
}))

describe('app shell', () => {
  it('renders the root layout and home page', async () => {
    const firstDistrict = listDistricts({ sort: 'name' })[0]!
    const markup = renderToStaticMarkup(
      RootLayout({ children: await HomePage({}) })
    )

    expect(markup).toContain('Find a district with public metrics')
    expect(markup).toContain('href="/compare"')
    expect(markup).toContain(`href="/districts/${firstDistrict.id}"`)
  })

  it('renders the compare page with and without selected districts', async () => {
    const districts = listDistricts({ sort: 'name' })
    const firstDistrict = districts[0]!
    const secondDistrict = districts[1]!
    const { rerender } = render(
      await ComparePage({
        searchParams: undefined
      })
    )

    expect(
      screen.getByText('No valid district IDs selected yet.')
    ).toBeInTheDocument()

    rerender(
      await ComparePage({
        searchParams: Promise.resolve({
          ids: [firstDistrict.id, secondDistrict.id]
        })
      })
    )

    expect(screen.getAllByText(firstDistrict.name).length).toBeGreaterThan(0)
    expect(screen.getAllByText(secondDistrict.name).length).toBeGreaterThan(0)
    expect(
      screen.getByText(/District metrics with state median context/)
    ).toBeInTheDocument()

    rerender(
      await ComparePage({
        searchParams: Promise.resolve({ ids: firstDistrict.id })
      })
    )

    expect(screen.getAllByText(firstDistrict.name).length).toBeGreaterThan(0)
    expect(
      screen.getByText(/Add one or two more districts/)
    ).toBeInTheDocument()
  })

  it('renders the not found page', () => {
    render(<NotFound />)

    expect(
      screen.getByRole('heading', { name: 'District not found' })
    ).toBeInTheDocument()
  })

  it('renders the error boundary and calls reset', async () => {
    const user = userEvent.setup()
    const reset = vi.fn()

    render(<AppErrorBoundary error={new Error('Broken')} reset={reset} />)
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(reset).toHaveBeenCalledTimes(1)
  })
})
