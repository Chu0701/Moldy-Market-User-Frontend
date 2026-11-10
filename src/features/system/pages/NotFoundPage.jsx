import { useTranslation } from 'react-i18next'
import { Form, Link } from 'react-router'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="text-center">
      <p className="text-sm font-semibold tracking-widest text-muted-foreground">404</p>
      <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{t('notFound.title')}</h1>
      <p className="mt-4 leading-7 text-muted-foreground">{t('notFound.message')}</p>
      <Button asChild className="mt-6 min-h-11">
        <Link to="/">{t('actions.backHome')}</Link>
      </Button>
      <Form action="/products" method="get" className="mt-8 text-left">
        <label htmlFor="not-found-search" className="text-sm font-medium">
          {t('navigation.search')}
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            id="not-found-search"
            type="search"
            name="q"
            className="min-h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" variant="outline" className="min-h-11">
            {t('navigation.search')}
          </Button>
        </div>
      </Form>
    </section>
  )
}
