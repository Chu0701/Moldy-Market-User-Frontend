import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/services/api/client'
import {
  checkVoucher,
  createStoreVoucher,
  deactivateStoreVoucher,
  getMyStoreVouchers,
  updateStoreVoucher,
} from '@/services/vouchers/voucherService'

vi.mock('@/services/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('voucherService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses /api/vouchers and /api/shop/vouchers paths without /v1', async () => {
    const signal = new AbortController().signal
    apiClient.get
      .mockResolvedValueOnce({
        data: { success: true, code: 'SUCCESS', data: { code: 'SAVE10', valid: true } },
      })
      .mockResolvedValueOnce({
        data: { success: true, code: 'SUCCESS', data: [{ code: 'SHOP10' }] },
      })
    apiClient.post.mockResolvedValue({
      data: { success: true, code: 'SUCCESS', data: { code: 'SHOP10' } },
    })
    apiClient.put.mockResolvedValue({
      data: { success: true, code: 'SUCCESS', data: { code: 'SHOP10' } },
    })
    apiClient.delete.mockResolvedValue({ status: 204, data: '' })

    const checked = await checkVoucher({ code: 'SAVE10', signal })
    const list = await getMyStoreVouchers({ signal })
    await createStoreVoucher({ code: 'SHOP10', discountType: 'PERCENT', discountValue: 10 })
    await updateStoreVoucher({ code: 'SHOP10', discountType: 'FIXED', discountValue: 20000 })
    await deactivateStoreVoucher({ code: 'SHOP10' })

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/api/vouchers/SAVE10', { signal })
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/api/shop/vouchers', { signal })
    expect(apiClient.post).toHaveBeenCalledWith('/api/shop/vouchers', {
      code: 'SHOP10',
      discountType: 'PERCENT',
      discountValue: 10,
    })
    expect(apiClient.put).toHaveBeenCalledWith('/api/shop/vouchers/SHOP10', {
      discountType: 'FIXED',
      discountValue: 20000,
    })
    expect(apiClient.delete).toHaveBeenCalledWith('/api/shop/vouchers/SHOP10')
    expect(checked.valid).toBe(true)
    expect(list).toHaveLength(1)
  })
})
