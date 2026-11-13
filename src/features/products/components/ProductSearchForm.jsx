import { useTranslation } from 'react-i18next'
import { Form } from 'react-router'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { ProductCategoryFilter } from './ProductCategoryFilter'

const conditionOptions = [
  ['NEW', 'products.conditions.new'],
  ['LIKE_NEW', 'products.conditions.likeNew'],
  ['USED', 'products.conditions.used'],
  ['DAMAGED', 'products.conditions.damaged'],
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
 *   showCategoryFilter?: boolean
 * }} props
 */

export function ProductSearchForm({ params, action = '/products', showCategoryFilter = true }) {
  const { t } = useTranslation()
  const [priceError, setPriceError] = useState(false)
  const [categoryError, setCategoryError] = useState(false)
  const selectedCategoryIds = Array.isArray(params.categoryId) ? params.categoryId : []

  function handleSubmit(event) {
    const values = new FormData(event.currentTarget)
    const minPrice = values.get('minPrice')
    const maxPrice = values.get('maxPrice')
    const invalidRange = minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)
    const tooManyCategories = values.getAll('categoryId').length > 20

    setPriceError(invalidRange)
    setCategoryError(tooManyCategories)

    if (invalidRange || tooManyCategories) event.preventDefault()
  }

  return (
    <Form
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
        <input
          id="product-search"
          name="q"
          type="search"
          maxLength={100}
          defaultValue={params.q ?? ''}
        />
      </div>

      <div>
        <label htmlFor="product-sort">{t('products.search.sortLabel')}</label>
        <select id="product-sort" name="sort" defaultValue={params.sort}>
          <option value="relevance">{t('products.search.relevance')}</option>
          <option value="newest">{t('products.search.newest')}</option>
          <option value="price_asc">{t('products.search.priceAsc')}</option>
          <option value="price_desc">{t('products.search.priceDesc')}</option>
        </select>
      </div>

      {showCategoryFilter && (
        <ProductCategoryFilter selectedIds={selectedCategoryIds} hasError={categoryError} />
      )}
      <fieldset className="product-filter-group">
        <legend>{t('products.filters.condition')}</legend>
        <div className="product-filter-options">
          {conditionOptions.map(([value, label]) => (
            <label key={value}>
              <input
                type="checkbox"
                name="condition"
                value={value}
                defaultChecked={params.condition?.includes(value)}
              />
              {t(label)}
            </label>
          ))}
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
              defaultValue={params.maxPrice ?? ''}
              aria-invalid={priceError}
              aria-describedby={priceError ? 'product-price-error' : undefined}
            />
          </div>
        </div>
        {priceError && (
          <p id="product-price-error" role="alert">
            {t('products.filters.invalidPriceRange')}
          </p>
        )}
      </fieldset>

      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="size" value={params.size} />

      <Button type="submit">{t('navigation.search')}</Button>
    </Form>
  )
}
