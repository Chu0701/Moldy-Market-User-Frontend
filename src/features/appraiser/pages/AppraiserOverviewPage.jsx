import { ArrowRight, BriefcaseBusiness, ClipboardList, UserRound, WalletCards } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { AppraiserPageShell } from '@/features/appraiser/components/AppraiserPageShell'
import { AppraiserUnavailableState } from '@/features/appraiser/components/AppraiserUnavailableState'

const destinations = [
  { to: '/appraiser/requests', label: 'appraiser.overview.requests', icon: ClipboardList },
  {
    to: '/appraiser/opportunities',
    label: 'appraiser.overview.opportunities',
    icon: BriefcaseBusiness,
  },
  { to: '/appraiser/assignments', label: 'appraiser.overview.assignments', icon: WalletCards },
  { to: '/appraiser/profile', label: 'appraiser.overview.profile', icon: UserRound },
]

export function AppraiserOverviewPage() {
  const { t } = useTranslation()

  return (
    <AppraiserPageShell
      title={t('appraiser.overview.title')}
      description={t('appraiser.overview.description')}
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {t('appraiser.overview.eyebrow')}
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl leading-tight font-semibold sm:text-3xl">
            {t('appraiser.overview.welcome')}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t('appraiser.overview.intro')}
          </p>
        </section>

        <AppraiserUnavailableState
          title={t('appraiser.overview.dataTitle')}
          description={t('appraiser.overview.dataDescription')}
        />

        <section aria-labelledby="appraiser-shortcuts-title" className="space-y-3">
          <h2 id="appraiser-shortcuts-title" className="text-lg font-semibold">
            {t('appraiser.overview.shortcutsTitle')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {destinations.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex min-h-20 items-center gap-4 rounded-xl border border-border bg-card p-4 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold">{t(label)}</span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppraiserPageShell>
  )
}
