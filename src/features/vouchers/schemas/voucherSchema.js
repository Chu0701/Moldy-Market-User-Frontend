import { z } from 'zod'

export const DISCOUNT_TYPES = ['PERCENT', 'FIXED']

const optionalNumberField = z.preprocess(
  (value) => (value === '' || value == null ? null : Number(value)),
  z.number().nullable(),
)

export const storeVoucherSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, 'vouchers.validation.codeRequired')
      .max(50, 'vouchers.validation.codeTooLong'),
    discountType: z.enum(DISCOUNT_TYPES),
    discountValue: z.coerce
      .number({ message: 'vouchers.validation.discountValueInvalid' })
      .gt(0, 'vouchers.validation.discountValuePositive'),
    remainingQuantity: z.coerce
      .number({ message: 'vouchers.validation.quantityInvalid' })
      .int('vouchers.validation.quantityInvalid')
      .min(1, 'vouchers.validation.quantityPositive'),
    expiredAt: z
      .string()
      .trim()
      .min(1, 'vouchers.validation.expiredAtRequired')
      .refine((value) => !Number.isNaN(Date.parse(value)), 'vouchers.validation.expiredAtInvalid'),
    minimumOrderValue: optionalNumberField.refine(
      (value) => value === null || (!Number.isNaN(value) && value >= 0),
      'vouchers.validation.minOrderNonNegative',
    ),
    maximumDiscount: optionalNumberField.refine(
      (value) => value === null || (!Number.isNaN(value) && value > 0),
      'vouchers.validation.maxDiscountPositive',
    ),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === 'PERCENT' && data.discountValue > 100) {
      ctx.addIssue({
        code: 'custom',
        path: ['discountValue'],
        message: 'vouchers.validation.percentMax100',
      })
    }
  })

/** Converts form values into the Backend DTO shape. */
export function toVoucherPayload(values) {
  return {
    code: values.code.trim().toUpperCase(),
    discountType: values.discountType,
    discountValue: values.discountValue,
    remainingQuantity: values.remainingQuantity,
    expiredAt: new Date(values.expiredAt).toISOString(),
    minimumOrderValue: values.minimumOrderValue,
    maximumDiscount: values.maximumDiscount,
  }
}
