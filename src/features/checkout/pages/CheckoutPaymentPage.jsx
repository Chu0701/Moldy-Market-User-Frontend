import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { getCheckoutStage } from '@/features/checkout/checkoutPayment'
import { isAmbiguousCheckoutError } from '@/features/checkout/checkoutPayment'
import { CancelCheckoutButton } from '@/features/checkout/components/CancelCheckoutButton'
import { useCancelCheckout } from '@/features/checkout/hooks/useCancelCheckout'
import { CheckoutPaymentOrders } from '@/features/checkout/components/CheckoutPaymentOrders'
import { CheckoutPaymentStatus } from '@/features/checkout/components/CheckoutPaymentStatus'
import { useCheckout } from '@/features/checkout/hooks/useCheckout'

export function CheckoutPaymentPage() {
  const { checkoutGroupId } = useParams()
  const { t } = useTranslation()
  const query = useCheckout(checkoutGroupId)
  const cancel = useCancelCheckout(checkoutGroupId)
  if (query.isPending) return <p role="status">{t('checkoutPayment.loading')}</p>
  if (query.error?.status === 403) return <ForbiddenState />
  if (query.error?.status === 404)
    return (
      <EmptyState
        title={t('checkoutPayment.notFound')}
        description={t('checkoutPayment.notFoundDescription')}
      />
    )
  if (query.isError && !query.data)
    return (
      <ErrorState
        title={t('checkoutPayment.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )

  const checkout = query.data
  const stage = getCheckoutStage(checkout)
  return (
    <section className="checkout-page" aria-labelledby="checkout-payment-title">
      <div className="order-heading">
        <h1
          id="checkout-payment-title"
          className="scroll-mt-24 text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {t('checkoutPayment.title')}
        </h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            const result = await query.refetch()
            if (!result.isError) cancel.reset()
          }}
          disabled={query.isFetching || cancel.isPending}
        >
          <RefreshCw
            aria-hidden="true"
            className={query.isFetching ? 'size-4 animate-spin' : 'size-4'}
          />
          <span>{t('checkoutPayment.refresh')}</span>
        </Button>
      </div>
      {query.isRefetchError && (
        <p role="alert" className="checkout-notice">
          {t('checkoutPayment.refreshError')}
        </p>
      )}
      <div className="checkout-grid">
        <div className="grid content-start gap-4">
          <CheckoutPaymentStatus
            checkout={checkout}
            stage={stage}
            allowQr={
              !query.isError &&
              !cancel.isPending &&
              !cancel.isSuccess &&
              !isAmbiguousCheckoutError(cancel.error)
            }
          />
          <CancelCheckoutButton
            checkout={checkout}
            mutation={cancel}
            disabled={
              query.isError ||
              query.isFetching ||
              cancel.isSuccess ||
              isAmbiguousCheckoutError(cancel.error)
            }
          />
        </div>
        <aside className="checkout-panel" aria-labelledby="checkout-payment-total">
          <h2 id="checkout-payment-total">{t('checkoutPayment.total')}</h2>
          <ProductPrice value={checkout.totalAmount} className="text-2xl font-semibold" />
          {Number(checkout.discountAmount) > 0 && (
            <p className="flex flex-wrap justify-between gap-3 text-sm text-primary">
              <span>
                {checkout.voucherCode
                  ? t('checkout.voucher.discountLabel', { code: checkout.voucherCode })
                  : t('checkoutPayment.discount')}
              </span>
              <span>
                -<ProductPrice value={checkout.discountAmount} />
              </span>
            </p>
          )}
          <p>
            {t('checkoutPayment.method')}:{' '}
            {['COD', 'ONLINE_BANKING'].includes(checkout.paymentResponse?.method)
              ? t('checkout.methods.' + checkout.paymentResponse.method)
              : t('checkoutPayment.unknownMethod')}
          </p>
          <p className="text-sm text-muted-foreground">{t('checkoutPayment.serverAmount')}</p>
          <p className="flex items-start gap-2 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
            <span>{t('products.detail.protectionDesc')}</span>
          </p>
          <div className="grid justify-items-start gap-3 border-t border-border pt-3">
            <Link to="/orders" className="underline underline-offset-4">
              {t('checkoutPayment.viewOrders')}
            </Link>
            <Link to="/cart" className="underline underline-offset-4">
              {t('checkout.backToCart')}
            </Link>
          </div>
        </aside>
      </div>
      <CheckoutPaymentOrders orders={checkout.orders} />
    </section>
  )
}
