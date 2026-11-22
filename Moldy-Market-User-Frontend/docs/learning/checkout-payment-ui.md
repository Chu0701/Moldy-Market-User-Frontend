# Nối checkout và trang thanh toán

Xác nhận tích hợp mới nhất: Chu xác nhận ngày 2026-11-20: online checkout → QR → SePay Test mode → webhook HMAC → thanh toán thành công, order đã xác nhận, xóa đúng món khỏi giỏ và giữ trạng thái sau reload. INTEGRATED_LOCAL_SANDBOX; chưa kiểm thử tiền thật/SePay Live hoặc toàn bộ vòng đời COD.

Lỗi cấu hình QR đã tìm ra: bank bị điền nhầm mã VA SBSEPAY..., dịch vụ trả HTTP 200 text/html thay vì image/png. Đổi bank sang VCB cho tài khoản Vietcombank và tạo checkout mới đã hiển thị QR. URL của checkout cũ vẫn giữ giá trị đã lưu. Tài khoản Test mode dùng mô phỏng giao dịch, không nhận tiền từ app ngân hàng thật.

Trạng thái sau khi Chu báo xong (2026-11-20): source/route/i18n đã có trong repo chính. Đã sửa lỗi chép ở payload orderItems, URL thiếu dấu /, Math.max, tên export, key QR/paymentResponse, form thiếu field, layout và OrderStatusLabel đặt nhầm thư mục. Đã đối chiếu 12 file source khớp hướng dẫn. Repo chính pass format check, lint, build và 337/337 tests trong 38 file. Chờ thử HTTP với Backend local; chưa xác minh chuyển khoản thật.

Ngày 2026-11-20. Chu chép trọn flow theo thứ tự dưới đây rồi báo “xong”. CSS và tests đã được thêm trực tiếp; không cần chép các file test.

## Flow cần hiểu trước

Chọn sản phẩm trong giỏ → nhập người nhận → POST tạo checkout → chuyển sang /checkout/:checkoutGroupId → GET dữ liệu server.

- ONLINE_BANKING: hiển thị QR HTTPS do Backend trả và polling mỗi 5 giây khi còn chờ. Dừng khi kết thúc, GET lỗi, logout hoặc rời trang. Nút cập nhật chỉ GET, không xác nhận tiền.
- COD: chờ chủ gian hàng xác nhận; dùng nút cập nhật thủ công, không polling vô hạn. CONFIRMED không có nghĩa đã thu tiền.
- Chỉ báo đã thanh toán khi payment SUCCESSFUL và checkout PAID. Đồng hồ bằng 0 chỉ ẩn QR và nhắc kiểm tra trạng thái; Backend quyết định hết hạn.
- Không DELETE giỏ khi tạo checkout. Backend xóa đúng món sau thu tiền; UI invalidate để đọc lại giỏ và đơn. COD thu từng đơn cũng làm mới dữ liệu.
- POST mất kết nối hoặc lỗi 5xx có thể đã tạo đơn: khóa gửi lại trên form hiện tại và dẫn tới Đơn mua để kiểm tra. Không tự retry POST.
- Key cache có userId; response tạo đơn đến sau logout không phục hồi dữ liệu phiên cũ. GET có AbortSignal.

## Chép source

Mỗi mục: tạo thư mục nếu chưa có. Với file đã tồn tại, thay toàn bộ nội dung bằng block tương ứng; không tạo file trong docs/learning. Các đường dẫn src/ tính từ root User frontend.

### 1. src/services/checkout/checkoutService.js

Service chỉ gửi thông tin người nhận và productId. Giá và người mua do Backend xác định.

```js
import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/** @param {{ productIds: string[], receiverName: string, phoneNumber: string, shippingAddress: string, method: 'COD'|'ONLINE_BANKING', note?: string }} input */
export async function createCheckout({
  productIds,
  receiverName,
  phoneNumber,
  shippingAddress,
  method,
  note,
}) {
  const response = await apiClient.post('/api/v1/checkout-groups', {
    orderItems: productIds.map((productId) => ({ productId })),
    receiverName,
    phoneNumber,
    shippingAddress,
    method,
    note,
  })
  return unwrap(response)
}

export async function getCheckout({ checkoutId, signal }) {
  const response = await apiClient.get(
    '/api/v1/checkout-groups/' + encodeURIComponent(checkoutId),
    { signal },
  )
  return unwrap(response)
}
```

### 2. src/features/checkout/checkoutPayment.js

Hàm thuần đổi trạng thái server thành trạng thái hiển thị, kiểm tra QR và phân loại lỗi.

