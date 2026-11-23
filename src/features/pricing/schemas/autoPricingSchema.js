import { z } from 'zod'

export const PRICING_CONDITION_LEVELS = ['NEW', 'SCRATCHED', 'PARTIAL_DAMAGE', 'HEAVILY_DAMAGED']

export const PRICING_WARRANTY_STATUSES = ['UNDER_WARRANTY', 'EXPIRED_UNDER_1Y', 'EXPIRED_OVER_1Y']

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const autoPricingSchema = z.object({
  categoryId: z.string().trim().regex(uuidPattern, 'pricing.validation.categoryRequired'),
  modelId: z.string().trim().regex(uuidPattern, 'pricing.validation.modelIdInvalid'),
  origin: z.literal('OFFICIAL_VN'),
  warrantyStatus: z.enum(PRICING_WARRANTY_STATUSES),
  conditionLevel: z.enum(PRICING_CONDITION_LEVELS),
  usageMonths: z.coerce
    .number({ message: 'pricing.validation.usageMonthsInvalid' })
    .int('pricing.validation.usageMonthsInvalid')
    .min(0, 'pricing.validation.usageMonthsMin'),
})
