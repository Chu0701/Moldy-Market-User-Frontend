import { useTranslation } from 'react-i18next'

import { ProductGrid } from '@/features/marketplace/components/ProductGrid'

export function ProductSkeleton() {
  const { t } = useTranslation()

  return (
    <div role="status" className="col-span-full">
      <span className="sr-only">{t('products.loading')}</span>
      <div aria-hidden="true">
        <ProductGrid>
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-border motion-safe:animate-pulse"
            >
              <div className="aspect-square bg-muted" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-full rounded-sm bg-muted" />
                <div className="h-4 w-2/3 rounded-sm bg-muted" />
                <div className="h-6 w-1/2 rounded-sm bg-muted" />
              </div>
            </div>
          ))}
        </ProductGrid>
      </div>
    </div>
  )
}