```js
export function getCheckoutStage(checkout) {
  const payment = checkout?.paymentResponse
  if (!payment || !['COD', 'ONLINE_BANKING'].includes(payment.method)) return 'unknown'
  if (payment.paymentStatus === 'SUCCESSFUL') return checkout.status === 'PAID' ? 'paid' : 'syncing'
  if (checkout.status === 'PAID') return 'syncing'
  if (checkout.status === 'EXPIRED') return 'expired'
  if (checkout.status === 'CANCELLED') return 'cancelled'
  if (payment.paymentStatus === 'FAILED') return 'failed'
  if (payment.paymentStatus === 'PENDING' || payment.paymentStatus === 'PROCESSING') {
    if (payment.method === 'COD' && checkout.status === 'PAY_ON_DELIVERY') return 'codPending'
    if (payment.method === 'ONLINE_BANKING' && checkout.status === 'PENDING_PAYMENT')
      return 'bankPending'
  }
  return 'unknown'
}

export function remainingSeconds(deadline, now) {
  if (!deadline || !Number.isFinite(Date.parse(deadline))) return null
  return Math.max(0, Math.ceil((Date.parse(deadline) - now) / 1000))
}

export function getSafeQrUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? value : null
  } catch {
    return null
  }
}

export function isAmbiguousCheckoutError(error) {
  return Boolean(error) && (!error.status || error.status >= 500)
}

const errorKeys = {
  PRODUCT_RESERVED: 'checkout.reserved',
  CHECKOUT_OWN_PRODUCT: 'checkout.ownProduct',
  PRODUCT_NOT_ACTIVE: 'checkout.productChanged',
  PRODUCT_NOT_FOUND: 'checkout.productChanged',
  DUPLICATE_PRODUCT: 'checkout.selectionDescription',
  INVALID_ORDER_ITEMS: 'checkout.selectionDescription',
  INVALID_ORDER_AMOUNT: 'checkout.invalidAmount',
  VALIDATION_ERROR: 'checkout.validationError',
  DATA_CONFLICT: 'checkout.productChanged',
}

export function getCheckoutErrorKey(error) {
  if (isAmbiguousCheckoutError(error)) return 'checkout.uncertain'
  return (
    errorKeys[error?.code] ??
    (error?.status === 403 ? 'checkout.forbidden' : 'checkout.submitError')
  )
}
```

### 3. src/features/checkout/hooks/useCheckout.js

Mutation tạo đơn không retry. Query đọc checkout theo tài khoản; chỉ polling online đang chờ. Invalidate để tải lại dữ liệu thật, không tự xóa giỏ.

```js
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { meQueryKey, useSession } from '@/features/auth/hooks/useSession'
import { cartQueryKey } from '@/features/cart/hooks/useCart'
import { myOrdersQueryKey } from '@/features/orders/hooks/useMyOrders'
import { getCheckoutStage } from '@/features/checkout/checkoutPayment'
import { getAccessToken } from '@/lib/tokenStorage'
import { createCheckout, getCheckout } from '@/services/checkout/checkoutService'

export const checkoutKey = (userId, checkoutId) => ['checkout', userId, checkoutId]
export const CHECKOUT_POLL_MS = 5000

function isCurrentUser(queryClient, userId) {
  return (
    Boolean(getAccessToken()) &&
    Boolean(userId) &&
    queryClient.getQueryData(meQueryKey)?.id === userId
  )
}

function refreshPurchaseQueries(queryClient, userId) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: cartQueryKey(userId), exact: true }),
    queryClient.invalidateQueries({ queryKey: myOrdersQueryKey(userId), exact: true }),
  ])
}

export function useCreateCheckout() {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined
  const queryClient = useQueryClient()
  const mutation = useMutation({
    retry: false,
    scope: { id: 'checkout-create-' + userId },
    mutationFn: async (values) => {
      if (!isCurrentUser(queryClient, userId)) return null
      const result = await createCheckout(values)
      if (!result?.id || typeof result.id !== 'string') throw new Error('Missing checkout id')
      return isCurrentUser(queryClient, userId) ? result : null
    },
    onSuccess: (checkout) => {
      if (!checkout || !isCurrentUser(queryClient, userId)) return
      queryClient.setQueryData(checkoutKey(userId, checkout.id), checkout)
      void refreshPurchaseQueries(queryClient, userId)
    },
  })
  return { ...mutation, userId }
}

export function useCheckout(checkoutId) {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined
  const queryClient = useQueryClient()
  const lastRefresh = useRef(null)
  const query = useQuery({
    queryKey: checkoutKey(userId, checkoutId),
    queryFn: userId && checkoutId ? ({ signal }) => getCheckout({ checkoutId, signal }) : skipToken,
    staleTime: 0,
    retry: false,
    refetchInterval: (current) => {
      if (!userId || current.state.error) return false
      const stage = getCheckoutStage(current.state.data)
      return ['bankPending', 'syncing'].includes(stage) ? CHECKOUT_POLL_MS : false
    },
    refetchIntervalInBackground: false,
  })

  useEffect(() => {
    if (!query.data || query.error || !isCurrentUser(queryClient, userId)) return
    const stage = getCheckoutStage(query.data)
    const collected = query.data.orders
      ?.filter((order) => order.status === 'COMPLETED')
      .map((order) => order.id)
      .sort()
      .join(',')
    const stamp = [userId, checkoutId, stage, collected].join(':')
    const shouldRefresh =
      ['paid', 'expired', 'cancelled', 'failed'].includes(stage) || Boolean(collected)
    if (!shouldRefresh || lastRefresh.current === stamp) return
    lastRefresh.current = stamp
    void refreshPurchaseQueries(queryClient, userId)
  }, [query.data, query.error, userId, checkoutId, queryClient])

  return query
}
```

### 4. src/features/checkout/hooks/usePaymentDeadline.js

