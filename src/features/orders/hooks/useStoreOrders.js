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
import { getStoreOrders, getStoreOrderSummary } from '@/services/orders/storeOrderService'

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
        ? ({ signal }) => {
            const input = {
              storeId: access.storeId,
              page: params.page,
              status: params.status,
              signal,
            }
            if (params.q) input.q = params.q
            if (params.from) input.from = params.from
            if (params.to) input.to = params.to
            if (params.oldestFirst) input.oldestFirst = true
            return getStoreOrders(input)
          }
        : skipToken,
    retry: false,
    staleTime: 0,
  })

  const summaryQuery = useQuery({
    queryKey: storeOrdersKeys.summary(userId, access.storeId),
    queryFn:
      allowed && typeof getStoreOrderSummary === 'function'
        ? ({ signal }) => getStoreOrderSummary({ storeId: access.storeId, signal })
        : skipToken,
    retry: false,
    staleTime: 15_000,
  })

  function updateSearchParams(patch) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === null || value === '') {
          next.delete(key)
        } else {
          next.set(key, String(value))
        }
      }
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
    summaryQuery,
    changePage: (page) => updateSearchParams({ page }),
    changeStatus: (status) => updateSearchParams({ page: 1, status, sort: '' }),
    changeSearch: (q) => updateSearchParams({ page: 1, q: q.trim() }),
    changeDateRange: ({ from, to }) => updateSearchParams({ page: 1, from, to }),
    changeSort: (sort) => updateSearchParams({ page: 1, sort }),
    clearFilters: () =>
      updateSearchParams({ page: 1, status: '', q: '', from: '', to: '', sort: '' }),
  }
}
