import { useTranslation } from 'react-i18next'

import { useCategories } from '@/features/marketplace/hooks/useCategories'

function flattenCategories(categories, parentName = '') {
  return categories.flatMap((category) => {
    const name = parentName ? `${parentName} / ${category.name}` : category.name

    return [{ id: category.id, name }, ...flattenCategories(category.children ?? [], name)]
  })
}

/** @param {{ selectedIds?: string[], hasError?: boolean }} props*/
export function ProductCategoryFilter({ selectedIds = [], hasError = false }) {
  const { t } = useTranslation()
  const query = useCategories()
  const options = flattenCategories(query.data ?? [])

  return (
    <fieldset className="product-filter-group">
      <legend>{t('products.filters.category')}</legend>

      {query.isPending && <p role="status">{t('categories.loading')}</p>}
      {query.isError && <p role="alert">{t('categories.errorTitle')}</p>}
      {query.isSuccess && options.length === 0 && <p>{t('categories.emptyTitle')}</p>}

      {(query.isPending || query.isError) &&
        selectedIds.map((id) => <input key={id} type="hidden" name="categoryId" value={id} />)}

      {query.isSuccess && (
        <div className="product-filter-options product-filter-categories">
          {options.map(({ id, name }) => (
            <label key={id}>
              <input
                type="checkbox"
                name="categoryId"
                value={id}
                defaultChecked={selectedIds.includes(id)}
              />
              {name}
            </label>
          ))}
        </div>
      )}

      {hasError && (
        <p className="product-filter-error" role="alert">
          {t('products.filters.categoryLimit')}
        </p>
      )}
    </fieldset>
  )
}
