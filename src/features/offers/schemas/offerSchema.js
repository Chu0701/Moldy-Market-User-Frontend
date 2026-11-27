import { z } from 'zod'

export const OFFER_MIN_PRICE_RATIO = 0.75
export const OFFER_MAX_ROUNDS = 3

/**
 * Parses dot/comma/space-formatted VND input into a finite number (or NaN).
 * @param {string | number} raw
 */
export function parseVndInput(raw) {
  const digits = String(raw ?? '').replace(/[.,\s₫đ]/g, '')
  if (!digits) return Number.NaN
  return Number(digits)
}

/**
 * Formats raw numeric text with Vietnamese thousands dots (e.g. "32000000" -> "32.000.000").
 * @param {string | number} raw
 */
export function formatVndInput(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Computes discount percentage relative to originalPrice (e.g. 40M -> 36M returns 10).
 * @param {number} originalPrice
 * @param {number} offerPrice
 */
export function getDiscountPercent(originalPrice, offerPrice) {
  const base = Number(originalPrice)
  const target = Number(offerPrice)
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(target) || target >= base) return 0
  return Math.round(((base - target) / base) * 100)
}

/**
 * Validates initial buyer offer price against Backend's [75%, 100%) range and optional note.
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
      .refine((value) => {
        const parsed = parseVndInput(value)
        return Number.isFinite(parsed) && parsed > 0
      }, t('offers.validation.pricePositive'))
      .refine((value) => parseVndInput(value) >= minPrice, t('offers.validation.priceBelowMin'))
      .refine(
        (value) => parseVndInput(value) < Number(originalPrice),
        t('offers.validation.priceMustBeBelowOriginal'),
      ),
    note: z.string().trim().max(300, t('offers.validation.noteTooLong')).optional(),
  })
}

/**
 * Validates counter-offer price and optional note.
 * @param {import('i18next').TFunction} t
 * @param {{ minExclusive?: number, maxExclusive?: number }} [bounds]
 */
export function createCounterOfferSchema(t, bounds = {}) {
  let priceSchema = z
    .string()
    .trim()
    .min(1, t('offers.validation.priceRequired'))
    .refine((value) => {
      const parsed = parseVndInput(value)
      return Number.isFinite(parsed) && parsed > 0
    }, t('offers.validation.pricePositive'))

  if (Number.isFinite(bounds.minExclusive)) {
    priceSchema = priceSchema.refine(
      (value) => parseVndInput(value) > bounds.minExclusive,
      t('offers.validation.counterOutOfRange'),
    )
  }
  if (Number.isFinite(bounds.maxExclusive)) {
    priceSchema = priceSchema.refine(
      (value) => parseVndInput(value) < bounds.maxExclusive,
      t('offers.validation.counterOutOfRange'),
    )
  }

  return z.object({
    price: priceSchema,
    note: z.string().trim().max(300, t('offers.validation.noteTooLong')).optional(),
  })
}
