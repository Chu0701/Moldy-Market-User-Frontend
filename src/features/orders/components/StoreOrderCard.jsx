import { Eye, Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
import { ConfirmStoreOrderButton } from '@/features/orders/components/ConfirmStoreOrderButton'
import { OrderDate } from '@/features/orders/components/OrderDate'
import { OrderStatusLabel } from '@/features/orders/components/OrderStatusLabel'
import { cn } from '@/lib/utils'

function getStatusTooltip(order, t) {
  if (order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING') {
    return `${t('storeOrders.payment.methods.cod')} · ${t('storeOrders.payment.statuses.codPending')}`
  }
  if (order.paymentMethod === 'ONLINE_BANKING' && order.paymentStatus === 'PENDING') {
    return `${t('storeOrders.payment.methods.online')} · ${t('storeOrders.payment.statuses.pending')}`
  }
  return undefined
}

/**
 * Compact Seller Center order row: fits 100% inside the desktop workspace without horizontal scroll
 * (Product column is the sole flexible track), and stacks cleanly into a 2-3 line card on mobile.
 * Every row has exactly one vertically centered action button on the right.
 *
 * @param {{
 *   order: object,
 *   mutation: object,
 *   canConfirm: boolean,
 *   disabled?: boolean,
 *   onOpenDetail?: (orderId: string) => void,
 * }} props
 */
export function StoreOrderCard({ order, mutation, canConfirm, disabled, onOpenDetail }) {
  const { t } = useTranslation()
  const items = Array.isArray(order.items) ? order.items : []
  const firstItem = items[0]
  const extraItemCount = Math.max(0, items.length - 1)
  const needsAction = order.status === 'PENDING_CONFIRMED'
  const isClosed = ['COMPLETED', 'CANCELLED', 'EXPIRED', 'REFUNDED'].includes(order.status)
  const statusTooltip = getStatusTooltip(order, t)
  const missingPaymentMeta =
    order.status === 'PENDING_CONFIRMED' && (!order.paymentMethod || !order.paymentStatus)
  const isConfirmable =
    canConfirm &&
    order.status === 'PENDING_CONFIRMED' &&
    order.paymentMethod === 'COD' &&
    order.paymentStatus === 'PENDING'

  return (
    <article
      aria-labelledby={'store-order-' + order.id}
      onClick={() => onOpenDetail?.(order.id)}
      className={cn(
        'group relative cursor-pointer rounded-xl border bg-card transition-colors hover:bg-surface-subtle/60 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b',
        needsAction
          ? 'border-orange-200 border-l-[3px] border-l-orange-500 bg-orange-50/45 hover:bg-orange-50/75 lg:border-b-border'
          : 'border-border',
        isClosed && 'opacity-70 hover:opacity-100',
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 px-4 py-3 lg:min-h-[60px] lg:grid-cols-[116px_minmax(0,1fr)_104px_104px_134px_88px] lg:items-center lg:gap-x-3 lg:gap-y-0 lg:py-2.5">
        {/* Col 1: Order code (sans-serif, secondary emphasis) + created time */}
        <div className="order-1 min-w-0 lg:order-1">
          <h2
            id={'store-order-' + order.id}
            className={cn(
              'truncate font-sans text-[13px] leading-5 font-medium tracking-normal',
              isClosed ? 'text-muted-foreground' : 'text-foreground/90',
            )}
          >
            {order.orderCode}
          </h2>
          <p className="mt-0.5 truncate text-[11px] leading-4 text-muted-foreground tabular-nums">
            <OrderDate value={order.createdAt} />
          </p>
        </div>

        {/* Col 5 on desktop, top-right on mobile: single-line Status badge (COD info via tooltip & drawer) */}
        <div className="order-2 flex min-w-0 flex-col items-end justify-center gap-0.5 lg:order-5 lg:items-start">
          <OrderStatusLabel status={order.status} compact title={statusTooltip} />
          {missingPaymentMeta && (
            <span className="text-right text-[11px] leading-4 text-amber-700 lg:text-left">
              {t('storeOrders.progress.hints.paymentUnavailable')}
            </span>
          )}
        </div>

        {/* Col 2: Product (ONLY flexible column) — flat muted thumbnail + 1-line name + (+N) */}
        <div className="order-3 col-span-2 flex min-w-0 items-center gap-2.5 pr-2 lg:order-2 lg:col-span-1 lg:pr-3">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/70">
            {firstItem?.imageUrl ? (
              <img
                src={firstItem.imageUrl}
                alt={firstItem.productName || order.orderCode}
                loading="lazy"
                className="size-full object-cover"
              />
            ) : (
              <Package aria-hidden="true" className="size-4 text-muted-foreground/45" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <p
              className={cn(
                'min-w-0 truncate text-sm leading-5 font-medium',
                isClosed ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              {firstItem?.productName || t('storeOrders.unknownProduct')}
            </p>
            {extraItemCount > 0 && (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {t('storeOrders.moreItems', { count: extraItemCount })}
              </span>
            )}
          </div>
        </div>

        {/* Col 3: Buyer */}
        <div className="order-4 min-w-0 self-center lg:order-3">
          <p
            className={cn(
              'truncate text-xs lg:text-[13px]',
              isClosed ? 'text-muted-foreground' : 'text-foreground/85',
            )}
          >
            {order.receiverName || '—'}
          </p>
        </div>

        {/* Col 4: Total amount (focal emphasis, right-aligned with padding before Status) */}
        <div className="order-5 flex items-center justify-end lg:order-4 lg:pr-2">
          <ProductPrice
            value={order.totalAmount}
            className={cn(
              'text-sm font-bold whitespace-nowrap tabular-nums',
              isClosed ? 'text-muted-foreground' : 'text-foreground',
            )}
          />
        </div>

        {/* Col 6: Exactly ONE vertically centered action button per row */}
        <div
          className="order-6 col-span-2 flex items-center justify-end border-t border-border/60 pt-2 lg:order-6 lg:col-span-1 lg:border-t-0 lg:pt-0"
          onClick={(event) => event.stopPropagation()}
        >
          {isConfirmable ? (
            <ConfirmStoreOrderButton
              order={order}
              mutation={mutation}
              canConfirm={canConfirm}
              disabled={disabled}
              size="sm"
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-8 shrink-0 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t('storeOrders.viewDetail')}
              title={t('storeOrders.viewDetail')}
              onClick={() => onOpenDetail?.(order.id)}
            >
              <Eye aria-hidden="true" className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
