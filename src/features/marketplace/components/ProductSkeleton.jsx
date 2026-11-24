import { useTranslation } from 'react-i18next'

import { ProductGrid } from '@/features/marketplace/components/ProductGrid'

export function ProductSkeleton() {
  const { t } = useTranslation()

  return (
    <div role="status" className="col-span-full">
      <span className="sr-only">{t('products.loading')}</span>
      <div aria-hidden="true">
        <ProductGrid>
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="skeleton-shimmer aspect-square" />
              <div className="space-y-2.5 p-3">
                <div className="skeleton-shimmer h-4 w-full rounded-sm" />
                <div className="skeleton-shimmer h-4 w-2/3 rounded-sm" />
                <div className="skeleton-shimmer h-5 w-1/3 rounded-sm" />
              </div>
            </div>
          ))}
        </ProductGrid>
      </div>
    </div>
  )
}
