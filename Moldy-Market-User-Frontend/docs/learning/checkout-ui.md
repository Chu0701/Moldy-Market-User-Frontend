# Chọn sản phẩm và chuẩn bị checkout

Chu chép các file theo thứ tự dưới đây. CSS và test được trợ lý thêm trực tiếp. Flow hiện tại chỉ dùng API giỏ hàng và chi tiết sản phẩm đã tích hợp; chưa gọi API checkout, tạo order, thanh toán hoặc giữ hàng.

Lựa chọn trên URL chỉ chứa product ID, không chứa thông tin nhận hàng hay token. Trang checkout luôn đối chiếu lại với giỏ hiện tại; món đã bị xóa hoặc tài khoản khác không được đưa vào form. Thông tin nhận hàng chỉ nằm trong form đang mở, chưa được gửi và không lưu vào localStorage.

## 1. src/features/cart/hooks/useCartProducts.js

Tạo file mới, giữ đúng tên và thư mục.

```js
import { useQueries } from '@tanstack/react-query'

import { productKeys } from '@/features/products/hooks/useProductSearch'
import { getProductById } from '@/services/products/productService'

export function useCartProducts(items) {
  return useQueries({
    queries: items.map((item) => ({
      queryKey: productKeys.detail(item.listingId),
      queryFn: ({ signal }) => getProductById({ productId: item.listingId, signal }),
      retry: false,
    })),
  })
}
```

## 2. src/features/cart/components/CartItemRow.jsx

Tạo file mới, giữ đúng tên và thư mục.

```jsx
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
import { useRemoveCartItem } from '@/features/cart/hooks/useCart'

export function CartItemRow({ item, productQuery, selected, canSelect, onToggle, onRemoved }) {
  const { t } = useTranslation()
  const removal = useRemoveCartItem()
  const product = productQuery.data
  const unavailable =
    productQuery.error?.status === 403 ||
    productQuery.error?.status === 404 ||
    (product && product.status !== 'ACTIVE')
  const selectionLabel = t('cart.selectItem', {
    title: product?.title ?? t('cart.unavailable'),
  })

  return (
    <li className="cart-item-row">
      <label className="cart-item-select">
        <input
          type="checkbox"
          checked={selected}
          disabled={!canSelect || removal.isPending}
          onChange={onToggle}
        />
        <span className="sr-only">{selectionLabel}</span>
      </label>

      <div className="grid min-w-0 gap-2">
        {productQuery.isPending ? (
          <p role="status">{t('products.loading')}</p>
        ) : product && !unavailable ? (
          <Link
            to={'/products/' + encodeURIComponent(item.listingId)}
            className="font-medium break-words underline-offset-4 hover:underline"
          >
            {product.title}
          </Link>
        ) : (
          <p>{t('cart.unavailable')}</p>
        )}

        {productQuery.isError && !unavailable && (
          <Button
            type="button"
            variant="outline"
            disabled={productQuery.isFetching}
            onClick={() => void productQuery.refetch()}
          >
            {t('actions.retry')}
          </Button>
        )}

        <ProductPrice value={item.totalPrice} className="font-semibold" />
        {item.note && <p className="text-sm text-muted-foreground">{item.note}</p>}
      </div>

      <div className="grid content-start justify-items-start gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={removal.isPending}
          onClick={() => removal.mutate({ productId: item.listingId }, { onSuccess: onRemoved })}
        >
          {t(removal.isPending ? 'cart.removing' : 'cart.remove')}
        </Button>
        {removal.error && (
          <p role="alert" className="text-sm text-destructive">
            {t('cart.removeError')}
          </p>
        )}
      </div>
    </li>
  )
}
```

## 3. src/features/cart/pages/CartPage.jsx

Thay toàn bộ file hiện tại.

```jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { CartItemRow } from '@/features/cart/components/CartItemRow'
import { useCart } from '@/features/cart/hooks/useCart'
import { useCartProducts } from '@/features/cart/hooks/useCartProducts'

export function CartPage() {
  const { t } = useTranslation()
  const query = useCart()
  const [selectedIds, setSelectedIds] = useState([])
  const items = query.data?.items ?? []
  const productQueries = useCartProducts(items)
  const availableItems = items.filter(
    (_, index) =>
      productQueries[index].isSuccess && productQueries[index].data?.status === 'ACTIVE',
  )
  const selectedItems = availableItems.filter((item) => selectedIds.includes(item.listingId))
  const selectedTotal = selectedItems.reduce((total, item) => total + Number(item.totalPrice), 0)
  const checkoutParams = new URLSearchParams()
  selectedItems.forEach((item) => checkoutParams.append('productId', item.listingId))

  function toggleItem(productId) {
    const currentIds = selectedItems.map((item) => item.listingId)
    setSelectedIds(
      currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId].slice(0, 20),
    )
  }

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

  const groups = new Map()
  items.forEach((item, index) => {
    const group = groups.get(item.sellerId) ?? []
    group.push({ item, productQuery: productQueries[index] })
    groups.set(item.sellerId, group)
  })

  return (
    <section className="cart-page" aria-labelledby="cart-title">
      <h1 id="cart-title">{t('cart.title')}</h1>

      {items.length === 0 ? (
        <EmptyState title={t('cart.emptyTitle')} description={t('cart.emptyDescription')} />
      ) : (
        <>
          <div className="cart-selection-controls">
            <Button
              type="button"
              variant="outline"
              disabled={availableItems.length === 0}
              onClick={() =>
                setSelectedIds(availableItems.slice(0, 20).map((item) => item.listingId))
              }
            >
              {t('cart.selectAll')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={selectedItems.length === 0}
              onClick={() => setSelectedIds([])}
            >
              {t('cart.clearSelection')}
            </Button>
            <p className="text-sm text-muted-foreground">{t('cart.selectionLimit')}</p>
          </div>

          {[...groups].map(([sellerId, rows]) => (
            <ul
              key={sellerId}
              aria-label={t('cart.sellerGroup')}
              className="divide-y divide-border overflow-hidden rounded-xl border border-border"
            >
              {rows.map(({ item, productQuery }) => {
                const selected = selectedItems.some(
                  (selectedItem) => selectedItem.listingId === item.listingId,
                )
                const available = availableItems.some(
                  (availableItem) => availableItem.listingId === item.listingId,
                )
                return (
                  <CartItemRow
                    key={item.listingId}
                    item={item}
                    productQuery={productQuery}
                    selected={selected}
                    canSelect={available && (selected || selectedItems.length < 20)}
                    onToggle={() => toggleItem(item.listingId)}
                    onRemoved={() =>
                      setSelectedIds((ids) => ids.filter((id) => id !== item.listingId))
                    }
                  />
                )
              })}
            </ul>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{t('cart.subtotal', { count: query.data.totalItems })}</p>
            <ProductPrice value={query.data.subtotal} className="font-semibold" />
          </div>

          <div className="cart-selection-panel">
            <div className="grid gap-1">
              <p role="status">{t('cart.selectedCount', { count: selectedItems.length })}</p>
              <ProductPrice value={selectedTotal} className="text-xl font-semibold" />
              <p className="text-sm text-muted-foreground">{t('checkout.priceHint')}</p>
            </div>
            {selectedItems.length > 0 ? (
              <Button asChild>
                <Link to={'/checkout?' + checkoutParams.toString()}>{t('cart.continue')}</Link>
              </Button>
            ) : (
              <Button disabled>{t('cart.continue')}</Button>
            )}
          </div>
        </>
      )}
    </section>
  )
}
```

## 4. src/features/checkout/schemas/checkoutSchema.js

Tạo file mới, giữ đúng tên và thư mục.

```js
import { z } from 'zod'

export const checkoutSchema = z.object({
  receiverName: z.string().trim().min(1, 'checkout.required').max(255, 'checkout.nameTooLong'),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^(\+84|0)\d{9,10}$/, 'checkout.phoneInvalid'),
  shippingAddress: z
    .string()
    .trim()
    .min(1, 'checkout.required')
    .max(500, 'checkout.addressTooLong'),
  method: z.enum(['COD', 'ONLINE_BANKING']),
  note: z.string().trim().max(500, 'checkout.noteTooLong'),
})
```

## 5. src/features/checkout/components/CheckoutForm.jsx

