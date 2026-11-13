import { skipToken, useQuery } from '@tanstack/react-query'

import { getCategoryById, getCategoryTree } from '@/services/categories/categoryService'

export const categoryKeys = {
  tree: () => ['categories', 'tree'],
  detail: (categoryId) => ['categories', 'detail', categoryId],
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: ({ signal }) => getCategoryTree({ signal }),
    staleTime: 10 * 60 * 1000,
  })
}

/** @param {string | undefined} categoryId */
export function useCategoryDetail(categoryId) {
  return useQuery({
    queryKey: categoryKeys.detail(categoryId),
    queryFn: categoryId ? ({ signal }) => getCategoryById({ categoryId, signal }) : skipToken,
  })
}
