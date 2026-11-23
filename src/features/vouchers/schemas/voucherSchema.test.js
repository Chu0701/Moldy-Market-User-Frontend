import { describe, expect, it } from 'vitest'
import { storeVoucherSchema } from '@/features/vouchers/schemas/voucherSchema'

describe('storeVoucherSchema', () => {
  it('validates percent and fixed vouchers', () => {
    expect(
      storeVoucherSchema.safeParse({
        code: 'SHOP15',
        discountType: 'PERCENT',
        discountValue: 15,
        remainingQuantity: 50,
        expiredAt: '2026-12-31T23:59',
        minimumOrderValue: 100000,
        maximumDiscount: 50000,
      }).success,
    ).toBe(true)

    expect(
      storeVoucherSchema.safeParse({
        code: 'OVER100',
        discountType: 'PERCENT',
        discountValue: 120,
        remainingQuantity: 10,
        expiredAt: '2026-12-31T23:59',
        minimumOrderValue: '',
        maximumDiscount: '',
      }).success,
    ).toBe(false)
  })
})
