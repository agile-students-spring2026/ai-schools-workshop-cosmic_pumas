import {
  districtBriefRequestSchema,
  districtBriefResponseSchema,
  districtListQuerySchema
} from '@/lib/contracts/schemas'

describe('contract schemas', () => {
  it('normalizes district list queries', () => {
    const result = districtListQuerySchema.parse({
      query: 'Boston',
      state: 'ma',
      locale: 'City',
      sort: 'name'
    })

    expect(result.state).toBe('MA')
  })

  it('rejects too many comparison districts', () => {
    const parse = () =>
      districtBriefRequestSchema.parse({
        districtId: 'ma-boston',
        comparisonDistrictIds: ['a', 'b', 'c']
      })

    expect(parse).toThrow()
  })

  it('accepts valid brief responses', () => {
    const result = districtBriefResponseSchema.parse({
      summary: 'A balanced district with strong funding.',
      strengths: ['Funding exceeds state peers.'],
      cautions: ['Student-teacher ratio is near the state median.'],
      comparisonNotes: ['Funding exceeds the selected comparison district.'],
      sourceYear: '2023-2024'
    })

    expect(result.sourceYear).toBe('2023-2024')
  })
})
