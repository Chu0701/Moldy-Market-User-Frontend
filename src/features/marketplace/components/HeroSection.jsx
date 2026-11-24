import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const quickBrowseLinks = [
  { to: '/products?condition=NEW&page=1', labelKey: 'hero.quickNew' },
  { to: '/products?condition=LIKE_NEW&page=1', labelKey: 'hero.quickLikeNew' },
  { to: '/products?condition=USED&page=1', labelKey: 'hero.quickUsed' },
  { to: '/products?sort=price_asc&page=1', labelKey: 'hero.quickLowPrice' },
]

const tradingSteps = [
  { number: '01', titleKey: 'hero.step1Title', descKey: 'hero.step1Desc' },
  { number: '02', titleKey: 'hero.step2Title', descKey: 'hero.step2Desc' },
  { number: '03', titleKey: 'hero.step3Title', descKey: 'hero.step3Desc' },
]

const STEP_CYCLE_MS = 3500

export function HeroSection() {
  const { t } = useTranslation()
  const [activeStep, setActiveStep] = useState(0)
  const [paused, setPaused] = useState(false)

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
      className="grid gap-8 rounded-2xl border border-border bg-surface-subtle p-6 sm:p-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:items-center lg:gap-12 lg:p-12"
    >
      <div className="min-w-0">
        <p
          className="editorial-stagger text-xs leading-5 font-semibold tracking-widest text-muted-foreground uppercase"
          style={{ '--stagger-delay': '0ms' }}
        >
          {t('hero.eyebrow')}
        </p>
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
              className="inline-flex min-h-9 items-center rounded-full border border-border bg-background px-3.5 text-xs font-medium text-foreground transition-colors outline-none hover:border-foreground/50 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t(labelKey)}
            </Link>
          ))}
        </div>

        <div
          className="editorial-stagger mt-8 flex flex-wrap gap-3"
          style={{ '--stagger-delay': '220ms' }}
        >
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
      </div>

      <aside
        className="editorial-stagger rounded-xl border border-border bg-background p-5 shadow-xs sm:p-6"
        style={{ '--stagger-delay': '260ms' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setPaused(false)
          }
        }}
      >
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {t('hero.howItWorksTitle')}
        </p>
        <ol className="mt-4 divide-y divide-border">
          {tradingSteps.map(({ number, titleKey, descKey }, index) => {
            const isActive = index === activeStep
            return (
              <li key={number} className="py-1.5 first:pt-0 last:pb-0">
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveStep(index)}
                  className={cn(
                    'relative grid w-full grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-lg py-2.5 pr-2 pl-3 text-left transition-opacity duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
                    <p className="text-sm leading-5 font-semibold text-foreground">{t(titleKey)}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{t(descKey)}</p>
                  </div>
                </button>
              </li>
            )
          })}
        </ol>
      </aside>
    </section>
  )
}
