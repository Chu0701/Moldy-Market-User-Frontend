import { describe, expect, it } from 'vitest'
import { autoPricingSchema } from '@/features/pricing/schemas/autoPricingSchema'

describe('autoPricingSchema', () => {
  it('accepts valid auto pricing input and rejects invalid UUID or negative usage months', () => {
    expect(
      autoPricingSchema.safeParse({
        categoryId: '11111111-1111-1111-1111-111111111111',
        modelId: '22222222-2222-2222-2222-222222222222',
        origin: 'OFFICIAL_VN',
        warrantyStatus: 'UNDER_WARRANTY',
        conditionLevel: 'SCRATCHED',
        usageMonths: 12,
      }).success,
    ).toBe(true)

    expect(
      autoPricingSchema.safeParse({
        categoryId: 'not-a-uuid',
        modelId: '22222222-2222-2222-2222-222222222222',
        origin: 'OFFICIAL_VN',
        warrantyStatus: 'UNDER_WARRANTY',
        conditionLevel: 'NEW',
        usageMonths: 0,
      }).success,
    ).toBe(false)

    expect(
      autoPricingSchema.safeParse({
        categoryId: '11111111-1111-1111-1111-111111111111',
        modelId: '22222222-2222-2222-2222-222222222222',
        origin: 'OFFICIAL_VN',
        warrantyStatus: 'UNDER_WARRANTY',
        conditionLevel: 'NEW',
        usageMonths: -1,
      }).success,
    ).toBe(false)
  })
})
