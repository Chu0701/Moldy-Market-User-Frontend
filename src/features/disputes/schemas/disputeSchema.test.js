import { describe, expect, it } from 'vitest'
import {
  createDisputeSchema,
  parseDisputeImageUrls,
} from '@/features/disputes/schemas/disputeSchema'

describe('createDisputeSchema', () => {
  it('accepts valid dispute payload with up to 5 https image URLs', () => {
    const result = createDisputeSchema.safeParse({
      reason: 'DAMAGED',
      description: 'Item arrived broken',
      imageUrlsText: 'https://example.com/a.jpg\nhttps://example.com/b.jpg',
    })
    expect(result.success).toBe(true)
    expect(parseDisputeImageUrls(result.data.imageUrlsText)).toHaveLength(2)
  })

  it('rejects empty description, >5 images, and non-https URLs', () => {
    expect(
      createDisputeSchema.safeParse({
        reason: 'DAMAGED',
        description: '   ',
        imageUrlsText: '',
      }).success,
    ).toBe(false)

    expect(
      createDisputeSchema.safeParse({
        reason: 'DAMAGED',
        description: 'Broken',
        imageUrlsText: 'http://insecure.example.com/a.jpg',
      }).success,
    ).toBe(false)

    expect(
      createDisputeSchema.safeParse({
        reason: 'DAMAGED',
        description: 'Broken',
        imageUrlsText: Array.from({ length: 6 }, (_, i) => `https://example.com/${i}.jpg`).join(
          '\n',
        ),
      }).success,
    ).toBe(false)
  })
})
