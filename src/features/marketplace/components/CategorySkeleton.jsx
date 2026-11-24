import { useTranslation } from 'react-i18next'

export function CategorySkeleton() {
  const { t } = useTranslation()

  return (
    <div role="status" className="col-span-full">
      <span className="sr-only">{t('categories.loading')}</span>
      <div
        aria-hidden="true"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 motion-safe:animate-pulse"
          >
            <div className="h-4 w-3/4 rounded-sm bg-muted" />
            <div className="size-4 shrink-0 rounded-sm bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
