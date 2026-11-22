import { skipToken, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { useSession } from '@/features/auth/hooks/useSession'
import { getStoreContext } from '@/features/stores/getStoreContext'
import { useMyStore } from '@/features/stores/hooks/useMyStore'
import { useMyStaffProfile } from '@/features/stores/hooks/useMyStaffProfile'
import {
  getStoreOrderAccess,
  readStoreOrderParams,
  storeOrdersKeys,
} from '@/features/orders/storeOrdersState'
import { getStoreOrders } from '@/services/orders/storeOrderService'

export function useStoreOrders() {
  const { hasAccessToken, profileQuery } = useSession()
  const profile = profileQuery.data
  const userId = hasAccessToken ? profile?.id : undefined
  const owner = getStoreContext(profile).kind === 'owner'
  const ownerQuery = useMyStore(owner ? userId : undefined)
  const staffQuery = useMyStaffProfile(
    getStoreContext(profile).kind === 'staff' ? userId : undefined,
  )
  const access = getStoreOrderAccess(
    profile,
    ownerQuery.data,
    staffQuery.isError ? undefined : staffQuery.data,
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const params = readStoreOrderParams(searchParams)
  const queryKey = storeOrdersKeys.page(userId, access.storeId, params)
  const allowed =
    userId && !profileQuery.isError && access.canRead && (!owner || !ownerQuery.isError)
  const query = useQuery({
    queryKey,
    queryFn:
      allowed && params.valid
        ? ({ signal }) =>
            getStoreOrders({
              storeId: access.storeId,
              page: params.page,
              status: params.status,
              signal,
            })
        : skipToken,
    retry: false,
    staleTime: 0,
  })

  function changeFilters(page, status) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('page', String(page))
      if (status) next.set('status', status)
      else next.delete('status')
      return next
    })
  }

  return {
    userId,
    profileQuery,
    ownerQuery,
    staffQuery,
    access,
    params,
    queryKey,
    query,
    changePage: (page) => changeFilters(page, params.status),
    changeStatus: (status) => changeFilters(1, status),
  }
}
