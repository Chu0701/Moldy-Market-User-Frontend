import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { DisputeStatusBadge } from '@/features/disputes/components/DisputeStatusBadge'
import { useMyDisputes } from '@/features/disputes/hooks/useDisputes'

export function DisputeListPage() {
  const { t, i18n } = useTranslation()
  const { profileQuery, query } = useMyDisputes()

  if (profileQuery.isPending || query.isPending) {
    return <p role="status">{t('disputes.loading')}</p>
  }

  if (query.error?.status === 403) {
    return <ForbiddenState />
  }

  if (profileQuery.isError || query.isError) {
    return (
      <ErrorState
        title={t('disputes.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  }

  const disputes = query.data ?? []

  return (
    <section className="mx-auto max-w-4xl space-y-6" aria-labelledby="disputes-heading">
      <div>
        <h1 id="disputes-heading" className="text-3xl font-semibold sm:text-4xl">
          {t('disputes.title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('disputes.description')}</p>
      </div>

      {disputes.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title={t('disputes.emptyTitle')}
            description={t('disputes.emptyDescription')}
          />
          <Button asChild variant="outline">
            <Link to="/orders">{t('disputes.viewOrders')}</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-4" aria-label={t('disputes.listLabel')}>
          {disputes.map((dispute) => (
            <li
              key={dispute.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-background p-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DisputeStatusBadge status={dispute.status} />
                  <span className="text-sm font-medium">
                    {t(`disputes.reason.${dispute.reason}`, { defaultValue: dispute.reason })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('disputes.orderRef', { orderId: dispute.orderId })}
                </p>
                {dispute.createdAt && (
                  <p className="text-xs text-muted-foreground">
                    {t('disputes.createdAt', {
                      date: new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(dispute.createdAt)),
                    })}
                  </p>
                )}
              </div>

              <Button asChild variant="outline" size="sm">
                <Link to={`/orders/${encodeURIComponent(dispute.orderId)}`}>
                  {t('disputes.viewOrderDetail')}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
