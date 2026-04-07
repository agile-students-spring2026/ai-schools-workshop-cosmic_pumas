import { ZodError } from 'zod'
import { apiErrorSchema } from '@/lib/contracts/schemas'
import { AppError } from '@/lib/server/errors'

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      apiErrorSchema.parse({
        error: {
          code: error.code,
          message: error.message
        }
      }),
      { status: error.status }
    )
  }

  if (error instanceof ZodError) {
    return Response.json(
      apiErrorSchema.parse({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Request payload validation failed.'
        }
      }),
      { status: 400 }
    )
  }

  console.error(error)

  return Response.json(
    apiErrorSchema.parse({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.'
      }
    }),
    { status: 500 }
  )
}
