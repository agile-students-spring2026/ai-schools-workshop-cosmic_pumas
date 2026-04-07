import { GET } from '@/app/api/districts/route'
import { getFixtureDistricts } from '@/lib/server/data'

describe('GET /api/districts', () => {
  it('returns filtered district summaries', async () => {
    const district = getFixtureDistricts()[0]!
    const response = await GET(
      new Request(
        `http://localhost:3000/api/districts?state=${district.state.toLowerCase()}&locale=${district.locale}&sort=name`
      )
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      districts: expect.arrayContaining([
        {
          id: district.id,
          name: district.name,
          state: district.state,
          locale: district.locale,
          enrollment: district.enrollment,
          studentTeacherRatio: district.studentTeacherRatio,
          sourceYear: district.sourceYear
        }
      ]),
      totalCount: expect.any(Number)
    })
  })

  it('returns 400 for invalid query params', async () => {
    const response = await GET(
      new Request('http://localhost:3000/api/districts?sort=bad-sort')
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'INVALID_QUERY',
        message: 'Query parameters are invalid.'
      }
    })
  })
})
