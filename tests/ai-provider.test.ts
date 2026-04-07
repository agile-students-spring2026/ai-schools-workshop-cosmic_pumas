import { requestOpenAIJson } from '@/lib/server/ai-provider'

describe('OpenAI provider adapter', () => {
  const originalFetch = global.fetch
  const originalApiKey = process.env.OPENAI_API_KEY
  const originalModel = process.env.OPENAI_MODEL

  afterEach(() => {
    global.fetch = originalFetch
    process.env.OPENAI_API_KEY = originalApiKey
    process.env.OPENAI_MODEL = originalModel
  })

  it('rejects requests when the API key is missing', async () => {
    delete process.env.OPENAI_API_KEY

    await expect(
      requestOpenAIJson({
        systemPrompt: 'system',
        userPrompt: 'user'
      })
    ).rejects.toThrow('AI district briefs are unavailable')
  })

  it('rejects non-200 responses from the provider', async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    global.fetch = vi.fn().mockResolvedValue({
      ok: false
    }) as typeof global.fetch

    await expect(
      requestOpenAIJson({
        systemPrompt: 'system',
        userPrompt: 'user'
      })
    ).rejects.toThrow('The AI provider request failed.')
  })

  it('returns parsed JSON content from the provider response', async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    process.env.OPENAI_MODEL = 'gpt-test'
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({ summary: 'Structured output' })
            }
          }
        ]
      })
    }) as typeof global.fetch

    await expect(
      requestOpenAIJson({
        systemPrompt: 'system',
        userPrompt: 'user'
      })
    ).resolves.toEqual({ summary: 'Structured output' })
  })

  it('rejects provider responses without a content payload', async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] })
    }) as typeof global.fetch

    await expect(
      requestOpenAIJson({
        systemPrompt: 'system',
        userPrompt: 'user'
      })
    ).rejects.toThrow('The AI provider returned an invalid response.')
  })
})
