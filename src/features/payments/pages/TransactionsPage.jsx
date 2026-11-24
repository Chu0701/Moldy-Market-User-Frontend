import { ArrowUpRight, Check, Clock, Copy, ReceiptText, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useMyPayments } from '@/features/payments/hooks/usePayments'
import { cn } from '@/lib/utils'

function formatShortId(id) {
  if (!id || typeof id !== 'string') return '—'
  return id.length > 12 ? `${id.slice(0, 8)}…` : id
}

function getStatusMeta(status) {
  if (status === 'SUCCESSFUL') {
    return {
      dot: 'bg-success',
      pill: 'border-success/30 bg-success/10 text-success',
    }
  }
  if (status === 'FAILED' || status === 'EXPIRED') {
    return {
      dot: 'bg-destructive',
      pill: 'border-destructive/30 bg-destructive/10 text-destructive',
    }
  }
  return {
    dot: 'bg-warning',
    pill: 'border-warning/30 bg-warning/10 text-warning',
  }
}

function TransactionsSkeleton({ label }) {
  return (
    <section className="mx-auto max-w-5xl space-y-6" role="status">
      <span className="sr-only">{label}</span>
      <div className="space-y-2" aria-hidden="true">
        <div className="skeleton-shimmer h-9 w-40 rounded-md" />
        <div className="skeleton-shimmer h-4 w-72 rounded-sm" />
      </div>
      <div className="kn-table-card divide-y divide-border" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="grid gap-2">
              <div className="skeleton-shimmer h-4 w-28 rounded-sm" />
              <div className="skeleton-shimmer h-3.5 w-44 rounded-sm" />
            </div>
            <div className="skeleton-shimmer h-5 w-24 rounded-sm" />
          </div>
        ))}
      </div>
    </section>
  )
}