Đếm ngược để nhắc người mua; số 0 không tự chuyển trạng thái server thành EXPIRED.

```js
import { useEffect, useState } from 'react'
import { remainingSeconds } from '@/features/checkout/checkoutPayment'

export function usePaymentDeadline(deadline, active) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!active || !deadline || !Number.isFinite(Date.parse(deadline))) return
    const timer = window.setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (remainingSeconds(deadline, current) === 0) window.clearInterval(timer)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [deadline, active])
  return remainingSeconds(deadline, now)
}
```

### 5. src/features/checkout/components/CheckoutQr.jsx

Ảnh QR lấy từ Backend; có nhánh lỗi ảnh và thử tải lại.

```jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

/** @param {{ src: string }} props */
export function CheckoutQr({ src }) {
  const [failed, setFailed] = useState(false)
  const { t } = useTranslation()
  if (failed)
    return (
      <div className="grid gap-3" role="alert">
        <p>{t('checkoutPayment.qrError')}</p>
        <Button type="button" variant="outline" onClick={() => setFailed(false)}>
          {t('checkoutPayment.retryQr')}
        </Button>
      </div>
    )
  return (
    <img
      className="checkout-qr"
      src={src}
      alt={t('checkoutPayment.qrAlt')}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}
```

### 6. src/features/checkout/components/CheckoutPaymentStatus.jsx

Tách COD, chờ chuyển khoản, thành công, hết hạn và lỗi.

```jsx
import { useTranslation } from 'react-i18next'
import { getSafeQrUrl } from '@/features/checkout/checkoutPayment'
import { CheckoutQr } from '@/features/checkout/components/CheckoutQr'
import { usePaymentDeadline } from '@/features/checkout/hooks/usePaymentDeadline'

/** @param {{ checkout: object, stage: string, allowQr?: boolean }} props */
export function CheckoutPaymentStatus({ checkout, stage, allowQr = true }) {
  const { t } = useTranslation()
  const remaining = usePaymentDeadline(checkout.expiredAt, stage === 'bankPending')
  const qr = getSafeQrUrl(checkout.paymentResponse?.qrBankUrl)
  const clock =
    remaining == null
      ? null
      : Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2, '0')

  return (
    <section className="checkout-panel" aria-labelledby="checkout-payment-status">
      <h2 id="checkout-payment-status">{t('checkoutPayment.stages.' + stage)}</h2>
      <p role="status">{t('checkoutPayment.descriptions.' + stage)}</p>
      {stage === 'bankPending' && (
        <>
          <p className="checkout-deadline">
            {remaining === null
              ? t('checkoutPayment.noDeadline')
              : remaining === 0
                ? t('checkoutPayment.clockExpired')
                : t('checkoutPayment.countdown', { time: clock })}
          </p>
          {remaining > 0 && qr && allowQr ? (
            <CheckoutQr key={qr} src={qr} />
          ) : (
            remaining !== 0 && <p role="alert">{t('checkoutPayment.qrUnavailable')}</p>
          )}
          <p className="text-sm text-muted-foreground">{t('checkoutPayment.bankHint')}</p>
        </>
      )}
    </section>
  )
}
```

### 7. src/features/checkout/components/CheckoutPaymentOrders.jsx

Danh sách đơn con lấy từ snapshot của checkout.

```jsx
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ProductPrice } from '@/components/common/ProductPrice'
import { OrderItems } from '@/features/orders/components/OrderItems'
import { OrderStatusLabel } from '@/features/orders/components/OrderStatusLabel'

/** @param {{ orders: object[] }} props */
export function CheckoutPaymentOrders({ orders = [] }) {
  const { t } = useTranslation()
  return (
    <section className="grid gap-4" aria-labelledby="checkout-payment-orders">
      <h2 id="checkout-payment-orders">{t('checkoutPayment.orders')}</h2>
      {orders.length === 0 ? (
        <p>{t('checkoutPayment.noOrders')}</p>
      ) : (
        orders.map((order, index) => (
          <article className="order-card" key={order.id}>
            <div className="order-heading">
              <h3>
                <Link
                  className="underline underline-offset-4"
                  to={'/orders/' + encodeURIComponent(order.id)}
                >
                  {order.orderCode || t('checkoutPayment.orderNumber', { number: index + 1 })}
                </Link>
              </h3>
              <OrderStatusLabel status={order.status} />
            </div>
            <OrderItems items={order.items} />
            <div className="order-total">
              <span>{t('orders.total')}</span>
              <ProductPrice value={order.totalAmount} />
            </div>
          </article>
        ))
      )}
    </section>
  )
}
```

### 8. src/features/checkout/pages/CheckoutPaymentPage.jsx

Đọc lại bằng ID trên URL nên reload vẫn xem được checkout.

