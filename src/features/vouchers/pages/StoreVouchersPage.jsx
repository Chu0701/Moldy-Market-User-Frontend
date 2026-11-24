import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { StoreVoucherForm } from '@/features/vouchers/components/StoreVoucherForm'
import { useStoreVouchers } from '@/features/vouchers/hooks/useStoreVouchers'

export function StoreVouchersPage() {
  const { t, i18n } = useTranslation()
  const [formMode, setFormMode] = useState(null) // null | { kind: 'create' } | { kind: 'edit', voucher }
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

  const handleSubmit = (payload) => {
    if (formMode?.kind === 'edit') {
      updateMutation.mutate(payload, {
        onSuccess: () => setFormMode(null),
      })
      return
    }
    createMutation.mutate(payload, {
      onSuccess: () => setFormMode(null),
    })
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6" aria-labelledby="store-vouchers-heading">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/store"
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t('stores.myStoreTitle')}
          </Link>
          <h1
            id="store-vouchers-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {t('vouchers.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('vouchers.description')}</p>
        </div>

        {!formMode && (
          <Button type="button" onClick={() => setFormMode({ kind: 'create' })}>
            {t('vouchers.createTitle')}
          </Button>
        )}
      </header>

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
        <EmptyState title={t('vouchers.emptyTitle')} description={t('vouchers.emptyDescription')} />
      ) : (
        <div className="kn-table-card">
          <div className="kn-table-toolbar">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-sm font-semibold tracking-tight">{t('vouchers.listLabel')}</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {t('table.rowsCount', { count: vouchers.length })}
              </span>
            </div>
          </div>

          <div className="kn-table-scroll">
            <table className="kn-table" aria-label={t('vouchers.listLabel')}>
              <thead>
                <tr>
                  <th scope="col">{t('table.code')}</th>
                  <th scope="col">{t('table.status')}</th>
                  <th scope="col">{t('table.discount')}</th>
                  <th scope="col">{t('table.conditions')}</th>
                  <th scope="col" className="text-right">
                    {t('table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((voucher) => (
                  <tr key={voucher.code}>
                    <td className="font-mono text-sm font-semibold whitespace-nowrap text-foreground">
                      {voucher.code}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-foreground">
                        <span
                          className={`size-1.5 rounded-full ${voucher.active ? 'bg-success' : 'bg-muted-foreground'}`}
                          aria-hidden="true"
                        />
                        {t(voucher.active ? 'vouchers.status.active' : 'vouchers.status.inactive')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap font-medium tabular-nums">
                      {voucher.discountType === 'PERCENT' ? (
                        t('vouchers.discountPercent', { value: voucher.discountValue })
                      ) : (
                        <span>
                          {t('vouchers.discountFixedPrefix')}{' '}
                          <ProductPrice value={voucher.discountValue} className="font-semibold" />
                        </span>
                      )}
                    </td>
                    <td>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {t('vouchers.remaining', { count: voucher.remainingQuantity })} ·{' '}
                        {t('vouchers.expiresAt', {
                          date: new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(voucher.expiredAt)),
                        })}
                      </p>
                      {(voucher.minimumOrderValue != null || voucher.maximumDiscount != null) && (
                        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
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
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormMode({ kind: 'edit', voucher })}
                        >
                          {t('vouchers.editAction')}
                        </Button>
                        {voucher.active && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                              deactivateMutation.isPending &&
                              deactivateMutation.variables?.code === voucher.code
                            }
                            onClick={() => deactivateMutation.mutate({ code: voucher.code })}
                          >
                            {t('vouchers.deactivateAction')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
