import { districtListResponseSchema } from '@/lib/contracts/schemas'
import { handleRouteError } from '@/lib/server/api-response'
import { listDistricts, parseDistrictListQuery } from '@/lib/server/repository'

export async function GET(request: Request) {
  try {
    const query = parseDistrictListQuery(new URL(request.url).searchParams)
    const districts = listDistricts(query)

    return Response.json(
      districtListResponseSchema.parse({
        districts,
        totalCount: districts.length
      })
    )
  } catch (error) {
    return handleRouteError(error)
  }
}
