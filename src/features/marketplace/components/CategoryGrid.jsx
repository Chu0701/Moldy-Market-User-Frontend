import { useTranslation } from 'react-i18next'

/** @param {{ children: import('react').ReactNode }} props */
export function CategoryGrid({ children }) {
  const { t } = useTranslation()

  return (
    <section aria-labelledby="category-heading" className="py-12 sm:py-16">
      <h2 id="category-heading" className="text-2xl font-semibold sm:text-3xl">
        {t('categories.title')}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        {t('categories.description')}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
        {children}
      </div>
    </section>
  )
}
