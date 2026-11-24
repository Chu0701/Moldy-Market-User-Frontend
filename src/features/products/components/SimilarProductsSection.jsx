import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { ProductGrid } from '@/features/marketplace/components/ProductGrid'
import { ProductCard } from '@/features/products/components/ProductCard'
import { searchProducts } from '@/services/products/productService'

const conditionKeys = {
  NEW: 'products.conditions.new',
  LIKE_NEW: 'products.conditions.likeNew',
  USED: 'products.conditions.used',
  DAMAGED: 'products.conditions.damaged',
}

/**
 * Displays up to 5 related listings from the same category below product details.
 * @param {{ categoryId?: string | null, currentProductId: string }} props
 */
export function SimilarProductsSection({ categoryId, currentProductId }) {
  const { t } = useTranslation()

  const query = useQuery({
    queryKey: ['products', 'similar', categoryId],
    queryFn: ({ signal }) =>
      searchProducts({
        categoryId,
        page: 1,
        size: 6,
        sort: 'newest',
        signal,
      }),
    enabled: Boolean(categoryId),
    staleTime: 60_000,
  })

  if (!categoryId || !query.isSuccess) {
    return null
  }

  const similarItems = (query.data?.items ?? [])
    .filter((item) => item.id !== currentProductId)
    .slice(0, 5)

  if (similarItems.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="similar-products-heading" className="border-t border-border pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="similar-products-heading" className="text-2xl font-semibold">
            {t('products.detail.similarTitle')}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {t('products.detail.similarDescription')}
          </p>
        </div>
        <Button asChild variant="outline" className="min-h-11">
          <Link to={`/categories/${encodeURIComponent(categoryId)}`}>
            <span>{t('products.detail.similarViewMore')}</span>
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>

      <ProductGrid>
        {similarItems.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            title={product.title}
            price={product.price}
            imageUrl={product.images?.[0]}
            conditionLabel={t(conditionKeys[product.condition] ?? 'products.conditions.unknown')}
          />
        ))}
      </ProductGrid>
    </section>
  )
}
