import { useQuery } from '@tanstack/react-query'

import { getCategoryTree } from '@/services/categories/categoryService'

export const categoryKeys = {
  tree: () => ['categories', 'tree'],
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: ({ signal }) => getCategoryTree({ signal }),
    staleTime: 10 * 60 * 1000,
  })
}
