import { ArrowRight, Plus, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { getStoreContext } from '@/features/stores/getStoreContext'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { cn } from '@/lib/utils'

export function SellerCtaBanner() {
  const { t } = useTranslation()
  const { hasAccessToken, profileQuery } = useSession()
  const { ref, isVisible } = useRevealOnScroll()

  const storeContext = hasAccessToken ? getStoreContext(profileQuery.data) : { kind: 'none' }
  const hasStore = storeContext.kind === 'owner' || storeContext.kind === 'staff'

  return (
    <section
      ref={ref}
      aria-labelledby="seller-cta-heading"
      className={cn(
        'py-6 transition-[opacity,transform] duration-400 ease-out motion-reduce:transform-none motion-reduce:transition-none sm:py-8',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
    >
      <div className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-8 text-background shadow-sm sm:px-10 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 90% 20%, rgba(251, 146, 60, 0.35), transparent 45%)',
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-semibold tracking-widest text-background/70 uppercase">
              {t('sellerBanner.eyebrow')}
            </p>
            <h2
              id="seller-cta-heading"
              className="text-2xl font-semibold tracking-tight text-background sm:text-3xl"
            >
              {t('sellerBanner.title')}
            </h2>
            <p className="text-sm leading-6 text-background/75">{t('sellerBanner.description')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
            <Button
              asChild
              className="min-h-11 gap-2 bg-background px-5 text-foreground hover:bg-background/90"
            >
              <Link to={hasStore ? '/store/products/new' : '/open-store'}>
                <Plus aria-hidden="true" className="size-4" />
                <span>{t('sellerBanner.sellNowCta')}</span>
              </Link>
            </Button>

            {hasStore ? (
              <Button
                asChild
                variant="outline"
                className="min-h-11 gap-2 border-background/25 bg-transparent px-5 text-background hover:bg-background/10 hover:text-background"
              >
                <Link to="/store">
                  <Store aria-hidden="true" className="size-4" />
                  <span>{t('sellerBanner.manageStoreCta')}</span>
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                className="group min-h-11 gap-2 border-background/25 bg-transparent px-5 text-background hover:bg-background/10 hover:text-background"
              >
                <Link to="/products">
                  <span>{t('sellerBanner.browseCta')}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
