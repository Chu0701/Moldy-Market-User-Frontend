import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ClipboardList,
  House,
  UserRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router'

import { Logo } from '@/components/common/Logo'
import { cn } from '@/lib/utils'

const navigation = [
  { to: '/appraiser', label: 'appraiser.nav.overview', icon: House, end: true },
  { to: '/appraiser/requests', label: 'appraiser.nav.requests', icon: ClipboardList },
  {
    to: '/appraiser/opportunities',
    label: 'appraiser.nav.opportunities',
    icon: BriefcaseBusiness,
  },
  { to: '/appraiser/assignments', label: 'appraiser.nav.assignments', icon: ClipboardList },
  { to: '/appraiser/profile', label: 'appraiser.nav.profile', icon: UserRound },
  { to: '/appraiser/performance', label: 'appraiser.nav.performance', icon: ChartNoAxesCombined },
]

export function AppraiserLayout() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <aside className="min-w-0">
        <div className="rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-28 lg:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
            <Logo />
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
              {t('appraiser.workspaceShortLabel')}
            </span>
          </div>
          <p className="px-2 pt-4 pb-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {t('appraiser.nav.label')}
          </p>
          <nav aria-label={t('appraiser.nav.label')}>
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:grid lg:overflow-visible">
              {navigation.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring lg:w-full',
                      isActive && 'bg-secondary text-secondary-foreground',
                    )
                  }
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span>{t(label)}</span>
                </NavLink>
              ))}
            </div>
          </nav>
          <p className="mt-4 hidden border-t border-border px-2 pt-4 text-xs leading-5 text-muted-foreground lg:block">
            {t('appraiser.layout.helper')}
          </p>
        </div>
      </aside>

      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
