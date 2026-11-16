import { useCategories } from '@/features/marketplace/hooks/useCategories'

export function useProductCategoryOptions() {
  const query = useCategories()

  const groups = (query.data ?? [])
    .map(({ id, name, children }) => ({
      id,
      name,
      options: children ?? [],
    }))
    .filter(({ options }) => options.length > 0)

  return { query, groups }
}
