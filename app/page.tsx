import { DistrictCard } from '@/components/district-card'
import { SearchControls } from '@/components/search-controls'
import { parseDistrictListQuery, listDistricts } from '@/lib/server/repository'

type HomePageProps = {
  searchParams?: Promise<{
    locale?: string | string[]
    query?: string | string[]
    sort?: string | string[]
    state?: string | string[]
  }>
}

function pickFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function resolveHomeQuery(
  searchParams:
    | {
        locale?: string | string[]
        query?: string | string[]
        sort?: string | string[]
        state?: string | string[]
      }
    | undefined
) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    const normalizedValue = pickFirstValue(value)

    if (normalizedValue) {
      params.set(key, normalizedValue)
    }
  }

  try {
    return parseDistrictListQuery(params)
  } catch {
    return {
      query: undefined,
      state: undefined,
      locale: undefined,
      sort: 'name' as const
    }
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const filters = resolveHomeQuery(searchParams ? await searchParams : undefined)
  const allDistricts = listDistricts({ sort: 'name' })
  const districts = listDistricts(filters)
  const states = [...new Set(allDistricts.map(district => district.state))].sort()
  const locales = [...new Set(allDistricts.map(district => district.locale))].sort()

  return (
    <main className='stack'>
      <section className='hero card'>
        <div className='hero__content'>
          <p className='eyebrow'>Fixture-backed district discovery</p>
          <h1>Find a district with public metrics you can actually explain live.</h1>
          <p className='hero__lede'>
            Search by district name, narrow by state or locale, then carry a short list into comparison and AI briefing.
          </p>
        </div>

        <dl className='hero__stats'>
          <div>
            <dt>Districts</dt>
            <dd>{allDistricts.length}</dd>
          </div>
          <div>
            <dt>Core metrics</dt>
            <dd>4</dd>
          </div>
          <div>
            <dt>Compare cap</dt>
            <dd>3</dd>
          </div>
        </dl>
      </section>

      <SearchControls
        initialState={{
          locale: filters.locale ?? '',
          query: filters.query ?? '',
          sort: filters.sort ?? 'name',
          state: filters.state ?? ''
        }}
        locales={locales}
        pathname='/'
        states={states}
      />

      <section className='stack'>
        <div className='section-heading'>
          <div>
            <p className='eyebrow'>Results</p>
            <h2>Districts ready for closer review</h2>
          </div>
          <p className='section-heading__meta'>
            Showing {districts.length} of {allDistricts.length} districts
          </p>
        </div>

        {districts.length === 0 ? (
          <section className='card empty-state'>
            <h3>No districts match the current filters.</h3>
            <p>Try clearing one filter or broadening the district name search.</p>
          </section>
        ) : (
          <div className='district-grid'>
            {districts.map(district => (
              <DistrictCard district={district} key={district.id} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
