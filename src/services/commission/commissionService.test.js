import { beforeEach, describe, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import {
  getMyAppraiserCommission,
  getMyAppraiserCommissions,
} from '@/services/commission/commissionService'

vi.mock('@/services/api/client', () => ({ apiClient: { get: vi.fn() } }))

describe('commission API service', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns the raw commission list without applying ApiResponse unwrap', async () => {
    const commissions = [{ id: 'commission-1', status: 'EARNED', appraiserEarnings: 700 }]
    apiClient.get.mockResolvedValue({ data: commissions })
    await expect(getMyAppraiserCommissions()).resolves.toEqual(commissions)
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/appraiser/commissions/my', {
      signal: undefined,
    })
  })

  test('reads a single commission using its owner scoped endpoint', async () => {
    const commission = { id: 'commission-1', assignmentId: 'assignment-1', status: 'PAID' }
    apiClient.get.mockResolvedValue({ data: commission })
    await expect(getMyAppraiserCommission({ commissionId: commission.id })).resolves.toEqual(
      commission,
    )
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/appraiser/commissions/commission-1', {
      signal: undefined,
    })
  })
})