Theo yêu cầu của Chu, trợ lý đã sửa trực tiếp phần điền sẵn tên/số điện thoại. Field đã sửa, kể cả xóa trắng, không bị profile cập nhật ghi đè; địa chỉ và ghi chú nhập riêng.

```jsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { checkoutSchema } from '@/features/checkout/schemas/checkoutSchema'

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

export function CheckoutForm() {
  const { t } = useTranslation()
  const { profileQuery } = useSession()
  const fullName = profileQuery.data?.fullName ?? ''
  const phone = profileQuery.data?.phone ?? ''
  const editedFields = useRef(new Set())
  const {
    register,
    setValue,
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
    <form className="checkout-panel" noValidate onSubmit={(event) => event.preventDefault()}>
      <h2>{t('checkout.deliveryTitle')}</h2>

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

      <p id="checkout-notice" className="checkout-notice">
        {t('checkout.unavailable')}
      </p>
      {/* TODO(doc14:Q16,Q17): enable submission after the checkout contract is agreed. */}
      <Button type="submit" disabled aria-describedby="checkout-notice">
        {t('checkout.placeOrder')}
      </Button>
    </form>
  )
}
```

## 6. src/features/checkout/pages/CheckoutPage.jsx

Tạo file mới, giữ đúng tên và thư mục.

```jsx
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useCart } from '@/features/cart/hooks/useCart'
import { useCartProducts } from '@/features/cart/hooks/useCartProducts'
import { CheckoutForm } from '@/features/checkout/components/CheckoutForm'

export function CheckoutPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const query = useCart()
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
        <CheckoutForm />
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

## 7. Đăng ký route

Trong `src/app/router/routes.js`, tìm route `cart` bên trong nhóm `RequireAuth`. Thêm block này ngay sau block `cart`, trước block `my-products`:

```jsx
              {
                path: 'checkout',
                lazy: async () => ({
                  Component: (await import('@/features/checkout/pages/CheckoutPage')).CheckoutPage,
                }),
              },
