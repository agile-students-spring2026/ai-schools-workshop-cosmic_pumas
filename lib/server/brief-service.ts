import {
  districtBriefRequestSchema,
  districtBriefResponseSchema,
  type DistrictBriefRequest
} from '@/lib/contracts/schemas'
import { requestOpenAIJson } from '@/lib/server/ai-provider'
import { buildDistrictBriefPrompt } from '@/lib/server/brief-prompt'
import { AIProviderError } from '@/lib/server/errors'
import {
  getDistrictByIdOrThrow,
  getDistrictComparison,
  getDistrictSummariesByIds
} from '@/lib/server/repository'

export async function generateDistrictBrief(input: DistrictBriefRequest) {
  const request = districtBriefRequestSchema.parse(input)
  const district = getDistrictByIdOrThrow(request.districtId)
  const comparison = getDistrictComparison(request.districtId)
  const comparisonDistricts = getDistrictSummariesByIds(
    request.comparisonDistrictIds
  )
  const prompt = buildDistrictBriefPrompt({
    district,
    comparison,
    comparisonDistricts
  })
  const rawResponse = await requestOpenAIJson(prompt)

  if (
    typeof rawResponse !== 'object' ||
    rawResponse === null ||
    Array.isArray(rawResponse)
  ) {
    throw new AIProviderError()
  }

  return districtBriefResponseSchema.parse({
    ...rawResponse,
    sourceYear: district.sourceYear
  })
}
