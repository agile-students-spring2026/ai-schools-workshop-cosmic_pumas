import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchControls } from '@/components/search-controls'

const { replace } = vi.hoisted(() => ({
  replace: vi.fn()
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace
  })
}))

describe('search controls', () => {
  beforeEach(() => {
    replace.mockReset()
  })

  it('submits text search and updates the route', async () => {
    const user = userEvent.setup()

    render(
      <SearchControls
        initialState={{
          locale: '',
          query: '',
          sort: 'name',
          state: ''
        }}
        locales={['City', 'Suburb']}
        pathname='/'
        states={['MA', 'MD']}
      />
    )

    await user.type(
      screen.getByRole('textbox', { name: /district name or id/i }),
      'Boston'
    )
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(replace).toHaveBeenCalledWith('/?query=Boston', {
      scroll: false
    })
  })

  it('updates filters immediately for selects and reset', async () => {
    const user = userEvent.setup()

    render(
      <SearchControls
        initialState={{
          locale: '',
          query: 'Howard',
          sort: 'name',
          state: ''
        }}
        locales={['City', 'Suburb']}
        pathname='/'
        states={['MA', 'MD']}
      />
    )

    await user.selectOptions(screen.getByRole('combobox', { name: 'State' }), 'MD')
    expect(replace).toHaveBeenLastCalledWith('/?query=Howard&state=MD', {
      scroll: false
    })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Locale' }), 'Suburb')
    expect(replace).toHaveBeenLastCalledWith(
      '/?query=Howard&state=MD&locale=Suburb',
      {
        scroll: false
      }
    )

    await user.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(replace).toHaveBeenLastCalledWith('/', {
      scroll: false
    })
  })
})
