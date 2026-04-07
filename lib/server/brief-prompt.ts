import type {
  DistrictBriefResponse,
  DistrictComparison,
  DistrictRecord,
  DistrictSummary
} from '@/lib/contracts/schemas'

export type DistrictBriefContext = {
  district: DistrictRecord
  comparison: DistrictComparison
  comparisonDistricts: DistrictSummary[]
}

export const DISTRICT_BRIEF_RESPONSE_EXAMPLE: DistrictBriefResponse = {
  summary:
    'This district offers a balanced profile with clear strengths and a few watch points.',
  strengths: ['Strong funding relative to peers.'],
  cautions: ['Student-teacher ratio is higher than the state median.'],
  comparisonNotes: ['Funding is stronger than the selected comparison district.'],
  sourceYear: '2023-2024'
}

export function buildDistrictBriefPrompt(context: DistrictBriefContext) {
  return {
    systemPrompt:
      'You are an education data analyst. Respond with valid JSON only. Do not add markdown fences. Be specific, concise, and avoid unsupported claims.',
    userPrompt: JSON.stringify(
      {
        instruction:
          'Write a district brief for parents and educators using only the supplied public metrics.',
        requiredResponseShape: DISTRICT_BRIEF_RESPONSE_EXAMPLE,
        context
      },
      null,
      2
    )
  }
}
