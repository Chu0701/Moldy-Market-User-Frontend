import { ArrowRight, CheckCircle2, Package, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { getStoreContext } from '@/features/stores/getStoreContext'
import { cn } from '@/lib/utils'

const quickBrowseLinks = [
  { to: '/products?condition=NEW&page=1', labelKey: 'hero.quickNew' },
  { to: '/products?condition=LIKE_NEW&page=1', labelKey: 'hero.quickLikeNew' },
  { to: '/products?condition=USED&page=1', labelKey: 'hero.quickUsed' },
  { to: '/products?sort=price_asc&page=1', labelKey: 'hero.quickLowPrice' },
]

const tradingSteps = [
  { number: '01', titleKey: 'hero.step1Title', descKey: 'hero.step1Desc', icon: Search },
  { number: '02', titleKey: 'hero.step2Title', descKey: 'hero.step2Desc', icon: ShieldCheck },
  { number: '03', titleKey: 'hero.step3Title', descKey: 'hero.step3Desc', icon: CheckCircle2 },
]

const STEP_CYCLE_MS = 3500

function StepIllustration({ stepIndex }) {
  if (stepIndex === 1) {
    return (
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70">
        <ShieldCheck aria-hidden="true" className="size-4" />
      </span>
    )
  }
  if (stepIndex === 2) {
    return (
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-200/70">
        <CheckCircle2 aria-hidden="true" className="size-4" />
      </span>
    )
  }
  return (
    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-200/70">
      <Search aria-hidden="true" className="size-4" />
    </span>
  )
}

/**
 * Editorial marketplace Hero with subtle dot-grid backdrop, real product visual strip
 * (when listings have images), real active count pill, and interactive 3-step Escrow panel.
 *
 * @param {{ newestProducts?: Array<object>, totalProducts?: number }} props
 */
export function HeroSection({ newestProducts = [], totalProducts = 0 }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hasAccessToken, profileQuery } = useSession()
  const [activeStep, setActiveStep] = useState(0)
  const [paused, setPaused] = useState(false)

  const storeContext = hasAccessToken ? getStoreContext(profileQuery.data) : { kind: 'none' }
  const sellHref =
    storeContext.kind === 'owner' || storeContext.kind === 'staff'
      ? '/store/products/new'
      : '/open-store'

  const visualProducts = newestProducts
    .filter((item) => Array.isArray(item.images) && item.images.length > 0 && item.images[0])
    .slice(0, 3)

  useEffect(() => {
    if (paused) return
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    ) {
      return
    }
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % tradingSteps.length)
    }, STEP_CYCLE_MS)
    return () => window.clearInterval(timer)
  }, [paused])

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden rounded-2xl border border-border bg-surface-subtle p-6 sm:p-8 lg:p-12"
    >
      {/* Subtle architectural dot-grid & warm radial highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 85% 18%, rgba(234, 88, 12, 0.08), transparent 45%), radial-gradient(rgba(15, 23, 42, 0.07) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 20px 20px',
        }}
      />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.92fr)] lg:items-center lg:gap-12">
        <div className="min-w-0">
          <div
            className="editorial-stagger flex flex-wrap items-center gap-2.5"
            style={{ '--stagger-delay': '0ms' }}
          >
            <p className="text-xs leading-5 font-semibold tracking-widest text-muted-foreground uppercase">
              {t('hero.eyebrow')}
            </p>
            {totalProducts > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 tabular-nums">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500" />
                <span>{t('hero.liveCount', { count: totalProducts })}</span>
              </span>
            )}
          </div>

          <h1
            id="hero-title"
            className="editorial-stagger mt-4 max-w-xl text-3xl leading-tight font-semibold text-foreground sm:text-4xl lg:text-5xl"
            style={{ '--stagger-delay': '70ms' }}
          >
            {t('hero.title')}
          </h1>

          <p
            className="editorial-stagger mt-4 max-w-xl text-base leading-7 text-muted-foreground"
            style={{ '--stagger-delay': '140ms' }}
          >
            {t('hero.description')}
          </p>

          <div
            className="editorial-stagger mt-6 flex flex-wrap items-center gap-2"
            style={{ '--stagger-delay': '180ms' }}
          >
            <span className="text-xs font-medium text-muted-foreground">
              {t('hero.quickConditions')}
            </span>
            {quickBrowseLinks.map(({ to, labelKey }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex min-h-9 items-center rounded-full border border-border bg-background/90 px-3.5 text-xs font-medium text-foreground transition-colors outline-none hover:border-foreground/50 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t(labelKey)}
              </Link>
            ))}
          </div>

          <div className="editorial-stagger mt-7 space-y-3" style={{ '--stagger-delay': '220ms' }}>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="group min-h-11 px-6">
                <Link to="/products">
                  <span>{t('hero.explore')}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
                  />
                </Link>
              </Button>
              <Button asChild variant="outline" className="min-h-11 bg-background px-5">
                <a href="#category-heading">{t('hero.browseCategories')}</a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('hero.sellerPrompt')}{' '}
              <button
                type="button"
                onClick={() => void navigate(sellHref)}
                className="font-semibold text-foreground underline decoration-foreground/40 underline-offset-4 transition-colors hover:decoration-foreground"
              >
                {t('hero.sellerPromptAction')}
              </button>
            </p>
          </div>
        </div>

        <div className="editorial-stagger grid gap-3.5" style={{ '--stagger-delay': '260ms' }}>
          {/* Visual product preview strip — renders only when real listings with images exist */}
          {visualProducts.length > 0 && (
            <div className="rounded-xl border border-border bg-background/95 p-3 shadow-xs">
              <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  <Sparkles aria-hidden="true" className="size-3.5 text-amber-600" />
                  <span>{t('hero.spotlightTitle')}</span>
                </span>
                <span className="text-[11px] text-muted-foreground">{t('hero.spotlightHint')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {visualProducts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void navigate(`/products/${encodeURIComponent(item.id)}`)}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-surface-subtle text-left transition-[transform,border-color] duration-150 outline-none hover:-translate-y-0.5 hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-muted">
                      <ImageWithFallback
                        src={item.images[0]}
                        alt={item.title}
                        compact
                        className="size-full transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-1.5">
                      <p className="truncate text-[11px] font-medium text-foreground">
                        {item.title}
                      </p>
                      <ProductPrice
                        value={item.price}
                        className="block truncate text-[11px] font-bold text-foreground tabular-nums"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive 3-step Escrow explainer */}
          <aside
            className="rounded-xl border border-border bg-background/95 p-5 shadow-xs sm:p-6"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setPaused(false)
              }
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t('hero.howItWorksTitle')}
              </p>
              <StepIllustration stepIndex={activeStep} />
            </div>

            <ol className="mt-3.5 divide-y divide-border">
              {tradingSteps.map(({ number, titleKey, descKey }, index) => {
                const isActive = index === activeStep
                return (
                  <li key={number} className="py-1.5 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveStep(index)}
                      className={cn(
                        'relative grid w-full grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-lg py-2 pr-2 pl-3 text-left transition-opacity duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive ? 'opacity-100' : 'opacity-50 hover:opacity-80',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute top-2 bottom-2 left-0 w-0.5 overflow-hidden rounded-full bg-border"
                      >
                        {isActive && (
                          <span
                            key={activeStep}
                            data-paused={paused ? 'true' : 'false'}
                            className="step-progress-bar block size-full bg-foreground"
                          />
                        )}
                      </span>
                      <span
                        className={cn(
                          'font-heading text-lg font-semibold tabular-nums transition-colors duration-200',
                          isActive ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {number}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm leading-5 font-semibold text-foreground">
                          {t(titleKey)}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{t(descKey)}</p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ol>
          </aside>
        </div>
      </div>

      {/* Fallback quiet package icon accent when zero products have photos yet */}
      {visualProducts.length === 0 && (
        <Package aria-hidden="true" className="pointer-events-none hidden" />
      )}
    </section>
  )
}
