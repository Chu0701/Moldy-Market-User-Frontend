import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

import { clearCompareProducts } from '@/features/products/compareStorage'
import { clearRecentlyViewed } from '@/features/products/recentlyViewedStorage'

afterEach(() => {
  cleanup()
  clearRecentlyViewed()
  clearCompareProducts()
})
