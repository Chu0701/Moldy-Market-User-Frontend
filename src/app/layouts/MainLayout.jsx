import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useNavigation } from 'react-router'

import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Logo } from '@/components/common/Logo'
import { cn } from '@/lib/utils'

const navigation = [
  { to: '/', label: 'navigation.home' },
  { to: '/products', label: 'navigation.products' },
  { to: '/login', label: 'navigation.login' },
]

export function MainLayout() {
  const { t } = useTranslation()
  const { state } = useNavigation()

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
            {navigation.map(({ to, label }) => (
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
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        aria-busy={state !== 'idle'}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 outline-none sm:px-8 sm:py-16"
      >
        <Outlet />
      </main>
      <footer className="border-t border-border px-4 py-6 text-center text-sm leading-6 text-muted-foreground">
        {t('app.tagline')}
      </footer>
    </div>
  )
}
