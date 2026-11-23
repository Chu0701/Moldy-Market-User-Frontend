import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useMyPayments } from '@/features/payments/hooks/usePayments'

export function TransactionsPage() {
  const { t } = useTranslation()
  const { profileQuery, query } = useMyPayments()

  if (profileQuery.isPending || query.isPending) {
    return <p role="status">{t('transactions.loading')}</p>
  }

  if (query.error?.status === 403) {
    return <ForbiddenState />
  }

  if (profileQuery.isError || query.isError) {
    return (
      <ErrorState
        title={t('transactions.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  }

  const payments = query.data ?? []

  return (
    <section className="mx-auto max-w-4xl space-y-6" aria-labelledby="transactions-heading">
      <div>
        <h1 id="transactions-heading" className="text-3xl font-semibold sm:text-4xl">
          {t('transactions.title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('transactions.description')}</p>
      </div>

      {payments.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title={t('transactions.emptyTitle')}
            description={t('transactions.emptyDescription')}
          />
          <Button asChild variant="outline">
            <Link to="/orders">{t('transactions.viewOrders')}</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-4" aria-label={t('transactions.listLabel')}>
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-background p-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <ProductPrice value={payment.amount} className="text-lg font-semibold" />
                  <span className="rounded-md border border-border bg-accent px-2 py-0.5 text-xs font-medium">
                    {t(`transactions.status.${payment.paymentStatus}`, {
                      defaultValue: payment.paymentStatus,
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('transactions.methodLabel')}:{' '}
                  {t(`transactions.method.${payment.method}`, { defaultValue: payment.method })}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {t('transactions.idLabel', { id: payment.id })}
                </p>
              </div>

              {payment.checkoutGroupId && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/checkout/${encodeURIComponent(payment.checkoutGroupId)}`}>
                    {t('transactions.viewCheckout')}
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
