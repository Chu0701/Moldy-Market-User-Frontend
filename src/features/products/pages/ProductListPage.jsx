import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ProductSearchPanel } from '@/features/products/components/ProductSearchPanel'

export function ProductListPage() {
  const { t } = useTranslation()

  return (
    <section className="product-list-page space-y-6" aria-labelledby="products-page-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1
            id="products-page-heading"
            className="scroll-mt-24 text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {t('navigation.products')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('products.catalogSubtitle')}</p>
        </div>

        <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-subtle px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0 text-success" />
          <span>{t('products.escrowBadge')}</span>
        </p>
      </div>

      <ProductSearchPanel />
    </section>
  )
}
