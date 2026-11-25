import { useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarClock, ClipboardCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { AppraiserStatusBadge } from '@/features/appraiser/components/AppraiserStatusBadge'
import { AppraiserPageShell } from '@/features/appraiser/components/AppraiserPageShell'
import { useMyAppraisalAssignments } from '@/features/appraiser/hooks/useAppraiserData'
import { useSession } from '@/features/auth/hooks/useSession'
import { formatLocalDate, formatVnd } from '@/features/appraiser/utils/formatters'

export function AppraiserAssignmentsPage() {
  const { t, i18n } = useTranslation()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const [page, setPage] = useState(1)
  const assignmentsQuery = useMyAppraisalAssignments(userId, page)

  return (
    <AppraiserPageShell
      title={t('appraiser.assignments.title')}
      description={t('appraiser.assignments.description')}
    >
      <section className="space-y-5">
        {assignmentsQuery.isPending ? (
          <div role="status" className="grid gap-3" aria-label={t('appraiser.assignments.loading')}>
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-xl border border-border bg-muted"
              />
            ))}
          </div>
        ) : assignmentsQuery.isError ? (
          assignmentsQuery.error?.status === 403 ? (
            <ForbiddenState />
          ) : (
            <ErrorState
              title={t('appraiser.assignments.errorTitle')}
              description={t('appraiser.assignments.errorDescription')}
              onRetry={() => void assignmentsQuery.refetch()}
              isRetrying={assignmentsQuery.isFetching}
            />
          )
        ) : assignmentsQuery.data.items.length === 0 ? (
          <EmptyState
            title={t('appraiser.assignments.emptyTitle')}
            description={t('appraiser.assignments.emptyDescription')}
          />
        ) : (
          <>
            <div className="grid gap-3">
              {assignmentsQuery.data.items.map((assignment) => (
                <article
                  key={assignment.id}
                  className="rounded-xl border border-border bg-card p-5 sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <AppraiserStatusBadge domain="assignment" status={assignment.status} />
                        <span className="text-xs text-muted-foreground">
                          {t('appraiser.assignments.assignmentId', { id: assignment.id })}
                        </span>
                      </div>
                      <h2 className="mt-3 text-base font-semibold">
                        {t('appraiser.assignments.requestReference', {
                          id: assignment.appraisalRequestId,
                        })}
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        <span className="font-semibold tabular-nums">
                          {formatVnd(assignment.agreedFee, i18n.language)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <CalendarClock aria-hidden="true" className="size-4" />
                          {formatLocalDate(assignment.assignedAt, i18n.language)}
                        </span>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="min-h-11 shrink-0">
                      <Link to={`/appraiser/assignments/${encodeURIComponent(assignment.id)}`}>
                        <ClipboardCheck aria-hidden="true" className="size-4" />
                        {t('appraiser.assignments.viewDetail')}
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            {assignmentsQuery.data.totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {t('appraiser.queue.page', {
                    page: assignmentsQuery.data.page,
                    totalPages: assignmentsQuery.data.totalPages,
                  })}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page <= 1 || assignmentsQuery.isFetching}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    {t('appraiser.pagination.previous')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!assignmentsQuery.data.hasNext || assignmentsQuery.isFetching}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    {t('appraiser.pagination.next')}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </AppraiserPageShell>
  )
}
