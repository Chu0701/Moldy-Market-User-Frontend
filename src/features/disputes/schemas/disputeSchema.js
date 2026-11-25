import { z } from 'zod'

export const DISPUTE_REASONS = [
  'ITEM_NOT_RECEIVED',
  'NOT_AS_DESCRIBED',
  'DAMAGED',
  'WRONG_ITEM',
  'OTHER',
]

export const DISPUTE_STATUSES = ['OPEN', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED']

export function parseDisputeImageUrls(rawText) {
  if (!rawText || !rawText.trim()) return []
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

const publicMediaPathPattern = /^\/api\/v1\/files\/public\/[0-9a-fA-F-]+(?:\/[^/\s]+)?$/

function isValidHttpsUrl(value) {
  if (value.length > 1000) return false
  if (publicMediaPathPattern.test(value)) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export const createDisputeSchema = z.object({
  reason: z.enum(DISPUTE_REASONS, {
    message: 'disputes.validation.reasonRequired',
  }),
  description: z
    .string()
    .trim()
    .min(1, 'disputes.validation.descriptionRequired')
    .max(2000, 'disputes.validation.descriptionTooLong'),
  imageUrlsText: z
    .string()
    .optional()
    .default('')
    .superRefine((value, ctx) => {
      const urls = parseDisputeImageUrls(value)
      if (urls.length > 5) {
        ctx.addIssue({
          code: 'custom',
          message: 'disputes.validation.tooManyImages',
        })
        return
      }
      if (urls.some((url) => !isValidHttpsUrl(url))) {
        ctx.addIssue({
          code: 'custom',
          message: 'disputes.validation.invalidImageUrl',
        })
      }
    }),
})
