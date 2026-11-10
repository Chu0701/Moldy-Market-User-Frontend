import { describe, expect, test } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import '@/i18n'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'

describe('ImageWithFallback', () => {
  test('displays the provided image with lazy loading', () => {
    render(<ImageWithFallback src="https://example.com/product.jpg" alt="Test product" />)

    expect(screen.getByRole('img', { name: 'Test product' })).toHaveAttribute(
      'src',
      'https://example.com/product.jpg',
    )
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy')
    expect(screen.queryByText('Chưa có ảnh sản phẩm')).not.toBeInTheDocument()
  })

  test('shows the placeholder when no image URL is supplied', () => {
    render(<ImageWithFallback alt="Test product" />)
    expect(screen.getByText('Chưa có ảnh sản phẩm')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Test product' })).not.toHaveAttribute('src')
  })

  test('replaces a failed image without requesting the same broken URL again', () => {
    const { rerender } = render(
      <ImageWithFallback src="https://example.com/broken.jpg" alt="Test product" />,
    )
    fireEvent.error(screen.getByRole('img'))

    expect(screen.getByText('Chưa có ảnh sản phẩm')).toBeInTheDocument()
    rerender(<ImageWithFallback src="https://example.com/broken.jpg" alt="Test product" />)
    expect(screen.getByRole('img')).not.toHaveAttribute('src')
  })

  test('tries a different URL after an earlier image failed', () => {
    const { rerender } = render(
      <ImageWithFallback src="https://example.com/broken.jpg" alt="Test product" />,
    )
    fireEvent.error(screen.getByRole('img'))

    rerender(<ImageWithFallback src="https://example.com/replacement.jpg" alt="Test product" />)

    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/replacement.jpg')
    expect(screen.queryByText('Chưa có ảnh sản phẩm')).not.toBeInTheDocument()
  })
})
