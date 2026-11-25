import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router'

import { cn } from '@/lib/utils'

const sections = [
  { to: '/appraiser/profile', label: 'appraiser.nav.profile' },
  { to: '/appraiser/queue', label: 'appraiser.nav.queue' },
  { to: '/appraiser/applications', label: 'appraiser.nav.applications' },
  { to: '/appraiser/invitations', label: 'appraiser.nav.invitations' },
  { to: '/appraiser/assignments', label: 'appraiser.nav.assignments' },
  { to: '/appraiser/commissions', label: 'appraiser.nav.commissions' },
]

/** @param {{ title: string, description: string, children: React.ReactNode }} props */
export function AppraiserPageShell({ title, description, children }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const isPreview = pathname.startsWith('/__preview/appraiser')
  const basePath = isPreview ? '/__preview/appraiser' : '/appraiser'

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {t('appraiser.workspaceLabel')}
        </p>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">{title}</h1>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          {isPreview && (
            <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {t('appraiser.previewBadge')}
            </span>
          )}
        </div>
      </header>
      {isPreview && (
        <nav
          aria-label={t('appraiser.nav.label')}
          className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
          <div className="flex min-w-max gap-6 border-b border-border">
            {sections.map(({ to, label }) => (
              <NavLink
                key={to}
                to={`${basePath}${to.replace('/appraiser', '')}`}
                end
                className={({ isActive }) =>
                  cn(
                    'border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
                    isActive && 'border-foreground text-foreground',
                  )
                }
              >
                {t(label)}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
      {children}
    </section>
  )
}
