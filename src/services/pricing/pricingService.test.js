import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/services/api/client'
import { calculateAutoPrice } from '@/services/pricing/pricingService'

vi.mock('@/services/api/client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

describe('pricingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts to /api/pricing/auto without /v1 prefix and unwraps response', async () => {
    const payload = {
      categoryId: '11111111-1111-1111-1111-111111111111',
      modelId: '22222222-2222-2222-2222-222222222222',
      origin: 'OFFICIAL_VN',
      warrantyStatus: 'UNDER_WARRANTY',
      conditionLevel: 'NEW',
      usageMonths: 6,
    }
    apiClient.post.mockResolvedValue({
      data: {
        success: true,
        code: 'SUCCESS',
        data: { status: 'SUGGESTED', suggestedPrice: 12500000, referencePrice: 15000000 },
      },
    })

    const result = await calculateAutoPrice(payload)

    expect(apiClient.post).toHaveBeenCalledWith('/api/pricing/auto', payload)
    expect(result.suggestedPrice).toBe(12500000)
  })
})