```jsx
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { getCheckoutStage } from '@/features/checkout/checkoutPayment'
import { CheckoutPaymentOrders } from '@/features/checkout/components/CheckoutPaymentOrders'
import { CheckoutPaymentStatus } from '@/features/checkout/components/CheckoutPaymentStatus'
import { useCheckout } from '@/features/checkout/hooks/useCheckout'

export function CheckoutPaymentPage() {
  const { checkoutGroupId } = useParams()
  const { t } = useTranslation()
  const query = useCheckout(checkoutGroupId)
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
        <h1 id="checkout-payment-title">{t('checkoutPayment.title')}</h1>
        <Button
          type="button"
          variant="outline"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          {t('checkoutPayment.refresh')}
        </Button>
      </div>
      {query.isRefetchError && (
        <p role="alert" className="checkout-notice">
          {t('checkoutPayment.refreshError')}
        </p>
      )}
      <div className="checkout-grid">
        <CheckoutPaymentStatus checkout={checkout} stage={stage} allowQr={!query.isError} />
        <aside className="checkout-panel" aria-labelledby="checkout-payment-total">
          <h2 id="checkout-payment-total">{t('checkoutPayment.total')}</h2>
          <ProductPrice value={checkout.totalAmount} className="text-2xl font-semibold" />
          <p>
            {t('checkoutPayment.method')}:{' '}
            {['COD', 'ONLINE_BANKING'].includes(checkout.paymentResponse?.method)
              ? t('checkout.methods.' + checkout.paymentResponse.method)
              : t('checkoutPayment.unknownMethod')}
          </p>
          <p className="text-sm text-muted-foreground">{t('checkoutPayment.serverAmount')}</p>
          <div className="grid justify-items-start gap-3">
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
```

### 9. src/features/checkout/components/CheckoutForm.jsx

Giữ logic điền sẵn profile. submitLock khóa ngay để chặn bấm đúp, kể cả lúc route mới chưa tải xong. Chỉ mở khóa khi server trả lỗi xác định.

```jsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { checkoutSchema } from '@/features/checkout/schemas/checkoutSchema'
import { isAmbiguousCheckoutError } from '@/features/checkout/checkoutPayment'

const fields = [
  { name: 'receiverName', label: 'checkout.receiverName', autoComplete: 'name' },
  {
    name: 'phoneNumber',
    label: 'checkout.phoneNumber',
    type: 'tel',
    autoComplete: 'tel',
  },
  {
    name: 'shippingAddress',
    label: 'checkout.shippingAddress',
    multiline: true,
    autoComplete: 'street-address',
  },
  { name: 'note', label: 'checkout.note', multiline: true, autoComplete: 'off' },
]

/** @param {{ onSubmit?: Function, isSubmitting?: boolean, canSubmit?: boolean, submitError?: string }} props */
export function CheckoutForm({
  onSubmit,
  isSubmitting = false,
  canSubmit = true,
  submitError,
} = {}) {
  const { t } = useTranslation()
  const { profileQuery } = useSession()
  const fullName = profileQuery.data?.fullName ?? ''
  const phone = profileQuery.data?.phone ?? ''
  const editedFields = useRef(new Set())
  const submitLock = useRef(false)
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues: {
      receiverName: fullName,
      phoneNumber: phone,
      shippingAddress: '',
      method: 'COD',
      note: '',
    },
  })

  useEffect(() => {
    const profileValues = { receiverName: fullName, phoneNumber: phone }

    for (const [name, value] of Object.entries(profileValues)) {
      if (!editedFields.current.has(name)) {
        setValue(name, value)
      }
    }
  }, [fullName, phone, setValue])

  return (
    <form
      className="checkout-panel"
      noValidate
      onSubmit={(event) =>
        void handleSubmit(async (values) => {
          if (submitLock.current || isSubmitting || !canSubmit || !onSubmit) return
          submitLock.current = true
          try {
            await onSubmit(values)
          } catch (error) {
            if (!isAmbiguousCheckoutError(error)) submitLock.current = false
          }
        })(event)
      }
    >
      <h2>{t('checkout.deliveryTitle')}</h2>

      <fieldset disabled={isSubmitting} className="grid gap-5">
        {fields.map(({ name, label, type = 'text', multiline, autoComplete }) => {
          const Field = multiline ? 'textarea' : 'input'
          const id = 'checkout-' + name
          const error = errors[name]
          const registration = register(name)

          return (
            <div key={name} className="checkout-field">
              <label htmlFor={id}>{t(label)}</label>
              <Field
                id={id}
                type={multiline ? undefined : type}
                rows={multiline ? 3 : undefined}
                autoComplete={autoComplete}
                required={name !== 'note'}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? id + '-error' : undefined}
                {...registration}
                onChange={(event) => {
                  editedFields.current.add(name)
                  void registration.onChange(event)
                }}
              />
              {error && (
                <p id={id + '-error'} className="checkout-error" role="alert">
                  {t(error.message)}
                </p>
              )}
            </div>
          )
        })}

        <fieldset className="grid gap-3">
          <legend className="mb-3 font-medium">{t('checkout.paymentTitle')}</legend>
          {['COD', 'ONLINE_BANKING'].map((method) => (
            <label key={method} className="flex min-h-11 items-center gap-3">
              <input type="radio" value={method} {...register('method')} />
              <span>{t('checkout.methods.' + method)}</span>
            </label>
          ))}
        </fieldset>
      </fieldset>
      <p id="checkout-notice" className="checkout-notice">
        {t('checkout.submitNotice')}
      </p>
      {submitError && (
        <p role="alert" className="checkout-error">
          {submitError}
        </p>
      )}
      <Button
        type="submit"
        disabled={!onSubmit || isSubmitting || !canSubmit}
        aria-describedby="checkout-notice"
      >
        {t(isSubmitting ? 'checkout.submitting' : 'checkout.placeOrder')}
      </Button>
    </form>
  )
}
```

