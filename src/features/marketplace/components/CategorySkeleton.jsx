import { useTranslation } from 'react-i18next'

export function CategorySkeleton() {
  const { t } = useTranslation()

  return (
    <div role="status" className="col-span-full">
      <span className="sr-only">{t('categories.loading')}</span>
      <div
        aria-hidden="true"
        className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6"
      >
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-32 flex-col justify-between gap-6 rounded-xl border border-border p-4 motion-safe:animate-pulse lg:p-6"
          >
            <div className="size-5 self-end rounded-sm bg-muted" />
            <div className="h-6 w-3/4 rounded-sm bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
