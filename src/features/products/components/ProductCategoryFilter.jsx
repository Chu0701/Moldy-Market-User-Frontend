import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useCategories } from '@/features/marketplace/hooks/useCategories'
import { cn } from '@/lib/utils'

function countNodes(categories) {
  return categories.reduce((sum, category) => sum + 1 + countNodes(category.children ?? []), 0)
}

function filterTree(categories, term) {
  if (!term) return categories
  const normalized = term.toLowerCase()
  const result = []

  for (const category of categories) {
    const selfMatch = category.name.toLowerCase().includes(normalized)
    const matchingChildren = filterTree(category.children ?? [], term)
    if (selfMatch || matchingChildren.length > 0) {
      result.push({
        ...category,
        children: selfMatch ? (category.children ?? []) : matchingChildren,
      })
    }
  }
  return result
}

function buildFacetCountMap(facets, map = new Map()) {
  if (!Array.isArray(facets)) return map
  for (const facet of facets) {
    if (facet?.id && typeof facet.count === 'number') {
      map.set(facet.id, facet.count)
    }
    if (Array.isArray(facet?.children)) {
      buildFacetCountMap(facet.children, map)
    }
  }
  return map
}

function CategoryTreeBranch({
  category,
  parentPath,
  selectedIds,
  collapsedIds,
  facetCounts,
  onToggleCollapse,
  depth = 0,
}) {
  const { t } = useTranslation()
  const children = category.children ?? []
  const hasChildren = children.length > 0
  const isCollapsed = collapsedIds.has(category.id)
  const fullPath = parentPath ? `${parentPath} / ${category.name}` : category.name
  const count = facetCounts.get(category.id)

  return (
    <div className="space-y-0.5">
      <div
        className={cn(
          'flex items-center gap-1 rounded-md pr-1 transition-colors hover:bg-background/80',
          depth > 0 && 'pl-5',
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleCollapse(category.id)}
            aria-expanded={!isCollapsed}
            aria-label={t(
              isCollapsed ? 'products.filters.expandCategory' : 'products.filters.collapseCategory',
              { name: category.name },
            )}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isCollapsed ? (
              <ChevronRight aria-hidden="true" className="size-3.5" />
            ) : (
              <ChevronDown aria-hidden="true" className="size-3.5" />
            )}
          </button>
        ) : (
          <span aria-hidden="true" className="size-6 shrink-0" />
        )}

        <label className="mb-0 flex min-h-8 min-w-0 flex-1 cursor-pointer items-center gap-2 py-1 text-sm font-normal tracking-normal text-foreground normal-case">
          <input
            type="checkbox"
            name="categoryId"
            value={category.id}
            aria-label={fullPath}
            defaultChecked={selectedIds.includes(category.id)}
            className="size-3.5 shrink-0 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="truncate">{category.name}</span>
          {count !== undefined && (
            <span
              aria-hidden="true"
              className="ml-auto shrink-0 text-[11px] text-muted-foreground tabular-nums"
            >
              {count}
            </span>
          )}
        </label>
      </div>

      {hasChildren && !isCollapsed && (
        <div className="space-y-0.5">
          {children.map((child) => (
            <CategoryTreeBranch
              key={child.id}
              category={child}
              parentPath={fullPath}
              selectedIds={selectedIds}
              collapsedIds={collapsedIds}
              facetCounts={facetCounts}
              onToggleCollapse={onToggleCollapse}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** @param {{ selectedIds?: string[], hasError?: boolean, categoryFacets?: Array<object> }} props */
export function ProductCategoryFilter({
  selectedIds = [],
  hasError = false,
  categoryFacets = null,
}) {
  const { t } = useTranslation()
  const query = useCategories()
  const [searchTerm, setSearchTerm] = useState('')
  const [collapsedIds, setCollapsedIds] = useState(() => new Set())

  const tree = useMemo(() => query.data ?? [], [query.data])
  const totalCount = useMemo(() => countNodes(tree), [tree])
  const filteredTree = useMemo(() => filterTree(tree, searchTerm.trim()), [tree, searchTerm])
  const facetCounts = useMemo(() => buildFacetCountMap(categoryFacets), [categoryFacets])

  function toggleCollapse(id) {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <fieldset className="product-filter-group">
      <legend>{t('products.filters.category')}</legend>

      {query.isPending && (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          {t('categories.loading')}
        </p>
      )}
      {query.isError && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {t('categories.errorTitle')}
        </p>
      )}
      {query.isSuccess && totalCount === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">{t('categories.emptyTitle')}</p>
      )}

      {(query.isPending || query.isError) &&
        selectedIds.map((id) => <input key={id} type="hidden" name="categoryId" value={id} />)}

      {query.isSuccess && totalCount > 0 && (
        <div className="mt-2 space-y-2">
          {totalCount > 6 && (
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('products.filters.categorySearchPlaceholder')}
                aria-label={t('products.filters.categorySearchPlaceholder')}
                className="h-8 w-full rounded-md border border-input bg-background pr-2.5 pl-8 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}

          <div className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
            {filteredTree.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">
                {t('products.filters.categoryNoMatch')}
              </p>
            ) : (
              filteredTree.map((category) => (
                <CategoryTreeBranch
                  key={category.id}
                  category={category}
                  parentPath=""
                  selectedIds={selectedIds}
                  collapsedIds={collapsedIds}
                  facetCounts={facetCounts}
                  onToggleCollapse={toggleCollapse}
                />
              ))
            )}
          </div>
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
