import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { ProductGrid } from '@/features/marketplace/components/ProductGrid'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { cn } from '@/lib/utils'

/** @param {{ children: import('react').ReactNode }} props */
export function FeaturedProducts({ children }) {
  const { t } = useTranslation()
  const { ref, isVisible } = useRevealOnScroll()

  return (
    <section
      ref={ref}
      aria-labelledby="newest-products-heading"
      className={cn(
        'border-t border-border py-10 transition-[opacity,transform] duration-400 ease-out motion-reduce:transform-none motion-reduce:transition-none sm:py-12',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="newest-products-heading" className="text-2xl font-semibold sm:text-3xl">
            {t('products.newestTitle')}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {t('products.newestDescription')}
          </p>
        </div>
        <Button asChild variant="outline" className="group min-h-11">
          <Link to="/products">
            <span>{t('products.viewAll')}</span>
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
            />
          </Link>
        </Button>
      </div>
      <ProductGrid>{children}</ProductGrid>
    </section>
  )
}
