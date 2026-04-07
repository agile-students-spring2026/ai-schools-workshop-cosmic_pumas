'use client'

import Link from 'next/link'
import { useCompare } from '@/components/compare-provider'

export function CompareTray() {
  const { clearSelections, removeDistrict, selectedDistricts } = useCompare()

  if (selectedDistricts.length === 0) {
    return null
  }

  const href = `/compare?ids=${selectedDistricts.map(district => district.id).join(',')}`

  return (
    <aside aria-label='Compare tray' className='compare-tray'>
      <div className='compare-tray__intro'>
        <p className='eyebrow'>Compare tray</p>
        <h2>{selectedDistricts.length} district selections</h2>
        <p>Carry up to three districts across the app, then open a side-by-side view.</p>
      </div>

      <div className='compare-tray__list'>
        {selectedDistricts.map(district => (
          <article className='compare-chip' key={district.id}>
            <div>
              <p className='compare-chip__title'>{district.name}</p>
              <p className='compare-chip__meta'>
                {district.state} · {district.locale}
              </p>
            </div>
            <button type='button' onClick={() => removeDistrict(district.id)}>
              Remove
            </button>
          </article>
        ))}
      </div>

      <div className='compare-tray__actions'>
        <Link className='button button--solid' href={href}>
          Open comparison
        </Link>
        <button className='button button--ghost' type='button' onClick={clearSelections}>
          Clear tray
        </button>
      </div>
    </aside>
  )
}
