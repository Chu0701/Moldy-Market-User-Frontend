import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Check, Copy, ShieldCheck, Star, TicketPercent } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import { StoreChatButton } from '@/features/chat/components/StoreChatButton'
import { CopyProductLinkButton } from '@/features/products/components/CopyProductLinkButton'
import { ProductSearchPanel } from '@/features/products/components/ProductSearchPanel'
import { StoreReviewsSection } from '@/features/reviews/components/StoreReviewsSection'
import { useStoreReviews } from '@/features/reviews/hooks/useReviews'
import { usePublicStore } from '@/features/stores/hooks/usePublicStore'
import { getAvailableVouchers } from '@/services/vouchers/voucherService'

export function StorePublicPage() {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const { storeId } = useParams()
  const query = usePublicStore(storeId)
  const [copiedCode, setCopiedCode] = useState(null)

  const resolvedStoreId = query.data?.id
  const reviewsQuery = useStoreReviews(resolvedStoreId)
  const vouchersQuery = useQuery({
    queryKey: ['vouchers', 'available', 'store', resolvedStoreId],
    queryFn: ({ signal }) =>
      typeof getAvailableVouchers === 'function'
        ? getAvailableVouchers({ storeIds: [resolvedStoreId], signal })
        : Promise.resolve([]),
    enabled: Boolean(resolvedStoreId),
    staleTime: 60_000,
    retry: false,
  })

  if (query.isPending) {
    return <p role="status">{t('stores.loading')}</p>
  }

  const status = query.error?.status
  const unavailable = status === 403 || status === 404

  if (query.isError && !unavailable) {
    return (
      <section className="store-public-page store-public-feedback">
        <h1>{t('stores.title')}</h1>
        <ErrorState
          title={t('stores.loadError')}
          description={t('feedback.checkBack')}
          onRetry={() => void query.refetch()}
          isRetrying={query.isFetching}
        />
      </section>
    )
  }

  const store = query.data

  if (unavailable || !store) {
    return (
      <section className="store-public-page store-public-feedback">
        <h1>{t('stores.unavailableTitle')}</h1>
        <Button asChild variant="outline">
          <Link to="/products">{t('stores.backToProducts')}</Link>
        </Button>
      </section>
    )
  }

  const description = store.description?.trim()
  const initial = store.name?.trim().charAt(0).toUpperCase() || 'M'
  const reviewSummary = reviewsQuery.data
  const reviewTotalCount = reviewSummary?.reviewCount ?? reviewSummary?.totalReviews ?? 0
  const storeVouchers = (vouchersQuery.data ?? []).filter(
    (voucher) => voucher.issuer === 'STORE' && voucher.storeId === store.id,
  )

  async function copyVoucherCode(code) {
    try {
      await navigator.clipboard?.writeText(code)
      setCopiedCode(code)
      pushToast(t('stores.voucherCopied', { code }), 'success')
      window.setTimeout(() => setCopiedCode((current) => (current === code ? null : current)), 2000)
    } catch {
      // Ignore clipboard failures in restricted environments.
    }
  }

  return (
    <section className="store-public-page space-y-8">
      <div className="store-public-header rounded-2xl border border-border bg-surface-subtle p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden="true"
              className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-2xl font-semibold text-primary-foreground"
            >
              {initial}
            </span>
            <div className="min-w-0 space-y-2">
              <h1 className="scroll-mt-24 text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                {store.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {reviewTotalCount > 0 && (
                  <a
                    href="#store-reviews"
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 font-medium text-foreground transition-colors hover:border-foreground/40"
                  >
                    <Star aria-hidden="true" className="size-3.5 fill-warning text-warning" />
                    <span className="tabular-nums">
                      {Number(reviewSummary.averageRating ?? 0).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({t('stores.dashboard.reviewCount', { count: reviewTotalCount })})
                    </span>
                  </a>
                )}
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 font-medium">
                  <ShieldCheck aria-hidden="true" className="size-3.5 text-success" />
                  <span>{t('products.escrowBadge')}</span>
                </span>
              </div>

              {description && (
                <p className="max-w-2xl text-sm leading-6 break-words whitespace-pre-wrap text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <CopyProductLinkButton
              shareLabelKey="stores.shareStore"
              copiedLabelKey="stores.shareCopied"
            />
            <StoreChatButton key={store.id} storeId={store.id} storeQuery={query} />
          </div>
        </div>

        {storeVouchers.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <TicketPercent aria-hidden="true" className="size-4 text-foreground" />
              <span>{t('stores.vouchersHeading')}</span>
            </span>
            {storeVouchers.slice(0, 5).map((voucher) => {
              const isCopied = copiedCode === voucher.code
              return (
                <button
                  key={voucher.code}
                  type="button"
                  onClick={() => void copyVoucherCode(voucher.code)}
                  title={t('stores.copyVoucher')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-mono font-semibold">{voucher.code}</span>
                  <span className="text-muted-foreground">
                    {voucher.discountType === 'PERCENT' ? (
                      `-${voucher.discountValue}%`
                    ) : (
                      <>
                        -<ProductPrice value={voucher.discountValue} />
                      </>
                    )}
                  </span>
                  {isCopied ? (
                    <Check aria-hidden="true" className="size-3 text-success" />
                  ) : (
                    <Copy aria-hidden="true" className="size-3 text-muted-foreground" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <section className="store-public-products">
        <h2>{t('stores.productsTitle')}</h2>
        <ProductSearchPanel storeId={store.id} />
      </section>
      <div id="store-reviews" className="scroll-mt-24">
        <StoreReviewsSection storeId={store.id} />
      </div>
    </section>
  )
}
