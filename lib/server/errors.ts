export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class InvalidQueryError extends AppError {
  constructor(message: string) {
    super('INVALID_QUERY', 400, message)
    this.name = 'InvalidQueryError'
  }
}

export class DistrictNotFoundError extends AppError {
  constructor(districtId: string) {
    super(
      'DISTRICT_NOT_FOUND',
      404,
      `Could not find district "${districtId}".`
    )
    this.name = 'DistrictNotFoundError'
  }
}

export class AIUnavailableError extends AppError {
  constructor() {
    super(
      'AI_UNAVAILABLE',
      503,
      'AI district briefs are unavailable because no API key is configured.'
    )
    this.name = 'AIUnavailableError'
  }
}

export class AIProviderError extends AppError {
  constructor(message = 'The AI provider returned an invalid response.') {
    super('AI_PROVIDER_ERROR', 502, message)
    this.name = 'AIProviderError'
  }
}
