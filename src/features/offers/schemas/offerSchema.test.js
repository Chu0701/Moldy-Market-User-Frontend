import { describe, expect, it } from 'vitest'

import {
  createCounterOfferSchema,
  createInitialOfferSchema,
} from '@/features/offers/schemas/offerSchema'

const t = (key) => key

describe('offerSchema', () => {
  it('accepts initial offer between 75% and below 100% of original price', () => {
    const schema = createInitialOfferSchema(t, 1_000_000)

    expect(schema.safeParse({ price: '750000' }).success).toBe(true)
    expect(schema.safeParse({ price: '999999' }).success).toBe(true)
    expect(schema.safeParse({ price: '749999' }).success).toBe(false)
    expect(schema.safeParse({ price: '1000000' }).success).toBe(false)
  })

  it('requires positive number for counter-offer', () => {
    const schema = createCounterOfferSchema(t)

    expect(schema.safeParse({ price: '850000' }).success).toBe(true)
    expect(schema.safeParse({ price: '0' }).success).toBe(false)
    expect(schema.safeParse({ price: '' }).success).toBe(false)
  })
})
