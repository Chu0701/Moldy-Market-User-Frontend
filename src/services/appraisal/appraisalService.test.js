import { beforeEach, describe, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import {
  acceptAppraisalReport,
  createAppraisalRequest,
  getMyAppraisalRequests,
  getRequestApplications,
  rejectAppraisalReport,
  selectAppraiserForRequest,
} from '@/services/appraisal/appraisalService'

vi.mock('@/services/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

const envelope = (data) => ({ data: { success: true, code: 'SUCCESS', message: 'OK', data } })

describe('appraisal API service', () => {
  beforeEach(() => vi.clearAllMocks())

  test('creates a seller request with the documented DTO', async () => {
    const payload = {
      listingId: 'listing-id',
      description: 'Please assess this item.',
      expectedPrice: 1200,
      deadline: '2027-01-01T00:00:00Z',
    }
    apiClient.post.mockResolvedValue(envelope({ id: 'request-id', status: 'OPEN' }))
    await expect(createAppraisalRequest(payload)).resolves.toEqual({
      id: 'request-id',
      status: 'OPEN',
    })
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/appraisal-requests', payload)
  })

  test('maps Spring request pages from zero-based response numbering', async () => {
    apiClient.get.mockResolvedValue(
      envelope({ content: [], number: 0, size: 20, totalElements: 0, totalPages: 0, last: true }),
    )
    await expect(getMyAppraisalRequests({ page: 1 })).resolves.toMatchObject({
      items: [],
      page: 1,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      hasNext: false,
    })
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/appraisal-requests/my-requests', {
      params: { page: 1, size: 20 },
      signal: undefined,
    })
  })

  test('passes request ID and paging to the seller applications endpoint', async () => {
    apiClient.get.mockResolvedValue(
      envelope({ content: [], number: 1, size: 20, totalElements: 20, totalPages: 2, last: true }),
    )
    const result = await getRequestApplications({ requestId: 'request-id', page: 2 })
    expect(result.page).toBe(2)
    expect(result.hasNext).toBe(false)
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/v1/appraisal-requests/request-id/applications',
      { params: { page: 2, size: 20 }, signal: undefined },
    )
  })

  test('uses the documented selection query and application body', async () => {
    apiClient.post.mockResolvedValue(envelope({ id: 'assignment-id' }))
    await selectAppraiserForRequest({ requestId: 'request-id', applicationId: 'application-id' })
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/appraisal-assignments/select-appraiser',
      { applicationId: 'application-id' },
      { params: { requestId: 'request-id' } },
    )
  })

  test('accepts reports without a body and sends a rejection reason in JSON', async () => {
    apiClient.patch.mockResolvedValue(envelope({ id: 'report-id' }))
    await acceptAppraisalReport({ reportId: 'report-id' })
    await rejectAppraisalReport({
      reportId: 'report-id',
      rejectionReason: 'Please add more market comparisons.',
    })
    expect(apiClient.patch).toHaveBeenNthCalledWith(1, '/api/v1/appraisal-reports/report-id/accept')
    expect(apiClient.patch).toHaveBeenNthCalledWith(
      2,
      '/api/v1/appraisal-reports/report-id/reject',
      { rejectionReason: 'Please add more market comparisons.' },
    )
  })
})