export function TransactionsPage() {
  const { t } = useTranslation()
  const { profileQuery, query } = useMyPayments()
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  if (profileQuery.isPending || query.isPending) {
    return <TransactionsSkeleton label={t('transactions.loading')} />
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
  const pendingPayments = payments.filter((payment) => payment.paymentStatus === 'PENDING')
  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredPayments = payments.filter((payment) => {
    if (statusFilter === 'success' && payment.paymentStatus !== 'SUCCESSFUL') return false
    if (
      statusFilter === 'pending' &&
      payment.paymentStatus !== 'PENDING' &&
      payment.paymentStatus !== 'PROCESSING'
    ) {
      return false
    }
    if (
      statusFilter === 'failed' &&
      payment.paymentStatus !== 'FAILED' &&
      payment.paymentStatus !== 'EXPIRED'
    ) {
      return false
    }
    if (!normalizedSearch) return true
    return String(payment.id ?? '')
      .toLowerCase()
      .includes(normalizedSearch)
  })

  const filterTabs = [
    { key: 'all', label: t('transactions.filters.all'), count: payments.length },
    {
      key: 'success',
      label: t('transactions.filters.success'),
      count: payments.filter((p) => p.paymentStatus === 'SUCCESSFUL').length,
    },
    {
      key: 'pending',
      label: t('transactions.filters.pending'),
      count: payments.filter(
        (p) => p.paymentStatus === 'PENDING' || p.paymentStatus === 'PROCESSING',
      ).length,
    },
    {
      key: 'failed',
      label: t('transactions.filters.failed'),
      count: payments.filter((p) => p.paymentStatus === 'FAILED' || p.paymentStatus === 'EXPIRED')
        .length,
    },
  ]

  async function copyPaymentId(id) {
    if (!id || !navigator?.clipboard?.writeText) return
    try {
      await navigator.clipboard.writeText(String(id))
      setCopiedId(id)
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000)
    } catch {
      // Ignore clipboard permission errors.
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6" aria-labelledby="transactions-heading">
      <header className="space-y-1.5">
        <h1 id="transactions-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('transactions.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('transactions.description')}</p>
      </header>

      {payments.length === 0 ? (
        <div className="grid justify-items-start gap-4">
          <EmptyState
            icon={ReceiptText}
            title={t('transactions.emptyTitle')}
            description={t('transactions.emptyDescription')}
            className="w-full"
          />
          <Button asChild variant="outline">
            <Link to="/orders">{t('transactions.viewOrders')}</Link>
          </Button>
        </div>
      ) : (
        <>
          {pendingPayments.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/35 bg-warning/10 px-5 py-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
                <div className="grid gap-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {t('transactions.pendingBannerTitle', { count: pendingPayments.length })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('transactions.pendingBannerHint')}
                  </p>
                </div>
              </div>
              {pendingPayments[0].checkoutGroupId && (
                <Button asChild size="sm">
                  <Link to={`/checkout/${encodeURIComponent(pendingPayments[0].checkoutGroupId)}`}>
                    {t('transactions.payNow')}
                  </Link>
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex flex-wrap items-center gap-1 rounded-xl bg-muted p-1"
              role="group"
              aria-label={t('transactions.filters.label')}
            >
              {filterTabs.map((tab) => {
                const active = statusFilter === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatusFilter(tab.key)}
                    className={cn(
                      'inline-flex min-h-8.5 items-center gap-1.5 rounded-lg px-3 text-xs font-medium whitespace-nowrap transition-[background-color,color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[13px]',
                      active
                        ? 'bg-card text-foreground shadow-xs ring-1 ring-border'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="relative w-full sm:w-60">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('transactions.searchPlaceholder')}
                aria-label={t('transactions.searchPlaceholder')}
                className="kn-input min-h-9.5 pl-9 text-xs sm:text-sm"
              />
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title={t('transactions.emptyFilterTitle')}
              description={t('transactions.emptyFilterDescription')}
            />
          ) : (
            <div className="kn-table-card">
              <div className="kn-table-toolbar">
                <div className="flex items-baseline gap-2.5">
                  <h2 className="font-sans text-sm font-semibold tracking-tight">
                    {t('transactions.listLabel')}
                  </h2>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t('table.rowsCount', { count: filteredPayments.length })}
                  </span>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="hidden h-9.5 items-center gap-4 border-b border-border bg-surface-subtle/90 px-5 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[8.5rem_minmax(0,1fr)_8.5rem_8rem_6.5rem]"
              >
                <span>{t('table.payment')}</span>
                <span>{t('table.method')}</span>
                <span>{t('table.status')}</span>
                <span className="text-right">{t('table.amount')}</span>
                <span className="text-right">{t('table.actions')}</span>
              </div>

              <ul className="divide-y divide-border" aria-label={t('transactions.listLabel')}>
                {filteredPayments.map((payment) => {
                  const meta = getStatusMeta(payment.paymentStatus)
                  const isPending = payment.paymentStatus === 'PENDING'
                  const isCopied = copiedId === payment.id
                  return (
                    <li
                      key={payment.id}
                      className="grid gap-2.5 px-4 py-3.5 text-sm transition-colors duration-150 hover:bg-surface-subtle sm:grid-cols-[8.5rem_minmax(0,1fr)_8.5rem_8rem_6.5rem] sm:items-center sm:gap-4 sm:px-5"
                    >
                      <div className="flex items-center justify-between gap-2 sm:justify-start">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            title={String(payment.id)}
                            className="font-mono text-xs font-medium text-foreground"
                          >
                            {formatShortId(String(payment.id))}
                          </span>
                          <button
                            type="button"
                            onClick={() => void copyPaymentId(payment.id)}
                            aria-label={t(
                              isCopied ? 'transactions.copiedId' : 'transactions.copyId',
                            )}
                            title={t(isCopied ? 'transactions.copiedId' : 'transactions.copyId')}
                            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {isCopied ? (
                              <Check className="size-3 text-success" aria-hidden="true" />
                            ) : (
                              <Copy className="size-3" aria-hidden="true" />
                            )}
                          </button>
                        </div>

                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium sm:hidden',
                            meta.pill,
                          )}
                        >
                          <span
                            className={cn('size-1.5 rounded-full', meta.dot)}
                            aria-hidden="true"
                          />
                          {t(`transactions.status.${payment.paymentStatus}`, {
                            defaultValue: payment.paymentStatus,
                          })}
                        </span>
                      </div>

                      <p className="truncate text-xs text-muted-foreground sm:text-[13px] sm:text-foreground">
                        {t(`transactions.method.${payment.method}`, {
                          defaultValue: payment.method,
                        })}
                      </p>

                      <div className="hidden sm:block">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            meta.pill,
                          )}
                        >
                          <span
                            className={cn('size-1.5 rounded-full', meta.dot)}
                            aria-hidden="true"
                          />
                          {t(`transactions.status.${payment.paymentStatus}`, {
                            defaultValue: payment.paymentStatus,
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 sm:contents">
                        <div className="font-semibold whitespace-nowrap tabular-nums sm:text-right">
                          <ProductPrice value={payment.amount} />
                        </div>

                        <div className="whitespace-nowrap sm:text-right">
                          {payment.checkoutGroupId ? (
                            <Button
                              asChild
                              variant={isPending ? 'default' : 'outline'}
                              size="xs"
                              className="h-8 gap-1 px-2.5 text-xs"
                            >
                              <Link
                                to={`/checkout/${encodeURIComponent(payment.checkoutGroupId)}`}
                                aria-label={t('transactions.viewCheckout')}
                              >
                                <span>
                                  {t(
                                    isPending ? 'transactions.payNow' : 'transactions.detailShort',
                                  )}
                                </span>
                                <ArrowUpRight className="size-3.5" aria-hidden="true" />
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}