### 10. src/features/checkout/pages/CheckoutPage.jsx

mutateAsync trả Promise để form biết kết quả. mounted cùng useNavigation ngăn response đến muộn kéo người dùng về trang thanh toán khi đã bắt đầu rời form.

```jsx
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useNavigation, useSearchParams } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useCart } from '@/features/cart/hooks/useCart'
import { useCartProducts } from '@/features/cart/hooks/useCartProducts'
import { useCreateCheckout } from '@/features/checkout/hooks/useCheckout'
import { getCheckoutErrorKey, isAmbiguousCheckoutError } from '@/features/checkout/checkoutPayment'

import { CheckoutForm } from '@/features/checkout/components/CheckoutForm'

export function CheckoutPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const query = useCart()
  const create = useCreateCheckout()
  const navigate = useNavigate()
  const navigation = useNavigation()
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = navigation.state === 'idle'
    return () => {
      mounted.current = false
    }
  }, [navigation.state])
  const requestedIds = params.getAll('productId')
  const validSelection =
    requestedIds.length > 0 &&
    requestedIds.length <= 20 &&
    new Set(requestedIds).size === requestedIds.length
  const selectedItems = validSelection
    ? (query.data?.items ?? []).filter((item) => requestedIds.includes(item.listingId))
    : []
  const productQueries = useCartProducts(selectedItems)

  if (query.isPending) return <p role="status">{t('cart.loading')}</p>
  if (query.error?.status === 403) return <ForbiddenState />
  if (query.isError) {
    return (
      <ErrorState
        title={t('cart.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  }

  const backLink = (
    <Link to="/cart" className="underline underline-offset-4">
      {t('checkout.backToCart')}
    </Link>
  )

  if (!validSelection || selectedItems.length !== requestedIds.length) {
    return (
      <section className="checkout-page">
        <h1>{t('checkout.title')}</h1>
        <EmptyState
          title={t('checkout.selectionTitle')}
          description={t('checkout.selectionDescription')}
        />
        {backLink}
      </section>
    )
  }

  if (productQueries.some((productQuery) => productQuery.isPending)) {
    return <p role="status">{t('checkout.checking')}</p>
  }

  if (
    productQueries.some(
      (productQuery) => productQuery.isError || productQuery.data?.status !== 'ACTIVE',
    )
  ) {
    return (
      <section className="checkout-page">
        <h1>{t('checkout.title')}</h1>
        <ErrorState
          title={t('checkout.unavailableProduct')}
          description={t('checkout.reviewCart')}
          onRetry={() => productQueries.forEach((productQuery) => void productQuery.refetch())}
          isRetrying={productQueries.some((productQuery) => productQuery.isFetching)}
        />
        {backLink}
      </section>
    )
  }

  const estimate = selectedItems.reduce((total, item) => total + Number(item.totalPrice), 0)

  return (
    <section className="checkout-page" aria-labelledby="checkout-title">
      <div className="grid gap-3">
        {backLink}
        <h1 id="checkout-title">{t('checkout.title')}</h1>
      </div>
      <div className="checkout-grid">
        <div className="grid content-start gap-4">
          <CheckoutForm
            key={create.userId}
            isSubmitting={create.isPending}
            canSubmit={
              Boolean(create.userId) && !create.data && !isAmbiguousCheckoutError(create.error)
            }
            submitError={create.error ? t(getCheckoutErrorKey(create.error)) : undefined}
            onSubmit={async (values) => {
              const checkout = await create.mutateAsync({
                ...values,
                productIds: selectedItems.map((item) => item.listingId),
              })
              if (mounted.current && checkout)
                navigate('/checkout/' + encodeURIComponent(checkout.id))
            }}
          />
          {create.isError && (
            <Link to="/orders" className="underline underline-offset-4">
              {t('checkout.checkOrders')}
            </Link>
          )}
        </div>
        <aside className="checkout-panel" aria-labelledby="checkout-summary">
          <h2 id="checkout-summary">{t('checkout.summaryTitle')}</h2>
          <ul className="grid gap-4">
            {selectedItems.map((item, index) => (
              <li key={item.listingId} className="flex items-start justify-between gap-4">
                <Link
                  to={'/products/' + encodeURIComponent(item.listingId)}
                  className="min-w-0 break-words underline underline-offset-4"
                >
                  {productQueries[index].data.title}
                </Link>
                <ProductPrice value={item.totalPrice} className="shrink-0" />
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p>{t('cart.selectedCount', { count: selectedItems.length })}</p>
            <ProductPrice value={estimate} className="text-xl font-semibold" />
          </div>
          <p className="text-sm text-muted-foreground">{t('checkout.priceHint')}</p>
        </aside>
      </div>
    </section>
  )
}
```

### 11. src/features/orders/components/OrderStatusLabel.jsx

Bổ sung PENDING_CONFIRMED: đơn COD chờ chủ gian hàng xác nhận.

