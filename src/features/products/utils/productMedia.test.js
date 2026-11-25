import { expect, test } from 'vitest'

import { getProductMediaUrls } from './productMedia'

test('prefers backend media view URLs over legacy images', () => {
  expect(
    getProductMediaUrls({
      media: [{ id: 'media-id', viewUrl: 'https://signed.example/view?sig=1' }],
      images: ['https://legacy.example/image.jpg'],
    }),
  ).toEqual(['https://signed.example/view?sig=1'])
})

test('falls back to legacy image URLs when media is empty or unavailable', () => {
  expect(getProductMediaUrls({ media: [], images: ['https://legacy.example/image.jpg'] })).toEqual([
    'https://legacy.example/image.jpg',
  ])
  expect(getProductMediaUrls({ images: ['https://legacy.example/image.jpg'] })).toEqual([
    'https://legacy.example/image.jpg',
  ])
})
