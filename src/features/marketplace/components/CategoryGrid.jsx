import { useTranslation } from 'react-i18next'

import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { cn } from '@/lib/utils'

/** @param {{ children: import('react').ReactNode }} props */
export function CategoryGrid({ children }) {
  const { t } = useTranslation()
  const { ref, isVisible } = useRevealOnScroll()

  return (
    <section
      ref={ref}
      aria-labelledby="category-heading"
      className={cn(
        'py-10 transition-[opacity,transform] duration-400 ease-out motion-reduce:transform-none motion-reduce:transition-none sm:py-12',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
    >
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
