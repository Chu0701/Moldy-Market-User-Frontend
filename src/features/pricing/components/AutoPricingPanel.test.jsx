import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'

import { AutoPricingPanel } from '@/features/pricing/components/AutoPricingPanel'
import { calculateAutoPrice } from '@/services/pricing/pricingService'

vi.mock('@/services/pricing/pricingService', () => ({
  calculateAutoPrice: vi.fn(),
}))

function renderPanel(props = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AutoPricingPanel
        categoryId="11111111-1111-1111-1111-111111111111"
        onApplyPrice={vi.fn()}
        {...props}
      />
    </QueryClientProvider>,
  )
}

describe('AutoPricingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calculates and applies suggested price when valid modelId is provided', async () => {
    const onApplyPrice = vi.fn()
    calculateAutoPrice.mockResolvedValue({
      status: 'SUGGESTED',
      suggestedPrice: 9500000,
      referencePrice: 12000000,
      referenceModelName: 'iPhone 14',
    })

    const user = userEvent.setup()
    renderPanel({ onApplyPrice })

    await user.click(screen.getByRole('button', { name: /mở gợi ý|open/i }))
    await user.type(
      screen.getByLabelText(/mã model|model id/i),
      '22222222-2222-2222-2222-222222222222',
    )
    await user.click(screen.getByRole('button', { name: /tính giá|calculate/i }))

    expect(await screen.findByText(/iPhone 14/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /áp dụng|apply/i }))
    expect(onApplyPrice).toHaveBeenCalledWith(9500000)
  })
})
