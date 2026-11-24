import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import '@/i18n'
import { CopyProductLinkButton } from '@/features/products/components/CopyProductLinkButton'

describe('CopyProductLinkButton', () => {
  test('copies current product URL and shows copied confirmation', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    render(<CopyProductLinkButton />)

    const button = screen.getByRole('button', { name: 'Chia sẻ' })
    await user.click(button)

    expect(writeText).toHaveBeenCalledWith(window.location.href)
    expect(screen.getByRole('button', { name: 'Đã sao chép!' })).toBeInTheDocument()
  })
})
