import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { ProductGrid } from '@/features/marketplace/components/ProductGrid'

/** @param {{ children: import('react').ReactNode }} props */
export function FeaturedProducts({ children }) {
  const { t } = useTranslation()

  return (
    <section aria-labelledby="newest-products-heading" className="py-12 sm:py-16">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="newest-products-heading" className="text-2xl font-semibold">
            {t('products.newestTitle')}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {t('products.newestDescription')}
          </p>
        </div>
        <Button asChild variant="outline" className="min-h-11">
          <Link to="/products">{t('products.viewAll')}</Link>
        </Button>
      </div>
      <ProductGrid>{children}</ProductGrid>
    </section>
  )
}
