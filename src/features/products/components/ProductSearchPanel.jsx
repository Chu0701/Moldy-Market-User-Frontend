import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'

import { PaginationBar } from '@/components/common/PaginationBar'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { ProductGrid } from '@/features/marketplace/components/ProductGrid'
import { ProductSkeleton } from '@/features/marketplace/components/ProductSkeleton'
import { categoryKeys } from '@/features/marketplace/hooks/useCategories'
import { ProductCard } from '@/features/products/components/ProductCard'
import { ProductSearchForm } from '@/features/products/components/ProductSearchForm'
import { getProductMediaUrls } from '@/features/products/utils/productMedia'
import { useProductSearch } from '@/features/products/hooks/useProductSearch'
import { wishlistKeys } from '@/features/wishlist/wishlistKeys'
import { addToWishlist, removeFromWishlist } from '@/services/wishlist/wishlistService'

const conditionKeys = {
  NEW: 'products.conditions.new',
  LIKE_NEW: 'products.conditions.likeNew',
  USED: 'products.conditions.used',
  DAMAGED: 'products.conditions.damaged',
}

function buildCategoryMap(categories, map = new Map()) {
  if (!Array.isArray(categories)) return map
  for (const cat of categories) {
    map.set(cat.id, cat.name)
    if (cat.children) buildCategoryMap(cat.children, map)
  }
  return map
}

