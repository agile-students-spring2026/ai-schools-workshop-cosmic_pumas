import { generateDistrictBrief } from '@/lib/server/brief-service'
import { listDistricts } from '@/lib/server/repository'

const allDistricts = listDistricts({ sort: 'name' })
const primaryDistrict = allDistricts[0]!
const comparisonDistrict = allDistricts[1]!

describe('district brief service', () => {
  const originalFetch = global.fetch
  const originalApiKey = process.env.OPENAI_API_KEY

  afterEach(() => {
    global.fetch = originalFetch
    process.env.OPENAI_API_KEY = originalApiKey
  })

  it('hydrates sourceYear from district data after parsing provider output', async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: `${primaryDistrict.name} is strong in revenue per pupil.`,
                strengths: ['Funding is above the Massachusetts median.'],
                cautions: ['Student-teacher ratio is close to the state median.'],
                comparisonNotes: ['Selected peer has lower revenue per pupil.']
              })
            }
          }
        ]
      })
    }) as typeof global.fetch

    const result = await generateDistrictBrief({
      districtId: primaryDistrict.id,
      comparisonDistrictIds: [comparisonDistrict.id]
    })

    expect(result.sourceYear).toBe(primaryDistrict.sourceYear)
    expect(result.comparisonNotes).toHaveLength(1)
  })

  it('rejects non-object provider payloads', async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(['not-an-object'])
            }
          }
        ]
      })
    }) as typeof global.fetch

    await expect(
      generateDistrictBrief({
        districtId: primaryDistrict.id,
        comparisonDistrictIds: []
      })
    ).rejects.toThrow('The AI provider returned an invalid response.')
  })
})
