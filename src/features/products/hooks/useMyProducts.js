import { skipToken, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'

import { useSession } from '@/features/auth/hooks/useSession'
import { getMyProducts, getMyStoreProducts } from '@/services/products/productService'

export function useMyProducts({ store = false } = {}) {
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedPage = Number(searchParams.get('page'))
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1
  const loadProducts = store ? getMyStoreProducts : getMyProducts

  const query = useQuery({
    queryKey: ['products', store ? 'store-mine' : 'mine', userId, page],
    queryFn: userId ? ({ signal }) => loadProducts({ page, signal }) : skipToken,
  })

  function changePage(nexPage) {
    if (!Number.isSafeInteger(nexPage) || nexPage < 1 || query.isFetching) return

    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('page', String(nexPage))
      return next
    })
  }

  return { query, changePage }
}
