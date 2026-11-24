import { ArrowLeft, Check, Copy, ShieldCheck, Store } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { OrderDisputePanel } from '@/features/disputes/components/OrderDisputePanel'
import { BuyerOrderTimeline } from '@/features/orders/components/BuyerOrderTimeline'
import { CancelOrderButton } from '@/features/orders/components/CancelOrderButton'
import { ConfirmReceivedButton } from '@/features/orders/components/ConfirmReceivedButton'
import { OrderDate } from '@/features/orders/components/OrderDate'
import { OrderItems } from '@/features/orders/components/OrderItems'
import { OrderStatusLabel } from '@/features/orders/components/OrderStatusLabel'
import { useMyOrders } from '@/features/orders/hooks/useMyOrders'
import { OrderReviewPanel } from '@/features/reviews/components/OrderReviewPanel'

function getEscrowSummaryKey(order) {
  if (order.status === 'REFUNDED') return 'orders.escrow.refunded'
  if (order.status === 'DISPUTED') return 'orders.escrow.disputed'
  if (order.status === 'CANCELLED' || order.status === 'EXPIRED') return 'orders.escrow.cancelled'
  if (order.paymentMethod === 'COD') {
    return order.status === 'COMPLETED' ? 'orders.escrow.codCompleted' : 'orders.escrow.codActive'
  }
  if (order.status === 'PENDING_PAYMENT') return 'orders.escrow.pendingPayment'
  if (order.status === 'COMPLETED') return 'orders.escrow.released'
  return 'orders.escrow.holding'
}

export function OrderDetailPage() {
  const { t } = useTranslation()
  const { orderId } = useParams()
  const query = useMyOrders()
  const [copied, setCopied] = useState(false)

  if (query.isPending) return <p role="status">{t('orders.loading')}</p>
  if (query.error?.status === 403) return <ForbiddenState />
  if (query.isError) {
    return (
      <ErrorState
        title={t('orders.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  }

  const order = query.data.find((item) => item.id === orderId)
  const backLink = (
    <div>
      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <Link to="/orders">
          <ArrowLeft aria-hidden="true" className="size-4" />
          <span>{t('orders.backToOrders')}</span>
        </Link>
      </Button>
    </div>
  )

  if (!order) {
    return (
      <section className="orders-page">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('orders.detailHeading')}
        </h1>
        <EmptyState
          title={t('orders.notFoundTitle')}
          description={t('orders.notFoundDescription')}
        />
        {backLink}
      </section>
    )
  }

  const itemsSubtotal = (order.items ?? []).reduce(
    (sum, item) => sum + Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1),
    0,
  )
  const escrowKey = getEscrowSummaryKey(order)

  async function handleCopyCode() {
    if (!order.orderCode || !navigator?.clipboard?.writeText) return
    try {
      await navigator.clipboard.writeText(order.orderCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore clipboard failures in restricted environments.
    }
  }

  return (
    <section className="orders-page" aria-labelledby="order-detail-title">
      {backLink}

      <header className="order-heading items-start">
        <div className="grid gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1
              id="order-detail-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {t('orders.detailTitle', {
                code: order.orderCode,
              })}
            </h1>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={t(copied ? 'orders.copiedCode' : 'orders.copyCode')}
              title={t(copied ? 'orders.copiedCode' : 'orders.copyCode')}
              onClick={() => void handleCopyCode()}
              className="rounded-md text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <Check className="size-3.5 text-success" aria-hidden="true" />
              ) : (
                <Copy className="size-3.5" aria-hidden="true" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums sm:text-sm">
            {t('orders.createdAt')} <OrderDate value={order.createdAt} />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <OrderStatusLabel status={order.status} />
          {order.storeId && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to={`/stores/${encodeURIComponent(order.storeId)}`}>
                <Store aria-hidden="true" className="size-3.5" />
                <span>{t('cart.visitStore')}</span>
              </Link>
            </Button>
          )}
          {order.checkoutGroupId && order.status === 'PENDING_PAYMENT' && (
            <Button asChild size="sm">
              <Link to={'/checkout/' + encodeURIComponent(order.checkoutGroupId)}>
                {t('checkoutPayment.continuePayment')}
              </Link>
            </Button>
          )}
          <ConfirmReceivedButton order={order} />
          <CancelOrderButton order={order} />
        </div>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-subtle px-5 py-4 text-sm">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-foreground" aria-hidden="true" />
        <div className="grid gap-0.5">
          <p className="font-semibold text-foreground">{t('orders.escrow.title')}</p>
          <p className="text-xs leading-5 text-muted-foreground sm:text-sm">{t(escrowKey)}</p>
        </div>
      </div>

      <div className="order-detail-grid">
        <section className="order-card" aria-labelledby="order-products-title">
          <h2
            id="order-products-title"
            className="font-sans text-base font-semibold tracking-tight"
          >
            {t('orders.products')}
          </h2>

          <OrderItems items={order.items} linkProducts />

          <div className="grid gap-2 border-t border-border pt-4 text-sm">
            {itemsSubtotal > 0 && (
              <div className="flex flex-wrap justify-between gap-3 text-muted-foreground">
                <span>{t('orders.itemsSubtotal')}</span>
                <ProductPrice value={itemsSubtotal} className="tabular-nums" />
              </div>
            )}
            {order.shippingFee != null && (
              <div className="flex flex-wrap justify-between gap-3 text-muted-foreground">
                <span>{t('orders.shippingFee')}</span>
                <ProductPrice value={order.shippingFee} className="tabular-nums" />
              </div>
            )}
            {Number(order.shopDiscount) > 0 && (
              <div className="flex flex-wrap justify-between gap-3 text-success">
                <span>{t('orders.shopDiscount')}</span>
                <span className="tabular-nums">
                  -<ProductPrice value={order.shopDiscount} />
                </span>
              </div>
            )}
            {Number(order.platformDiscount) > 0 && (
              <div className="flex flex-wrap justify-between gap-3 text-success">
                <span>{t('orders.platformDiscount')}</span>
                <span className="tabular-nums">
                  -<ProductPrice value={order.platformDiscount} />
                </span>
              </div>
            )}
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3 border-t border-border pt-3">
              <p className="font-semibold text-foreground">{t('orders.total')}</p>
              <ProductPrice
                value={order.totalAmount}
                className="text-xl font-semibold tracking-tight tabular-nums"
              />
            </div>
          </div>
        </section>

        <section className="order-card" aria-labelledby="order-delivery-title">
          <h2
            id="order-delivery-title"
            className="font-sans text-base font-semibold tracking-tight"
          >
            {t('orders.deliveryTitle')}
          </h2>
          <dl className="order-delivery">
            <div>
              <dt>{t('orders.receiverName')}</dt>
              <dd className="text-sm font-medium text-foreground">{order.receiverName}</dd>
            </div>
            <div>
              <dt>{t('orders.receiverPhone')}</dt>
              <dd className="text-sm font-medium text-foreground tabular-nums">
                {order.receiverPhone}
              </dd>
            </div>
            <div>
              <dt>{t('orders.shippingAddress')}</dt>
              <dd className="text-sm leading-6 whitespace-pre-wrap text-foreground">
                {order.shippingAddress}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <BuyerOrderTimeline order={order} />

      <OrderDisputePanel order={order} />
      <OrderReviewPanel order={order} />
    </section>
  )
}
