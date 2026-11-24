import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { usePublicStore } from '@/features/stores/hooks/usePublicStore'
import { ProductSearchPanel } from '@/features/products/components/ProductSearchPanel'
import { StoreChatButton } from '@/features/chat/components/StoreChatButton'
import { StoreReviewsSection } from '@/features/reviews/components/StoreReviewsSection'

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
  const initial = store.name?.trim().charAt(0).toUpperCase() || 'M'

  return (
    <section className="store-public-page">
      <header className="store-public-header rounded-xl border border-border bg-surface-subtle p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden="true"
              className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-2xl font-semibold text-primary-foreground"
            >
              {initial}
            </span>
            <div className="min-w-0">
              <h1>{store.name}</h1>
              {description && (
                <p className="mt-2 max-w-2xl leading-7 break-words whitespace-pre-wrap text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <StoreChatButton key={store.id} storeId={store.id} storeQuery={query} />
          </div>
        </div>
      </header>
      <section className="store-public-products">
        <h2>{t('stores.productsTitle')}</h2>
        <ProductSearchPanel storeId={store.id} />
      </section>
      <StoreReviewsSection storeId={store.id} />
    </section>
  )
}
