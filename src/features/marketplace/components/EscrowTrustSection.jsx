import { Lock, PackageCheck, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { cn } from '@/lib/utils'

const TRUST_PILLARS = [
  {
    key: 'hold',
    icon: Lock,
    tint: 'bg-sky-50 text-sky-700 border-sky-200/70',
  },
  {
    key: 'inspect',
    icon: PackageCheck,
    tint: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  },
  {
    key: 'dispute',
    icon: ShieldCheck,
    tint: 'bg-amber-50 text-amber-700 border-amber-200/70',
  },
]

export function EscrowTrustSection() {
  const { t } = useTranslation()
  const { ref, isVisible } = useRevealOnScroll()

  return (
    <section
      ref={ref}
      aria-labelledby="escrow-trust-heading"
      className={cn(
        'border-t border-border py-10 transition-[opacity,transform] duration-400 ease-out motion-reduce:transform-none motion-reduce:transition-none sm:py-12',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
    >
      <div className="mb-6 max-w-2xl">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {t('homeTrust.eyebrow')}
        </p>
        <h2 id="escrow-trust-heading" className="mt-2 text-2xl font-semibold sm:text-3xl">
          {t('homeTrust.title')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('homeTrust.description')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {TRUST_PILLARS.map(({ key, icon: Icon, tint }, index) => (
          <div
            key={key}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  'inline-flex size-10 items-center justify-center rounded-xl border',
                  tint,
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="font-heading text-sm font-semibold text-muted-foreground/60 tabular-nums">
                0{index + 1}
              </span>
            </div>
            <div>
              <h3 className="font-sans text-base font-semibold text-foreground">
                {t(`homeTrust.items.${key}.title`)}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {t(`homeTrust.items.${key}.desc`)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
