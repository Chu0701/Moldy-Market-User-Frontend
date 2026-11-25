import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ChevronDown,
  Heart,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  User,
  Wallet,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useNavigation } from 'react-router'

import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Logo } from '@/components/common/Logo'
import { ProductPrice } from '@/components/common/ProductPrice'
import { HeaderSearchBar } from '@/components/navigation/HeaderSearchBar'
import { useDetailsDismiss } from '@/hooks/useDetailsDismiss'
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
import { HeaderNotificationBell } from '@/features/notifications/components/HeaderNotificationBell'
import { myWalletKey } from '@/features/wallet/walletKeys'

function getTrustTierKey(points) {
  if (points >= 50) return 'high'
  if (points >= 10) return 'trusted'
  return 'newMember'
}

export function MainLayout() {
  const { t } = useTranslation()
  const { state } = useNavigation()
  const { signOut, isSigningOut } = useLogout()
  const { hasAccessToken, profileQuery } = useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const closeProfileMenu = useCallback(() => {
    profileMenuRef.current?.removeAttribute('open')
    setProfileMenuOpen(false)
  }, [])
  useDetailsDismiss(profileMenuRef, profileMenuOpen, closeProfileMenu)

  // Passively observe cached wallet balance if already loaded in this session (zero extra requests).
  const cachedWalletQuery = useQuery({
    queryKey: myWalletKey(profileQuery.data?.id),
    queryFn: () => null,
    enabled: false,
  })
  const cachedAvailableBalance = cachedWalletQuery.data?.availableBalance

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 12)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
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
  const isSignedIn = hasAccessToken || isSigningOut
  const profile = profileQuery.data
  const storeMenuLinks = []
  let sellTarget = '/open-store'

  if (hasAccessToken && profileQuery.isSuccess && !isSigningOut) {
    const store = getStoreContext(profile, staffQuery.isError ? undefined : staffQuery.data)

    if (store.kind === 'owner') {
      storeMenuLinks.push({ to: '/store', label: 'stores.myStoreTitle', icon: Store })
      sellTarget = '/store/products/new'
    } else if (store.kind === 'staff') {
      if (store.storeId) {
        storeMenuLinks.push({ to: '/store', label: 'stores.workspaceTitle', icon: Store })
      }
      if (store.canCreateProduct) {
        sellTarget = '/store/products/new'
      }
    } else {
      storeMenuLinks.push({ to: '/open-store', label: 'stores.open.title', icon: Store })
    }

    if (store.kind !== 'staff' || store.canCreateProduct) {
      storeMenuLinks.push({
        to: '/store/products/new',
        label: 'products.create.pageTitle',
        icon: Plus,
      })
    }
  }

  const buyingMenuLinks = [
    { to: '/orders', label: 'orders.title', icon: Package },
    { to: '/wishlist', label: 'wishlist.title', icon: Heart },
  ]

  const sellingMenuLinks = [
    { to: '/my-products', label: 'products.mine.title', icon: Tag },
    ...storeMenuLinks,
  ]

  const financeMenuLinks = [
    { to: '/wallet', label: 'wallet.title', icon: Wallet, showBalance: true },
    { to: '/transactions', label: 'transactions.title', icon: ReceiptText },
    { to: '/disputes', label: 'disputes.title', icon: AlertTriangle },
  ]

  const userInitial = profile?.fullName?.trim().charAt(0).toUpperCase() || 'M'
  const trustTierKey =
    typeof profile?.trustPoints === 'number' ? getTrustTierKey(profile.trustPoints) : null
  const appraiserMenuLinks = profile
    ? [
        {
          to: '/appraiser',
          label: profile.roles?.includes('APPRAISER')
            ? 'appraiser.nav.entry'
            : 'appraiser.nav.become',
          icon: ShieldCheck,
        },
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

      <header
        className={cn(
          'sticky top-0 z-30 border-b border-border transition-[background-color,box-shadow] duration-200',
          isScrolled ? 'bg-background/95 shadow-xs backdrop-blur-sm' : 'bg-background',
        )}
      >
        <div
          className={cn(
            'mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 transition-[padding] duration-200 sm:px-8 md:flex-nowrap md:gap-5',
            isScrolled ? 'py-2' : 'py-3',
          )}
        >
          <Logo />

          <HeaderSearchBar />

          <nav
            aria-label={t('navigation.main')}
            className="order-2 flex shrink-0 items-center gap-1 sm:gap-1.5 md:order-3"
          >
            {isSignedIn ? (
              <>
                <NavLink
                  to="/chat"
                  title={t('chat.title')}
                  className={({ isActive }) =>
                    cn(
                      'relative inline-flex size-10 items-center justify-center rounded-full text-foreground/80 transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
                      isActive && 'bg-accent text-foreground',
                    )
                  }
                >
                  <MessageCircle aria-hidden="true" className="size-5" />
                  <span className="sr-only">{t('chat.title')}</span>
                  {unreadCount > 0 && (
                    <span className="pointer-events-none absolute -top-0.5 -right-0.5 [&>span]:ml-0 [&>span]:h-4.5 [&>span]:min-w-4.5 [&>span]:items-center [&>span]:px-1 [&>span]:text-[10px]">
                      <UnreadBadge count={unreadCount} />
                    </span>
                  )}
                </NavLink>

                <HeaderNotificationBell userId={profile?.id} />

                <NavLink
                  to="/cart"
                  aria-label={t('cart.title')}
                  title={t('cart.title')}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex size-10 items-center justify-center rounded-full text-foreground/80 transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
                      isActive && 'bg-accent text-foreground',
                    )
                  }
                >
                  <ShoppingBag aria-hidden="true" className="size-5" />
                </NavLink>

                <details
                  ref={profileMenuRef}
                  className="group relative"
                  onToggle={(event) => setProfileMenuOpen(event.currentTarget.open)}
                >
                  <summary
                    aria-label={t('profile.title')}
                    className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1 rounded-full border border-border bg-surface-subtle p-1 pr-2 transition-colors outline-none hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
                  >
                    {profile?.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt=""
                        className="size-7 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                      >
                        {userInitial}
                      </span>
                    )}
                    <ChevronDown
                      aria-hidden="true"
                      className="size-3.5 text-muted-foreground transition-transform duration-150 group-open:rotate-180 motion-reduce:transform-none"
                    />
                  </summary>

                  <div className="kn-popover-enter absolute right-0 z-40 mt-2 grid max-h-[80dvh] w-64 max-w-[calc(100vw-2rem)] gap-1 overflow-y-auto rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-lg">
                    {profile?.fullName && (
                      <div className="flex items-center gap-2.5 border-b border-border px-2.5 py-2">
                        {profile.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt=""
                            className="size-9 shrink-0 rounded-full border border-border object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                          >
                            {userInitial}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {profile.fullName}
                          </p>
                          {profile.email && (
                            <p className="truncate text-xs text-muted-foreground">
                              {profile.email}
                            </p>
                          )}
                          {trustTierKey && (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                              <ShieldCheck aria-hidden="true" className="size-3 text-success" />
                              <span>{t(`profile.trustTiers.${trustTierKey}`)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-0.5 py-1">
                      <NavLink
                        to="/profile"
                        end
                        onClick={closeProfileMenu}
                        className={({ isActive }) =>
                          cn(
                            'inline-flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                            isActive && 'bg-accent font-medium text-accent-foreground',
                          )
                        }
                      >
                        <User
                          aria-hidden="true"
                          className="size-4 shrink-0 text-muted-foreground"
                        />
                        <span>{t('profile.title')}</span>
                      </NavLink>
                    </div>

                    <div className="grid gap-0.5 border-t border-border py-1">
                      <p className="px-2.5 pt-1 pb-0.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        {t('profile.groups.buying')}
                      </p>
                      {buyingMenuLinks.map(({ to, label, icon: Icon }) => (
                        <NavLink
                          key={to}
                          to={to}
                          onClick={closeProfileMenu}
                          className={({ isActive }) =>
                            cn(
                              'inline-flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                              isActive && 'bg-accent font-medium text-accent-foreground',
                            )
                          }
                        >
                          <Icon
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted-foreground"
                          />
                          <span>{t(label)}</span>
                        </NavLink>
                      ))}
                    </div>

                    <div className="grid gap-0.5 border-t border-border py-1">
                      <p className="px-2.5 pt-1 pb-0.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        {t('profile.groups.selling')}
                      </p>
                      {sellingMenuLinks.map(({ to, label, icon: Icon }) => {
                        const isOpenStoreCta = to === '/open-store'
                        return (
                          <NavLink
                            key={to}
                            to={to}
                            end={to === '/store'}
                            onClick={closeProfileMenu}
                            className={({ isActive }) =>
                              cn(
                                'inline-flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                                isOpenStoreCta && 'font-semibold text-foreground',
                                isActive && 'bg-accent font-medium text-accent-foreground',
                              )
                            }
                          >
                            <Icon
                              aria-hidden="true"
                              className={cn(
                                'size-4 shrink-0',
                                isOpenStoreCta ? 'text-foreground' : 'text-muted-foreground',
                              )}
                            />
                            <span className="truncate">{t(label)}</span>
                          </NavLink>
                        )
                      })}
                    </div>

                    <div className="grid gap-0.5 border-t border-border py-1">
                      <p className="px-2.5 pt-1 pb-0.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        {t('profile.groups.finance')}
                      </p>
                      {financeMenuLinks.map(({ to, label, icon: Icon, showBalance }) => (
                        <NavLink
                          key={to}
                          to={to}
                          onClick={closeProfileMenu}
                          className={({ isActive }) =>
                            cn(
                              'inline-flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                              isActive && 'bg-accent font-medium text-accent-foreground',
                            )
                          }
                        >
                          <Icon
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted-foreground"
                          />
                          <span className="min-w-0 flex-1 truncate">{t(label)}</span>
                          {showBalance && cachedAvailableBalance != null && (
                            <ProductPrice
                              value={cachedAvailableBalance}
                              className="shrink-0 text-[11px] font-medium text-muted-foreground tabular-nums"
                            />
                          )}
                        </NavLink>
                      ))}
                    </div>

                    {appraiserMenuLinks.length > 0 && (
                      <div className="grid gap-0.5 border-t border-border py-1">
                        <p className="px-2.5 pt-1 pb-0.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                          {t('appraiser.workspaceLabel')}
                        </p>
                        {appraiserMenuLinks.map(({ to, label, icon: Icon }) => (
                          <NavLink
                            key={to}
                            to={to}
                            onClick={closeProfileMenu}
                            className={({ isActive }) =>
                              cn(
                                'inline-flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                                isActive && 'bg-accent font-medium text-accent-foreground',
                              )
                            }
                          >
                            <Icon
                              aria-hidden="true"
                              className="size-4 shrink-0 text-muted-foreground"
                            />
                            <span>{t(label)}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-border pt-1">
                      <button
                        type="button"
                        disabled={isSigningOut}
                        onClick={() => {
                          closeProfileMenu()
                          void signOut()
                        }}
                        className="inline-flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors outline-none hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                      >
                        <LogOut aria-hidden="true" className="size-4 shrink-0" />
                        <span>
                          {t(isSigningOut ? 'navigation.signingOut' : 'navigation.logout')}
                        </span>
                      </button>
                    </div>
                  </div>
                </details>

                <span aria-hidden="true" className="mx-0.5 hidden h-5 w-px bg-border sm:block" />

                <Button asChild size="sm" className="min-h-10 rounded-md px-3.5 font-semibold">
                  <Link to={sellTarget}>
                    <Plus aria-hidden="true" className="size-4" />
                    <span>{t('navigation.sellNow')}</span>
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-foreground/85 transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t('navigation.register')}
                </Link>
                <Link
                  to="/login"
                  className="inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-foreground/85 transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t('navigation.login')}
                </Link>
                <span aria-hidden="true" className="mx-0.5 hidden h-5 w-px bg-border sm:block" />
                <Button asChild size="sm" className="min-h-10 rounded-md px-3.5 font-semibold">
                  <Link to="/open-store">{t('navigation.sellNow')}</Link>
                </Button>
              </>
            )}

            <LanguageSwitcher />
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
