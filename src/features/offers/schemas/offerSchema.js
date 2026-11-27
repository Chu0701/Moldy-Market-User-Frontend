import { z } from 'zod'
export const OFFER_MIN_PRICE_RATIO = 0.75
/**
 * Validates initial buyer offer price against Backend's [75%, 100%) range.
 * @param {import('i18next').TFunction} t
 * @param {number} originalPrice
 */
export function createInitialOfferSchema(t, originalPrice) {
  const minPrice = Math.ceil(Number(originalPrice) * OFFER_MIN_PRICE_RATIO)
  return z.object({
    price: z
      .string()
      .trim()
      .min(1, t('offers.validation.priceRequired'))
      .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
        message: t('offers.validation.pricePositive'),
      })
      .refine((value) => Number(value) >= minPrice, {
        message: t('offers.validation.priceBelowMin'),
      })
      .refine((value) => Number(value) < Number(originalPrice), {
        message: t('offers.validation.priceMustBeBelowOriginal'),
      }),
  })
}
/**
 * Validates counter-offer price (positive number; Backend enforces narrowing bounds).
 * @param {import('i18next').TFunction} t
 */
export function createCounterOfferSchema(t) {
  return z.object({
    price: z
      .string()
      .trim()
      .min(1, t('offers.validation.priceRequired'))
      .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
        message: t('offers.validation.pricePositive'),
      }),
  })
}
