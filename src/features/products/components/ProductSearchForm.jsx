import { useTranslation } from 'react-i18next'
import { Form } from 'react-router'

import { Button } from '@/components/ui/button'

/**
 * @param {{
 *    params: {q? : string, page: number, size: number, sort: string}
 * }} props
 */

export function ProductSearchForm({ params }) {
  const { t } = useTranslation()

  return (
    <Form key={JSON.stringify(params)} method="get" action="/products">
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

      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="size" value={params.size} />

      <Button type="submit">{t('navigation.search')}</Button>
    </Form>
  )
}
