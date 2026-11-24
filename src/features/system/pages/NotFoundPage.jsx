import { useTranslation } from 'react-i18next'
import { Form, Link } from 'react-router'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-xs sm:p-8">
      <p className="font-heading text-5xl font-semibold tracking-tight text-muted-foreground/50 tabular-nums">
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">{t('notFound.title')}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{t('notFound.message')}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <Button asChild className="min-h-11">
          <Link to="/">{t('actions.backHome')}</Link>
        </Button>
      </div>
      <Form action="/products" method="get" className="mt-7 border-t border-border pt-6 text-left">
        <label htmlFor="not-found-search" className="text-[13px] font-medium text-foreground">
          {t('navigation.search')}
        </label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <input
            id="not-found-search"
            type="search"
            name="q"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-input bg-background px-3.5 text-sm shadow-2xs outline-none focus-visible:border-foreground/75 focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" variant="outline" className="min-h-11">
            {t('navigation.search')}
          </Button>
        </div>
      </Form>
    </section>
  )
}
