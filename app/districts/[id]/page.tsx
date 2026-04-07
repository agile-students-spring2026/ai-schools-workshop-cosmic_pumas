import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BriefPanel } from '@/components/brief-panel'
import { CompareToggleButton } from '@/components/compare-toggle-button'
import {
  DISTRICT_METRICS,
  formatComparisonValue,
  formatMetricBand,
  formatTeacherCount
} from '@/lib/district-presentation'
import { getDistrictById, getDistrictComparison } from '@/lib/server/repository'

type DistrictPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const { id } = await params
  const district = getDistrictById(id)

  if (!district) {
    notFound()
  }

  const comparison = getDistrictComparison(id)

  return (
    <main className='stack'>
      <section className='detail-hero card'>
        <div className='detail-hero__content'>
          <p className='eyebrow'>
            {district.state} · {district.locale}
          </p>
          <h1>{district.name}</h1>
          <p className='detail-hero__lede'>
            Source year {district.sourceYear}. Use this view to read the district’s current scale, staffing pressure, and spending context before generating an AI brief.
          </p>
        </div>

        <div className='detail-hero__actions'>
          <CompareToggleButton className='button button--solid' districtId={district.id} />
          <Link className='button button--ghost' href={`/compare?ids=${district.id}`}>
            Compare this district
          </Link>
        </div>
      </section>

      <section className='facts-strip'>
        <article className='fact-card card'>
          <p className='eyebrow'>Enrollment</p>
          <h2>{formatTeacherCount(district.enrollment)}</h2>
        </article>

        <article className='fact-card card'>
          <p className='eyebrow'>Teachers</p>
          <h2>{formatTeacherCount(district.teachers)}</h2>
        </article>

        <article className='fact-card card'>
          <p className='eyebrow'>Student / teacher ratio</p>
          <h2>{district.studentTeacherRatio.toFixed(2)}</h2>
        </article>
      </section>

      <section className='stack'>
        <div className='section-heading'>
          <div>
            <p className='eyebrow'>Metrics</p>
            <h2>Four public indicators, each grounded against peers</h2>
          </div>
        </div>

        <div className='metric-grid'>
          {DISTRICT_METRICS.map(metric => (
            <article className='metric-card card' key={metric.key}>
              <div className='metric-card__header'>
                <div>
                  <p className='eyebrow'>{metric.label}</p>
                  <h3>{metric.format(district[metric.key])}</h3>
                </div>
                <span
                  className={`badge badge--${comparison.metricBands[metric.key]}`}
                >
                  {formatMetricBand(comparison.metricBands[metric.key])}
                </span>
              </div>

              <p className='metric-card__copy'>{metric.description}</p>

              <dl className='metric-card__benchmarks'>
                <div>
                  <dt>State median</dt>
                  <dd>
                    {formatComparisonValue(comparison, metric.key, 'stateMedian')}
                  </dd>
                </div>
                <div>
                  <dt>National median</dt>
                  <dd>
                    {formatComparisonValue(
                      comparison,
                      metric.key,
                      'nationalMedian'
                    )}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className='card detail-context'>
        <p className='eyebrow'>Context</p>
        <h2>{district.name}</h2>
        <p>
          Locale: {district.locale} · Source year: {district.sourceYear}
        </p>
        <p>
          State median revenue per pupil:{' '}
          {formatComparisonValue(comparison, 'revenuePerPupil', 'stateMedian')}
        </p>
        <p>
          National median expenditure per pupil: {formatComparisonValue(
            comparison,
            'expenditurePerPupil',
            'nationalMedian'
          )}
        </p>
      </section>

      <BriefPanel districtId={district.id} />
    </main>
  )
}
