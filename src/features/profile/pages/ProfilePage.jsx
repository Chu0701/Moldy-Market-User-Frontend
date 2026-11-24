import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  EyeOff,
  Heart,
  LogOut,
  MessageCircle,
  Package,
  Pencil,
  Phone,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { useSession } from '@/features/auth/hooks/useSession'
import { cartQueryKey } from '@/features/cart/hooks/useCart'
import { chatKeys } from '@/features/chat/hooks/useChat'
import { notificationKeys } from '@/features/notifications/hooks/useNotifications'
import { getStoreContext } from '@/features/stores/getStoreContext'
import { myWalletKey } from '@/features/wallet/walletKeys'
import { cn } from '@/lib/utils'

function maskPhone(phone) {
  if (!phone) return ''
  const trimmed = phone.trim()
  if (trimmed.length < 7) return trimmed
  return `${trimmed.slice(0, 4)} *** ${trimmed.slice(-3)}`
}

function formatMemberSince(value, language) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', {
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function getTrustTier(points) {
  if (points >= 50) return { key: 'high', level: 3 }
  if (points >= 10) return { key: 'trusted', level: 2 }
  return { key: 'newMember', level: 1 }
}

function ProfileSkeleton({ label }) {
  return (
    <section className="profile-overview" role="status">
      <span className="sr-only">{label}</span>
      <div className="skeleton-shimmer h-8 w-44 rounded-md" aria-hidden="true" />
      <div className="profile-overview-grid" aria-hidden="true">
        <div className="grid gap-4">
          <div className="kn-table-card grid gap-4 p-5">
            <div className="flex items-center gap-4">
              <div className="skeleton-shimmer size-16 shrink-0 rounded-full" />
              <div className="grid flex-1 gap-2">
                <div className="skeleton-shimmer h-5 w-36 rounded-sm" />
                <div className="skeleton-shimmer h-3.5 w-44 rounded-sm" />
              </div>
            </div>
            <div className="skeleton-shimmer h-10 w-full rounded-lg" />
          </div>
          <div className="kn-table-card grid gap-3 p-5">
            <div className="skeleton-shimmer h-4 w-28 rounded-sm" />
            <div className="skeleton-shimmer h-6 w-36 rounded-sm" />
          </div>
        </div>
        <div className="grid gap-5">
          {[0, 1, 2].map((group) => (
            <div key={group} className="kn-table-card grid gap-3 p-5">
              <div className="skeleton-shimmer h-4 w-24 rounded-sm" />
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="skeleton-shimmer h-16 rounded-xl" />
                <div className="skeleton-shimmer h-16 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ShortcutTile({ to, label, description, icon: Icon, badge, priceBadge, fullWidth }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        'group flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5 transition-[transform,border-color,background-color,box-shadow] duration-150 outline-none hover:-translate-y-0.5 hover:border-foreground/35 hover:bg-surface-subtle hover:shadow-xs focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none',
        fullWidth && 'sm:col-span-2',
      )}
    >
      <span
        aria-hidden="true"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-subtle text-foreground"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{label}</p>
          {badge > 0 && (
            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {priceBadge != null && (
        <ProductPrice
          value={priceBadge}
          className="shrink-0 text-xs font-semibold text-foreground tabular-nums"
        />
      )}
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground motion-reduce:transform-none"
      />
    </Link>
  )
}

function ShortcutGrid({ items }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {items.map((item, index) => (
        <ShortcutTile
          key={item.to}
          {...item}
          fullWidth={items.length % 2 === 1 && index === items.length - 1}
        />
      ))}
    </div>
  )
}

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { profileQuery } = useSession()
  const { signOut, isSigningOut } = useLogout()
  const { state } = useLocation()
  const [showPhone, setShowPhone] = useState(false)
  const userId = profileQuery.data?.id

  // Passively read already-cached counts/balances (zero extra HTTP requests).
  const cachedConversations = useQuery({
    queryKey: chatKeys.conversations(userId),
    queryFn: () => null,
    enabled: false,
  }).data
  const cachedNotifications = useQuery({
    queryKey: notificationKeys.inbox(userId),
    queryFn: () => null,
    enabled: false,
  }).data
  const cachedCart = useQuery({
    queryKey: cartQueryKey(userId),
    queryFn: () => null,
    enabled: false,
  }).data
  const cachedWallet = useQuery({
    queryKey: myWalletKey(userId),
    queryFn: () => null,
    enabled: false,
  }).data

  const unreadChatCount = Array.isArray(cachedConversations)
    ? cachedConversations.reduce(
        (sum, room) =>
          sum +
          (Number.isSafeInteger(room.unreadCount) && room.unreadCount > 0 ? room.unreadCount : 0),
        0,
      )
    : 0
  const unreadNotifCount = cachedNotifications?.pages
    ? cachedNotifications.pages
        .flatMap((page) => page.items)
        .filter((row) => row.userId === userId && !row.deleted && !row.read).length
    : 0
  const cartCount = Number.isSafeInteger(cachedCart?.totalItems) ? cachedCart.totalItems : 0
  const walletBalance = cachedWallet?.availableBalance ?? null

  if (profileQuery.isPending) {
    return <ProfileSkeleton label={t('profile.loading')} />
  }

  if (profileQuery.isError && !profileQuery.data) {
    return (
      <section className="profile-overview">
        <ErrorState
          title={t('profile.loadError')}
          description={t('feedback.checkBack')}
          onRetry={() => void profileQuery.refetch()}
          isRetrying={profileQuery.isFetching}
        />
      </section>
    )
  }

  const profile = profileQuery.data
  const canEdit = profile?.permissions?.includes('PROFILE_MANAGE')
  const storeContext = getStoreContext(profile)
  const hasStore = storeContext.kind === 'owner' || storeContext.kind === 'staff'
  const initial = profile?.fullName?.trim().charAt(0).toUpperCase() || 'M'
  const memberSince = formatMemberSince(profile?.createdAt, i18n.resolvedLanguage)
  const isVerified = profile?.status === 'ACTIVE'
  const trustPoints = typeof profile?.trustPoints === 'number' ? profile.trustPoints : null
  const trustTier = trustPoints !== null ? getTrustTier(trustPoints) : null

  const missingSteps = []
  if (profile) {
    if (!profile.avatarUrl) missingSteps.push(t('profile.completion.addAvatar'))
    if (!profile.phone) missingSteps.push(t('profile.completion.addPhone'))
  }
  const completedCount = 4 - missingSteps.length
  const completionPercent = Math.round((completedCount / 4) * 100)

  const storeShortcut =
    storeContext.kind === 'owner'
      ? {
          to: '/store',
          label: t('stores.myStoreTitle'),
          description: t('profile.shortcuts.storeManageDesc'),
          icon: Store,
        }
      : storeContext.kind === 'staff'
        ? {
            to: '/store',
            label: t('stores.workspaceTitle'),
            description: t('profile.shortcuts.storeManageDesc'),
            icon: Store,
          }
        : null

  const buyingLinks = [
    {
      to: '/orders',
      label: t('orders.title'),
      description: t('profile.shortcuts.ordersDesc'),
      icon: Package,
    },
    {
      to: '/cart',
      label: t('cart.title'),
      description: t('profile.shortcuts.cartDesc'),
      icon: ShoppingBag,
      badge: cartCount,
    },
    {
      to: '/wishlist',
      label: t('wishlist.title'),
      description: t('profile.shortcuts.wishlistDesc'),
      icon: Heart,
    },
  ]

  const sellingLinks = [
    ...(storeShortcut ? [storeShortcut] : []),
    ...(hasStore
      ? [
          {
            to: '/store/orders',
            label: t('storeOrders.title'),
            description: t('profile.shortcuts.storeOrdersDesc'),
            icon: ClipboardList,
          },
        ]
      : []),
    {
      to: '/my-products',
      label: t('products.mine.title'),
      description: t('profile.shortcuts.myProductsDesc'),
      icon: Tag,
    },
  ]

  const financeLinks = [
    {
      to: '/wallet',
      label: t('wallet.title'),
      description: t('profile.shortcuts.walletDesc'),
      icon: Wallet,
      priceBadge: walletBalance,
    },
    {
      to: '/transactions',
      label: t('transactions.title'),
      description: t('profile.shortcuts.transactionsDesc'),
      icon: ReceiptText,
    },
    {
      to: '/disputes',
      label: t('disputes.title'),
      description: t('profile.shortcuts.disputesDesc'),
      icon: AlertTriangle,
    },
  ]

  const accountLinks = [
    {
      to: '/chat',
      label: t('chat.title'),
      description: t('profile.shortcuts.chatDesc'),
      icon: MessageCircle,
      badge: unreadChatCount,
    },
    {
      to: '/notifications',
      label: t('notifications.title'),
      description: t('profile.shortcuts.notificationsDesc'),
      icon: Bell,
      badge: unreadNotifCount,
    },
    {
      to: '/account/settings',
      label: t('account.title'),
      description: t('profile.shortcuts.settingsDesc'),
      icon: Settings,
    },
  ]

  const avatarVisual = profile?.avatarUrl ? (
    <img
      src={profile.avatarUrl}
      alt={profile.fullName}
      className="size-16 rounded-full border border-border object-cover"
    />
  ) : (
    <span
      aria-hidden="true"
      className="inline-flex size-16 items-center justify-center rounded-full bg-primary font-sans text-xl font-semibold text-primary-foreground"
    >
      {initial}
    </span>
  )

  return (
    <section className="profile-overview" aria-labelledby="profile-title">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 id="profile-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('profile.title')}
        </h1>
      </header>

      {state?.profileSaved === true && <p role="status">{t('profile.edit.saved')}</p>}

      <div className="profile-overview-grid">
        <div className="grid gap-4 lg:sticky lg:top-24">
          {profile ? (
            <>
              <div className="kn-table-card grid gap-4 p-5">
                <div className="flex items-center gap-4">
                  {canEdit ? (
                    <Link
                      to="/profile/edit"
                      aria-label={t('profile.changeAvatar')}
                      title={t('profile.changeAvatar')}
                      className="group relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {avatarVisual}
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/55 text-background opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      >
                        <Camera className="size-5" />
                      </span>
                    </Link>
                  ) : (
                    <div className="shrink-0">{avatarVisual}</div>
                  )}

                  <dl className="min-w-0 flex-1 space-y-1">
                    <div>
                      <dt className="sr-only">{t('profile.fullName')}</dt>
                      <dd className="truncate text-base font-semibold text-foreground">
                        {profile.fullName}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <dt className="sr-only">{t('profile.email')}</dt>
                      <dd className="truncate text-xs text-muted-foreground">{profile.email}</dd>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                          <CheckCircle2 className="size-3" aria-hidden="true" />
                          <span>{t('profile.emailVerified')}</span>
                        </span>
                      )}
                      {memberSince && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                          <Calendar className="size-3" aria-hidden="true" />
                          <span>{t('profile.memberSince', { date: memberSince })}</span>
                        </span>
                      )}
                    </div>
                  </dl>
                </div>

                {profile.phone && (
                  <dl className="border-t border-border pt-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Phone className="size-3.5" aria-hidden="true" />
                        <span>{t('profile.edit.phone')}</span>
                      </dt>
                      <dd className="flex items-center gap-1.5 text-xs font-medium text-foreground tabular-nums">
                        <span>{showPhone ? profile.phone : maskPhone(profile.phone)}</span>
                        <button
                          type="button"
                          onClick={() => setShowPhone((value) => !value)}
                          aria-label={t(showPhone ? 'profile.hidePhone' : 'profile.showPhone')}
                          title={t(showPhone ? 'profile.hidePhone' : 'profile.showPhone')}
                          className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {showPhone ? (
                            <EyeOff className="size-3.5" aria-hidden="true" />
                          ) : (
                            <Eye className="size-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </dd>
                    </div>
                  </dl>
                )}

                {canEdit && (
                  <Button asChild variant="outline" size="sm" className="w-full gap-2">
                    <Link to="/profile/edit">
                      <Pencil aria-hidden="true" className="size-3.5" />
                      <span>{t('profile.edit.title')}</span>
                    </Link>
                  </Button>
                )}
              </div>

              {trustTier && (
                <div className="kn-table-card grid gap-3 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      {t('profile.trustPoints')}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-foreground">
                      <ShieldCheck aria-hidden="true" className="size-3.5 text-success" />
                      <span>{t(`profile.trustTiers.${trustTier.key}`)}</span>
                    </span>
                  </div>

                  <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                    {trustPoints}
                  </p>

                  <div className="grid gap-1.5">
                    <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
                      {[1, 2, 3].map((step) => (
                        <span
                          key={step}
                          className={cn(
                            'h-1.5 rounded-full',
                            step <= trustTier.level ? 'bg-foreground' : 'bg-muted',
                          )}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 text-[11px]">
                      <span
                        className={cn(
                          trustTier.level === 1
                            ? 'font-semibold text-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        {t('profile.trustTiers.newShort')}
                      </span>
                      <span
                        className={cn(
                          'text-center',
                          trustTier.level === 2
                            ? 'font-semibold text-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        {t('profile.trustTiers.trusted')}
                      </span>
                      <span
                        className={cn(
                          'text-right',
                          trustTier.level === 3
                            ? 'font-semibold text-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        {t('profile.trustTiers.high')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs leading-5 text-muted-foreground">
                    {t('profile.trustPointsHint')}
                  </p>
                </div>
              )}

              {canEdit && missingSteps.length > 0 && (
                <div className="kn-table-card grid gap-3 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {t('profile.completion.title', { percent: completionPercent })}
                    </span>
                    <Button asChild variant="outline" size="xs" className="h-7 px-2.5 text-xs">
                      <Link to="/profile/edit">{t('profile.completion.action')}</Link>
                    </Button>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{t('profile.completion.missingPrefix')}</span>
                    {missingSteps.map((step) => (
                      <Link
                        key={step}
                        to="/profile/edit"
                        className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
                      >
                        {step}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title={t('profile.emptyTitle')}
              description={t('profile.emptyDescription')}
            />
          )}
        </div>

        <div className="grid gap-6">
          <section className="grid gap-2.5" aria-labelledby="profile-group-buying">
            <h2
              id="profile-group-buying"
              className="px-1 font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              {t('profile.groups.buying')}
            </h2>
            <ShortcutGrid items={buyingLinks} />
          </section>

          <section className="grid gap-2.5" aria-labelledby="profile-group-selling">
            <h2
              id="profile-group-selling"
              className="px-1 font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              {t('profile.groups.selling')}
            </h2>

            {!hasStore && (
              <Link
                to="/open-store"
                aria-label={t('stores.open.title')}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-primary bg-primary px-5 py-4 text-primary-foreground shadow-xs transition-[transform,opacity] duration-150 outline-none hover:-translate-y-0.5 hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15"
                  >
                    <Store className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{t('stores.open.title')}</p>
                    <p className="mt-0.5 text-xs text-primary-foreground/80">
                      {t('profile.shortcuts.openStoreCtaDesc')}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
                />
              </Link>
            )}

            <ShortcutGrid items={sellingLinks} />
          </section>

          <section className="grid gap-2.5" aria-labelledby="profile-group-finance">
            <h2
              id="profile-group-finance"
              className="px-1 font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              {t('profile.groups.finance')}
            </h2>
            <ShortcutGrid items={financeLinks} />
          </section>

          <section className="grid gap-2.5" aria-labelledby="profile-group-account">
            <h2
              id="profile-group-account"
              className="px-1 font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              {t('profile.groups.account')}
            </h2>
            <ShortcutGrid items={accountLinks} />
          </section>

          <div className="border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSigningOut}
              onClick={() => void signOut()}
              className="gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut aria-hidden="true" className="size-4" />
              <span>{t(isSigningOut ? 'navigation.signingOut' : 'navigation.logout')}</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
