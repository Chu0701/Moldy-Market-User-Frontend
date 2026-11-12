import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { usePublicStore } from '@/features/products/hooks/usePublicStore'

/** @param {{ storeId?: string | null }} props */
export function SellerCard({ storeId }) {
  const { t } = useTranslation()
  const query = usePublicStore(storeId)

  if (!storeId) return null

  if (query.isPending) {
    return (
      <section className="product-seller">
        <h2>{t('products.seller.title')}</h2>
        <p role="status">{t('products.seller.loading')}</p>
      </section>
    )
  }

  if (query.isError) {
    const status = query.error?.status
    const unavailable = status === 403 || status === 404

    return (
      <section className="product-seller">
        <h2>{t('products.seller.title')}</h2>
        <p role="alert">
          {t(unavailable ? 'products.seller.unavailable' : 'products.seller.loadError')}
        </p>
        {!unavailable && (
          <Button
            type="button"
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('actions.retry')}
          </Button>
        )}
      </section>
    )
  }

  const store = query.data
  if (!store) return null

  const description = store.description?.trim()

  return (
    <section className="product-seller">
      <h2>{t('products.seller.title')}</h2>
      <p className="product-seller-name">{store.name}</p>
      {description && <p>{description}</p>}
    </section>
  )
}
