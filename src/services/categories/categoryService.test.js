import { afterEach, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import { getCategoryById } from './categoryService'

afterEach(() => {
  vi.restoreAllMocks()
})

test('loads the public category from the detail endpoint', async () => {
  const category = { id: 'a8098c1a-f86e-11da-bd1a-00112444be1f', name: 'Áo khoác' }
  const { signal } = new AbortController()
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
    status: 200,
    data: { success: true, code: 'SUCCESS', data: category },
  })

  const result = await getCategoryById({ categoryId: category.id, signal })

  expect(get).toHaveBeenCalledExactlyOnceWith(`/api/v1/categories/${category.id}`, { signal })
  expect(result).toEqual(category)
})
