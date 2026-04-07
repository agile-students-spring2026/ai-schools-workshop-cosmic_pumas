import * as briefService from '@/lib/server/brief-service'
import { POST } from '@/app/api/brief/route'
import { listDistricts } from '@/lib/server/repository'

const allDistricts = listDistricts({ sort: 'name' })
const primaryDistrict = allDistricts[0]!
const comparisonDistrict = allDistricts[1]!

describe('POST /api/brief', () => {
  it('returns a validated district brief', async () => {
    vi.spyOn(briefService, 'generateDistrictBrief').mockResolvedValueOnce({
      summary: `${primaryDistrict.name} shows strong funding and moderate class-size pressure.`,
      strengths: ['Funding exceeds peers.'],
      cautions: ['Student-teacher ratio remains close to the state median.'],
      comparisonNotes: ['Revenue per pupil exceeds the selected district.'],
      sourceYear: primaryDistrict.sourceYear
    })

    const response = await POST(
      new Request('http://localhost:3000/api/brief', {
        method: 'POST',
        body: JSON.stringify({
          districtId: primaryDistrict.id,
          comparisonDistrictIds: [comparisonDistrict.id]
        })
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      summary: `${primaryDistrict.name} shows strong funding and moderate class-size pressure.`,
      strengths: ['Funding exceeds peers.'],
      cautions: ['Student-teacher ratio remains close to the state median.'],
      comparisonNotes: ['Revenue per pupil exceeds the selected district.'],
      sourceYear: primaryDistrict.sourceYear
    })
  })

  it('returns 400 for invalid request bodies', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/brief', {
        method: 'POST',
        body: JSON.stringify({
          districtId: primaryDistrict.id,
          comparisonDistrictIds: ['a', 'b', 'c']
        })
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Request payload validation failed.'
      }
    })
  })

  it('returns typed route errors from the brief service', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    vi.spyOn(briefService, 'generateDistrictBrief').mockRejectedValueOnce(
      new Error('boom')
    )

    const response = await POST(
      new Request('http://localhost:3000/api/brief', {
        method: 'POST',
        body: JSON.stringify({
          districtId: primaryDistrict.id,
          comparisonDistrictIds: []
        })
      })
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.'
      }
    })

    consoleError.mockRestore()
  })
})
