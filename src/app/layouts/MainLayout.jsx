import {
  Bell,
  ChevronDown,
  Compass,
  Home,
  LogIn,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  User,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useNavigation } from 'react-router'

import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Logo } from '@/components/common/Logo'
import { HeaderSearchBar } from '@/components/navigation/HeaderSearchBar'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { useSession } from '@/features/auth/hooks/useSession'
import { getStoreContext } from '@/features/stores/getStoreContext'
import { useMyStaffProfile } from '@/features/stores/hooks/useMyStaffProfile'
import { useConversations } from '@/features/chat/hooks/useChat'
import { useChatRealtime } from '@/features/chat/hooks/useChatRealtime'
import { UnreadBadge } from '@/features/chat/components/UnreadBadge'
import { ChatRealtimeContext } from '@/features/chat/chatRealtimeContext'

const navigation = [
  { to: '/', label: 'navigation.home', icon: Home },
  { to: '/products', label: 'navigation.products', icon: Compass },
  { to: '/login', label: 'navigation.login', icon: LogIn },
]

export function MainLayout() {
  const { t } = useTranslation()
  const { state } = useNavigation()
  const { signOut, isSigningOut } = useLogout()
  const { hasAccessToken, profileQuery } = useSession()
  const inbox = useConversations({ poll: true, enabled: !isSigningOut })
  const chatRealtime = useChatRealtime(inbox.userId, inbox.query.isSuccess)
  const unreadCount =
    inbox.userId && inbox.query.isSuccess
      ? inbox.query.data.reduce(
          (total, room) =>
            total +
            (Number.isSafeInteger(room.unreadCount) && room.unreadCount > 0 ? room.unreadCount : 0),
          0,
        )
      : 0
  const staffQuery = useMyStaffProfile(
    hasAccessToken && getStoreContext(profileQuery.data).kind === 'staff'
      ? profileQuery.data?.id
      : undefined,
  )
  const showLogout = hasAccessToken || isSigningOut
  const storeNavigation = []
  const secondaryNavigation = []
  let canSellNow = false

  if (hasAccessToken && profileQuery.isSuccess && !isSigningOut) {
    const store = getStoreContext(
      profileQuery.data,
      staffQuery.isError ? undefined : staffQuery.data,
    )

    if (store.kind === 'owner') {
      storeNavigation.push({ to: '/store', label: 'stores.myStoreTitle', icon: Store })
    } else if (store.kind === 'staff') {
      if (store.storeId) {
        storeNavigation.push({ to: '/store', label: 'stores.workspaceTitle', icon: Store })
      }
    } else {
      storeNavigation.push({ to: '/open-store', label: 'stores.open.title', icon: Store })
    }

    if (store.kind !== 'staff' || store.canCreateProduct) {
      secondaryNavigation.push({ to: '/store/products/new', label: 'products.create.pageTitle' })
      canSellNow = true
    }
  }

  const visibleNavigation = showLogout
    ? [
        ...navigation.filter(({ to }) => to !== '/login'),
        { to: '/cart', label: 'cart.title', icon: ShoppingBag },
        { to: '/orders', label: 'orders.title', icon: Package },
        { to: '/chat', label: 'chat.title', icon: MessageCircle },
        { to: '/notifications', label: 'notifications.title', icon: Bell },
        { to: '/my-products', label: 'products.mine.title', icon: Tag },
        ...storeNavigation,
        { to: '/profile', label: 'profile.title', icon: User },
      ]
    : navigation

  const accountMenuLinks = showLogout
    ? [
        { to: '/wallet', label: 'wallet.title' },
        { to: '/wishlist', label: 'wishlist.title' },
        { to: '/disputes', label: 'disputes.title' },
        { to: '/transactions', label: 'transactions.title' },
        ...secondaryNavigation,
      ]
    : []

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        {t('navigation.skipToContent')}
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <Logo />

            <HeaderSearchBar />

            <div className="order-2 flex items-center gap-2 sm:order-3">
              {canSellNow && (
                <Button asChild className="min-h-11 rounded-full px-4">
                  <NavLink to="/store/products/new">
                    <Plus aria-hidden="true" className="size-4" />
                    <span>{t('navigation.sellNow')}</span>
                  </NavLink>
                </Button>
              )}
              <LanguageSwitcher />
            </div>
          </div>

          <nav
            aria-label={t('navigation.main')}
            className="flex flex-wrap items-center gap-1 border-t border-border/70 py-2"
          >
            {visibleNavigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  cn(
                    'inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-accent font-semibold text-accent-foreground'
                      : 'text-foreground/85',
                  )
                }
              >
                {Icon && (
                  <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span>{t(label)}</span>
                {to === '/chat' && <UnreadBadge count={unreadCount} />}
              </NavLink>
            ))}

            {accountMenuLinks.length > 0 && (
              <details className="relative">
                <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1 rounded-md px-3 text-sm text-foreground/85 transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
                  <span>{t('navigation.more')}</span>
                  <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground" />
                </summary>
                <div className="absolute right-0 z-20 mt-1.5 grid min-w-52 gap-1 rounded-lg border border-border bg-card p-1.5 shadow-md">
                  {accountMenuLinks.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end
                      className={({ isActive }) =>
                        cn(
                          'inline-flex min-h-10 items-center rounded-md px-3 text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                          isActive && 'bg-accent font-semibold text-accent-foreground',
                        )
                      }
                    >
                      {t(label)}
                    </NavLink>
                  ))}
                </div>
              </details>
            )}

            {showLogout && (
              <Button
                type="button"
                variant="ghost"
                className="ml-auto min-h-10 gap-1.5 px-3 text-muted-foreground hover:text-foreground"
                disabled={isSigningOut}
                onClick={signOut}
              >
                <LogOut aria-hidden="true" className="size-4" />
                <span>{t(isSigningOut ? 'navigation.signingOut' : 'navigation.logout')}</span>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        aria-busy={state !== 'idle'}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 outline-none sm:px-8 sm:py-12"
      >
        <ChatRealtimeContext value={chatRealtime}>
          <Outlet />
        </ChatRealtimeContext>
      </main>

      <footer className="border-t border-border bg-surface-subtle">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="space-y-1">
            <p className="font-heading text-base font-semibold text-foreground">{t('app.name')}</p>
            <p className="text-sm leading-6 text-muted-foreground">{t('app.tagline')}</p>
          </div>
          <p className="inline-flex items-center gap-2 text-xs leading-5 text-muted-foreground sm:text-sm">
            <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
            <span>{t('footer.escrowNote')}</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
