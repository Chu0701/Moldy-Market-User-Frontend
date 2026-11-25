import { useEffect } from 'react'
import { Printer, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
import { ConfirmStoreOrderButton } from '@/features/orders/components/ConfirmStoreOrderButton'
import { OrderDate } from '@/features/orders/components/OrderDate'
import { OrderItems } from '@/features/orders/components/OrderItems'
import { OrderStatusLabel } from '@/features/orders/components/OrderStatusLabel'
import { StoreOrderPayment } from '@/features/orders/components/StoreOrderPayment'
import { StoreOrderProgress } from '@/features/orders/components/StoreOrderProgress'

/**
 * Slide-over detail drawer for a single store order (payment, progress, history, items, delivery, print slip).
 * @param {{
 *   order: object | null,
 *   mutation: object,
 *   canConfirm: boolean,
 *   disabled?: boolean,
 *   onClose: () => void,
 * }} props
 */
export function StoreOrderDetailDrawer({ order, mutation, canConfirm, disabled, onClose }) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!order) return
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [order, onClose])

  if (!order) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-order-drawer-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-foreground/40 backdrop-blur-[1px]"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                id="store-order-drawer-title"
                className="font-sans text-base font-semibold tracking-tight text-foreground"
              >
                {order.orderCode}
              </h2>
              <OrderStatusLabel status={order.status} compact />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('orders.createdAt')} <OrderDate value={order.createdAt} />
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="print:hidden"
            >
              <Printer aria-hidden="true" className="size-3.5" />
              <span className="hidden sm:inline">{t('storeOrders.printSlip')}</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('actions.close')}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring print:hidden"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <StoreOrderPayment order={order} />

          <StoreOrderProgress order={order} canConfirm={canConfirm} />

          <section className="space-y-3" aria-label={t('storeOrders.itemsHeading')}>
            <h3 className="text-sm font-semibold text-foreground">
              {t('storeOrders.itemsHeading')}
            </h3>
            <OrderItems items={order.items} />
          </section>

          <section
            className="space-y-3 rounded-xl border border-border bg-surface-subtle/60 p-4"
            aria-label={t('checkout.deliveryTitle')}
          >
            <h3 className="text-sm font-semibold text-foreground">{t('checkout.deliveryTitle')}</h3>
            <dl className="grid gap-2.5 text-sm">
              <div className="grid gap-0.5 sm:grid-cols-[120px_1fr] sm:gap-2">
                <dt className="text-muted-foreground">{t('checkout.receiverName')}</dt>
                <dd className="font-medium break-words text-foreground">{order.receiverName}</dd>
              </div>
              <div className="grid gap-0.5 sm:grid-cols-[120px_1fr] sm:gap-2">
                <dt className="text-muted-foreground">{t('checkout.phoneNumber')}</dt>
                <dd className="font-mono text-foreground">{order.receiverPhone}</dd>
              </div>
              <div className="grid gap-0.5 sm:grid-cols-[120px_1fr] sm:gap-2">
                <dt className="text-muted-foreground">{t('checkout.shippingAddress')}</dt>
                <dd className="break-words whitespace-pre-wrap text-foreground">
                  {order.shippingAddress}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-subtle/60 px-5 py-4 sm:px-6 print:hidden">
          <div>
            <p className="text-xs text-muted-foreground">{t('orders.total')}</p>
            <ProductPrice
              value={order.totalAmount}
              className="text-lg font-bold tracking-tight tabular-nums"
            />
          </div>

          <div className="flex items-center gap-2">
            <ConfirmStoreOrderButton
              order={order}
              mutation={mutation}
              canConfirm={canConfirm}
              disabled={disabled}
              size="default"
            />
            <Button type="button" variant="outline" onClick={onClose}>
              {t('actions.close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
