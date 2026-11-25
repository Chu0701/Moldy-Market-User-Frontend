import { useState } from 'react'
import { ArrowLeft, Check, Copy, Plus, TicketPercent } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import { StoreVoucherForm } from '@/features/vouchers/components/StoreVoucherForm'
import { useStoreVouchers } from '@/features/vouchers/hooks/useStoreVouchers'
import { cn } from '@/lib/utils'

export function StoreVouchersPage() {
  const { t, i18n } = useTranslation()
  const { pushToast } = useToast()
  const [formMode, setFormMode] = useState(null) // null | { kind: 'create' } | { kind: 'edit', voucher }
  const [statusTab, setStatusTab] = useState('ALL')
  const [copiedCode, setCopiedCode] = useState(null)
  const { isOwner, profileQuery, listQuery, createMutation, updateMutation, deactivateMutation } =
    useStoreVouchers()

  if (profileQuery.isPending) {
    return <p role="status">{t('vouchers.loading')}</p>
  }

  if (!isOwner || listQuery.error?.status === 403) {
    return <ForbiddenState />
  }

  if (listQuery.isPending) {
    return <p role="status">{t('vouchers.loading')}</p>
  }

  if (listQuery.isError) {
    return (
      <ErrorState
        title={t('vouchers.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void listQuery.refetch()}
        isRetrying={listQuery.isFetching}
      />
    )
  }

  const vouchers = listQuery.data ?? []
  const activeCount = vouchers.filter((v) => v.active).length
  const inactiveCount = vouchers.length - activeCount
  const filteredVouchers = vouchers.filter((v) => {
    if (statusTab === 'ACTIVE') return Boolean(v.active)
    if (statusTab === 'INACTIVE') return !v.active
    return true
  })

  const statusTabs = [
    { key: 'ALL', label: t('vouchers.tabs.all'), count: vouchers.length },
    { key: 'ACTIVE', label: t('vouchers.status.active'), count: activeCount },
    { key: 'INACTIVE', label: t('vouchers.status.inactive'), count: inactiveCount },
  ]

  async function handleCopyCode(code) {
    try {
      await navigator.clipboard?.writeText(code)
      setCopiedCode(code)
      pushToast(t('stores.voucherCopied', { code }), 'success')
      window.setTimeout(() => setCopiedCode((current) => (current === code ? null : current)), 2000)
    } catch {
      // Ignore clipboard failures in restricted environments.
    }
  }

  const handleSubmit = (payload) => {
    if (formMode?.kind === 'edit') {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          setFormMode(null)
          pushToast(t('vouchers.savedToast'), 'success')
        },
      })
      return
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        setFormMode(null)
        pushToast(t('vouchers.createdToast'), 'success')
      },
    })
  }

  return (
    <section
      className="flex w-full min-w-0 flex-col gap-5 pt-2"
      aria-labelledby="store-vouchers-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <Link
            to="/store"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            <span>{t('stores.myStoreTitle')}</span>
          </Link>
          <h1
            id="store-vouchers-heading"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {t('vouchers.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('vouchers.description')}</p>
        </div>

        {!formMode && (
          <Button
            type="button"
            size="sm"
            className="h-9.5 gap-1.5"
            onClick={() => setFormMode({ kind: 'create' })}
          >
            <Plus aria-hidden="true" className="size-4" />
            <span>{t('vouchers.createTitle')}</span>
          </Button>
        )}
      </div>

      {formMode && (
        <StoreVoucherForm
          key={formMode.kind === 'edit' ? formMode.voucher.code : 'create'}
          initialVoucher={formMode.kind === 'edit' ? formMode.voucher : null}
          isPending={createMutation.isPending || updateMutation.isPending}
          error={formMode.kind === 'edit' ? updateMutation.error : createMutation.error}
          onSubmit={handleSubmit}
          onCancel={() => setFormMode(null)}
        />
      )}

      {deactivateMutation.isError && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive"
        >
          {t('vouchers.errors.generic')}
        </p>
      )}

      {vouchers.length === 0 ? (
        <EmptyState
          icon={TicketPercent}
          title={t('vouchers.emptyTitle')}
          description={t('vouchers.emptyDescription')}
        />
      ) : (
        <div className="grid gap-4">
          <div
            role="group"
            aria-label={t('table.status')}
            className="flex items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {statusTabs.map((tab) => {
              const active = statusTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusTab(tab.key)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'border-foreground font-semibold text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                  )}
                >
                  <span>{tab.label}</span>
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums">
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {filteredVouchers.length === 0 ? (
            <EmptyState
              icon={TicketPercent}
              title={t('vouchers.emptyFilterTitle')}
              description={t('vouchers.emptyFilterDescription')}
            />
          ) : (
            <div className="w-full min-w-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-border lg:bg-card">
              {/* Desktop table header — fixed columns + sole flexible Conditions column, zero horizontal scroll */}
              <div
                aria-hidden="true"
                className="hidden border-b border-border bg-surface-subtle/80 px-4 py-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase lg:grid lg:grid-cols-[148px_104px_minmax(0,1fr)_96px_132px] lg:items-center lg:gap-x-3"
              >
                <span className="whitespace-nowrap">{t('table.code')}</span>
                <span className="whitespace-nowrap">{t('table.discount')}</span>
                <span className="pr-3 whitespace-nowrap">{t('table.conditions')}</span>
                <span className="whitespace-nowrap">{t('table.status')}</span>
                <span className="text-right whitespace-nowrap">{t('table.actions')}</span>
              </div>

              <ul className="space-y-3 lg:space-y-0" aria-label={t('vouchers.listLabel')}>
                {filteredVouchers.map((voucher) => {
                  const isCopied = copiedCode === voucher.code
                  return (
                    <li key={voucher.code}>
                      <article
                        className={cn(
                          'rounded-xl border border-border bg-card transition-colors hover:bg-surface-subtle/60 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b',
                          !voucher.active && 'opacity-70 hover:opacity-100',
                        )}
                      >
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2.5 px-4 py-3 lg:min-h-[64px] lg:grid-cols-[148px_104px_minmax(0,1fr)_96px_132px] lg:items-center lg:gap-x-3 lg:gap-y-0 lg:py-2.5">
                          {/* Col 1: Code + 1-click Copy */}
                          <div className="order-1 flex min-w-0 items-center gap-1.5">
                            <span className="truncate font-mono text-sm font-semibold text-foreground">
                              {voucher.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleCopyCode(voucher.code)}
                              aria-label={`${t('stores.copyVoucher')}: ${voucher.code}`}
                              title={t('stores.copyVoucher')}
                              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              {isCopied ? (
                                <Check aria-hidden="true" className="size-3.5 text-success" />
                              ) : (
                                <Copy aria-hidden="true" className="size-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Col 4 on desktop, top-right on mobile: Status */}
                          <div className="order-2 flex items-center justify-end lg:order-4 lg:justify-start">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                                voucher.active
                                  ? 'border-emerald-200/80 bg-emerald-50/70 text-emerald-700'
                                  : 'border-border bg-muted/60 text-muted-foreground',
                              )}
                            >
                              <span
                                className={cn(
                                  'size-1.5 rounded-full',
                                  voucher.active ? 'bg-emerald-500' : 'bg-muted-foreground/60',
                                )}
                                aria-hidden="true"
                              />
                              <span>
                                {t(
                                  voucher.active
                                    ? 'vouchers.status.active'
                                    : 'vouchers.status.inactive',
                                )}
                              </span>
                            </span>
                          </div>

                          {/* Col 2: Discount */}
                          <div className="order-3 min-w-0 text-sm font-semibold whitespace-nowrap text-foreground tabular-nums lg:order-2">
                            {voucher.discountType === 'PERCENT' ? (
                              t('vouchers.discountPercent', { value: voucher.discountValue })
                            ) : (
                              <span>
                                {t('vouchers.discountFixedPrefix')}{' '}
                                <ProductPrice value={voucher.discountValue} />
                              </span>
                            )}
                          </div>

                          {/* Col 3: Conditions & expiry (sole flexible column) */}
                          <div className="order-4 col-span-2 min-w-0 pr-2 lg:order-3 lg:col-span-1 lg:pr-3">
                            <p className="truncate text-xs text-muted-foreground tabular-nums">
                              {t('vouchers.remaining', { count: voucher.remainingQuantity })} ·{' '}
                              {t('vouchers.expiresAt', {
                                date: new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                }).format(new Date(voucher.expiredAt)),
                              })}
                            </p>
                            {(voucher.minimumOrderValue != null ||
                              voucher.maximumDiscount != null) && (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
                                {voucher.minimumOrderValue != null && (
                                  <span>
                                    {t('vouchers.minOrderLabel')}:{' '}
                                    <ProductPrice value={voucher.minimumOrderValue} />{' '}
                                  </span>
                                )}
                                {voucher.maximumDiscount != null && (
                                  <span>
                                    {t('vouchers.maxDiscountLabel')}:{' '}
                                    <ProductPrice value={voucher.maximumDiscount} />
                                  </span>
                                )}
                              </p>
                            )}
                          </div>

                          {/* Col 5: Actions */}
                          <div className="order-5 col-span-2 flex items-center justify-end gap-1.5 border-t border-border/60 pt-2 lg:col-span-1 lg:border-t-0 lg:pt-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => setFormMode({ kind: 'edit', voucher })}
                            >
                              {t('vouchers.editAction')}
                            </Button>
                            {voucher.active && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                disabled={
                                  deactivateMutation.isPending &&
                                  deactivateMutation.variables?.code === voucher.code
                                }
                                onClick={() =>
                                  deactivateMutation.mutate(
                                    { code: voucher.code },
                                    {
                                      onSuccess: () =>
                                        pushToast(t('vouchers.deactivatedToast'), 'info'),
                                    },
                                  )
                                }
                              >
                                {t('vouchers.deactivateAction')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </article>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
