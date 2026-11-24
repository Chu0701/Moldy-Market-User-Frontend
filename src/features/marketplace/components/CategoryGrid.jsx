import { useTranslation } from 'react-i18next'

/** @param {{ children: import('react').ReactNode }} props */
export function CategoryGrid({ children }) {
  const { t } = useTranslation()

  return (
    <section aria-labelledby="category-heading" className="py-10 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="category-heading" className="text-2xl font-semibold sm:text-3xl">
            {t('categories.title')}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {t('categories.description')}
          </p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {children}
      </div>
    </section>
  )
}
