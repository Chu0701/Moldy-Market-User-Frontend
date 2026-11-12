import { useTranslation } from 'react-i18next'

import { ProductSearchPanel } from '@/features/products/components/ProductSearchPanel'

export function ProductListPage() {
  const { t } = useTranslation()

  return (
    <section className="product-list-page">
      <h1>{t('navigation.products')}</h1>
      <ProductSearchPanel />
    </section>
  )
}