```jsx
import { useTranslation } from 'react-i18next'

const statusKeys = {
  PENDING_CONFIRMED: 'orders.statuses.pendingConfirmed',
  PENDING_PAYMENT: 'orders.statuses.pendingPayment',
  CONFIRMED: 'orders.statuses.confirmed',
  SHIPPING: 'orders.statuses.shipping',
  DELIVERED: 'orders.statuses.delivered',
  COMPLETED: 'orders.statuses.completed',
  CANCELLED: 'orders.statuses.cancelled',
  EXPIRED: 'orders.statuses.expired',
  DISPUTED: 'orders.statuses.disputed',
  REFUNDED: 'orders.statuses.refunded',
}

/** @param {{ status: string }} props */
export function OrderStatusLabel({ status }) {
  const { t } = useTranslation()
  return <span className="order-status">{t(statusKeys[status] ?? 'orders.statuses.unknown')}</span>
}
```

### 12. src/features/orders/pages/OrderDetailPage.jsx

Đơn chưa thanh toán có link quay lại checkout cũ; tránh tạo một checkout khác khi mất response.

```jsx
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { OrderDate } from '@/features/orders/components/OrderDate'
import { OrderItems } from '@/features/orders/components/OrderItems'
import { OrderStatusLabel } from '@/features/orders/components/OrderStatusLabel'
import { useMyOrders } from '@/features/orders/hooks/useMyOrders'

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
    </section>
  )
}
```

## 13. Thêm route thanh toán

Trong src/app/router/routes.js, tìm route có path: checkout. Ngay sau object đó, trước object path: orders, thêm object sau. Vẫn nằm trong children của RequireAuth; giữ route checkout hiện có.

```js
{
  path: 'checkout/:checkoutGroupId',
  lazy: async () => ({
    Component: (await import('@/features/checkout/pages/CheckoutPaymentPage')).CheckoutPaymentPage,
  }),
},
```

## 14. Bổ sung i18n

Thực hiện cho cả hai file bên dưới. Các object checkout và checkoutPayment cùng cấp với orders ở root JSON.

### src/i18n/locales/vi/common.json

Thay toàn bộ object checkout hiện có và thêm checkoutPayment ở root. Block sau chỉ là hai key cần ghép vào JSON hiện có; không thay toàn bộ file common.json.

