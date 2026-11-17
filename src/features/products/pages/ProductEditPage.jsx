import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useSession } from '@/features/auth/hooks/useSession'
import { ProductEditForm } from '@/features/products/components/ProductEditForm'
import { useProductDetail } from '@/features/products/hooks/useProductDetail'
import { productKeys } from '@/features/products/hooks/useProductSearch'
import { useProductManagementAccess } from '../hooks/useProductManagementAccess'

export function ProductEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profileQuery } = useSession()
  const query = useProductDetail({ refetchOnMount: 'always' })
  const product = query.data
  const { canManage, isCheckingStore, storeQuery } = useProductManagementAccess(
    product,
    profileQuery.data,
  )
  const hasVersion = Number.isSafeInteger(product?.version) && product.version >= 0

  async function handleSaved() {
    await queryClient.invalidateQueries({
      queryKey: productKeys.detail(product.id),
      exact: true,
    })
    void queryClient.invalidateQueries({ queryKey: ['products', 'search'] })
    void queryClient.invalidateQueries({ queryKey: ['products', 'store-mine'] })
    void queryClient.invalidateQueries({ queryKey: ['products', 'mine'] })
    void navigate(`/products/${encodeURIComponent(product.id)}`, { replace: true })
  }

  if (query.isPending || isCheckingStore || (product && !hasVersion && query.isFetching)) {
    return <p role="status">{t('products.loading')}</p>
  }

  if (query.error?.status === 404) {
    return <p role="alert">{t('products.detail.unavailableTitle')}</p>
  }

  if (query.error?.status === 403 || storeQuery.error?.status === 403) {
    return <ForbiddenState />
  }

  if (storeQuery.isError) {
    return (
      <ErrorState
        title={t('stores.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void storeQuery.refetch()}
        isRetrying={storeQuery.isFetching}
      />
    )
  }

  if (product && !canManage) {
    return <ForbiddenState />
  }

  return (
    <section className="profile-page" aria-labelledby="product-edit-heading">
      <h1 id="product-edit-heading">{t('products.edit.title')}</h1>
      {product && hasVersion ? (
        <ProductEditForm
          key={product.id}
          product={product}
          refetch={query.refetch}
          isFetching={query.isFetching}
          onSaved={handleSaved}
        />
      ) : (
        <ErrorState
          title={t('products.edit.reloadError')}
          description={t('feedback.checkBack')}
          onRetry={() => void query.refetch()}
          isRetrying={query.isFetching}
        />
      )}
    </section>
  )
}
