'use client'

import { useState } from 'react'
import { useCompare } from '@/components/compare-provider'
import type { DistrictBriefResponse } from '@/lib/contracts/schemas'

type BriefState =
  | {
      status: 'idle'
    }
  | {
      status: 'loading'
    }
  | {
      status: 'error'
      message: string
    }
  | {
      status: 'success'
      brief: DistrictBriefResponse
    }

type BriefPanelProps = {
  districtId: string
}

export function BriefPanel({ districtId }: BriefPanelProps) {
  const { selectedDistricts, selectedIds } = useCompare()
  const [state, setState] = useState<BriefState>({
    status: 'idle'
  })
  const comparisonDistricts = selectedDistricts.filter(
    district => district.id !== districtId
  )

  async function handleGenerateBrief() {
    setState({
      status: 'loading'
    })

    try {
      const response = await fetch('/api/brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          districtId,
          comparisonDistrictIds: selectedIds
            .filter(id => id !== districtId)
            .slice(0, 2)
        })
      })

      const payload = await response.json()

      if (!response.ok) {
        setState({
          status: 'error',
          message:
            payload?.error?.message ??
            'The AI brief could not be generated right now.'
        })

        return
      }

      setState({
        status: 'success',
        brief: payload as DistrictBriefResponse
      })
    } catch {
      setState({
        status: 'error',
        message: 'The AI brief could not be generated right now.'
      })
    }
  }

  return (
    <section className='brief-panel card'>
      <div className='section-heading'>
        <div>
          <p className='eyebrow'>AI district brief</p>
          <h2>Generate a narrative snapshot for this district</h2>
        </div>
        <button
          className='button button--solid'
          disabled={state.status === 'loading'}
          type='button'
          onClick={handleGenerateBrief}
        >
          {state.status === 'loading' ? 'Generating brief…' : 'Generate brief'}
        </button>
      </div>

      <p className='muted-copy'>
        The brief uses the current district and up to two districts from your compare tray for context.
      </p>

      {comparisonDistricts.length > 0 ? (
        <ul className='brief-panel__comparisons'>
          {comparisonDistricts.slice(0, 2).map(district => (
            <li key={district.id}>{district.name}</li>
          ))}
        </ul>
      ) : (
        <p className='brief-panel__hint'>No comparison districts selected yet. The brief will still generate for the current district.</p>
      )}

      {state.status === 'idle' ? (
        <div className='brief-panel__state'>
          <p>Generate a concise briefing with strengths, cautions, and comparison notes.</p>
        </div>
      ) : null}

      {state.status === 'loading' ? (
        <div className='brief-panel__state'>
          <p>Contacting the AI provider and assembling the district summary.</p>
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className='brief-panel__state brief-panel__state--error'>
          <p>{state.message}</p>
        </div>
      ) : null}

      {state.status === 'success' ? (
        <div className='brief-panel__content'>
          <p className='brief-panel__summary'>{state.brief.summary}</p>

          <div className='brief-panel__columns'>
            <div>
              <h3>Strengths</h3>
              <ul>
                {state.brief.strengths.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3>Cautions</h3>
              <ul>
                {state.brief.cautions.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {state.brief.comparisonNotes.length > 0 ? (
            <div>
              <h3>Comparison notes</h3>
              <ul>
                {state.brief.comparisonNotes.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className='brief-panel__source'>Source year: {state.brief.sourceYear}</p>
        </div>
      ) : null}
    </section>
  )
}
