import { useMemo, useState } from 'react'
import { ChevronRight, FileText, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { DisputeDetailModal } from '@/features/disputes/components/DisputeDetailModal'
import { DisputeStatusBadge } from '@/features/disputes/components/DisputeStatusBadge'
import { useMyDisputes } from '@/features/disputes/hooks/useDisputes'
import { OrderDate } from '@/features/orders/components/OrderDate'
import { cn } from '@/lib/utils'

const FILTER_TABS = [
  { key: 'ALL', labelKey: 'disputes.filters.all', match: () => true },
  {
    key: 'IN_PROGRESS',
    labelKey: 'disputes.filters.inProgress',
    match: (d) => d.status === 'OPEN' || d.status === 'PENDING_APPROVAL',
  },
  {
    key: 'APPROVED',
    labelKey: 'disputes.filters.approved',
    match: (d) => d.status === 'APPROVED',
  },
  {
    key: 'REJECTED',
    labelKey: 'disputes.filters.rejected',
    match: (d) => d.status === 'REJECTED',
  },
  {
    key: 'CANCELLED',
    labelKey: 'disputes.filters.withdrawn',
    match: (d) => d.status === 'CANCELLED',
  },
]

function DisputeListSkeleton() {
  return (
    <div className="kn-table-card" aria-busy="true">
      <div className="divide-y divide-border">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            <div className="skeleton-shimmer size-16 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-shimmer h-4 w-48 rounded" />
              <div className="skeleton-shimmer h-3.5 w-64 rounded" />
              <div className="skeleton-shimmer h-3 w-36 rounded" />
            </div>
            <div className="skeleton-shimmer h-9 w-28 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DisputeGuideSection() {
  const { t } = useTranslation()
  const steps = [
    {
      num: '1',
      title: t('disputes.guide.step1Title'),
      body: t('disputes.guide.step1Body'),
    },
    {
      num: '2',
      title: t('disputes.guide.step2Title'),
      body: t('disputes.guide.step2Body'),
    },
    {
      num: '3',
      title: t('disputes.guide.step3Title'),
      body: t('disputes.guide.step3Body'),
    },
  ]

  return (
    <aside
      aria-labelledby="dispute-guide-heading"
      className="rounded-xl border border-border bg-surface-subtle/60 p-5 sm:p-6"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-success/10 text-success">
          <ShieldCheck aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 id="dispute-guide-heading" className="text-sm font-semibold text-foreground">
            {t('disputes.guide.title')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('disputes.guide.subtitle')}</p>
        </div>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((step) => (
          <li key={step.num} className="rounded-lg border border-border bg-background p-3.5">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {step.num}
            </span>
            <p className="mt-2 text-sm font-medium text-foreground">{step.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </aside>
  )
}

export function DisputeListPage() {
  const { t } = useTranslation()
  const { profileQuery, query } = useMyDisputes()
  const [activeTab, setActiveTab] = useState('ALL')
  const [selectedDispute, setSelectedDispute] = useState(null)

  const disputes = useMemo(() => query.data ?? [], [query.data])

  const counts = useMemo(() => {
    const map = {}
    for (const tab of FILTER_TABS) {
      map[tab.key] = disputes.filter(tab.match).length
    }
    return map
  }, [disputes])

  const filteredDisputes = useMemo(() => {
    const tab = FILTER_TABS.find((item) => item.key === activeTab) ?? FILTER_TABS[0]
    return disputes.filter(tab.match)
  }, [disputes, activeTab])

  if (profileQuery.isPending || query.isPending) {
    return (
      <section className="mx-auto max-w-5xl space-y-6" aria-labelledby="disputes-heading">
        <header className="space-y-1.5">
          <h1 id="disputes-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('disputes.title')}
          </h1>
          <p role="status" className="text-sm text-muted-foreground">
            {t('disputes.loading')}
          </p>
        </header>
        <DisputeListSkeleton />
      </section>
    )
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

  return (
    <section className="mx-auto max-w-5xl space-y-6" aria-labelledby="disputes-heading">
      <header className="space-y-1.5">
        <h1
          id="disputes-heading"
          className="scroll-mt-24 text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {t('disputes.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('disputes.description')}</p>
      </header>

      {disputes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileText aria-hidden="true" className="size-5" />
            </span>
            <EmptyState
              title={t('disputes.emptyTitle')}
              description={t('disputes.emptyDescription')}
            />
            <Button asChild variant="outline" className="mt-4">
              <Link to="/orders">{t('disputes.viewOrders')}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div
            role="tablist"
            aria-label={t('disputes.filters.label')}
            className="flex items-center gap-1.5 overflow-x-auto pb-1"
          >
            {FILTER_TABS.map((tab) => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                  )}
                >
                  <span>{t(tab.labelKey)}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[11px] tabular-nums',
                      active
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {counts[tab.key]}
                  </span>
                </button>
              )
            })}
          </div>

          {filteredDisputes.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface-subtle/60 px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                {t('disputes.filters.emptyFiltered')}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('ALL')}
                className="mt-3"
              >
                {t('disputes.filters.showAll')}
              </Button>
            </div>
          ) : (
            <div className="kn-table-card">
              <div className="kn-table-toolbar">
                <div className="flex items-baseline gap-2.5">
                  <h2 className="text-sm font-semibold tracking-tight">
                    {t('disputes.listLabel')}
                  </h2>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t('table.rowsCount', { count: filteredDisputes.length })}
                  </span>
                </div>
              </div>

              <ul className="divide-y divide-border" aria-label={t('disputes.listLabel')}>
                {filteredDisputes.map((dispute) => {
                  const displayOrderCode = dispute.orderCode || dispute.orderId
                  const isInProgress =
                    dispute.status === 'OPEN' || dispute.status === 'PENDING_APPROVAL'

                  return (
                    <li
                      key={dispute.id}
                      className="flex flex-col gap-4 px-4 py-4 transition-colors duration-150 hover:bg-surface-subtle sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDispute(dispute)}
                          aria-label={t('disputes.openDetailAria', { code: displayOrderCode })}
                          className="size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ImageWithFallback
                            src={dispute.firstItemImageUrl}
                            alt={dispute.firstItemTitle || displayOrderCode}
                            compact
                            className="size-full"
                          />
                        </button>

                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <DisputeStatusBadge status={dispute.status} />
                            <button
                              type="button"
                              onClick={() => setSelectedDispute(dispute)}
                              className="truncate text-left text-sm font-semibold text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {dispute.firstItemTitle ||
                                t(`disputes.reason.${dispute.reason}`, {
                                  defaultValue: dispute.reason,
                                })}
                            </button>
                          </div>

                          {dispute.firstItemTitle && (
                            <p className="text-xs text-muted-foreground">
                              {t(`disputes.reason.${dispute.reason}`, {
                                defaultValue: dispute.reason,
                              })}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <Link
                              to={`/orders/${encodeURIComponent(dispute.orderId)}`}
                              className="font-mono font-medium text-foreground underline-offset-4 hover:underline"
                            >
                              {t('disputes.orderRef', { orderId: displayOrderCode })}
                            </Link>
                            {dispute.createdAt && (
                              <span className="tabular-nums">
                                <OrderDate value={dispute.createdAt} />
                              </span>
                            )}
                          </div>

                          {dispute.status === 'APPROVED' && dispute.totalAmount != null && (
                            <p className="text-xs font-medium text-success">
                              {t('disputes.outcomeApprovedPrefix')}{' '}
                              <ProductPrice
                                value={dispute.totalAmount}
                                className="font-semibold tabular-nums"
                              />{' '}
                              {t('disputes.outcomeApprovedSuffix')}
                            </p>
                          )}

                          {dispute.status === 'REJECTED' && dispute.decisionNote && (
                            <p className="line-clamp-1 text-xs font-medium text-destructive">
                              {t('disputes.outcomeRejectedPrefix', { note: dispute.decisionNote })}
                            </p>
                          )}

                          {isInProgress && (
                            <p className="text-xs text-muted-foreground">
                              {t('disputes.escrowHoldShort')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 sm:flex-col sm:items-end">
                        {dispute.totalAmount != null && (
                          <ProductPrice
                            value={dispute.totalAmount}
                            className="text-sm font-semibold text-foreground tabular-nums"
                          />
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDispute(dispute)}
                          >
                            <span>{t('disputes.viewDetail')}</span>
                            <ChevronRight aria-hidden="true" className="size-3.5" />
                          </Button>
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/orders/${encodeURIComponent(dispute.orderId)}`}>
                              {t('disputes.viewOrderDetail')}
                            </Link>
                          </Button>
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

      <DisputeGuideSection />

      {selectedDispute && (
        <DisputeDetailModal summary={selectedDispute} onClose={() => setSelectedDispute(null)} />
      )}
    </section>
  )
}
