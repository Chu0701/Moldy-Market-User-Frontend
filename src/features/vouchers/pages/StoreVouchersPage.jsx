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
    <section className="mx-auto max-w-4xl space-y-6" aria-labelledby="store-vouchers-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link to="/store" className="text-sm underline underline-offset-4">
            {t('stores.myStoreTitle')}
          </Link>
          <h1 id="store-vouchers-heading" className="text-3xl font-semibold sm:text-4xl">
            {t('vouchers.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('vouchers.description')}</p>
        </div>

        {!formMode && (
          <Button type="button" onClick={() => setFormMode({ kind: 'create' })}>
            {t('vouchers.createTitle')}
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
        <p role="alert" className="rounded-lg border border-border p-4 text-sm text-destructive">
          {t('vouchers.errors.generic')}
        </p>
      )}

      {vouchers.length === 0 ? (
        <EmptyState title={t('vouchers.emptyTitle')} description={t('vouchers.emptyDescription')} />
      ) : (
        <ul className="space-y-4" aria-label={t('vouchers.listLabel')}>
          {vouchers.map((voucher) => (
            <li
              key={voucher.code}
              className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-background p-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-base font-semibold">{voucher.code}</span>
                  <span className="rounded-md border border-border bg-accent px-2 py-0.5 text-xs">
                    {t(voucher.active ? 'vouchers.status.active' : 'vouchers.status.inactive')}
                  </span>
                </div>

                <p className="text-sm">
                  {voucher.discountType === 'PERCENT' ? (
                    t('vouchers.discountPercent', { value: voucher.discountValue })
                  ) : (
                    <span>
                      {t('vouchers.discountFixedPrefix')}{' '}
                      <ProductPrice value={voucher.discountValue} className="font-medium" />
                    </span>
                  )}
                </p>

                <p className="text-xs text-muted-foreground">
                  {t('vouchers.remaining', { count: voucher.remainingQuantity })} ·{' '}
                  {t('vouchers.expiresAt', {
                    date: new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(voucher.expiredAt)),
                  })}
                </p>

                {(voucher.minimumOrderValue != null || voucher.maximumDiscount != null) && (
                  <p className="text-xs text-muted-foreground">
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

              <div className="flex flex-wrap gap-2">
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
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
