import { useState } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Form, Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ProductCategoryFilter } from './ProductCategoryFilter'

const conditionOptions = [
  ['NEW', 'products.conditions.new'],
  ['LIKE_NEW', 'products.conditions.likeNew'],
  ['USED', 'products.conditions.used'],
  ['DAMAGED', 'products.conditions.damaged'],
]

const pricePresets = [
  {
    key: 'under1m',
    labelKey: 'products.filters.pricePresets.under1m',
    min: undefined,
    max: 1000000,
  },
  { key: '1mTo5m', labelKey: 'products.filters.pricePresets.1mTo5m', min: 1000000, max: 5000000 },
  {
    key: '5mTo10m',
    labelKey: 'products.filters.pricePresets.5mTo10m',
    min: 5000000,
    max: 10000000,
  },
  {
    key: 'over10m',
    labelKey: 'products.filters.pricePresets.over10m',
    min: 10000000,
    max: undefined,
  },
]

/**
 * @param {{
 *   params: {
 *     q?: string,
 *     page: number,
 *     size: number,
 *     sort: string,
 *     condition?: string[],
 *     minPrice?: number,
 *     maxPrice?: number,
 *     categoryId?: string | string[],
 *   },
 *   action?: string,
 *   showCategoryFilter?: boolean,
 *   hasFilter?: boolean,
 *   formRef?: import('react').RefObject<HTMLFormElement | null>,
 *   onApplyPricePreset?: (min?: number, max?: number) => void,
 *   onAfterSubmit?: () => void,
 * }} props
 */
export function ProductSearchForm({
  params,
  action = '/products',
  showCategoryFilter = true,
  hasFilter = false,
  facets = null,
  formRef,
  onApplyPricePreset,
  onAfterSubmit,
}) {
  const { t } = useTranslation()
  const [priceError, setPriceError] = useState(false)
  const [categoryError, setCategoryError] = useState(false)
  const selectedCategoryIds = Array.isArray(params.categoryId) ? params.categoryId : []
  const conditionCounts = new Map(
    Array.isArray(facets?.conditions)
      ? facets.conditions.map((item) => [item.value, item.count])
      : [],
  )

  function handleSubmit(event) {
    const values = new FormData(event.currentTarget)
    const minPrice = values.get('minPrice')
    const maxPrice = values.get('maxPrice')
    const invalidRange = minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)
    const tooManyCategories = values.getAll('categoryId').length > 20

    setPriceError(invalidRange)
    setCategoryError(tooManyCategories)

    if (invalidRange || tooManyCategories) {
      event.preventDefault()
      return
    }

    onAfterSubmit?.()
  }

  return (
    <Form
      ref={formRef}
      key={JSON.stringify(params)}
      method="get"
      action={action}
      onSubmit={handleSubmit}
      onChange={() => {
        setPriceError(false)
        setCategoryError(false)
      }}
    >
      <div>
        <label htmlFor="product-search">{t('navigation.search')}</label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="product-search"
            name="q"
            type="search"
            maxLength={100}
            defaultValue={params.q ?? ''}
            placeholder={t('products.filters.searchPlaceholder')}
            className="pl-9"
          />
        </div>
      </div>

      {showCategoryFilter && (
        <ProductCategoryFilter
          selectedIds={selectedCategoryIds}
          hasError={categoryError}
          categoryFacets={facets?.categories}
        />
      )}

      <fieldset className="product-filter-group">
        <legend>{t('products.filters.condition')}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {conditionOptions.map(([value, label]) => {
            const count = conditionCounts.get(value)
            return (
              <label
                key={value}
                className="mb-0 inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium tracking-normal text-foreground normal-case transition-colors hover:border-foreground/40 has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
              >
                <input
                  type="checkbox"
                  name="condition"
                  value={value}
                  defaultChecked={params.condition?.includes(value)}
                  className="size-3.5 shrink-0 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="min-w-0 flex-1 truncate">{t(label)}</span>
                {count !== undefined && (
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-[10.5px] opacity-65 tabular-nums"
                  >
                    {count}
                  </span>
                )}
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="product-filter-group">
        <legend>{t('products.filters.price')}</legend>
        <div className="product-filter-price">
          <div>
            <label htmlFor="product-min-price">{t('products.filters.minPrice')}</label>
            <input
              id="product-min-price"
              name="minPrice"
              type="number"
              min="0"
              step="any"
              placeholder="0"
              defaultValue={params.minPrice ?? ''}
              aria-invalid={priceError}
              aria-describedby={priceError ? 'product-price-error' : undefined}
            />
          </div>

          <div>
            <label htmlFor="product-max-price">{t('products.filters.maxPrice')}</label>
            <input
              id="product-max-price"
              name="maxPrice"
              type="number"
              min="0"
              step="any"
              placeholder={t('products.filters.maxPricePlaceholder')}
              defaultValue={params.maxPrice ?? ''}
              aria-invalid={priceError}
              aria-describedby={priceError ? 'product-price-error' : undefined}
            />
          </div>
        </div>

        {onApplyPricePreset && (
          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            {pricePresets.map((preset) => {
              const active = params.minPrice === preset.min && params.maxPrice === preset.max
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => onApplyPricePreset(preset.min, preset.max)}
                  className={cn(
                    'rounded-md border px-2 py-1.5 text-center text-[11px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                  )}
                >
                  {t(preset.labelKey)}
                </button>
              )
            })}
          </div>
        )}

        {priceError && (
          <p id="product-price-error" role="alert" className="mt-2 text-xs text-destructive">
            {t('products.filters.invalidPriceRange')}
          </p>
        )}
      </fieldset>

      <input type="hidden" name="sort" value={params.sort} />
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="size" value={params.size} />

      <div className="sticky bottom-0 -mx-1 flex flex-col gap-2 border-t border-border bg-surface-subtle/95 px-1 pt-3 backdrop-blur-xs">
        <Button type="submit" className="min-h-10 w-full">
          {t('navigation.search')}
        </Button>

        {hasFilter && (
          <Button asChild variant="ghost" size="sm" className="min-h-9 w-full gap-1.5">
            <Link to={action} onClick={onAfterSubmit}>
              <RotateCcw aria-hidden="true" className="size-3.5" />
              <span>{t('products.filters.resetAll')}</span>
            </Link>
          </Button>
        )}
      </div>
    </Form>
  )
}
