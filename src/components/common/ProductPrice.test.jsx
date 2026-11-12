import { afterEach, describe, expect, test } from 'vitest'
import { act, render, screen } from '@testing-library/react'

import { ProductPrice } from '@/components/common/ProductPrice'
import i18n from '@/i18n'

afterEach(async () => {
  await i18n.changeLanguage('vi')
})

describe('ProductPrice', () => {
  test('changes locale formatting while keeping the price in VND', async () => {
    render(<ProductPrice value={250000} />)
    expect(screen.getByText(/250\.000/)).toHaveTextContent(/250\.000\s*₫/)

    await act(async () => {
      await i18n.changeLanguage('en')
    })

    expect(screen.getByText(/250,000/)).toHaveTextContent('₫250,000')
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
  })

  test('preserves the fractional prices allowed by the product contract', () => {
    render(<ProductPrice value={250000.75} />)
    expect(screen.getByText(/250\.000,75/)).toHaveTextContent(/250\.000,75\s*₫/)
  })
})
