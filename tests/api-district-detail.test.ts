import { GET } from '@/app/api/districts/[id]/route'
import { getFixtureDistricts } from '@/lib/server/data'
import { calculateMedianValues } from '@/lib/server/comparison'

describe('GET /api/districts/[id]', () => {
  it('returns district detail and comparison data', async () => {
    const districts = getFixtureDistricts()
    const district = districts[0]!
    const response = await GET(new Request('http://localhost:3000'), {
      params: Promise.resolve({ id: district.id })
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      district: {
        id: district.id,
        name: district.name
      },
      comparison: {
        nationalMedian: {
          enrollment: calculateMedianValues(districts).enrollment
        }
      }
    })
  })

  it('returns 404 for unknown districts', async () => {
    const response = await GET(new Request('http://localhost:3000'), {
      params: Promise.resolve({ id: 'missing' })
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'DISTRICT_NOT_FOUND',
        message: 'Could not find district "missing".'
      }
    })
  })
})
