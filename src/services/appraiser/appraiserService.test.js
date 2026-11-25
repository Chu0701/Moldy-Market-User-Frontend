import { beforeEach, describe, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import {
  getMyAppraiserProfile,
  registerAsAppraiser,
  updateMyAppraiserProfile,
} from '@/services/appraiser/appraiserService'

vi.mock('@/services/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

describe('appraiser API service', () => {
  beforeEach(() => vi.clearAllMocks())

  test('registers with the backend registration contract and unwraps the response', async () => {
    const payload = { bio: 'Experienced appraiser', categoryIds: ['cat-1'], avatarUrl: '' }
    apiClient.post.mockResolvedValue({
      data: { success: true, code: 'SUCCESS', message: 'OK', data: { status: 'PENDING' } },
    })

    await expect(registerAsAppraiser(payload)).resolves.toEqual({ status: 'PENDING' })
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/appraisers/register', payload)
  })

  test('loads the authenticated profile from the /me endpoint', async () => {
    const profile = { id: 'profile-1', status: 'ACTIVE', categories: [] }
    apiClient.get.mockResolvedValue({
      data: { success: true, code: 'SUCCESS', message: 'OK', data: profile },
    })

    await expect(getMyAppraiserProfile()).resolves.toEqual(profile)
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/appraisers/me', { signal: undefined })
  })

  test('updates the authenticated profile using the backend PUT contract', async () => {
    const payload = {
      bio: 'Updated bio',
      categoryIds: ['cat-2'],
      avatarUrl: 'https://example.test/a.png',
    }
    apiClient.put.mockResolvedValue({
      data: { success: true, code: 'SUCCESS', message: 'OK', data: { status: 'ACTIVE' } },
    })

    await updateMyAppraiserProfile(payload)
    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/appraisers/me', payload)
  })
})
