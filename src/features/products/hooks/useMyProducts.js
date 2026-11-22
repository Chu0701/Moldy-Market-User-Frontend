import { skipToken, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'

import { useSession } from '@/features/auth/hooks/useSession'
import {
  getMyProducts,
  getMyStoreProducts,
  getStoreProducts,
} from '@/services/products/productService'
import { getStoreContext } from '@/features/stores/getStoreContext'
import { useMyStaffProfile } from '@/features/stores/hooks/useMyStaffProfile'

export function useMyProducts({ store = false } = {}) {
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const isStaff = store && getStoreContext(profileQuery.data).kind === 'staff'
  const staffQuery = useMyStaffProfile(isStaff ? userId : undefined)
  const access = getStoreContext(
    profileQuery.data,
    staffQuery.isError ? undefined : staffQuery.data,
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedPage = Number(searchParams.get('page'))
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1
  const loadProducts = store ? getMyStoreProducts : getMyProducts
  const allowed = userId && !profileQuery.isError && (!isStaff || access.canManageProducts)

  const query = useQuery({
    queryKey: [
      'products',
      store ? 'store-mine' : 'mine',
      userId,
      page,
      isStaff ? access.storeId : null,
    ],
    queryFn: allowed
      ? ({ signal }) =>
          isStaff
            ? getStoreProducts({ storeId: access.storeId, page, signal })
            : loadProducts({ page, signal })
      : skipToken,
    retry: false,
  })

  function changePage(nexPage) {
    if (!Number.isSafeInteger(nexPage) || nexPage < 1 || query.isFetching) return

    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('page', String(nexPage))
      return next
    })
  }

  return { query, changePage, isStaff, staffQuery, forbidden: isStaff && !access.canManageProducts }
}
