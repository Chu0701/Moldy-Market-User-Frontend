import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useSession } from '@/features/auth/hooks/useSession'
import { useCategories } from '@/features/marketplace/hooks/useCategories'
import { getActiveAppraisers } from '@/services/appraiser/appraiserService'
import { Button } from '@/components/ui/button'

function flatten(items = []) {
  return items.flatMap((item) => [item, ...flatten(item.children ?? [])])
}

export function AppraiserDirectoryPage() {
  const { t } = useTranslation()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const categories = useCategories()
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const experts = useQuery({
    queryKey: ['appraiserDirectory', categoryId, page],
    queryFn: ({ signal }) =>
      getActiveAppraisers({ categoryId: categoryId || undefined, page, signal }),
    enabled: Boolean(userId),
    retry: false,
  })
  const flatCategories = useMemo(() => flatten(categories.data ?? []), [categories.data])
  return (
    <main className="space-y-6">
      <header>
        <h1>{t('appraiserDirectory.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('appraiserDirectory.description')}</p>
      </header>
      <label className="grid max-w-md gap-2 text-sm">
        {t('appraiserDirectory.category')}
        <select
          value={categoryId}
          onChange={(event) => {
            setPage(1)
            setCategoryId(event.target.value)
          }}
          className="min-h-11 rounded-lg border border-input bg-background px-3"
        >
          <option value="">{t('appraiserDirectory.allCategories')}</option>
          {flatCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      {categories.isError && (
        <p role="alert" className="text-sm text-destructive">
          {t('appraiserDirectory.categoriesError')}
        </p>
      )}
      {experts.isPending ? (
        <p role="status">{t('appraiserDirectory.loading')}</p>
      ) : experts.isError ? (
        <ErrorState
          title={t('appraiserDirectory.errorTitle')}
          description={t('appraiserDirectory.errorDescription')}
          onRetry={() => void experts.refetch()}
          isRetrying={experts.isFetching}
        />
      ) : experts.data.items.length === 0 ? (
        <EmptyState
          title={t('appraiserDirectory.emptyTitle')}
          description={t('appraiserDirectory.emptyDescription')}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {experts.data.items.map((expert) => (
              <article key={expert.id} className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold">{expert.fullName}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{expert.bio}</p>
                <p className="mt-3 text-sm">
                  {expert.categories?.map((category) => category.categoryName).join(' · ')}
                </p>
                <p className="mt-2 text-sm">
                  ★ {expert.averageRating ?? '—'} ({expert.reviewCount ?? 0}) ·{' '}
                  {t('appraiserDirectory.completed', {
                    count: expert.totalCompletedAppraisals ?? 0,
                  })}
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to={`/appraisers/${encodeURIComponent(expert.id)}`}>
                    {t('appraiserDirectory.profile')}
                  </Link>
                </Button>
              </article>
            ))}
          </div>
          {experts.data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                disabled={page <= 1 || experts.isFetching}
                onClick={() => setPage((value) => value - 1)}
              >
                {t('appraiser.pagination.previous')}
              </Button>
              <span>
                {page}/{experts.data.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!experts.data.hasNext || experts.isFetching}
                onClick={() => setPage((value) => value + 1)}
              >
                {t('appraiser.pagination.next')}
              </Button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
