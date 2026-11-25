import { describe, expect, test } from 'vitest'

import { canSubmitAppraisalReport } from './reportEligibility'

describe('canSubmitAppraisalReport', () => {
  test('allows revisions until the maximum number of rejections is reached', () => {
    const history = Array.from({ length: 2 }, () => ({ status: 'REJECTED' }))

    expect(canSubmitAppraisalReport('IN_PROGRESS', history)).toBe(true)
    expect(canSubmitAppraisalReport('IN_PROGRESS', [...history, { status: 'REJECTED' }])).toBe(
      false,
    )
  })

  test('blocks reports outside IN_PROGRESS or while one is already submitted', () => {
    expect(canSubmitAppraisalReport('ASSIGNED', [])).toBe(false)
    expect(canSubmitAppraisalReport('IN_PROGRESS', [{ status: 'SUBMITTED' }])).toBe(false)
  })
})
