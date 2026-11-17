import { useMyStore } from '@/features/stores/hooks/useMyStore'
import { canEditPersonalProduct } from './useProductDetail'
export function useProductManagementAccess(product, profile) {
  const canCheckStore = Boolean(
    product?.storeId &&
    profile?.id &&
    profile.permissions?.includes('PRODUCT_MANAGE_OWN') &&
    ['ACTIVE', 'HIDDEN'].includes(product.status),
  )

  const storeQuery = useMyStore(canCheckStore ? profile.id : undefined)
  const store = storeQuery.data
  const canManageStoreProduct =
    canCheckStore &&
    storeQuery.isSuccess &&
    store?.id === product.storeId &&
    store.status !== 'BLOCKED'

  return {
    canManage: canEditPersonalProduct(product, profile) || canManageStoreProduct,
    isCheckingStore: canCheckStore && storeQuery.isPending,
    storeQuery,
  }
}
