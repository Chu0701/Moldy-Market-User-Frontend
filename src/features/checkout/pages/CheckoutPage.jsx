import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ShieldCheck, TicketPercent } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useNavigation, useSearchParams } from 'react-router'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useCart } from '@/features/cart/hooks/useCart'
import { useCartProducts } from '@/features/cart/hooks/useCartProducts'
import { useCreateCheckout } from '@/features/checkout/hooks/useCheckout'
import { getProductMediaUrls } from '@/features/products/utils/productMedia'
import {
  estimateVoucherDiscount,
  getCheckoutErrorKey,
  isAmbiguousCheckoutError,
} from '@/features/checkout/checkoutPayment'
import { cn } from '@/lib/utils'
import { checkVoucher, getAvailableVouchers } from '@/services/vouchers/voucherService'

import { CheckoutForm } from '@/features/checkout/components/CheckoutForm'

export function CheckoutPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const query = useCart()
  const create = useCreateCheckout()
  const navigate = useNavigate()
  const navigation = useNavigation()
  const [voucherInput, setVoucherInput] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [voucherErrorKey, setVoucherErrorKey] = useState(null)
  const voucherCheck = useMutation({
    mutationFn: ({ code }) => checkVoucher({ code }),
  })
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
  const productsReady =
    selectedItems.length > 0 &&
    productQueries.every(
      (productQuery) => productQuery.isSuccess && productQuery.data?.status === 'ACTIVE',
    )
  const storeIds = useMemo(() => {
    if (!productsReady) return []
    return [...new Set(productQueries.map((q) => q.data?.storeId).filter(Boolean))]
  }, [productsReady, productQueries])

  const availableVouchersQuery = useQuery({
    queryKey: ['vouchers', 'available', storeIds],
    queryFn: ({ signal }) =>
      typeof getAvailableVouchers === 'function'
        ? getAvailableVouchers({ storeIds, signal })
        : Promise.resolve([]),
    enabled: productsReady,
    staleTime: 60_000,
    retry: false,
  })

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
    <Link
      to="/cart"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      <span>{t('checkout.backToCart')}</span>
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
  const previewItems = selectedItems.map((item, index) => ({
    price: Number(item.totalPrice),
    storeId: productQueries[index]?.data?.storeId ?? null,
  }))
  const voucherPreview = appliedVoucher
    ? estimateVoucherDiscount(appliedVoucher, previewItems)
    : null
  const estimatedDiscount = voucherPreview?.applicable ? voucherPreview.discount : 0
  const estimatedPayable = Math.max(0, estimate - estimatedDiscount)

  async function handleCheckVoucher(overrideCode) {
    const code = (typeof overrideCode === 'string' ? overrideCode : voucherInput).trim()
    if (!code) {
      setAppliedVoucher(null)
      setVoucherErrorKey('checkout.voucher.emptyCode')
      return
    }
    setVoucherErrorKey(null)
    try {
      const checked = await voucherCheck.mutateAsync({ code })
      const evaluation = estimateVoucherDiscount(checked, previewItems)
      if (!evaluation.applicable) {
        setAppliedVoucher(null)
        setVoucherErrorKey('checkout.voucherErrors.' + evaluation.reason)
        return
      }
      setAppliedVoucher(checked)
      setVoucherInput(checked.code)
    } catch (error) {
      setAppliedVoucher(null)
      setVoucherErrorKey(
        error?.code === 'VOUCHER_NOT_FOUND' || error?.status === 404
          ? 'checkout.voucherErrors.notFound'
          : 'checkout.voucherErrors.checkFailed',
      )
    }
  }

  const availableVouchers = (availableVouchersQuery.data ?? []).filter(
    (voucher) => estimateVoucherDiscount(voucher, previewItems).applicable,
  )

  return (
    <section className="checkout-page" aria-labelledby="checkout-title">
      <div className="grid gap-2">
        <div>{backLink}</div>
        <h1
          id="checkout-title"
          className="scroll-mt-24 text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {t('checkout.title')}
        </h1>
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
                ...(appliedVoucher?.code ? { voucherCode: appliedVoucher.code } : {}),
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
        <aside
          className="checkout-panel bg-surface-subtle lg:sticky lg:top-28"
          aria-labelledby="checkout-summary"
        >
          <h2 id="checkout-summary">{t('checkout.summaryTitle')}</h2>
          <ul className="grid gap-3">
            {selectedItems.map((item, index) => {
              const productData = productQueries[index].data
              return (
                <li key={item.listingId} className="flex items-center gap-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                    <ImageWithFallback
                      src={getProductMediaUrls(productData)[0]}
                      alt={productData.title}
                      compact
                      className="size-full"
                    />
                  </div>
                  <Link
                    to={'/products/' + encodeURIComponent(item.listingId)}
                    className="line-clamp-2 min-w-0 flex-1 text-sm font-medium break-words text-foreground underline-offset-4 hover:underline"
                  >
                    {productData.title}
                  </Link>
                  <ProductPrice
                    value={item.totalPrice}
                    className="shrink-0 text-sm font-semibold tabular-nums"
                  />
                </li>
              )
            })}
          </ul>

          <div className="grid gap-2 border-t border-border pt-4">
            <label htmlFor="checkout-voucher-code" className="text-sm font-medium">
              {t('checkout.voucher.label')}
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="checkout-voucher-code"
                type="text"
                value={voucherInput}
                onChange={(event) => {
                  setVoucherInput(event.target.value)
                  if (voucherErrorKey) setVoucherErrorKey(null)
                }}
                placeholder={t('checkout.voucher.placeholder')}
                disabled={create.isPending || voucherCheck.isPending}
                className="min-h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm uppercase"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCheckVoucher()}
                disabled={create.isPending || voucherCheck.isPending}
              >
                {t(voucherCheck.isPending ? 'checkout.voucher.checking' : 'checkout.voucher.apply')}
              </Button>
              {appliedVoucher && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setAppliedVoucher(null)
                    setVoucherInput('')
                    setVoucherErrorKey(null)
                  }}
                  disabled={create.isPending}
                >
                  {t('checkout.voucher.remove')}
                </Button>
              )}
            </div>
            {availableVouchers.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('checkout.voucher.availableLabel')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {availableVouchers.slice(0, 6).map((voucher) => {
                    const isSelected = appliedVoucher?.code === voucher.code
                    return (
                      <button
                        key={voucher.code}
                        type="button"
                        disabled={create.isPending || voucherCheck.isPending}
                        onClick={() => {
                          setVoucherInput(voucher.code)
                          void handleCheckVoucher(voucher.code)
                        }}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-foreground hover:border-foreground/40',
                        )}
                      >
                        <TicketPercent aria-hidden="true" className="size-3.5 shrink-0" />
                        <span className="font-mono">{voucher.code}</span>
                        <span className="opacity-75">
                          {voucher.discountType === 'PERCENT' ? (
                            `-${voucher.discountValue}%`
                          ) : (
                            <>
                              -<ProductPrice value={voucher.discountValue} />
                            </>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {voucherErrorKey && (
              <p role="alert" className="checkout-error text-sm">
                {t(voucherErrorKey)}
              </p>
            )}
            {appliedVoucher && voucherPreview?.applicable && (
              <p role="status" className="text-sm text-primary">
                {t('checkout.voucher.applied', { code: appliedVoucher.code })}
              </p>
            )}
          </div>

          <div className="grid gap-2 border-t border-border pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>{t('cart.selectedCount', { count: selectedItems.length })}</p>
              <ProductPrice value={estimate} />
            </div>
            {estimatedDiscount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-primary">
                <span>{t('checkout.voucher.discountLabel', { code: appliedVoucher.code })}</span>
                <span>
                  -<ProductPrice value={estimatedDiscount} />
                </span>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="font-medium">{t('checkout.estimatedTotal')}</p>
              <ProductPrice value={estimatedPayable} className="text-xl font-semibold" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t('checkout.priceHint')}</p>
          <p className="flex items-start gap-2 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
            <span>{t('products.detail.protectionDesc')}</span>
          </p>
        </aside>
      </div>
    </section>
  )
}
