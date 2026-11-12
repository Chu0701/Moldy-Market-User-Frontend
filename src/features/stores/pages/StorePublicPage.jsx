import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { usePublicStore } from '@/features/stores/hooks/usePublicStore'
import { ProductSearchPanel } from '@/features/products/components/ProductSearchPanel'

export function StorePublicPage() {
  const { t } = useTranslation()
  const { storeId } = useParams()
  const query = usePublicStore(storeId)

  if (query.isPending) {
    return <p role="status">{t('stores.loading')}</p>
  }

  const status = query.error?.status
  const unavailable = status === 403 || status === 404

  if (query.isError && !unavailable) {
    return (
      <section className="store-public-page store-public-feedback">
        <h1>{t('stores.title')}</h1>
        <ErrorState
          title={t('stores.loadError')}
          description={t('feedback.checkBack')}
          onRetry={() => void query.refetch()}
          isRetrying={query.isFetching}
        />
      </section>
    )
  }

  const store = query.data

  if (unavailable || !store) {
    return (
      <section className="store-public-page store-public-feedback">
        <h1>{t('stores.unavailableTitle')}</h1>
        <Button asChild variant="outline">
          <Link to="/products">{t('stores.backToProducts')}</Link>
        </Button>
      </section>
    )
  }

  const description = store.description?.trim()

  return (
    <section className="store-public-page">
      <header className="store-public-header">
        <h1>{store.name}</h1>
        {description && <p>{description}</p>}
      </header>
      <section className="store-public-products">
        <h2>{t('stores.productsTitle')}</h2>
        <ProductSearchPanel storeId={store.id} />
      </section>
    </section>
  )
}
