import { z } from 'zod'

export const districtSortSchema = z.enum([
  'name',
  'enrollment-desc',
  'student-teacher-ratio-asc',
  'revenue-desc'
])

export const metricBandSchema = z.enum([
  'below-average',
  'average',
  'above-average'
])

export const metricValueSchema = z.object({
  enrollment: z.number().nonnegative(),
  studentTeacherRatio: z.number().nonnegative(),
  revenuePerPupil: z.number().nonnegative(),
  expenditurePerPupil: z.number().nonnegative()
})

export const districtRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  state: z.string().length(2),
  locale: z.string().min(1),
  enrollment: z.number().int().nonnegative(),
  teachers: z.number().nonnegative(),
  studentTeacherRatio: z.number().nonnegative(),
  revenuePerPupil: z.number().nonnegative(),
  expenditurePerPupil: z.number().nonnegative(),
  sourceYear: z.string().min(1)
})

export const districtSummarySchema = districtRecordSchema.pick({
  id: true,
  name: true,
  state: true,
  locale: true,
  enrollment: true,
  studentTeacherRatio: true,
  sourceYear: true
})

export const districtComparisonSchema = z.object({
  nationalMedian: metricValueSchema,
  stateMedian: metricValueSchema,
  metricBands: z.object({
    enrollment: metricBandSchema,
    studentTeacherRatio: metricBandSchema,
    revenuePerPupil: metricBandSchema,
    expenditurePerPupil: metricBandSchema
  })
})

export const districtListQuerySchema = z.object({
  query: z.string().trim().max(100).optional(),
  state: z
    .string()
    .trim()
    .length(2)
    .transform(value => value.toUpperCase())
    .optional(),
  locale: z.string().trim().max(32).optional(),
  sort: districtSortSchema.optional()
})

export const districtListResponseSchema = z.object({
  districts: z.array(districtSummarySchema),
  totalCount: z.number().int().nonnegative()
})

export const districtDetailResponseSchema = z.object({
  district: districtRecordSchema,
  comparison: districtComparisonSchema
})

export const districtBriefRequestSchema = z
  .object({
    districtId: z.string().min(1),
    comparisonDistrictIds: z.array(z.string().min(1)).max(2).default([])
  })
  .strict()

export const districtBriefResponseSchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(z.string().min(1)).min(1),
  cautions: z.array(z.string().min(1)).min(1),
  comparisonNotes: z.array(z.string().min(1)),
  sourceYear: z.string().min(1)
})

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1)
  })
})

export type DistrictSort = z.infer<typeof districtSortSchema>
export type MetricBand = z.infer<typeof metricBandSchema>
export type MetricValues = z.infer<typeof metricValueSchema>
export type DistrictRecord = z.infer<typeof districtRecordSchema>
export type DistrictSummary = z.infer<typeof districtSummarySchema>
export type DistrictComparison = z.infer<typeof districtComparisonSchema>
export type DistrictListQuery = z.infer<typeof districtListQuerySchema>
export type DistrictBriefRequest = z.infer<typeof districtBriefRequestSchema>
export type DistrictBriefResponse = z.infer<typeof districtBriefResponseSchema>
