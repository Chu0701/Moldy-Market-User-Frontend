import { z } from 'zod'

export const appraiserProfileSchema = z.object({
  bio: z
    .string()
    .trim()
    .min(10, 'appraiser.validation.bioMin')
    .max(1000, 'appraiser.validation.bioMax'),
  categoryIds: z
    .array(z.string().uuid('appraiser.validation.categoryInvalid'))
    .min(1, 'appraiser.validation.categoryMin')
    .max(10, 'appraiser.validation.categoryMax'),
  avatarUrl: z.string().max(255, 'appraiser.validation.avatarMax').optional().or(z.literal('')),
})

export const applicationSchema = z.object({
  introduction: z
    .string()
    .trim()
    .min(20, 'appraiser.validation.introductionMin')
    .max(1000, 'appraiser.validation.introductionMax'),
  experienceDescription: z
    .string()
    .trim()
    .min(50, 'appraiser.validation.experienceMin')
    .max(5000, 'appraiser.validation.experienceMax'),
  proposedFee: z.coerce.number().min(0.01, 'appraiser.validation.proposedFee'),
  estimatedCompletionHours: z.coerce
    .number()
    .int('appraiser.validation.hoursInteger')
    .min(1, 'appraiser.validation.hoursMin')
    .max(480, 'appraiser.validation.hoursMax'),
})

export const appraisalReportSchema = z.object({
  description: z
    .string()
    .trim()
    .min(20, 'appraiser.validation.reportDescriptionMin')
    .max(5000, 'appraiser.validation.reportDescriptionMax'),
  conditionAssessment: z
    .string()
    .trim()
    .min(20, 'appraiser.validation.conditionMin')
    .max(5000, 'appraiser.validation.conditionMax'),
  assessedValue: z.coerce.number().min(0.01, 'appraiser.validation.assessedValue'),
  imageUrls: z.string().optional().default(''),
  documentUrls: z.string().optional().default(''),
})

/** @param {string} value */
export function parseEvidenceLines(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}
