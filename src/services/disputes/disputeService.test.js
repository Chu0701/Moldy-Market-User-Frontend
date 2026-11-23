import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/services/api/client'
import {
  cancelDispute,
  createDispute,
  getMyDisputeByOrder,
  getMyDisputes,
} from '@/services/disputes/disputeService'

vi.mock('@/services/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('disputeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches buyer disputes list and detail by orderId', async () => {
    const signal = new AbortController().signal
    apiClient.get
      .mockResolvedValueOnce({
        data: { success: true, code: 'SUCCESS', data: [{ id: 'd-1', orderId: 'o-1' }] },
      })
      .mockResolvedValueOnce({
        data: { success: true, code: 'SUCCESS', data: { id: 'd-1', orderId: 'o/1' } },
      })

    const list = await getMyDisputes({ signal })
    const detail = await getMyDisputeByOrder({ orderId: 'o/1', signal })

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/api/v1/disputes/me', { signal })
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/api/v1/disputes/o%2F1', { signal })
    expect(list).toHaveLength(1)
    expect(detail.id).toBe('d-1')
  })

  it('creates and cancels buyer disputes', async () => {
    apiClient.post
      .mockResolvedValueOnce({
        data: { success: true, code: 'SUCCESS', data: { id: 'd-1', status: 'OPEN' } },
      })
      .mockResolvedValueOnce({
        data: { success: true, code: 'SUCCESS', data: { id: 'd-1', status: 'CANCELLED' } },
      })

    const created = await createDispute({
      orderId: 'o-1',
      reason: 'DAMAGED',
      description: 'Cracked screen',
      imageUrls: ['https://example.com/1.jpg'],
    })
    const cancelled = await cancelDispute({ orderId: 'o/1' })

    expect(apiClient.post).toHaveBeenNthCalledWith(1, '/api/v1/disputes', {
      orderId: 'o-1',
      reason: 'DAMAGED',
      description: 'Cracked screen',
      imageUrls: ['https://example.com/1.jpg'],
    })
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/api/v1/disputes/o%2F1/cancel')
    expect(created.status).toBe('OPEN')
    expect(cancelled.status).toBe('CANCELLED')
  })
})
