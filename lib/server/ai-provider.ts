import { AIProviderError, AIUnavailableError } from '@/lib/server/errors'

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'

  if (!apiKey) {
    throw new AIUnavailableError()
  }

  return { apiKey, model }
}

export async function requestOpenAIJson(input: {
  systemPrompt: string
  userPrompt: string
}) {
  const { apiKey, model } = getOpenAIConfig()
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: input.userPrompt }
      ]
    })
  })

  if (!response.ok) {
    throw new AIProviderError('The AI provider request failed.')
  }

  const payload = (await response.json()) as ChatCompletionResponse
  const content = payload.choices?.[0]?.message?.content

  if (!content) {
    throw new AIProviderError()
  }

  return JSON.parse(content) as unknown
}
