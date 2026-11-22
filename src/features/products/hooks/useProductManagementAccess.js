import { useMyStore } from '@/features/stores/hooks/useMyStore'
import { canEditPersonalProduct } from './useProductDetail'
import { getStoreContext } from '@/features/stores/getStoreContext'
import { useMyStaffProfile } from '@/features/stores/hooks/useMyStaffProfile'
import { usePublicStore } from '@/features/stores/hooks/usePublicStore'
export function useProductManagementAccess(product, profile) {
  const isStaff = getStoreContext(profile).kind === 'staff'
  const staffQuery = useMyStaffProfile(isStaff ? profile?.id : undefined)
  const staffAccess = getStoreContext(profile, staffQuery.isError ? undefined : staffQuery.data)
  const canCheckStore = Boolean(
    product?.storeId &&
    profile?.id &&
    (isStaff
      ? staffAccess.canManageProducts && staffAccess.storeId === product.storeId
      : profile.permissions?.includes('PRODUCT_MANAGE_OWN')) &&
    ['ACTIVE', 'HIDDEN'].includes(product.status),
  )

  const ownerQuery = useMyStore(canCheckStore && !isStaff ? profile.id : undefined)
  const linkedQuery = usePublicStore(canCheckStore && isStaff ? staffAccess.storeId : undefined)
  const storeQuery =
    isStaff && (staffQuery.isPending || staffQuery.isError)
      ? staffQuery
      : isStaff
        ? linkedQuery
        : ownerQuery
  const store = storeQuery.data
  const canManageStoreProduct =
    canCheckStore &&
    storeQuery.isSuccess &&
    store?.id === product.storeId &&
    store.status !== 'BLOCKED'

  return {
    canManage: canEditPersonalProduct(product, profile) || canManageStoreProduct,
    isCheckingStore: (isStaff && staffQuery.isPending) || (canCheckStore && storeQuery.isPending),
    storeQuery,
  }
}