```json
{
  "checkout": {
    "title": "Thông tin đặt hàng",
    "backToCart": "Quay lại giỏ hàng",
    "deliveryTitle": "Thông tin nhận hàng",
    "receiverName": "Họ tên người nhận",
    "phoneNumber": "Số điện thoại người nhận",
    "shippingAddress": "Địa chỉ nhận hàng",
    "note": "Ghi chú (tùy chọn)",
    "paymentTitle": "Phương thức thanh toán",
    "methods": {
      "COD": "Thanh toán khi nhận hàng (COD)",
      "ONLINE_BANKING": "Chuyển khoản ngân hàng"
    },
    "summaryTitle": "Sản phẩm đã chọn",
    "priceHint": "Giá tạm tính theo giỏ hàng. Giá cuối cùng sẽ được xác nhận khi đặt hàng.",
    "unavailable": "Bạn có thể chuẩn bị thông tin nhận hàng tại đây. Chức năng đặt hàng hiện chưa mở; thông tin chưa được gửi.",
    "placeOrder": "Đặt hàng",
    "required": "Vui lòng nhập thông tin này.",
    "nameTooLong": "Họ tên tối đa 255 ký tự.",
    "phoneInvalid": "Vui lòng nhập số điện thoại Việt Nam hợp lệ.",
    "addressTooLong": "Địa chỉ tối đa 500 ký tự.",
    "noteTooLong": "Ghi chú tối đa 500 ký tự.",
    "selectionTitle": "Chọn lại sản phẩm",
    "selectionDescription": "Chọn từ 1 đến 20 sản phẩm còn trong giỏ để tiếp tục. Giỏ hàng có thể đã thay đổi.",
    "checking": "Đang kiểm tra sản phẩm đã chọn…",
    "unavailableProduct": "Có sản phẩm chưa sẵn sàng để đặt hàng",
    "reviewCart": "Vui lòng kiểm tra lại sản phẩm trong giỏ hàng.",
    "submitNotice": "Tạo đơn sẽ giữ hàng cho bạn. Sản phẩm rời giỏ khi khoản thanh toán được xác nhận.",
    "submitting": "Đang tạo đơn…",
    "reserved": "Có sản phẩm đang được giữ cho checkout khác. Hãy kiểm tra giỏ hoặc đơn mua của bạn.",
    "ownProduct": "Bạn không thể mua sản phẩm của mình hoặc gian hàng mình sở hữu/làm staff.",
    "productChanged": "Sản phẩm hoặc dữ liệu giỏ đã thay đổi. Hãy kiểm tra lại trước khi đặt.",
    "invalidAmount": "Số tiền chưa hợp lệ để chuyển khoản VND. Vui lòng kiểm tra đơn và giá sản phẩm.",
    "validationError": "Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường và sản phẩm đã chọn.",
    "uncertain": "Chưa xác định được đơn đã tạo hay chưa. Hãy kiểm tra Đơn mua trước khi đặt lại.",
    "forbidden": "Bạn chưa được phép tạo checkout này.",
    "submitError": "Chưa tạo được đơn. Vui lòng kiểm tra thông tin và thử lại.",
    "checkOrders": "Kiểm tra đơn mua"
  },
  "checkoutPayment": {
    "title": "Thanh toán đơn mua",
    "loading": "Đang tải checkout…",
    "refresh": "Cập nhật trạng thái",
    "loadError": "Chưa tải được checkout",
    "notFound": "Không tìm thấy checkout",
    "notFoundDescription": "Checkout không tồn tại hoặc tài khoản hiện tại không được xem.",
    "refreshError": "Chưa cập nhật được trạng thái. Thông tin bên dưới là lần tải trước; hãy thử cập nhật lại.",
    "total": "Tổng thanh toán",
    "method": "Phương thức",
    "unknownMethod": "Chưa có thông tin",
    "serverAmount": "Chuyển đúng số tiền được xác nhận cho checkout này.",
    "viewOrders": "Xem đơn mua",
    "orders": "Đơn trong checkout",
    "noOrders": "Chưa có dữ liệu đơn để hiển thị.",
    "orderNumber": "Đơn {{number}}",
    "continuePayment": "Tiếp tục thanh toán",
    "qrAlt": "Mã QR chuyển khoản của checkout",
    "qrError": "Chưa tải được ảnh QR.",
    "retryQr": "Thử tải lại QR",
    "qrUnavailable": "Chưa có QR và hạn thanh toán hợp lệ. Hãy cập nhật trạng thái trước khi chuyển khoản.",
    "countdown": "Thời gian chuyển khoản còn khoảng {{time}}",
    "noDeadline": "Chưa có hạn thanh toán hợp lệ.",
    "clockExpired": "Đồng hồ đã qua hạn. Đang chờ hệ thống xác nhận trạng thái.",
    "bankHint": "Chuyển đúng một lần theo QR, rồi chờ xác nhận. Trang tự cập nhật trạng thái trong lúc chờ.",
    "stages": {
      "bankPending": "Chờ chuyển khoản",
      "codPending": "Đã tạo đơn COD",
      "paid": "Đã thanh toán",
      "expired": "Đã hết hạn thanh toán",
      "cancelled": "Checkout đã hủy",
      "failed": "Thanh toán chưa hoàn tất",
      "syncing": "Đang đồng bộ kết quả",
      "unknown": "Chưa xác định trạng thái"
    },
    "descriptions": {
      "bankPending": "Giỏ hàng vẫn giữ các sản phẩm đã chọn trong lúc chờ thanh toán.",
      "codPending": "Gian hàng sẽ xử lý đơn. Sản phẩm rời giỏ khi khoản thanh toán được ghi nhận cho từng đơn.",
      "paid": "Thanh toán đã được xác nhận. Theo dõi tiến trình giao hàng trong Đơn mua.",
      "expired": "Giữ hàng cho phiên thanh toán này đã kết thúc. Giỏ hàng được giữ nguyên.",
      "cancelled": "Checkout đã được hủy. Những sản phẩm chưa mua vẫn ở trong giỏ.",
      "failed": "Thanh toán chưa được xác nhận thành công. Hãy kiểm tra đơn mua trước khi tạo lại.",
      "syncing": "Đang xác minh kết quả thanh toán. Trang sẽ cập nhật khi có dữ liệu đồng nhất.",
      "unknown": "Dữ liệu hiện chưa đủ để xác định flow. Hãy cập nhật trạng thái hoặc kiểm tra Đơn mua."
    }
  }
}
```

Trong object orders → statuses, thêm đúng một key (giữ các status cũ):

```json
{
  "pendingConfirmed": "Chờ gian hàng xác nhận"
}
```

Chú ý dấu phẩy giữa các key. Không tạo thêm object orders bên trong orders.

### src/i18n/locales/en/common.json

Thay toàn bộ object checkout hiện có và thêm checkoutPayment ở root. Block sau chỉ là hai key cần ghép vào JSON hiện có; không thay toàn bộ file common.json.

