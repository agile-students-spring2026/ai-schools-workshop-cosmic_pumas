import Link from 'next/link'
import { CompareToggleButton } from '@/components/compare-toggle-button'
import type { DistrictSummary } from '@/lib/contracts/schemas'
import { formatTeacherCount } from '@/lib/district-presentation'

type DistrictCardProps = {
  district: DistrictSummary
}

export function DistrictCard({ district }: DistrictCardProps) {
  return (
    <article className='district-card card'>
      <div className='district-card__header'>
        <div>
          <p className='eyebrow'>
            {district.state} · {district.locale}
          </p>
          <h3>{district.name}</h3>
        </div>
        <span className='badge'>Source {district.sourceYear}</span>
      </div>

      <div className='district-card__stats'>
        <div>
          <dt>Enrollment</dt>
          <dd>{formatTeacherCount(district.enrollment)}</dd>
        </div>
        <div>
          <dt>Student / teacher ratio</dt>
          <dd>{district.studentTeacherRatio.toFixed(2)}</dd>
        </div>
      </div>

      <p className='district-card__copy'>
        Use this district as a starting point for deeper metric review, AI briefing, or side-by-side comparison.
      </p>

      <div className='district-card__actions'>
        <Link className='button button--solid' href={`/districts/${district.id}`}>
          View district
        </Link>
        <CompareToggleButton className='button button--ghost' districtId={district.id} />
      </div>
    </article>
  )
}
