import fixtureData from '@/data/districts.fixture.json'
import { districtRecordSchema, type DistrictRecord } from '@/lib/contracts/schemas'

const districtArraySchema = districtRecordSchema.array()

export function getFixtureDistricts(): DistrictRecord[] {
  return districtArraySchema.parse(fixtureData)
}
