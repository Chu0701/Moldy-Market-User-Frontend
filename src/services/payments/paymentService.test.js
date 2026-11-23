import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/services/api/client'
import { getMyPayments, getPaymentById } from '@/services/payments/paymentService'

vi.mock('@/services/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches caller payments and single payment by id', async () => {
    const signal = new AbortController().signal
    apiClient.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          code: 'SUCCESS',
          data: [{ id: 'pay-1', amount: 250000, paymentStatus: 'SUCCESSFUL' }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          code: 'SUCCESS',
          data: { id: 'pay/1', amount: 250000, paymentStatus: 'PENDING' },
        },
      })

    const list = await getMyPayments({ signal })
    const detail = await getPaymentById({ paymentId: 'pay/1', signal })

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/api/v1/payments/my-payments', { signal })
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/api/v1/payments/pay%2F1', { signal })
    expect(list).toHaveLength(1)
    expect(detail.paymentStatus).toBe('PENDING')
  })
})
