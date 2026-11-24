import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { BuyerOrderTimeline } from '@/features/orders/components/BuyerOrderTimeline'
import { CancelOrderButton } from '@/features/orders/components/CancelOrderButton'
import { OrderDate } from '@/features/orders/components/OrderDate'
import { OrderItems } from '@/features/orders/components/OrderItems'
import { OrderStatusLabel } from '@/features/orders/components/OrderStatusLabel'
import { useMyOrders } from '@/features/orders/hooks/useMyOrders'
import { OrderDisputePanel } from '@/features/disputes/components/OrderDisputePanel'

export function OrderDetailPage() {
  const { t } = useTranslation()
  const { orderId } = useParams()
  const query = useMyOrders()

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
    <Link to="/orders" className="underline underline-offset-4">
      {t('orders.backToOrders')}
    </Link>
  )

  if (!order) {
    return (
      <section className="orders-page">
        <h1>{t('orders.detailHeading')}</h1>
        <EmptyState
          title={t('orders.notFoundTitle')}
          description={t('orders.notFoundDescription')}
        />
        {backLink}
      </section>
    )
  }

  return (
    <section className="orders-page" aria-labelledby="order-detail-title">
      {backLink}
      <div className="order-heading">
        <div className="grid gap-2">
          <h1 id="order-detail-title">
            {t('orders.detailTitle', {
              code: order.orderCode,
            })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('orders.createdAt')} <OrderDate value={order.createdAt} />
          </p>
        </div>
        <div className="grid justify-items-start gap-3">
          <OrderStatusLabel status={order.status} />
          {order.checkoutGroupId && order.status === 'PENDING_PAYMENT' && (
            <Link
              className="underline underline-offset-4"
              to={'/checkout/' + encodeURIComponent(order.checkoutGroupId)}
            >
              {t('checkoutPayment.continuePayment')}
            </Link>
          )}
          <CancelOrderButton order={order} />
        </div>
      </div>

      <div className="order-detail-grid">
        <section className="order-card" aria-labelledby="order-products-title">
          <h2 id="order-products-title">{t('orders.products')}</h2>
          <OrderItems items={order.items} />
          <div className="order-total">
            <p>{t('orders.total')}</p>
            <ProductPrice value={order.totalAmount} className="text-xl font-semibold" />
          </div>
          {order.shippingFee != null && (
            <p className="flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
              <span>{t('orders.shippingFee')}</span>
              <ProductPrice value={order.shippingFee} />
            </p>
          )}
          {Number(order.shopDiscount) > 0 && (
            <p className="flex flex-wrap justify-between gap-3 text-sm text-primary">
              <span>{t('orders.shopDiscount')}</span>
              <span>
                -<ProductPrice value={order.shopDiscount} />
              </span>
            </p>
          )}
          {Number(order.platformDiscount) > 0 && (
            <p className="flex flex-wrap justify-between gap-3 text-sm text-primary">
              <span>{t('orders.platformDiscount')}</span>
              <span>
                -<ProductPrice value={order.platformDiscount} />
              </span>
            </p>
          )}
        </section>

        <section className="order-card" aria-labelledby="order-delivery-title">
          <h2 id="order-delivery-title">{t('orders.deliveryTitle')}</h2>
          <dl className="order-delivery">
            <div>
              <dt>{t('orders.receiverName')}</dt>
              <dd>{order.receiverName}</dd>
            </div>
            <div>
              <dt>{t('orders.receiverPhone')}</dt>
              <dd>{order.receiverPhone}</dd>
            </div>
            <div>
              <dt>{t('orders.shippingAddress')}</dt>
              <dd>{order.shippingAddress}</dd>
            </div>
          </dl>
        </section>
      </div>

      <BuyerOrderTimeline order={order} />

      <OrderDisputePanel order={order} />
    </section>
  )
}