```json
{
  "checkout": {
    "title": "Checkout details",
    "backToCart": "Back to cart",
    "deliveryTitle": "Delivery information",
    "receiverName": "Recipient name",
    "phoneNumber": "Recipient phone number",
    "shippingAddress": "Shipping address",
    "note": "Note (optional)",
    "paymentTitle": "Payment method",
    "methods": {
      "COD": "Cash on delivery (COD)",
      "ONLINE_BANKING": "Bank transfer"
    },
    "summaryTitle": "Selected products",
    "priceHint": "Estimate based on your cart. The final price will be confirmed when placing the order.",
    "unavailable": "You can prepare your delivery information here. Ordering is not available yet; your details have not been sent.",
    "placeOrder": "Place order",
    "required": "Please enter this information.",
    "nameTooLong": "Name must be 255 characters or fewer.",
    "phoneInvalid": "Enter a valid Vietnamese phone number.",
    "addressTooLong": "Address must be 500 characters or fewer.",
    "noteTooLong": "Note must be 500 characters or fewer.",
    "selectionTitle": "Select your products again",
    "selectionDescription": "Select 1 to 20 products still in your cart to continue. Your cart may have changed.",
    "checking": "Checking selected products…",
    "unavailableProduct": "Some products are not ready to order",
    "reviewCart": "Please review the products in your cart.",
    "submitNotice": "Creating a checkout reserves the products for you. Items leave the cart after payment collection is confirmed.",
    "submitting": "Creating checkout…",
    "reserved": "A product is reserved by another checkout. Review your cart or orders.",
    "ownProduct": "You cannot buy products from yourself or a store you own or work for.",
    "productChanged": "The products or cart data have changed. Review them before placing the order.",
    "invalidAmount": "The amount is not valid for a VND transfer. Review the order and product price.",
    "validationError": "Review the delivery fields and selected products.",
    "uncertain": "The checkout outcome is unknown. Check your orders before submitting again.",
    "forbidden": "You are not allowed to create this checkout.",
    "submitError": "Could not create the checkout. Review the information and try again.",
    "checkOrders": "Check my orders"
  },
  "checkoutPayment": {
    "title": "Checkout payment",
    "loading": "Loading checkout…",
    "refresh": "Refresh status",
    "loadError": "Could not load checkout",
    "notFound": "Checkout not found",
    "notFoundDescription": "The checkout does not exist or is unavailable to this account.",
    "refreshError": "Could not refresh status. The information below is from the previous response; try refreshing again.",
    "total": "Checkout total",
    "method": "Payment method",
    "unknownMethod": "Not available",
    "serverAmount": "Transfer the confirmed amount for this checkout.",
    "viewOrders": "View my orders",
    "orders": "Orders in this checkout",
    "noOrders": "No order data is available.",
    "orderNumber": "Order {{number}}",
    "continuePayment": "Continue payment",
    "qrAlt": "Bank transfer QR for this checkout",
    "qrError": "Could not load the QR image.",
    "retryQr": "Retry QR image",
    "qrUnavailable": "A valid QR and payment deadline are not available. Refresh before transferring.",
    "countdown": "Transfer time remaining: about {{time}}",
    "noDeadline": "No valid payment deadline was provided.",
    "clockExpired": "The countdown has ended. Checking the payment status.",
    "bankHint": "Transfer once using the QR, then wait for confirmation. This page refreshes automatically while payment is pending.",
    "stages": {
      "bankPending": "Awaiting bank transfer",
      "codPending": "COD order created",
      "paid": "Payment confirmed",
      "expired": "Payment expired",
      "cancelled": "Checkout cancelled",
      "failed": "Payment not completed",
      "syncing": "Synchronizing result",
      "unknown": "Status unavailable"
    },
    "descriptions": {
      "bankPending": "The selected products remain in your cart while payment is pending.",
      "codPending": "The store will process your order. Cart items are removed after an admin records collection for each order.",
      "paid": "Payment has been confirmed. Follow delivery in your orders.",
      "expired": "The payment deadline has passed and the products have been released. Your cart is preserved.",
      "cancelled": "This checkout has been cancelled. Unpurchased items remain in your cart.",
      "failed": "Payment has not been confirmed. Review your orders before placing another order.",
      "syncing": "Your payment result is being updated. Please wait or check again.",
      "unknown": "There is not enough data to identify the payment flow. Refresh or check your orders."
    }
  }
}
```

Trong object orders → statuses, thêm đúng một key (giữ các status cũ):

```json
{
  "pendingConfirmed": "Awaiting store confirmation"
}
```

Chú ý dấu phẩy giữa các key. Không tạo thêm object orders bên trong orders.

## Kiểm tra sau khi chép

Chạy npm run format, npm run lint, npm run test và npm run build. Test mới sẽ báo thiếu import hoặc fail nếu source/i18n/route chưa chép đủ; không bỏ hoặc skip test.

Thử với Backend local đang chạy bản tích hợp checkout đã thống nhất:

1. Dùng tài khoản mua ngoài gian hàng của mình/staff. Chọn một món ACTIVE; đặt COD. Chỉ tạo một checkout, đi tới trang COD, giỏ vẫn còn món đó; reload giữ đúng thông tin.
2. Chọn món ACTIVE khác, đặt chuyển khoản. Kiểm tra tổng tiền server, QR, thời hạn và reload. Nếu mất POST response, mở Đơn mua → đơn đang chờ → Tiếp tục thanh toán.
3. Dùng trạng thái thanh toán do Backend xác nhận để kiểm tra UI thành công; không sửa frontend thành paid. Chuyển khoản thật chưa được kiểm thử bởi trợ lý.
4. Mở một checkout khác tài khoản: phải bị chặn. Đăng xuất lúc request chậm: không tự trở lại checkout hoặc phục hồi cache cũ.

## Phạm vi đã kiểm chứng

Bản review: format check, lint, production build pass; 337/337 tests pass trong 38 file (40 test mới cho service, trạng thái, polling/countdown và flow). Đã đối chiếu 12 block source với file đã test, kiểm tra cú pháp route và 4 block JSON. Đây là kết quả bản chuẩn bị; repo chính chưa có source logic cho tới khi Chu chép.

Source trong hướng dẫn được chạy trong bản review tách riêng cùng dependencies với repo. CSS và test đã có ở repo chính; source logic/JSX/i18n chờ Chu chép. Sau khi Chu báo xong sẽ kiểm tra lại repo chính. Không dùng kết quả mocked test để kết luận HTTP hoặc ngân hàng thật đã hoạt động. Không sửa Backend, không commit/push trong bước này.