```

## 8. Nội dung vi

Trong `src/i18n/locales/vi/common.json`, thay nguyên object `cart` bằng `cart` dưới đây và thêm object `checkout` ở cấp gốc. Giữ các object khác của file. Block dưới chỉ chứa hai object cần chép, không phải toàn bộ file JSON.

```json
{
  "cart": {
    "title": "Giỏ hàng",
    "add": "Thêm vào giỏ",
    "adding": "Đang thêm…",
    "added": "Đã thêm vào giỏ.",
    "addError": "Không thể thêm sản phẩm. Sản phẩm hoặc quyền truy cập có thể đã thay đổi.",
    "ownProduct": "Bạn không thể thêm sản phẩm của mình hoặc gian hàng mình làm việc vào giỏ.",
    "loading": "Đang tải giỏ hàng…",
    "loadError": "Chưa tải được giỏ hàng.",
    "emptyTitle": "Giỏ hàng đang trống",
    "emptyDescription": "Thêm sản phẩm từ trang chi tiết để xem tại đây.",
    "sellerGroup": "Các sản phẩm cùng người bán",
    "subtotal": "Tạm tính cho {{count}} sản phẩm",
    "unavailable": "Thông tin sản phẩm hiện không khả dụng.",
    "remove": "Xóa khỏi giỏ",
    "removing": "Đang xóa…",
    "removeError": "Không thể xóa sản phẩm khỏi giỏ. Vui lòng thử lại.",
    "selectItem": "Chọn sản phẩm: {{title}}",
    "selectAll": "Chọn tất cả (tối đa 20)",
    "clearSelection": "Bỏ chọn tất cả",
    "selectionLimit": "Mỗi lần đặt hàng chọn tối đa 20 sản phẩm.",
    "selectedCount": "Đã chọn {{count}} sản phẩm",
    "continue": "Tiếp tục đặt hàng"
  },
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
    "reviewCart": "Vui lòng kiểm tra lại sản phẩm trong giỏ hàng."
  }
}
```

## 9. Nội dung en

Trong `src/i18n/locales/en/common.json`, thay nguyên object `cart` bằng `cart` dưới đây và thêm object `checkout` ở cấp gốc. Giữ các object khác của file. Block dưới chỉ chứa hai object cần chép, không phải toàn bộ file JSON.

```json
{
  "cart": {
    "title": "Cart",
    "add": "Add to cart",
    "adding": "Adding…",
    "added": "Added to cart.",
    "addError": "Could not add this product. Its availability or your access may have changed.",
    "ownProduct": "You cannot add your own products or products from a store where you work.",
    "loading": "Loading cart…",
    "loadError": "Unable to load the cart.",
    "emptyTitle": "Your cart is empty",
    "emptyDescription": "Add products from their detail pages to see them here.",
    "sellerGroup": "Products from the same seller",
    "subtotal": "Subtotal for {{count}} products",
    "unavailable": "Product information is currently unavailable.",
    "remove": "Remove",
    "removing": "Removing…",
    "removeError": "Could not remove this product. Please try again.",
    "selectItem": "Select product: {{title}}",
    "selectAll": "Select all (up to 20)",
    "clearSelection": "Clear selection",
    "selectionLimit": "Select up to 20 products per checkout.",
    "selectedCount": "{{count}} products selected",
    "continue": "Continue to checkout"
  },
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
    "reviewCart": "Please review the products in your cart."
  }
}
```

## Đọc logic

- `selectedIds` là lựa chọn giao diện. `selectedItems` chỉ giữ các item còn trong giỏ và đã tải được product ACTIVE.
- Nút chọn tất cả chọn tối đa 20 item đủ điều kiện. Bỏ chọn vẫn hoạt động khi đã đủ 20.
- URL dùng các tham số `productId` lặp lại để tải lại trang không mất danh sách đã chọn. Tên, giá và thông tin người nhận không lấy từ URL.
- `CheckoutPage` kiểm tra số lượng ID, ID trùng và item còn trong giỏ. Nếu có item không hợp lệ thì yêu cầu chọn lại, không âm thầm đặt các item còn lại.
- Form dùng react-hook-form + Zod để kiểm tra trường khi chạm/rời ô. Submit bị chặn và nút đặt hàng chưa mở cho đến khi thống nhất Backend.
- Các giá hiển thị là tạm tính từ snapshot cart; khi nối API, Backend sẽ tính giá cuối cùng và kiểm tra lại quyền mua/trạng thái sản phẩm.

## Thử flow sau khi chép

Chu đã chép đủ code vào repo chính. Trợ lý sửa các lỗi gõ ở tên hook, queryFn, const [params], totalPrice, link chi tiết, import nhầm thư viện test, ô địa chỉ nhiều dòng và link quay lại giỏ. Format, lint, build và 251/251 test pass trên repo chính. Chưa xác minh giao diện thực tế hoặc gọi API tạo checkout.

1. Mở giỏ, chọn một vài món ACTIVE rồi bấm Tiếp tục đặt hàng.
2. Kiểm tra chỉ có món đã chọn trong phần tóm tắt; tải lại trang vẫn còn lựa chọn.
3. Nhập thông tin nhận hàng, thử số điện thoại sai và rời ô để xem lỗi.
4. Đổi COD/chuyển khoản. Nút Đặt hàng vẫn tắt và chưa gửi request tạo đơn.
5. Xóa item đã chọn từ giỏ ở tab khác rồi tải lại checkout: phải yêu cầu chọn lại.
6. Sản phẩm SOLD/không truy cập được không chọn được, nhưng vẫn xóa khỏi giỏ được.

Báo xong sau khi chép đủ để trợ lý chạy test và sửa lỗi gõ nếu có.


## Bổ sung điền sẵn thông tin tài khoản

Theo quyết định của Chu, dùng fullName và phone từ session để điền sẵn người nhận, vẫn cho sửa để nhận hộ. Không cập nhật profile từ form checkout. Trợ lý đã sửa trực tiếp theo yêu cầu của Chu. Năm test mới pass, bao gồm profile về muộn và nhập rồi xóa trắng. Format, lint, build và 256/256 test pass trên repo chính. Kết quả 251 test ở trên thuộc bước UI trước đó.

useRef giữ danh sách field đã được người dùng thay đổi, kể cả khi nhập rồi xóa trắng. useEffect theo dõi hai giá trị profile và dùng setValue để điền các field chưa chỉnh sửa. Không dùng effect để gọi API; useSession tiếp tục dùng TanStack Query hiện có.
