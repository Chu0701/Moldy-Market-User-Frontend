import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="hero-title"
      className="rounded-xl border border-border bg-accent px-6 py-10 text-accent-foreground md:p-12"
    >
      <p className="text-xs leading-5 font-medium tracking-widest text-muted-foreground uppercase">
        {t('hero.eyebrow')}
      </p>
      <h1 id="hero-title" className="mt-5 max-w-xl text-3xl leading-snug font-semibold md:text-4xl">
        {t('hero.title')}
      </h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
        {t('hero.description')}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild className="min-h-11 px-5">
          <Link to="/products">
            {t('hero.explore')}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11 px-5">
          <a href="#category-heading">{t('hero.browseCategories')}</a>
        </Button>
      </div>
    </section>
  )
}
