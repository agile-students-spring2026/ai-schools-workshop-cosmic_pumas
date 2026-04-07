'use client'

import {
  useEffect,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent
} from 'react'
import { useRouter } from 'next/navigation'
import type { DistrictSort } from '@/lib/contracts/schemas'

type SearchState = {
  locale: string
  query: string
  sort: DistrictSort
  state: string
}

type SearchControlsProps = {
  initialState: SearchState
  locales: string[]
  pathname: string
  states: string[]
}

function buildSearchHref(pathname: string, state: SearchState) {
  const params = new URLSearchParams()

  if (state.query.trim()) {
    params.set('query', state.query.trim())
  }

  if (state.state) {
    params.set('state', state.state)
  }

  if (state.locale) {
    params.set('locale', state.locale)
  }

  if (state.sort !== 'name') {
    params.set('sort', state.sort)
  }

  const queryString = params.toString()

  return queryString ? `${pathname}?${queryString}` : pathname
}

export function SearchControls({
  initialState,
  locales,
  pathname,
  states
}: SearchControlsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formState, setFormState] = useState(initialState)

  useEffect(() => {
    setFormState(initialState)
  }, [
    initialState.locale,
    initialState.query,
    initialState.sort,
    initialState.state
  ])

  function navigate(nextState: SearchState) {
    startTransition(() => {
      router.replace(buildSearchHref(pathname, nextState), {
        scroll: false
      })
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate(formState)
  }

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    setFormState(currentState => ({
      ...currentState,
      query: event.target.value
    }))
  }

  function handleStateChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextState = {
      ...formState,
      state: event.target.value
    }

    setFormState(nextState)
    navigate(nextState)
  }

  function handleLocaleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextState = {
      ...formState,
      locale: event.target.value
    }

    setFormState(nextState)
    navigate(nextState)
  }

  function handleSortChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextState = {
      ...formState,
      sort: event.target.value as DistrictSort
    }

    setFormState(nextState)
    navigate(nextState)
  }

  function resetFilters() {
    const nextState = {
      query: '',
      state: '',
      locale: '',
      sort: 'name' as DistrictSort
    }

    setFormState(nextState)
    navigate(nextState)
  }

  return (
    <form className='search-panel card' onSubmit={handleSubmit}>
      <div className='search-panel__header'>
        <div>
          <p className='eyebrow'>Discovery</p>
          <h2>Search districts by name, place, and pace</h2>
        </div>
        <button className='button button--ghost' type='button' onClick={resetFilters}>
          Reset filters
        </button>
      </div>

      <div className='search-panel__grid'>
        <label className='field field--query'>
          <span>District name or ID</span>
          <div className='field__query'>
            <input
              name='query'
              placeholder='Boston, Howard, or ma-boston'
              value={formState.query}
              onChange={handleQueryChange}
            />
            <button className='button button--solid' type='submit'>
              Search
            </button>
          </div>
        </label>

        <label className='field'>
          <span>State</span>
          <select value={formState.state} onChange={handleStateChange}>
            <option value=''>All states</option>
            {states.map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>

        <label className='field'>
          <span>Locale</span>
          <select value={formState.locale} onChange={handleLocaleChange}>
            <option value=''>All locales</option>
            {locales.map(locale => (
              <option key={locale} value={locale}>
                {locale}
              </option>
            ))}
          </select>
        </label>

        <label className='field'>
          <span>Sort</span>
          <select value={formState.sort} onChange={handleSortChange}>
            <option value='name'>Name</option>
            <option value='enrollment-desc'>Largest enrollment</option>
            <option value='student-teacher-ratio-asc'>Lowest student / teacher ratio</option>
            <option value='revenue-desc'>Highest revenue per pupil</option>
          </select>
        </label>
      </div>

      <p className='search-panel__status' role='status'>
        {isPending ? 'Refreshing results…' : 'Filters update the results without leaving the page.'}
      </p>
    </form>
  )
}
