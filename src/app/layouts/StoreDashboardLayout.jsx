import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router'

import { useSession } from '@/features/auth/hooks/useSession'
import { getStoreContext } from '@/features/stores/getStoreContext'
import { useMyStaffProfile } from '@/features/stores/hooks/useMyStaffProfile'
import { myStoreQueryKey } from '@/features/stores/hooks/useMyStore'
import { cn } from '@/lib/utils'

export function StoreDashboardLayout() {
  const { t } = useTranslation()
  const { hasAccessToken, profileQuery } = useSession()
  const profile = profileQuery.data
  const baseContext = getStoreContext(profile)
  const isStaff = baseContext.kind === 'staff'
  const isOwnerRole = baseContext.kind === 'owner'

  const staffQuery = useMyStaffProfile(hasAccessToken && isStaff ? profile?.id : undefined)
  // Passively observe cached owner store loaded by store pages without issuing duplicate HTTP calls.
  const cachedStoreQuery = useQuery({
    queryKey: profile?.id ? myStoreQueryKey(profile.id) : ['stores', 'mine'],
    queryFn: () => null,
    enabled: false,
  })

  const staffContext = isStaff
    ? getStoreContext(profile, staffQuery.isError ? undefined : staffQuery.data)
    : null
  const ownedStore = !isStaff ? cachedStoreQuery.data : null
  const canManageStaff = Boolean(profile?.permissions?.includes('STORE_STAFF_MANAGE'))

  const navItems = []
  let heading = t('stores.myStoreTitle')

  if (isStaff && staffContext?.storeId) {
    heading = t('stores.workspaceTitle')
    navItems.push({ to: '/store', label: 'stores.dashboard.overview', end: true })
    if (staffContext.canReadOrders) {
      navItems.push({ to: '/store/orders', label: 'storeOrders.title' })
    }
    if (staffContext.canManageProducts) {
      navItems.push({ to: '/store/products', label: 'stores.productsTitle' })
    }
    if (staffContext.canCreateProduct) {
      navItems.push({ to: '/store/products/new', label: 'products.create.pageTitle' })
    }
  } else if (!isStaff && (isOwnerRole || ownedStore)) {
    const isBlocked = ownedStore?.status === 'BLOCKED'
    heading = ownedStore?.name || t('stores.myStoreTitle')
    navItems.push({ to: '/store', label: 'stores.dashboard.overview', end: true })
    if (!isBlocked) {
      navItems.push({ to: '/store/orders', label: 'storeOrders.title' })
    }
    navItems.push({ to: '/store/products', label: 'stores.productsTitle' })
    if (!isBlocked) {
      navItems.push({ to: '/store/products/new', label: 'products.create.pageTitle' })
      navItems.push({ to: '/store/vouchers', label: 'vouchers.title' })
    }
    navItems.push({ to: '/store/revenue', label: 'analytics.seller.title' })
    if (canManageStaff && !isBlocked) {
      navItems.push({ to: '/store/staff', label: 'stores.staff.title' })
    }
    navItems.push({ to: '/store/profile', label: 'stores.profile.title' })
  }

  const showSidebar = navItems.length > 0

  return (
    <div className={cn(showSidebar && 'grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]')}>
      {showSidebar && (
        <aside
          aria-label={t('stores.dashboard.navLabel')}
          className="grid gap-3 rounded-xl border border-border bg-card p-4 lg:sticky lg:top-6"
        >
          <div className="border-b border-border pb-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('stores.dashboard.sectionTitle')}
            </p>
            <p className="mt-1 truncate text-sm font-semibold">{heading}</p>
          </div>
          <nav aria-label={t('stores.dashboard.navLabel')} className="grid gap-1">
            {navItems.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex min-h-10 items-center rounded-md px-3 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                    isActive && 'bg-accent font-semibold text-accent-foreground',
                  )
                }
              >
                {t(label)}
              </NavLink>
            ))}
          </nav>
        </aside>
      )}
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
