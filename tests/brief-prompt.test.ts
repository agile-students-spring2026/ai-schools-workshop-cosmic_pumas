import {
  DISTRICT_BRIEF_RESPONSE_EXAMPLE,
  buildDistrictBriefPrompt
} from '@/lib/server/brief-prompt'
import {
  getDistrictByIdOrThrow,
  getDistrictComparison,
  getDistrictSummariesByIds,
  listDistricts
} from '@/lib/server/repository'

const allDistricts = listDistricts({ sort: 'name' })
const primaryDistrict = allDistricts[0]!
const comparisonDistrict = allDistricts[1]!

describe('district brief prompt builder', () => {
  it('builds a structured prompt payload', () => {
    const prompt = buildDistrictBriefPrompt({
      district: getDistrictByIdOrThrow(primaryDistrict.id),
      comparison: getDistrictComparison(primaryDistrict.id),
      comparisonDistricts: getDistrictSummariesByIds([comparisonDistrict.id])
    })

    expect(prompt.systemPrompt).toContain('Respond with valid JSON only')
    expect(prompt.userPrompt).toContain(primaryDistrict.name)
    expect(prompt.userPrompt).toContain(comparisonDistrict.name)
    expect(prompt.userPrompt).toContain(
      DISTRICT_BRIEF_RESPONSE_EXAMPLE.summary
    )
  })
})
