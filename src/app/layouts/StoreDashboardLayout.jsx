import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList,
  LayoutDashboard,
  Package,
  PlusCircle,
  Star,
  Store,
  TicketPercent,
  TrendingUp,
  Users,
} from 'lucide-react'
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
    navItems.push({
      to: '/store',
      label: 'stores.dashboard.overview',
      icon: LayoutDashboard,
      end: true,
    })
    if (staffContext.canReadOrders) {
      navItems.push({ to: '/store/orders', label: 'storeOrders.title', icon: ClipboardList })
    }
    if (staffContext.canManageProducts) {
      navItems.push({ to: '/store/products', label: 'stores.productsTitle', icon: Package })
    }
    if (staffContext.canCreateProduct) {
      navItems.push({
        to: '/store/products/new',
        label: 'products.create.pageTitle',
        icon: PlusCircle,
      })
    }
  } else if (!isStaff && (isOwnerRole || ownedStore)) {
    const isBlocked = ownedStore?.status === 'BLOCKED'
    heading = ownedStore?.name || t('stores.myStoreTitle')
    navItems.push({
      to: '/store',
      label: 'stores.dashboard.overview',
      icon: LayoutDashboard,
      end: true,
    })
    if (!isBlocked) {
      navItems.push({ to: '/store/orders', label: 'storeOrders.title', icon: ClipboardList })
    }
    navItems.push({ to: '/store/products', label: 'stores.productsTitle', icon: Package })
    if (!isBlocked) {
      navItems.push({
        to: '/store/products/new',
        label: 'products.create.pageTitle',
        icon: PlusCircle,
      })
      navItems.push({ to: '/store/vouchers', label: 'vouchers.title', icon: TicketPercent })
    }
    navItems.push({ to: '/store/revenue', label: 'analytics.seller.title', icon: TrendingUp })
    navItems.push({ to: '/store/reviews', label: 'reviews.storeDashboardTitle', icon: Star })
    if (canManageStaff && !isBlocked) {
      navItems.push({ to: '/store/staff', label: 'stores.staff.title', icon: Users })
    }
    navItems.push({ to: '/store/profile', label: 'stores.profile.title', icon: Store })
  }

  const showSidebar = navItems.length > 0
  const isStoreBlocked = ownedStore?.status === 'BLOCKED'

  return (
    <div
      className={cn(
        showSidebar && 'grid items-start gap-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-8',
      )}
    >
      {showSidebar && (
        <aside
          aria-label={t('stores.dashboard.navLabel')}
          className="grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs lg:sticky lg:top-24"
        >
          <div className="flex items-center gap-2.5 border-b border-border px-2 pt-1 pb-3">
            <span
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-subtle text-foreground"
              aria-hidden="true"
            >
              <Store className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {t('stores.dashboard.sectionTitle')}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    isStoreBlocked ? 'bg-destructive' : 'bg-success',
                  )}
                  aria-hidden="true"
                />
                <p className="truncate text-sm font-semibold text-foreground">{heading}</p>
              </div>
            </div>
          </div>

          <nav
            aria-label={t('stores.dashboard.navLabel')}
            className="flex gap-1 overflow-x-auto pb-0.5 lg:grid lg:gap-0.5 lg:overflow-visible lg:pb-0"
          >
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex min-h-9 shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )
                }
              >
                <Icon className="size-4 shrink-0 opacity-80" aria-hidden="true" />
                <span>{t(label)}</span>
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
