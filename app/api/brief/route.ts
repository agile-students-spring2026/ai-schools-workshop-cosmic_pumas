import {
  districtBriefRequestSchema,
  districtBriefResponseSchema
} from '@/lib/contracts/schemas'
import { handleRouteError } from '@/lib/server/api-response'
import { generateDistrictBrief } from '@/lib/server/brief-service'

export async function POST(request: Request) {
  try {
    const body = districtBriefRequestSchema.parse(await request.json())
    const brief = await generateDistrictBrief(body)

    return Response.json(districtBriefResponseSchema.parse(brief))
  } catch (error) {
    return handleRouteError(error)
  }
}
