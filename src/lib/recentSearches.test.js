import { beforeEach, describe, expect, test } from 'vitest'

import {
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
  saveRecentSearch,
} from '@/lib/recentSearches'

describe('recentSearches', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('saves deduplicated terms in reverse chronological order capped at 5', () => {
    saveRecentSearch('camera')
    saveRecentSearch('keyboard')
    saveRecentSearch('jacket')
    saveRecentSearch('book')
    saveRecentSearch('shoes')
    saveRecentSearch('Camera')

    expect(getRecentSearches()).toEqual(['Camera', 'shoes', 'book', 'jacket', 'keyboard'])
  })

  test('removes a single term and clears all terms', () => {
    saveRecentSearch('camera')
    saveRecentSearch('keyboard')

    expect(removeRecentSearch('CAMERA')).toEqual(['keyboard'])
    expect(clearRecentSearches()).toEqual([])
    expect(getRecentSearches()).toEqual([])
  })
})
