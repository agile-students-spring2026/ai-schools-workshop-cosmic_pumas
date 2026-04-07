import Link from 'next/link'
import { Fragment } from 'react'
import { parseCompareIds } from '@/lib/compare-selection'
import {
  DISTRICT_METRICS,
  formatComparisonValue,
  formatMetricBand
} from '@/lib/district-presentation'
import {
  getDistrictById,
  getDistrictComparison
} from '@/lib/server/repository'

type ComparePageProps = {
  searchParams?: Promise<{
    ids?: string | string[]
  }>
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = searchParams ? await searchParams : undefined
  const selectedDistricts = parseCompareIds(params?.ids)
    .map(id => getDistrictById(id))
    .filter(
      (district): district is NonNullable<ReturnType<typeof getDistrictById>> =>
        district !== null
    )
  const entries = selectedDistricts.map(district => ({
    comparison: getDistrictComparison(district.id),
    district
  }))

  return (
    <main className='stack'>
      <section className='card compare-header'>
        <div>
          <p className='eyebrow'>Comparison</p>
          <h1>Line up up to three districts side by side.</h1>
        </div>
        <p>
          Use the global compare tray to assemble a short list, then review raw values and state positioning in one scan.
        </p>
        <Link className='button button--ghost' href='/'>
          Return to discovery
        </Link>
      </section>

      {entries.length === 0 ? (
        <section className='card empty-state'>
          <h2>No valid district IDs selected yet.</h2>
          <p>Build a compare tray from the landing page, then reopen this view.</p>
        </section>
      ) : (
        <>
          <section className='compare-summary-grid'>
            {entries.map(({ district }) => (
              <article className='compare-summary card' key={district.id}>
                <p className='eyebrow'>
                  {district.state} · {district.locale}
                </p>
                <h2>{district.name}</h2>
                <p>Source year {district.sourceYear}</p>
                <Link className='button button--solid' href={`/districts/${district.id}`}>
                  Open district
                </Link>
              </article>
            ))}
          </section>

          {entries.length === 1 ? (
            <section className='card empty-state'>
              <h2>Add one or two more districts for a richer comparison.</h2>
              <p>
                The single-district view still shows each metric below, but
                side-by-side context becomes more useful with multiple
                selections.
              </p>
            </section>
          ) : null}

          <section className='card stack'>
            <div className='section-heading'>
              <div>
                <p className='eyebrow'>Metric table</p>
                <h2>District metrics with state median context</h2>
              </div>
            </div>

            <div
              className='comparison-table'
              style={{
                gridTemplateColumns: `minmax(12rem, 1.1fr) repeat(${entries.length}, minmax(0, 1fr))`
              }}
            >
              <div className='comparison-table__head'>Metric</div>
              {entries.map(({ district }) => (
                <div className='comparison-table__head' key={district.id}>
                  {district.name}
                </div>
              ))}

              {DISTRICT_METRICS.map(metric => (
                <Fragment key={metric.key}>
                  <div className='comparison-table__metric'>
                    <strong>{metric.label}</strong>
                    <p>{metric.description}</p>
                  </div>

                  {entries.map(({ comparison, district }) => (
                    <div
                      className='comparison-table__cell'
                      key={`${district.id}-${metric.key}`}
                    >
                      <p className='comparison-table__value'>
                        {metric.format(district[metric.key])}
                      </p>
                      <p>
                        State median:{' '}
                        {formatComparisonValue(comparison, metric.key, 'stateMedian')}
                      </p>
                      <p>
                        National median:{' '}
                        {formatComparisonValue(
                          comparison,
                          metric.key,
                          'nationalMedian'
                        )}
                      </p>
                      <span
                        className={`badge badge--${comparison.metricBands[metric.key]}`}
                      >
                        {formatMetricBand(comparison.metricBands[metric.key])}
                      </span>
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
