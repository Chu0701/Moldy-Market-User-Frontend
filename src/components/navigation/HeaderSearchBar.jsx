import { useEffect, useRef, useState } from 'react'
import { Clock, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
  saveRecentSearch,
} from '@/lib/recentSearches'

export function HeaderSearchBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const containerRef = useRef(null)

  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState(() => getRecentSearches())
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return undefined

    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
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
    const search = trimmed ? `?q=${encodeURIComponent(trimmed)}&page=1` : ''
    void navigate(`/products${search}`)
  }

  function handleSubmit(event) {
    event.preventDefault()
    runSearch(query)
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

  const showDropdown = isOpen && recent.length > 0

  return (
    <div
      ref={containerRef}
      className="relative order-3 w-full sm:order-2 sm:max-w-md sm:flex-1 lg:max-w-lg"
    >
      <form role="search" onSubmit={handleSubmit} className="flex w-full items-center gap-1.5">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={100}
            aria-label={t('navigation.quickSearch')}
            placeholder={t('navigation.quickSearchPlaceholder')}
            className="min-h-11 w-full rounded-full border border-input bg-surface-subtle pr-4 pl-9 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-foreground/50 focus:bg-background focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          aria-label={t('navigation.quickSearchSubmit')}
          className="min-h-11 shrink-0 rounded-full px-4"
        >
          <Search aria-hidden="true" className="size-4 sm:hidden" />
          <span className="hidden sm:inline">{t('navigation.quickSearchSubmit')}</span>
        </Button>
      </form>

      {showDropdown && (
        <div className="absolute right-0 left-0 z-40 mt-1.5 overflow-hidden rounded-lg border border-border bg-card shadow-md">
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
            {recent.map((term) => (
              <li key={term} className="flex items-center gap-1 px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => runSearch(term)}
                  className="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-sm text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
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
