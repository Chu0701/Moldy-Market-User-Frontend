import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Clock, Loader2, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import {
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
  saveRecentSearch,
} from '@/lib/recentSearches'
import { cn } from '@/lib/utils'
import { suggestProducts } from '@/services/products/productService'

const MIN_SUGGEST_CHARS = 3
const SUGGEST_DEBOUNCE_MS = 250

export function HeaderSearchBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const containerRef = useRef(null)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [recent, setRecent] = useState(() => getRecentSearches())
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const trimmedQuery = query.trim()
  const isSuggestMode = trimmedQuery.length >= MIN_SUGGEST_CHARS

  useEffect(() => {
    if (!isOpen || trimmedQuery.length < MIN_SUGGEST_CHARS) {
      return undefined
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmedQuery)
    }, SUGGEST_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [isOpen, trimmedQuery])

  const effectiveSuggestQuery =
    isOpen && isSuggestMode && debouncedQuery === trimmedQuery ? debouncedQuery : ''

  const suggestQuery = useQuery({
    queryKey: ['products', 'suggest', effectiveSuggestQuery],
    queryFn: ({ signal }) =>
      typeof suggestProducts === 'function'
        ? suggestProducts({ q: effectiveSuggestQuery, signal })
        : Promise.resolve([]),
    enabled: effectiveSuggestQuery.length >= MIN_SUGGEST_CHARS,
    staleTime: 60_000,
    retry: false,
  })

  const suggestions = effectiveSuggestQuery ? (suggestQuery.data ?? []) : []
  const navigableItems = isSuggestMode ? suggestions : recent

  useEffect(() => {
    if (!isOpen) return undefined

    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function runSearch(rawTerm) {
    const trimmed = rawTerm.trim()
    if (trimmed) {
      setRecent(saveRecentSearch(trimmed))
    }
    setQuery(trimmed)
    setIsOpen(false)
    setActiveIndex(-1)
    const search = trimmed ? `?q=${encodeURIComponent(trimmed)}&page=1` : ''
    void navigate(`/products${search}`)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (activeIndex >= 0 && activeIndex < navigableItems.length) {
      runSearch(navigableItems[activeIndex])
      return
    }
    runSearch(query)
  }

  function handleInputKeyDown(event) {
    if (!isOpen || navigableItems.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % navigableItems.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => (prev <= 0 ? navigableItems.length - 1 : prev - 1))
    }
  }

  function handleRemoveTerm(term) {
    const next = removeRecentSearch(term)
    setRecent(next)
    if (next.length === 0) setIsOpen(false)
  }

  function handleClearAll() {
    setRecent(clearRecentSearches())
    setIsOpen(false)
  }

  const showRecentDropdown = isOpen && !isSuggestMode && recent.length > 0
  const showSuggestDropdown =
    isOpen &&
    isSuggestMode &&
    (suggestions.length > 0 || (suggestQuery.isFetching && Boolean(effectiveSuggestQuery)))

  return (
    <div ref={containerRef} className="relative order-3 w-full md:order-2 md:max-w-2xl md:flex-1">
      <form role="search" onSubmit={handleSubmit} className="relative w-full">
        <input
          type="search"
          value={query}
          onFocus={() => {
            setIsOpen(true)
            setActiveIndex(-1)
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
            setActiveIndex(-1)
          }}
          onKeyDown={handleInputKeyDown}
          maxLength={100}
          aria-label={t('navigation.quickSearch')}
          aria-autocomplete="list"
          aria-expanded={showRecentDropdown || showSuggestDropdown}
          placeholder={t('navigation.quickSearchPlaceholder')}
          className="min-h-11 w-full rounded-full border border-input bg-surface-subtle pr-11 pl-4 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-foreground/50 focus:bg-background focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
        />
        <button
          type="submit"
          aria-label={t('navigation.quickSearchSubmit')}
          className="absolute top-1/2 right-1.5 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search aria-hidden="true" className="size-4.5" />
        </button>
      </form>

      {showSuggestDropdown && (
        <div
          role="listbox"
          aria-label={t('navigation.searchSuggestions')}
          className="kn-popover-enter absolute right-0 left-0 z-40 mt-1.5 overflow-hidden rounded-lg border border-border bg-card shadow-md"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('navigation.searchSuggestions')}
            </span>
            {suggestQuery.isFetching && (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          {suggestions.length > 0 && (
            <ul className="divide-y divide-border/60">
              {suggestions.map((suggestion, index) => (
                <li key={suggestion} className="px-1.5 py-1">
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    onClick={() => runSearch(suggestion)}
                    className={cn(
                      'flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                      activeIndex === index && 'bg-accent',
                    )}
                  >
                    <Search
                      aria-hidden="true"
                      className="size-3.5 shrink-0 text-muted-foreground"
                    />
                    <span className="truncate">{suggestion}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showRecentDropdown && (
        <div className="kn-popover-enter absolute right-0 left-0 z-40 mt-1.5 overflow-hidden rounded-lg border border-border bg-card shadow-md">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('navigation.recentSearches')}
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-sm px-1.5 py-0.5 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t('navigation.clearRecentSearches')}
            </button>
          </div>
          <ul className="divide-y divide-border/60">
            {recent.map((term, index) => (
              <li key={term} className="flex items-center gap-1 px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => runSearch(term)}
                  className={cn(
                    'flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-sm text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                    activeIndex === index && 'bg-accent',
                  )}
                >
                  <Clock aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{term}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveTerm(term)}
                  aria-label={t('navigation.removeRecentSearch', { term })}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