function formatCompactVnd(value, locale) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${value} ₫`
  }
}

/** @param {{ storeId?: string, categoryId?: string }} props */
export function ProductSearchPanel({ storeId, categoryId }) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  const [searchParams, setSearchParams] = useSearchParams()
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [localWishlistOverrides, setLocalWishlistOverrides] = useState({})
  const formRef = useRef(null)

  const { params, query, changePage } = useProductSearch({ storeId, categoryId })
  const products = query.data?.items ?? []

  // Passively read cached categories to render friendly category chip names without extra requests.
  const cachedCategoriesQuery = useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: () => [],
    enabled: false,
  })
  const categoryNameById = useMemo(
    () => buildCategoryMap(cachedCategoriesQuery.data),
    [cachedCategoriesQuery.data],
  )

  // Passively read already-cached wishlist items (zero mount requests on catalog browsing).
  const cachedWishlistIds = useMemo(() => {
    const ids = new Set()
    if (!userId) return ids
    const entries = queryClient.getQueriesData({ queryKey: ['wishlist', userId, 'list'] })
    for (const [, data] of entries) {
      for (const item of data?.items ?? []) {
        if (item?.productId) ids.add(item.productId)
      }
    }
    return ids
  }, [queryClient, userId])

  const wishlistMutation = useMutation({
    mutationFn: async ({ productId, currentlySaved }) => {
      if (currentlySaved) {
        await removeFromWishlist({ productId })
        return { productId, saved: false }
      }
      await addToWishlist({ productId })
      return { productId, saved: true }
    },
    retry: false,
    onSuccess: ({ productId, saved }) => {
      setLocalWishlistOverrides((prev) => ({ ...prev, [productId]: saved }))
      if (!userId) return
      queryClient.setQueryData(wishlistKeys.check(userId, productId), saved)
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all(userId) })
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.productCount(productId) })
    },
  })

  useEffect(() => {
    if (!showMobileFilters) return
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setShowMobileFilters(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showMobileFilters])

  let action = '/products'
  if (storeId) {
    action = `/stores/${encodeURIComponent(storeId)}`
  } else if (categoryId) {
    action = `/categories/${encodeURIComponent(categoryId)}`
  }

  const EmptyHeading = storeId || categoryId ? 'h3' : 'h2'
  const selectedCategoryIds = Array.isArray(params.categoryId) ? params.categoryId : []
  const selectedConditions = Array.isArray(params.condition) ? params.condition : []

  const hasFilter = Boolean(
    params.q ||
    selectedCategoryIds.length > 0 ||
    selectedConditions.length > 0 ||
    params.minPrice !== undefined ||
    params.maxPrice !== undefined,
  )
  const activeFilterCount =
    (params.q ? 1 : 0) +
    selectedCategoryIds.length +
    selectedConditions.length +
    (params.minPrice !== undefined || params.maxPrice !== undefined ? 1 : 0)

  const emptyStore = Boolean(storeId) && !hasFilter && params.page === 1 && products.length === 0
  const resultCount =
    typeof query.data?.totalElements === 'number' ? query.data.totalElements : products.length
  const showPagination =
    query.isSuccess && !emptyStore && (query.data.page > 1 || Boolean(query.data.hasNext))

  function readDraftSearchParams() {
    const next = new URLSearchParams()
    if (formRef.current) {
      const formData = new FormData(formRef.current)
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string' && value.trim() !== '') {
          next.append(key, value)
        }
      }
    } else {
      for (const [key, value] of searchParams.entries()) {
        next.append(key, value)
      }
    }
    next.set('page', '1')
    return next
  }

  function handleSortChange(nextSort) {
    const next = readDraftSearchParams()
    next.set('sort', nextSort)
    setSearchParams(next)
  }

  function handleApplyPricePreset(min, max) {
    const next = readDraftSearchParams()
    next.delete('minPrice')
    next.delete('maxPrice')
    if (min !== undefined) next.set('minPrice', String(min))
    if (max !== undefined) next.set('maxPrice', String(max))
    setSearchParams(next)
    setShowMobileFilters(false)
  }

  function removeFilterParam(key, valueToRemove) {
    const next = new URLSearchParams(searchParams)
    if (valueToRemove !== undefined) {
      const remaining = next.getAll(key).filter((val) => val !== valueToRemove)
      next.delete(key)
      remaining.forEach((val) => next.append(key, val))
    } else {
      next.delete(key)
    }
    next.set('page', '1')
    setSearchParams(next)
  }

  function handleToggleWishlist(productId) {
    if (!userId) {
      void navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }
    const currentlySaved =
      productId in localWishlistOverrides
        ? localWishlistOverrides[productId]
        : cachedWishlistIds.has(productId)
    wishlistMutation.mutate({ productId, currentlySaved })
  }

  const activeChips = []
  if (params.q) {
    activeChips.push({
      id: `q-${params.q}`,
      label: `${t('navigation.search')}: ${params.q}`,
      onRemove: () => removeFilterParam('q'),
    })
  }
  if (!categoryId) {
    selectedCategoryIds.forEach((catId) => {
      activeChips.push({
        id: `cat-${catId}`,
        label: `${t('products.filters.category')}: ${categoryNameById.get(catId) ?? catId.slice(0, 8)}`,
        onRemove: () => removeFilterParam('categoryId', catId),
      })
    })
  }
  selectedConditions.forEach((cond) => {
    activeChips.push({
      id: `cond-${cond}`,
      label: `${t('products.filters.condition')}: ${t(conditionKeys[cond] ?? 'products.conditions.unknown')}`,
      onRemove: () => removeFilterParam('condition', cond),
    })
  })
  if (params.minPrice !== undefined) {
    activeChips.push({
      id: 'minPrice',
      label: `${t('products.filters.minPrice')}: ${formatCompactVnd(params.minPrice, i18n.resolvedLanguage)}`,
      onRemove: () => removeFilterParam('minPrice'),
    })
  }
  if (params.maxPrice !== undefined) {
    activeChips.push({
      id: 'maxPrice',
      label: `${t('products.filters.maxPrice')}: ${formatCompactVnd(params.maxPrice, i18n.resolvedLanguage)}`,
      onRemove: () => removeFilterParam('maxPrice'),
    })
  }

  let content

  if (query.isPending) {
    content = <ProductSkeleton />
  } else if (query.isError) {
    content =
      query.error.status === 403 ? (
        <ForbiddenState />
      ) : (
        <ErrorState
          title={t('products.search.errorTitle')}
          description={t('products.search.errorMessage')}
          onRetry={() => query.refetch()}
          isRetrying={query.isFetching}
        />
      )
  } else if (products.length === 0) {
    content = (
      <div className="product-search-empty">
        <EmptyHeading>
          {t(emptyStore ? 'stores.emptyProducts' : 'products.search.emptyTitle')}
        </EmptyHeading>
        {!emptyStore && (
          <>
            <p>{t('products.search.emptyMessage')}</p>
            <Button asChild variant="outline">
              <Link to={action}>{t('products.search.clear')}</Link>
            </Button>
          </>
        )}
      </div>
    )
  } else {
    content = (
      <ProductGrid>
        {products.map((product) => {
          const isSaved =
            product.id in localWishlistOverrides
              ? localWishlistOverrides[product.id]
              : cachedWishlistIds.has(product.id)

          return (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              price={product.price}
              imageUrl={getProductMediaUrls(product)[0]}
              onImageError={() => query.refetch()}
              createdAt={product.createdAt}
              conditionLabel={t(conditionKeys[product.condition] ?? 'products.conditions.unknown')}
              isWishlisted={isSaved}
              wishlistPending={
                wishlistMutation.isPending && wishlistMutation.variables?.productId === product.id
              }
              onToggleWishlist={() => handleToggleWishlist(product.id)}
            />
          )
        })}
      </ProductGrid>
    )
  }

  const filterForm = (
    <ProductSearchForm
      formRef={formRef}
      params={params}
      action={action}
      showCategoryFilter={!categoryId}
      hasFilter={hasFilter}
      onApplyPricePreset={handleApplyPricePreset}
      onAfterSubmit={() => setShowMobileFilters(false)}
    />
  )

  return (
    <div className="product-discovery-layout">
      <aside className="product-discovery-sidebar">
        <div className="mb-3 flex items-center justify-between gap-2 lg:hidden">
          <Button
            type="button"
            variant="outline"
            aria-expanded={showMobileFilters}
            onClick={() => setShowMobileFilters(true)}
            className="min-h-10 gap-2"
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            <span>{t('products.filters.mobileButton')}</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {!showMobileFilters && <div className="hidden lg:block">{filterForm}</div>}

        {showMobileFilters && (
          <div
            className="fixed inset-0 z-50 flex items-end bg-foreground/40 backdrop-blur-[1px] lg:hidden"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setShowMobileFilters(false)
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t('products.filters.mobileDrawerTitle')}
              className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-border bg-background shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {t('products.filters.mobileDrawerTitle')}
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileFilters(false)}
                  aria-label={t('products.filters.hideButton')}
                  className="size-8 rounded-full"
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              </div>
              <div className="overflow-y-auto p-4">{filterForm}</div>
            </div>
          </div>
        )}
      </aside>

      <div className="product-discovery-content">
        <div className="mb-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-subtle/60 px-3.5 py-2.5">
            <p className="text-sm text-muted-foreground tabular-nums">
              {query.isSuccess
                ? t('products.filters.resultCount', { count: resultCount })
                : t('products.loading')}
            </p>

            <div className="flex items-center gap-2">
              <label htmlFor="product-sort" className="text-xs font-medium text-muted-foreground">
                {t('products.search.sortLabel')}
              </label>
              <select
                id="product-sort"
                name="sort"
                value={params.sort}
                onChange={(event) => handleSortChange(event.target.value)}
                className="min-h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="relevance">{t('products.search.relevance')}</option>
                <option value="newest">{t('products.search.newest')}</option>
                <option value="price_asc">{t('products.search.priceAsc')}</option>
                <option value="price_desc">{t('products.search.priceDesc')}</option>
              </select>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {activeChips.map((chip) => (
                <span
                  key={chip.id}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-subtle py-1 pr-1.5 pl-3 text-xs font-medium text-foreground"
                >
                  <span>{chip.label}</span>
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    aria-label={`${t('actions.cancel')}: ${chip.label}`}
                    className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X aria-hidden="true" className="size-3" />
                  </button>
                </span>
              ))}

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-foreground"
              >
                <Link to={action}>{t('products.filters.resetAll')}</Link>
              </Button>
            </div>
          )}
        </div>

        <div
          className="product-search-results"
          aria-busy={query.isFetching}
          data-stale={query.isPlaceholderData}
        >
          {content}
        </div>

        {showPagination && (
          <PaginationBar
            page={query.data.page}
            hasNext={query.data.hasNext}
            totalElements={query.data.totalElements}
            totalCapped={query.data.totalCapped}
            disabled={query.isFetching}
            onPageChange={changePage}
          />
        )}
      </div>
    </div>
  )
}
