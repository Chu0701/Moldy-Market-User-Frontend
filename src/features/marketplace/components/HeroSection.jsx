import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

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

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="hero-title"
      className="editorial-reveal grid gap-8 rounded-xl border border-border bg-surface-subtle p-6 sm:p-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:items-center lg:gap-12 lg:p-12"
    >
      <div className="min-w-0">
        <p className="text-xs leading-5 font-semibold tracking-widest text-muted-foreground uppercase">
          {t('hero.eyebrow')}
        </p>
        <h1
          id="hero-title"
          className="mt-4 max-w-xl text-3xl leading-tight font-semibold text-foreground sm:text-4xl lg:text-5xl"
        >
          {t('hero.title')}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          {t('hero.description')}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
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

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="min-h-11 px-6">
            <Link to="/products">
              <span>{t('hero.explore')}</span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 bg-background px-5">
            <a href="#category-heading">{t('hero.browseCategories')}</a>
          </Button>
        </div>
      </div>

      <aside className="rounded-lg border border-border bg-background p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {t('hero.howItWorksTitle')}
        </p>
        <ol className="mt-4 divide-y divide-border">
          {tradingSteps.map(({ number, titleKey, descKey }) => (
            <li
              key={number}
              className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-3.5 first:pt-0 last:pb-0"
            >
              <span className="font-heading text-lg font-semibold text-muted-foreground tabular-nums">
                {number}
              </span>
              <div className="min-w-0">
                <p className="text-sm leading-5 font-semibold text-foreground">{t(titleKey)}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{t(descKey)}</p>
              </div>
            </li>
          ))}
        </ol>
      </aside>
    </section>
  )
}
