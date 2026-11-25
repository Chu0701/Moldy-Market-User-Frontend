import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Package, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router'

import { PaginationBar } from '@/components/common/PaginationBar'
import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import { ProductSkeleton } from '@/features/marketplace/components/ProductSkeleton'
import { useMyProducts } from '@/features/products/hooks/useMyProducts'
import { productKeys } from '@/features/products/hooks/useProductSearch'
import { cn } from '@/lib/utils'
import { changeProductStatus, deleteProduct } from '@/services/products/productService'

const conditionKeys = {
  NEW: 'products.conditions.new',
  LIKE_NEW: 'products.conditions.likeNew',
  USED: 'products.conditions.used',
  DAMAGED: 'products.conditions.damaged',
}

export function MyProductsPage({ store = false } = {}) {
  const { t, i18n } = useTranslation()
  const { pushToast } = useToast()
  const queryClient = useQueryClient()
  const { query, changePage, isStaff, staffQuery, forbidden } = useMyProducts({ store })
  const [statusTab, setStatusTab] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const result = query.data

  const visibilityMutation = useMutation({
    mutationFn: ({ productId, nextStatus }) =>
      changeProductStatus({ productId, status: nextStatus }),
    onSuccess: async (_, { productId, nextStatus }) => {
      pushToast(
        t(
          nextStatus === 'HIDDEN'
            ? 'products.visibility.hiddenToast'
            : 'products.visibility.shownToast',
        ),
        'success',
      )
      void queryClient.invalidateQueries({ queryKey: ['products', 'search'] })
      void queryClient.invalidateQueries({ queryKey: ['products', 'store-mine'] })
      void queryClient.invalidateQueries({ queryKey: ['products', 'mine'] })
      await queryClient.invalidateQueries({ queryKey: productKeys.detail(productId), exact: true })
    },
    onError: (error) => {
      let key = 'products.visibility.submitError'
      if (error?.code === 'PRODUCT_STATUS_LOCKED') key = 'products.visibility.locked'
      else if (error?.status === 403) key = 'feedback.forbiddenMessage'
      pushToast(t(key), 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ productId }) => deleteProduct({ productId }),
    onSuccess: async (_, { productId }) => {
      pushToast(t('products.delete.successToast'), 'success')
      void queryClient.invalidateQueries({ queryKey: ['products', 'search'] })
      void queryClient.invalidateQueries({ queryKey: ['products', 'store-mine'] })
      void queryClient.invalidateQueries({ queryKey: ['products', 'mine'] })
      await queryClient.invalidateQueries({ queryKey: productKeys.detail(productId), exact: true })
    },
    onError: (error) => {
      pushToast(
        t(error?.status === 403 ? 'feedback.forbiddenMessage' : 'products.delete.submitError'),
        'error',
      )
    },
  })

  if (isStaff && staffQuery.isPending) return <ProductSkeleton />
  if (isStaff && staffQuery.isError && ![403, 404].includes(staffQuery.error?.status))
    return (
      <ErrorState
        title={t('stores.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void staffQuery.refetch()}
        isRetrying={staffQuery.isFetching}
      />
    )
  if (forbidden || (isStaff && [403, 404].includes(query.error?.status))) return <ForbiddenState />

  if (store && query.error?.status === 404 && query.error.code === 'STORE_NOT_FOUND') {
    return <Navigate to="/open-store" replace />
  }

  const allItems = result?.items ?? []
  const activeCount = allItems.filter((item) => item.status !== 'HIDDEN').length
  const hiddenCount = allItems.filter((item) => item.status === 'HIDDEN').length
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredItems = allItems.filter((item) => {
    if (statusTab === 'ACTIVE' && item.status === 'HIDDEN') return false
    if (statusTab === 'HIDDEN' && item.status !== 'HIDDEN') return false
    if (!normalizedSearch) return true
    return item.title?.toLowerCase().includes(normalizedSearch)
  })

  const tabs = [
    { key: 'ALL', label: t('products.mine.tabs.all'), count: allItems.length },
    { key: 'ACTIVE', label: t('products.statuses.active'), count: activeCount },
    { key: 'HIDDEN', label: t('products.statuses.hidden'), count: hiddenCount },
  ]

  let content
  if (query.isPending) {
    content = <ProductSkeleton />
  } else if (query.isError) {
    content =
      query.error?.status === 403 ? (
        <ForbiddenState />
      ) : (
        <ErrorState
          title={t(store ? 'products.search.errorTitle' : 'products.mine.loadError')}
          description={t('feedback.checkBack')}
          onRetry={() => void query.refetch()}
          isRetrying={query.isFetching}
        />
      )
  } else if (allItems.length === 0) {
    content = (
      <p className="product-search-empty">
        {t(store ? 'stores.emptyProducts' : 'products.mine.empty')}
      </p>
    )
  } else {
    content = (
      <div className="grid gap-4">
        <div
          role="group"
          aria-label={t('table.status')}
          className="flex items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab) => {
            const active = statusTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusTab(tab.key)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-foreground font-semibold text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                <span>{tab.label}</span>
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums">
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t('products.mine.searchPlaceholder')}
            aria-label={t('products.mine.searchPlaceholder')}
            className="h-9.5 w-full rounded-lg border border-input bg-background pr-9 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground hover:border-foreground/35 focus-visible:border-foreground/75 focus-visible:ring-2 focus-visible:ring-ring"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label={t('actions.clear')}
              className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('products.mine.emptyFilterTitle')}
            description={t('products.mine.emptyFilterDescription')}
          />
        ) : (
          <div className="w-full min-w-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-border lg:bg-card">
            {/* Desktop table header — fixed columns + sole flexible Product column, zero horizontal scroll */}
            <div
              aria-hidden="true"
              className="hidden border-b border-border bg-surface-subtle/80 px-4 py-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase lg:grid lg:grid-cols-[minmax(0,1fr)_116px_104px_104px_108px] lg:items-center lg:gap-x-3"
            >
              <span className="pr-3 whitespace-nowrap">{t('storeOrders.columns.product')}</span>
              <span className="pr-2 text-right whitespace-nowrap">
                {t('products.compare.price')}
              </span>
              <span className="whitespace-nowrap">{t('products.compare.condition')}</span>
              <span className="whitespace-nowrap">{t('table.status')}</span>
              <span className="text-right whitespace-nowrap">{t('table.actions')}</span>
            </div>

            <ul
              className="space-y-3 lg:space-y-0"
              aria-label={t(store ? 'stores.productsTitle' : 'products.mine.title')}
            >
              {filteredItems.map((product) => {
                const isHidden = product.status === 'HIDDEN'
                const statusLabel = t(
                  isHidden ? 'products.statuses.hidden' : 'products.statuses.active',
                )
                const conditionLabel = t(
                  conditionKeys[product.condition] ?? 'products.conditions.unknown',
                )
                const editPath = `${store || product.storeId ? '/store/products' : '/my-products'}/${encodeURIComponent(product.id)}/edit`
                const createdLabel = product.createdAt
                  ? new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                      dateStyle: 'medium',
                    }).format(new Date(product.createdAt))
                  : ''
                const rowBusy =
                  (visibilityMutation.isPending &&
                    visibilityMutation.variables?.productId === product.id) ||
                  (deleteMutation.isPending && deleteMutation.variables?.productId === product.id)

                return (
                  <li key={product.id}>
                    <article
                      className={cn(
                        'rounded-xl border border-border bg-card transition-colors hover:bg-surface-subtle/60 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b',
                        isHidden && 'opacity-75 hover:opacity-100',
                      )}
                    >
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2.5 px-4 py-3 lg:min-h-[64px] lg:grid-cols-[minmax(0,1fr)_116px_104px_104px_108px] lg:items-center lg:gap-x-3 lg:gap-y-0 lg:py-2.5">
                        {/* Col 1: Product thumbnail + link (includes sr-only status for link contract) */}
                        <div className="order-1 col-span-2 flex min-w-0 items-center gap-3 pr-2 lg:col-span-1 lg:pr-3">
                          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/70">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.title}
                                loading="lazy"
                                className="size-full object-cover"
                              />
                            ) : (
                              <Package
                                aria-hidden="true"
                                className="size-4 text-muted-foreground/45"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/products/${product.id}`}
                              className="block truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
                            >
                              {product.title}
                              <span className="sr-only"> {statusLabel}</span>
                            </Link>
                            {createdLabel && (
                              <p className="mt-0.5 truncate text-[11px] text-muted-foreground tabular-nums">
                                {createdLabel}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Col 2: Price */}
                        <div className="order-2 flex items-center lg:justify-end lg:pr-2">
                          <ProductPrice
                            value={product.price}
                            className="text-sm font-bold whitespace-nowrap text-foreground tabular-nums"
                          />
                        </div>

                        {/* Col 3: Condition */}
                        <div className="order-3 hidden min-w-0 lg:block">
                          <span className="truncate text-xs text-muted-foreground">
                            {conditionLabel}
                          </span>
                        </div>

                        {/* Col 4: Status badge */}
                        <div className="order-3 flex items-center justify-end lg:order-4 lg:justify-start">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                              isHidden
                                ? 'border-border bg-muted/60 text-muted-foreground'
                                : 'border-emerald-200/80 bg-emerald-50/70 text-emerald-700',
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                'size-1.5 rounded-full',
                                isHidden ? 'bg-muted-foreground/60' : 'bg-emerald-500',
                              )}
                            />
                            <span>{statusLabel}</span>
                          </span>
                        </div>

                        {/* Col 5: Compact icon actions */}
                        <div className="order-4 col-span-2 flex items-center justify-end gap-1 border-t border-border/60 pt-2 lg:order-5 lg:col-span-1 lg:border-t-0 lg:pt-0">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Link
                              to={editPath}
                              aria-label={t('products.edit.title')}
                              title={t('products.edit.title')}
                            >
                              <Pencil aria-hidden="true" className="size-4" />
                            </Link>
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={rowBusy}
                            className="size-8 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label={t(
                              isHidden ? 'products.visibility.show' : 'products.visibility.hide',
                            )}
                            title={t(
                              isHidden ? 'products.visibility.show' : 'products.visibility.hide',
                            )}
                            onClick={() =>
                              visibilityMutation.mutate({
                                productId: product.id,
                                nextStatus: isHidden ? 'ACTIVE' : 'HIDDEN',
                              })
                            }
                          >
                            {isHidden ? (
                              <Eye aria-hidden="true" className="size-4" />
                            ) : (
                              <EyeOff aria-hidden="true" className="size-4" />
                            )}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={rowBusy}
                            className="size-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label={t('products.delete.action')}
                            title={t('products.delete.action')}
                            onClick={() => {
                              if (window.confirm(t('products.delete.confirm'))) {
                                deleteMutation.mutate({ productId: product.id })
                              }
                            }}
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="flex w-full min-w-0 flex-col gap-5 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t(store ? 'stores.productsTitle' : 'products.mine.title')}
          </h1>
          {query.isSuccess && typeof result?.totalElements === 'number' && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {t('table.rowsCount', { count: result.totalElements })}
            </p>
          )}
        </div>

        <Button asChild size="sm" className="h-9.5 gap-1.5">
          <Link to={store ? '/store/products/new' : '/my-products/new'}>
            <Plus aria-hidden="true" className="size-4" />
            <span>{t('products.mine.createAction')}</span>
          </Link>
        </Button>
      </div>

      {content}

      {query.isSuccess && (result.page > 1 || result.hasNext) && (
        <PaginationBar
          page={result.page}
          hasNext={result.hasNext}
          totalElements={result.totalElements}
          disabled={query.isFetching}
          onPageChange={changePage}
        />
      )}
    </section>
  )
}
