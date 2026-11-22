import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useNavigation } from 'react-router'

import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Logo } from '@/components/common/Logo'
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
  { to: '/', label: 'navigation.home' },
  { to: '/products', label: 'navigation.products' },
  { to: '/login', label: 'navigation.login' },
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

  if (hasAccessToken && profileQuery.isSuccess && !isSigningOut) {
    const store = getStoreContext(
      profileQuery.data,
      staffQuery.isError ? undefined : staffQuery.data,
    )

    if (store.kind === 'owner') {
      storeNavigation.push({ to: '/store', label: 'stores.myStoreTitle' })
    } else if (store.kind === 'staff') {
      if (store.storeId) {
        storeNavigation.push({ to: '/store', label: 'stores.workspaceTitle' })
      }
    } else {
      storeNavigation.push({ to: '/open-store', label: 'stores.open.title' })
    }

    if (store.kind !== 'staff' || store.canCreateProduct) {
      storeNavigation.push({ to: '/store/products/new', label: 'products.create.pageTitle' })
    }
  }

  const visibleNavigation = showLogout
    ? [
        ...navigation.filter(({ to }) => to !== '/login'),
        { to: '/profile', label: 'profile.title' },
        { to: '/cart', label: 'cart.title' },
        { to: '/orders', label: 'orders.title' },
        { to: '/chat', label: 'chat.title' },
        { to: '/notifications', label: 'notifications.title' },
        { to: '/my-products', label: 'products.mine.title' },
        ...storeNavigation,
      ]
    : navigation

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        {t('navigation.skipToContent')}
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <Logo />
          <LanguageSwitcher />
          <nav
            aria-label={t('navigation.main')}
            className="flex w-full flex-wrap gap-1 border-t border-border pt-3"
          >
            {visibleNavigation.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  cn(
                    'inline-flex min-h-11 items-center rounded-md px-4 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                    isActive && 'bg-accent font-semibold text-accent-foreground',
                  )
                }
              >
                {t(label)}
                {to === '/chat' && <UnreadBadge count={unreadCount} />}
              </NavLink>
            ))}

            {showLogout && (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 px-4"
                disabled={isSigningOut}
                onClick={signOut}
              >
                {t(isSigningOut ? 'navigation.signingOut' : 'navigation.logout')}
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        aria-busy={state !== 'idle'}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 outline-none sm:px-8 sm:py-16"
      >
        <ChatRealtimeContext value={chatRealtime}>
          <Outlet />
        </ChatRealtimeContext>
      </main>
      <footer className="border-t border-border px-4 py-6 text-center text-sm leading-6 text-muted-foreground">
        {t('app.tagline')}
      </footer>
    </div>
  )
}
