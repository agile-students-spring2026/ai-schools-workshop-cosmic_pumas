import { districtDetailResponseSchema } from '@/lib/contracts/schemas'
import { handleRouteError } from '@/lib/server/api-response'
import {
  getDistrictByIdOrThrow,
  getDistrictComparison
} from '@/lib/server/repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const district = getDistrictByIdOrThrow(id)
    const comparison = getDistrictComparison(id)

    return Response.json(
      districtDetailResponseSchema.parse({
        district,
        comparison
      })
    )
  } catch (error) {
    return handleRouteError(error)
  }
}
